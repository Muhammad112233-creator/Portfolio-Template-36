/**
 * textures.js — every texture in the world is painted here
 * at runtime on 2D canvases. Zero image downloads, zero
 * licensing headaches, and it keeps the whole site under
 * a handful of files.
 */
import * as THREE from '../../vendor/three.module.js';

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

function toTexture(cnv, repeat = false) {
  const tex = new THREE.CanvasTexture(cnv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }
  return tex;
}

/* ------------------------------------------------------------
 * Building facade — grid of windows with a few lights on.
 * `lit` 0..1 controls how many windows glow.
 * ---------------------------------------------------------- */
export function facadeTexture({ base = '#f2e4d5', lit = 0.12, seed = 1 } = {}) {
  const W = 128, H = 256;
  const cnv = canvas(W, H);
  const ctx = cnv.getContext('2d');

  // slight vertical tint so tall buildings don't look flat
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, shade(base, 1.06));
  grad.addColorStop(1, shade(base, 0.9));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  let s = seed * 9973;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;

  const cols = 6, rows = 14;
  const cw = W / cols, rh = H / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const on = rand() < lit;
      ctx.fillStyle = on ? '#ffe9b0' : 'rgba(38, 44, 66, 0.75)';
      ctx.fillRect(x * cw + cw * 0.22, y * rh + rh * 0.26, cw * 0.56, rh * 0.46);
    }
  }
  return { map: toTexture(cnv), litCanvas: cnv };
}

/* Night emissive version of the same facade: dark walls, glowing windows */
export function facadeEmissive(litCanvas) {
  const W = litCanvas.width, H = litCanvas.height;
  const cnv = canvas(W, H);
  const ctx = cnv.getContext('2d');
  ctx.drawImage(litCanvas, 0, 0);
  // keep only the warm windows, crush everything else to black
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#ffb45e';
  ctx.fillRect(0, 0, W, H);
  return toTexture(cnv);
}

/* Road: asphalt + center dashes + edge lines. Tiled along the boulevard. */
export function roadTexture() {
  const W = 256, H = 256;
  const cnv = canvas(W, H);
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = '#3c414e';
  ctx.fillRect(0, 0, W, H);

  // asphalt noise
  for (let i = 0; i < 900; i++) {
    const g = 40 + Math.random() * 40;
    ctx.fillStyle = `rgba(${g},${g + 4},${g + 10},${Math.random() * 0.25})`;
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
  }
  // edge lines
  ctx.fillStyle = '#e8e4da';
  ctx.fillRect(10, 0, 5, H);
  ctx.fillRect(W - 15, 0, 5, H);
  // center dashed line
  ctx.fillStyle = '#ffd447';
  for (let y = 0; y < H; y += 64) ctx.fillRect(W / 2 - 3, y, 6, 30);

  const t = toTexture(cnv, true);
  t.repeat.set(1, 1);
  return t;
}

/* Crosswalk strip */
export function crosswalkTexture() {
  const cnv = canvas(256, 64);
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = '#3c414e';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#e8e4da';
  for (let x = 8; x < 256; x += 36) ctx.fillRect(x, 6, 20, 52);
  return toTexture(cnv);
}

/* Soft round cloud blob */
export function cloudTexture() {
  const S = 128;
  const cnv = canvas(S, S);
  const ctx = cnv.getContext('2d');
  const blob = (x, y, r, a) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(0.7, `rgba(255,255,255,${a * 0.45})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  };
  blob(64, 74, 46, 0.9);
  blob(36, 82, 30, 0.8);
  blob(92, 82, 32, 0.8);
  blob(64, 56, 30, 0.85);
  return toTexture(cnv);
}

/* Radial glow — lamps, sun halo, headlight */
export function glowTexture(inner = 'rgba(255,220,150,1)', outer = 'rgba(255,180,80,0)') {
  const S = 128;
  const cnv = canvas(S, S);
  const ctx = cnv.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, inner);
  g.addColorStop(0.35, inner.replace('1)', '0.55)'));
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return toTexture(cnv);
}

/* Tiny "V" bird sprite */
export function birdTexture() {
  const cnv = canvas(64, 32);
  const ctx = cnv.getContext('2d');
  ctx.strokeStyle = 'rgba(30,30,40,0.9)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(6, 26);
  ctx.quadraticCurveTo(20, 6, 32, 18);
  ctx.quadraticCurveTo(44, 6, 58, 26);
  ctx.stroke();
  return toTexture(cnv);
}

/* Sidewalk pavement */
export function pavementTexture() {
  const cnv = canvas(128, 128);
  const ctx = cnv.getContext('2d');
  ctx.fillStyle = '#b7b2ac';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(90,88,84,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 128; i += 32) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 128); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(128, i); ctx.stroke();
  }
  const t = toTexture(cnv, true);
  t.repeat.set(1, 40);
  return t;
}

/* Warm gradient used for the little sun disc */
export function sunTexture() {
  const S = 256;
  const cnv = canvas(S, S);
  const ctx = cnv.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,250,230,1)');
  g.addColorStop(0.25, 'rgba(255,225,160,0.95)');
  g.addColorStop(0.6, 'rgba(255,170,90,0.35)');
  g.addColorStop(1, 'rgba(255,150,70,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return toTexture(cnv);
}

/* Simple color multiply helper */
export function shade(hex, factor) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * factor));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * factor));
  const b = Math.min(255, Math.round((n & 255) * factor));
  return `rgb(${r},${g},${b})`;
}
