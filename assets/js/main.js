/* main.js — Navbar toggle (mobile) + smooth anchor scrolling */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Mobile nav toggle ── */
    const toggle  = document.getElementById('nav-toggle');
    const navList = document.getElementById('nav-links');

    if (toggle && navList) {
      const isOpen = () => navList.classList.contains('open');

      const setMenu = open => {
        toggle.classList.toggle('open', open);
        navList.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
        if (window.lenis) open ? window.lenis.stop() : window.lenis.start();
      };

      toggle.addEventListener('click', () => setMenu(!isOpen()));

      /* Close mobile menu on link click */
      navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setMenu(false));
      });

      /* Close on outside click or Escape */
      document.addEventListener('click', e => {
        if (isOpen() && !navList.contains(e.target) && !toggle.contains(e.target)) setMenu(false);
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && isOpen()) { setMenu(false); toggle.focus(); }
      });
    }

    /* ── Smooth anchor scroll — Lenis if available, native fallback ── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (!target) return;
        e.preventDefault();

        if (window.lenis && !reduced) {
          window.lenis.scrollTo(target, {
            offset:   0,
            duration: 1.2,
            easing:   (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        } else {
          target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
        }
      });
    });

  });

})();
