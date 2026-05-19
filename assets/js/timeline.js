/* timeline.js — Horizontal pinned experience timeline, sinusoidal route, year labels, all-dot pulses */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    const outer     = document.getElementById('timeline-outer');
    const track     = document.getElementById('timeline-track');
    const path      = document.getElementById('route-path');
    const routeSvg  = document.getElementById('route-svg');
    const busMarker = document.getElementById('bus-marker');
    if (!outer || !track || !path || !routeSvg) return;

    /* ── SVG wave heights — alternates up/down for sinusoidal feel ── */
    const WAVE_Y  = [18, 52, 14, 52, 16]; // top-of-wave ↑ / bottom-of-wave ↓
    const SVG_H   = 80;

    /* ── Build sinusoidal SVG route path ── */
    function buildRoutePath() {
      const stations = Array.from(track.querySelectorAll('.timeline-station'));
      if (!stations.length) return 0;

      const trackRect = track.getBoundingClientRect();
      const points    = [];

      stations.forEach((s, i) => {
        const dot  = s.querySelector('.station-dot');
        if (!dot) return;
        const rect = dot.getBoundingClientRect();
        points.push({
          x: rect.left - trackRect.left + rect.width / 2,
          y: WAVE_Y[i % WAVE_Y.length],
        });
      });

      /* SVG viewport covers the whole track width */
      routeSvg.setAttribute('width',   track.scrollWidth);
      routeSvg.setAttribute('height',  SVG_H);
      routeSvg.setAttribute('viewBox', `0 0 ${track.scrollWidth} ${SVG_H}`);

      /* Smooth cubic bezier through wave points */
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const mx   = (prev.x + curr.x) / 2;
        d += ` C ${mx} ${prev.y}, ${mx} ${curr.y}, ${curr.x} ${curr.y}`;
      }
      path.setAttribute('d', d);

      /* ── Year labels and stop circles at each wave vertex ── */
      routeSvg.querySelectorAll('.route-year-label, .route-stop-ring').forEach(el => el.remove());

      points.forEach((p, i) => {
        const station = stations[i];
        const year    = station ? station.dataset.year : '';
        const isAbove = p.y < SVG_H / 2;   // label goes opposite of dot

        /* Stop ring */
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', p.x);
        circle.setAttribute('cy', p.y);
        circle.setAttribute('r',  '5');
        circle.setAttribute('fill',   '#0a0f1e');
        circle.setAttribute('stroke', '#00d4ff');
        circle.setAttribute('stroke-width', '2');
        circle.classList.add('route-stop-ring');
        routeSvg.appendChild(circle);

        /* Year text */
        if (year) {
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x',           p.x);
          label.setAttribute('y',           isAbove ? p.y - 12 : p.y + 20);
          label.setAttribute('text-anchor', 'middle');
          label.setAttribute('fill',        '#00d4ff');
          label.setAttribute('font-size',   '9.5');
          label.setAttribute('font-family', 'JetBrains Mono, monospace');
          label.setAttribute('opacity',     '0.85');
          label.textContent = year;
          label.classList.add('route-year-label');
          routeSvg.appendChild(label);
        }
      });

      return path.getTotalLength();
    }

    /* Initial build */
    let pathLength = buildRoutePath();

    /* ── Horizontal scroll pin ── */
    const getScrollWidth = () => Math.max(track.scrollWidth - window.innerWidth, 0);

    const pinTween = gsap.to(track, {
      x:    () => -getScrollWidth(),
      ease: 'none',
      scrollTrigger: {
        trigger: outer,
        pin:     true,
        scrub:   1.2,
        start:   'top top',
        end:     () => `+=${getScrollWidth()}`,
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onRefresh() { pathLength = buildRoutePath(); },
      },
    });

    /* ── Station cards and dots enter as each slides into view ── */
    track.querySelectorAll('.timeline-station').forEach((station) => {
      const card = station.querySelector('.station-card');
      const dot  = station.querySelector('.station-dot');

      if (card) {
        gsap.from(card, {
          opacity: 0, y: 55, duration: 0.75, ease: 'power3.out',
          scrollTrigger: {
            trigger: station, containerAnimation: pinTween,
            start: 'left 82%', toggleActions: 'play none none reverse',
          },
        });
      }
      if (dot) {
        gsap.from(dot, {
          scale: 0, duration: 0.5, ease: 'back.out(3)',
          scrollTrigger: {
            trigger: station, containerAnimation: pinTween,
            start: 'left 76%',
          },
        });
      }
    });

    /* ── Route line draws as you scroll ── */
    gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
    gsap.to(path, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: {
        trigger: outer, start: 'top top',
        end:     () => `+=${getScrollWidth()}`,
        scrub: 0.8,
        onUpdate(self) {
          /* Reveal stop-ring labels progressively */
          const progress = self.progress;
          const rings    = routeSvg.querySelectorAll('.route-stop-ring, .route-year-label');
          const N        = track.querySelectorAll('.timeline-station').length;
          rings.forEach((el, i) => {
            const stationIdx = Math.floor(i / 2); // ring + label pair
            const threshold  = stationIdx / N;
            el.style.opacity = progress >= threshold - 0.05 ? '1' : '0';
            el.style.transition = 'opacity 0.4s';
          });
        },
      },
    });

    /* ── Bus marker travels along wavy path ── */
    if (busMarker) {
      gsap.to(busMarker, {
        motionPath: {
          path:        '#route-path',
          align:       '#route-path',
          autoRotate:  true,
          alignOrigin: [0.5, 0.5],
        },
        ease: 'none',
        scrollTrigger: {
          trigger: outer, start: 'top top',
          end:     () => `+=${getScrollWidth()}`,
          scrub: 0.8,
        },
      });
    }

    /* ── Pulse on ALL station dots (staggered timing) ── */
    document.querySelectorAll('.station-pulse').forEach((pulse, i) => {
      gsap.fromTo(pulse,
        { scale: 0.8, opacity: 0.7 },
        {
          scale: 3.0, opacity: 0,
          duration: 1.6,
          repeat: -1,
          delay: i * 0.45,        // stagger so they don't all pulse at once
          ease: 'power2.out',
          transformOrigin: 'center center',
        }
      );
    });

  });

})();
