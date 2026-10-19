/**
 * city.js — hand-built low-poly boulevard the ride passes through.
 * Two rows of pastel buildings, street trees, lamps, crosswalks,
 * billboard screens for the "Selected Works" stretch and a glowing
 * tower on the final plaza. Everything procedural, nothing downloaded.
 */
import * as THREE from '../../vendor/three.module.js';
import {
  facadeTexture, facadeEmissive, roadTexture, crosswalkTexture,
  glowTexture, pavementTexture, shade,
} from './textures.js';

/* World layout constants (shared with scene.js & rider.js) */
export const WORLD = {
  ROAD_START: 330,     // z where the ride begins
  ROAD_END: -350,      // z where the plaza begins
  ROAD_HALF: 7,        // road half width
  PLAZA_Z: -410,       // center of the end plaza
  TOWER_Z: -478,       // the tower at the back of the plaza
};

const PALETTE = ['#f6e7d8', '#efd9c4', '#e8b4a0', '#a8d0d8', '#b9d8b0', '#f3d487', '#d9b8e0', '#9fc2e8'];

function mulberry(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createCity(scene, works) {
  const group = new THREE.Group();
  scene.add(group);
  const rand = mulberry(20261019);

  const nightFaders = [];   // materials whose window glow ramps up at night
  const lampGlows = [];     // additive sprites under each lamp
  const billboards = [];    // work screens + their textures

  /* ================= ground ================= */
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 1600),
    new THREE.MeshLambertMaterial({ color: '#9db28a' })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.05, -100);
  group.add(ground);

  /* ================= road ================= */
  const roadLen = WORLD.ROAD_START - WORLD.ROAD_END;
  const roadTex = roadTexture();
  roadTex.repeat.set(1, roadLen / 16);
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD.ROAD_HALF * 2, roadLen),
    new THREE.MeshLambertMaterial({ map: roadTex })
  );
  road.rotation.x = -Math.PI / 2;
  road.rotation.z = Math.PI; // dashes run along z
  road.position.set(0, 0.02, (WORLD.ROAD_START + WORLD.ROAD_END) / 2);
  group.add(road);

  /* start plaza (where we land) */
  const startPlaza = new THREE.Mesh(
    new THREE.CircleGeometry(34, 40),
    new THREE.MeshLambertMaterial({ map: roadTex.clone() })
  );
  startPlaza.material.map.repeat.set(6, 6);
  startPlaza.rotation.x = -Math.PI / 2;
  startPlaza.position.set(0, 0.02, WORLD.ROAD_START + 26);
  group.add(startPlaza);

  /* sidewalks */
  const paveTex = pavementTexture();
  [-1, 1].forEach((side) => {
    const walk = new THREE.Mesh(
      new THREE.BoxGeometry(5, 0.35, roadLen),
      new THREE.MeshLambertMaterial({ map: paveTex })
    );
    walk.position.set(side * (WORLD.ROAD_HALF + 2.5), 0.17, road.position.z);
    group.add(walk);
  });

  /* crosswalks every now and then */
  const cwTex = crosswalkTexture();
  for (let z = WORLD.ROAD_START - 60; z > WORLD.ROAD_END + 40; z -= 95 + rand() * 40) {
    const cw = new THREE.Mesh(new THREE.PlaneGeometry(WORLD.ROAD_HALF * 2, 2.6), new THREE.MeshLambertMaterial({ map: cwTex }));
    cw.rotation.x = -Math.PI / 2;
    cw.rotation.z = Math.PI / 2;
    cw.position.set(0, 0.04, z);
    group.add(cw);
  }

  /* ================= buildings ================= */
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const capGeo = new THREE.BoxGeometry(1, 1, 1);
  const buildings = new THREE.Group();
  group.add(buildings);

  const facades = PALETTE.map((base, i) => {
    const { map, litCanvas } = facadeTexture({ base, seed: i + 3, lit: 0.1 + rand() * 0.12 });
    const emissiveMap = facadeEmissive(litCanvas);
    const mat = new THREE.MeshLambertMaterial({ map, emissive: new THREE.Color('#ffb45e'), emissiveMap, emissiveIntensity: 0 });
    nightFaders.push(mat);
    return mat;
  });

  let bi = 0;
  for (let z = WORLD.ROAD_START - 8; z > WORLD.ROAD_END - 36; z -= 17) {
    [-1, 1].forEach((side) => {
      // two depth rows per side
      for (let row = 0; row < 2; row++) {
        if (rand() < 0.08) continue; // occasional empty lot
        const xOff = 16.5 + row * 15 + rand() * 3;
        const w = 9 + rand() * 5;
        const d = 9 + rand() * 5;
        const h = (row === 0 ? 9 : 14) + rand() * (row === 0 ? 14 : 26);
        const mat = facades[(bi + row) % facades.length];

        const b = new THREE.Mesh(boxGeo, mat);
        b.scale.set(w, h, d);
        b.position.set(side * xOff, h / 2, z + (rand() - 0.5) * 3);
        buildings.add(b);

        // rooftop cap for silhouette interest
        const cap = new THREE.Mesh(capGeo, new THREE.MeshLambertMaterial({ color: shade(PALETTE[(bi + row) % PALETTE.length], 0.72) }));
        cap.scale.set(w * 1.04, 0.7, d * 1.04);
        cap.position.set(b.position.x, h + 0.3, b.position.z);
        buildings.add(cap);
      }
      bi++;
    });
  }

  /* ================= street trees ================= */
  const trunkMat = new THREE.MeshLambertMaterial({ color: '#6d4c3d' });
  const leafMats = ['#7fb069', '#68a357', '#8fbf77'].map((c) => new THREE.MeshLambertMaterial({ color: c }));
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.3, 1.6, 6);
  const leafGeo = new THREE.IcosahedronGeometry(1.5, 0);
  for (let z = WORLD.ROAD_START - 20; z > WORLD.ROAD_END + 16; z -= 14) {
    [-1, 1].forEach((side) => {
      if (rand() < 0.2) return;
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.8;
      const leaves = new THREE.Mesh(leafGeo, leafMats[Math.floor(rand() * 3)]);
      leaves.position.y = 2.4;
      const s = 0.8 + rand() * 0.5;
      leaves.scale.set(s, s * 1.15, s);
      tree.add(trunk, leaves);
      tree.position.set(side * (WORLD.ROAD_HALF + 2.4), 0.35, z + (rand() - 0.5) * 4);
      group.add(tree);
    });
  }

  /* ================= street lamps ================= */
  const poleMat = new THREE.MeshLambertMaterial({ color: '#2c3038' });
  const poleGeo = new THREE.CylinderGeometry(0.09, 0.12, 5.4, 6);
  const lampGlowTex = glowTexture('rgba(255,214,140,1)', 'rgba(255,160,60,0)');
  for (let z = WORLD.ROAD_START - 12; z > WORLD.ROAD_END + 10; z -= 22) {
    [-1, 1].forEach((side) => {
      const lamp = new THREE.Group();
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.y = 2.7;
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.09, 0.09), poleMat);
      arm.position.set(-side * 0.6, 5.35, 0);
      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 8, 8),
        new THREE.MeshBasicMaterial({ color: '#332f26' })
      );
      bulb.position.set(-side * 1.2, 5.25, 0);
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: lampGlowTex, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      glow.scale.set(6, 6, 1);
      glow.position.copy(bulb.position);
      lamp.add(pole, arm, bulb, glow);
      lamp.position.set(side * (WORLD.ROAD_HALF + 0.7), 0, z);
      group.add(lamp);
      lampGlows.push({ glow, bulb });
    });
  }

  /* ================= works billboards (the "screens" stretch) ========= */
  /* One tall screen per project along the road, timed to the works cards */
  const worksStretch = { start: 40, step: 52 }; // z positions
  works.forEach((w, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const z = worksStretch.start - i * worksStretch.step;
    const cnv = document.createElement('canvas');
    cnv.width = 512; cnv.height = 384;
    const ctx = cnv.getContext('2d');
    ctx.fillStyle = '#12141d';
    ctx.fillRect(0, 0, 512, 384);
    // accent art: big soft gradient blob + shapes
    const g = ctx.createRadialGradient(150, 120, 20, 200, 160, 340);
    g.addColorStop(0, w.accent);
    g.addColorStop(1, '#12141d');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 384);
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 3;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(120 + k * 70, 330, 34 + k * 8, Math.PI, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 54px "Unbounded", sans-serif';
    ctx.fillText(w.index, 32, 74);
    ctx.font = '600 44px "Unbounded", sans-serif';
    ctx.fillText(w.name, 32, 330);
    ctx.font = '500 24px "Space Grotesk", sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillText(w.kind.toUpperCase(), 34, 362);

    const tex = new THREE.CanvasTexture(cnv);
    tex.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(16, 12, 0.6),
      [null, null, null, null,
        new THREE.MeshBasicMaterial({ map: tex }),
        new THREE.MeshLambertMaterial({ color: '#12141d' }),
      ].map((m) => m || new THREE.MeshLambertMaterial({ color: '#12141d' }))
    );
    // face the road
    board.position.set(side * 14.5, 9.5, z);
    board.rotation.y = side > 0 ? Math.PI : 0;
    const posts = new THREE.Mesh(new THREE.BoxGeometry(0.7, 6, 0.7), poleMat);
    posts.position.set(side * 14.5, 1.8, z);
    group.add(board, posts);
    billboards.push({ board, accent: w.accent, baseY: 9.5 });
  });

  /* ================= end plaza + tower ================= */
  const plazaMat = new THREE.MeshLambertMaterial({ color: '#8a8577' });
  const plaza = new THREE.Mesh(new THREE.CircleGeometry(58, 48), plazaMat);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(0, 0.03, WORLD.PLAZA_Z);
  group.add(plaza);

  // ring of trees around the plaza
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
    const r = 50;
    const tx = Math.cos(a) * r, tz = WORLD.PLAZA_Z + Math.sin(a) * r;
    if (tz > WORLD.ROAD_END + 8 && Math.abs(tx) < WORLD.ROAD_HALF + 6) continue;
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 0.8;
    const leaves = new THREE.Mesh(leafGeo, leafMats[Math.floor(rand() * 3)]);
    leaves.position.y = 2.4;
    tree.add(trunk, leaves);
    tree.position.set(tx, 0, tz);
    group.add(tree);
  }

  // the tower — stepped, illuminated spire (our own landmark)
  const tower = new THREE.Group();
  const towerMat = new THREE.MeshLambertMaterial({ color: '#3d4560', emissive: new THREE.Color('#5f74ff'), emissiveIntensity: 0 });
  nightFaders.push(towerMat);
  let w = 16;
  for (let i = 0; i < 5; i++) {
    const segH = 14 - i * 1.6;
    const seg = new THREE.Mesh(boxGeo, towerMat);
    seg.scale.set(w, segH, w);
    seg.position.y = tower.children.length ? tower.children[tower.children.length - 1].position.y + (tower.children[tower.children.length - 1].scale.y + segH) / 2 : segH / 2;
    tower.add(seg);
    w *= 0.78;
  }
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.7, 16, 6), towerMat);
  const lastSeg = tower.children[tower.children.length - 1];
  spire.position.y = lastSeg.position.y + lastSeg.scale.y / 2 + 8;
  tower.add(spire);
  const beacon = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(255,120,120,1)', 'rgba(255,60,60,0)'),
    transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  beacon.scale.set(10, 10, 1);
  beacon.position.y = spire.position.y + 8.4;
  tower.add(beacon);
  tower.position.set(-18, 0, WORLD.TOWER_Z);
  group.add(tower);

  // floating "contact" beacon column of light the camera flies through at the end
  const beamTex = glowTexture('rgba(150,170,255,1)', 'rgba(120,140,255,0)');
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(1.2, 2.2, 160, 12, 1, true),
    new THREE.MeshBasicMaterial({
      map: beamTex, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false,
    })
  );
  beam.position.set(10, 80, WORLD.PLAZA_Z - 20);
  group.add(beam);

  /* ================= API ================= */
  return {
    group,
    /** progress 0..1, time seconds */
    update(p, t) {
      // windows & tower light up from p≈0.8 → 0.95
      const night = THREE.MathUtils.smoothstep(p, 0.78, 0.95);
      nightFaders.forEach((m) => { m.emissiveIntensity = night * 1.15; });
      lampGlows.forEach(({ glow, bulb }) => {
        glow.material.opacity = night * 0.85;
        bulb.material.color.set(night > 0.4 ? '#ffd28a' : '#332f26');
      });
      beacon.material.opacity = night * (0.55 + 0.45 * Math.sin(t * 2.4));
      beam.material.opacity = THREE.MathUtils.smoothstep(p, 0.9, 0.985) * 0.5;
      beam.rotation.y = t * 0.25;
      billboards.forEach((b, i) => {
        b.board.position.y = b.baseY + Math.sin(t * 0.8 + i * 1.7) * 0.25;
      });
    },
  };
}
