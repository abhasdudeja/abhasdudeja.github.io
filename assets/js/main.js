/* main.js — Navbar toggle (mobile) + smooth anchor scrolling */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {

    /* ── Mobile nav toggle ── */
    const toggle  = document.getElementById('nav-toggle');
    const navList = document.getElementById('nav-links');

    if (toggle && navList) {
      toggle.addEventListener('click', () => {
        const open = toggle.classList.toggle('open');
        navList.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        document.body.style.overflow = open ? 'hidden' : '';
      });

      /* Close mobile menu on link click */
      navList.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          toggle.classList.remove('open');
          navList.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        });
      });

      /* Close on outside click */
      document.addEventListener('click', e => {
        if (navList.classList.contains('open') &&
            !navList.contains(e.target) &&
            !toggle.contains(e.target)) {
          toggle.classList.remove('open');
          navList.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });
    }

    /* ── Smooth anchor scroll (fallback for non-GSAP scrollTo) ── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', e => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

  });

})();
