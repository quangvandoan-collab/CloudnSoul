// Rooms built only when someone goes there, so the nave stays light on phones.
// crypt: the low vaulted hall under the church and its two quiet chapels.
// hall: the refectory and the kitchen behind it.
import * as THREE from './vendor/three.module.min.js';
import { makeFigure } from './figures.js';
import { createPeople } from './people.js';

const TRS = (x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
const lit = (o) => new THREE.MeshLambertMaterial(o);
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function blocks(g, w, h, base, joint, rows, cols, spread) {
  g.fillStyle = joint; g.fillRect(0, 0, w, h);
  const c = new THREE.Color();
  for (let r = 0; r < rows; r++) for (let i = -1; i < cols; i++) {
    const x = ((i + (r % 2) * 0.5) * w) / cols; const y = (r * h) / rows;
    c.set(base).multiplyScalar(1 - spread / 2 + Math.random() * spread);
    g.fillStyle = `#${c.getHexString()}`;
    g.fillRect(x + 2, y + 2, w / cols - 4, h / rows - 4);
  }
  g.globalAlpha = 0.08;
  for (let i = 0; i < 900; i++) { g.fillStyle = i % 2 ? '#000' : '#fff'; g.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 5, 1 + Math.random() * 3); }
  g.globalAlpha = 1;
}
const flameTex = canvasTex(32, 48, (g, w, h) => {
  const r = g.createRadialGradient(w / 2, h * 0.68, 1, w / 2, h * 0.6, h * 0.45);
  r.addColorStop(0, 'rgba(255,245,200,1)'); r.addColorStop(0.35, 'rgba(255,190,80,.9)'); r.addColorStop(1, 'rgba(255,90,10,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
});
class Kit {
  constructor(scene) { this.scene = scene; this.parts = new Map(); this.world = new Set(); this.candles = []; }
  add(geo, mat, m) { const g = geo.index ? geo.toNonIndexed() : geo; if (m) g.applyMatrix4(m); if (!this.parts.has(mat)) this.parts.set(mat, []); this.parts.get(mat).push(g); }
  box(w, h, d, x, y, z, mat) { this.add(new THREE.BoxGeometry(w, h, d), mat, TRS(x, y + h / 2, z)); }
  cyl(r0, r1, h, x, y, z, mat, seg = 12) { this.add(new THREE.CylinderGeometry(r0, r1, h, seg), mat, TRS(x, y + h / 2, z)); }
  candle(x, y, z, h = 0.3) { this.candles.push([x, y, z, h]); }
  // A wall along x with arched openings: [centre, bottom, width, straight height].
  wall(x0, x1, y1, z, holes, mat, t = 0.8, alongZ = false) {
    const s = new THREE.Shape([new THREE.Vector2(x0, 0), new THREE.Vector2(x1, 0), new THREE.Vector2(x1, y1), new THREE.Vector2(x0, y1)]);
    for (const [c, y, w, sp] of holes) {
      const p = new THREE.Path();
      p.moveTo(c - w / 2, y); p.lineTo(c - w / 2, y + sp); p.absarc(c, y + sp, w / 2, Math.PI, 0, true); p.lineTo(c + w / 2, y); p.lineTo(c - w / 2, y);
      s.holes.push(p);
    }
    const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 10 });
    g.translate(0, 0, -t / 2);
    if (alongZ) { g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, z, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1)); const p = g.attributes.position; for (let i = 0; i < p.count; i += 3) { const ax = p.getX(i + 1); const ay = p.getY(i + 1); const az = p.getZ(i + 1); p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)); p.setXYZ(i + 2, ax, ay, az); } g.computeVertexNormals(); } else g.translate(0, 0, z);
    this.add(g, mat);
  }
  // A groin vault cell with ribs on the diagonals.
  vault(x0, x1, z0, z1, spring, crown, mat, rib, nu = 14) {
    const pos = []; const idx = [];
    const yAt = (u, v) => spring + (crown - spring) * Math.max(Math.sqrt(Math.max(0, 1 - u * u)), Math.sqrt(Math.max(0, 1 - v * v)));
    for (let j = 0; j <= nu; j++) for (let i = 0; i <= nu; i++) {
      const u = (i / nu) * 2 - 1; const v = (j / nu) * 2 - 1;
      pos.push((x0 + x1) / 2 + (u * (x1 - x0)) / 2, yAt(u, v), (z0 + z1) / 2 + (v * (z1 - z0)) / 2);
    }
    for (let j = 0; j < nu; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i; idx.push(a, a + 1, a + nu + 1, a + 1, a + nu + 2, a + nu + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    const flat = g.toNonIndexed();
    flat.computeVertexNormals();
    this.add(flat, mat);
    if (rib) for (const sign of [-1, 1]) {
      const pts = [];
      for (let k = 0; k <= 12; k++) { const u = (k / 12) * 2 - 1; const v = u * sign; pts.push(new THREE.Vector3((x0 + x1) / 2 + (u * (x1 - x0)) / 2, yAt(u * 0.995, v * 0.995) - 0.06, (z0 + z1) / 2 + (v * (z1 - z0)) / 2)); }
      this.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.12, 5), rib);
    }
  }
  bake() {
    for (const [mat, list] of this.parts) {
      let n = 0;
      for (const g of list) n += g.attributes.position.count;
      const pos = new Float32Array(n * 3); const nor = new Float32Array(n * 3); const uv = new Float32Array(n * 2);
      let o = 0;
      const world = this.world.has(mat);
      for (const g of list) {
        if (!g.attributes.normal) g.computeVertexNormals();
        const p = g.attributes.position; const q = g.attributes.normal; const u = g.attributes.uv;
        for (let i = 0; i < p.count; i++, o++) {
          const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
          const a = Math.abs(q.getX(i)); const b = Math.abs(q.getY(i)); const c = Math.abs(q.getZ(i));
          pos[o * 3] = x; pos[o * 3 + 1] = y; pos[o * 3 + 2] = z;
          nor[o * 3] = q.getX(i); nor[o * 3 + 1] = q.getY(i); nor[o * 3 + 2] = q.getZ(i);
          if (world) { const [s, t] = b > a && b > c ? [x, z] : a > c ? [z, y] : [x, y]; uv[o * 2] = s; uv[o * 2 + 1] = t; } else if (u) { uv[o * 2] = u.getX(i); uv[o * 2 + 1] = u.getY(i); }
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
    }
    const body = new THREE.CylinderGeometry(0.035, 0.045, 1, 6).translate(0, 0.5, 0);
    const wax = new THREE.InstancedMesh(body, lit({ color: 0xf0e4c4, emissive: 0xff9c45, emissiveIntensity: 0.55 }), this.candles.length);
    const flamePos = new Float32Array(this.candles.length * 3);
    this.candles.forEach(([x, y, z, h], i) => { wax.setMatrixAt(i, TRS(x, y, z, 0, 0, 0, 1, h, 1)); flamePos.set([x, y + h + 0.08, z], i * 3); });
    wax.frustumCulled = false;
    this.scene.add(wax);
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(flamePos, 3));
    this.flameMat = new THREE.PointsMaterial({ map: flameTex, size: 0.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const flames = new THREE.Points(fg, this.flameMat);
    flames.frustumCulled = false;
    this.scene.add(flames);
  }
}
function instanced(scene, geo, mat, list) {
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  list.forEach((t, i) => m.setMatrixAt(i, t));
  m.frustumCulled = false;
  scene.add(m);
  return m;
}
function materials(kit) {
  const stoneTex = canvasTex(512, 512, (g, w, h) => blocks(g, w, h, '#8b7c68', '#4c4136', 8, 4, 0.3), true); stoneTex.repeat.set(0.22, 0.22);
  const floorTex = canvasTex(512, 512, (g, w, h) => blocks(g, w, h, '#6c6155', '#2d2720', 4, 3, 0.35), true); floorTex.repeat.set(0.16, 0.16);
  const plasterTex = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d3c2a2'; g.fillRect(0, 0, w, h); g.globalAlpha = 0.05; for (let i = 0; i < 600; i++) { g.fillStyle = i % 2 ? '#6d5a3c' : '#fff'; g.beginPath(); g.arc(Math.random() * w, Math.random() * h, 2 + Math.random() * 14, 0, 7); g.fill(); } g.globalAlpha = 1; }, true); plasterTex.repeat.set(0.2, 0.2);
  const M = {
    stone: lit({ map: stoneTex }), floor: lit({ map: floorTex }), plaster: lit({ map: plasterTex }),
    carve: lit({ color: 0xb9a98f }), wood: lit({ color: 0x70472a }), dark: lit({ color: 0x3a2415 }), iron: lit({ color: 0x2c2826 }),
    gold: new THREE.MeshPhongMaterial({ color: 0xd6a53a, specular: 0xffe7a0, shininess: 60, emissive: 0x3a2506 }),
    copper: new THREE.MeshPhongMaterial({ color: 0xb4663a, specular: 0xffc9a0, shininess: 50, emissive: 0x1e0d05 }),
    white: lit({ color: 0xe4dbc8 }), cloth: lit({ color: 0x7c1d22 }), linen: lit({ color: 0xe9e2d0 }), bread: lit({ color: 0xb87a38 }), straw: lit({ color: 0xa68548 }), sack: lit({ color: 0xbcae8f }), soot: lit({ color: 0x14100d }),
  };
  for (const m of [M.stone, M.floor, M.plaster]) kit.world.add(m);
  return M;
}
function loadPicture(file, mat, onload) {
  new THREE.TextureLoader().load(file, (t) => { t.colorSpace = THREE.SRGBColorSpace; mat.map = t; mat.color.setScalar(0.85); mat.needsUpdate = true; onload(); });
}

function buildCrypt(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070504);
  scene.fog = new THREE.FogExp2(0x0d0805, 0.022);
  const kit = new Kit(scene); const M = materials(kit);
  kit.add(new THREE.PlaneGeometry(76, 60).rotateX(-Math.PI / 2), M.floor, TRS(0, 0, 15));
  const xs = [-20, -12, -4, 4, 12, 20]; const zs = [-10, 0, 10, 20, 30, 40];
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) kit.vault(xs[i], xs[i + 1], zs[j], zs[j + 1], 3.3, 6.9, M.stone, M.carve, 10);
  for (const x of xs.slice(1, -1)) for (const z of zs.slice(1, -1)) {
    kit.cyl(0.52, 0.56, 3.1, x, 0.35, z, M.carve, 14);
    kit.box(1.5, 0.35, 1.5, x, 0, z, M.stone);
    kit.cyl(0.85, 0.55, 0.45, x, 3.1, z, M.carve, 8);
  }
  // Walls, with arches to the quiet chapels.
  kit.wall(-10, 40, 7, -20, [[5, 0, 6, 3], [15, 0, 6, 3], [25, 0, 6, 3]], M.stone, 0.8, true);
  kit.wall(-10, 40, 7, 20, [[5, 0, 6, 3], [15, 0, 6, 3], [25, 0, 6, 3]], M.stone, 0.8, true);
  kit.wall(-20, 20, 7, -10, [], M.stone);
  kit.wall(-20, 20, 7, 40, [[0, 0, 4, 3.4]], M.stone);
  kit.box(4.4, 3, 0.1, 0, 0, 40.5, M.dark);
  // The altar at the far end.
  kit.box(9, 0.25, 6, 0, 0, -6.6, M.stone); kit.box(7, 0.25, 4.4, 0, 0.25, -7.2, M.carve);
  kit.box(3.6, 1.05, 1.3, 0, 0.5, -7.6, M.white); kit.box(3.8, 0.08, 1.5, 0, 1.55, -7.6, M.linen); kit.box(0.5, 0.02, 1.52, 0, 1.63, -7.6, M.cloth);
  kit.box(0.26, 3.6, 0.14, 0, 1.64, -9.2, M.gold); kit.box(1.9, 0.26, 0.14, 0, 4, -9.2, M.gold);
  for (const k of [-1.4, -0.8, 0.8, 1.4]) { kit.cyl(0.03, 0.09, 0.55, k, 1.63, -7.7, M.gold, 8); kit.candle(k, 2.18, -7.7, 0.42); }
  // Stone tombs along the side aisles.
  const tomb = (x, z) => {
    kit.box(1.5, 0.75, 3.1, x, 0, z, M.carve);
    kit.box(1.7, 0.14, 3.3, x, 0.75, z, M.stone);
    kit.add(new THREE.CapsuleGeometry(0.3, 1.5, 4, 10).rotateX(Math.PI / 2), M.white, TRS(x, 1.08, z, 0, 0, 0, 1, 0.65, 1));
    kit.add(new THREE.SphereGeometry(0.2, 10, 8), M.white, TRS(x, 1.2, z - 1.05));
    kit.box(0.08, 0.05, 0.75, x, 1.28, z + 0.1, M.gold); kit.box(0.4, 0.05, 0.08, x, 1.28, z - 0.05, M.gold);
    for (const q of [-1.4, 1.4]) for (const s of [-1, 1]) { kit.cyl(0.05, 0.08, 0.1, x + s * 0.95, 0, z + q, M.iron, 6); kit.candle(x + s * 0.95, 0.1, z + q, 0.24); }
  };
  for (const x of [-16, -8, 8, 16]) for (const z of [5, 25]) tomb(x, z);
  // Memorial niches on the end wall, without names.
  for (const side of [-1, 1]) for (let r = 0; r < 3; r++) for (let c = 0; c < 7; c++) {
    const x = side * (6.2 + c * 1.9); const y = 0.7 + r * 1.55;
    kit.box(1.65, 1.3, 0.12, x, y, -9.56, M.carve); kit.box(1.25, 0.95, 0.04, x, y + 0.18, -9.48, M.soot);
    if ((r + c * 2) % 3 === 0) { kit.box(0.14, 0.03, 0.2, x, y + 0.2, -9.42, M.gold); kit.candle(x, y + 0.2, -9.4, 0.14); }
  }
  // The quiet chapels: benches, an altar and a statue.
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? 20 : -36; const x1 = sx > 0 ? 36 : -20;
    kit.vault(x0, x1, 0, 30, 2.9, 5.5, M.plaster, M.carve, 14);
    kit.wall(0, 30, 6, sx * 36, [], M.stone, 0.8, true);
    kit.wall(x0, x1, 6, 0, [], M.stone); kit.wall(x0, x1, 6, 30, [], M.stone);
    for (let z = 4; z <= 25; z += 3.2) { kit.box(5.2, 0.42, 0.42, sx * 26, 0, z, M.wood); kit.box(5.2, 0.5, 0.08, sx * 26, 0.42, z + 0.22, M.dark); }
    kit.box(1.2, 1, 2.6, sx * 34.4, 0.2, 15, M.white); kit.box(2.6, 0.2, 5, sx * 33.8, 0, 15, M.carve); kit.box(1.3, 0.06, 2.7, sx * 34.4, 1.2, 15, M.linen);
    kit.box(0.9, 1, 1.1, sx * 35, 1.26, 15, M.carve);
    const fig = makeFigure(sx > 0 ? 'mary' : 'saint');
    const colour = sx > 0 ? 0x2f58b8 : 0x7a3a2a;
    for (const [g, mat] of [[fig.marble, M.white], [fig.paint, lit({ color: colour })], [fig.gold, M.gold]]) { const m = new THREE.Mesh(g, mat); m.applyMatrix4(TRS(sx * 35, 2.26, 15, sx > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0, 0.95, 0.95, 0.95)); scene.add(m); }
    for (const q of [-1, 1]) { kit.cyl(0.03, 0.08, 0.4, sx * 34.3, 1.26, 15 + q, M.gold, 8); kit.candle(sx * 34.3, 1.66, 15 + q, 0.3); }
    const l = new THREE.PointLight(0xffb878, 26, 16, 1.7); l.position.set(sx * 30, 3.8, 15); scene.add(l);
  }
  scene.add(new THREE.HemisphereLight(0xc9b8a0, 0x2a2018, 0.55));
  for (const [x, z, p] of [[0, -4, 90], [0, 15, 55], [0, 32, 40], [-14, 15, 26], [14, 15, 26]]) { const l = new THREE.PointLight(0xffb06a, p, 26, 1.7); l.position.set(x, 3.9, z); scene.add(l); }
  kit.bake();
  const people = createPeople(scene, window.CHURCH_CAST.ROOM_CAST.crypt);
  return { scene, kit, people, title: 'Crypt', flicker() {} , setTime() {} };
}

function buildHall(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0806);
  const kit = new Kit(scene); const M = materials(kit);
  kit.add(new THREE.PlaneGeometry(56, 40).rotateX(-Math.PI / 2), M.floor, TRS(0, 0, 55));
  // ---------- Refectory: x -27 to 27, z 36 to 56 ----------
  const winX = [-21, -12, -3, 6, 15, 24];
  kit.wall(-27, 27, 12, 36, winX.map((c) => [c, 3, 3.2, 4.4]), M.plaster);
  kit.wall(-27, 27, 12, 56, [[-14, 0, 4, 3.2]], M.plaster);
  kit.wall(36, 56, 12, -27, [], M.plaster, 0.8, true);
  kit.wall(36, 56, 12, 27, [], M.plaster, 0.8, true);
  const glassTex = canvasTex(128, 128, (g, w, h) => {
    g.fillStyle = '#e6d9a9'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2f2518'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(w / 2, 0); g.lineTo(w, h / 2); g.lineTo(w / 2, h); g.closePath(); g.stroke();
  }, true);
  glassTex.repeat.set(108, 24);
  const glass = new THREE.MeshBasicMaterial({ map: glassTex, toneMapped: false });
  const glass2Tex = glassTex.clone(); glass2Tex.repeat.set(8, 12); glass2Tex.needsUpdate = true;
  const glass2 = new THREE.MeshBasicMaterial({ map: glass2Tex, toneMapped: false });
  kit.add(new THREE.PlaneGeometry(54, 12), glass, TRS(0, 6, 35.75));
  // Panelling and a bench rail around the room.
  kit.box(54, 2.1, 0.12, 0, 0, 36.46, M.wood); kit.box(54, 2.1, 0.12, 0, 0, 55.54, M.wood);
  kit.box(0.12, 2.1, 20, -26.54, 0, 46, M.wood); kit.box(0.12, 2.1, 20, 26.54, 0, 46, M.wood);
  kit.box(54.1, 0.1, 0.2, 0, 2.1, 36.5, M.dark); kit.box(54.1, 0.1, 0.2, 0, 2.1, 55.5, M.dark);
  for (let x = -26; x <= 26; x += 1.3) { kit.box(0.05, 2.1, 0.04, x, 0, 36.54, M.dark); if (x < -16.2 || x > -11.8) kit.box(0.05, 2.1, 0.04, x, 0, 55.46, M.dark); }
  // Timber roof.
  kit.box(55, 0.2, 21, 0, 12.2, 46, M.dark);
  for (let x = -24; x <= 24; x += 6) {
    kit.box(0.5, 0.5, 20.4, x, 8.7, 46, M.wood);
    kit.box(0.34, 3.3, 0.34, x, 9.05, 46, M.wood);
    for (const s of [-1, 1]) kit.add(new THREE.BoxGeometry(0.38, 0.42, 11.2), M.wood, TRS(x, 10.6, 46 + s * 5, 0, s * 0.36));
    for (const s of [-1, 1]) kit.add(new THREE.BoxGeometry(0.3, 0.3, 3.1), M.dark, TRS(x, 7.6, 46 + s * 8.9, 0, s * -0.95));
  }
  for (const z of [38, 42, 46, 50, 54]) kit.box(54, 0.22, 0.22, 0, 11.7, z, M.dark);
  // Painted end wall.
  const muralMat = new THREE.MeshBasicMaterial({ color: 0x2a2018, toneMapped: false });
  const mural = new THREE.Mesh(new THREE.PlaneGeometry(9, 6.75), muralMat);
  mural.position.set(26.56, 7.2, 46); mural.rotation.y = -Math.PI / 2; scene.add(mural);
  kit.box(0.12, 7.15, 9.4, 26.62, 3.62, 46, M.gold);
  loadPicture('pictures/p3-small.jpg', muralMat, ctx.redraw);
  // Long tables, benches and places.
  const plateGeo = new THREE.CylinderGeometry(0.15, 0.12, 0.03, 12); const cupGeo = new THREE.CylinderGeometry(0.05, 0.04, 0.12, 8);
  const plates = []; const cups = []; const loaves = [];
  const table = (x0, x1, z) => {
    const c = (x0 + x1) / 2; const len = x1 - x0;
    kit.box(len, 0.1, 1.2, c, 0.78, z, M.wood);
    for (let x = x0 + 1; x < x1; x += 5.5) { kit.box(0.14, 0.78, 0.9, x, 0, z, M.dark); }
    kit.box(len + 0.04, 0.012, 0.5, c, 0.885, z, M.linen);
    for (const s of [-1, 1]) {
      kit.box(len, 0.08, 0.34, c, 0.42, z + s * 1, M.wood);
      for (let x = x0 + 1; x < x1; x += 5.5) kit.box(0.1, 0.42, 0.28, x, 0, z + s * 1, M.dark);
      for (let x = x0 + 0.8; x < x1; x += 1.25) { plates.push(TRS(x, 0.9, z + s * 0.38)); cups.push(TRS(x + 0.3, 0.94, z + s * 0.28)); }
    }
    for (let x = x0 + 1.6; x < x1; x += 2.8) loaves.push(TRS(x, 0.95, z, 0.4, 0, 0, 1, 0.65, 0.7));
    for (let x = x0 + 3.5; x < x1; x += 7) { kit.cyl(0.04, 0.1, 0.3, x, 0.89, z, M.gold, 8); kit.candle(x, 1.19, z, 0.26); }
  };
  table(-9, 18, 41.5); table(-9, 18, 50.5);
  kit.box(5, 0.35, 15, 23.8, 0, 46, M.dark);
  kit.box(1.1, 0.1, 11, 23.6, 1.13, 46, M.wood); kit.box(0.8, 0.78, 10.4, 23.6, 0.35, 46, M.dark); kit.box(0.5, 0.42, 11, 25, 0.35, 46, M.wood); kit.box(0.08, 1.2, 11, 25.3, 0.77, 46, M.dark);
  for (let z = 41.2; z < 51; z += 1.6) { plates.push(TRS(23.2, 1.25, z)); cups.push(TRS(23.1, 1.28, z + 0.32)); }
  kit.cyl(0.05, 0.11, 0.34, 23.6, 1.23, 43.6, M.gold, 8); kit.candle(23.6, 1.57, 43.6, 0.26); kit.cyl(0.05, 0.11, 0.34, 23.6, 1.23, 48.4, M.gold, 8); kit.candle(23.6, 1.57, 48.4, 0.26);
  // Reader's stand.
  kit.box(0.75, 1.15, 0.75, 17.8, 0, 38.6, M.dark); kit.add(new THREE.BoxGeometry(0.85, 0.06, 0.7), M.gold, TRS(17.8, 1.24, 38.6, 0, 0.4)); kit.add(new THREE.BoxGeometry(0.6, 0.05, 0.46), M.linen, TRS(17.8, 1.28, 38.6, 0, 0.4));
  // Wheel chandeliers.
  for (const x of [-4, 4.5, 13]) {
    kit.add(new THREE.CylinderGeometry(0.02, 0.02, 5.2, 5), M.iron, TRS(x, 9.1, 46));
    kit.add(new THREE.TorusGeometry(1.5, 0.05, 6, 28).rotateX(Math.PI / 2), M.iron, TRS(x, 6.5, 46));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; kit.candle(x + Math.cos(a) * 1.5, 6.53, 46 + Math.sin(a) * 1.5, 0.26); }
  }
  instanced(scene, plateGeo, M.white, plates); instanced(scene, cupGeo, M.copper, cups); instanced(scene, new THREE.SphereGeometry(0.17, 10, 8), M.bread, loaves);

  // ---------- Kitchen: x -27 to -1, z 56 to 74 ----------
  kit.wall(56, 74, 8, -27, [], M.stone, 0.8, true);
  kit.wall(56, 74, 8, -1, [[65, 2.6, 2.6, 2]], M.stone, 0.8, true);
  kit.add(new THREE.PlaneGeometry(4, 6), glass2, TRS(-0.5, 5, 65, -Math.PI / 2));
  kit.wall(-27, -1, 8, 74, [[-14, 0, 7, 2.2]], M.stone);
  kit.wall(-27, -1, 8, 56.8, [[-14, 0, 4, 3.2]], M.stone, 0.6);
  kit.vault(-27, -1, 56.5, 74, 3.7, 7.7, M.plaster, M.wood, 18);
  // The great hearth.
  kit.box(8.6, 8, 0.1, -14, 0, 76.1, M.soot); kit.box(0.4, 6, 2.2, -17.8, 0, 75, M.stone); kit.box(0.4, 6, 2.2, -10.2, 0, 75, M.stone); kit.box(8, 0.1, 2.2, -14, 6, 75, M.soot);
  kit.box(8.4, 0.1, 2, -14, 0, 75, M.soot);
  kit.box(9, 0.5, 2.4, -14, 5.4, 73.4, M.carve); kit.box(8.2, 1.7, 1.4, -14, 5.9, 73.8, M.stone);
  for (const s of [-1.1, 0, 1.1]) kit.add(new THREE.CylinderGeometry(0.17, 0.2, 2, 8).rotateZ(Math.PI / 2), M.dark, TRS(-14 + s * 0.2, 0.3 + Math.abs(s) * 0.05, 75 + s * 0.3, s * 0.3));
  kit.add(new THREE.SphereGeometry(0.8, 18, 12, 0, 6.3, 0.75, 2.4), M.iron, TRS(-14, 1.75, 75));
  kit.cyl(0.02, 0.02, 3, -14, 2.4, 75, M.iron, 5);
  kit.box(7.8, 0.08, 0.08, -14, 5.2, 74.5, M.iron);
  // A bread oven with embers.
  kit.box(0.5, 3.2, 3.2, -26.4, 0, 62, M.stone); kit.box(0.08, 0.9, 1.2, -26.1, 1.1, 62, M.soot); kit.box(0.5, 0.25, 3.6, -26.3, 3.2, 62, M.carve);
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xff6a20, toneMapped: false });
  kit.box(0.04, 0.14, 1, -26.04, 1.14, 62, emberMat);
  // Island table and hanging pots.
  kit.box(11, 0.14, 2.2, -14, 0.86, 65, M.wood); kit.box(10.4, 0.1, 1.8, -14, 0.25, 65, M.dark);
  for (const x of [-19, -14, -9]) for (const z of [64.2, 65.8]) kit.box(0.16, 0.9, 0.16, x, 0, z, M.dark);
  kit.box(11, 0.06, 0.06, -14, 3.4, 65, M.iron); for (const x of [-19, -14, -9]) kit.add(new THREE.BoxGeometry(0.04, 4, 0.04), M.iron, TRS(x, 5.4, 65));
  const pots = []; const handles = [];
  for (let x = -19; x <= -9; x += 1.1) { const r = 0.82 + ((x * 7) % 3 === 0 ? 0.3 : 0); pots.push(TRS(x, 2.72, 65, 0, 0, 0, r, 1, r)); handles.push(TRS(x, 3.14, 65)); }
  instanced(scene, new THREE.CylinderGeometry(0.28, 0.24, 0.42, 14), M.copper, pots);
  instanced(scene, new THREE.BoxGeometry(0.03, 0.5, 0.03), M.iron, handles);
  const bread = []; for (let i = 0; i < 16; i++) bread.push(TRS(-18.7 + (i % 8) * 0.65, 1.1, 64.4 + Math.floor(i / 8) * 0.7, 0.3 * (i % 3), 0, 0, 1.2, 0.72, 0.8));
  instanced(scene, new THREE.SphereGeometry(0.18, 10, 8), M.bread, bread);
  kit.box(1.6, 0.05, 1, -9.8, 1, 65, M.linen);
  for (const [x, z, c] of [[-12.2, 64.6, M.straw], [-11, 65.5, M.straw]]) { kit.cyl(0.32, 0.24, 0.3, x, 1, z, c, 12); kit.add(new THREE.SphereGeometry(0.26, 10, 6), M.cloth, TRS(x, 1.3, z, 0, 0, 0, 1, 0.5, 1)); }
  // Shelves of jars and pots.
  const jars = []; const cans = [];
  for (const z of [60, 69.5]) for (let r = 0; r < 4; r++) {
    kit.box(0.5, 0.06, 4.2, -1.8, 1 + r * 0.8, z, M.wood);
    for (let k = 0; k < 7; k++) ((k + r) % 2 ? jars : cans).push(TRS(-1.85, 1.2 + r * 0.8, z - 1.7 + k * 0.56));
  }
  for (const z of [60, 69.5]) for (const q of [-2, 2]) kit.box(0.5, 3.6, 0.08, -1.8, 0, z + q, M.dark);
  instanced(scene, new THREE.CylinderGeometry(0.14, 0.17, 0.3, 10), lit({ color: 0x96704a }), jars);
  instanced(scene, new THREE.CylinderGeometry(0.16, 0.13, 0.28, 12), M.copper, cans);
  // Barrels, sacks and a sink.
  for (const [x, z] of [[-25.4, 72.5], [-24, 72.7], [-25.3, 71.1]]) {
    kit.add(new THREE.CylinderGeometry(0.42, 0.42, 1.1, 14).translate(0, 0.55, 0), M.wood, TRS(x, 0, z));
    for (const y of [0.25, 0.85]) kit.add(new THREE.TorusGeometry(0.43, 0.018, 5, 18).rotateX(Math.PI / 2), M.iron, TRS(x, y, z));
  }
  for (const [x, z] of [[-25.6, 57.8], [-24.6, 58], [-25.2, 59]]) kit.add(new THREE.SphereGeometry(0.46, 10, 8), M.sack, TRS(x, 0.4, z, 0, 0, 0, 1, 0.9, 0.85));
  kit.box(0.9, 0.9, 3, -1.9, 0, 65, M.stone); kit.box(0.7, 0.04, 2.5, -1.9, 0.9, 65, M.soot);
  // Fire.
  const firePos = new Float32Array(46 * 3);
  const fireGeo = new THREE.BufferGeometry(); fireGeo.setAttribute('position', new THREE.BufferAttribute(firePos, 3));
  const fireMat = new THREE.PointsMaterial({ map: flameTex, size: 0.62, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  const fire = new THREE.Points(fireGeo, fireMat); fire.frustumCulled = false; scene.add(fire);
  const fireSeed = Array.from({ length: 46 }, () => [Math.random() * 3.2 - 1.6, Math.random() * 6.3, Math.random()]);
  const placeFire = (now) => {
    fireSeed.forEach(([x, ph, sp], i) => {
      const t = (now * 0.001 * (0.8 + sp) + ph) % 1;
      const n = 1.05 * t;
      firePos.set([-14 + x * (1 - t * 0.6), 0.28 + n, 75 + Math.sin(ph + now * 0.004) * 0.4], i * 3);
    });
    fireGeo.attributes.position.needsUpdate = true;
  };
  placeFire(0);
  const fireLight = new THREE.PointLight(0xff8a3a, 95, 22, 1.5); fireLight.position.set(-14, 2.1, 72.6); scene.add(fireLight);
  const hemi = new THREE.HemisphereLight(0xe6d9c2, 0x3a2c1f, 0.6); scene.add(hemi);
  const lamps = [[-4, 46, 75], [9, 46, 75], [20, 46, 55], [-20, 46, 40], [-14, 62, 40]].map(([x, z, p]) => { const l = new THREE.PointLight(0xffc48a, p, 28, 1.6); l.position.set(x, z === 62 ? 3.1 : 6.2, z); l.userData.base = p; scene.add(l); return l; });
  kit.bake();
  const people = createPeople(scene, window.CHURCH_CAST.ROOM_CAST.hall);
  const LIGHT = { day: [1, 0.95, 0.55], sunset: [0.85, 0.5, 0.85], night: [0.14, 0.2, 1] };
  return {
    scene, kit, people, title: 'Refectory and kitchen',
    flicker(now) { placeFire(now); fireLight.intensity = 90 + Math.sin(now * 0.013) * 12 + Math.sin(now * 0.031) * 8; fireMat.size = 0.6 + Math.sin(now * 0.02) * 0.05; },
    setTime(name) {
      const [g, h, lamp] = LIGHT[name];
      for (const m of [glass, glass2]) m.color.setRGB(g, g * 0.92, g * (name === 'sunset' ? 0.6 : 0.82));
      hemi.intensity = h;
      for (const l of lamps) l.intensity = l.userData.base * (0.5 + lamp * 0.8);
    },
  };
}
const BUILD = { crypt: buildCrypt, hall: buildHall };
export function buildRoom(name, ctx) {
  const room = BUILD[name](ctx);
  const { kit } = room;
  room.update = (dt, now, camera, moving) => {
    room.people.update(dt, now, camera, moving);
    if (moving) { room.flicker(now); kit.flameMat.size = 0.2 + Math.sin(now * 0.017) * 0.012; }
  };
  return room;
}
