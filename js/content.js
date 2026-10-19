/**
 * ============================================================
 *  CONTENT.JS — EDIT THIS FILE TO MAKE THE PORTFOLIO YOURS
 * ------------------------------------------------------------
 *  Every piece of text, every link, every chapter of the
 *  journey lives here. Change the values, save, refresh.
 *  You never need to touch the engine code.
 * ============================================================
 */

export const SITE = {
  title: 'Rayan Ahmed — Creative Web Engineer',
  shortTitle: 'Rayan Ahmed',
  role: 'Creative Web Engineer',
  city: 'Lahore → The World',
  email: 'hello@rayanahmed.dev',
  tagline: 'I design & engineer cinematic experiences for the web.',
  // One line shown next to the loader counter
  bootLine: 'A scroll-driven journey through my world',
  scrollHint: 'Scroll to ride',
  soundNote: 'Best experienced with sound on',
  desktopNote: 'Switch to desktop for the full ride',
  availability: 'Open for freelance & full-time — Winter 2026',
  footerNote: 'Designed & coded by hand. No templates were harmed.',
  year: new Date().getFullYear(),
};

/* ------------------------------------------------------------
 * Social / profile links — replace with your own URLs
 * ---------------------------------------------------------- */
export const LINKS = [
  { label: 'GitHub', url: 'https://github.com/your-username' },
  { label: 'LinkedIn', url: 'https://linkedin.com/in/your-username' },
  { label: 'X / Twitter', url: 'https://x.com/your-username' },
  { label: 'Dribbble', url: 'https://dribbble.com/your-username' },
];

/* ------------------------------------------------------------
 * THE JOURNEY — story chapters shown while riding.
 * `at`  → scroll progress where the chapter appears (0 → 1)
 * `dur` → how long (in scroll progress) it stays fully visible
 * Keep these in sync with the camera keyframes in scene.js
 * ---------------------------------------------------------- */
export const CHAPTERS = [
  {
    id: 'origin',
    at: 0.115, dur: 0.085,
    kicker: 'Chapter 01 — The Descent',
    title: 'Every story starts\nwith a leap.',
    body: 'Mine began with a dial-up tone, a borrowed PC and the "View Source" menu. I fell in love with the web before I even knew what to call it — so I jumped.',
  },
  {
    id: 'designer',
    at: 0.295, dur: 0.09,
    kicker: 'Chapter 02 — The Designer Years',
    title: 'First, pixels\ntaught me taste.',
    body: 'Posters, interfaces, brand systems at 3 a.m. Design school of the internet: grids, typography, and the discipline of deleting your favourite idea.',
  },
  {
    id: 'developer',
    at: 0.435, dur: 0.09,
    kicker: 'Chapter 03 — The Developer Decade',
    title: 'Then code\ntaught me craft.',
    body: 'JavaScript was my gateway drug. Front-end, back-end, APIs, deploys on Fridays I regret nothing. Shipping things real people touch never gets old.',
  },
  {
    id: 'engineer',
    at: 0.585, dur: 0.09,
    kicker: 'Chapter 04 — The Engineer Today',
    title: 'Now, I build\nworlds that move.',
    body: 'WebGL, shaders, motion systems, design engineering. The sweet spot where engineering rigor meets cinema. That intersection is where I live.',
    flip: true,
  },
  {
    id: 'dusk',
    at: 0.775, dur: 0.08,
    kicker: 'Golden Hour — The Philosophy',
    title: 'Details aren’t details.\nThey’re the product.',
    body: 'A 60fps ease curve. A loader that respects your time. Sound you can feel. I sweat the invisible 10% — because that’s the part people remember.',
    flip: true,
  },
];

/* ------------------------------------------------------------
 * SKILLS — grouped capability list (sky-terrace section)
 * ---------------------------------------------------------- */
export const SKILLS = {
  kicker: 'Mid-ride pit stop',
  title: 'What I bring\nto the handlebars.',
  groups: [
    {
      name: 'Creative Front-End',
      items: ['Three.js / WebGL', 'GLSL Shaders', 'GSAP / Motion', 'Canvas & SVG', 'React / Next.js'],
    },
    {
      name: 'Engineering',
      items: ['TypeScript', 'Node.js & APIs', 'Performance Budgets', 'CI/CD & Cloud', 'Testing that sticks'],
    },
    {
      name: 'Design & Direction',
      items: ['Design Systems', 'Art Direction', 'Figma → Production', 'Typography', 'Prototyping'],
    },
    {
      name: 'Leadership',
      items: ['Project Management', 'Mentoring', 'Client Whispering', 'Roadmapping', 'Shipping Culture'],
    },
  ],
};

/* ------------------------------------------------------------
 * WORKS — selected projects. Replace with your real ones.
 * accent colors drive each card’s glow + 3D billboard.
 * ---------------------------------------------------------- */
export const WORKS = {
  kicker: 'Selected Work — 2022 → 2026',
  title: 'Things I’ve shipped\nthat I’m proud of.',
  list: [
    {
      id: 'pulsewave',
      index: '01',
      name: 'Pulsewave',
      kind: 'Realtime Audio Visualizer',
      year: '2026',
      role: 'Design & Development',
      stack: ['WebAudio', 'WebGL', 'Svelte'],
      blurb: 'Turns any track into a living light-show. FFT analysis driving 200k particles at a steady 60fps — featured in three newsletters I actually read.',
      accent: '#7c5cff',
      url: '#',
    },
    {
      id: 'atlas',
      index: '02',
      name: 'Atlas CMS',
      kind: 'Headless Content Platform',
      year: '2025',
      role: 'Lead Front-End Engineer',
      stack: ['Next.js', 'GraphQL', 'Postgres'],
      blurb: 'A publishing platform for a media startup with 40 editors. Cut content time-to-publish from days to minutes. Still running, still no 3 a.m. phone calls.',
      accent: '#00c2a8',
      url: '#',
    },
    {
      id: 'terra',
      index: '03',
      name: 'Terra Configurator',
      kind: '3D Product Customizer',
      year: '2024',
      role: 'Creative Developer',
      stack: ['Three.js', 'React', 'Shopify'],
      blurb: 'Furniture you can spin, re-fabric and re-light in the browser. Conversion up 38%. The client framed the analytics screenshot. True story.',
      accent: '#ff7a3d',
      url: '#',
    },
    {
      id: 'nightline',
      index: '04',
      name: 'Nightline',
      kind: 'Transit Data Story',
      year: '2023',
      role: 'Design Engineering',
      stack: ['D3.js', 'MapboxGL', 'Vite'],
      blurb: 'An interactive documentary about a city after midnight — 1.2M rides visualized as one continuous neon river. My favourite kind of homework.',
      accent: '#ff4d8d',
      url: '#',
    },
  ],
};

/* ------------------------------------------------------------
 * ARRIVAL — the final call-to-action at the tower plaza
 * ---------------------------------------------------------- */
export const CONTACT = {
  kicker: 'Final Stop — The Tower',
  title: 'Let’s build\nsomething rare.',
  body: 'A portfolio is just a trailer. If you like the ride, wait till you see what we could build together. My inbox is open — tell me about your impossible idea.',
  cta: 'Start a conversation',
};

/* ------------------------------------------------------------
 * MENU — fullscreen navigation (label → scroll target)
 * targets: 0 = very top … 1 = very bottom
 * ---------------------------------------------------------- */
export const MENU = [
  { label: 'Intro', target: 0.0, hint: 'Start the ride' },
  { label: 'The Story', target: 0.12, hint: 'Four chapters' },
  { label: 'Skills', target: 0.655, hint: 'The toolkit' },
  { label: 'Work', target: 0.71, hint: 'Selected projects' },
  { label: 'Contact', target: 0.93, hint: 'Say hello' },
];

/* Footer marquee words */
export const MARQUEE = ['Let’s work together', 'Available worldwide', 'Cinematic web', '60fps or nothing'];
