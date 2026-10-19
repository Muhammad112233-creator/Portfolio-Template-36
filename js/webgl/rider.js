/**
 * rider.js — our hero on a little scooter, built from primitives.
 * Bobbing, leaning into sway, spinning wheels, scarf flapping,
 * headlight that switches on when night falls.
 */
import * as THREE from '../../vendor/three.module.js';
import { glowTexture } from './textures.js';
import { WORLD } from './city.js';

export function createRider(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const paint = new THREE.MeshLambertMaterial({ color: '#ff5c39' });   // scooter coral
  const paintDark = new THREE.MeshLambertMaterial({ color: '#c23a20' });
  const metal = new THREE.MeshLambertMaterial({ color: '#d8d4cc' });
  const rubber = new THREE.MeshLambertMaterial({ color: '#23252c' });
  const skin = new THREE.MeshLambertMaterial({ color: '#e8b48c' });
  const jacket = new THREE.MeshLambertMaterial({ color: '#2f3a5c' });
  const helmetMat = new THREE.MeshLambertMaterial({ color: '#f4efE6' });
  const visorMat = new THREE.MeshLambertMaterial({ color: '#1d2436' });

  /* ---------- scooter ---------- */
  const scooter = new THREE.Group();

  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 1.9), paint);
  deck.position.y = 0.42;
  const rearCowling = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.5, 0.8), paintDark);
  rearCowling.position.set(0, 0.68, 0.62);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.14, 0.85), rubber);
  seat.position.set(0, 0.98, 0.45);
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 1.15, 8), metal);
  column.position.set(0, 1.0, -0.82);
  column.rotation.x = 0.28;
  const handlebar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.78, 8), metal);
  handlebar.rotation.z = Math.PI / 2;
  handlebar.position.set(0, 1.52, -0.98);
  const shield = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.1), paint);
  shield.position.set(0, 1.12, -0.95);
  shield.rotation.x = 0.28;
  const lampRim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12), metal);
  lampRim.rotation.x = Math.PI / 2 + 0.28;
  lampRim.position.set(0, 1.34, -1.06);
  const lampFace = new THREE.Mesh(new THREE.CircleGeometry(0.1, 12), new THREE.MeshBasicMaterial({ color: '#3a3f4d' }));
  lampFace.position.set(0, 1.36, -1.11);
  lampFace.rotation.x = -0.28;

  const wheelGeo = new THREE.TorusGeometry(0.24, 0.09, 8, 18);
  const hubGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.12, 8);
  const wheelF = new THREE.Group();
  const wheelB = new THREE.Group();
  [wheelF, wheelB].forEach((w) => {
    const tire = new THREE.Mesh(wheelGeo, rubber);
    const hub = new THREE.Mesh(hubGeo, metal);
    hub.rotation.z = Math.PI / 2;
    w.add(tire, hub);
    w.rotation.y = Math.PI / 2; // wheel plane faces forward
  });
  wheelF.position.set(0, 0.32, -0.92);
  wheelB.position.set(0, 0.32, 0.85);

  scooter.add(deck, rearCowling, seat, column, handlebar, shield, lampRim, lampFace, wheelF, wheelB);
  root.add(scooter);

  // headlight beam (night)
  const beamTex = glowTexture('rgba(255,236,190,1)', 'rgba(255,210,120,0)');
  const beam = new THREE.Sprite(new THREE.SpriteMaterial({
    map: beamTex, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  beam.scale.set(4.5, 4.5, 1);
  beam.position.set(0, 1.3, -1.6);
  scooter.add(beam);

  /* ---------- rider ---------- */
  const body = new THREE.Group();
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.26, 0.55, 4, 10), jacket);
  torso.position.set(0, 1.64, 0.32);
  torso.rotation.x = -0.22;
  const head = new THREE.Group();
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 12), skin);
  const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.245, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), helmetMat);
  helmet.position.y = 0.02;
  const visor = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10, -Math.PI * 0.42, Math.PI * 0.84, Math.PI * 0.28, Math.PI * 0.3), visorMat);
  visor.position.set(0, 0.01, 0);
  head.add(face, helmet, visor);
  head.position.set(0, 2.24, 0.18);
  head.rotation.x = -0.12;

  // scarf that flaps behind
  const scarfMat = new THREE.MeshLambertMaterial({ color: '#ffd447', side: THREE.DoubleSide });
  const scarf = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.7, 1, 6), scarfMat);
  scarf.position.set(0.08, 2.06, 0.42);
  scarf.rotation.x = 1.35;

  const armGeo = new THREE.CapsuleGeometry(0.07, 0.5, 4, 8);
  const armL = new THREE.Mesh(armGeo, jacket);
  armL.position.set(-0.3, 1.78, -0.12);
  armL.rotation.set(-0.9, 0, 0.35);
  const armR = new THREE.Mesh(armGeo, jacket);
  armR.position.set(0.3, 1.78, -0.12);
  armR.rotation.set(-0.9, 0, -0.35);

  const legGeo = new THREE.CapsuleGeometry(0.09, 0.42, 4, 8);
  const pants = new THREE.MeshLambertMaterial({ color: '#3d3a34' });
  const legL = new THREE.Mesh(legGeo, pants);
  legL.position.set(-0.16, 1.06, 0.18);
  legL.rotation.x = -1.15;
  const legR = new THREE.Mesh(legGeo, pants);
  legR.position.set(0.16, 1.06, 0.18);
  legR.rotation.x = -1.15;

  body.add(torso, head, scarf, armL, armR, legL, legR);
  root.add(body);

  const scarfGeo = scarf.geometry;
  const scarfPos = scarfGeo.attributes.position;
  const scarfBase = scarfPos.array.slice();

  /* shadow blob (cheap, no real shadows needed) */
  const shadowTex = glowTexture('rgba(0,0,0,0.55)', 'rgba(0,0,0,0)');
  const blob = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 3.6),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.5 })
  );
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.06;
  root.add(blob);

  /* ------------------- animation state ------------------- */
  const state = {
    root,
    /** z position of the rider for a given scroll progress (ride portion only) */
    zAt(p) {
      const t0 = 0.24, t1 = 0.94; // ride window
      const local = THREE.MathUtils.clamp((p - t0) / (t1 - t0), 0, 1);
      // ease so the rider accelerates after the landing and slows at the plaza
      const eased = local < 0.06 ? local * 0.6 : local; // gentle launch
      return THREE.MathUtils.lerp(WORLD.ROAD_START - 18, WORLD.PLAZA_Z + 52, eased);
    },
    /**
     * @param p scroll progress 0..1
     * @param t time seconds
     * @param speed normalized ride speed 0..1
     */
    update(p, t, speed) {
      const z = state.zAt(p);
      const sway = Math.sin(p * 46) * 2.2 + Math.sin(p * 13) * 1.2; // lane drift
      root.position.set(sway * Math.min(1, speed * 3), 0, z);

      // bobbing with speed + always a little idle life
      const bob = Math.sin(t * (6 + speed * 10)) * (0.015 + speed * 0.035);
      scooter.position.y = bob;
      body.position.y = bob * 1.4;

      // lean with lateral movement
      const lean = THREE.MathUtils.clamp(-Math.cos(p * 46) * speed * 0.35, -0.3, 0.3);
      root.rotation.z = lean;
      root.rotation.y = lean * 0.5;

      // wheels spin
      const spin = speed * 0.6;
      wheelF.rotation.x -= spin;
      wheelB.rotation.x -= spin;

      // scarf flutter (waves travel down the cloth)
      const flap = 0.3 + speed * 1.2;
      for (let i = 0; i < scarfPos.count; i++) {
        const y = scarfBase[i * 3 + 1];
        const f = (0.35 - y) * 1.4; // amplitude grows toward the tip
        scarfPos.array[i * 3] = scarfBase[i * 3] + Math.sin(t * 9 * flap + y * 6) * 0.12 * f;
        scarfPos.array[i * 3 + 2] = scarfBase[i * 3 + 2] + Math.cos(t * 7 * flap + y * 5) * 0.1 * f;
      }
      scarfPos.needsUpdate = true;

      // headlight on at dusk
      const night = THREE.MathUtils.smoothstep(p, 0.76, 0.9);
      beam.material.opacity = night * 0.75;
      lampFace.material.color.set(night > 0.35 ? '#ffe9b8' : '#3a3f4d');

      // rider visible only during the ride window; hidden before landing & at the very end
      root.visible = p > 0.215 && p < 0.965;
    },
  };

  return state;
}
