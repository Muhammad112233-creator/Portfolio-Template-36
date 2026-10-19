/**
 * main.js — boot sequence.
 * Loader counter → START gate (audio unlock) → hero → the ride.
 */
import { SITE, WORKS } from './content.js';
import { createScene } from './webgl/scene.js';
import { createAudio } from './core/audio.js';
import { createCursor } from './core/cursor.js';
import { createUI } from './core/ui.js';

const $ = (s) => document.querySelector(s);
const doc = document.documentElement;

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- loader ---------- */
const loader = $('#loader');
const counter = $('#loader-counter');
const loaderBar = $('#loader-bar-fill');
const loaderWord = $('#loader-word');
const startBtn = $('#start-btn');
const loaderNotes = $('#loader-notes');

const BOOT_WORDS = ['Waking the city', 'Inflating clouds', 'Painting facades', 'Fueling the scooter', 'Ready'];
let bootWord = -1;
let progress = 0;
let sceneReady = false;
let fontsReady = false;
let loaderDone = false;

function setProgress(v) {
  if (loaderDone) return;
  progress = Math.max(progress, v);
  counter.textContent = String(Math.round(progress)).padStart(3, '0');
  loaderBar.style.transform = `scaleX(${(progress / 100).toFixed(3)})`;
  const idx = Math.min(BOOT_WORDS.length - 1, Math.floor((progress / 100) * BOOT_WORDS.length));
  if (idx !== bootWord) {
    bootWord = idx;
    loaderWord.classList.remove('is-swap');
    void loaderWord.offsetWidth;
    loaderWord.textContent = BOOT_WORDS[idx];
    loaderWord.classList.add('is-swap');
  }
  if (progress >= 100) showStart();
}

function tickLoader() {
  if (loaderDone) return;
  const cap = sceneReady && fontsReady ? 100 : 88;
  if (progress < cap) {
    setProgress(progress + 0.7 + Math.random() * 0.9);
    setTimeout(tickLoader, 30);
  } else if (cap === 100) {
    setProgress(100);
  } else {
    setTimeout(tickLoader, 120); // wait for real milestones
  }
}

function showStart() {
  if (loaderDone) return;
  loaderDone = true;
  counter.textContent = '100';
  loaderBar.style.transform = 'scaleX(1)';
  loader.classList.add('is-ready');
  gsap.to([counter, loaderWord, '#loader-bar'], { opacity: 0, y: -30, duration: 0.6, ease: 'power2.in', stagger: 0.05 });
  gsap.fromTo(startBtn, { opacity: 0, y: 40, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.9, delay: 0.35, ease: 'expo.out' });
  gsap.fromTo(loaderNotes, { opacity: 0 }, { opacity: 1, duration: 0.8, delay: 0.6 });
}

/* ---------- boot ---------- */
function boot() {
  /* hero content */
  const [first = 'Rayan', ...rest] = SITE.shortTitle.split(' ');
  $('#hero').innerHTML = `
    <div class="hero__inner">
      <span class="hero__hello">${SITE.availability}</span>
      <h1 class="hero__title">
        <span class="hero__line"><span>${first}</span></span>
        <span class="hero__line"><span>${rest.join(' ') || '&nbsp;'}</span></span>
        <span class="hero__line hero__line--role"><span>${SITE.role}</span></span>
      </h1>
      <p class="hero__tagline">${SITE.tagline}</p>
      <div class="hero__hint">
        <span class="hero__wheel" aria-hidden="true"></span>
        <span>${SITE.scrollHint}</span>
      </div>
    </div>`;

  loaderNotes.innerHTML = `
    <span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a9 9 0 0 1 0 14"/></svg>${SITE.soundNote}</span>
    <span class="only-mobile"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>${SITE.desktopNote}</span>`;

  document.title = SITE.title;

  /* systems */
  const audio = createAudio();
  const cursor = createCursor();
  const scene = createScene($('#gl'), { works: WORKS.list });
  const ui = createUI({ audio, cursor, scene });

  /* single per-frame pump for every DOM-side update */
  function pump() {
    ui.onFrame(scene.state.progress, scene.state.velocity);
    requestAnimationFrame(pump);
  }
  requestAnimationFrame(pump);

  /* hero fades during the first stretch of scroll */
  const hero = $('#hero');
  function heroFrame() {
    const p = scene.state.progress;
    const v = Math.max(0, 1 - p / 0.055);
    hero.style.opacity = v.toFixed(3);
    hero.style.visibility = v <= 0.001 ? 'hidden' : 'visible';
    hero.style.transform = `translate3d(0, ${((1 - v) * -14).toFixed(2)}vh, 0)`;
    requestAnimationFrame(heroFrame);
  }
  requestAnimationFrame(heroFrame);

  if (prefersReduced) {
    scene.setReduced(true);
    doc.classList.add('reduced-motion');
  }

  /* loader progression — creeps to 88, jumps to 100 when really ready */
  sceneReady = true;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { fontsReady = true; });
  else fontsReady = true;
  tickLoader();

  /* start gate — the user gesture that unlocks audio */
  startBtn.addEventListener('click', () => {
    audio.start();
    doc.classList.add('is-started');
    cursor.pulse();
    const tl = gsap.timeline();
    tl.to(startBtn, { scale: 0.9, duration: 0.12, ease: 'power2.in' })
      .to(loaderNotes, { opacity: 0, duration: 0.3 }, 0)
      .to(loader, {
        clipPath: 'inset(0% 0% 100% 0%)',
        duration: 1.1,
        ease: 'expo.inOut',
        onComplete: () => loader.remove(),
      }, 0.12)
      .fromTo('#gl', { scale: 1.12 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0.35)
      .fromTo('.hero__line span', { yPercent: 115 }, { yPercent: 0, duration: 1.15, stagger: 0.09, ease: 'expo.out' }, 0.6)
      .fromTo(['.hero__hello', '.hero__tagline', '.hero__hint'], { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08, ease: 'power2.out' }, 0.95)
      .fromTo('#site-header', { y: -70, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }, 1.05)
      .fromTo('#hud', { x: 40, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, ease: 'expo.out' }, 1.15);
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
