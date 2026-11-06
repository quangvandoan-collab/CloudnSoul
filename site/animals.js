// Deer, rabbits and birds drawn by code as pixel art, plus flocks crossing the far sky.
import * as THREE from './vendor/three.module.min.js';

const LINE = '#1d1612';
function deerFrame(p, f) {
  const c = { hide: '#a8693a', dark: '#7d4b28', pale: '#e9d8bd', spot: '#f2e6d1', horn: '#6a4f33' };
  const graze = f === 4;
  // Legs: four frames of walking, then still.
  const sw = f < 4 ? [[2, -2, -2, 2], [1, 0, -1, 0], [-2, 2, 2, -2], [-1, 0, 1, 0]][f] : [0, 0, 0, 0];
  [[14, 0, c.dark], [18, 1, c.hide], [34, 2, c.dark], [38, 3, c.hide]].forEach(([x, i, col]) => {
    p(x + sw[i], 28, 3, 12, col); p(x + sw[i], 40, 3, 2, LINE);
  });
  p(13, 17, 28, 12, c.hide); p(15, 15, 22, 3, c.hide); p(14, 25, 26, 4, c.pale);
  p(39, 16, 4, 6, c.hide); p(41, 14, 4, 5, c.pale); // Tail.
  for (const [x, y] of [[20, 18], [25, 21], [30, 18], [35, 21], [23, 16], [33, 16]]) p(x, y, 2, 2, c.spot);
  if (graze) {
    p(7, 19, 9, 6, c.hide); p(3, 24, 7, 6, c.hide); p(1, 28, 4, 4, c.dark); p(1, 30, 2, 2, LINE);
    p(6, 25, 2, 2, LINE);
    p(10, 19, 3, 4, c.dark);
    p(9, 16, 1, 6, c.horn); p(6, 15, 4, 1, c.horn); p(11, 13, 1, 7, c.horn); p(11, 13, 4, 1, c.horn);
  } else {
    p(9, 9, 7, 10, c.hide); p(4, 4, 9, 7, c.hide); p(1, 7, 5, 4, c.pale); p(0, 9, 2, 2, LINE);
    p(7, 6, 2, 2, LINE);
    p(11, 2, 4, 4, c.dark);
    p(7, 0, 1, 4, c.horn); p(4, 0, 4, 1, c.horn); p(9, 0, 1, 4, c.horn); p(9, 0, 5, 1, c.horn);
  }
}
function rabbitFrame(p, f) {
  const c = { fur: '#b9a48b', dark: '#8a755f', pale: '#efe6d8', pink: '#d99a9a' };
  const up = f === 1 ? 2 : 0;
  const stretch = f === 1 ? 2 : 0;
  p(7, 8 - up, 11 + stretch, 8, c.fur); p(9, 15 - up, 8, 2, c.pale);
  p(16 + stretch, 9 - up, 4, 4, c.pale); // Tail.
  p(3, 6 - up, 7, 6, c.fur); p(2, 9 - up, 2, 2, c.pink); p(5, 7 - up, 2, 2, LINE);
  p(6, 0 - up, 2, 7, c.fur); p(9, 0 - up, 2, 7, c.dark); p(6, 1 - up, 1, 4, c.pink);
  if (f === 1) { p(6, 15, 3, 3, c.dark); p(17, 15, 4, 3, c.dark); } else { p(6, 16, 4, 2, c.dark); p(14, 15, 5, 3, c.dark); }
  if (f === 2) p(1, 11, 3, 1, '#6c9148');
}
function birdFrame(p, f) {
  const c = { body: '#5c7fa3', dark: '#37506c', belly: '#ecdcc2', beak: '#d99a2b' };
  if (f >= 2) {
    p(5, 7, 8, 4, c.body); p(3, 7, 3, 3, c.dark); p(2, 8, 1, 1, c.beak); p(4, 8, 1, 1, LINE); p(12, 8, 3, 2, c.dark);
    if (f === 2) { p(7, 1, 5, 6, c.dark); p(8, 0, 2, 2, c.dark); } else p(7, 10, 5, 3, c.dark);
    return;
  }
  const down = f === 1 ? 3 : 0;
  p(5, 5, 7, 5, c.body); p(7, 8, 4, 2, c.belly); p(11, 7, 4, 2, c.dark);
  p(3, 3 + down, 4, 4, c.body); p(2, 5 + down, 1, 1, c.beak); p(4, 4 + down, 1, 1, LINE);
  p(7, 10, 1, 3, LINE); p(9, 10, 1, 3, LINE);
}
const KINDS = {
  deer: { w: 46, h: 44, cols: 5, frame: deerFrame, height: 1.55, name: 'A deer', flee: 10, speed: 1.1, run: 6 },
  rabbit: { w: 24, h: 20, cols: 3, frame: rabbitFrame, height: 0.42, name: 'A rabbit', flee: 5, speed: 0, run: 4.5 },
  bird: { w: 16, h: 14, cols: 4, frame: birdFrame, height: 0.3, name: 'A bird', flee: 3.5, speed: 0, run: 0 },
};
function outline(g, x0, y0, W, H) {
  const d = g.getImageData(x0, y0, W, H).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0;
  g.fillStyle = LINE;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) g.fillRect(x0 + x, y0 + y, 1, 1);
}
// Row 0 faces left, row 1 faces right.
export function animalSheet(kind) {
  const k = KINDS[kind];
  const c = document.createElement('canvas');
  c.width = k.w * k.cols; c.height = k.h * 2;
  const g = c.getContext('2d', { willReadFrequently: true });
  for (let f = 0; f < k.cols; f++) {
    const x0 = f * k.w;
    k.frame((x, y, w, h, col) => { if (y + 2 >= 0) { g.fillStyle = col; g.fillRect(x0 + x + 1, y + 2, w, h); } }, f);
    outline(g, x0, 0, k.w, k.h);
    g.save(); g.translate(x0 + k.w, k.h); g.scale(-1, 1); g.drawImage(c, x0, 0, k.w, k.h, 0, 0, k.w, k.h); g.restore();
  }
  return c;
}
const rnd = (a, b) => a + Math.random() * (b - a);
export function createAnimals(scene, { phone, groundAt, still, temple }) {
  const textures = {};
  const texFor = (kind) => {
    if (!textures[kind]) {
      const t = new THREE.CanvasTexture(animalSheet(kind));
      t.colorSpace = THREE.SRGBColorSpace; t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
      t.repeat.set(1 / KINDS[kind].cols, 1 / 2);
      textures[kind] = t;
    }
    const m = textures[kind].clone(); m.needsUpdate = true; return m;
  };
  const list = [];
  function spawn(kind, box, startY) {
    const k = KINDS[kind];
    const map = texFor(kind);
    const mat = new THREE.SpriteMaterial({ map, alphaTest: 0.5 });
    const s = new THREE.Sprite(mat);
    s.scale.set((k.height * k.w) / k.h, k.height, 1);
    s.center.set(0.5, 0.04);
    s.userData.animal = k.name;
    const x = rnd(box[0], box[1]); const z = rnd(box[2], box[3]);
    const y = groundAt(x, z, startY);
    s.position.set(x, y, z);
    s.renderOrder = 2;
    scene.add(s);
    list.push({ kind, k, s, mat, map, box, x, z, y, startY, dir: Math.random() < 0.5 ? -1 : 1, tx: x, tz: z, wait: rnd(0, 6), mode: 'rest', air: 0, phase: Math.random() * 10 });
  }
  const scale = phone ? 0.5 : 1;
  const many = (n) => Math.max(1, Math.round(n * scale));
  // Deer graze under the garden trees and on the hills beside the forest road.
  const fieldY = temple ? -2 : -0.8;
  for (let i = 0; i < many(3); i++) spawn('deer', [62, 124, -46, 2], fieldY);
  for (let i = 0; i < many(3); i++) spawn('deer', [-124, -62, -46, 2], fieldY);
  if (!temple) for (let i = 0; i < many(5); i++) spawn('deer', [-60, 45, 390, 540], -90);
  else for (let i = 0; i < many(4); i++) spawn('deer', [-50, 50, -196, -150], fieldY);
  // Rabbits in the gardens and around the terraces.
  for (const side of [1, -1]) {
    const bx = side > 0 ? [62, 124] : [-124, -62];
    for (let i = 0; i < many(5); i++) spawn('rabbit', [bx[0], bx[1], 2, 56], fieldY);
    for (let i = 0; i < many(3); i++) spawn('rabbit', [bx[0], bx[1], -46, 2], fieldY);
  }
  if (temple) for (let i = 0; i < many(5); i++) spawn('rabbit', [-2, 2, 15, 44], -1.75);
  if (!temple) for (let i = 0; i < many(5); i++) spawn('rabbit', [-55, 40, 400, 530], -90);
  // Birds on the paving, the terraces and the bridge.
  const perch = temple ? [[[-36, 36, -5, -2], -1.8, 6], [[-2, 2, 18, 42], -1.75, 3], [[-26, 26, 178, 206], -60, 5], [[-64, -26, 132, 162], -40, 4], [[26, 64, 92, 124], -20, 4], [[-4, 4, 215, 330], -60, 5]] : [[[-40, 40, 8, 54], 0, 8], [[-26, 26, 178, 206], -60, 5], [[-64, -26, 132, 162], -40, 4], [[26, 64, 92, 124], -20, 4], [[-4, 4, 215, 330], -60, 5], [[60, 124, 2, 56], -0.8, 5], [[-124, -60, 2, 56], -0.8, 5]];
  for (const [box, y, n] of perch) for (let i = 0; i < many(n); i++) spawn('bird', box, y);

  // ---------- Flocks in the far sky ----------
  const wing = new THREE.BufferGeometry();
  wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.35, -1, 0, 0.15, 0, 0, 0.3, 0, 0, -0.35, 1, 0, 0.15, 0, 0, 0.3], 3));
  const flockU = { uTime: { value: 0 } };
  const flockMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, uniforms: flockU, transparent: true,
    vertexShader: `attribute float aPhase; uniform float uTime; varying float vP;
      void main() {
        vec3 p = position;
        p.y += abs(p.x) * sin(uTime * 7.0 + aPhase) * 0.8;
        vec4 w = instanceMatrix * vec4(p, 1.0);
        w.y += sin(uTime * 0.7 + aPhase) * 5.0;
        w.x += cos(uTime * 0.5 + aPhase * 1.7) * 7.0;
        gl_Position = projectionMatrix * modelViewMatrix * w;
      }`,
    fragmentShader: `void main() { gl_FragColor = vec4(0.05, 0.05, 0.08, 0.9); }`,
  });
  const flocks = [];
  function flock(count, size, spread, path) {
    const g = wing.clone();
    const phase = new Float32Array(count);
    const mesh = new THREE.InstancedMesh(g, flockMat, count);
    const m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      // Birds spread in loose V lines behind the leader.
      const row = Math.ceil(i / 2); const side = i % 2 ? 1 : -1;
      const x = side * row * spread + rnd(-spread, spread) * 0.5;
      const z = row * spread * 0.8 + rnd(-spread, spread) * 0.5;
      m.makeScale(size, size, size); m.setPosition(x, rnd(-spread, spread) * 0.5, z);
      mesh.setMatrixAt(i, m);
      phase[i] = Math.random() * 6.28;
    }
    g.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phase, 1));
    mesh.frustumCulled = false;
    scene.add(mesh);
    flocks.push({ mesh, path });
  }
  const orbit = (cx, cy, cz, rx, rz, speed, off) => (t) => { const a = t * speed + off; return [cx + Math.cos(a) * rx, cy + Math.sin(a * 2.3) * 14, cz + Math.sin(a) * rz]; };
  flock(phone ? 16 : 34, 9, 18, orbit(0, 220, 1150, 1050, 620, 0.028, 0));
  flock(phone ? 12 : 26, 8, 16, orbit(-300, 330, 500, 900, 700, -0.035, 2.2));
  flock(phone ? 12 : 24, 5.5, 12, orbit(0, 250, -230, 620, 190, 0.05, 1));
  flock(phone ? 8 : 16, 2.1, 6, orbit(0, 62, 90, 230, 190, 0.05, 4));
  const hide = new THREE.Vector3();
  const setRow = (a, f, dir) => { a.map.offset.set(f / a.k.cols, dir < 0 ? 0.5 : 0); };
  const place = (a) => { a.s.position.set(a.x, a.y + a.air, a.z); };
  return {
    sprites: list.map((a) => a.s),
    setTime(name) { const tint = { sunrise: 0.95, morning: 1, sunset: 0.9, night: 0.5 }[name] ?? 1; for (const a of list) a.mat.color.setScalar(tint); },
    update(dt, now, camera, player) {
      const t = now * 0.001;
      flockU.uTime.value = t;
      for (const f of flocks) {
        const p = f.path(t); const q = f.path(t + 1);
        f.mesh.position.set(p[0], p[1], p[2]);
        f.mesh.rotation.y = Math.atan2(q[0] - p[0], q[2] - p[2]) + Math.PI;
      }
      for (const a of list) {
        const near = player ? Math.hypot(a.x - player.x, a.z - player.z) : 999;
        const sameLevel = !player || Math.abs(a.y - player.y) < 6;
        if (near > 180) continue; // Far away: nothing needs to move.
        let frame = 0;
        const flee = sameLevel && near < a.k.flee;
        if (a.kind === 'bird') {
          if (a.mode !== 'fly' && (flee || (!still && (a.wait -= dt) < 0 && Math.random() < 0.01))) {
            a.mode = 'fly'; a.tx = rnd(a.box[0], a.box[1]); a.tz = rnd(a.box[2], a.box[3]); a.total = Math.max(0.8, Math.hypot(a.tx - a.x, a.tz - a.z) / 9); a.left = a.total; a.fx = a.x; a.fz = a.z;
          }
          if (a.mode === 'fly') {
            a.left -= dt;
            const u = 1 - Math.max(0, a.left) / a.total;
            a.x = a.fx + (a.tx - a.fx) * u; a.z = a.fz + (a.tz - a.fz) * u;
            a.y = groundAt(a.x, a.z, a.startY); a.air = Math.sin(u * Math.PI) * 5;
            a.dir = a.tx < a.fx ? -1 : 1;
            frame = 2 + (Math.floor(now / 90) % 2);
            if (a.left <= 0) { a.mode = 'rest'; a.air = 0; a.wait = rnd(4, 20); }
          } else frame = Math.floor(now / 700 + a.phase) % 3 === 0 ? 1 : 0;
        } else if (!still) {
          if (flee && a.mode !== 'flee') { const d = near || 1; a.mode = 'flee'; a.tx = a.x + ((a.x - player.x) / d) * 20; a.tz = a.z + ((a.z - player.z) / d) * 20; a.wait = 0; }
          if (a.mode === 'rest') {
            a.wait -= dt;
            if (a.wait < 0) {
              a.mode = 'walk'; a.tx = Math.max(a.box[0], Math.min(a.box[1], a.x + rnd(-14, 14))); a.tz = Math.max(a.box[2], Math.min(a.box[3], a.z + rnd(-14, 14)));
            }
          }
          if (a.mode === 'walk' || a.mode === 'flee') {
            a.tx = Math.max(a.box[0], Math.min(a.box[1], a.tx)); a.tz = Math.max(a.box[2], Math.min(a.box[3], a.tz));
            const dx = a.tx - a.x; const dz = a.tz - a.z; const d = Math.hypot(dx, dz);
            const speed = a.mode === 'flee' ? a.k.run : a.k.speed || 1.8;
            if (d < 0.3 || (a.mode === 'flee' && near > a.k.flee * 2.4)) { a.mode = 'rest'; a.wait = rnd(5, 18); } else {
              a.x += (dx / d) * speed * dt; a.z += (dz / d) * speed * dt;
              a.y = groundAt(a.x, a.z, a.startY);
              if (Math.abs(dx) > 0.05) a.dir = dx < 0 ? -1 : 1;
            }
          }
          if (a.kind === 'deer') frame = a.mode === 'rest' ? 4 : Math.floor(now / (a.mode === 'flee' ? 90 : 210)) % 4;
          else frame = a.mode === 'rest' ? (Math.floor(now / 800 + a.phase) % 3 === 0 ? 2 : 0) : Math.floor(now / 130) % 2;
          a.air = a.kind === 'rabbit' && a.mode !== 'rest' ? Math.abs(Math.sin(now * 0.012)) * 0.28 : 0;
        } else frame = a.kind === 'deer' ? 4 : 0;
        place(a);
        // Show the side that matches which way they move on screen.
        hide.set(a.x - camera.position.x, 0, a.z - camera.position.z);
        const screenDir = a.dir * (-hide.z >= 0 ? 1 : -1);
        setRow(a, frame, screenDir);
      }
    },
  };
}
