/* hero-scene.js — Scroll-driven Three.js transit scene.

   The hero is pinned (animations.js) and `state.scroll` (0 → 1) is the only clock for the
   fleet: buses, vans and trucks travel left → right along wavy, intersecting routes, slow
   into stops where passengers board and alight, and trucks unload crates at depots. Every
   vehicle, passenger and crate position is a pure function of scroll progress, so scrolling
   back plays the whole journey in reverse. Grid scanline, particles and pulses run on wall
   time so the scene breathes while idle. `state.intro` (0 → 1) runs the camera sweep and
   route draw-on once on load; `state.px/py` is the pointer for parallax + grid spotlight.  */

(function () {
  'use strict';

  const canvas         = document.getElementById('hero-canvas');
  const heroSection    = document.getElementById('hero');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lite           = window.innerWidth < 768;

  function supportsWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
  }

  if (!supportsWebGL() || prefersReduced || typeof THREE === 'undefined') {
    heroSection.classList.add('hero-fallback');
    return;
  }

  const state = { intro: 0, scroll: 0, px: 0, py: 0 };
  window.heroScene = {
    state,
    setIntro(p)      { state.intro  = p; },
    setScroll(p)     { state.scroll = Math.min(Math.max(p, 0), 1); },
    setPointer(x, y) { state.px = x; state.py = y; },
  };

  /* ── helpers ── */
  const clamp01     = v => Math.min(Math.max(v, 0), 1);
  const smooth      = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
  const easeOutExpo = p => p >= 1 ? 1 : 1 - Math.pow(2, -10 * p);
  const easeOutBack = p => { const c = 1.70158; p = clamp01(p); return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
  const lerp        = THREE.MathUtils.lerp;
  const dummy       = new THREE.Object3D();
  const side        = new THREE.Vector3();
  const up          = new THREE.Vector3(0, 1, 0);

  /* ── Renderer / scene / camera ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !lite, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(lite ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0f1e, 0.009);

  const camera    = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);
  const CAM_START = { y: 58, z: 110, fov: 72 };
  const CAM_END   = lite ? { y: 42, z: 58, fov: 64 } : { y: 30, z: 46, fov: 64 };
  const VEH_SCALE = lite ? 2.4 : 2.0;                 // stylised: vehicles read clearly from this height
  const LOOK_Z    = lite ? 6 : 0;                     // portrait: aim lower so the routes fill the screen
  camera.position.set(0, CAM_START.y, CAM_START.z);

  scene.add(new THREE.AmbientLight(0x2a3a5c, 2.4));
  scene.add(new THREE.HemisphereLight(0x8fd8ff, 0x0a0f1e, 1.2));
  const dirLight = new THREE.DirectionalLight(0xdff6ff, 1.4);
  dirLight.position.set(40, 80, 30);
  scene.add(dirLight);

  /* ====================================================
     GRID — radial reveal, scanline, cursor spotlight
     ==================================================== */
  const gridMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime:   { value: 0 },
      uReveal: { value: 0 },
      uMouse:  { value: new THREE.Vector2(-10, -10) },
      uColor:  { value: new THREE.Color(0x00d4ff) },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: `
      uniform float uTime; uniform float uReveal; uniform vec2 uMouse; uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        vec2 coord = vUv * 22.0;
        vec2 g     = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
        float line = 1.0 - min(min(g.x, g.y), 1.0);
        float scan  = mod(uTime * 0.11, 1.0);
        float pulse = smoothstep(0.03, 0.0, abs(vUv.y - scan));
        float ex = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
        float ey = smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
        float dist = length((vUv - 0.5) * vec2(1.3, 1.0));
        float rev  = smoothstep(uReveal * 1.15, uReveal * 1.15 - 0.14, dist);
        float spot = smoothstep(0.16, 0.0, distance(vUv * vec2(1.3, 1.0), uMouse * vec2(1.3, 1.0))) * 0.7;
        gl_FragColor = vec4(uColor, line * (0.4 + spot + pulse * 0.9) * ex * ey * rev);
      }
    `,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, extensions: { derivatives: true },
  });
  const gridMesh = new THREE.Mesh(new THREE.PlaneGeometry(300, 220, 1, 1), gridMat);
  gridMesh.rotation.x = -Math.PI / 2.6;
  gridMesh.position.y = -10;
  scene.add(gridMesh);

  /* ====================================================
     ROUTES — wavy left → right, sharing two interchanges (A, B)
     ==================================================== */
  const A = [-30, -6];
  const B = [ 35, 10];
  const Y = -2;
  const Z_SCALE = 0.55;   // flatten the map's depth so near and far vehicles stay a similar size
  const X_SCALE = 0.46;   // keep the whole run inside the camera's view

  const routeConfigs = [
    { id: 'R1', kind: 'bus',   color: 0x00d4ff, opacity: 0.75, delay: 0.00,
      points: [[-125, -12], [-88, -28], [-56, -2], A, [0, -26], B, [72, -6], [125, -18]],
      stops: [0.15, 0.38, 0.6, 0.74], chargers: [0.86],
      vehicles: [{ start: 0.00, end: 0.78 }, { start: 0.24, end: 1.00 }] },
    { id: 'R2', kind: 'van',   color: 0x18bc9c, opacity: 0.6,  delay: 0.10,
      points: [[-125, 22], [-78, 4], A, [6, 18], [46, 28], [86, 12], [125, 24]],
      stops: [0.22, 0.48, 0.7], chargers: [0.85],
      vehicles: [{ start: 0.06, end: 0.86 }, { start: 0.42, end: 1.00 }] },
    { id: 'R3', kind: 'bus',   color: 0x00d4ff, opacity: 0.38, delay: 0.20,
      points: [[-125, -38], [-72, -14], [-24, -34], B, [78, 30], [125, 16]],
      stops: [0.28, 0.66], chargers: [0.85],
      vehicles: [{ start: 0.12, end: 0.95 }] },
    { id: 'R4', kind: 'truck', color: 0xf59e0b, opacity: 0.5,  delay: 0.28,
      points: [[-125, 30], [-62, 18], [-12, 30], B, [72, 30], [125, 26]],
      stops: [0.14, 0.82], chargers: [],         // depots: trucks unload and charge here
      vehicles: [{ start: 0.02, end: 0.9 }, { start: 0.5, end: 1.00 }] },
    { id: 'R5', kind: null,    color: 0x00d4ff, opacity: 0.14, delay: 0.36,
      points: [[-125, -50], [-62, -36], [0, -52], [62, -32], [125, -46]],
      stops: [], chargers: [], vehicles: [] },
  ];
  if (lite) { routeConfigs[0].vehicles.pop(); routeConfigs[1].vehicles.pop(); routeConfigs[3].vehicles.pop(); }

  const DWELL_T = 0.014;   // half-width (in route t) of the dwell window at each stop
  const CHARGE_DWELL = 2;  // charging stops (chargers, truck depots) dwell this many times longer

  const routes = routeConfigs.map(cfg => {
    const curve = new THREE.CatmullRomCurve3(cfg.points.map(([x, z]) => new THREE.Vector3(x * X_SCALE, Y, z * Z_SCALE)), false, 'catmullrom', 0.5);
    const geom  = new THREE.TubeGeometry(curve, 160, 0.1, 6, false);
    const mesh  = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: cfg.opacity }));
    geom.setDrawRange(0, 0);
    scene.add(mesh);

    /* Speed profile: nearly stationary inside each dwell window. Integrate it to build a
       lookup from uniform "scroll time" u (0..1) → route position t, so vehicles pause at stops. */
    const dwellPoints = [
      ...cfg.stops.map(t => ({ t, charge: cfg.kind === 'truck' })),   // truck depots also charge
      ...cfg.chargers.map(t => ({ t, charge: true, chargerOnly: true })),
    ].sort((a, b) => a.t - b.t);

    /* Integrate *scroll cost* per unit of route: 1 on the open road, up to ~16× inside a
       dwell window, so a vehicle spends a long stretch of scrolling nearly stationary there. */
    const N = 600, cost = new Float32Array(N + 1), cum = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      let nearest = 1;
      dwellPoints.forEach(s => { nearest = Math.min(nearest, Math.abs(t - s.t) / (s.charge ? CHARGE_DWELL : 1)); });
      cost[i] = 1 / (0.06 + 0.94 * smooth(nearest / (DWELL_T * 2.2)));
      cum[i]  = i ? cum[i - 1] + (cost[i] + cost[i - 1]) / 2 : 0;
    }
    const total = cum[N];
    const uToT  = u => {                        // binary search the cumulative table
      const target = clamp01(u) * total;
      let lo = 0, hi = N;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < target) lo = mid + 1; else hi = mid; }
      const i = Math.max(lo, 1);
      const f = (target - cum[i - 1]) / Math.max(cum[i] - cum[i - 1], 1e-6);
      return ((i - 1) + f) / N;
    };
    const tToU = t => cum[Math.round(clamp01(t) * N)] / total;

    /* Each stop's dwell window in scroll-progress terms, per vehicle */
    const stops = dwellPoints.map(d => ({
      t: d.t, charge: d.charge, chargerOnly: d.chargerOnly,
      pos: curve.getPoint(d.t), tangent: curve.getTangent(d.t),
      uIn: tToU(d.t - DWELL_T * (d.charge ? CHARGE_DWELL : 1)), uOut: tToU(d.t + DWELL_T * (d.charge ? CHARGE_DWELL : 1)),
    }));

    return { cfg, curve, mesh, indexCount: geom.index.count, uToT, stops };
  });

  /* ====================================================
     STOPS, DEPOTS, INTERCHANGES
     ==================================================== */
  const popGroups = [];   // scale in during the intro

  function markerBase(position, color, introAt) {
    const g = new THREE.Group();
    g.position.copy(position);
    g.scale.setScalar(0);
    g.userData.introAt = introAt;
    scene.add(g);
    popGroups.push(g);
    return g;
  }

  function addPulseRing(g, color, inner, outer, speed, delay, maxScale, alpha) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(inner, outer, 32),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: alpha, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.userData.pulse = { speed, delay, maxScale, alpha };
    g.add(ring);
  }

  function createBusStop(stop, color, introAt) {
    const g = markerBase(stop.pos, color, introAt);
    g.position.y = -1.2;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.6, 8),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.3, metalness: 0.8, roughness: 0.3 }));
    pole.position.y = 0.4;
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2 }));
    sphere.position.y = 1.35;
    g.add(pole, sphere);
    addPulseRing(g, color, 0.25, 0.42, 1.1, Math.random(), 2.4, 0.5);
    return g;
  }

  function createDepot(stop, introAt) {
    const g = markerBase(stop.pos, 0x39ff14, introAt);
    g.position.y = -1.9;
    const pad = new THREE.Mesh(new THREE.PlaneGeometry(6, 4),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
    pad.rotation.x = -Math.PI / 2;
    const edge = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 32),
      new THREE.MeshBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.75, side: THREE.DoubleSide }));
    edge.rotation.x = -Math.PI / 2;
    g.add(pad, edge);
    for (let k = 0; k < 3; k++) addPulseRing(g, 0x00d4ff, 0.35, 0.55, 0.72, k * 0.33, 4.8, 0.6);
    /* depot charger pylon on the far side of the pad (trucks charge while they unload) */
    if (stop.tangent) {
      side.crossVectors(stop.tangent, up).normalize();
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.0, 0.5), pylonMat);
      pylon.position.copy(side).multiplyScalar(-2.4); pylon.position.y = 1.7;
      const cap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.7), new THREE.MeshBasicMaterial({ color: 0x39ff14 }));
      cap.position.copy(pylon.position); cap.position.y = 2.75;
      g.add(pylon, cap);
      g.userData.plugTop = pylon.position.clone().setY(2.8);
    }
    const light = new THREE.PointLight(0x39ff14, 2.2, 12);
    light.userData.chargeLight = true;
    g.add(light);
    return g;
  }

  function createInterchange([x, z], introAt) {
    const g = markerBase(new THREE.Vector3(x * X_SCALE, Y - 0.05, z * Z_SCALE), 0xf0f6ff, introAt);
    const hub = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.2, 40),
      new THREE.MeshBasicMaterial({ color: 0xf0f6ff, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    hub.rotation.x = -Math.PI / 2;
    const core = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24),
      new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.9 }));
    core.rotation.x = -Math.PI / 2;
    g.add(hub, core);
    addPulseRing(g, 0xf0f6ff, 1.0, 1.15, 0.5, 0.0, 2.6, 0.5);
    addPulseRing(g, 0xf0f6ff, 1.0, 1.15, 0.5, 0.5, 2.6, 0.5);
    g.add(new THREE.PointLight(0xffffff, 1.4, 10));
    return g;
  }

  /* Charging bay: pad + pylon on the kerb side; the cable and gauge are per docking event */
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0x39ff14, emissive: 0x39ff14, emissiveIntensity: 0.5, roughness: 0.4, metalness: 0.3 });
  function createCharger(stop, introAt) {
    const g = markerBase(stop.pos, 0x39ff14, introAt);
    g.position.y = Y;
    side.crossVectors(stop.tangent, up).normalize();
    const pad = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.5, 36),
      new THREE.MeshBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
    pad.rotation.x = -Math.PI / 2;
    pad.position.y = 0.06;
    const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.0, 0.5), pylonMat);
    pylon.position.copy(side).multiplyScalar(2.6);
    pylon.position.y = 1.0;
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.18, 0.7),
      new THREE.MeshBasicMaterial({ color: 0x39ff14 }));
    cap.position.copy(pylon.position); cap.position.y = 2.05;
    const light = new THREE.PointLight(0x39ff14, 1.2, 10);
    light.position.copy(pylon.position); light.position.y = 2.4;
    light.userData.chargeLight = true;
    g.add(pad, pylon, cap, light);
    addPulseRing(g, 0x39ff14, 1.2, 1.35, 0.6, 0.0, 2.2, 0.45);
    g.userData.plugTop = pylon.position.clone().setY(2.1);   // local: where the cable leaves the pylon
    return g;
  }

  routes.forEach(r => {
    r.stops.forEach(s => {
      const introAt = 0.28 + r.cfg.delay + s.t * 0.45;
      if (s.chargerOnly)             s.marker = createCharger(s, introAt);
      else if (r.cfg.kind === 'truck') s.marker = createDepot(s, introAt);
      else                             s.marker = createBusStop(s, r.cfg.color, introAt);
    });
  });
  createInterchange(A, 0.5);
  createInterchange(B, 0.65);

  /* ====================================================
     VEHICLES — built along +z (lookAt points +z at the tangent)
     ==================================================== */
  /* Bodies carry a little self-illumination so they read against the dark grid */
  const metal = (color, rough = 0.45) => new THREE.MeshStandardMaterial({
    color, roughness: rough, metalness: 0.25,
    emissive: new THREE.Color(color), emissiveIntensity: 0.35,
  });
  const glass = new THREE.MeshStandardMaterial({ color: 0xaaffee, emissive: 0x55ffdd, emissiveIntensity: 1.5 });
  const lamp  = new THREE.MeshBasicMaterial({ color: 0xfff3cc });

  function finishVehicle(g, color, length) {
    const glow = new THREE.PointLight(color, 2.4, 14);
    glow.position.y = -0.6;
    const hl = x => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.06), lamp); m.position.set(x, 0.05, length / 2 + 0.02); return m; };
    g.add(glow, hl(0.5), hl(-0.5));
    g.scale.setScalar(0);
    return g;
  }

  function makeBus(color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.1, 3.6), metal(color));
    const win  = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.42, 2.4), glass);
    win.position.y = 0.16;
    const shield = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.66, 0.1), metal(0x001122, 0.2));
    shield.position.set(0, 0.1, 1.78);
    g.add(body, win, shield);
    return finishVehicle(g, color, 3.6);
  }

  function makeVan(color) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 2.3), metal(color));
    const win  = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.32, 0.7), glass);
    win.position.set(0, 0.2, 0.75);
    g.add(body, win);
    return finishVehicle(g, color, 2.3);
  }

  function makeTruck(color) {
    const g = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.25, 1.3), metal(color));
    cab.position.set(0, 0.08, 1.6);
    const win = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.4, 0.6), glass);
    win.position.set(0, 0.35, 1.95);
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 3.0), metal(0x1b2a4a, 0.5));
    box.position.set(0, 0.2, -0.7);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.12, 3.0), new THREE.MeshBasicMaterial({ color }));
    stripe.position.set(0, 0.6, -0.7);
    g.add(cab, win, box, stripe);
    return finishVehicle(g, color, 4.5);
  }

  const builders = { bus: makeBus, van: makeVan, truck: makeTruck };

  /* Trail: 22 points sampled behind the vehicle along its own curve (pure function of t) */
  const TRAIL_LEN = 22;
  function makeTrail(color) {
    const pos  = new Float32Array(TRAIL_LEN * 3);
    const fade = new Float32Array(TRAIL_LEN);
    for (let i = 0; i < TRAIL_LEN; i++) fade[i] = 1 - i / TRAIL_LEN;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('aFade',    new THREE.BufferAttribute(fade, 1));
    const mat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Color(color) }, uAlpha: { value: 0 } },
      vertexShader: `
        attribute float aFade; varying float vFade;
        void main() {
          vFade = aFade;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = min((3.0 + aFade * 12.0) * (290.0 / -mv.z), 36.0);
          gl_Position  = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uAlpha; varying float vFade;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          gl_FragColor = vec4(uColor, (1.0 - smoothstep(0.1, 0.5, d)) * vFade * 0.5 * uAlpha);
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(geom, mat);
    pts.frustumCulled = false;
    scene.add(pts);
    return pts;
  }

  const vehicles = [];
  routes.forEach(r => {
    r.cfg.vehicles.forEach(v => {
      const mesh  = builders[r.cfg.kind](r.cfg.color);
      scene.add(mesh);
      vehicles.push({ route: r, start: v.start, end: v.end, mesh, trail: lite ? null : makeTrail(r.cfg.color), t: 0, u: 0 });
    });
  });
  window.heroScene.vehicles = vehicles;

  /* ====================================================
     PASSENGERS (instanced spheres) and CRATES (instanced boxes)
     ==================================================== */

  /* Every (stop, vehicle) visit gets its own cohort: 4 boarding + 3 alighting dots */
  const BOARD = 4, ALIGHT = 3;
  const visits = [];
  routes.forEach(r => {
    if (r.cfg.kind === 'truck' || !r.cfg.kind) return;
    r.stops.forEach(stop => {
      if (stop.chargerOnly) return;                         // no passengers at the charging bay
      side.crossVectors(stop.tangent, up).normalize();      // kerb side of the route
      const vs = vehicles.filter(v => v.route === r).sort((a, b) => a.start - b.start);
      vs.forEach((v, vi) => {
        const pIn  = v.start + stop.uIn  * (v.end - v.start);
        const pOut = v.start + stop.uOut * (v.end - v.start);
        const prevOut = vi ? vs[vi - 1].start + stop.uOut * (vs[vi - 1].end - vs[vi - 1].start) : -1;
        const board = [], alight = [];
        for (let k = 0; k < BOARD; k++) {
          board.push(stop.pos.clone().addScaledVector(side, 1.1 + Math.random() * 1.4).addScaledVector(stop.tangent, (Math.random() - 0.5) * 2.4));
        }
        for (let k = 0; k < ALIGHT; k++) {
          alight.push(stop.pos.clone().addScaledVector(side, 1.6 + Math.random() * 1.6).addScaledVector(stop.tangent, (Math.random() - 0.5) * 3.0 + 1.5));
        }
        visits.push({ stop, vehicle: v, pIn, pOut, prevOut, board, alight });
      });
    });
  });

  const passengerCount = visits.length * (BOARD + ALIGHT);
  const passengers = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.3, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xf0f6ff, emissive: 0x9fe8ff, emissiveIntensity: 0.9 }),
    Math.max(passengerCount, 1)
  );
  passengers.frustumCulled = false;
  scene.add(passengers);

  /* Crates: 4 per (depot, truck) visit, moving from the truck to a stack beside the pad */
  const CRATES = 4;
  const deliveries = [];
  routes.filter(r => r.cfg.kind === 'truck').forEach(r => {
    r.stops.forEach(stop => {
      side.crossVectors(stop.tangent, up).normalize();
      const vs = vehicles.filter(v => v.route === r).sort((a, b) => a.start - b.start);
      vs.forEach((v, vi) => {
        const pIn  = v.start + stop.uIn  * (v.end - v.start);
        const pOut = v.start + stop.uOut * (v.end - v.start);
        const slots = [];
        for (let k = 0; k < CRATES; k++) {
          slots.push(stop.pos.clone().addScaledVector(side, 2.2 + (k % 2) * 0.9).addScaledVector(stop.tangent, Math.floor(k / 2) * 0.9 - 0.4 + vi * 2.2));
        }
        deliveries.push({ stop, vehicle: v, pIn, pOut, slots });
      });
    });
  });
  const crates = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.7, 0.7, 0.7),
    new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.35, roughness: 0.6 }),
    Math.max(deliveries.length * CRATES, 1)
  );
  crates.frustumCulled = false;
  scene.add(crates);

  /* ====================================================
     CHARGING — one docking event per (charging stop, vehicle):
     cable from the pylon to the roof, energy stream, battery gauge filling with scroll
     ==================================================== */
  const STREAM_N = 18;
  const chargeEvents = [];
  const gaugeFrameMat = new THREE.MeshBasicMaterial({ color: 0x0a0f1e, transparent: true, opacity: 0.85 });
  const gaugeFillMat  = new THREE.MeshBasicMaterial({ color: 0x39ff14 });
  const cableMat      = new THREE.LineBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.9 });
  const streamMat     = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(0x9fff6b) } },
    vertexShader: `
      attribute float aSize; varying float vS;
      void main() {
        vS = aSize;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = min(aSize * (290.0 / -mv.z), 22.0);
        gl_Position  = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor; varying float vS;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5)); if (d > 0.5) discard;
        gl_FragColor = vec4(uColor, (1.0 - smoothstep(0.1, 0.5, d)) * 0.9);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });

  routes.forEach(r => {
    r.stops.filter(s => s.charge).forEach(stop => {
      vehicles.filter(v => v.route === r).forEach(v => {
        const pIn  = v.start + stop.uIn  * (v.end - v.start);
        const pOut = v.start + stop.uOut * (v.end - v.start);

        /* cable */
        const cableGeom = new THREE.BufferGeometry();
        cableGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12 * 3), 3));
        const cable = new THREE.Line(cableGeom, cableMat);
        cable.frustumCulled = false; cable.visible = false;

        /* energy stream */
        const sGeom = new THREE.BufferGeometry();
        sGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(STREAM_N * 3), 3));
        const sSize = new Float32Array(STREAM_N);
        for (let i = 0; i < STREAM_N; i++) sSize[i] = 1.2 + Math.random() * 1.6;
        sGeom.setAttribute('aSize', new THREE.BufferAttribute(sSize, 1));
        const stream = new THREE.Points(sGeom, streamMat);
        stream.frustumCulled = false; stream.visible = false;

        /* battery gauge (billboarded above the vehicle) */
        const gauge = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.5), gaugeFrameMat);
        const outline = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.6, 0.5)),
          new THREE.LineBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.9 }));
        const fill  = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.3), gaugeFillMat);
        fill.position.z = 0.01;
        const bolt  = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5),
          new THREE.MeshBasicMaterial({ color: 0x39ff14, transparent: true, opacity: 0.95 }));
        bolt.position.set(1.7, 0, 0.01); bolt.rotation.z = Math.PI / 4; bolt.scale.set(0.55, 0.55, 1);
        gauge.add(frame, outline, fill, bolt);
        gauge.visible = false;
        gauge.userData.fill = fill;

        const marker = stop.marker;
        scene.add(cable, stream, gauge);
        chargeEvents.push({ stop, vehicle: v, pIn, pOut, cable, stream, gauge, marker });
      });
    });
  });

  window.heroScene.chargeEvents = chargeEvents;   // debugging aid
  const plugWorld = new THREE.Vector3(), roofWorld = new THREE.Vector3(), mid = new THREE.Vector3();
  const bez = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3());

  function placeCharging(p, t) {
    chargeEvents.forEach(ev => {
      const q = (p - ev.pIn) / (ev.pOut - ev.pIn);
      const docked = q >= 0 && q <= 1 && state.intro > 0.7;
      ev.cable.visible = ev.stream.visible = ev.gauge.visible = docked;

      /* pylon light breathes brighter while a vehicle is on charge */
      ev.marker.children.forEach(c => {
        if (c.userData.chargeLight) c.intensity = docked ? 2.6 + Math.sin(t * 6) * 0.8 : 1.2;
      });
      if (!docked) return;

      const plugLocal = ev.marker.userData.plugTop || new THREE.Vector3(0, 1.5, 0);
      plugWorld.copy(plugLocal).applyMatrix4(ev.marker.matrixWorld);
      roofWorld.copy(ev.vehicle.mesh.position); roofWorld.y += 1.3 * VEH_SCALE * 0.6;

      /* cable: pylon → roof with a sag; snaps on over the first 15% of the dwell */
      const reach = smooth(q / 0.15);
      mid.lerpVectors(plugWorld, roofWorld, 0.5); mid.y += 1.2;
      bez.v0.copy(plugWorld); bez.v1.copy(mid); bez.v2.copy(roofWorld);
      const arr = ev.cable.geometry.attributes.position.array;
      for (let i = 0; i < 12; i++) {
        const pt = bez.getPoint((i / 11) * reach);
        arr[i * 3] = pt.x; arr[i * 3 + 1] = pt.y; arr[i * 3 + 2] = pt.z;
      }
      ev.cable.geometry.attributes.position.needsUpdate = true;

      /* energy stream: packets run down the cable on wall time, only once connected */
      const sarr = ev.stream.geometry.attributes.position.array;
      for (let i = 0; i < STREAM_N; i++) {
        const s = reach >= 1 ? (i / STREAM_N + t * 0.7) % 1 : -1;
        const pt = s < 0 ? plugWorld : bez.getPoint(s);
        sarr[i * 3] = pt.x; sarr[i * 3 + 1] = pt.y; sarr[i * 3 + 2] = pt.z;
      }
      ev.stream.geometry.attributes.position.needsUpdate = true;

      /* gauge: fills from 15% → 90% of the dwell, faces the camera */
      const level = clamp01((q - 0.15) / 0.75);
      const fill  = ev.gauge.userData.fill;
      fill.scale.x = Math.max(level, 0.02);
      fill.position.x = -1.15 + 1.15 * fill.scale.x;
      ev.gauge.position.copy(ev.vehicle.mesh.position); ev.gauge.position.y += 2.2 * VEH_SCALE * 0.7;
      ev.gauge.quaternion.copy(camera.quaternion);
      ev.gauge.scale.setScalar(0.9 + 0.1 * Math.sin(t * 8) * (level < 1 ? 1 : 0));
    });
  }

  /* ====================================================
     PARTICLE FIELD (wall-time drift)
     ==================================================== */
  const PARTICLE_COUNT = lite ? 320 : 1000;
  const pPos = new Float32Array(PARTICLE_COUNT * 3), pCol = new Float32Array(PARTICLE_COUNT * 3);
  const pSize = new Float32Array(PARTICLE_COUNT), pOff = new Float32Array(PARTICLE_COUNT);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 240; pPos[i * 3 + 1] = Math.random() * 42 - 4; pPos[i * 3 + 2] = (Math.random() - 0.5) * 130;
    const teal = Math.random() > 0.3;
    pCol[i * 3] = teal ? 0 : 0.96; pCol[i * 3 + 1] = teal ? 0.83 : 0.62; pCol[i * 3 + 2] = teal ? 1 : 0.04;
    pSize[i] = Math.random() * 2.2 + 0.5; pOff[i] = Math.random() * 100;
  }
  const pGeom = new THREE.BufferGeometry();
  pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeom.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
  pGeom.setAttribute('aSize',    new THREE.BufferAttribute(pSize, 1));
  pGeom.setAttribute('aOffset',  new THREE.BufferAttribute(pOff, 1));
  const pMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntro: { value: 0 } },
    vertexShader: `
      attribute float aSize; attribute float aOffset; varying vec3 vColor; varying float vAlpha;
      uniform float uTime; uniform float uIntro;
      void main() {
        vColor = color; vec3 pos = position;
        pos.y += mod(uTime * 0.55 + aOffset, 42.0) - 21.0;
        pos.x += sin(uTime * 0.38 + aOffset) * 0.45;
        vAlpha = (0.35 + 0.3 * sin(uTime * 1.9 + aOffset * 3.14)) * uIntro;
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = min(aSize * (290.0 / -mv.z), 26.0);
        gl_Position  = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5)); if (d > 0.5) discard;
        gl_FragColor = vec4(vColor, (1.0 - smoothstep(0.15, 0.5, d)) * vAlpha);
      }`,
    transparent: true, depthWrite: false, vertexColors: true,
  });
  scene.add(new THREE.Points(pGeom, pMat));

  /* ====================================================
     POINTER → grid spotlight
     ==================================================== */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let smoothPx = 0, smoothPy = 0;
  function updateSpotlight() {
    if (lite) return;
    ndc.set(state.px, -state.py);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(gridMesh, false)[0];
    if (hit && hit.uv) gridMat.uniforms.uMouse.value.lerp(hit.uv, 0.12);
  }

  /* ====================================================
     FRAME
     ==================================================== */
  const clock = new THREE.Clock();
  const lookTarget = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  let animId;

  function placeVehicle(v, p) {
    v.u = clamp01((p - v.start) / (v.end - v.start));
    v.t = v.route.uToT(v.u);
    const pt = v.route.curve.getPoint(v.t);
    const tg = v.route.curve.getTangent(v.t);
    v.mesh.position.copy(pt);
    v.mesh.lookAt(tmp.copy(pt).add(tg));
    /* fade in/out at the edges of the map + intro pop */
    const edge = smooth(v.t / 0.04) * smooth((1 - v.t) / 0.04);
    v.mesh.scale.setScalar(easeOutBack((state.intro - 0.6) / 0.3) * edge * VEH_SCALE);

    if (v.trail) {
      const arr = v.trail.geometry.attributes.position.array;
      for (let i = 0; i < TRAIL_LEN; i++) {
        const q = v.route.curve.getPoint(Math.max(v.t - i * 0.0035, 0));
        arr[i * 3] = q.x; arr[i * 3 + 1] = q.y - 0.3; arr[i * 3 + 2] = q.z;
      }
      v.trail.geometry.attributes.position.needsUpdate = true;
      v.trail.material.uniforms.uAlpha.value = edge * (state.intro > 0.7 ? 1 : 0);
    }
  }

  function placePassengers(p) {
    let idx = 0;
    visits.forEach(vis => {
      const q = (p - vis.pIn) / (vis.pOut - vis.pIn);           // dwell phase, 0..1 while the vehicle waits
      const busPos = vis.vehicle.mesh.position;

      /* Boarding cohort: appear after the previous vehicle leaves, stand, then walk into the bus */
      let standScale = 0;
      if (p < vis.pIn) standScale = vis.prevOut < 0 ? 1 : smooth((p - vis.prevOut) / Math.max((vis.pIn - vis.prevOut) * 0.3, 1e-4));
      vis.board.forEach((pos, k) => {
        let s = standScale, x = pos;
        if (q >= 0 && q <= 1) {
          const kq = clamp01((q - k * 0.12) / 0.5);              // each passenger boards a little later
          x = tmp.copy(pos).lerp(busPos, smooth(kq));
          s = 1 - smooth((kq - 0.75) / 0.25);
        } else if (q > 1) s = 0;
        dummy.position.set(x.x, Y + 0.25, x.z);
        dummy.scale.setScalar(s * state.intro);
        dummy.updateMatrix();
        passengers.setMatrixAt(idx++, dummy.matrix);
      });

      /* Alighting cohort: step out of the bus and walk away, fading after it leaves */
      vis.alight.forEach((pos, k) => {
        let s = 0, x = pos;
        if (q >= 0) {
          const kq = clamp01((q - 0.1 - k * 0.1) / 0.55);
          x = tmp.copy(busPos).lerp(pos, smooth(kq));
          s = smooth(kq / 0.2) * (1 - smooth((p - vis.pOut) / 0.03));
        }
        dummy.position.set(x.x, Y + 0.25, x.z);
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        passengers.setMatrixAt(idx++, dummy.matrix);
      });
    });
    passengers.instanceMatrix.needsUpdate = true;
  }

  function placeCrates(p) {
    let idx = 0;
    deliveries.forEach(d => {
      const q = (p - d.pIn) / (d.pOut - d.pIn);
      const truckPos = d.vehicle.mesh.position;
      d.slots.forEach((slot, k) => {
        let s = 0, x = slot, y = Y + 0.35;
        if (q >= 0) {
          const kq = clamp01((q - k * 0.18) / 0.3);
          x = tmp.copy(truckPos).lerp(slot, smooth(kq));
          y = Y + 0.35 + Math.sin(kq * Math.PI) * 1.4;           // hop out over the tailgate
          s = kq > 0 ? 1 : 0;
        }
        dummy.position.set(x.x, y, x.z);
        dummy.rotation.y = k * 0.4;
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        crates.setMatrixAt(idx++, dummy.matrix);
      });
    });
    crates.instanceMatrix.needsUpdate = true;
  }

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    const { intro, scroll } = state;

    gridMat.uniforms.uTime.value   = t;
    gridMat.uniforms.uReveal.value = easeOutExpo(intro);
    pMat.uniforms.uTime.value      = t;
    pMat.uniforms.uIntro.value     = Math.min(intro * 1.6, 1);

    routes.forEach(r => {
      const p = clamp01((intro - 0.12 - r.cfg.delay) / 0.5);
      r.mesh.geometry.setDrawRange(0, Math.floor(r.indexCount * easeOutExpo(p)));
    });

    popGroups.forEach(g => {
      g.scale.setScalar(easeOutBack((intro - g.userData.introAt) / 0.22));
      g.children.forEach(c => {
        const pu = c.userData.pulse;
        if (!pu) return;
        const phase = (t * pu.speed + pu.delay) % 1;
        c.scale.setScalar(1 + phase * (pu.maxScale - 1));
        c.material.opacity = (1 - phase) * pu.alpha;
      });
    });

    vehicles.forEach(v => placeVehicle(v, scroll));
    placePassengers(scroll);
    placeCrates(scroll);
    placeCharging(scroll, t);

    /* Camera: intro sweep → rest; tracks the fleet across, then pulls back to reveal the network */
    smoothPx += (state.px - smoothPx) * 0.04;
    smoothPy += (state.py - smoothPy) * 0.04;
    const e  = easeOutExpo(intro);
    const s2 = smooth((scroll - 0.7) / 0.3);
    const track = lerp(-10, 10, smooth(scroll));
    camera.position.x = track + smoothPx * 3.2;
    camera.position.y = lerp(CAM_START.y, CAM_END.y, e) + s2 * 18 - smoothPy * 2.2;
    camera.position.z = lerp(CAM_START.z, CAM_END.z, e) + s2 * 36;
    camera.fov        = lerp(CAM_START.fov, CAM_END.fov, e) + s2 * 8;
    camera.updateProjectionMatrix();
    lookTarget.set(track * 0.6 + smoothPx * 1.5, s2 * 6, LOOK_Z);
    camera.lookAt(lookTarget);

    updateSpotlight();
    renderer.render(scene, camera);
  }

  animate();

  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { if (!animId) animate(); }
    else { cancelAnimationFrame(animId); animId = null; }
  }, { threshold: 0 }).observe(heroSection);

  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

})();
