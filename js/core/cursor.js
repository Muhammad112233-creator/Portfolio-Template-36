/**
 * cursor.js — custom cursor: a precise dot + a lazy trailing
 * ring in blend-difference mode. It stretches with scroll
 * velocity, grows over interactive elements and can carry a
 * little label ("VIEW", "DRAG", "OPEN"…). Disabled on touch.
 */

export function createCursor() {
  const fine = window.matchMedia('(pointer: fine)').matches;
  const root = document.documentElement;
  if (!fine) {
    root.classList.add('no-custom-cursor');
    return { setLabel() {}, pulse() {}, setVelocity() {} };
  }

  root.classList.add('has-custom-cursor');

  const el = document.createElement('div');
  el.className = 'cursor';
  el.innerHTML = '<div class="cursor__dot"></div><div class="cursor__ring"></div><div class="cursor__label"></div>';
  document.body.appendChild(el);

  const dot = el.querySelector('.cursor__dot');
  const ring = el.querySelector('.cursor__ring');
  const label = el.querySelector('.cursor__label');

  let mx = -100, my = -100;      // mouse
  let rx = -100, ry = -100;      // ring (lagging)
  let scale = 1, targetScale = 1;
  let vel = 0;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    el.classList.add('is-visible');
  }, { passive: true });
  document.addEventListener('mouseleave', () => el.classList.remove('is-visible'));

  // grow over anything marked as interactive
  const HOT = 'a, button, [data-cursor], .work-card, .menu__link';
  document.addEventListener('mouseover', (e) => {
    const hit = e.target.closest(HOT);
    if (hit) {
      el.classList.add('is-active');
      setLabel(hit.dataset.cursor || '');
    } else {
      el.classList.remove('is-active');
      setLabel('');
    }
  });

  let labelText = '';
  function setLabel(text) {
    if (text === labelText) return;
    labelText = text;
    label.textContent = text;
    el.classList.toggle('has-label', !!text);
  }

  function pulse() {
    el.classList.remove('is-pulse');
    void el.offsetWidth; // restart animation
    el.classList.add('is-pulse');
  }

  function frame() {
    // ring chases the mouse, stretch along movement direction
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    const dx = mx - rx, dy = my - ry;
    const dist = Math.min(Math.hypot(dx, dy), 90);
    const stretch = 1 + dist / 140 + vel * 0.6;
    const angle = Math.atan2(dy, dx);

    targetScale = el.classList.contains('is-active') ? 1.9 : 1;
    scale += (targetScale - scale) * 0.14;

    dot.style.transform = `translate(${mx}px, ${my}px)`;
    ring.style.transform =
      `translate(${rx}px, ${ry}px) rotate(${angle}rad) scale(${scale * stretch}, ${scale / Math.sqrt(stretch)})`;

    label.style.transform = `translate(${rx + 26}px, ${ry + 22}px)`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    setLabel,
    pulse,
    setVelocity(v) { vel += (Math.min(v, 1) - vel) * 0.2; },
  };
}
