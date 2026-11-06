// Paper lotus lanterns (đèn hoa đăng) drifting on the pond, one for each wish.
import * as THREE from '../vendor/three.module.min.js';

export function createLanterns(scene, max, reducedMotion) {
  const WORLD = window.AM_WORLD;
  const water = WORLD.POND.waterY;
  // An open lotus: a low cup whose rim rises and falls into petal tips.
  const lotus = new THREE.CylinderGeometry(0.78, 0.26, 0.42, 16, 1, true);
  const rim = lotus.attributes.position;
  for (let i = 0; i < rim.count; i++) {
    if (rim.getY(i) <= 0) continue;
    const angle = Math.atan2(rim.getZ(i), rim.getX(i));
    const tip = Math.cos(angle * 8) * 0.5 + 0.5;
    const radius = 0.5 + tip * 0.32;
    rim.setXYZ(i, Math.cos(angle) * radius, 0.1 + tip * 0.28, Math.sin(angle) * radius);
  }
  const cup = new THREE.InstancedMesh(lotus, new THREE.MeshBasicMaterial({ color: 0xffb7a6, side: THREE.DoubleSide }), max);
  const flame = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffe7a3 }), max);
  // One soft glow per lantern, drawn together so forty stay cheap on phones.
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 64;
  const glowPen = glowCanvas.getContext('2d');
  const gradient = glowPen.createRadialGradient(32, 32, 2, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,210,130,.85)');
  gradient.addColorStop(1, 'rgba(255,170,90,0)');
  glowPen.fillStyle = gradient;
  glowPen.fillRect(0, 0, 64, 64);
  const glowAt = new Float32Array(max * 3);
  const glowGeometry = new THREE.BufferGeometry();
  glowGeometry.setAttribute('position', new THREE.BufferAttribute(glowAt, 3));
  const glow = new THREE.Points(glowGeometry, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(glowCanvas), size: 3.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.frustumCulled = false;
  scene.add(glow);
  cup.count = flame.count = 0;
  cup.frustumCulled = flame.frustumCulled = false;
  scene.add(cup, flame);

  let list = [];
  const matrix = new THREE.Matrix4();
  const place = () => {
    const [x0, x1, z0, z1] = WORLD.POND.rect;
    for (let i = 0; i < 60; i++) {
      const x = x0 + 2 + Math.random() * (x1 - x0 - 4);
      const z = z0 + 2 + Math.random() * (z1 - z0 - 4);
      // Clear of the bank, the island and the bridges, even as it drifts.
      if ([[0, 0], [1.6, 0], [-1.6, 0], [0, 1.6], [0, -1.6]].every(([a, b]) => WORLD.isWater(x + a, z + b))) return { x, z };
    }
    return { x: x0 + 4, z: z0 + 4 };
  };
  const make = (wish) => ({ wish, ...place(), seed: Math.random() * 100 });
  const position = (l, now) => {
    const k = reducedMotion ? 0 : now * 0.00012;
    return { x: l.x + Math.sin(k + l.seed) * 1.1, z: l.z + Math.cos(k * 0.8 + l.seed) * 1.1 };
  };

  return {
    set(wishes) { list = wishes.slice(-max).map(make); },
    add(wish) {
      list.push(make(wish));
      if (list.length > max) list.shift();
    },
    get count() { return list.length; },
    at(x, z) {
      const now = performance.now();
      let best = null;
      let bestD = 1.6;
      for (const l of list) {
        const p = position(l, now);
        const d = Math.hypot(p.x - x, p.z - z);
        if (d < bestD) { best = l.wish; bestD = d; }
      }
      return best;
    },
    update(now) {
      cup.count = flame.count = list.length;
      list.forEach((l, i) => {
        const p = position(l, now);
        matrix.makeTranslation(p.x, water + 0.14, p.z);
        cup.setMatrixAt(i, matrix);
        matrix.makeTranslation(p.x, water + 0.36, p.z);
        flame.setMatrixAt(i, matrix);
        glowAt.set([p.x, water + 0.5, p.z], i * 3);
      });
      glowGeometry.setDrawRange(0, list.length);
      glowGeometry.attributes.position.needsUpdate = true;
      cup.instanceMatrix.needsUpdate = true;
      flame.instanceMatrix.needsUpdate = true;
    },
  };
}
