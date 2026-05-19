/* animations.js — GSAP + ScrollTrigger boot sequence for all sections */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {

    /* ── Guard: don't run heavy animations on reduced-motion ── */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.registerPlugin(ScrollTrigger, TextPlugin, MotionPathPlugin);

    /* ── Shared: section-label + title reveal helper ── */
    function revealHeading(section) {
      gsap.from(section.querySelector('.section-label'), {
        opacity: 0, x: -40, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 78%' }
      });
      const title = section.querySelector('.section-title');
      if (title) {
        gsap.from(title, {
          opacity: 0, y: 35, duration: 0.8, ease: 'expo.out', delay: 0.1,
          scrollTrigger: { trigger: section, start: 'top 78%' }
        });
      }
    }

    /* ====================================================
       HERO — runs immediately on load
       ==================================================== */
    function initHero() {
      const tl = gsap.timeline({ delay: 0.2 });

      /* Eyebrow */
      if (typeof SplitType !== 'undefined') {
        const eyebrow = new SplitType('.hero-eyebrow', { types: 'chars' });
        gsap.set('.hero-eyebrow', { opacity: 1 });
        tl.from(eyebrow.chars, {
          opacity: 0, y: 24, rotateX: -90, transformOrigin: 'top center',
          duration: 0.55, stagger: 0.025, ease: 'back.out(2)'
        });
      } else {
        tl.from('.hero-eyebrow', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' });
        gsap.set('.hero-eyebrow', { opacity: 1 });
      }

      /* Title */
      if (typeof SplitType !== 'undefined') {
        const title = new SplitType('#hero-title', { types: 'chars' });
        tl.from(title.chars, {
          opacity: 0, y: 55, scale: 0.6,
          duration: 0.75, stagger: 0.035, ease: 'expo.out',
        }, '-=0.25');
      } else {
        tl.from('#hero-title', { opacity: 0, y: 40, duration: 0.8, ease: 'expo.out' }, '-=0.25');
      }

      /* Typewriter subtitle */
      if (!reduced) {
        tl.to('#hero-typewriter', {
          duration: 2.8,
          text: { value: 'Transport Planner · Data Analyst · GIS Enthusiast · EV Specialist', delimiter: '' },
          ease: 'none',
        }, '-=0.15');
      } else {
        document.getElementById('hero-typewriter').textContent =
          'Transport Planner · Data Analyst · GIS Enthusiast · EV Specialist';
      }

      /* CTA buttons */
      tl.from('.hero-cta a', {
        opacity: 0, y: 28, duration: 0.55,
        stagger: 0.14, ease: 'power3.out',
      }, '-=1.8');

      /* Stat cards */
      tl.from('.stat-card', {
        opacity: 0, y: 20, scale: 0.9, duration: 0.5,
        stagger: 0.1, ease: 'back.out(1.5)',
      }, '-=1.6');

      /* Counter animation */
      document.querySelectorAll('.stat-number').forEach(el => {
        const target = parseInt(el.dataset.target, 10);
        tl.from({}, { // dummy tween so we can use onUpdate
          duration: 0, onComplete() {
            gsap.to(el, {
              textContent: target, duration: 1.8, ease: 'power2.out',
              snap: { textContent: 1 },
              onUpdate() { el.textContent = Math.round(parseFloat(el.textContent)); }
            });
          }
        }, '-=1.4');
      });

      /* Scroll-line pulse */
      if (!reduced) {
        gsap.to('.scroll-line', {
          scaleY: 0, transformOrigin: 'top center',
          duration: 1.1, repeat: -1, ease: 'power2.in',
          onRepeat() { gsap.set('.scroll-line', { scaleY: 1 }); }
        });
      }
    }

    /* ====================================================
       ABOUT SECTION
       ==================================================== */
    function initAbout() {
      revealHeading(document.getElementById('about'));

      const aboutST = { trigger: '#about', start: 'top 75%' };

      gsap.from('.about-para', {
        opacity: 0, x: -30, duration: 0.7, stagger: 0.18, ease: 'power3.out',
        scrollTrigger: aboutST,
      });

      gsap.from('.about-tags .tag', {
        opacity: 0, scale: 0.7, duration: 0.4, stagger: 0.06, ease: 'back.out(2)',
        scrollTrigger: { trigger: '#about', start: 'top 68%' },
      });

      gsap.from('#profile-img', {
        opacity: 0, scale: 0.8, rotation: -8, duration: 1.1, ease: 'elastic.out(1, 0.55)',
        scrollTrigger: { trigger: '#about', start: 'top 72%' },
      });

      gsap.from('#skills-radar', {
        opacity: 0, scale: 0.6, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '#about', start: 'top 72%' },
      });

      /* Parallax scrub */
      if (!reduced) {
        gsap.to('.about-text', {
          yPercent: -6, ease: 'none',
          scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1.5 },
        });
        gsap.to('.about-visual', {
          yPercent: 5, ease: 'none',
          scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1.5 },
        });
      }
    }

    /* ====================================================
       SKILLS SECTION
       ==================================================== */
    function initSkills() {
      revealHeading(document.getElementById('skills'));

      /* Hex cells pop in from center */
      gsap.from('.hex-cell', {
        opacity: 0, scale: 0, rotation: 25,
        duration: 0.65, stagger: { amount: 0.7, from: 'center' },
        ease: 'back.out(1.8)',
        scrollTrigger: { trigger: '#skills', start: 'top 68%' },
      });

      /* Fill bars animate up when section enters */
      ScrollTrigger.create({
        trigger: '#skills',
        start: 'top 68%',
        once: true,
        onEnter() {
          document.querySelectorAll('.hex-cell').forEach(cell => {
            const level = cell.dataset.level || '80';
            const fill  = cell.querySelector('.hex-fill');
            if (fill) fill.style.height = level + '%';
          });
        }
      });

      /* Hover bounce */
      document.querySelectorAll('.hex-cell').forEach(cell => {
        cell.addEventListener('mouseenter', () => {
          gsap.to(cell, { scale: 1.12, duration: 0.3, ease: 'back.out(2)' });
        });
        cell.addEventListener('mouseleave', () => {
          gsap.to(cell, { scale: 1, duration: 0.3, ease: 'power3.out' });
        });
      });
    }

    /* ====================================================
       CONTACT SECTION
       ==================================================== */
    function initContact() {
      revealHeading(document.getElementById('contact'));

      gsap.from('.contact-map-wrap', {
        opacity: 0, x: -45, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '#contact', start: 'top 70%' },
      });

      gsap.from('.contact-card', {
        opacity: 0, x: 45, duration: 0.6, stagger: 0.11, ease: 'power3.out',
        scrollTrigger: { trigger: '#contact', start: 'top 68%' },
      });

      /* Hover lift */
      document.querySelectorAll('.contact-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, { y: -5, duration: 0.25, ease: 'power2.out' });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, { y: 0, duration: 0.3, ease: 'power3.out' });
        });
      });
    }

    /* ====================================================
       NAV — scroll-shrink + active section highlight
       ==================================================== */
    function initNav() {
      ScrollTrigger.create({
        start: 'top -60',
        end: 99999,
        toggleClass: { targets: '#main-nav', className: 'scrolled' }
      });

      const sections = document.querySelectorAll('section[id]');
      sections.forEach(section => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top center',
          end: 'bottom center',
          onEnter()      { setActive(section.id); },
          onEnterBack()  { setActive(section.id); },
        });
      });

      function setActive(id) {
        document.querySelectorAll('.nav-links a').forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + id);
        });
      }
    }

    /* ====================================================
       SCROLL-TO-TOP BUTTON
       ==================================================== */
    function initScrollTop() {
      const btn = document.getElementById('scroll-top-btn');
      if (!btn) return;

      ScrollTrigger.create({
        start: 'top -400',
        end: 99999,
        onEnter()     { btn.classList.add('visible'); },
        onLeaveBack() { btn.classList.remove('visible'); },
      });

      btn.addEventListener('click', () => {
        gsap.to(window, { scrollTo: 0, duration: 0.9, ease: 'power3.inOut' });
      });
    }

    /* ── Boot ── */
    initHero();
    initAbout();
    initSkills();
    initContact();
    initNav();
    initScrollTop();

    /* Refresh after all fonts/layout settle */
    window.addEventListener('load', () => ScrollTrigger.refresh());
  });

})();
