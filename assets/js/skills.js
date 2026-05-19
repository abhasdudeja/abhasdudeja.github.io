/* skills.js — Chart.js radar with animated pulsing dots on ALL data points */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const radarCanvas = document.getElementById('skills-radar');
    if (!radarCanvas) return;

    /* ── 1. Build radar chart ── */
    const chart = new Chart(radarCanvas, {
      type: 'radar',
      data: {
        labels: [
          'Data Science',
          'Public Transport',
          'EV & Charging',
          'GIS',
          'Transport Planning',
          'Electric Mobility',
        ],
        datasets: [{
          data: [90, 95, 88, 92, 93, 85],
          backgroundColor:     'rgba(0, 212, 255, 0.08)',
          borderColor:         'rgba(0, 212, 255, 0.70)',
          borderWidth:          2,
          pointRadius:          0,   // hide default points — we draw our own
          pointHoverRadius:     0,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: true,
        scales: {
          r: {
            min: 0, max: 100,
            grid:        { color: 'rgba(0, 212, 255, 0.07)' },
            angleLines:  { color: 'rgba(0, 212, 255, 0.10)' },
            pointLabels: {
              color: '#8892a4',
              font:  { family: "'Inter', sans-serif", size: 10 },
            },
            ticks: { display: false, stepSize: 25 },
          },
        },
        plugins: {
          legend:  { display: false },
          tooltip: { enabled: false },
        },
        animation: {
          duration: 1400,
          easing:   'easeOutQuart',
          onComplete() { startPulseAnimation(chart); },
        },
      },
    });

    /* ── 2. Overlay canvas for animated pulse rings ── */
    function startPulseAnimation(chartInstance) {
      const container = radarCanvas.parentNode;

      /* Remove any existing overlay to avoid duplicates */
      const old = container.querySelector('.radar-pulse-overlay');
      if (old) old.remove();

      const overlay = document.createElement('canvas');
      overlay.className = 'radar-pulse-overlay';
      overlay.style.cssText = [
        'position:absolute',
        'inset:0',
        'pointer-events:none',
        'z-index:3',
        'border-radius:50%',
      ].join(';');

      /* Match size to the Chart.js canvas */
      const dpr = window.devicePixelRatio || 1;
      overlay.width  = radarCanvas.width;
      overlay.height = radarCanvas.height;
      overlay.style.width  = radarCanvas.style.width  || radarCanvas.offsetWidth  + 'px';
      overlay.style.height = radarCanvas.style.height || radarCanvas.offsetHeight + 'px';

      container.appendChild(overlay);
      const ctx = overlay.getContext('2d');

      /* Stagger offset per point so they pulse at different phases */
      const N      = chartInstance.data.labels.length;
      const phases = Array.from({ length: N }, (_, i) => i / N);

      /* Start invisible — fade in once the About section enters viewport */
      overlay.style.opacity   = '0';
      overlay.style.transition = 'opacity 0.9s ease 0.5s';
      const aboutEl = document.getElementById('about');
      if (aboutEl) {
        const fadeObs = new IntersectionObserver(entries => {
          if (entries[0].isIntersecting) {
            overlay.style.opacity = '1';
            fadeObs.disconnect();
          }
        }, { threshold: 0.25 });
        fadeObs.observe(aboutEl);
      }

      let rafId;
      function draw(time) {
        rafId = requestAnimationFrame(draw);

        /* Re-sync overlay size if chart resized */
        if (overlay.width !== radarCanvas.width || overlay.height !== radarCanvas.height) {
          overlay.width  = radarCanvas.width;
          overlay.height = radarCanvas.height;
        }

        ctx.clearRect(0, 0, overlay.width, overlay.height);

        const meta = chartInstance.getDatasetMeta(0);
        meta.data.forEach((point, i) => {
          const px = point.x;
          const py = point.y;
          const t  = (time * 0.001 + phases[i]) % 1;

          /* Outer expanding ring */
          const r1    = 4 + t * 22;
          const alpha = (1 - t) * 0.75;
          ctx.beginPath();
          ctx.arc(px, py, r1, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
          ctx.lineWidth   = 1.5;
          ctx.stroke();

          /* Second trailing ring (half-phase behind) */
          const t2  = (time * 0.001 + phases[i] + 0.45) % 1;
          const r2  = 4 + t2 * 14;
          const a2  = (1 - t2) * 0.45;
          ctx.beginPath();
          ctx.arc(px, py, r2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0, 212, 255, ${a2})`;
          ctx.lineWidth   = 1;
          ctx.stroke();

          /* Solid core dot */
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fillStyle = '#00d4ff';
          ctx.shadowBlur   = 8;
          ctx.shadowColor  = 'rgba(0, 212, 255, 0.9)';
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      /* Stop if the chart canvas leaves the viewport */
      const obs = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          if (!rafId) rafId = requestAnimationFrame(draw);
        } else {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }, { threshold: 0 });
      obs.observe(radarCanvas);

      rafId = requestAnimationFrame(draw);
    }
  });

})();
