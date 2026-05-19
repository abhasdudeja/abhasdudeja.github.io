/* projects.js — Project data, filter system, 3D card tilt, and modal system */

(function () {
  'use strict';

  /* ── Project data ── */
  const PROJECT_DATA = {
    microgrid: {
      title: 'EV Fleet Charging Analysis',
      org:   'Microgrid Labs — USA',
      year:  '2022 – Present',
      role:  'Transport Planner & Analyst',
      logo:  'assets/img/MGL_Logo.png',
      bullets: [
        'Analysed EV fleet charging requirements for transit agencies across the United States.',
        'Modelled bus electrification scenarios — range, charging infrastructure sizing, depot layouts.',
        'Built data pipelines to process GTFS feeds and real-world fleet telemetry.',
        'Delivered reports guiding transit agencies on EV fleet transition timelines and costs.',
        'Collaborated with US transit clients and utility companies on grid impact analysis.',
      ],
      tags: ['EV Fleets', 'Fleet Charging', 'GTFS', 'Data Analysis', 'Bus Electrification', 'US Transit'],
    },
    cept: {
      title: 'City Bus & BRT Service Benchmarking',
      org:   'CEPT University — CRDF, Ahmedabad',
      year:  '2017',
      role:  'Research Intern',
      logo:  'assets/img/logo-crdf.png',
      bullets: [
        'Monitored Citybus operations and route assessment for Surat Sitilink (BRTS).',
        'Conducted primary surveys for city bus operations benchmarking across corridors.',
        'Addressed fare slippage, bus maintenance, and operational concerns.',
        'Provided technical support to Surat Municipal Corporation for service improvements.',
        'Compiled benchmarking reports comparing Surat\'s BRT to national standards.',
      ],
      tags: ['BRT', 'Benchmarking', 'Surveys', 'Public Transport', 'Surat Sitilink'],
      contact: 'Prof. Shalini Sinha',
    },
    volvo: {
      title: 'Inter-city Transport Research',
      org:   'Volvo Buses India',
      year:  '2018',
      role:  'Research Intern',
      logo:  'assets/img/volvo-buses.jpg',
      logoStyle: 'object-fit:cover;border-radius:8px;',
      bullets: [
        'Conducted inter-city transport research for Volvo Buses India across coach corridors.',
        'Led user perception surveys to understand traveller preferences on long-distance routes.',
        'Analysed brand standardisation opportunities across Volvo\'s operator network.',
        'Benchmarked Volvo service quality against competitor coach operators.',
        'Delivered research report with recommendations for service enhancement.',
      ],
      tags: ['Intercity', 'Research', 'User Perception', 'Coach Services', 'Brand Standardisation'],
    },
    sscl: {
      title: 'Electric Bus Operations',
      org:   'Silvassa Smart City Ltd (SSCL)',
      year:  '2020',
      role:  'Transport Consultant',
      logo:  'assets/img/sscl.jpg',
      logoStyle: 'object-fit:cover;border-radius:8px;',
      bullets: [
        'Supported Silvassa Smart City in planning electric bus operations for the city.',
        'Assessed route feasibility and charging infrastructure requirements for eBus deployment.',
        'Analysed ridership data to size fleet requirements for electric transit.',
        'Advised on charging station placement and overnight depot charging strategies.',
      ],
      tags: ['Electric Bus', 'Smart City', 'Fleet Sizing', 'Charging Infrastructure'],
    },
    lnt: {
      title: 'Infrastructure & Transport Planning',
      org:   'L&T Infrastructure Engineering',
      year:  '2021 – 2022',
      role:  'Post Graduate Engineer Trainee',
      logo:  'assets/img/lntiel.png',
      bullets: [
        'Contributed to multi-modal transport planning studies for large-scale infrastructure projects.',
        'Prepared GIS-based transport network analysis and spatial deliverables.',
        'Assisted in traffic impact assessments and demand forecasting studies.',
        'Supported feasibility studies for road and transit infrastructure across Indian cities.',
        'Coordinated with clients and multi-disciplinary engineering teams on project deliverables.',
      ],
      tags: ['Infrastructure', 'GIS', 'Multi-modal', 'Traffic Analysis', 'Transport Planning'],
    },
  };

  /* ── Filter system ── */
  function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards      = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        cards.forEach(card => {
          const cat = card.dataset.category;
          const show = filter === 'all' || cat === filter;

          if (typeof gsap !== 'undefined') {
            if (show) {
              gsap.to(card, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
              card.style.pointerEvents = 'all';
            } else {
              gsap.to(card, { autoAlpha: 0, scale: 0.92, duration: 0.3, ease: 'power2.in' });
              card.style.pointerEvents = 'none';
            }
          } else {
            card.style.display = show ? '' : 'none';
          }
        });
      });
    });
  }

  /* ── 3D card tilt on hover ── */
  function init3DTilt() {
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        if (typeof gsap === 'undefined') return;
        const rect = card.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const dx   = (e.clientX - cx) / (rect.width  / 2);
        const dy   = (e.clientY - cy) / (rect.height / 2);
        gsap.to(card, {
          rotateY:              dx * 10,
          rotateX:             -dy * 7,
          scale:                1.03,
          duration:             0.35,
          ease:                 'power2.out',
          transformPerspective: 900,
        });
      });

      card.addEventListener('mouseleave', () => {
        if (typeof gsap === 'undefined') return;
        gsap.to(card, {
          rotateY: 0, rotateX: 0, scale: 1,
          duration: 0.45, ease: 'elastic.out(1, 0.55)',
        });
      });
    });
  }

  /* ── ScrollTrigger batch reveal ── */
  function initReveal() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    ScrollTrigger.batch('.project-card', {
      onEnter: batch => gsap.from(batch, {
        opacity: 0, y: 55, duration: 0.65,
        stagger: 0.09, ease: 'power3.out',
      }),
      start: 'top 82%',
    });
  }

  /* ── Modal system ── */
  function buildModalHTML(data) {
    const logoStyle = data.logoStyle || 'object-fit:contain;';
    return `
      <div class="project-modal-inner" role="document">
        <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>
        ${data.logo ? `<img src="${data.logo}" alt="${data.org}" class="modal-logo" style="${logoStyle}">` : ''}
        <h2 class="modal-title">${data.title}</h2>
        <span class="modal-org">${data.org}</span>
        <span class="modal-role-badge">${data.role} · ${data.year}</span>
        <ul class="modal-bullets">
          ${data.bullets.map(b => `<li>${b}</li>`).join('')}
        </ul>
        <div class="modal-tags">
          ${data.tags.map(t => `<span class="modal-tag">${t}</span>`).join('')}
        </div>
      </div>
    `;
  }

  function openModal(key) {
    const data    = PROJECT_DATA[key];
    const overlay = document.getElementById('modal-overlay');
    if (!data || !overlay) return;

    overlay.innerHTML = buildModalHTML(data);
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    /* GSAP entrance */
    if (typeof gsap !== 'undefined') {
      gsap.from('.project-modal-inner', {
        opacity: 0, y: 50, scale: 0.96,
        duration: 0.45, ease: 'expo.out',
      });
    }

    /* Close handlers */
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', handleKey);
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    if (typeof gsap !== 'undefined') {
      gsap.to('.project-modal-inner', {
        opacity: 0, y: 30, scale: 0.97,
        duration: 0.3, ease: 'power2.in',
        onComplete() {
          overlay.classList.remove('active');
          overlay.innerHTML = '';
          document.body.style.overflow = '';
        },
      });
    } else {
      overlay.classList.remove('active');
      overlay.innerHTML = '';
      document.body.style.overflow = '';
    }

    document.removeEventListener('keydown', handleKey);
  }

  function handleKey(e) {
    if (e.key === 'Escape') closeModal();
  }

  function initModals() {
    document.querySelectorAll('.project-card[data-modal]').forEach(card => {
      card.addEventListener('click', () => openModal(card.dataset.modal));
    });
  }

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    init3DTilt();
    initReveal();
    initModals();
  });

})();
