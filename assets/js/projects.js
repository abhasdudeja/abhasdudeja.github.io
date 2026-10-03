/* projects.js — Project data, filter system, 3D card tilt, and modal system */

(function () {
  'use strict';

  /* ── Project data ── */
  const PROJECT_DATA = {
    pmebus: {
      title: 'E-Bus Deployment Planning — Gujarat & Chhattisgarh',
      org:   'PM e-Bus Sewa scheme, Government of India — CoEUT – CRDF, CEPT University',
      year:  '2026 – Present',
      role:  'Senior Transport Planner',
      bullets: [
        'Planning the deployment of 1,000+ electric buses across eight cities in Gujarat under the PM e-Bus Sewa scheme.',
        'Fleet sizing, depot and charging infrastructure planning, and operations design for each city.',
        'Consultant to the State of Chhattisgarh on its e-bus deployment under the same scheme.',
        'Direct involvement with the scheme at the Government of India level and with the participating cities.',
      ],
      tags: ['PM e-Bus Sewa', '1,000+ e-Buses', 'Gujarat', 'Chhattisgarh', 'Depot & Charging'],
    },
    bmtc: {
      title: 'Fleet Transition Strategy & EV System Validation',
      org:   'Bangalore Metropolitan Transport Corporation (BMTC) — Microgrid Labs',
      year:  'India',
      role:  'Transportation Lead',
      bullets: [
        'Fleet transition strategy for BMTC\'s 900 electric buses — one of the largest e-bus programmes in India.',
        'Data collection and analysis of routes, schedules and energy demand across the depot network.',
        'Validated the proposed EV system design — chargers, depot power and operating schedules — against real operations.',
        'Capacity building for BMTC officials on electric fleet planning and operations.',
      ],
      tags: ['Fleet Transition', 'EV System Design', '900 e-Buses', 'Capacity Building', 'BMTC'],
    },
    cms: {
      title: 'Charge, Energy & Depot Management Deployments',
      org:   'Green Cell Mobility · Tata Motors / Smart City Mobility Ltd · Kerala SRTC · Transvolt Mobility — Microgrid Labs',
      year:  'India',
      role:  'Transportation Lead',
      bullets: [
        'Green Cell Mobility: Charge Management System across 20+ depots and 300+ e-buses.',
        'Tata Motors – Smart City Mobility Ltd: Charge Management and Depot Management for 1000+ e-buses.',
        'Kerala State RTC: fleet and cost optimisation plus Depot Management for 160+ e-buses.',
        'Transvolt Mobility: Charge, Energy and Depot Management at multiple sites — 300+ e-buses and 150+ e-trucks.',
      ],
      tags: ['CSMS', 'EMS', 'Depot Management', '1,700+ e-Buses', 'e-Trucks'],
    },
    torino: {
      title: 'Fleet Transition Plan — Torino',
      org:   'Torino, Italy — Microgrid Labs',
      year:  'Italy',
      role:  'Transport Planner & Analyst',
      bullets: [
        'Prepared the Fleet Transition Plan for Torino\'s bus operations.',
        'EV system design — fleet, charging and depot energy — for the transition scenarios.',
        'Validated the system design against route and schedule data.',
      ],
      tags: ['Fleet Transition', 'EV System Design', 'Europe'],
    },
    everett: {
      title: 'Fleet Transition Plan — Everett, WA',
      org:   'Everett, Washington, USA — Microgrid Labs',
      year:  'USA',
      role:  'Transport Planner & Analyst',
      bullets: [
        'Prepared the Fleet Transition Plan for Everett\'s transit fleet.',
        'Data cleaning and analysis of operations and energy requirements.',
        'Assessment and validation of the proposed EV system design.',
      ],
      tags: ['Fleet Transition', 'Data Analysis', 'US Transit'],
    },
    davao: {
      title: 'Depot & Terminal Design — Davao',
      org:   'Davao Public Transport Modernization Project, Philippines — Microgrid Labs',
      year:  'Philippines',
      role:  'Transport Planner & Analyst',
      bullets: [
        'Depot design for five sites: Buhangin, Sasa, Sto. Niño, Calinan and Toril.',
        'Terminal design for Bunawan and Calinan.',
        'Layouts sized for electric bus operations, charging and circulation under the modernisation programme.',
      ],
      tags: ['Depot Design', 'Terminal Design', 'Electric Bus', 'Southeast Asia'],
    },
    evopt: {
      title: 'EVopt Platform Suite — Product Development',
      org:   'Microgrid Labs',
      year:  'Product',
      role:  'Team Lead',
      bullets: [
        'Led a team to conceptualise, plan, develop and test a multi-tenant Charging Station Management System (CSMS).',
        'Energy Management (EMS) and Depot Management (DMS) modules and e-mobility dashboards.',
        'Tools and code integrated into the EVopt platform suite used on client deployments.',
      ],
      tags: ['CSMS', 'EMS', 'DMS', 'Product', 'Dashboards'],
    },
    himachal: {
      title: 'Urban Roads Improvement Plan — Himachal Pradesh',
      org:   'Six district headquarters — L&T Infrastructure Engineering',
      year:  '2021 – 2022',
      role:  'Post Graduate Engineer Trainee',
      bullets: [
        'Analysis of primary and secondary traffic and transportation data for six district headquarters.',
        'Stakeholder consultations on traffic and transportation proposals.',
        'Design of terminals and parking strategies following stakeholder discussions.',
      ],
      tags: ['Urban Roads', 'Terminal Design', 'Parking', 'Stakeholders'],
    },
    kalpasar: {
      title: 'Kalpasar Dam — Rail, Road & Bridge Components',
      org:   'Gujarat — L&T Infrastructure Engineering',
      year:  '2021 – 2022',
      role:  'Post Graduate Engineer Trainee',
      bullets: [
        'Primary and secondary data collection strategy and analysis.',
        'Trip generation and willingness-to-pay assessment.',
        'Overall transport demand assessment for the dam project\'s rail, road and bridge links.',
      ],
      tags: ['Demand Assessment', 'Willingness to Pay', 'Trip Generation'],
    },
    dnic: {
      title: 'Delhi–Nagpur Industrial Corridor — Perspective Plan',
      org:   'L&T Infrastructure Engineering',
      year:  '2021 – 2022',
      role:  'Post Graduate Engineer Trainee',
      bullets: [
        'Primary and secondary data collection strategy and analysis.',
        'Identification and assessment of transportation demand for the nodes planned along the corridor.',
      ],
      tags: ['Industrial Corridor', 'Demand Assessment', 'Perspective Plan'],
    },
    sscl: {
      title: 'Public Transport & Electric Bus Operations',
      org:   'Silvassa Smart City Ltd (SSCL)',
      year:  'May – Nov 2021',
      role:  'Intern · Public Transport Operations In-Charge',
      logo:  'assets/img/sscl.jpg',
      logoStyle: 'object-fit:cover;border-radius:8px;',
      bullets: [
        'In charge of day-to-day public transport operations for the Smart City programme.',
        'Assessed route feasibility and charging infrastructure requirements for e-bus deployment.',
        'Analysed ridership data to size the electric fleet.',
        'Advised on charging-station placement and overnight depot charging strategies.',
      ],
      tags: ['Electric Bus', 'Operations', 'Fleet Sizing', 'Charging Infrastructure'],
    },
    volvo: {
      title: 'Inter-city Coach Market Research',
      org:   'Volvo Buses India Pvt. Ltd.',
      year:  'May – Jul 2019',
      role:  'Intern',
      logo:  'assets/img/volvo-buses.jpg',
      logoStyle: 'object-fit:cover;border-radius:8px;',
      bullets: [
        'Market research on inter-city Volvo coach services across key corridors.',
        'Designed and ran user-perception surveys on long-distance routes.',
        'Analysed brand standardisation opportunities across Volvo\'s operator network.',
        'Benchmarked service quality against competing coach operators.',
      ],
      tags: ['Intercity', 'Market Research', 'User Perception', 'Brand Standardisation'],
    },
    surat: {
      title: 'CityBus & BRT Service-Level Benchmarking',
      org:   'Surat Sitilink Ltd',
      year:  '2017',
      role:  'Research Intern',
      bullets: [
        'Monitored CityBus operations and route performance for Surat Sitilink (BRTS).',
        'Primary surveys for service-level benchmarking across corridors.',
        'Addressed fare slippage, bus maintenance and operational concerns.',
        'Technical support to Surat Municipal Corporation on service improvements.',
      ],
      tags: ['BRT', 'Benchmarking', 'Surveys', 'Public Transport'],
    },
  };

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof gsap !== 'undefined' && !reduced;

  const esc = str => String(str).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));

  /* ── Filter system ── */
  function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const cards      = document.querySelectorAll('.project-card');

    filterBtns.forEach(btn => {
      btn.setAttribute('aria-pressed', String(btn.classList.contains('active')));

      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });

        const filter = btn.dataset.filter;
        cards.forEach(card => {
          const show = filter === 'all' || card.dataset.category === filter;

          if (!hasGsap) {
            card.style.display = show ? '' : 'none';
            return;
          }

          gsap.killTweensOf(card);
          if (show) {
            card.style.display = '';
            gsap.to(card, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
          } else {
            /* Remove from layout once faded so the grid closes up */
            gsap.to(card, {
              autoAlpha: 0, scale: 0.92, duration: 0.3, ease: 'power2.in',
              onComplete() { card.style.display = 'none'; },
            });
          }
        });

        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  }

  /* ── 3D card tilt on hover ── */
  function init3DTilt() {
    if (!hasGsap) return;
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('mousemove', e => {
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
        gsap.to(card, {
          rotateY: 0, rotateX: 0, scale: 1,
          duration: 0.45, ease: 'elastic.out(1, 0.55)',
        });
      });
    });
  }

  /* ── ScrollTrigger batch reveal ── */
  function initReveal() {
    if (!hasGsap || typeof ScrollTrigger === 'undefined') return;

    ScrollTrigger.batch('.project-card', {
      onEnter: batch => gsap.from(batch, {
        opacity: 0, duration: 0.45,
        stagger: 0.05, ease: 'power2.out',
      }),
      start: 'top 82%',
    });
  }

  /* ── Modal system ── */
  function buildModalHTML(data) {
    const logoStyle = data.logoStyle || 'object-fit:contain;';
    return `
      <div class="project-modal-inner" data-lenis-prevent>
        <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>
        ${data.logo ? `<img src="${esc(data.logo)}" alt="${esc(data.org)}" class="modal-logo" style="${logoStyle}">` : ''}
        <h2 class="modal-title" id="modal-title">${esc(data.title)}</h2>
        <span class="modal-org">${esc(data.org)}</span>
        <span class="modal-role-badge">${esc(data.role)} · ${esc(data.year)}</span>
        <ul class="modal-bullets">
          ${data.bullets.map(b => `<li>${esc(b)}</li>`).join('')}
        </ul>
        <div class="modal-tags">
          ${data.tags.map(t => `<span class="modal-tag">${esc(t)}</span>`).join('')}
        </div>
      </div>
    `;
  }

  let lastFocus = null;

  function setPageLocked(locked) {
    document.body.style.overflow = locked ? 'hidden' : '';
    if (window.lenis) locked ? window.lenis.stop() : window.lenis.start();
  }

  function openModal(key) {
    const data    = PROJECT_DATA[key];
    const overlay = document.getElementById('modal-overlay');
    if (!data || !overlay) return;

    lastFocus = document.activeElement;
    overlay.innerHTML = buildModalHTML(data);
    overlay.setAttribute('aria-labelledby', 'modal-title');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('active');
    setPageLocked(true);

    const closeBtn = document.getElementById('modal-close-btn');
    closeBtn.focus();

    if (hasGsap) {
      gsap.from('.project-modal-inner', {
        opacity: 0, y: 50, scale: 0.96,
        duration: 0.45, ease: 'expo.out',
      });
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', onOverlayClick);
    document.addEventListener('keydown', handleKey);
  }

  function onOverlayClick(e) {
    if (e.target === e.currentTarget) closeModal();
  }

  function finishClose(overlay) {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.removeAttribute('aria-labelledby');
    overlay.innerHTML = '';
    setPageLocked(false);
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    lastFocus = null;
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay || !overlay.classList.contains('active')) return;

    document.removeEventListener('keydown', handleKey);
    overlay.removeEventListener('click', onOverlayClick);

    if (hasGsap) {
      gsap.to('.project-modal-inner', {
        opacity: 0, y: 30, scale: 0.97,
        duration: 0.3, ease: 'power2.in',
        onComplete: () => finishClose(overlay),
      });
    } else {
      finishClose(overlay);
    }
  }

  /* Escape closes; Tab is kept inside the dialog */
  function handleKey(e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;

    const overlay    = document.getElementById('modal-overlay');
    const focusables = overlay.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;

    const first = focusables[0];
    const last  = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    } else if (!overlay.contains(document.activeElement)) {
      e.preventDefault(); first.focus();
    }
  }

  function initModals() {
    document.querySelectorAll('.project-card[data-modal]').forEach(card => {
      const title = card.querySelector('h3')?.textContent.trim() || 'project';
      const org   = card.querySelector('.project-card-body p')?.textContent.trim() || '';

      /* Cards are div-based for layout; expose them as buttons */
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-haspopup', 'dialog');
      card.setAttribute('aria-label', `${title}, ${org}. View details`);

      card.addEventListener('click', () => openModal(card.dataset.modal));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(card.dataset.modal);
        }
      });
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
