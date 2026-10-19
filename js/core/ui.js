/**
 * ui.js — everything DOM that isn't the 3D world:
 * loader choreography, chapter cards, skills & works panels,
 * fullscreen menu, sound button, cookie toast, HUD progress
 * rail and the footer marquee.
 */
import { SITE, LINKS, CHAPTERS, SKILLS, WORKS, CONTACT, MENU, MARQUEE } from '../content.js';

const $ = (sel, el = document) => el.querySelector(sel);
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function createUI({ audio, cursor, scene }) {
  const root = document.documentElement;
  const layer = $('#overlay');

  /* =========================================================
   * BUILD: chapters
   * ======================================================= */
  const chaptersWrap = $('#chapters');
  CHAPTERS.forEach((ch) => {
    const el = document.createElement('section');
    el.className = 'chapter' + (ch.flip ? ' chapter--flip' : '');
    el.dataset.id = ch.id;
    el.innerHTML = `
      <div class="chapter__inner">
        <span class="chapter__kicker">${ch.kicker}</span>
        <h2 class="chapter__title">${ch.title.replace(/\n/g, '<br>')}</h2>
        <p class="chapter__body">${ch.body}</p>
        <span class="chapter__rule" aria-hidden="true"></span>
      </div>`;
    chaptersWrap.appendChild(el);
  });

  /* =========================================================
   * BUILD: skills terrace
   * ======================================================= */
  const skillsEl = $('#skills');
  skillsEl.innerHTML = `
    <div class="panel panel--skills">
      <span class="panel__kicker">${SKILLS.kicker}</span>
      <h2 class="panel__title">${SKILLS.title.replace(/\n/g, '<br>')}</h2>
      <div class="skills-grid">
        ${SKILLS.groups.map((g, i) => `
          <div class="skills-col" style="--i:${i}">
            <h3>${g.name}</h3>
            <ul>${g.items.map((s) => `<li>${s}</li>`).join('')}</ul>
          </div>`).join('')}
      </div>
    </div>`;

  /* =========================================================
   * BUILD: works panels (one per project)
   * ======================================================= */
  const worksWrap = $('#works');
  const worksIntro = document.createElement('section');
  worksIntro.className = 'work-card work-card--intro';
  worksIntro.innerHTML = `
    <div class="work-card__inner">
      <span class="panel__kicker">${WORKS.kicker}</span>
      <h2 class="panel__title">${WORKS.title.replace(/\n/g, '<br>')}</h2>
    </div>`;
  worksWrap.appendChild(worksIntro);

  const workCards = WORKS.list.map((w, i) => {
    const el = document.createElement('section');
    el.className = 'work-card';
    el.style.setProperty('--accent', w.accent);
    el.dataset.cursor = 'View';
    el.innerHTML = `
      <a class="work-card__inner" href="${w.url}" ${w.url === '#' ? 'aria-disabled="true"' : 'target="_blank" rel="noopener"'}>
        <span class="work-card__index">${w.index}</span>
        <h3 class="work-card__name">${w.name}</h3>
        <span class="work-card__kind">${w.kind} · ${w.year}</span>
        <p class="work-card__blurb">${w.blurb}</p>
        <ul class="work-card__stack">${w.stack.map((s) => `<li>${s}</li>`).join('')}</ul>
        <span class="work-card__role">${w.role}</span>
        <span class="work-card__cta">${w.url === '#' ? 'Case study soon' : 'Open project'} →</span>
      </a>`;
    worksWrap.appendChild(el);
    return { el, at: WORK_AT[i], dur: 0.052 };
  });

  /* =========================================================
   * BUILD: arrival / contact
   * ======================================================= */
  const contactEl = $('#contact');
  contactEl.innerHTML = `
    <div class="contact__inner">
      <span class="panel__kicker">${CONTACT.kicker}</span>
      <h2 class="contact__title">${CONTACT.title.replace(/\n/g, '<br>')}</h2>
      <p class="chapter__body">${CONTACT.body}</p>
      <a class="btn btn--big" href="mailto:${SITE.email}?subject=Let%27s%20build%20something" data-cursor="Say hi">
        <span>${CONTACT.cta}</span>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </a>
      <span class="contact__availability">${SITE.availability}</span>
    </div>`;

  /* =========================================================
   * BUILD: footer
   * ======================================================= */
  const footerEl = $('#footer');
  footerEl.innerHTML = `
    <div class="marquee" aria-hidden="true">
      <div class="marquee__track">
        ${Array(2).fill(MARQUEE.map((m) => `<span>${m}</span><i>✦</i>`).join('')).join('')}
      </div>
    </div>
    <div class="footer__content">
      <div class="footer__col footer__col--brand">
        <strong>${SITE.shortTitle}</strong>
        <span>${SITE.role}</span>
        <span>${SITE.city}</span>
      </div>
      <div class="footer__col">
        <h4>Elsewhere</h4>
        ${LINKS.map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join('')}
      </div>
      <div class="footer__col">
        <h4>Contact</h4>
        <a href="mailto:${SITE.email}">${SITE.email}</a>
        <span>${SITE.availability}</span>
      </div>
      <div class="footer__col footer__col--badges">
        <h4>Crafted with</h4>
        <div class="badges">
          <span class="badge">Three.js r160</span>
          <span class="badge">GSAP Motion</span>
          <span class="badge">WebAudio API</span>
          <span class="badge">Zero stock assets</span>
        </div>
      </div>
    </div>
    <div class="footer__base">
      <span>© ${SITE.year} ${SITE.shortTitle}. ${SITE.footerNote}</span>
      <button class="totop" data-cursor="Top">Back to the sky ↑</button>
    </div>`;

  /* =========================================================
   * HUD (chapter name + progress) / header / menu / cookies
   * ======================================================= */
  const hud = $('#hud');
  hud.innerHTML = `
    <span class="hud__chapter"></span>
    <span class="hud__track"><span class="hud__bar"></span></span>
    <span class="hud__pct">000</span>`;
  const hudChapter = $('.hud__chapter', hud);
  const hudBar = $('.hud__bar', hud);
  const hudPct = $('.hud__pct', hud);

  const header = $('#site-header');
  header.innerHTML = `
    <a class="brand" href="#" data-cursor="Top">
      <svg class="brand__mark" viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
        <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" stroke-width="2.6"/>
        <path d="M9 20.5 16 8l7 12.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="16" cy="21.5" r="2.4" fill="currentColor"/>
      </svg>
      <span class="brand__name">${SITE.shortTitle.split(' ')[0]}<em>.folio</em></span>
    </a>
    <div class="header__actions">
      <button class="sound-btn" data-cursor="Sound" aria-pressed="true" aria-label="Toggle sound">
        <span class="sound-btn__bars"><i></i><i></i><i></i><i></i></span>
        <span class="sound-btn__text">Sound</span>
      </button>
      <button class="menu-btn" data-cursor="Menu" aria-expanded="false">
        <span class="menu-btn__text">Menu</span>
        <span class="menu-btn__icon"><i></i><i></i></span>
      </button>
    </div>`;

  const menu = $('#menu');
  menu.innerHTML = `
    <div class="menu__bg"></div>
    <nav class="menu__nav">
      ${MENU.map((m, i) => `
        <a href="#" class="menu__link" data-target="${m.target}" style="--i:${i}">
          <span class="menu__index">0${i + 1}</span>
          <span class="menu__label"><span>${m.label}</span></span>
          <span class="menu__hint">${m.hint}</span>
        </a>`).join('')}
    </nav>
    <div class="menu__foot">
      <a href="mailto:${SITE.email}">${SITE.email}</a>
      <div class="menu__socials">${LINKS.map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.label}</a>`).join('')}</div>
    </div>`;

  const cookie = $('#cookie');
  cookie.innerHTML = `
    <div class="cookie__card">
      <p><strong>Cookies?</strong> Just one tiny one — to remember your sound choice. No tracking, ever.</p>
      <div class="cookie__actions">
        <button class="btn btn--small cookie__accept">Accept</button>
        <button class="btn btn--ghost cookie__decline">Decline</button>
      </div>
    </div>`;

  /* =========================================================
   * STATE + WIRING
   * ======================================================= */
  const menuBtn = $('.menu-btn', header);
  const soundBtn = $('.sound-btn', header);
  let menuOpen = false;
  gsap.set(menu, { clipPath: 'inset(0% 0% 100% 0%)' }); // normalize for smooth tweening

  function toggleMenu(force) {
    menuOpen = typeof force === 'boolean' ? force : !menuOpen;
    root.classList.toggle('menu-open', menuOpen);
    menuBtn.setAttribute('aria-expanded', String(menuOpen));
    gsap.to(menu, {
      clipPath: menuOpen ? 'inset(0% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)',
      duration: 0.9,
      ease: menuOpen ? 'expo.inOut' : 'expo.inOut',
    });
    gsap.fromTo('.menu__link',
      { yPercent: menuOpen ? 120 : 0, opacity: menuOpen ? 0 : 1 },
      { yPercent: 0, opacity: menuOpen ? 1 : 0, duration: 0.7, stagger: menuOpen ? 0.06 : -0.04, ease: 'expo.out', delay: menuOpen ? 0.25 : 0 });
  }
  menuBtn.addEventListener('click', () => { cursor.pulse(); toggleMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) toggleMenu(false); });

  // menu navigation → smooth-scroll to journey point
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('.menu__link');
    if (!link) return;
    e.preventDefault();
    toggleMenu(false);
    const target = parseFloat(link.dataset.target);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    gsap.to({ v: window.scrollY }, {
      v: target * max,
      duration: 2.2,
      ease: 'power2.inOut',
      onUpdate() { window.scrollTo(0, this.targets()[0].v); },
    });
  });

  // brand & to-top
  header.querySelector('.brand').addEventListener('click', (e) => {
    e.preventDefault();
    gsap.to({ v: window.scrollY }, {
      v: 0, duration: 1.6, ease: 'power2.inOut',
      onUpdate() { window.scrollTo(0, this.targets()[0].v); },
    });
  });
  footerEl.addEventListener('click', (e) => {
    if (e.target.closest('.totop')) {
      gsap.to({ v: window.scrollY }, {
        v: 0, duration: 2, ease: 'power2.inOut',
        onUpdate() { window.scrollTo(0, this.targets()[0].v); },
      });
    }
  });

  // sound toggle
  function paintSound() {
    soundBtn.classList.toggle('is-off', !audio.isEnabled());
    soundBtn.setAttribute('aria-pressed', String(audio.isEnabled()));
  }
  soundBtn.addEventListener('click', () => {
    cursor.pulse();
    audio.setEnabled(!audio.isEnabled());
    paintSound();
    try { localStorage.setItem('sp-sound', audio.isEnabled() ? '1' : '0'); } catch {}
  });
  try {
    if (localStorage.getItem('sp-sound') === '0') audio.setEnabled(false);
  } catch {}
  paintSound();

  // cookies
  let cookieSeen = false;
  try { cookieSeen = !!localStorage.getItem('sp-cookie'); } catch {}
  if (!cookieSeen) {
    setTimeout(() => cookie.classList.add('is-visible'), 4000);
  }
  cookie.addEventListener('click', (e) => {
    if (!e.target.closest('button')) return;
    cookie.classList.remove('is-visible');
    try { localStorage.setItem('sp-cookie', '1'); } catch {}
  });

  /* =========================================================
   * PER-FRAME: chapter visibility + HUD + cursor velocity
   * ======================================================= */
  const chapterEls = [...document.querySelectorAll('.chapter')].map((el, i) => ({ el, ...CHAPTERS[i] }));
  const skillsState = { el: skillsEl, at: SKILLS_AT, dur: 0.062 };
  const worksIntroState = { el: worksIntro, at: WORKS_INTRO_AT, dur: 0.04 };
  const contactState = { el: contactEl, at: CONTACT_AT, dur: 0.05 };

  function reveal(el, at, dur, p, extra = {}) {
    // local life: -1 approaching, 0 fully in, +1 leaving
    const lead = 0.028, tail = 0.028;
    const tIn = clamp01((p - at) / lead);
    const tOut = clamp01((p - (at + dur)) / tail);
    const vis = tIn * (1 - tOut);
    if (vis <= 0.001) {
      el.style.visibility = 'hidden';
      return;
    }
    el.style.visibility = 'visible';
    const easeIn = 1 - Math.pow(1 - tIn, 3);
    const easeOut = tOut * tOut;
    const y = (1 - easeIn) * 60 - easeOut * 80;
    const x = (extra.xShift || 0) * (1 - easeIn);
    el.style.opacity = vis.toFixed(3);
    el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${(0.98 + easeIn * 0.02).toFixed(4)})`;
  }

  let hudText = '';
  function hudSet(p) {
    hudBar.style.transform = `scaleY(${p.toFixed(4)})`;
    hudPct.textContent = String(Math.round(p * 100)).padStart(3, '0');
    let label = 'The Descent';
    if (p >= 0.24 && p < 0.62) label = 'The Ride';
    else if (p >= 0.62 && p < 0.7) label = 'The Terrace';
    else if (p >= 0.7 && p < 0.86) label = 'Selected Work';
    else if (p >= 0.86 && p < 0.95) label = 'Golden Hour';
    else if (p >= 0.95) label = 'The Tower';
    if (label !== hudText) {
      hudText = label;
      hudChapter.textContent = label;
      hudChapter.classList.remove('hud__chapter--swap');
      void hudChapter.offsetWidth;
      hudChapter.classList.add('hud__chapter--swap');
    }
    // header contrast: dark sections → light text
    root.classList.toggle('ui-dark', p > 0.78);
    root.classList.toggle('ui-hidden-top', p < 0.015);
  }

  function onFrame(p, vel) {
    chapterEls.forEach((c) => reveal(c.el, c.at, c.dur, p, { xShift: 40 }));
    reveal(skillsState.el, skillsState.at, skillsState.dur, p);
    reveal(worksIntroState.el, worksIntroState.at, worksIntroState.dur, p);
    workCards.forEach((w) => reveal(w.el, w.at, w.dur, p, { xShift: -40 }));
    reveal(contactState.el, contactState.at, contactState.dur, p);
    hudSet(p);
    cursor.setVelocity(vel);
    audio.update(p, vel);
    root.classList.toggle('ui-footer', p > 0.995);
    footerEl.classList.toggle('is-visible', p > 0.996);
    // dim the canvas while a content panel is up (readability)
    const panelUp = Math.max(
      panelWeight(skillsState, p),
      workCards.reduce((m, w) => Math.max(m, panelWeight(w, p)), 0),
    );
    $('#vignette').style.setProperty('--dim', (panelUp * 0.55).toFixed(3));
  }
  function panelWeight(s, p) {
    return clamp01((p - s.at) / 0.02) * (1 - clamp01((p - (s.at + s.dur)) / 0.02));
  }

  return { onFrame, toggleMenu };
}

/* ----------------------------------------------------------
 * Scroll anchor points (kept here so UI + content stay in sync
 * with the camera keyframes in scene.js)
 * -------------------------------------------------------- */
export const SKILLS_AT = 0.612;
export const WORKS_INTRO_AT = 0.674;
export const WORK_AT = [0.704, 0.754, 0.800, 0.840];
export const CONTACT_AT = 0.950;
