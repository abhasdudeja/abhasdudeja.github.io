/* hero-scene.js — Three.js city grid, 5 curvy bus routes with stops, EV charging pulses, GPS particles */

(function () {
  'use strict';

  const canvas      = document.getElementById('hero-canvas');
  const heroSection = document.getElementById('hero');
  const isMobile    = window.innerWidth < 768;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function supportsWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
  }

  if (!supportsWebGL() || prefersReduced || isMobile) {
    heroSection.classList.add('hero-fallback');
    return;
  }

  /* ── Renderer ── */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  /* ── Scene / Camera ── */
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0f1e, 0.010);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);
  camera.position.set(0, 20, 42);
  camera.lookAt(0, 0, 0);

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x0a1128, 2.5));
  const dirLight = new THREE.DirectionalLight(0x00d4ff, 0.5);
  dirLight.position.set(40, 80, 30);
  scene.add(dirLight);

  /* ====================================================
     LAYER 1 — CITY GRID (shader)
     ==================================================== */
  const gridVert = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const gridFrag = `
    uniform float uTime;
    uniform vec3  uColor;
    varying vec2  vUv;
    void main() {
      vec2 coord = vUv * 20.0;
      vec2 g     = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
      float line = 1.0 - min(min(g.x, g.y), 1.0);
      float scan  = mod(uTime * 0.11, 1.0);
      float pulse = smoothstep(0.025, 0.0, abs(vUv.y - scan)) * 0.75;
      float ex = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x);
      float ey = smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.55, vUv.y);
      gl_FragColor = vec4(uColor, (line * 0.42 + pulse) * ex * ey);
    }
  `;

  const gridMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0x00d4ff) } },
    vertexShader: gridVert, fragmentShader: gridFrag,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    extensions: { derivatives: true },
  });
  const gridMesh = new THREE.Mesh(new THREE.PlaneGeometry(260, 200, 1, 1), gridMat);
  gridMesh.rotation.x = -Math.PI / 2.6;
  gridMesh.position.y = -10;
  scene.add(gridMesh);

  /* ====================================================
     LAYER 2 — 5 CURVY ROUTES (S-curves & arcs)
     ==================================================== */
  const routeConfigs = [
    /* Route A — Primary E-W S-curve (bright teal) */
    {
      points: [
        new THREE.Vector3(-95, -2, -4),
        new THREE.Vector3(-60, -2, -22),   // arc south
        new THREE.Vector3(-25, -2,  -6),   // arc north
        new THREE.Vector3(12,  -2, -24),   // arc south
        new THREE.Vector3(50,  -2,  -8),   // arc north
        new THREE.Vector3(95,  -2, -20),
      ],
      color: 0x00d4ff, opacity: 0.72,
      stopTs: [0.18, 0.38, 0.58, 0.80],   // t-values for bus stops
    },
    /* Route B — Secondary diagonal arc (brand green) */
    {
      points: [
        new THREE.Vector3(-85, -2,  18),
        new THREE.Vector3(-45, -2,   6),
        new THREE.Vector3(-5,  -2,  22),   // bulge upward
        new THREE.Vector3(38,  -2,   8),
        new THREE.Vector3(88,  -2,  16),
      ],
      color: 0x18bc9c, opacity: 0.55,
      stopTs: [0.22, 0.55, 0.82],
    },
    /* Route C — Deep cross-diagonal (dim teal) */
    {
      points: [
        new THREE.Vector3(-78, -2, -32),
        new THREE.Vector3(-32, -2, -12),
        new THREE.Vector3(10,  -2, -28),
        new THREE.Vector3(52,  -2,  -8),
        new THREE.Vector3(90,  -2, -22),
      ],
      color: 0x00d4ff, opacity: 0.32,
      stopTs: [0.3, 0.7],
    },
    /* Route D — Short curved feeder (amber / warm) */
    {
      points: [
        new THREE.Vector3(-35, -2,  30),
        new THREE.Vector3(-10, -2,  22),
        new THREE.Vector3(18,  -2,  32),
        new THREE.Vector3(48,  -2,  20),
        new THREE.Vector3(68,  -2,  28),
      ],
      color: 0xf59e0b, opacity: 0.40,
      stopTs: [0.25, 0.65],
    },
    /* Route E — Background far trace (very faint) */
    {
      points: [
        new THREE.Vector3(-92, -2, -42),
        new THREE.Vector3(-48, -2, -30),
        new THREE.Vector3(-5,  -2, -44),
        new THREE.Vector3(42,  -2, -28),
        new THREE.Vector3(88,  -2, -38),
      ],
      color: 0x00d4ff, opacity: 0.14,
      stopTs: [],
    },
  ];

  const routeCurves = routeConfigs.map(cfg => {
    const curve = new THREE.CatmullRomCurve3(cfg.points, false, 'catmullrom', 0.5);
    const geom  = new THREE.TubeGeometry(curve, 120, 0.1, 6, false);
    const mat   = new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: cfg.opacity });
    scene.add(new THREE.Mesh(geom, mat));
    return curve;
  });

  /* ====================================================
     LAYER 3 — BUS STOP MARKERS
     ==================================================== */
  function createBusStop(position, color = 0x00d4ff) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.position.y = -1.2;

    /* Pole */
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 1.6, 8),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.25, metalness: 0.8, roughness: 0.3 })
    );
    pole.position.y = 0.4;

    /* Top marker sphere */
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 8),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2 })
    );
    sphere.position.y = 1.35;

    /* Glow light */
    const light = new THREE.PointLight(color, 1.5, 7);
    light.position.y = 1.4;

    /* Ground pulse ring (animated in loop) */
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.42, 20),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.userData.pulseDelay = Math.random();

    group.add(pole, sphere, light, ring);
    return group;
  }

  /* Place stops on each route */
  const busStopGroups = [];
  routeConfigs.forEach((cfg, ri) => {
    cfg.stopTs.forEach(t => {
      const pt    = routeCurves[ri].getPoint(t);
      const color = cfg.color;
      const stop  = createBusStop(pt, color);
      scene.add(stop);
      busStopGroups.push(stop);
    });
  });

  /* Charging terminal stops at route endpoints (neon green) */
  const terminalTs = [0, 1];
  [0, 1].forEach(ri => {
    terminalTs.forEach(t => {
      const pt = routeCurves[ri].getPoint(t);
      pt.y = -1.8;
      const g = new THREE.Group();
      g.position.copy(pt);

      const base = new THREE.Mesh(
        new THREE.RingGeometry(0.6, 0.85, 32),
        new THREE.MeshBasicMaterial({ color: 0x39ff14, side: THREE.DoubleSide, transparent: true, opacity: 0.75 })
      );
      base.rotation.x = -Math.PI / 2;
      g.add(base);

      for (let k = 0; k < 3; k++) {
        const expRing = new THREE.Mesh(
          new THREE.RingGeometry(0.35, 0.55, 32),
          new THREE.MeshBasicMaterial({ color: 0x00d4ff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
        );
        expRing.rotation.x = -Math.PI / 2;
        expRing.userData.delay = k * 0.33;
        g.add(expRing);
      }
      g.add(new THREE.PointLight(0x39ff14, 2.5, 12));
      scene.add(g);
      busStopGroups.push(g); // reuse same update loop for expanding rings
    });
  });

  /* ====================================================
     LAYER 4 — MOVING BUSES (6 buses across routes)
     ==================================================== */
  function makeBus(color = 0x00d4ff) {
    const group = new THREE.Group();

    /* Body */
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 1.1, 1.5),
      new THREE.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.75 })
    );

    /* Windows strip */
    const windows = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.44, 1.52),
      new THREE.MeshStandardMaterial({ color: 0xaaffee, emissive: 0x55ffdd, emissiveIntensity: 1.6 })
    );
    windows.position.y = 0.15;

    /* Front face (windshield dark) */
    const front = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.68, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x001122, emissive: 0x003355, emissiveIntensity: 0.4 })
    );
    front.position.set(1.76, 0.08, 0);

    /* Headlights */
    const hl = (z) => {
      const l = new THREE.PointLight(0xfff0cc, 2.0, 10);
      l.position.set(1.85, 0.1, z);
      return l;
    };

    /* Under-body glow */
    const glow = new THREE.PointLight(color, 2.8, 14);
    glow.position.y = -0.6;

    group.add(body, windows, front, hl(0.55), hl(-0.55), glow);
    return group;
  }

  /* Route assignment: routeIdx, startOffset, speed multiplier */
  const busConfigs = [
    { ri: 0, offset: 0.00, spd: 1.0,  color: 0x00d4ff },
    { ri: 0, offset: 0.50, spd: 1.0,  color: 0x00d4ff },
    { ri: 1, offset: 0.10, spd: 0.85, color: 0x18bc9c },
    { ri: 1, offset: 0.62, spd: 0.85, color: 0x18bc9c },
    { ri: 2, offset: 0.30, spd: 0.70, color: 0x00d4ff },
    { ri: 3, offset: 0.15, spd: 1.15, color: 0xf59e0b },
  ];

  const buses = busConfigs.map(cfg => {
    const b = makeBus(cfg.color);
    scene.add(b);
    return b;
  });

  /* ====================================================
     LAYER 5 — GPS PARTICLE SYSTEM
     ==================================================== */
  const PARTICLE_COUNT = 1100;
  const pPos  = new Float32Array(PARTICLE_COUNT * 3);
  const pCol  = new Float32Array(PARTICLE_COUNT * 3);
  const pSize = new Float32Array(PARTICLE_COUNT);
  const pOff  = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 220;
    pPos[i * 3 + 1] = Math.random() * 42 - 4;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 120;
    const teal = Math.random() > 0.3;
    pCol[i * 3]     = teal ? 0.0  : 0.96;
    pCol[i * 3 + 1] = teal ? 0.83 : 0.62;
    pCol[i * 3 + 2] = teal ? 1.0  : 0.04;
    pSize[i] = Math.random() * 2.2 + 0.5;
    pOff[i]  = Math.random() * 100;
  }

  const pGeom = new THREE.BufferGeometry();
  pGeom.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  pGeom.setAttribute('color',    new THREE.BufferAttribute(pCol, 3));
  pGeom.setAttribute('aSize',    new THREE.BufferAttribute(pSize, 1));
  pGeom.setAttribute('aOffset',  new THREE.BufferAttribute(pOff, 1));

  const pMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      attribute float aSize;  attribute float aOffset;  attribute vec3 color;
      varying vec3 vColor;    varying float vAlpha;     uniform float uTime;
      void main() {
        vColor = color;
        vec3 pos = position;
        float drift = mod(uTime * 0.55 + aOffset, 42.0);
        pos.y = pos.y + drift - 21.0;
        pos.x += sin(uTime * 0.38 + aOffset) * 0.45;
        vAlpha = 0.35 + 0.3 * sin(uTime * 1.9 + aOffset * 3.14);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = aSize * (290.0 / -mv.z);
        gl_Position  = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;  varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        gl_FragColor = vec4(vColor, (1.0 - smoothstep(0.15, 0.5, d)) * vAlpha);
      }
    `,
    transparent: true, depthWrite: false, vertexColors: true,
  });
  scene.add(new THREE.Points(pGeom, pMat));

  /* ====================================================
     MOUSE PARALLAX
     ==================================================== */
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', e => {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  /* ====================================================
     ANIMATION LOOP
     ==================================================== */
  const clock = new THREE.Clock();
  let animId;

  function animate() {
    animId = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    gridMat.uniforms.uTime.value = t;
    pMat.uniforms.uTime.value    = t;

    /* Move buses along their route curves */
    buses.forEach((bus, i) => {
      const cfg      = busConfigs[i];
      const curve    = routeCurves[cfg.ri];
      const progress = (t * 0.032 * cfg.spd + cfg.offset) % 1;
      const pt       = curve.getPoint(progress);
      const tangent  = curve.getTangent(progress);
      bus.position.copy(pt);
      bus.lookAt(pt.clone().add(tangent));
    });

    /* Animate bus stop pulse rings + charging expansion rings */
    busStopGroups.forEach(group => {
      group.children.forEach(child => {
        /* Expanding terminal rings (charging stations) */
        if (child.userData.delay !== undefined) {
          const phase = (t * 0.72 + child.userData.delay) % 1;
          child.scale.setScalar(1 + phase * 3.8);
          child.material.opacity = (1 - phase) * 0.62;
          return;
        }
        /* Bus stop ground pulse ring */
        if (child.userData.pulseDelay !== undefined) {
          const phase = (t * 1.1 + child.userData.pulseDelay) % 1;
          child.scale.setScalar(1 + phase * 2.4);
          child.material.opacity = (1 - phase) * 0.5;
        }
      });
    });

    /* Camera mouse parallax */
    camera.position.x += (mouseX * 3   - camera.position.x) * 0.022;
    camera.position.y += (-mouseY * 2  + 20 - camera.position.y) * 0.022;

    /* Scroll-based pull-back */
    const sp = window.scrollY / window.innerHeight;
    camera.position.z = 42 + sp * 20;
    camera.fov        = 60 + sp * 9;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  /* Pause renderer when hero is off-screen */
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { if (!animId) animate(); }
    else { cancelAnimationFrame(animId); animId = null; }
  }, { threshold: 0 }).observe(heroSection);

  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

})();
