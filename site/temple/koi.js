// Koi and food. Fish are simulated in each visitor's browser; the food is shared,
// so everyone sees the same handfuls land and fish rise to them.
import * as THREE from '../vendor/three.module.min.js';

const POND = window.AM_WORLD.POND;
const COUNT = 40;
const MAX_FOOD = 150;
const PATTERNS = [
  [0xf3efe5, 0xe2531f], [0xf6f1e6, 0xd93f1a], [0xe98a24, 0xf6d9a0], [0xf6f1e6, 0x24242a],
  [0xeec14b, 0xf8e8ad], [0xd9431e, 0x2a2a30], [0xf8f6ef, 0xf8f6ef], [0x2b2b30, 0xe8e0d0],
];

// 2D koi: a painted fish seen from above, on a flat strip that bends as it swims.
function paintKoiAtlas() {
  const W = 128; const H = 256; const n = PATTERNS.length;
  const c = document.createElement('canvas'); c.width = W * n; c.height = H;
  const g = c.getContext('2d');
  const hex = (v) => `#${v.toString(16).padStart(6, '0')}`;
  PATTERNS.forEach(([base, patch], i) => {
    g.save();
    g.translate(W * i + W / 2, 0);
    // Tail and fins: soft and see-through.
    g.fillStyle = hex(base); g.globalAlpha = 0.72;
    g.beginPath(); g.moveTo(0, 176); g.bezierCurveTo(-8, 206, -36, 228, -28, 252); g.bezierCurveTo(-14, 240, -4, 226, 0, 214); g.bezierCurveTo(4, 226, 14, 240, 28, 252); g.bezierCurveTo(36, 228, 8, 206, 0, 176); g.fill();
    for (const s of [-1, 1]) {
      g.beginPath(); g.moveTo(s * 14, 66); g.bezierCurveTo(s * 40, 62, s * 58, 88, s * 50, 110); g.bezierCurveTo(s * 36, 104, s * 22, 92, s * 13, 88); g.fill();
      g.beginPath(); g.moveTo(s * 11, 134); g.bezierCurveTo(s * 26, 136, s * 34, 150, s * 30, 164); g.bezierCurveTo(s * 20, 158, s * 12, 152, s * 8, 148); g.fill();
    }
    g.globalAlpha = 1;
    // Body from nose (top) to tail.
    const body = new Path2D('M0,10 C14,10 25,36 25,72 C25,118 14,160 0,190 C-14,160 -25,118 -25,72 C-25,36 -14,10 0,10 Z');
    g.fillStyle = hex(base); g.fill(body);
    g.save(); g.clip(body);
    // Patches differ per fish, so no two patterns look stamped.
    g.fillStyle = hex(patch);
    let seed = i * 7 + 3;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    if (patch !== base) for (let k = 0; k < 6; k++) { g.beginPath(); g.ellipse(-16 + rnd() * 32, 26 + k * 26 + rnd() * 10, 8 + rnd() * 12, 9 + rnd() * 13, rnd() * 3, 0, 6.283); g.fill(); }
    // Scales, and shade along the sides so the back reads as round.
    g.strokeStyle = 'rgba(40,20,10,.13)'; g.lineWidth = 1;
    for (let y = 48; y < 180; y += 8) for (let x = -24 + (y % 16 ? 4 : 0); x < 26; x += 8) { g.beginPath(); g.arc(x, y, 4.5, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); }
    const shade = g.createLinearGradient(-25, 0, 25, 0);
    shade.addColorStop(0, 'rgba(20,20,30,.34)'); shade.addColorStop(0.32, 'rgba(255,255,255,.1)'); shade.addColorStop(0.5, 'rgba(255,255,255,.2)'); shade.addColorStop(0.68, 'rgba(255,255,255,.1)'); shade.addColorStop(1, 'rgba(20,20,30,.34)');
    g.fillStyle = shade; g.fillRect(-30, 0, 60, 200);
    g.restore();
    // Eyes.
    g.fillStyle = '#111';
    for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 12, 28, 2.8, 0, 6.283); g.fill(); }
    g.restore();
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export function createPond(scene, reducedMotion) {
  const uniforms = { uTime: { value: 0 } };
  const material = new THREE.MeshLambertMaterial({ map: paintKoiAtlas(), transparent: true, alphaTest: 0.25, side: THREE.DoubleSide, depthWrite: false });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\nuniform float uTime;\nattribute float swim;\nattribute float aCell;`)
        .replace('#include <uv_vertex>', `#include <uv_vertex>\nvMapUv = vec2((uv.x + aCell) / ${PATTERNS.length}.0, uv.y);`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float bend = smoothstep(0.55, -1.0, position.z);
          transformed.x += sin(uTime * (3.5 + swim * 7.0) + instanceMatrix[3].x + position.z * 3.4) * bend * bend * (0.16 + swim * 0.2);`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance = diffuseColor.rgb * 0.35;');
    };
  // Flat fish: a long strip lying in the water, nose towards +z like the 3D shape.
  const geometry = new THREE.PlaneGeometry(0.95, 1.9, 1, 10);
  geometry.rotateX(-Math.PI / 2);
  geometry.rotateY(Math.PI);
  geometry.translate(0, 0, -0.2);
  const mesh = new THREE.InstancedMesh(geometry, material, COUNT);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3; // Over the water surface, so colours stay vivid.
  const swimAttr = new Float32Array(COUNT);
  const r = POND.rect;
  const free = (x, z, m = 1.2) => x > r[0] + m && x < r[1] - m && z > r[2] + m && z < r[3] - m
    && !POND.blocked.some((b) => x > b[0] - m && x < b[1] + m && z > b[2] - m && z < b[3] + m);
  const fish = [];
  const c = new THREE.Color();
  for (let i = 0; i < COUNT; i++) {
    let x; let z;
    do { x = r[0] + Math.random() * (r[1] - r[0]); z = r[2] + Math.random() * (r[3] - r[2]); } while (!free(x, z, 2));
    mesh.setColorAt(i, c.set(0xffffff));
    const size = 1.05 + Math.random() * 0.75;
    fish.push({ x, z, heading: Math.random() * 6.28, speed: 0.6, size, turn: 0, wander: Math.random() * 10, depth: -0.28 - Math.random() * 0.3, rise: 0 });
  }
  geometry.setAttribute('aCell', new THREE.InstancedBufferAttribute(Float32Array.from({ length: COUNT }, (_, i) => i % PATTERNS.length), 1));
  const swimBuffer = new THREE.InstancedBufferAttribute(swimAttr, 1);
  swimBuffer.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('swim', swimBuffer);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(mesh);

  // Floating pellets and spreading rings where a handful landed.
  const foodMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 6, 4), new THREE.MeshLambertMaterial({ color: 0xc8833a }), MAX_FOOD);
  foodMesh.frustumCulled = false;
  foodMesh.renderOrder = 3;
  scene.add(foodMesh);
  const foods = [];
  const ringGeo = new THREE.RingGeometry(0.92, 1, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const rings = [];
  for (let i = 0; i < 8; i++) {
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    ring.position.y = POND.waterY + 0.015;
    scene.add(ring);
    rings.push({ mesh: ring, t: 1 });
  }
  let nextRing = 0;
  const addRing = (x, z, delay = 0) => {
    const ring = rings[nextRing++ % rings.length];
    ring.mesh.position.x = x;
    ring.mesh.position.z = z;
    ring.t = -delay;
  };

  function dropFood(x, z) {
    for (let i = 0; i < 16; i++) {
      if (foods.length >= MAX_FOOD) foods.shift();
      const a = Math.random() * 6.28;
      const d = Math.sqrt(Math.random()) * 1.5;
      const fx = x + Math.cos(a) * d;
      const fz = z + Math.sin(a) * d;
      foods.push({ x: fx, z: fz, age: 0, seed: Math.random() * 6.28, delay: Math.random() * 0.3 });
    }
    addRing(x, z);
    addRing(x + 0.6, z - 0.4, 0.14);
    addRing(x - 0.5, z + 0.5, 0.28);
  }

  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  function update(dt, now) {
    uniforms.uTime.value = now / 1000;
    for (let i = foods.length - 1; i >= 0; i--) {
      foods[i].age += dt;
      if (foods[i].age > 40) foods.splice(i, 1);
    }
    for (let i = 0; i < COUNT; i++) {
      const f = fish[i];
      let best = null;
      let bestD = 22;
      for (const food of foods) {
        if (food.age < 0.5) continue;
        const d = Math.hypot(food.x - f.x, food.z - f.z);
        if (d < bestD) { bestD = d; best = food; }
      }
      let wanted;
      let targetSpeed;
      if (best) {
        wanted = Math.atan2(best.x - f.x, best.z - f.z);
        targetSpeed = Math.min(3.3, 1 + bestD * 0.34);
        if (bestD < 0.48) {
          foods.splice(foods.indexOf(best), 1);
          addRing(f.x, f.z);
        }
        f.rise += (1 - f.rise) * Math.min(1, dt * 1.6 * (bestD < 6 ? 1 : 0.2));
      } else {
        f.wander += dt * 0.28;
        wanted = f.heading + Math.sin(f.wander + i) * 0.55;
        targetSpeed = 0.45 + Math.sin(f.wander * 0.7 + i * 2) * 0.2;
        f.rise += (0 - f.rise) * Math.min(1, dt * 0.4);
      }
      // Turn back before shores, the island and the bridge.
      const nx = f.x + Math.sin(f.heading) * 3;
      const nz = f.z + Math.cos(f.heading) * 3;
      if (!free(nx, nz)) {
        const home = free(f.x + 8, f.z, 1) ? 1.5 : -1.5;
        wanted = f.heading + home;
        targetSpeed = Math.max(targetSpeed, 0.9);
      }
      let diff = wanted - f.heading;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      f.heading += Math.max(-2.6, Math.min(2.6, diff * 2.6)) * dt;
      f.speed += (targetSpeed - f.speed) * Math.min(1, dt * 1.8);
      const stepX = f.x + Math.sin(f.heading) * f.speed * dt;
      const stepZ = f.z + Math.cos(f.heading) * f.speed * dt;
      if (free(stepX, stepZ, 0.5)) { f.x = stepX; f.z = stepZ; } else f.heading += dt * 2;
      pos.set(f.x, POND.waterY + f.depth * (1 - f.rise * 0.72), f.z);
      q.setFromAxisAngle(up, f.heading);
      scl.setScalar(f.size);
      m4.compose(pos, q, scl);
      mesh.setMatrixAt(i, m4);
      swimAttr[i] = Math.min(1, f.speed / 3.3);
    }
    mesh.instanceMatrix.needsUpdate = true;
    swimBuffer.needsUpdate = true;

    foodMesh.count = foods.length;
    foods.forEach((food, i) => {
      const drop = Math.max(0, 1 - food.age / Math.max(0.01, food.delay));
      const y = POND.waterY + 0.02 + drop * 0.8 + (reducedMotion ? 0 : Math.sin(now * 0.002 + food.seed) * 0.012);
      m4.makeTranslation(food.x, y, food.z);
      foodMesh.setMatrixAt(i, m4);
    });
    foodMesh.instanceMatrix.needsUpdate = true;

    for (const ring of rings) {
      ring.t = Math.min(1, ring.t + dt / 1.7);
      const t = Math.max(0, ring.t);
      ring.mesh.visible = ring.t > 0 && ring.t < 1;
      ring.mesh.scale.setScalar(0.15 + t * 1.9);
      ring.mesh.material.opacity = 0.55 * (1 - t);
    }
  }
  return { update, dropFood, ripple: addRing, foodCount: () => foods.length, fish };
}
