/**
 * scene.js — the engine room.
 * Fixed WebGL canvas + one long scroll = the whole ride.
 * Camera is driven by keyframed position/look targets along
 * the scroll progress, with smooth damping so it feels shot,
 * not scrolled. Day → dusk → night, FOV kick, handheld sway.
 */
import * as THREE from '../../vendor/three.module.js';
import { createSky, paletteAt } from './sky.js';
import { createCity, WORLD } from './city.js';
import { createRider } from './rider.js';
import { createParticles } from './particles.js';

/* ------------------------------------------------------------
 * CAMERA KEYFRAMES — the cinematography.
 * p: scroll progress · pos: camera · look: target · fov
 * ---------------------------------------------------------- */
const KEYS = [
  // --- ACT I: high above the clouds, hero title --------------
  { p: 0.00, pos: [150, 210, 520], look: [0, 150, 0], fov: 58 },
  { p: 0.06, pos: [120, 200, 470], look: [0, 130, 80], fov: 58 },
  // --- ACT II: the dive --------------------------------------
  { p: 0.11, pos: [70, 175, 480], look: [-15, 60, 260], fov: 62 },
  { p: 0.16, pos: [30, 120, 470], look: [-8, 20, 320], fov: 68 },
  { p: 0.20, pos: [14, 45, 450], look: [0, 8, 350], fov: 72 },
  // flare out, land on the start plaza behind the rider
  { p: 0.24, pos: [0, 6.2, 372], look: [0, 3.2, 330], fov: 64 },
  // --- ACT III: the ride (day) --------------------------------
  { p: 0.30, pos: [6, 4.2, 300], look: [-3, 2.4, 270], fov: 60 },
  { p: 0.36, pos: [-9, 5.4, 258], look: [4, 2.2, 218], fov: 58 },   // designer chapter
  { p: 0.42, pos: [7, 3.6, 216], look: [-6, 2.4, 172], fov: 62 },
  { p: 0.48, pos: [-5, 4.6, 178], look: [16, 6, 128], fov: 56 },   // glance at billboards
  { p: 0.54, pos: [10, 7, 118], look: [-8, 3, 66], fov: 62 },
  // --- crane up over the rooftops (skills terrace) ------------
  { p: 0.60, pos: [24, 26, 60], look: [0, 10, -20], fov: 54 },
  { p: 0.65, pos: [-30, 44, -10], look: [10, 8, -120], fov: 50 },
  // --- ACT IV: back down, works stretch ------------------------
  { p: 0.70, pos: [-14, 6.5, 28], look: [-14.5, 9, 6], fov: 55 },   // billboard 01
  { p: 0.75, pos: [8, 6, 20], look: [14.5, 9.5, -12], fov: 55 },    // billboard 02 (across the road)
  { p: 0.80, pos: [-10, 5, -48], look: [-14.5, 9.5, -64], fov: 55 },// billboard 03 (dusk settling)
  { p: 0.84, pos: [6, 5.5, -92], look: [14.5, 9.5, -116], fov: 56 },// billboard 04
  // --- ACT V: golden hour → night ------------------------------
  { p: 0.88, pos: [10, 9, -160], look: [0, 6, -260], fov: 60 },
  { p: 0.92, pos: [-16, 13, -250], look: [0, 10, -380], fov: 58 },
  // --- arrival at the plaza, tower reveal ----------------------
  { p: 0.955, pos: [-2, 7, -330], look: [-14, 26, -470], fov: 54 },
  { p: 0.985, pos: [14, 5.5, -378], look: [10, 40, -478], fov: 52 },
  { p: 1.00, pos: [10, 4.5, -392], look: [10, 20, -478], fov: 55 },
];

const _vPos = new THREE.Vector3();
const _vLook = new THREE.Vector3();

function sampleKeys(p) {
  let i = 0;
  while (i < KEYS.length - 2 && KEYS[i + 1].p < p) i++;
  const a = KEYS[i], b = KEYS[Math.min(i + 1, KEYS.length - 1)];
  const span = Math.max(1e-5, b.p - a.p);
  let t = THREE.MathUtils.clamp((p - a.p) / span, 0, 1);
  // smoothstep between keyframes → buttery segments
  t = t * t * (3 - 2 * t);
  _vPos.set(
    THREE.MathUtils.lerp(a.pos[0], b.pos[0], t),
    THREE.MathUtils.lerp(a.pos[1], b.pos[1], t),
    THREE.MathUtils.lerp(a.pos[2], b.pos[2], t),
  );
  _vLook.set(
    THREE.MathUtils.lerp(a.look[0], b.look[0], t),
    THREE.MathUtils.lerp(a.look[1], b.look[1], t),
    THREE.MathUtils.lerp(a.look[2], b.look[2], t),
  );
  return { pos: _vPos, look: _vLook, fov: THREE.MathUtils.lerp(a.fov, b.fov, t) };
}

export function createScene(canvas, hooks = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, powerPreference: 'high-performance',
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color('#e8d7c8'), 120, 950);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 4000);
  camera.position.set(150, 210, 520);

  /* ---------- lights ---------- */
  const sun = new THREE.DirectionalLight('#fff3d9', 2.4);
  sun.position.set(200, 300, -100);
  scene.add(sun);
  const ambient = new THREE.HemisphereLight('#bcd8f0', '#c9b291', 0.9);
  scene.add(ambient);

  /* ---------- world ---------- */
  const sky = createSky(scene);
  const city = createCity(scene, hooks.works || []);
  const rider = createRider(scene);
  const particles = createParticles(scene);

  /* ---------- viewport / quality ---------- */
  const state = {
    progress: 0,          // smoothed
    target: 0,            // raw scroll target
    velocity: 0,          // scroll velocity (smoothed)
    width: 1, height: 1,
    dpr: 1,
    quality: 1,           // adaptive multiplier
    fpsAvg: 60,
    handedReady: false,
    reduced: false,
  };

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    state.width = w; state.height = h;
    const mobile = w < 768;
    state.dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 2) * state.quality;
    renderer.setPixelRatio(state.dpr);
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = (mobile ? 66 : 58);
    camera.updateProjectionMatrix();
    if (mobile) camera.setViewOffset(w, h, 0, -h * 0.04, w, h); // slight composition lift
    else camera.clearViewOffset();
  }
  window.addEventListener('resize', resize);
  resize();

  /* ---------- scroll plumbing ---------- */
  const doc = document.documentElement;
  function readScroll() {
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    state.target = THREE.MathUtils.clamp((window.scrollY || doc.scrollTop) / max, 0, 1);
  }
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  /* ---------- main loop ---------- */
  const clock = new THREE.Clock();
  let lastProgress = 0;
  const camPos = new THREE.Vector3(150, 210, 520);
  const camLook = new THREE.Vector3(0, 150, 0);
  let fovCurrent = 58;

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // fps monitor → adaptive quality
    if (dt > 0) {
      state.fpsAvg = state.fpsAvg * 0.95 + (1 / dt) * 0.05;
      if (state.fpsAvg < 42 && state.quality > 0.62) {
        state.quality = Math.max(0.62, state.quality - 0.08);
        resize();
      }
    }

    // critically-damped-ish smoothing of scroll progress
    const stiffness = state.reduced ? 1 : 4.2;
    state.progress += (state.target - state.progress) * Math.min(1, dt * stiffness);
    const vel = Math.abs(state.progress - lastProgress) / Math.max(dt, 1e-4);
    lastProgress = state.progress;
    state.velocity += (THREE.MathUtils.clamp(vel * 5.5, 0, 1) - state.velocity) * Math.min(1, dt * 5);

    const p = state.progress;

    /* camera from keyframes + handheld life */
    const k = sampleKeys(p);
    if (!state.handedReady) { camPos.copy(k.pos); camLook.copy(k.look); state.handedReady = true; }
    const posDamp = 1 - Math.pow(0.0001, dt);      // smooth but responsive
    const lookDamp = 1 - Math.pow(0.00001, dt);
    camPos.lerp(k.pos, posDamp);
    camLook.lerp(k.look, lookDamp);

    const swayA = p > 0.22 && p < 0.95 ? 0.35 + state.velocity * 1.6 : 0.5;
    const hx = Math.sin(t * 0.9) * 0.35 * swayA;
    const hy = Math.cos(t * 1.25) * 0.22 * swayA;
    camera.position.set(camPos.x + hx, camPos.y + hy, camPos.z);
    camera.lookAt(camLook.x, camLook.y + Math.sin(t * 0.7) * 0.2 * swayA, camLook.z);

    // roll into direction changes + fov kick with scroll velocity
    camera.rotation.z += Math.sin(t * 0.8) * 0.004 + (k.pos.x - camPos.x) * 0.0004;
    const fovTarget = k.fov + state.velocity * 9;
    fovCurrent += (fovTarget - fovCurrent) * Math.min(1, dt * 6);
    if (Math.abs(camera.fov - fovCurrent) > 0.05) {
      camera.fov = fovCurrent;
      camera.updateProjectionMatrix();
    }

    /* world updates */
    const pal = sky.update(p, t);
    scene.fog.color.copy(pal.fog);
    sun.color.copy(pal.sun);
    const dayness = THREE.MathUtils.clamp(1 - THREE.MathUtils.smoothstep(p, 0.72, 0.98) * 0.85, 0.15, 1);
    sun.intensity = 2.4 * dayness;
    const sp = paletteAt(p);
    ambient.intensity = 0.55 + 0.5 * dayness;
    ambient.color.copy(sp.top).lerp(new THREE.Color('#ffffff'), 0.5);
    ambient.groundColor.copy(sp.ground);

    const riding = p > 0.215 && p < 0.965;
    rider.update(p, t, riding ? state.velocity + 0.25 : 0);
    city.update(p, t);
    particles.update(p, t, state.velocity, { x: rider.root?.position.x || 0, z: riderZ(rider, p) }, riding);

    renderer.render(scene, camera);

    hooks.onFrame && hooks.onFrame(p, state.velocity, state.fpsAvg);
    requestAnimationFrame(frame);
  }

  function riderZ(r, p) {
    try { return r.zAt(p); } catch { return 0; }
  }

  requestAnimationFrame(frame);

  return {
    state,
    setProgress(v) { state.target = v; state.progress = v; lastProgress = v; },
    setReduced(v) { state.reduced = v; },
    readScroll,
  };
}
