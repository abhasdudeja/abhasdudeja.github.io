# Abhas Dudeja — Portfolio

Personal portfolio for an Urban & Transport Planner / Data Analyst / GIS & EV fleet specialist, hosted on GitHub Pages: https://abhasdudeja.github.io

## Structure

```
.
├── index.html          # Single-page site (hero, about, skills, experience, projects, contact)
├── projects.html       # Redirect stub to index.html#projects
├── favicon.svg
└── assets/
    ├── css/            # theme-tokens.css (design tokens), custom.css
    ├── js/             # hero-scene (Three.js), animations (GSAP/Lenis), timeline, skills (Chart.js), projects (filters + modals), main (nav)
    ├── img/            # logos, photos, og-image.png
    └── fonts/          # Font Awesome 5 (icons)
```

## Stack

Plain HTML/CSS/JS, no build step. Libraries load from jsDelivr: Three.js, GSAP (ScrollTrigger, TextPlugin, MotionPathPlugin), Lenis, SplitType, Chart.js. Icons: Font Awesome 5 (local). Fonts: Google Fonts.

## Local development

```bash
python -m http.server 8000
```

## Deployment

GitHub Pages serves the `main` branch automatically.

## Contact

[LinkedIn](https://www.linkedin.com/in/abhasdudeja) · abhasdudeja.planner@gmail.com

© Abhas Dudeja
