/**
 * sky.js — gradient dome, drifting clouds, sun, moon
 * and a star field that fades in for the night finale.
 * The whole day → dusk → night cycle is driven by one
 * number: the scroll progress.
 */
import * as THREE from '../../vendor/three.module.js';
import { cloudTexture, sunTexture, glowTexture } from './textures.js';

/* The master palette. Each entry: [progress, top, horizon, ground, sun, fog] */
export const SKY_TIMELINE = [
  { p: 0.00, top: '#8fb7e8', horizon: '#ffe9d6', ground: '#d9c6b2', sun: '#fff3d9', fog: '#e8d7c8', sunPos: [420, 200, -650] },
  { p: 0.18, top: '#5fa9e8', horizon: '#cfeaf7', ground: '#cbb9a4', sun: '#fff8e6', fog: '#d7e4ea', sunPos: [480, 330, -600] },
  { p: 0.42, top: '#4b9be6', horizon: '#d8f0f2', ground: '#c4b19c', sun: '#fffbe8', fog: '#d3e2e4', sunPos: [250, 420, -550] },
  { p: 0.62, top: '#5b7dd6', horizon: '#ffd9a0', ground: '#c2a188', sun: '#ffdf9e', fog: '#e4c39a', sunPos: [-420, 180, -520] },
  { p: 0.78, top: '#4a3f8f', horizon: '#ff9b6a', ground: '#9c6b60', sun: '#ffb36b', fog: '#d89a76', sunPos: [-520, 60, -380] },
  { p: 0.90, top: '#191d42', horizon: '#5a2f5e', ground: '#3a2340', sun: '#ff7e5e', fog: '#4a2c4e', sunPos: [-560, -40, -300] },
  { p: 1.00, top: '#070a1e', horizon: '#141a3d', ground: '#0a0d22', sun: '#24306b', fog: '#0b0f2a', sunPos: [-560, -140, -260] },
];

const _cA = new THREE.Color(), _cB = new THREE.Color();
function lerpTimelineColor(key, p) {
  let i = 0;
  while (i < SKY_TIMELINE.length - 2 && SKY_TIMELINE[i + 1].p < p) i++;
  const a = SKY_TIMELINE[i], b = SKY_TIMELINE[Math.min(i + 1, SKY_TIMELINE.length - 1)];
  const t = THREE.MathUtils.clamp((p - a.p) / Math.max(1e-5, b.p - a.p), 0, 1);
  _cA.set(a[key]); _cB.set(b[key]);
  return _cA.lerp(_cB, t).clone();
}
export function paletteAt(p) {
  return {
    top: lerpTimelineColor('top', p),
    horizon: lerpTimelineColor('horizon', p),
    ground: lerpTimelineColor('ground', p),
    sun: lerpTimelineColor('sun', p),
    fog: lerpTimelineColor('fog', p),
  };
}
export function sunPosAt(p) {
  let i = 0;
  while (i < SKY_TIMELINE.length - 2 && SKY_TIMELINE[i + 1].p < p) i++;
  const a = SKY_TIMELINE[i], b = SKY_TIMELINE[Math.min(i + 1, SKY_TIMELINE.length - 1)];
  const t = THREE.MathUtils.clamp((p - a.p) / Math.max(1e-5, b.p - a.p), 0, 1);
  return new THREE.Vector3(
    THREE.MathUtils.lerp(a.sunPos[0], b.sunPos[0], t),
    THREE.MathUtils.lerp(a.sunPos[1], b.sunPos[1], t),
    THREE.MathUtils.lerp(a.sunPos[2], b.sunPos[2], t),
  );
}

export function createSky(scene) {
  const group = new THREE.Group();
  scene.add(group);

  /* ---- gradient dome ---- */
  const skyUniforms = {
    topColor: { value: new THREE.Color('#8fb7e8') },
    horizonColor: { value: new THREE.Color('#ffe9d6') },
    groundColor: { value: new THREE.Color('#d9c6b2') },
    offset: { value: 60 },
    exponent: { value: 0.85 },
  };
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1500, 28, 18),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: skyUniforms,
      vertexShader: /* glsl */`
        varying vec3 vWorldPosition;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPosition = wp.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 topColor; uniform vec3 horizonColor; uniform vec3 groundColor;
        uniform float offset; uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
          vec3 col = h > 0.0
            ? mix(horizonColor, topColor, pow(max(h, 0.0), exponent))
            : mix(horizonColor, groundColor, pow(max(-h, 0.0), 0.6));
          gl_FragColor = vec4(col, 1.0);
        }`,
    })
  );
  dome.renderOrder = -10;
  group.add(dome);

  /* ---- sun disc + halo ---- */
  const sunTex = sunTexture();
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, transparent: true, depthWrite: false, fog: false }));
  sun.scale.set(340, 340, 1);
  group.add(sun);

  /* ---- moon (appears at night) ---- */
  const moon = new THREE.Mesh(
    new THREE.CircleGeometry(26, 32),
    new THREE.MeshBasicMaterial({ color: '#e8ecff', transparent: true, opacity: 0, fog: false })
  );
  moon.position.set(380, 330, -900);
  moon.lookAt(0, 40, 0);
  group.add(moon);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(190,205,255,1)', 'rgba(120,140,255,0)'),
    transparent: true, opacity: 0, depthWrite: false, fog: false,
  }));
  moonGlow.scale.set(260, 260, 1);
  moonGlow.position.copy(moon.position);
  group.add(moonGlow);

  /* ---- stars ---- */
  const starCount = 900;
  const starGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    // random points on upper hemisphere of a large sphere
    const r = 1200, theta = Math.random() * Math.PI * 2, phi = Math.acos(Math.random() * 0.85);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.cos(phi) + 40;
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const starMat = new THREE.PointsMaterial({
    color: '#dfe6ff', size: 2.2, sizeAttenuation: false,
    transparent: true, opacity: 0, depthWrite: false, fog: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  group.add(stars);

  /* ---- clouds (two decks: high layer you fall through, low city layer) ---- */
  const cloudMap = cloudTexture();
  const clouds = [];
  const cloudGroup = new THREE.Group();
  group.add(cloudGroup);
  const mkCloud = (x, y, z, s, o) => {
    const m = new THREE.SpriteMaterial({ map: cloudMap, transparent: true, opacity: o, depthWrite: false });
    const sp = new THREE.Sprite(m);
    sp.position.set(x, y, z);
    sp.scale.set(s, s * 0.55, 1);
    sp.userData = { baseOp: o, drift: 0.6 + Math.random() * 1.2 };
    cloudGroup.add(sp);
    clouds.push(sp);
  };
  // high deck — the dive pierces straight through it (covers z 560 → -300)
  for (let i = 0; i < 46; i++) {
    mkCloud((Math.random() - 0.5) * 900, 110 + Math.random() * 120, 560 - Math.random() * 860, 90 + Math.random() * 160, 0.85);
  }
  // city-level decorative clouds
  for (let i = 0; i < 26; i++) {
    mkCloud((Math.random() - 0.5) * 1100, 190 + Math.random() * 90, -Math.random() * 700, 130 + Math.random() * 170, 0.6);
  }

  const api = {
    group,
    /** progress 0..1, time seconds */
    update(p, t) {
      const pal = paletteAt(p);
      skyUniforms.topColor.value.copy(pal.top);
      skyUniforms.horizonColor.value.copy(pal.horizon);
      skyUniforms.groundColor.value.copy(pal.ground);

      const sp = sunPosAt(p);
      sun.position.copy(sp);
      sun.material.color.copy(pal.sun);
      // sun fades out as it drops below the horizon
      const sunUp = THREE.MathUtils.clamp((sp.y + 80) / 200, 0, 1);
      sun.material.opacity = sunUp;

      // stars + moon only near the end
      const night = THREE.MathUtils.smoothstep(p, 0.86, 0.97);
      starMat.opacity = night * 0.95;
      stars.rotation.y = t * 0.004;
      moon.material.opacity = night;
      moonGlow.material.opacity = night * 0.8;

      // clouds: bright by day, blush at dusk, silhouettes at night
      const duskBlush = THREE.MathUtils.smoothstep(p, 0.6, 0.82) * (1 - night);
      const cloudCol = _cA.copy(pal.horizon).lerp(_cB.set('#ffffff'), 0.35 + 0.3 * duskBlush);
      cloudGroup.children.forEach((c, i) => {
        c.material.color.copy(cloudCol);
        c.material.opacity = c.userData.baseOp * (1 - night * 0.85);
        c.position.x += Math.sin(t * 0.05 + i) * 0.02 * c.userData.drift;
        c.position.x += c.userData.drift * 0.03;
        if (c.position.x > 620) c.position.x = -620;
      });

      return pal;
    },
  };
  return api;
}
