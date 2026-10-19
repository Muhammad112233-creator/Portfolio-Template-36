/**
 * particles.js — the little life around the ride:
 * birds crossing the day sky, dust puffs off the road,
 * and speed streaks when you scroll hard.
 */
import * as THREE from '../../vendor/three.module.js';
import { birdTexture, glowTexture } from './textures.js';

export function createParticles(scene) {
  /* ---------------- birds ---------------- */
  const birdMap = birdTexture();
  const birds = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.SpriteMaterial({ map: birdMap, transparent: true, opacity: 0.75, depthWrite: false });
    const b = new THREE.Sprite(m);
    const s = 2.4 + Math.random() * 1.6;
    b.scale.set(s, s / 2, 1);
    b.userData = {
      y: 60 + Math.random() * 60,
      z: -Math.random() * 500,
      speed: 6 + Math.random() * 8,
      phase: Math.random() * Math.PI * 2,
    };
    b.position.set(-400 + Math.random() * 200, b.userData.y, b.userData.z);
    scene.add(b);
    birds.push(b);
  }

  /* ---------------- road dust ---------------- */
  const dustMap = glowTexture('rgba(210,190,160,0.85)', 'rgba(190,170,140,0)');
  const dust = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.SpriteMaterial({ map: dustMap, transparent: true, opacity: 0, depthWrite: false });
    const d = new THREE.Sprite(m);
    d.userData = { life: -Math.random(), max: 1 + Math.random() * 0.8 };
    d.scale.set(1.4, 1, 1);
    scene.add(d);
    dust.push(d);
  }

  /* ---------------- speed streaks ---------------- */
  const streakCount = 42;
  const streakGeo = new THREE.BufferGeometry();
  const sPos = new Float32Array(streakCount * 6);
  streakGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
  const streakMat = new THREE.LineBasicMaterial({
    color: '#ffffff', transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const streaks = new THREE.LineSegments(streakGeo, streakMat);
  streaks.frustumCulled = false;
  scene.add(streaks);
  const streakSeeds = [];
  for (let i = 0; i < streakCount; i++) {
    streakSeeds.push({
      x: (Math.random() - 0.5) * 2 * (Math.random() < 0.5 ? 1 : 1) * (9 + Math.random() * 18) * (Math.random() < 0.5 ? -1 : 1),
      y: 1 + Math.random() * 10,
      z: Math.random(),
      len: 3 + Math.random() * 7,
    });
  }

  let dustCursor = 0;

  return {
    /**
     * @param p progress @param t time @param scrollVel 0..1
     * @param riderZ current rider z @param riderPos THREE.Vector3-ish
     */
    update(p, t, scrollVel, riderPos, riding) {
      /* birds — day hours only */
      const day = 1 - THREE.MathUtils.smoothstep(p, 0.6, 0.85);
      birds.forEach((b) => {
        b.material.opacity = 0.75 * day;
        b.position.x += b.userData.speed * 0.016;
        b.position.y = b.userData.y + Math.sin(t * 3 + b.userData.phase) * 1.5;
        const flap = 1 + Math.sin(t * 9 + b.userData.phase) * 0.25;
        b.scale.y = (b.scale.x / 2) * flap;
        if (b.position.x > 500) b.position.x = -500;
      });

      /* dust kicked up by the scooter while riding fast */
      if (riding && scrollVel > 0.08) {
        const d = dust[dustCursor];
        dustCursor = (dustCursor + 1) % dust.length;
        d.userData.life = 0;
        d.position.set(
          riderPos.x + (Math.random() - 0.5) * 0.8,
          0.4,
          riderPos.z + 1.6 + Math.random() * 0.6
        );
      }
      dust.forEach((d) => {
        if (d.userData.life < 0) return;
        d.userData.life += 0.016;
        const k = d.userData.life / d.userData.max;
        if (k >= 1) { d.userData.life = -1; d.material.opacity = 0; return; }
        d.material.opacity = 0.4 * (1 - k);
        const s = 1 + k * 3;
        d.scale.set(s, s * 0.7, 1);
        d.position.y = 0.4 + k * 1.6;
      });

      /* speed streaks hug the road while riding + scrolling fast */
      const intensity = riding ? THREE.MathUtils.clamp((scrollVel - 0.12) * 3.2, 0, 0.8) : 0;
      streakMat.opacity = intensity * 0.55;
      if (intensity > 0.01) {
        const arr = streakGeo.attributes.position.array;
        for (let i = 0; i < streakCount; i++) {
          const sd = streakSeeds[i];
          const zNear = riderPos.z + 30 - ((t * (60 + scrollVel * 220) + sd.z * 320) % 70);
          arr[i * 6] = sd.x;
          arr[i * 6 + 1] = sd.y;
          arr[i * 6 + 2] = zNear;
          arr[i * 6 + 3] = sd.x;
          arr[i * 6 + 4] = sd.y;
          arr[i * 6 + 5] = zNear + sd.len;
        }
        streakGeo.attributes.position.needsUpdate = true;
      }
    },
  };
}
