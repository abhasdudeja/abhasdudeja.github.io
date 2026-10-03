/* animations.js — GSAP + ScrollTrigger boot sequence for all sections */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {

    /* ── Guard: don't run heavy animations on reduced-motion ── */
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.registerPlugin(ScrollTrigger, TextPlugin, MotionPathPlugin);

    /* Years of experience, counted from the first full-time role */
    document.querySelectorAll('.stat-number[data-since]').forEach(el => {
      const months = (Date.now() - new Date(el.dataset.since)) / (365.25 * 864e5 / 12);
      el.dataset.target = Math.max(1, Math.round(months / 12));
    });

    /* ====================================================
       LENIS — smooth scroll, driven by GSAP ticker
       ==================================================== */
    function initLenis() {
      if (typeof Lenis === 'undefined') return null;

      const lenis = new Lenis({
        duration:        1.15,
        easing:          (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel:     true,
        smoothTouch:     false,   // keep native momentum on touch/mobile
        wheelMultiplier: 1.0,
        touchMultiplier: 2.0,
        infinite:        false,
      });

      /* Drive Lenis through GSAP's ticker so ScrollTrigger stays perfectly
         in sync — no double-RAF, no drift on pinned sections               */
      gsap.ticker.add((time) => { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);          // prevent large time-steps glitch

      /* Notify ScrollTrigger on every Lenis scroll frame */
      lenis.on('scroll', ScrollTrigger.update);

      /* Expose globally so other modules (main.js, scroll-top) can use it */
      window.lenis = lenis;

      return lenis;
    }

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
      const scene    = window.heroScene;          // null when the WebGL scene is unavailable
      const hasSplit = typeof SplitType !== 'undefined';
      const tl       = gsap.timeline({ delay: 0.15 });

      /* ── 1. Scene boot: camera sweeps in while the grid reveals and routes draw on ── */
      if (scene) {
        tl.to(scene.state, { intro: 1, duration: 3.2, ease: 'none' }, 0);   // scene eases internally
      }
      tl.fromTo('.hero-overlay', { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out' }, 0);

      /* ── 2. Eyebrow: letters flip in ── */
      const TEXT_AT = scene ? 0.9 : 0.1;
      gsap.set('.hero-eyebrow', { opacity: 1 });
      if (hasSplit) {
        const eyebrow = new SplitType('.hero-eyebrow', { types: 'chars' });
        tl.from(eyebrow.chars, {
          opacity: 0, y: 24, rotateX: -90, transformOrigin: 'top center',
          duration: 0.55, stagger: 0.02, ease: 'back.out(2)',
        }, TEXT_AT);
      } else {
        tl.from('.hero-eyebrow', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' }, TEXT_AT);
      }

      /* ── 3. Title: letters rise from below with a glow flash ── */
      let titleChars = null;
      if (hasSplit) {
        titleChars = new SplitType('#hero-title', { types: 'chars' }).chars;
        tl.from(titleChars, {
          opacity: 0, y: 70, rotateX: 40, scale: 0.7, filter: 'blur(8px)',
          duration: 0.9, stagger: 0.04, ease: 'expo.out',
        }, TEXT_AT + 0.25);
        tl.fromTo(titleChars,
          { textShadow: '0 0 40px rgba(0,212,255,0.9)' },
          { textShadow: '0 0 0px rgba(0,212,255,0)', duration: 1.2, stagger: 0.04, ease: 'power2.out' },
          TEXT_AT + 0.6);
      } else {
        tl.from('#hero-title', { opacity: 0, y: 40, duration: 0.8, ease: 'expo.out' }, TEXT_AT + 0.25);
      }

      /* ── 4. Typewriter subtitle ── */
      const subtitle = document.getElementById('hero-typewriter');
      const subtitleText = subtitle.textContent;
      subtitle.textContent = '';
      tl.to(subtitle, {
        duration: 2.6, ease: 'none',
        text: { value: subtitleText, delimiter: '' },
      }, TEXT_AT + 0.9);

      /* ── 5. CTA buttons + stat cards ── */
      tl.from('.hero-cta a', {
        opacity: 0, y: 28, duration: 0.55, stagger: 0.14, ease: 'power3.out',
      }, TEXT_AT + 1.3);

      tl.from('.stat-card', {
        opacity: 0, y: 24, scale: 0.9, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)',
      }, TEXT_AT + 1.6);

      tl.from('.scroll-indicator', { opacity: 0, y: 10, duration: 0.8 }, TEXT_AT + 2.4);

      /* If animation frames are frozen (hidden tab, embedded preview, throttled browser),
         don't leave the hero half-hidden: jump straight to the finished state. */
      setTimeout(() => { if (gsap.ticker.time < 0.5) tl.progress(1); }, 2500);

      /* ── 6. Scroll journey: the hero pins and scrolling drives the fleet (hero-scene.js).
            Progress 0 → 1 over ~6 screens; text stays while the fleet runs, then lifts
            away in layers as the camera pulls back to reveal the whole network. ── */
      const journeyFill   = document.getElementById('journey-fill');
      const journeyStops  = document.querySelectorAll('.hero-journey li');
      const PIN_DISTANCE  = scene ? '+=600%' : '+=0%';

      const out = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero', start: 'top top', end: PIN_DISTANCE, scrub: 0.8,
          pin: !!scene, anticipatePin: 1,
          refreshPriority: 1,   // measure this pin first — the timeline pin below depends on its spacer
          onUpdate(self) {
            const p = self.progress;
            if (scene) scene.setScroll(p);
            if (journeyFill) journeyFill.style.transform = `scaleX(${p})`;
            journeyStops.forEach(li => li.classList.toggle('active', p >= parseFloat(li.dataset.at)));
          },
        },
      });
      /* Hero stats count up with scroll progress (scrubbed, so they run back down in reverse).
         Without the pinned scene there is no scroll journey, so show the final values. */
      document.querySelectorAll('.stat-number').forEach((el, i) => {
        const target = parseInt(el.dataset.target, 10);
        const fmt    = n => Math.round(n).toLocaleString('en-IN');
        if (!scene) { el.textContent = fmt(target); return; }
        const val = { n: 0 };
        out.to(val, {
          n: target, ease: 'none', duration: 0.5,
          onUpdate() { el.textContent = fmt(val.n); },
        }, 0.02 + i * 0.03);
      });
      window.heroJourney = out;   // handy for debugging: heroJourney.progress(0.5)
      out
        .to('.scroll-indicator', { opacity: 0, ease: 'none', duration: 0.08 }, 0)
        .to('.hero-eyebrow',     { y: -70,  opacity: 0, ease: 'none', duration: 0.3 }, 0.6)
        .to('#hero-title',       { y: -110, scale: 0.92, opacity: 0, ease: 'none', duration: 0.3 }, 0.62)
        .to('#hero-typewriter',  { y: -90,  opacity: 0, ease: 'none', duration: 0.3 }, 0.64)
        .to('.hero-cta',         { y: -70,  opacity: 0, ease: 'none', duration: 0.3 }, 0.66)
        .to('.hero-stats',       { y: -50,  opacity: 0, ease: 'none', duration: 0.3 }, 0.68)
        .to('.hero-overlay',     { opacity: 0.35, ease: 'none', duration: 0.4 }, 0.6);

      /* ── 7. Pointer: content tilts, scene parallaxes, letters lift near the cursor ── */
      if (window.matchMedia('(hover: hover)').matches) {
        const tiltX = gsap.quickTo('.hero-content', 'rotateX', { duration: 0.8, ease: 'power3.out' });
        const tiltY = gsap.quickTo('.hero-content', 'rotateY', { duration: 0.8, ease: 'power3.out' });
        const charY = titleChars ? titleChars.map(c => gsap.quickTo(c, 'y', { duration: 0.35, ease: 'power2.out' })) : [];
        let rafPending = false, lastEvent = null;

        document.addEventListener('mousemove', e => {
          lastEvent = e;
          if (rafPending) return;
          rafPending = true;
          requestAnimationFrame(() => {
            rafPending = false;
            const px = (lastEvent.clientX / window.innerWidth  - 0.5) * 2;
            const py = (lastEvent.clientY / window.innerHeight - 0.5) * 2;
            if (scene) scene.setPointer(px, py);
            tiltY(px * 4);
            tiltX(-py * 4);

            /* magnetic letters: lift within ~140px of the cursor */
            titleChars && titleChars.forEach((c, i) => {
              const r  = c.getBoundingClientRect();
              const dx = lastEvent.clientX - (r.left + r.width / 2);
              const dy = lastEvent.clientY - (r.top  + r.height / 2);
              const d  = Math.hypot(dx, dy);
              charY[i](d < 140 ? -(1 - d / 140) * 14 : 0);
            });
          });
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

      gsap.from('#profile-img', {
        opacity: 0, scale: 0.8, rotation: -8, duration: 1.1, ease: 'elastic.out(1, 0.55)',
        scrollTrigger: { trigger: '#about', start: 'top 72%' },
      });

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

      /* Hover bounce (pointer devices only) */
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
        if (window.lenis) {
          window.lenis.scrollTo(0, {
            duration: 1.4,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        } else {
          window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
        }
      });
    }

    /* Reduced motion: show everything in its final state, no scroll effects */
    function initStatic() {
      gsap.set('.hero-eyebrow', { opacity: 1 });
      document.querySelectorAll('.stat-number').forEach(el => {
        el.textContent = el.dataset.target;
      });
    }

    /* ── Boot sequence ── */
    if (reduced) {
      initStatic();
      initNav();
      initScrollTop();
    } else {
      initLenis();        // ← must be first so ScrollTrigger fires through Lenis
      initHero();
      initAbout();
      initSkills();
      initContact();
      initNav();
      initScrollTop();
    }

    const yr = document.getElementById('footer-year');
    if (yr) yr.textContent = new Date().getFullYear();

    /* Refresh after all fonts/images/layout settle */
    window.addEventListener('load', () => ScrollTrigger.refresh());

  });

})();
