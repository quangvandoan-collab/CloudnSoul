// Stage 2 sample: the church front, built entirely in code with realistic stone, slate and glass.
import * as THREE from './vendor/three.module.min.js';
import { createCharacter } from './sprites.js';
import { createScenery, createSkyMaterial, useSummit, LOOKOUTS, landHeight, underStairs, lakeE, riverNear, skyU, isWaterSide } from './scenery.js';
import { makeFigure } from './figures.js';
import { createPeople, createMe } from './people.js';
import { createFountains } from './fountains.js';
import { createAnimals } from './animals.js';
const TEMPLE = document.body.dataset.site === 'temple';
const life = TEMPLE ? await import('./temple/life.js') : null;
if (TEMPLE) { window.CHURCH_WALK.useTemplePlan(window.AM_WORLD); useSummit(); }
const cloudKit = TEMPLE ? await import('./clouds.js') : null;
const islandKit = TEMPLE ? await import('./islands.js') : null;
let skipping = false;
import { SEASONS, seasonU, seasonOnDate, addSnow, createSeasonForest, createPetals, applySeason } from './seasons.js';

const { ground } = window.CHURCH;
const params = new URLSearchParams(location.search);
const canvas = document.getElementById('outsideView') || document.getElementById('view');
const phone = /Mobi|Android/i.test(navigator.userAgent);
const shadows = !params.has('noshadow');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, phone ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;
if (shadows) {
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, 1, 1, 14000);
const rand = (() => { let s = 77; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();

// ---------- Procedural materials ----------
function ashlar(size, rows, cols, base, spread, mortar, relief) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = mortar;
  g.fillRect(0, 0, size, size);
  const rh = size / rows;
  const cw = size / cols;
  const hc = new Float32Array(size * size);
  const put = (x0, y0, w, h, v) => {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) hc[((y + size) % size) * size + ((x + size) % size)] = v;
  };
  for (let r = 0; r < rows; r++) {
    for (let k = -1; k < cols; k++) {
      const x = Math.round((k + (r % 2) * 0.5) * cw) + 2;
      const y = Math.round(r * rh) + 2;
      const w = Math.round(cw) - 4;
      const h = Math.round(rh) - 4;
      const t = rand() * spread;
      const col = new THREE.Color(base).offsetHSL((rand() - 0.5) * 0.012, (rand() - 0.5) * 0.04, t - spread / 2);
      g.fillStyle = `#${col.getHexString()}`;
      g.fillRect(x, y, w, h);
      if (x + w > size) g.fillRect(x - size, y, w, h);
      if (x < 0) g.fillRect(x + size, y, w, h);
      put(x, y, w, h, 0.72 + rand() * 0.28);
    }
  }
  const img = g.getImageData(0, 0, size, size);
  // Fine pitting, plus broad age staining.
  const blobs = Array.from({ length: 34 }, () => [rand() * size, rand() * size, 40 + rand() * 130, (rand() - 0.55) * 26]);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    let shade = (Math.random() - 0.5) * 17;
    if (Math.random() < 0.012) shade -= 34;
    if (y % 4 === 0) for (const [bx, by, br, bv] of blobs.slice(0, 0)) shade += bv * br * bx * by;
    img.data[i] += shade; img.data[i + 1] += shade; img.data[i + 2] += shade;
    hc[y * size + x] += (Math.random() - 0.5) * 0.09;
  }
  g.putImageData(img, 0, 0);
  g.globalCompositeOperation = 'multiply';
  for (const [bx, by, br, bv] of blobs) {
    const grad = g.createRadialGradient(bx, by, 1, bx, by, br);
    const v = Math.round(242 + Math.max(-30, bv));
    grad.addColorStop(0, `rgb(${v},${v},${v - 4})`);
    grad.addColorStop(1, 'rgb(255,255,255)');
    g.fillStyle = grad;
    g.fillRect(bx - br, by - br, br * 2, br * 2);
  }
  // Normal map, worked out from the height of each stone.
  const nc = document.createElement('canvas');
  nc.width = nc.height = size;
  const ng = nc.getContext('2d');
  const out = ng.createImageData(size, size);
  const at = (x, y) => hc[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (at(x - 1, y) - at(x + 1, y)) * relief;
    const dy = (at(x, y - 1) - at(x, y + 1)) * relief;
    const l = Math.hypot(dx, dy, 1);
    const i = (y * size + x) * 4;
    out.data[i] = (dx / l * 0.5 + 0.5) * 255;
    out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255;
    out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255;
    out.data[i + 3] = 255;
  }
  ng.putImageData(out, 0, 0);
  const tex = (cv, srgb) => {
    const t = new THREE.CanvasTexture(cv);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { map: tex(c, true), normalMap: tex(nc, false) };
}
const TEX = phone ? 1024 : 2048;
const stoneTex = ashlar(TEX, 9, 5, 0xc9b99a, 0.075, '#8c8069', 2.4);
const trimTex = ashlar(TEX >> 1, 2, 1, 0xd5c7aa, 0.04, '#b7a98e', 0.7);
const slateTex = ashlar(TEX >> 1, 14, 9, 0x4a5159, 0.06, '#2a2e33', 2.2);
const pavingTex = ashlar(TEX >> 1, 5, 4, 0x9d9483, 0.09, '#5c564b', 1.8);
const M = {
  stone: new THREE.MeshStandardMaterial({ ...stoneTex, roughness: 0.92, metalness: 0, normalScale: new THREE.Vector2(0.9, 0.9) }),
  trim: new THREE.MeshStandardMaterial({ ...trimTex, roughness: 0.82, metalness: 0, normalScale: new THREE.Vector2(0.45, 0.45) }),
  slate: new THREE.MeshStandardMaterial({ ...slateTex, roughness: 0.72, metalness: 0.05, normalScale: new THREE.Vector2(1, 1) }),
  paving: new THREE.MeshStandardMaterial({ ...pavingTex, roughness: 0.95 }),
  wood: new THREE.MeshStandardMaterial({ color: 0x47291a, roughness: 0.68 }),
  iron: new THREE.MeshStandardMaterial({ color: 0x24211f, roughness: 0.5, metalness: 0.8 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xd8a944, roughness: 0.28, metalness: 1 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x24211d, roughness: 1 }),
  lamp: new THREE.MeshStandardMaterial({ color: 0xffe5b0, emissive: 0xffc06a, emissiveIntensity: 0.25, roughness: 0.4 }),
  water: new THREE.MeshStandardMaterial({ color: 0x28606f, roughness: 0.08, metalness: 0.3 }),
  lawn: new THREE.MeshStandardMaterial({ color: 0x4f6f3b, roughness: 1 }),
};
const repeat = { stone: 0.2, trim: 0.5, slate: 0.33, paving: 0.14 };
for (const [k, r] of Object.entries(repeat)) { M[k].map.repeat.set(r, r); M[k].normalMap.repeat.set(r, r); }

function stainedGlass(size, kind) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size * (kind === 'rose' ? 1 : 3);
  const g = c.getContext('2d');
  const colors = ['#1547b8', '#a81d2e', '#d99d26', '#17795b', '#5b2ca0', '#2277c8', '#c04b1f'];
  const pick = () => colors[Math.floor(rand() * colors.length)];
  g.fillStyle = '#121014';
  g.fillRect(0, 0, c.width, c.height);
  if (kind === 'rose') {
    const m = size / 2;
    for (let r = 7; r >= 1; r--) for (let i = 0; i < 24; i++) {
      g.fillStyle = pick();
      g.beginPath();
      g.moveTo(m, m);
      g.arc(m, m, (r / 7) * m * 0.98, (i / 24) * 6.283 + 0.008, ((i + 1) / 24) * 6.283 - 0.008);
      g.fill();
      g.strokeStyle = '#100e12'; g.lineWidth = size / 240; g.stroke();
    }
  } else {
    const n = size / 8;
    for (let y = 0; y < c.height; y += n) for (let x = 0; x < c.width; x += n) {
      g.fillStyle = pick();
      g.fillRect(x + 1.5, y + 1.5, n - 3, n - 3);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
const roseTex = stainedGlass(1024, 'rose');
const lancetTex = stainedGlass(256, 'lancet');
M.glassRose = new THREE.MeshStandardMaterial({ map: roseTex, emissiveMap: roseTex, emissive: 0xffffff, emissiveIntensity: 0.32, roughness: 0.2, metalness: 0.15 });
M.glass = new THREE.MeshStandardMaterial({ map: lancetTex, emissiveMap: lancetTex, emissive: 0xffffff, emissiveIntensity: 0.28, roughness: 0.2, metalness: 0.15 });

if (TEMPLE) {
  M.marble = new THREE.MeshStandardMaterial({ color: 0xe9e4d6, roughness: 0.74 });
  M.marbleShade = new THREE.MeshStandardMaterial({ color: 0xc9c2b0, roughness: 0.85 });
  // The carved central way of the stairs: clouds and lotus flowers in low relief.
  const c = document.createElement('canvas'); c.width = 256; c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#d8d2c2'; g.fillRect(0, 0, 256, 1024);
  const relief = (fn, width) => { g.lineCap = 'round'; for (const [col, dx] of [['#f4f0e6', -2], ['#9e9786', 2], ['#c2bbaa', 0]]) { g.save(); g.translate(dx, dx); g.strokeStyle = col; g.lineWidth = width; fn(); g.restore(); } };
  for (let y = 40; y < 1024; y += 150) {
    const flip = Math.floor(y / 150) % 2 ? -1 : 1;
    relief(() => {
      for (const [ox, oy, r] of [[128 - flip * 56, y, 26], [128 + flip * 40, y + 34, 34], [128 - flip * 22, y + 76, 20]]) {
        g.beginPath();
        for (let a = 0; a < 9.5; a += 0.2) { const q = r * (a / 9.5); const px = ox + Math.cos(a * flip) * q; const py = oy + Math.sin(a * flip) * q; if (a) g.lineTo(px, py); else g.moveTo(px, py); }
        g.stroke();
      }
      g.beginPath(); g.moveTo(20, y + 60); g.bezierCurveTo(70, y + 20, 180, y + 110, 236, y + 58); g.stroke();
    }, 5);
    relief(() => {
      for (let k = -2; k <= 2; k++) { g.beginPath(); g.ellipse(128 + k * 22, y + 118 - Math.abs(k) * 3, 10, 22 - Math.abs(k) * 3, k * 0.32, 0, 6.283); g.stroke(); }
    }, 3);
  }
  g.strokeStyle = '#9e9786'; g.lineWidth = 7; g.strokeRect(6, -10, 244, 1044);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  M.carved = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 });
}
// ---------- Geometry collector ----------
const parts = new Map();
const worldUV = new Set(['stone', 'trim', 'slate', 'paving']);
function add(geometry, material, matrix) {
  if (skipping) return;
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  if (matrix) g.applyMatrix4(matrix);
  if (!parts.has(material)) parts.set(material, []);
  parts.get(material).push(g);
}
const TRS = (x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
function build() {
  for (const [material, list] of parts) {
    let count = 0;
    for (const g of list) count += g.attributes.position.count;
    const pos = new Float32Array(count * 3);
    const nor = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    let o = 0;
    const flat = worldUV.has(material);
    for (const g of list) {
      const p = g.attributes.position; const n = g.attributes.normal; const u = g.attributes.uv;
      for (let i = 0; i < p.count; i++, o++) {
        const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
        const nx = n.getX(i); const ny = n.getY(i); const nz = n.getZ(i);
        pos.set([x, y, z], o * 3); nor.set([nx, ny, nz], o * 3);
        if (flat) {
          // World-sized texture, so every stone course lines up and stays the same size.
          const a = Math.abs(nx); const b = Math.abs(ny); const c = Math.abs(nz);
          if (b > a && b > c) uv.set([x, z], o * 2);
          else if (a > c) uv.set([z, y], o * 2);
          else uv.set([x, y], o * 2);
        } else if (u) uv.set([u.getX(i), u.getY(i)], o * 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const mesh = new THREE.Mesh(geo, M[material]);
    mesh.castShadow = !['glass', 'glassRose'].includes(material);
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    scene.add(mesh);
  }
}
const box = (w, h, d, x, y, z, m = 'stone', ry = 0) => add(new THREE.BoxGeometry(w, h, d), m, TRS(x, y + h / 2, z, ry));
const S3 = Math.sqrt(3) / 2;
// A true pointed Gothic arch: two arcs meeting at a point.
function archPath(p, cx, y0, w, spring) {
  const hw = w / 2;
  p.moveTo(cx - hw, y0);
  p.lineTo(cx - hw, y0 + spring);
  p.absarc(cx + hw, y0 + spring, w, Math.PI, (2 * Math.PI) / 3, true);
  p.absarc(cx - hw, y0 + spring, w, Math.PI / 3, 0, true);
  p.lineTo(cx + hw, y0);
  p.closePath();
  return p;
}
const extrude = (shape, depth, segs = 10) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: segs });
function wall(outline, holes, depth, m, zFront, rotY = 0, x = 0) {
  const shape = new THREE.Shape(outline.map(([a, b]) => new THREE.Vector2(a, b)));
  for (const h of holes) {
    const path = new THREE.Path();
    if (h.circle) path.absarc(h.x, h.y, h.circle, 0, Math.PI * 2, true);
    else archPath(path, h.x, h.y, h.w, h.spring);
    shape.holes.push(path);
  }
  add(extrude(shape, depth, 12), m, TRS(x, 0, zFront - depth, rotY));
}
function archRing(cx, y0, wOut, wIn, spring, depth, zFront, m = 'trim') {
  const shape = archPath(new THREE.Shape(), cx, y0, wOut, spring);
  shape.holes.push(archPath(new THREE.Path(), cx, y0, wIn, spring));
  add(extrude(shape, depth, 14), m, TRS(0, 0, zFront - depth));
}
function archSolid(cx, y0, w, spring, depth, zFront, m) {
  add(extrude(archPath(new THREE.Shape(), cx, y0, w, spring), depth, 14), m, TRS(0, 0, zFront - depth));
}
// Pinnacle: shaft, gablets, tapered spirelet with crockets, and a finial.
const crocket = new THREE.ConeGeometry(0.07, 0.3, 5);
const crocketM = [];
function pinnacle(x, y, z, size, tall) {
  box(size, tall * 0.42, size, x, y, z, 'trim');
  box(size * 1.15, 0.12, size * 1.15, x, y + tall * 0.42, z, 'trim');
  const coneH = tall * 0.56;
  add(new THREE.ConeGeometry(size * 0.62, coneH, 4), 'trim', TRS(x, y + tall * 0.43 + coneH / 2, z, Math.PI / 4));
  for (let k = 1; k < 5; k++) {
    const t = k / 5;
    const r = size * 0.62 * (1 - t);
    for (let a = 0; a < 4; a++) crocketM.push(TRS(x + Math.cos(a * 1.5708) * r, y + tall * 0.43 + t * coneH, z + Math.sin(a * 1.5708) * r, 0, 0, 0, size * 1.2, size * 1.2, size * 1.2));
  }
  add(new THREE.SphereGeometry(size * 0.13, 8, 6), 'trim', TRS(x, y + tall, z));
}
function moulding(x0, x1, y, z, projection = 0.3, height = 0.45) {
  box(x1 - x0 + projection * 2, height * 0.45, projection * 2 + 0.2, (x0 + x1) / 2, y, z, 'trim');
  box(x1 - x0 + projection, height * 0.55, projection + 0.15, (x0 + x1) / 2, y - height * 0.55, z, 'trim');
}
function lancet(cx, y0, w, spring, zFront, zGlass, glass = 'glass', bars = 3) {
  archRing(cx, y0, w + 0.72, w, spring, 0.38, zFront + 0.18);
  archRing(cx, y0, w + 0.05, w - 0.32, spring, 0.45, zFront - 0.15);
  archSolid(cx, y0, w, spring, 0.06, zGlass, glass);
  for (let i = 1; i < bars; i++) box(0.07, spring + w * S3, 0.1, cx - w / 2 + (w * i) / bars, y0, zGlass + 0.05, 'iron');
  for (let y = y0 + 1.3; y < y0 + spring; y += 1.3) box(w, 0.05, 0.09, cx, y, zGlass + 0.05, 'iron');
}

skipping = TEMPLE;
// ---------- Central front ----------
const H_GABLE = 50;
const holes = [
  { x: 0, y: 0.1, w: 11, spring: 9.5 },
  { x: -15, y: 0.1, w: 6.5, spring: 6.5 },
  { x: 15, y: 0.1, w: 6.5, spring: 6.5 },
  { circle: 8.7, x: 0, y: 39 },
  { x: -15.5, y: 29, w: 4.2, spring: 9 },
  { x: 15.5, y: 29, w: 4.2, spring: 9 },
];
wall([[-22, 0], [22, 0], [22, H_GABLE], [0, H_GABLE + 19], [-22, H_GABLE]], holes, 2.4, 'stone', 0);
add(new THREE.BoxGeometry(44, 0.3, 3), 'dark', TRS(0, 0, -2.6));
for (const [cx, w, spring, deep] of [[0, 11, 9.5, 1], [-15, 6.5, 6.5, 0.72], [15, 6.5, 6.5, 0.72]]) {
  const steps = 5;
  for (let i = 0; i < steps; i++) {
    const wo = w + (steps - i) * 0.72 * deep + 0.18;
    const wi = w + (steps - i - 1) * 0.72 * deep;
    archRing(cx, 0.1, wo, wi, spring, 2.7, 0.6 - i * 0.1);
    // Slim jamb column on each side.
    for (const side of [-1, 1]) {
      const x = cx + side * (wi / 2 + 0.36 * deep);
      add(new THREE.CylinderGeometry(0.15, 0.16, spring, 12), 'trim', TRS(x, spring / 2 + 0.1, 0.45 - i * 0.1));
      add(new THREE.CylinderGeometry(0.27, 0.17, 0.42, 12), 'trim', TRS(x, spring + 0.2, 0.45 - i * 0.1));
      add(new THREE.CylinderGeometry(0.28, 0.32, 0.5, 12), 'trim', TRS(x, 0.3, 0.45 - i * 0.1));
    }
  }
  // Tympanum and doors, set back in the wall.
  archSolid(cx, spring - 2.2, w, 2.2, 0.2, -1.7, 'trim');
  box(w, 0.4, 0.5, cx, spring - 2.4, -1.6, 'trim');
  box(w, spring - 2.2, 0.2, cx, 0.1, -1.95, 'wood');
  for (const dx of [-w / 4, w / 4]) {
    for (let y = 1.2; y < spring - 2.6; y += 1.5) box(w / 2 - 0.25, 0.09, 0.08, cx + dx, y, -1.82, 'iron');
    for (let k = -2; k <= 2; k++) box(0.05, spring - 2.5, 0.05, cx + dx + (k * w) / 13, 0.2, -1.82, 'wood');
  }
  box(0.1, spring - 2.3, 0.28, cx, 0.1, -1.8, 'iron');
  // Carved panel over each door: three small arches and a ring.
  for (const dx of [-w * 0.28, 0, w * 0.28]) archRing(cx + dx, spring - 2.1, w * 0.2, w * 0.14, 0.45, 0.14, -1.45);
  add(new THREE.TorusGeometry(w * 0.11, 0.09, 8, 28), 'trim', TRS(cx, spring + w * 0.28, -1.5));
  // Pointed gable over the door, with side pinnacles.
  const gableW = w + 5 * 0.72 * deep + 1.5;
  const gy = spring + (w + 5 * 0.72 * deep) * S3 * 0.46;
  const gs = new THREE.Shape([new THREE.Vector2(cx - gableW / 2, gy), new THREE.Vector2(cx, gy + gableW * 0.72), new THREE.Vector2(cx + gableW / 2, gy)]);
  gs.holes.push(new THREE.Path([new THREE.Vector2(cx - gableW * 0.3, gy + 0.3), new THREE.Vector2(cx, gy + gableW * 0.53), new THREE.Vector2(cx + gableW * 0.3, gy + 0.3)]));
  add(extrude(gs, 0.5), 'trim', TRS(0, 0, 0.5));
  for (const side of [-1, 1]) pinnacle(cx + side * (gableW / 2), gy - 2.6, 0.75, 0.5, 5.2);
  pinnacle(cx, gy + gableW * 0.7, 0.75, 0.32, 2.2);
}
// Gallery of small arches across the front.
moulding(-22, 22, 21.4, 0.25, 0.42, 0.6);
const galleryN = 17;
for (let i = 0; i < galleryN; i++) {
  const cx = -20 + (40 * i) / (galleryN - 1);
  archRing(cx, 21.5, 2.1, 1.55, 2.6, 0.5, 0.6);
  archSolid(cx, 21.5, 1.55, 2.6, 0.05, 0.25, 'dark');
  add(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8), 'trim', TRS(cx, 22.8, 0.48));
}
moulding(-22, 22, 26.6, 0.25, 0.3, 0.5);
// Rose window: stone rings, spokes and coloured glass.
const roseCentre = [0, 39];
add(new THREE.TorusGeometry(9.25, 0.6, 12, 80), 'trim', TRS(0, roseCentre[1], 0.15));
add(new THREE.TorusGeometry(8.6, 0.24, 8, 80), 'trim', TRS(0, roseCentre[1], -0.3));
add(new THREE.TorusGeometry(5.3, 0.2, 8, 64), 'trim', TRS(0, roseCentre[1], -0.3));
add(new THREE.TorusGeometry(1.8, 0.22, 8, 40), 'trim', TRS(0, roseCentre[1], -0.3));
for (let i = 0; i < 16; i++) {
  const a = (i / 16) * Math.PI * 2;
  const mid = (8.6 + 1.8) / 2;
  add(new THREE.CylinderGeometry(0.13, 0.13, 8.6 - 1.8, 8), 'trim', TRS(Math.cos(a) * mid, roseCentre[1] + Math.sin(a) * mid, -0.3, 0, 0, a - Math.PI / 2));
  const b = a + Math.PI / 16;
  add(new THREE.TorusGeometry(1.35, 0.11, 6, 22), 'trim', TRS(Math.cos(b) * 6.85, roseCentre[1] + Math.sin(b) * 6.85, -0.3));
  add(new THREE.TorusGeometry(0.72, 0.08, 6, 18), 'trim', TRS(Math.cos(b) * 3.55, roseCentre[1] + Math.sin(b) * 3.55, -0.3));
}
add(new THREE.CircleGeometry(8.75, 64), 'glassRose', TRS(0, roseCentre[1], -0.7));
for (const x of [-15.5, 15.5]) lancet(x, 29, 4.2, 9, 0, -1);
// Sloped top with crockets and a cross.
for (const side of [-1, 1]) {
  const len = Math.hypot(22, 19);
  const ang = Math.atan2(19, 22) * -side;
  add(new THREE.BoxGeometry(len + 1, 0.9, 1.4), 'trim', TRS(side * 11, H_GABLE + 9.5 + 0.35, -0.3, 0, 0, ang));
  for (let t = 0.08; t < 1; t += 0.11) {
    crocketM.push(TRS(side * (22 - 22 * t), H_GABLE + 19 * t + 1.05, -0.3, 0, 0, 0, 2.4, 2.4, 2.4));
  }
  pinnacle(side * 22, H_GABLE - 2.5, -0.1, 1, 10);
  pinnacle(side * 11, H_GABLE + 9.3, -0.3, 0.6, 7);
}
box(0.45, 5, 0.45, 0, H_GABLE + 19, -0.3, 'gold');
box(2.6, 0.42, 0.42, 0, H_GABLE + 22.3, -0.3, 'gold');

// ---------- Towers and spires ----------
function tower(side) {
  const cx = side * 29;
  const x0 = cx - 7; const x1 = cx + 7;
  const top = 86;
  const frontHoles = [
    { x: cx, y: 12, w: 4.5, spring: 9 },
    { x: cx, y: 33, w: 4.5, spring: 9 },
    { x: cx - 3, y: 58, w: 3.2, spring: 13 },
    { x: cx + 3, y: 58, w: 3.2, spring: 13 },
  ];
  wall([[x0, 0], [x1, 0], [x1, top], [x0, top]], frontHoles, 1.4, 'stone', 0);
  wall([[x0, 0], [x1, 0], [x1, top], [x0, top]], frontHoles, 1.4, 'stone', -12.6);
  // Side faces are the same wall, turned.
  const sideHoles = [{ x: 0, y: 12, w: 4.5, spring: 9 }, { x: 0, y: 33, w: 4.5, spring: 9 }, { x: -3, y: 58, w: 3.2, spring: 13 }, { x: 3, y: 58, w: 3.2, spring: 13 }];
  const sideShape = new THREE.Shape([new THREE.Vector2(-7, 0), new THREE.Vector2(7, 0), new THREE.Vector2(7, top), new THREE.Vector2(-7, top)]);
  for (const h of sideHoles) sideShape.holes.push(archPath(new THREE.Path(), h.x, h.y, h.w, h.spring));
  for (const sx of [x0 + 0.7, x1 - 0.7]) add(extrude(sideShape, 1.4, 12), 'stone', TRS(sx, 0, -7, Math.PI / 2, 0, 0, 1, 1, 1).multiply(new THREE.Matrix4().makeTranslation(0, 0, -0.7)));
  box(11, 84, 11, cx, 0.5, -7, 'dark');
  const openings = [[cx, 12, 4.5, 9, 3], [cx, 33, 4.5, 9, 3]];
  for (const [ox, y, w, spring, bars] of openings) lancet(ox, y, w, spring, 0, -0.9, 'glass', bars);
  for (const dx of [-3, 3]) {
    archRing(cx + dx, 58, 3.9, 3.2, 13, 0.4, 0.2);
    archRing(cx + dx, 58, 3.25, 2.85, 13, 0.5, -0.1);
    for (let y = 60; y < 70; y += 2.2) box(3, 0.1, 0.5, cx + dx, y, -0.5, 'trim');
  }
  for (const y of [11.2, 31, 55.5, 74.5, top]) {
    moulding(x0, x1, y, 0.18, 0.4, 0.55);
    box(0.6, 0.5, 14, x0 - 0.1, y - 0.3, -7, 'trim');
    box(0.6, 0.5, 14, x1 + 0.1, y - 0.3, -7, 'trim');
    moulding(x0, x1, y, -14.1, 0.4, 0.55);
  }
  // Blind arches below the top of the tower.
  for (let k = 0; k < 7; k++) archRing(x0 + 1 + k * 2, 76, 1.8, 1.25, 4.6, 0.3, 0.3);
  // Stepped corner buttresses.
  for (const [bx, bz, dirZ] of [[x0 + 0.1, 0, true], [x1 - 0.1, 0, true], [x0 + 0.1, -14, false], [x1 - 0.1, -14, false]]) {
    const sign = dirZ ? 1 : -1;
    const steps = [[0, 26, 3.2, 2], [26, 50, 2.4, 1.7], [50, 72, 1.6, 1.4]];
    for (const [y0, y1, p, w] of steps) {
      box(w, y1 - y0, p, bx, y0, bz + (sign * p) / 2, 'stone');
      const cap = new THREE.BufferGeometry();
      const hx = w / 2;
      const f = p * sign; const zEnd = bz + f;
      const v = [
        bx - hx, y1, zEnd, bx + hx, y1, zEnd, bx + hx, y1 + 1.8, bz, bx - hx, y1, zEnd, bx + hx, y1 + 1.8, bz, bx - hx, y1 + 1.8, bz,
        bx - hx, y1, zEnd, bx - hx, y1 + 1.8, bz, bx - hx, y1, bz, bx + hx, y1, zEnd, bx + hx, y1, bz, bx + hx, y1 + 1.8, bz,
      ];
      cap.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
      cap.computeVertexNormals();
      add(cap, 'trim');
    }
  }
  // Open parapet around the lookout.
  box(14.8, 0.45, 14.8, cx, top, -7, 'trim');
  for (const dir of [0, 1, 2, 3]) {
    for (let k = 0; k < 11; k++) {
      const a = -6 + (12 * k) / 10;
      const [px, pz] = dir === 0 ? [cx + a, 0.1] : dir === 1 ? [cx + a, -14.1] : dir === 2 ? [x0 - 0.1, -7 + a] : [x1 + 0.1, -7 + a];
      box(0.3, 1.45, 0.3, px, top + 0.4, pz, 'trim');
    }
    if (dir < 2) box(14.2, 0.32, 0.5, cx, top + 1.8, dir === 0 ? 0.1 : -14.1, 'trim');
    else box(0.5, 0.32, 14.2, dir === 2 ? x0 - 0.1 : x1 + 0.1, top + 1.8, -7, 'trim');
  }
  for (const [px, pz] of [[x0, 0], [x1, 0], [x0, -14], [x1, -14]]) pinnacle(px, top - 1, pz, 1.1, 15);
  // The pointed spire, with ribs, little gabled windows and crockets.
  const baseY = top + 0.4;
  const spireH = 58;
  const r0 = 5.7;
  const spire = new THREE.CylinderGeometry(0.15, r0, spireH, 8, 18, true);
  add(spire, 'slate', TRS(cx, baseY + spireH / 2, -7, Math.PI / 8));
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    const lean = Math.atan2(r0, spireH);
    const rib = new THREE.BoxGeometry(0.22, spireH, 0.22);
    rib.translate(0, spireH / 2, 0);
    const ax = Math.cos(ang); const az = Math.sin(ang);
    const m = new THREE.Matrix4().makeBasis(
      new THREE.Vector3(az, 0, -ax),
      new THREE.Vector3(-ax * Math.sin(lean), Math.cos(lean), -az * Math.sin(lean)),
      new THREE.Vector3(ax * Math.cos(lean), Math.sin(lean), az * Math.cos(lean))
    );
    m.setPosition(cx + ax * r0, baseY, -7 + az * r0);
    add(rib, 'trim', m);
    for (let t = 0.1; t < 0.96; t += 0.075) {
      const r = r0 * (1 - t);
      crocketM.push(TRS(cx + ax * (r + 0.22), baseY + spireH * t, -7 + az * (r + 0.22), 0, 0, 0, 3 - t * 1.6, 3 - t * 1.6, 3 - t * 1.6));
    }
  }
  for (const y of [14, 30, 43]) {
    const r = r0 * (1 - y / spireH);
    add(new THREE.TorusGeometry(r + 0.05, 0.14, 6, 8), 'trim', TRS(cx, baseY + y, -7, Math.PI / 8, Math.PI / 2));
  }
  // Small gabled windows on four sides of the spire.
  for (let d = 0; d < 4; d++) {
    const ang = (d * Math.PI) / 2;
    const r = r0 - 1.1;
    const lx = cx + Math.sin(ang) * r;
    const lz = -7 + Math.cos(ang) * r;
    add(new THREE.BoxGeometry(2.4, 4, 1.8), 'trim', TRS(lx, baseY + 3.4, lz, ang));
    const roof = new THREE.ConeGeometry(1.85, 3, 4);
    add(roof, 'slate', TRS(lx, baseY + 6.8, lz, ang + Math.PI / 4));
    add(new THREE.BoxGeometry(1.1, 2.6, 0.06), 'dark', TRS(lx + Math.sin(ang) * 0.92, baseY + 3.4, lz + Math.cos(ang) * 0.92, ang));
  }
  const tip = baseY + spireH;
  add(new THREE.SphereGeometry(0.38, 14, 10), 'gold', TRS(cx, tip + 0.2, -7));
  box(0.26, 5, 0.26, cx, tip + 0.3, -7, 'gold');
  box(2.4, 0.26, 0.26, cx, tip + 3.3, -7, 'gold');
}
tower(-1);
tower(1);

// ---------- Nave, aisles and dome behind ----------
const NAVE = 88;
box(22, 44, NAVE, 0, 0, -2.4 - NAVE / 2, 'stone');
box(40, 20, NAVE, 0, 0, -2.4 - NAVE / 2, 'stone');
{
  const prism = new THREE.BufferGeometry();
  const w = 12; const r = 18; const b = 44; const f = -2.4; const k = f - NAVE;
  const v = [-w, b, f, w, b, f, 0, b + r, f, w, b, k, -w, b, k, 0, b + r, k, -w, b, f, 0, b + r, f, 0, b + r, k, -w, b, f, 0, b + r, k, -w, b, k, w, b, f, w, b, k, 0, b + r, k, w, b, f, 0, b + r, k, 0, b + r, f];
  prism.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  prism.computeVertexNormals();
  add(prism, 'slate');
}
for (let i = 0; i < 8; i++) {
  const z = -14 - i * 11;
  for (const side of [-1, 1]) {
    // Flying buttress from the aisle wall up to the nave.
    box(2.2, 34, 2, side * 21, 0, z, 'stone');
    pinnacle(side * 21, 34, z, 1, 11);
    const arm = new THREE.BoxGeometry(11, 0.9, 1.2);
    add(arm, 'trim', TRS(side * 15.8, 36, z, 0, 0, side * 0.42));
    box(0.9, 21, 8.2, side * 11.05, 22, z - 5.5, 'dark');
  }
  for (const side of [-1, 1]) {
    const cx = side * 11.15;
    for (const y of [24]) {
      const g = new THREE.Shape();
      archPath(g, 0, 0, 5, 11);
      const geo = extrude(g, 0.1, 12);
      add(geo, 'glass', TRS(cx + side * 0.25, y, z - 5.5, side > 0 ? Math.PI / 2 : -Math.PI / 2));
    }
  }
}
const domeY = 60;
const domeZ = -2.4 - NAVE - 12;
add(new THREE.CylinderGeometry(14, 14, 12, 28), 'stone', TRS(0, domeY + 4, domeZ));
add(new THREE.SphereGeometry(13.2, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), 'slate', TRS(0, domeY + 10, domeZ, 0, 0, 0, 1, 1.25, 1));
add(new THREE.CylinderGeometry(2.3, 2.8, 8, 12), 'trim', TRS(0, domeY + 29, domeZ));
add(new THREE.ConeGeometry(2.8, 12, 12), 'slate', TRS(0, domeY + 39, domeZ));
box(44, 40, 22, 0, 0, domeZ, 'stone');
box(94, 40, 22, 0, 0, domeZ, 'stone');
box(22, 40, 46, 0, 0, domeZ - 30, 'stone');
// Pitched roofs and tall windows on the transepts and choir.
function pitched(x0, x1, z0, z1, y, rise, alongX) {
  const r = new THREE.BufferGeometry();
  const mx = (x0 + x1) / 2; const mz = (z0 + z1) / 2;
  const a = alongX ? [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [x0, y + rise, mz], [x1, y + rise, mz]] : [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], [mx, y + rise, z0], [mx, y + rise, z1]];
  const tri = alongX ? [0, 4, 5, 0, 5, 1, 2, 5, 4, 2, 4, 3, 0, 3, 4, 1, 5, 2] : [0, 1, 4, 1, 5, 4, 1, 2, 5, 3, 0, 4, 3, 4, 5, 2, 3, 5];
  r.setAttribute('position', new THREE.Float32BufferAttribute(tri.flatMap((i) => a[i]), 3));
  r.computeVertexNormals();
  add(r, 'slate');
}
pitched(-47, 47, domeZ - 11, domeZ + 11, 40, 14, true);
pitched(-11, 11, domeZ - 53, domeZ - 7, 40, 13, false);
for (const side of [-1, 1]) {
  const g = extrude(archPath(new THREE.Shape(), 0, 0, 8, 16), 0.12, 14);
  add(g, 'glass', TRS(side * 47.08, 14, domeZ, side > 0 ? Math.PI / 2 : -Math.PI / 2));
  for (let i = 0; i < 2; i++) box(2, 32, 2.4, side * 11.3, 0, domeZ - 20 - i * 15, 'stone');
}

// ---------- Forecourt ----------
const bulbs = [];
const lamps = [];
add(new THREE.PlaneGeometry(112, 58).rotateX(-Math.PI / 2), 'paving', TRS(0, -0.02, 29));
for (let i = 0; i < 6; i++) box(58 - i * 3, 0.18 * (6 - i), 7 - i * 1.1, 0, 0, 3.8 - i * 0.55, 'trim');
for (const x of [-46, -32, -18, 18, 32, 46]) for (const z of [14, 34, 52]) lampPost(x, 0, z);
box(4.2, 3.6, 4.2, 0, 0, 34, 'trim');
box(5, 0.5, 5, 0, 0, 34, 'trim');
skipping = false;
// ---------- The whole site: gate, road, bridge, stairs, terraces, walls and gardens ----------
function bulbLine(a, b, spacing = 1.1) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const n = Math.max(1, Math.round(d / spacing));
  if (skipping) return;
  for (let i = 0; i <= n; i++) { const t = i / n; bulbs.push(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t); }
}
// A beam of stone between two points [x, z, y].
function beam(a, b, w, h, material, lift = 0) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  add(new THREE.BoxGeometry(w, h, len), material, new THREE.Matrix4().lookAt(new THREE.Vector3(b[0], b[2], b[1]), new THREE.Vector3(a[0], a[2], a[1]), new THREE.Vector3(0, 1, 0)).setPosition((a[0] + b[0]) / 2, (a[2] + b[2]) / 2 + lift, (a[1] + b[1]) / 2));
}
const lotusBud = new THREE.LatheGeometry([[0.2, 0], [0.24, 0.06], [0.17, 0.2], [0.21, 0.28], [0.15, 0.46], [0.05, 0.6], [0.001, 0.68]].map(([r, h]) => new THREE.Vector2(r, h)), 8);
// A white balustrade: square posts with lotus-bud tops, and carved panels between them.
function marbleRail(a, b, spacing = 2.3) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(1, Math.round(d / spacing));
  const ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const at = (t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  for (let i = 0; i <= n; i++) {
    const [x, z, y] = at(i / n);
    box(0.34, 1.06, 0.34, x, y, z, 'marble', ry);
    box(0.44, 0.08, 0.44, x, y + 1.06, z, 'marbleShade', ry);
    add(lotusBud, 'marble', TRS(x, y + 1.14, z, ry));
    if (i % 2 === 0 && !skipping) bulbs.push(x, y + 1.9, z);
    if (i === n) break;
    const p = at(i / n); const q = at((i + 1) / n);
    beam(p, q, 0.13, 0.62, 'marble', 0.42);
    beam(p, q, 0.17, 0.09, 'marble', 0.92);
    beam(p, q, 0.2, 0.12, 'marble', 0.06);
    if (!phone) beam(p, q, 0.16, 0.34, 'marbleShade', 0.44);
  }
}
function stoneLantern(x, y, z) {
  box(0.95, 0.22, 0.95, x, y, z, 'marbleShade');
  add(new THREE.CylinderGeometry(0.16, 0.24, 1.15, 8), 'marble', TRS(x, y + 0.8, z));
  box(0.7, 0.1, 0.7, x, y + 1.38, z, 'marbleShade');
  box(0.46, 0.46, 0.46, x, y + 1.48, z, 'lamp');
  add(new THREE.ConeGeometry(0.72, 0.42, 4), 'stone', TRS(x, y + 2.15, z, Math.PI / 4));
  add(new THREE.SphereGeometry(0.11, 8, 6), 'gold', TRS(x, y + 2.42, z));
  if (!skipping) lamps.push([x, y - 2.6, z]);
}
function lampPost(x, y, z, tall = 4.4) {
  if (TEMPLE) { stoneLantern(x, y, z); return; }
  add(new THREE.CylinderGeometry(0.07, 0.13, tall, 10), 'iron', TRS(x, y + tall / 2, z));
  add(new THREE.CylinderGeometry(0.2, 0.3, 0.2, 8), 'iron', TRS(x, y + 0.1, z));
  add(new THREE.CylinderGeometry(0.24, 0.14, 0.62, 6), 'lamp', TRS(x, y + tall + 0.3, z));
  add(new THREE.ConeGeometry(0.32, 0.3, 6), 'iron', TRS(x, y + tall + 0.76, z));
  if (!skipping) lamps.push([x, y, z]);
}
function plinth(x0, x1, z0, z1, y, down = 45, m = 'stone') { box(x1 - x0, down, z1 - z0, (x0 + x1) / 2, y - down, (z0 + z1) / 2, m); }
function balustrade(a, b, y, posts = 2.2) {
  if (TEMPLE) { marbleRail([a[0], a[1], y], [b[0], b[1], y]); return; }
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const n = Math.max(2, Math.round(d / posts));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    box(0.3, 1, 0.3, a[0] + (b[0] - a[0]) * t, y, a[1] + (b[1] - a[1]) * t, 'trim', ry);
  }
  box(0.42, 0.16, d, (a[0] + b[0]) / 2, y + 1, (a[1] + b[1]) / 2, 'trim', ry);
  bulbLine([a[0], y + 1.25, a[1]], [b[0], y + 1.25, b[1]], 1.6);
}
// Real steps between two points [x, z, y].
const stepParts = [];
function flight(a, b, width, startEdge, endEdge) {
  const rise = b[2] - a[2];
  const n = Math.round(Math.abs(rise) / 0.42);
  const run = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
  const dx = (b[0] - a[0]) / run; const dz = (b[1] - a[1]) / run;
  const px = dz; const pz = -dx; // Across the stairs.
  const depth = 4;
  for (let i = 0; i < n; i++) {
    // Each step's top sits exactly on its share of the climb, so the last one meets the platform.
    const t = (i + 0.5) / n;
    const top = a[2] + (rise * (i + 1)) / n;
    stepParts.push(TRS(a[0] + (b[0] - a[0]) * t, top - depth / 2, a[1] + (b[1] - a[1]) * t, ry, 0, 0, width, depth, (run / n) * 1.08));
  }
  // A landing at each end, level with the platform, runs under the angled join and closes the gap.
  const landing = (end, dir, edge) => {
    const normal = edge[0] === 'x' ? Math.abs(dx) : Math.abs(dz);
    const along = edge[0] === 'x' ? Math.abs(dz) : Math.abs(dx);
    const reach = (width / 2) * (along / normal) + 0.7;
    const cx = end[0] + dir * dx * (reach / 2 - 0.25); const cz = end[1] + dir * dz * (reach / 2 - 0.25);
    add(new THREE.BoxGeometry(width + 0.9, 3.6, reach + 0.5), 'paving', TRS(cx, end[2] - 1.74, cz, ry));
    // Where the landing stands clear of the platform, a rail finishes its open side.
    for (const side of [-1, 1]) {
      const sx = end[0] + px * side * (width / 2 + 0.2); const sz = end[1] + pz * side * (width / 2 + 0.2);
      const value = edge[0] === 'x' ? sx : sz; const step = edge[0] === 'x' ? dir * dx : dir * dz;
      const u = (edge[1] - value) / step;
      if (u > 0.2) balustrade([sx, sz], [sx + dir * dx * u, sz + dir * dz * u], end[2]);
    }
  };
  landing(a, -1, startEdge);
  landing(b, 1, endEdge);
  for (const side of [-1, 1]) {
    const ox = px * side * (width / 2 + 0.2);
    const oz = pz * side * (width / 2 + 0.2);
    const len = Math.hypot(run, rise);
    add(new THREE.BoxGeometry(0.7, 3.4, len + 0.5), 'stone', new THREE.Matrix4().lookAt(new THREE.Vector3(b[0], b[2], b[1]), new THREE.Vector3(a[0], a[2], a[1]), new THREE.Vector3(0, 1, 0)).setPosition((a[0] + b[0]) / 2 + ox, (a[2] + b[2]) / 2 - 0.5, (a[1] + b[1]) / 2 + oz));
    bulbLine([a[0] + ox, a[2] + 1.45, a[1] + oz], [b[0] + ox, b[2] + 1.45, b[1] + oz], 1.8);
    lampPost(a[0] + ox, a[2] + 1.1, a[1] + oz, 3.4);
    lampPost(b[0] + ox, b[2] + 1.1, b[1] + oz, 3.4);
  }
}
const COLS = []; // Columns that carry an angel: x, y, z, facing.
function statueColumn(x, y, z, ry, tall = 7) {
  if (TEMPLE) { stoneLantern(x, y, z); return; }
  box(1.8, 0.8, 1.8, x, y, z, 'trim');
  add(new THREE.CylinderGeometry(0.58, 0.68, tall - 1.5, 16), 'stone', TRS(x, y + 0.8 + (tall - 1.5) / 2, z));
  add(new THREE.CylinderGeometry(0.95, 0.6, 0.55, 16), 'trim', TRS(x, y + tall - 0.45, z));
  box(1.9, 0.25, 1.9, x, y + tall - 0.2, z, 'trim');
  COLS.push([x, y + tall + 0.05, z, ry]);
  bulbLine([x - 0.9, y + tall + 0.1, z], [x + 0.9, y + tall + 0.1, z], 0.45);
}
skipping = TEMPLE;
// Perimeter wall: blind arches, columns at equal spacing, and angels on each column.
function perimeter(a, b, ry, skip = null, spacing = phone ? 28 : 14) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const n = Math.round(len / spacing);
  const ax = (b[0] - a[0]) / n; const az = (b[1] - a[1]) / n;
  for (let i = 0; i <= n; i++) {
    const x = a[0] + ax * i; const z = a[1] + az * i;
    if (skip && skip(x, z)) continue;
    statueColumn(x, -0.8, z, ry);
    if (i === n) continue;
    const mx = x + ax / 2; const mz = z + az / 2;
    if (skip && skip(mx, mz)) continue;
    const wallLen = Math.hypot(ax, az) - 1.2;
    box(wallLen, 5, 1, mx, -0.8, mz, 'stone', ry + Math.PI);
    box(wallLen, 0.3, 1.4, mx, 4.2, mz, 'trim', ry + Math.PI);
    const nx = Math.cos(ry); const nz = -Math.sin(ry);
    for (let k = 0; k < 3; k++) {
      const q = (k - 1) / 3.2;
      const cx = mx + ax * q; const cz = mz + az * q;
      box(0.28, 3.3, wallLen / 3.4, cx, 0, cz, 'dark', Math.abs(ax) > Math.abs(az) ? Math.PI / 2 : 0);
    }
    bulbLine([x + ax * 0.08, 4.65, z + az * 0.08], [x + ax * 0.92, 4.65, z + az * 0.92], 1.6);
  }
}
const WX = 127; const WN = -192; const WS = 58;
const gateGap = (x, z) => Math.abs(x) < 15 && z > 50;
perimeter([-WX, WS], [WX, WS], Math.PI, gateGap);
perimeter([-WX, WN], [WX, WN], 0);
perimeter([-WX, WN], [-WX, WS], Math.PI / 2);
perimeter([WX, WN], [WX, WS], -Math.PI / 2);
// Grand gate at the top of the stairs.
for (const side of [-1, 1]) {
  box(4, 13, 4, side * 16, -0.8, WS, 'stone');
  box(4.8, 0.6, 4.8, side * 16, 11.8, WS, 'trim');
  pinnacle(side * 16, 12.2, WS, 1.1, 7);
  bulbLine([side * 14, 0, WS + 2.1], [side * 14, 12, WS + 2.1], 0.9);
  bulbLine([side * 18, 0, WS + 2.1], [side * 18, 12, WS + 2.1], 0.9);
}
archRing(0, 8.4, 32.5, 28, 0.2, 2, WS + 1);
box(30, 0.9, 1.4, 0, 8, WS, 'trim');
box(0.45, 3, 0.45, 0, 34, WS, 'gold');
box(1.8, 0.35, 0.35, 0, 36, WS, 'gold');

skipping = false;
// Terraces and stairs.
const CLIMB = window.CHURCH_WALK.TEMPLE_CLIMB;
const TERR = TEMPLE ? CLIMB.terraces : [[-28, 28, 176, 208, -60], [-66, -24, 130, 164, -40], [24, 66, 90, 126, -20]];
// Openings in the terrace rails: which terrace, which edge (z or x at a fixed value) and the span left open.
const OPENINGS = TEMPLE ? [
  { terrace: 0, along: 'x', at: 176, from: -5.4, to: 5.4 }, { terrace: 0, along: 'x', at: 208, from: -6.5, to: 6.5 },
  { terrace: 1, along: 'x', at: 145, from: -5.4, to: 5.4 }, { terrace: 1, along: 'x', at: 133.5, from: -5.4, to: 5.4 },
  { terrace: 2, along: 'x', at: 102.5, from: -5.4, to: 5.4 }, { terrace: 2, along: 'x', at: 91, from: -5.4, to: 5.4 },
] : [
  { terrace: 0, along: 'x', at: 176, from: -30, to: -10 }, { terrace: 0, along: 'x', at: 208, from: -6.5, to: 6.5 },
  { terrace: 1, along: 'x', at: 164, from: -52, to: -32 }, { terrace: 1, along: 'z', at: -24, from: 140, to: 154 },
  { terrace: 2, along: 'z', at: 24, from: 101, to: 115 }, { terrace: 2, along: 'x', at: 90, from: 24, to: 48 },
];
const inGap = (g, x, z) => (g.along === 'x' ? Math.abs(z - g.at) < 0.1 && x >= g.from && x <= g.to : Math.abs(x - g.at) < 0.1 && z >= g.from && z <= g.to);
function railWithGaps(a, b, y, gaps) {
  const alongX = a[1] === b[1];
  const fixed = alongX ? a[1] : a[0];
  const lo = alongX ? a[0] : a[1]; const hi = alongX ? b[0] : b[1];
  const cuts = gaps.filter((g) => g.along === (alongX ? 'x' : 'z') && Math.abs(g.at - fixed) < 0.1).sort((p, q) => p.from - q.from);
  let start = lo;
  const piece = (u, v) => { if (v - u > 1) balustrade(alongX ? [u, fixed] : [fixed, u], alongX ? [v, fixed] : [fixed, v], y); };
  for (const g of cuts) { piece(start, Math.max(lo, g.from)); start = Math.min(hi, g.to); }
  piece(start, hi);
}
for (const [x0, x1, z0, z1, y] of TERR) {
  plinth(x0, x1, z0, z1, y, 34);
  add(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), 'paving', TRS((x0 + x1) / 2, y + 0.04, (z0 + z1) / 2));
  // The rails stop where a stairway or the bridge arrives, so nothing blocks the way.
  const open = OPENINGS.filter((g) => g.terrace === TERR.indexOf(TERR.find((t) => t[0] === x0 && t[2] === z0)));
  for (const [a, b] of [[[x0, z0], [x1, z0]], [[x1, z0], [x1, z1]], [[x0, z1], [x1, z1]], [[x0, z0], [x0, z1]]]) railWithGaps(a, b, y, open);
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) {
    if (open.some((g) => inGap(g, x, z))) continue;
    statueColumn(x, y, z, Math.atan2((x0 + x1) / 2 - x, (z0 + z1) / 2 - z) + Math.PI, 5);
  }
}
// The straight stair to the temple, with a carved central way between two lanes of steps.
function grandFlight(zA, yA, zB, yB) {
  const W = CLIMB.width;
  const rise = yB - yA; const run = zA - zB;
  const n = Math.round(rise / 0.25);
  for (let i = 0; i < n; i++) {
    const top = yA + (rise * (i + 1)) / n;
    const z = zA - (run * (i + 0.5)) / n;
    stepParts.push(TRS(0, top - 2, z, 0, 0, 0, W, 4, (run / n) * 1.08));
  }
  const len = Math.hypot(run, rise);
  const way = new THREE.PlaneGeometry(2.3, len).rotateX(-Math.PI / 2);
  add(way, 'carved', TRS(0, (yA + yB) / 2 + 0.34, (zA + zB) / 2, 0, Math.atan2(rise, run)));
  beam([0, zA, yA - 0.1], [0, zB, yB - 0.1], 2.3, 0.4, 'marbleShade');
  for (const side of [-1, 1]) {
    const x = side * (W / 2 + 0.18);
    beam([x, zA, yA - 1.3], [x, zB, yB - 1.3], 0.7, 3, 'stone');
    beam([x, zA + 0.1, yA + 0.18], [x, zB - 0.1, yB + 0.18], 0.62, 0.14, 'marbleShade');
    marbleRail([x, zA, yA + 0.2], [x, zB, yB + 0.2], 2.5);
    beam([side * 1.2, zA, yA + 0.27], [side * 1.2, zB, yB + 0.27], 0.2, 0.2, 'marble');
  }
}
if (TEMPLE) {
  for (const [za, ya, zb, yb] of CLIMB.flights) grandFlight(za, ya, zb, yb);
  // Stone lanterns stand in pairs on each landing.
  for (const [x, z, y] of [[-14.2, 134.7, -40], [14.2, 134.7, -40], [-14.2, 143.8, -40], [14.2, 143.8, -40], [-14.2, 92.2, -20], [14.2, 92.2, -20], [-14.2, 101.3, -20], [14.2, 101.3, -20]]) stoneLantern(x, y, z);
} else {
  flight([-20, 176, -60], [-42, 164, -40], 8, ['z', 176], ['z', 164]);
  flight([-24, 147, -40], [24, 108, -20], 8, ['x', -24], ['x', 24]);
  flight([36, 90, -20], [0, 58, 0], 14, ['z', 90], ['z', 58]);
}
skipping = TEMPLE;
// Funicular on its own trestle, for the stair-free route.
for (const [a, b] of [[[28, 188, -60], [76, 118, -20]], [[76, 118, -20], [60, 48, 0]]]) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  add(new THREE.BoxGeometry(5, 0.5, len), 'trim', new THREE.Matrix4().lookAt(new THREE.Vector3(b[0], b[2] + 1.5, b[1]), new THREE.Vector3(a[0], a[2] + 1.5, a[1]), new THREE.Vector3(0, 1, 0)).setPosition((a[0] + b[0]) / 2, (a[2] + b[2]) / 2 + 1.5, (a[1] + b[1]) / 2));
  for (let t = 0; t <= 1.001; t += 0.2) box(0.7, 12, 0.7, a[0] + (b[0] - a[0]) * t, a[2] + (b[2] - a[2]) * t - 10.8, a[1] + (b[1] - a[1]) * t, 'iron');
}
box(3.6, 3, 7, 52, -28, 149, 'wood');

skipping = false;
// The great arched bridge, with stacked arches like a viaduct.
{
  const zA = 208; const zB = 338; const top = -60; const bottom = -170;
  const shape = new THREE.Shape([new THREE.Vector2(0, bottom), new THREE.Vector2(zB - zA, bottom), new THREE.Vector2(zB - zA, top - 0.6), new THREE.Vector2(0, top - 0.6)]);
  const big = [[32.5, 25], [65, 25], [97.5, 25]];
  for (const [c, w] of big) {
    const p = new THREE.Path();
    p.moveTo(c - w / 2, bottom + 2);
    p.lineTo(c - w / 2, top - 44);
    p.absarc(c, top - 44, w / 2, Math.PI, 0, true);
    p.lineTo(c + w / 2, bottom + 2);
    p.closePath();
    shape.holes.push(p);
  }
  for (let i = 0; i < 12; i++) shape.holes.push(archPath(new THREE.Path(), 6 + i * 10.7, top - 19, 5.5, 9));
  const g = extrude(shape, 11, 16);
  add(g, 'stone', TRS(-5.5, 0, zB, Math.PI / 2));
  box(13.4, 0.8, zB - zA, 0, top - 0.75, (zA + zB) / 2, 'trim');
  add(new THREE.PlaneGeometry(11, zB - zA).rotateX(-Math.PI / 2), 'paving', TRS(0, top + 0.05, (zA + zB) / 2));
  for (const side of [-1, 1]) {
    balustrade([side * 5.8, zA], [side * 5.8, zB], top);
    for (let z = zA; z <= zB + 0.1; z += phone ? 32.5 : 16.25) statueColumn(side * 6.6, top, z, side > 0 ? Math.PI / 2 : -Math.PI / 2, 5);
    if (!TEMPLE) for (let z = zA + 8; z < zB; z += 16.25) lampPost(side * 5.3, top, z);
    if (!TEMPLE) bulbLine([side * 5.55, top - 18, zA], [side * 5.55, top - 18, zB], 1.1);
    for (const [c, w] of big) {
      for (let a = 0; a <= Math.PI + 0.01; a += Math.PI / 22) bulbs.push(side * 5.55, top - 44 + Math.sin(a) * (w / 2 + 0.4), zA + (zB - zA) - (c - Math.cos(a) * (w / 2 + 0.4)));
    }
  }
  plinth(6, 24, 263, 283, top, 4, 'trim');
  add(new THREE.PlaneGeometry(18, 20).rotateX(-Math.PI / 2), 'paving', TRS(15, top + 0.05, 273));
  balustrade([6, 263], [24, 263], top); balustrade([24, 263], [24, 283], top); balustrade([6, 283], [24, 283], top);
}
// Forest road and valley gatehouse.
{
  const pts = [[0, 568], [-70, 508], [50, 438], [-20, 368], [0, 338]].map(([x, z], i) => [x, z, [-120, -102, -82, -66, -60][i]]);
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]; const b = pts[i];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (TEMPLE) {
      // A stepped stone path with white rails and lanterns, and round landings at each turn.
      const rise = b[2] - a[2]; const run = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n = Math.max(6, Math.round(rise / 0.2));
      const ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
      const ux = (b[0] - a[0]) / run; const uz = (b[1] - a[1]) / run;
      for (let k = 0; k < n; k++) {
        const f = (k + 0.5) / n;
        stepParts.push(TRS(a[0] + (b[0] - a[0]) * f, a[2] + (rise * (k + 1)) / n - 1.5, a[1] + (b[1] - a[1]) * f, ry, 0, 0, 8, 3, (run / n) * 1.06));
      }
      const trim = 7.5 / run;
      for (const side of [-1, 1]) {
        const ox = uz * side * 4.25; const oz = -ux * side * 4.25;
        const p = [a[0] + (b[0] - a[0]) * trim + ox, a[1] + (b[1] - a[1]) * trim + oz, a[2] + rise * trim + 0.15];
        const q = [b[0] - (b[0] - a[0]) * trim + ox, b[1] - (b[1] - a[1]) * trim + oz, b[2] - rise * trim + 0.15];
        marbleRail(p, q, 3.2);
        const every = Math.max(2, Math.round(run / 22));
        for (let k = 1; k < every; k++) { const f = k / every; stoneLantern(a[0] + (b[0] - a[0]) * f + ox * 1.34, a[2] + rise * f - 0.1, a[1] + (b[1] - a[1]) * f + oz * 1.34); }
      }
      for (const end of [a, b]) {
        if (end[1] === 338) continue;
        add(new THREE.CylinderGeometry(7.2, 7.6, 3, 8), 'paving', TRS(end[0], end[2] - 1.5 + 0.04, end[1], Math.PI / 8));
      }
      continue;
    }
    add(new THREE.BoxGeometry(8, 0.5, len + 4), 'paving', new THREE.Matrix4().lookAt(new THREE.Vector3(b[0], b[2], b[1]), new THREE.Vector3(a[0], a[2], a[1]), new THREE.Vector3(0, 1, 0)).setPosition((a[0] + b[0]) / 2, (a[2] + b[2]) / 2 + 0.35, (a[1] + b[1]) / 2));
    for (let t = 0.1; t < 1; t += 0.2) lampPost(a[0] + (b[0] - a[0]) * t + 4.6, a[2] + (b[2] - a[2]) * t + 0.4, a[1] + (b[1] - a[1]) * t, 3.8);
  }
  skipping = TEMPLE;
  const y = -120; const gz = 568;
  wall([[-18, 0], [18, 0], [18, 13], [8, 13], [8, 18], [-8, 18], [-8, 13], [-18, 13]], [{ x: 0, y: 0, w: 10, spring: 6 }], 3, 'stone', 0, 0, 0);
  const last = parts.get('stone').pop();
  last.applyMatrix4(TRS(0, y, gz + 2));
  parts.get('stone').push(last);
  for (const side of [-1, 1]) {
    box(6, 19, 6, side * 15, y, gz, 'stone');
    add(new THREE.ConeGeometry(4.3, 12, 8), 'slate', TRS(side * 15, y + 25, gz, Math.PI / 8));
    box(0.2, 2.2, 0.2, side * 15, y + 31, gz, 'gold');
    statueColumn(side * 7, y, gz + 7, 0, 5);
  }
}
// Gardens: hedged lawns on both sides of the forecourt, plus the cloister and west garden.
const hedgeParts = [];
const cypress = [];
const roundTrees = [];
const flowers = [];
function bed(x0, x1, z0, z1, palette) {
  box(x1 - x0, 0.16, z1 - z0, (x0 + x1) / 2, -0.8, (z0 + z1) / 2, 'lawn');
  for (const [a, b, c, d] of [[x0, x1, z0, z0], [x0, x1, z1, z1], [x0, x0, z0, z1], [x1, x1, z0, z1]]) {
    hedgeParts.push(TRS((a + b) / 2, -0.25, (c + d) / 2, 0, 0, 0, Math.max(0.8, b - a), 1.1, Math.max(0.8, d - c)));
  }
  const n = phone ? 8 : 26;
  for (let i = 0; i < n; i++) flowers.push([x0 + 1 + rand() * (x1 - x0 - 2), z0 + 1 + rand() * (z1 - z0 - 2), palette[Math.floor(rand() * palette.length)]]);
}
function fountain(x, z, r = 3.4) {
  add(new THREE.CylinderGeometry(r, r + 0.2, 0.7, 28), 'trim', TRS(x, -0.45, z));
  add(new THREE.CylinderGeometry(r - 0.35, r - 0.35, 0.08, 28), 'water', TRS(x, -0.06, z));
  add(new THREE.CylinderGeometry(0.3, 0.55, 2.2, 12), 'trim', TRS(x, 1, z));
  add(new THREE.CylinderGeometry(1.2, 0.3, 0.4, 16), 'trim', TRS(x, 2.2, z));
  add(new THREE.SphereGeometry(0.34, 10, 8), 'gold', TRS(x, 2.75, z));
}
const PINK = [0xe5839f, 0xf4d0d9, 0xffffff];
const GOLD = [0xf0bf3f, 0xf6e6a2, 0xe88e33];
const BLUE = [0x5c7bd9, 0xa089de, 0xffffff];
for (const side of [-1, 1]) {
  for (const [z0, z1, pal] of [[6, 24, PINK], [30, 50, GOLD]]) {
    bed(side > 0 ? 66 : -86, side > 0 ? 86 : -66, z0, z1, pal);
    bed(side > 0 ? 94 : -118, side > 0 ? 118 : -94, z0, z1, BLUE);
  }
  fountain(side * 90, 27);
  for (let z = 2; z <= 54; z += 8) cypress.push([side * 60, z], [side * 122, z]);
  for (let z = -48; z <= -6; z += 10) for (const x of [66, 84, 102, 120]) roundTrees.push([side * x, z]);
  for (const [x, z] of [[side * 76, 54], [side * 106, 54], [side * 76, 2], [side * 106, 2]]) lampPost(x, -0.8, z);
}
// East cloister: covered walks around a garden court.
function cloister(x0, x1, z0, z1, flowerSet) {
  const cols = [];
  for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / 10) cols.push([x, z0], [x, z1]);
  for (let z = z0 + (z1 - z0) / 10; z < z1 - 0.1; z += (z1 - z0) / 10) cols.push([x0, z], [x1, z]);
  for (const [x, z] of cols) {
    add(new THREE.CylinderGeometry(0.28, 0.34, 4.2, 12), 'trim', TRS(x, 1.3, z));
    box(0.95, 0.3, 0.95, x, 3.4, z, 'trim');
    box(0.8, 0.4, 0.8, x, -0.8, z, 'trim');
  }
  const R = 4;
  for (const [a, b, c, d] of [[x0 - R, x1 + R, z0 - R, z0 + 0.2], [x0 - R, x1 + R, z1 - 0.2, z1 + R]]) {
    box(b - a, 0.5, d - c, (a + b) / 2, 3.7, (c + d) / 2, 'trim');
    pitched(a, b, c, d, 4.2, 2.4, true);
  }
  for (const [a, b, c, d] of [[x0 - R, x0 + 0.2, z0, z1], [x1 - 0.2, x1 + R, z0, z1]]) {
    box(b - a, 0.5, d - c, (a + b) / 2, 3.7, (c + d) / 2, 'trim');
    pitched(a, b, c, d, 4.2, 2.4, false);
  }
  bulbLine([x0, 3.5, z0 - 0.1], [x1, 3.5, z0 - 0.1], 1.5); bulbLine([x0, 3.5, z1 + 0.1], [x1, 3.5, z1 + 0.1], 1.5);
  bulbLine([x0 - 0.1, 3.5, z0], [x0 - 0.1, 3.5, z1], 1.5); bulbLine([x1 + 0.1, 3.5, z0], [x1 + 0.1, 3.5, z1], 1.5);
  const cx = (x0 + x1) / 2; const cz = (z0 + z1) / 2;
  fountain(cx, cz, 4);
  const hw = (x1 - x0) * 0.43; const hd = (z1 - z0) * 0.43;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    bed(cx + sx * hw - (sx > 0 ? hw * 0.8 : 0), cx + sx * hw + (sx < 0 ? hw * 0.8 : 0), cz + sz * hd - (sz > 0 ? hd * 0.8 : 0), cz + sz * hd + (sz < 0 ? hd * 0.8 : 0), flowerSet);
    cypress.push([cx + sx * hw * 0.2, cz + sz * hd * 0.2]);
  }
}
cloister(58, 112, -156, -96, PINK);
cloister(-112, -58, -156, -96, GOLD);
for (const side of [-1, 1]) {
  // Refectory, kitchen and matching west wing.
  box(54, 12, 18, side * 85, -0.8, -84, 'stone');
  pitched(side * 85 - 27.5, side * 85 + 27.5, -94, -74, 11.2, 7, true);
  for (let k = 0; k < 7; k++) {
    const g = extrude(archPath(new THREE.Shape(), 0, 0, 2.5, 4), 0.1, 10);
    add(g, 'glass', TRS(side * 85 - 22 + k * 7.3, 2.2, -74.9));
  }
  box(54, 8, 16, side * 85, -0.8, -66, 'stone');
  pitched(side * 85 - 27.5, side * 85 + 27.5, -75, -57, 7.2, 4.5, true);
}
const crocketMesh = new THREE.InstancedMesh(crocket, M.trim, crocketM.length);
crocketM.forEach((m, i) => crocketMesh.setMatrixAt(i, m));
crocketMesh.castShadow = true;
scene.add(crocketMesh);
const stepMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), M.trim, stepParts.length);
stepParts.forEach((m, i) => stepMesh.setMatrixAt(i, m));
stepMesh.userData.guard = true;
const fountains = createFountains(scene, { phone, stone: M.trim, gold: M.gold, temple: TEMPLE });
stepMesh.castShadow = stepMesh.receiveShadow = true;
stepMesh.frustumCulled = false;
scene.add(stepMesh);
if (TEMPLE) {
  // No hedged gardens or angels here: fields of trees beyond the wall, and stone lanterns on the columns.
  hedgeParts.length = 0; cypress.length = 0; flowers.length = 0; roundTrees.length = 0;
  for (let z = -190; z <= 56; z += 11) for (const x of [66, 78, 90, 102, 114, 126]) { if (rand() < 0.82) roundTrees.push([x + rand() * 5, z + rand() * 5]); if (rand() < 0.82) roundTrees.push([-x - rand() * 5, z + rand() * 5]); }
  for (let x = -60; x <= 60; x += 12) for (const z of [-152, -166, -180, -194]) if (rand() < 0.85) roundTrees.push([x + rand() * 5, z + rand() * 5]);
  skipping = false;
  for (const [x, y, z] of COLS) {
    add(new THREE.BoxGeometry(0.62, 0.7, 0.62), 'paving', TRS(x, y + 0.35, z));
    add(new THREE.ConeGeometry(0.72, 0.42, 4), 'stone', TRS(x, y + 0.91, z, Math.PI / 4));
    add(new THREE.SphereGeometry(0.11, 8, 6), 'gold', TRS(x, y + 1.18, z));
    lamps.push([x, y - 3.4, z]);
  }
  COLS.length = 0;
}
const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x2f5129, roughness: 1 });
const hedgeMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), hedgeMat, hedgeParts.length);
hedgeParts.forEach((m, i) => hedgeMesh.setMatrixAt(i, m));
hedgeMesh.castShadow = hedgeMesh.receiveShadow = true;
scene.add(hedgeMesh);
const cypGeo = new THREE.ConeGeometry(1, 1, 10);
cypGeo.translate(0, 0.5, 0);
const cypMesh = new THREE.InstancedMesh(cypGeo, new THREE.MeshStandardMaterial({ color: 0x223f2b, roughness: 1 }), cypress.length);
cypress.forEach(([x, z], i) => { const s0 = 1.15 + rand() * 0.25; cypMesh.setMatrixAt(i, TRS(x, -0.8, z, 0, 0, 0, s0, 9 + rand() * 3, s0)); });
cypMesh.castShadow = true;
scene.add(cypMesh);
const crownGeo = new THREE.IcosahedronGeometry(1, phone ? 1 : 2);
const crown = new THREE.InstancedMesh(crownGeo, new THREE.MeshStandardMaterial({ roughness: 1 }), roundTrees.length * 3);
const crownCol = new THREE.Color();
roundTrees.forEach(([x, z], i) => {
  for (let k = 0; k < 3; k++) {
    crown.setMatrixAt(i * 3 + k, TRS(x + (k - 1) * 1.4, (TEMPLE ? 4.2 : 6) + (k === 1 ? 1.7 : 0), z + (k === 1 ? 0 : 0.8), 0, 0, 0, 2.8, 2.4, 2.8));
    crown.setColorAt(i * 3 + k, crownCol.set(0x476f35).offsetHSL((rand() - 0.5) * 0.03, 0, (rand() - 0.5) * 0.05));
  }
});
crown.castShadow = true;
scene.add(crown);
const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.25, 0.42, 7, 8), new THREE.MeshStandardMaterial({ color: 0x4b3a2b, roughness: 1 }), roundTrees.length);
roundTrees.forEach(([x, z], i) => trunk.setMatrixAt(i, TRS(x, TEMPLE ? 0.9 : 2.7, z)));
scene.add(trunk);
const flowerMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.34, 0), new THREE.MeshStandardMaterial({ roughness: 0.9 }), flowers.length);
const flowerCol = new THREE.Color();
flowers.forEach(([x, z, color], i) => { flowerMesh.setMatrixAt(i, TRS(x, -0.3, z)); flowerMesh.setColorAt(i, flowerCol.set(color)); });
scene.add(flowerMesh);
build();

// ---------- Statues: marble, with painted robes and gilded details ----------
const FIG = { angel: makeFigure('angel', true), sword: makeFigure('sword', true), trumpet: makeFigure('trumpet', true), saint: makeFigure('saint', true), mary: makeFigure('mary') };
const marbleMat = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.42, metalness: 0, emissive: 0xffc98a, emissiveIntensity: 0 });
const paintMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, emissive: 0xffc98a, emissiveIntensity: 0 });
const goldMat = new THREE.MeshStandardMaterial({ color: 0xf0c04f, roughness: 0.32, metalness: 0.45, emissive: 0x8a5a12, emissiveIntensity: 0.3 });
const statueMats = [marbleMat, paintMat, goldMat];
function placeFigures(kind, list) {
  if (!list.length || TEMPLE) return;
  const f = FIG[kind];
  const meshes = [new THREE.InstancedMesh(f.marble, marbleMat, list.length), new THREE.InstancedMesh(f.paint, paintMat, list.length), new THREE.InstancedMesh(f.gold, goldMat, list.length)];
  const col = new THREE.Color();
  list.forEach((s, i) => {
    const m = TRS(s.x, s.y, s.z, s.ry, 0, 0, s.scale, s.scale, s.scale);
    meshes.forEach((mesh) => mesh.setMatrixAt(i, m));
    meshes[1].setColorAt(i, col.set(s.color));
  });
  for (const mesh of meshes) { mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false; scene.add(mesh); }
}
const ROBES = [0x2f58b8, 0xa52a35, 0x1f7a68, 0x6c3ea6];
const angels = { angel: [], sword: [], trumpet: [] };
COLS.forEach(([x, y, z, ry], i) => {
  const kind = ['angel', 'sword', 'trumpet'][i % 3];
  angels[kind].push({ x, y, z, ry, scale: 1.45, color: ROBES[i % ROBES.length] });
});
for (const k of Object.keys(angels)) placeFigures(k, angels[k]);
const saints = [];
for (let i = 0; i < 17; i++) saints.push({ x: -20 + (40 * i) / 16, y: 21.55, z: 0.22, ry: 0, scale: 1.08, color: ROBES[i % ROBES.length] });
placeFigures('saint', saints);
placeFigures('mary', [
  { x: 0, y: 3.6, z: 34, ry: 0, scale: 2.1, color: 0x2a55b5 },
  { x: 0, y: 49.2, z: 1, ry: 0, scale: 1.9, color: 0x2a55b5 },
]);

// ---------- Night lights ----------
function glowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 1, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,245,220,1)');
  gr.addColorStop(0.18, 'rgba(255,215,145,.95)');
  gr.addColorStop(0.5, 'rgba(255,175,90,.22)');
  gr.addColorStop(1, 'rgba(255,160,70,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const glowMap = glowTexture();
skipping = TEMPLE;
// Bulbs along the church's main lines.
const lineSets = [
  [[-22, 50.6, 0.5], [0, 69.6, 0.5]], [[22, 50.6, 0.5], [0, 69.6, 0.5]],
  [[-22, 21.8, 0.75], [22, 21.8, 0.75]], [[-22, 27, 0.75], [22, 27, 0.75]],
];
for (const [a, b] of lineSets) bulbLine(a, b, 1);
for (const cx of [-29, 29]) {
  for (const y of [11.2, 31, 55.5, 74.5]) bulbLine([cx - 7.4, y + 0.2, 0.75], [cx + 7.4, y + 0.2, 0.75], 0.9);
  bulbLine([cx - 7.5, 88.4, 0.2], [cx + 7.5, 88.4, 0.2], 0.8);
  for (const x of [cx - 7.1, cx + 7.1]) bulbLine([x, 0, 0.75], [x, 86, 0.75], 1.4);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    bulbLine([cx + Math.cos(ang) * 5.9, 86.4, -7 + Math.sin(ang) * 5.9], [cx, 144.4, -7], 1.5);
  }
}
for (let a = 0; a < (TEMPLE ? 0 : 90); a++) { const t = (a / 90) * 6.283; bulbs.push(Math.cos(t) * 9.9, 39 + Math.sin(t) * 9.9, 0.85); }
skipping = false;
const bulbGeo = new THREE.BufferGeometry();
bulbGeo.setAttribute('position', new THREE.Float32BufferAttribute(bulbs, 3));
const bulbMat = new THREE.PointsMaterial({ map: glowMap, size: 1.5, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, sizeAttenuation: true, fog: false });
const bulbPoints = new THREE.Points(bulbGeo, bulbMat);
bulbPoints.frustumCulled = false;
scene.add(bulbPoints);
// Lantern halos and pools of light on the ground.
const lampHalo = new Float32Array(lamps.length * 3);
lamps.forEach(([x, y, z], i) => lampHalo.set([x, y + 4.6, z], i * 3));
const haloGeo = new THREE.BufferGeometry();
haloGeo.setAttribute('position', new THREE.BufferAttribute(lampHalo, 3));
const haloMat = new THREE.PointsMaterial({ map: glowMap, size: 3.6, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false });
const halos = new THREE.Points(haloGeo, haloMat);
halos.frustumCulled = false;
scene.add(halos);
const poolMat = new THREE.MeshBasicMaterial({ map: glowMap, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false });
const pools = new THREE.InstancedMesh(new THREE.CircleGeometry(4.2, 16).rotateX(-Math.PI / 2), poolMat, lamps.length);
lamps.forEach(([x, y, z], i) => pools.setMatrixAt(i, TRS(x, y + 0.14, z)));
pools.frustumCulled = false;
scene.add(pools);
// Warm floodlights washing up the stone, ledge by ledge.
const nightU = { value: 0 };
for (const mat of [M.stone, M.trim]) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = nightU;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vGlowP;\nvarying float vGlowUp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlowP = position;\nvGlowUp = normal.y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uNight;\nvarying vec3 vGlowP;\nvarying float vGlowUp;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float along = vGlowP.x + vGlowP.z;
        float scallop = 0.35 + 0.65 * pow(abs(cos(along * 3.14159 / 7.0)), 2.0);
        float band = fract(vGlowP.y / 29.0);
        float wash = mix(1.0, 0.15, smoothstep(0.0, 1.0, band)) * scallop * (1.0 - abs(vGlowUp));
        totalEmissiveRadiance += uNight * vec3(1.0, 0.6, 0.27) * diffuseColor.rgb * (wash * 0.95 + 0.05);`);
  };
  mat.customProgramCacheKey = () => 'night-glow';
}

// ---------- Sky, light, landscape ----------
const skyMat = createSkyMaterial();
const sky = new THREE.Mesh(new THREE.SphereGeometry(11000, 40, 24), skyMat);
scene.add(sky);
scene.fog = new THREE.Fog(0xdbe6ea, 900, 7500);
const hemi = new THREE.HemisphereLight(0xcfdfff, 0x8a7f6f, 0.45);
const sun = new THREE.DirectionalLight(0xfff0d8, 3.1);
sun.position.set(130, 180, 170);
sun.target.position.set(0, 50, -20);
if (shadows) {
  sun.castShadow = true;
  sun.shadow.mapSize.set(phone ? 2048 : 4096, phone ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -200, right: 200, top: 210, bottom: -170, near: 20, far: 860 });
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.06;
}
const flood = new THREE.DirectionalLight(0xffb978, 0);
flood.position.set(0, -40, 300);
flood.target.position.set(0, 40, 0);
scene.add(hemi, sun, sun.target, flood, flood.target);
const pmrem = new THREE.PMREMGenerator(renderer);
function refreshEnvironment() {
  const envScene = new THREE.Scene();
  envScene.add(sky.clone());
  const rt = pmrem.fromScene(envScene, 0.04, 1, 14000);
  scene.environment = rt.texture;
}
// Steep ground turns to layered rock; flatter ground stays green. Worked out per pixel.
function landMaterial() {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSeasonSnow = seasonU.uSeasonSnow;
    if (TEMPLE) Object.assign(shader.uniforms, { uCloudCol: skyU.uCloudCol, uSunCol: skyU.uSunCol, uTop: skyU.uTop, uLow: skyU.uLow });
    Object.assign(shader.uniforms, { uGrass: seasonU.uGrass, uLeaf: seasonU.uLeaf, uBloom: seasonU.uBloom, uCover: seasonU.uCover, uBare: seasonU.uBare });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLandP;\nvarying float vLandUp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLandP = position;\nvLandUp = normal.y;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
${TEMPLE ? 'uniform vec3 uCloudCol; uniform vec3 uSunCol; uniform vec3 uTop; uniform vec3 uLow;' : ''}
`+'\nuniform float uSeasonSnow;\nuniform vec3 uGrass;\nuniform vec3 uLeaf[6];\nuniform vec3 uBloom[6];\nuniform float uCover[6];\nuniform float uBare[6];\nvarying vec3 vLandP;\nvarying float vLandUp;\nfloat landHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}\nfloat landNoise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(landHash(i),landHash(i+vec2(1.0,0.0)),f.x),mix(landHash(i+vec2(0.0,1.0)),landHash(i+vec2(1.0,1.0)),f.x),f.y);}')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float fine = landHash(floor(vLandP.xz * 1.4));
        float broad = landHash(floor(vLandP.xz * 0.11));
        ${TEMPLE ? `float camDist = length(vLandP - cameraPosition);
        fine = mix(fine, 0.5, smoothstep(40.0, 240.0, camDist));
        broad = landNoise(vLandP.xz * 0.03);` : ''}
        diffuseColor.rgb *= (0.86 + fine * 0.2 + broad * 0.1) * uGrass;
        float steep = smoothstep(0.66, 0.46, vLandUp + (broad - 0.5) * 0.12 + (fine - 0.5) * 0.06);
        float ledges = sin(vLandP.y * 0.3 + sin(vLandP.x * 0.021) * 5.0 + sin(vLandP.z * 0.017) * 5.0 + broad * 2.5) * 0.5 + 0.5;
        float crack = landHash(vec2(floor(vLandP.y * 1.1), floor((vLandP.x + vLandP.z) * 0.32)));
        ${TEMPLE ? 'crack = mix(crack, 0.5, smoothstep(20.0, 120.0, camDist)); ledges = landNoise(vec2(vLandP.x + vLandP.z, vLandP.y * 7.0) * 0.012) * 0.6 + landNoise(vLandP.xz * 0.05) * 0.4;' : ''}
        vec3 rock = mix(vec3(0.17, 0.16, 0.145), vec3(0.25, 0.235, 0.205), ledges) * (0.78 + crack * 0.34 + fine * 0.14);
        diffuseColor.rgb = mix(diffuseColor.rgb, rock, steep);
        // Far forest painted on the ground, so the mountain reads as fully covered between the trees.
        float forest = ${TEMPLE ? 'smoothstep(380.0, 620.0, length(vLandP.xz))' : 'max(smoothstep(-204.0, -236.0, vLandP.z), smoothstep(70.0, 0.0, vLandP.z) * smoothstep(138.0, 185.0, abs(vLandP.x)))'} * (1.0 - steep);
        vec2 warped = vLandP.xz + vec2(sin(vLandP.z * 0.041), cos(vLandP.x * 0.037)) * 34.0;
        float leafCell = landHash(floor(vLandP.xz / 4.5));
        float crownCell = landHash(floor((vLandP.xz + 3.0) / 13.0));
        int forestG = int(landHash(floor((warped + (vec2(leafCell, crownCell) - 0.5) * 84.0) / 96.0)) * 5.99);
        vec3 canopy = mix(uLeaf[forestG], uBloom[forestG], step(leafCell * 0.5 + crownCell * 0.5, uCover[forestG])) * (0.42 + crownCell * 0.36 + leafCell * 0.1);
        canopy = mix(canopy, vec3(0.13, 0.11, 0.095) + vec3(0.2) * leafCell, uBare[forestG] * 0.75);
        ${TEMPLE ? `{
          float n1 = landNoise(warped / 42.0); float n2 = landNoise(warped / 10.0);
          int g2 = int(clamp(landNoise(warped / 150.0) * 1.7 - 0.35, 0.0, 0.99) * 5.99);
          canopy = mix(uLeaf[g2], uBloom[g2], smoothstep(-0.14, 0.14, uCover[g2] - (n1 * 0.6 + n2 * 0.4))) * (0.42 + n1 * 0.4 + n2 * 0.22);
          canopy = mix(vec3(0.075, 0.15, 0.075) * (0.7 + n1 * 0.7), canopy, smoothstep(0.52, 0.62, landNoise(warped / 26.0) * 0.6 + n2 * 0.4) * 0.8);
          canopy = mix(canopy, vec3(0.2, 0.18, 0.16), uBare[g2] * 0.7);
        }` : ''}
        diffuseColor.rgb = mix(diffuseColor.rgb, canopy, forest * 0.94);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.88, 0.91, 0.95), uSeasonSnow * smoothstep(0.52, 0.78, vLandUp + (fine - 0.5) * 0.2));`);
    if (TEMPLE) shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        // Low ground melts into the cloud sea.
        outgoingLight = mix(outgoingLight, mix(uCloudCol, uSunCol, 0.2) * 0.92, smoothstep(-132.0, -214.0, vLandP.y));
        #include <opaque_fragment>`);
  };
  return mat;
}
// Land.
{
  const geo = new THREE.PlaneGeometry(2, 2, phone ? 180 : 320, phone ? 180 : 320);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  // Grid squares are small near the site and larger far away.
  const warp = (u) => Math.sign(u) * Math.pow(Math.abs(u), 1.9) * 3900;
  const smooth = (e0, e1, v) => { const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  const FLAT = [[-WX - 6, WX + 6, WN - 6, WS + 6, TEMPLE ? -2.15 : -0.9], ...TERR.map(([a, b, d, e, y]) => [a, b, d, e, y - 0.3]), [-22, 22, 568, 612, -120.5]];
  const ROUTE = [...(TEMPLE ? CLIMB.flights.map(([za, ya, zb, yb]) => [[0, za, ya], [0, zb, yb]]) : [[[-20, 176, -60], [-42, 164, -40]], [[-24, 147, -40], [24, 108, -20]], [[36, 90, -20], [0, 58, 0]]]), [[0, 568, -120], [-70, 508, -102]], [[-70, 508, -102], [50, 438, -82]], [[50, 438, -82], [-20, 368, -66]], [[-20, 368, -66], [0, 338, -60]]];
  function shaped(x, z, raw) {
    let h = raw;
    for (const [a, b, d, e, y] of FLAT) {
      const dist = Math.max(a - x, 0, x - b, d - z, 0, z - e);
      h = h + (y - h) * (1 - smooth(0, 22, dist));
    }
    for (const [a, b] of ROUTE) {
      const vx = b[0] - a[0]; const vz = b[1] - a[1];
      const t = Math.max(0, Math.min(1, ((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz)));
      const dist = Math.hypot(x - (a[0] + vx * t), z - (a[1] + vz * t));
      h = h + (a[2] + (b[2] - a[2]) * t - 1.2 - h) * (1 - smooth(4, 20, dist));
    }
    return underStairs(x, z, h);
  }
  window.CHURCH_LAND = (x, z) => shaped(x, z, landHeight(x, z));
  // Height of the land as actually drawn: far from the site the grid is coarse, and it misses sharp crags.
  const CELLS = phone ? 180 : 320;
  const unwarp = (v) => Math.sign(v) * Math.pow(Math.min(1, Math.abs(v) / 3900), 1 / 1.9);
  window.CHURCH_LAND_DRAWN = (x, z) => {
    const gx = ((unwarp(x) + 1) / 2) * CELLS; const gz = ((unwarp(z - 170) + 1) / 2) * CELLS;
    const i = Math.floor(gx); const j = Math.floor(gz); const fx = gx - i; const fz = gz - j;
    const at = (p, q) => window.CHURCH_LAND(warp((p / CELLS) * 2 - 1), 170 + warp((q / CELLS) * 2 - 1));
    return Math.min(at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1)) * 0.5 + (at(i, j) * (1 - fx) * (1 - fz) + at(i + 1, j) * fx * (1 - fz) + at(i, j + 1) * (1 - fx) * fz + at(i + 1, j + 1) * fx * fz) * 0.5;
  };
  for (let i = 0; i < p.count; i++) {
    const x = warp(p.getX(i)); const z = 170 + warp(p.getZ(i));
    p.setX(i, x); p.setZ(i, z);
    const h = window.CHURCH_LAND(x, z);
    p.setY(i, h);
    c.set(0x3f5a35).lerp(new THREE.Color(0x4d6a40), Math.random());
    c.lerp(new THREE.Color(0x294a2f), Math.min(1, Math.max(0, (Math.hypot(x, z - 170) - 350) / 900)));
    if (h > 330 && z > -202) c.lerp(new THREE.Color(0x6d675a), Math.min(1, (h - 330) / 120));
    c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.03);
    col.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, landMaterial());
  land.userData.noGuard = true;
  land.receiveShadow = true;
  scene.add(land);
  // A conifer with four layered tiers, so forests read as trees from afar.
  const tiers = [];
  for (let t = 0; t < 3; t++) {
    const tier = new THREE.ConeGeometry(1 - t * 0.26, 0.52, 7, 1, true).toNonIndexed();
    tier.translate(0, 0.26 + t * 0.26, 0);
    tiers.push(tier);
  }
  const count = phone ? 800 : 2800;
  const total = tiers.reduce((sum, g) => sum + g.attributes.position.count, 0);
  const tp = new Float32Array(total * 3); const tn = new Float32Array(total * 3);
  let cursor = 0;
  for (const g of tiers) { tp.set(g.attributes.position.array, cursor); tn.set(g.attributes.normal.array, cursor); cursor += g.attributes.position.array.length; }
  const treeGeo = new THREE.BufferGeometry();
  treeGeo.setAttribute('position', new THREE.BufferAttribute(tp, 3));
  treeGeo.setAttribute('normal', new THREE.BufferAttribute(tn, 3));
  const treeMat = new THREE.MeshStandardMaterial({ roughness: 1 });
  addSnow(treeMat, 'conifer-snow');
  const trees = new THREE.InstancedMesh(treeGeo, treeMat, count);
  const tc = new THREE.Color();
  let placed = 0;
  for (let tries = 0; tries < count * 12 && placed < count; tries++) {
    const spread = rand() < 0.55 ? 1100 : 3000;
    const x = (rand() - 0.5) * spread; const z = -280 + rand() * (spread === 1100 ? 1200 : 1900);
    if (Math.abs(x) < WX + 14 && z > WN - 12 && z < WS + 48) continue;
    if (Math.abs(x) < 14 && z > 200 && z < 345) continue;
    if (TERR.some(([a, b, d, e]) => x > a - 10 && x < b + 10 && z > d - 10 && z < e + 10)) continue;
    if (Math.abs(x) < 90 && z > 58 && z < 208 && Math.abs(x - z * 0.15) < 34) continue;
    if (z > 335 && z < 620 && [[0, 568, -70, 508], [-70, 508, 50, 438], [50, 438, -20, 368], [-20, 368, 0, 338]].some(([ax, az, bx, bz]) => { const vx = bx - ax; const vz = bz - az; const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz))); return Math.hypot(x - ax - vx * t, z - az - vz * t) < 9; })) continue;
    const h = TEMPLE ? window.CHURCH_LAND_DRAWN(x, z) : window.CHURCH_LAND(x, z);
    const steep = Math.hypot(window.CHURCH_LAND(x + 7, z) - window.CHURCH_LAND(x, z), window.CHURCH_LAND(x, z + 7) - window.CHURCH_LAND(x, z)) / 7;
    if (TEMPLE && ((Math.abs(x) < 16 && z > 58 && z < 210) || Math.hypot(x, z - 192) < 62)) continue;
    if (steep > 0.85 || h > 420 || isWaterSide(x, z) || (z < -190 && rand() > 0.16) || (TEMPLE && (Math.hypot(x, z - 580) < 34 || h < -125 || (Math.abs(x) < 160 && z > -220 && z < 90 && rand() < 0.85)))) continue;
    const near = riverNear(x, z);
    if (near && near.d < near.w / 2 + 9) continue;
    const s0 = 3 + rand() * 2.4;
    trees.setMatrixAt(placed, TRS(x, h - 0.5, z, rand() * 6.28, 0, 0, s0, s0 * (3.4 + rand() * 1.6), s0));
    trees.setColorAt(placed++, tc.set(0x233f2a).offsetHSL((rand() - 0.5) * 0.05, (rand() - 0.5) * 0.08, (rand() - 0.5) * 0.05));
  }
  trees.count = placed;
  trees.castShadow = false;
  trees.frustumCulled = false;
  scene.add(trees);
}
// Soft clouds.
const cloudSprites = [];
{
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  for (let i = 0; i < 170; i++) {
    const x = 60 + rand() * 390; const spread = Math.sin(((x - 60) / 390) * Math.PI);
    const y = 180 - rand() * 120 * spread; const r = (14 + rand() * 42) * (0.5 + spread * 0.6);
    const gr = g.createRadialGradient(x, y, 1, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  for (let i = 0; i < 22; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0.9 }));
    const a = rand() * 6.28; const r = 800 + rand() * 900;
    s.position.set(Math.sin(a) * r, 700 + rand() * 420, Math.cos(a) * r);
    const w = 500 + rand() * 500;
    s.scale.set(w, w * 0.34, 1);
    scene.add(s);
    cloudSprites.push(s);
  }
}
const scenery = createScenery(scene, phone, rand, TRS);
// Flowering forest over the back mountain and the slopes beside the church.
{
  const spots = [];
  const wanted = phone ? 1100 : 3400;
  const patch = (x, z) => { const a = Math.sin(Math.floor(x / 110) * 12.9898 + Math.floor(z / 110) * 78.233) * 43758.5453; return a - Math.floor(a); };
  for (let tries = 0; tries < wanted * 8 && spots.length < wanted; tries++) {
    const back = rand() < 0.86;
    let x = back ? (rand() - 0.5) * 2300 : (rand() < 0.5 ? -1 : 1) * (150 + rand() * 450);
    let z = back ? -206 - Math.pow(rand(), 0.8) * 1000 : -200 + rand() * 240;
    if (TEMPLE) {
      // Flowering trees on the shoulders of the summit and along the ridge.
      const onRidge = rand() < 0.3;
      x = onRidge ? (rand() - 0.5) * 240 : (rand() - 0.5) * 460;
      z = onRidge ? 60 + rand() * 560 : -290 + rand() * 430;
    }
    const h = TEMPLE ? window.CHURCH_LAND_DRAWN(x, z) : window.CHURCH_LAND(x, z);
    const nearRoad = TEMPLE && (Math.hypot(x, z - 580) < 34 || [[0, 568, -70, 508], [-70, 508, 50, 438], [50, 438, -20, 368], [-20, 368, 0, 338], [0, 208, 0, 58]].some(([ax, az, bx, bz]) => {
      const vx = bx - ax; const vz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
      return Math.hypot(x - ax - vx * t, z - az - vz * t) < 13;
    }));
    if (TEMPLE && (nearRoad || Math.hypot(x, z - 192) < 48 || h < -120 || (Math.abs(x) < 8 && z > 58) || TERR.some(([a, b, d, e]) => x > a - 9 && x < b + 9 && z > d - 9 && z < e + 9))) continue;
    const slope = Math.hypot(window.CHURCH_LAND(x + 8, z) - h, window.CHURCH_LAND(x, z + 8) - h) / 8;
    if (slope > 1.05 || isWaterSide(x, z) || (Math.abs(x) < WX + (TEMPLE ? 6 : 16) && z > WN - (TEMPLE ? 6 : 18) && z < (TEMPLE ? 66 : 9999))) continue;
    const mixGroup = patch(x, z) * 0.75 + rand() * 0.25;
    spots.push([x, h - 1, z, TEMPLE ? 3.2 + rand() * 3.6 : 7.5 + rand() * 7, Math.min(5, Math.floor(mixGroup * 6))]);
  }
  createSeasonForest(scene, phone, rand, TRS, spots);
}
const cloudSea = TEMPLE ? cloudKit.createCloudSea(scene, { phone, rand }) : null;
const islands = TEMPLE ? islandKit.createIslands(scene, { phone, rand }) : null;
const quanAm = TEMPLE ? (await import('./temple/guanyin.js')).addGuanyin(scene, { x: 0, y: -60, z: 192, phone }) : null;
const petals = createPetals(scene, phone);
addSnow(M.slate, 'slate-snow');
addSnow(hedgeMat, 'hedge-snow');
addSnow(M.lawn, 'lawn-snow');
const gardenPick = roundTrees.flatMap(() => { const g = Math.floor(rand() * 6); return [g, g, g]; });
const crownTone = gardenPick.map(() => 0.85 + rand() * 0.3);
let seasonName = 'spring';
function setSeason(name) {
  seasonName = name;
  const s = applySeason(name);
  skyU.uSnowLine.value = s.snowLine;
  petals.uA.value.set(s.petals[0]);
  petals.uB.value.set(s.petals[1]);
  petals.uAmount.value = s.petalAmount;
  petals.uShape.value = s.shape;
  gardenPick.forEach((g, i) => {
    const row = s.groups[g];
    crownCol.set(row.cover > 0.5 ? row.bloom : row.leaf).multiplyScalar(crownTone[i]);
    if (row.bare === 1) crownCol.set(0x4a3d34);
    crown.setColorAt(i, crownCol);
  });
  crown.instanceColor.needsUpdate = true;
  document.querySelectorAll('[data-season]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.season === name)));
  const note = document.getElementById('seasonNote');
  if (note) note.textContent = [...new Set(s.groups.filter((g) => !g.name.includes('green') && !g.name.includes('Bare') && !g.name.includes('leaves') && g.name !== 'Evergreen').map((g) => g.name))].join(', ');
  dirty = true;
}
// 2D figures for scale: the visitors stay pixel art.
const figures = [];
for (const [x, z, row] of window.CHURCH_WALK ? [] : [[-5, 24, 'back'], [4.4, 42, 'left'], [10, 18, 'back'], [-12, 44, 'right'], [1, 12, 'back'], [2, 270, 'back'], [-2, 240, 'front']]) {
  const ch = createCharacter();
  ch.sprite.scale.multiplyScalar(0.86);
  ch.sprite.position.set(x, z > 200 ? -60 : 0.02, z);
  ch.set(row, 0);
  scene.add(ch.sprite);
  figures.push(ch);
}

// ---------- Times of day ----------
const TIMES = {
  sunrise: { sun: [168, 90, 380], dir: [0.4, 0.11, 0.91], color: 0xffc08a, power: 3.2, top: 0x35609e, low: 0xf5c8a6, fog: 0xe8c3ad, glow: 0xff9a5c, glowAmt: 0.85, cloud: 0.7, cloudCol: 0xf7bda2, cloudTint: 0xffd2b8, sunSize: 1, deep: 0x1c4a66, shallow: 0x2f8a8e, ridge: 0x46567a, haze: 0xe6b29c, snow: 0xffd8c8, glitter: 1.2, light: 0.8, exposure: 0.95, glass: 0.45, hemi: 0.42, night: 0.1, bulb: 0.25, flood: 0.05 },
  morning: { sun: [130, 180, 170], dir: [0.41, 0.57, 0.71], color: 0xfff0d8, power: 3.1, top: 0x2f6fbc, low: 0xdbe6ea, fog: 0xd5e3ea, glow: 0xffffff, glowAmt: 0.05, cloud: 0.42, cloudCol: 0xffffff, cloudTint: 0xffffff, sunSize: 0.75, deep: 0x125f75, shallow: 0x2db3ad, ridge: 0x5a7787, haze: 0xc4d7e2, snow: 0xffffff, glitter: 0.7, light: 1, exposure: 0.92, glass: 0.32, hemi: 0.45, night: 0, bulb: 0, flood: 0 },
  sunset: { sun: [-168, 86, 380], dir: [-0.4, 0.11, 0.91], color: 0xff9f5e, power: 3.4, top: 0x2b3f79, low: 0xf59a5e, fog: 0xdd9a78, glow: 0xff6a3a, glowAmt: 1, cloud: 0.85, cloudCol: 0xff8a5a, cloudTint: 0xffb18e, sunSize: 1, deep: 0x16324f, shallow: 0x2a6a7a, ridge: 0x2c3054, haze: 0xb9687e, snow: 0xffb8a0, glitter: 1.3, light: 0.62, exposure: 0.92, glass: 0.5, hemi: 0.36, night: 0.25, bulb: 0.5, flood: 0.1 },
  night: { sun: [90, 170, 300], dir: [0.26, 0.2, 0.94], color: 0x9db2e0, power: 0.55, top: 0x071024, low: 0x1b2a45, fog: 0x121d33, glow: 0x33476e, glowAmt: 0.3, cloud: 0.18, cloudCol: 0x4c5c7c, cloudTint: 0x5a6a88, sunSize: 0.8, deep: 0x07131f, shallow: 0x0c2a35, ridge: 0x0e1628, haze: 0x18243a, snow: 0x7f90b4, glitter: 0.55, light: 0.12, exposure: 1.2, glass: 1.5, hemi: 0.42, night: 1, bulb: 1, flood: 0.8 },
};
function setTime(name) {
  const t = TIMES[name];
  sun.position.set(...t.sun);
  sun.color.set(t.color);
  sun.intensity = t.power;
  hemi.intensity = t.hemi;
  skyU.uTop.value.set(t.top);
  skyU.uLow.value.set(t.low);
  skyU.uSunDir.value.set(...t.dir).normalize();
  skyU.uSunCol.value.set(t.color);
  skyU.uGlow.value.set(t.glow);
  skyU.uGlowAmt.value = t.glowAmt;
  skyU.uCloud.value = t.cloud;
  skyU.uCloudCol.value.set(t.cloudCol);
  skyU.uSunSize.value = t.sunSize;
  skyU.uDeep.value.set(t.deep);
  skyU.uShallow.value.set(t.shallow);
  skyU.uRidge.value.set(t.ridge);
  skyU.uHaze.value.set(t.haze);
  skyU.uSnow.value.set(t.snow);
  skyU.uGlitter.value = t.glitter;
  skyU.uLight.value = t.light;
  scene.fog.color.set(t.fog);
  renderer.toneMappingExposure = t.exposure;
  M.glass.emissiveIntensity = t.glass;
  M.glassRose.emissiveIntensity = t.glass;
  nightU.value = t.night;
  for (const cloud of cloudSprites) { cloud.material.opacity = 0.9 - t.night * 0.75; cloud.material.color.set(t.cloudTint); }
  for (const m of scenery.mist) m.material.color.set(t.cloudTint);
  cloudSea?.setTime(t.night);
  islands?.setTime(t.night);
  quanAm?.setTime(t.night);
  petals.uDim.value = t.night > 0.5 ? 0.35 : 1;
  bulbMat.opacity = t.bulb;
  haloMat.opacity = t.bulb * 0.9;
  poolMat.opacity = t.bulb * 0.6;
  M.lamp.emissiveIntensity = 0.25 + t.bulb * 3;
  flood.intensity = t.flood;
  marbleMat.emissiveIntensity = t.night * 0.12;
  paintMat.emissiveIntensity = 0;
  goldMat.emissiveIntensity = 0.3 + t.night * 0.7;
  refreshEnvironment();
  scene.traverse((o) => { if (o.material?.isMeshStandardMaterial) o.material.envMapIntensity = 0.4; });
  if (shadows) renderer.shadowMap.needsUpdate = true;
  document.querySelectorAll('[data-otime]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.otime === name)));
}

// ---------- Camera ----------
const VIEWS = {
  upper: { target: [-650, 170, -420], dist: 1000, yaw: 0.48, pitch: 0.26 },
  upperLip: { target: [-790, 55, 275], dist: 520, yaw: 0.95, pitch: 0.62, fixed: true },
  mountain: { target: [0, 170, -500], dist: 1000, yaw: 0.26, pitch: 0.03, fixed: true },
  blossom: { target: [40, 75, -300], dist: 300, yaw: 0.45, pitch: 0.12 },
  overview: { target: [0, -80, 700], dist: 1250, yaw: 3.4, pitch: 0.34 },
  islands: { target: [-500, 520, -5200], dist: 5100, yaw: 0.1, pitch: -0.095 },
  quanAm: { target: [0, -44, 192], dist: 52, yaw: 0.28, pitch: 0.02 },
  summit: { target: [0, -18, -30], dist: 430, yaw: 0.55, pitch: 0.2 },
  seaOfCloud: { target: [0, -60, 500], dist: 620, yaw: 0.05, pitch: 0.06 },
  wholeRange: { target: [0, -120, 120], dist: 1700, yaw: 2.6, pitch: 0.3 },
  ridge: { target: [0, -60, 280], dist: 360, yaw: 1.1, pitch: 0.16 },
  lake: { target: [0, -60, 1500], dist: 1450, yaw: 3.14, pitch: 0.05, fixed: true },
  shore: { target: [0, -110, 2000], dist: 1010, yaw: 3.14, pitch: 0.06, fixed: true },
  falls: { target: [-672, -35, 285], dist: 660, yaw: 1.59, pitch: -0.02, fixed: true },
  fallsNear: { target: [-672, -40, 285], dist: 300, yaw: 1.42, pitch: 0.02, fixed: true },
  river: { target: [260, -150, 300], dist: 265, yaw: -1.73, pitch: 0.407, fixed: true },
  gorge: { target: [0, -105, 273], dist: 152, yaw: 1.72, pitch: 0.066, fixed: true },
  site: { target: [0, -40, 170], dist: 600, yaw: 0.72, pitch: 0.52 },
  bridge: { target: [0, -40, 220], dist: 190, yaw: 0.95, pitch: 0.08 },
  angle: { target: [0, 56, -10], dist: 240, yaw: 0.62, pitch: 0.1 },
  front: { target: [0, 56, 0], dist: 225, yaw: 0, pitch: 0.03 },
  wall: { target: [-92, 7, 58], dist: 58, yaw: 0.5, pitch: 0.2 },
  garden: { target: [85, 2, -60], dist: 165, yaw: 2.2, pitch: 0.42 },
  statue: { target: [0, 6.5, 34], dist: 13, yaw: 0.45, pitch: 0.03 },
  angel: { target: [-58.6, 9.2, 58], dist: 8.5, yaw: 2.75, pitch: 0.04 },
  portal: { target: [0, 11, 0], dist: 42, yaw: 0.16, pitch: 0.04 },
  spire: { target: [29, 118, -7], dist: 92, yaw: -0.42, pitch: -0.05 },
};
const rig = { target: new THREE.Vector3(), dist: 200, yaw: 0, pitch: 0 };
// Walking: the character stays in the middle of the screen and the camera circles them.
const Walk = window.CHURCH_WALK;
const canWalk = Boolean(Walk);
const PLACE = TEMPLE ? 'temple' : 'outside';
const player = canWalk ? Walk.createPlayer(PLACE, 0, 9, 0) : null;
let walking = false;
const moves = window.CHURCH_MOVES || new Set();
const mine = canWalk ? createMe() : null;
const crowd = canWalk ? createPeople(scene, window.CHURCH_CAST.ROOM_CAST[TEMPLE ? 'temple' : 'outside']) : null;
let weatherMod = {};
let windowView = null;
let camNear = false;
const templeLife = TEMPLE ? life.createTempleLife(scene, {
  camera, shadows, phone, player, lookouts: LOOKOUTS,
  reducedMotion: params.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches,
  onChange(yaw) { if (yaw !== undefined) { rig.yaw = yaw; rig.pitch = 0.14; } dirty = true; },
  setSky(w) { weatherMod = w; applyWeatherLight(); dirty = true; },
  setWindow(v) { windowView = v; if (v) { rig.yaw = v.yaw; rig.pitch = 0.06; } else { rig.pitch = 0.14; } dirty = true; },
}) : null;
function applyWeatherLight() {
  const t = TIMES[timeNow];
  sun.intensity = t.power * (weatherMod.sunScale || 1);
  hemi.intensity = t.hemi * (weatherMod.hemiScale || 1);
  skyU.uTop.value.set(weatherMod.top ?? t.top);
  skyU.uLow.value.set(weatherMod.low ?? t.low);
}
let myShown = true;
let timeNow = 'sunset';
if (canWalk) {
  scene.add(mine.sprite);
  const applyLook = (sheet, shown) => { if (sheet) mine.setSheet(sheet); myShown = shown !== false; dirty = true; };
  queueMicrotask(() => applyLook(window.CHURCH_ME?.sheet, window.CHURCH_ME?.shown));
  window.addEventListener('my-look', (e) => applyLook(e.detail.sheet, e.detail.shown));
}
let camEase = 1;
let camLift = 0;
let camGuard = null;
const place = () => {
  if (windowView) {
    const [px, py, pz] = windowView.p;
    camera.position.set(px, py, pz);
    camera.lookAt(px - Math.sin(rig.yaw) * Math.cos(rig.pitch), py - Math.sin(rig.pitch), pz - Math.cos(rig.yaw) * Math.cos(rig.pitch));
    return;
  }
  if (walking) rig.target.set(player.x, player.y + 1.2, player.z);
  const c = Math.cos(rig.pitch);
  let wx = rig.target.x + Math.sin(rig.yaw) * c * rig.dist; let wz = rig.target.z + Math.cos(rig.yaw) * c * rig.dist;
  if (walking) {
    const k = Walk.cameraRoom(PLACE, player.x, player.z, player.y, wx, wz);
    wx = rig.target.x + (wx - rig.target.x) * k; wz = rig.target.z + (wz - rig.target.z) * k;
  }
  let wy = rig.target.y + Math.sin(rig.pitch) * rig.dist;
  if (walking) wy = Math.max(wy, Math.max(TEMPLE ? window.CHURCH_LAND(wx, wz) : landHeight(wx, wz), player.y - 3) + 1);
  if (walking && TEMPLE) { const fy = Walk.floorAt(PLACE, wx, wz, player.y); if (fy !== null && Math.abs(fy - player.y) < 6) wy = Math.max(wy, fy + 0.7); }
  if (walking && camGuard) {
    // The camera stops in front of anything solid. It closes in at once and eases back out.
    const k = camGuard.clip(rig.target.x, rig.target.y, rig.target.z, wx, wy, wz, phone ? 3 : 5);
    if (k < camEase || still) camEase = k; else if (camEase < k) { camEase = Math.min(k, camEase + 0.05); dirty = true; }
    wx = rig.target.x + (wx - rig.target.x) * camEase; wy = rig.target.y + (wy - rig.target.y) * camEase; wz = rig.target.z + (wz - rig.target.z) * camEase;
    camNear = Math.hypot(wx - rig.target.x, wy - rig.target.y, wz - rig.target.z) < 1.7;
  } else camNear = false;
  camera.position.set(wx, wy, wz);
  // On the long stairs the view lifts, so you see the way ahead and not just the next steps.
  const onStairs = TEMPLE && walking && Math.abs(player.x) < 6 && CLIMB.flights.some(([za, , zb]) => player.z < za && player.z > zb) && Math.cos(rig.yaw) > 0.3;
  const liftWanted = onStairs ? 1.7 : 0;
  camLift = still ? liftWanted : camLift + (liftWanted - camLift) * 0.08;
  if (Math.abs(liftWanted - camLift) > 0.02) dirty = true;
  camera.lookAt(rig.target.x, rig.target.y + camLift, rig.target.z);
};
let animals = null;
const makeAnimals = () => {
  animals = createAnimals(scene, { phone, still: params.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches, temple: TEMPLE, groundAt: (x, z, near) => Walk.floorAt(PLACE, x, z, near) ?? window.CHURCH_LAND(x, z) });
};
function walkTo(name) {
  const s = (TEMPLE ? Walk.TEMPLE_SPOTS : Walk.SPOTS)[name];
  templeLife?.leaveWindow();
  walking = true;
  templeLife?.standIfSeated();
  player.go(PLACE, s.at[0], s.at[1], Walk.floorAt(PLACE, s.at[0], s.at[1], s.at[2]) ?? s.at[2]);
  rig.yaw = s.yaw; rig.pitch = s.pitch ?? 0.14; rig.dist = 7.5;
  player.face = [-Math.sin(rig.yaw), -Math.cos(rig.yaw)];
  dirty = true;
}
function setView(name) {
  const v = VIEWS[name];
  templeLife?.leaveWindow();
  walking = false;
  viewMin = v.dist * 0.55;
  rig.target.set(...v.target);
  rig.dist = v.dist * (innerWidth < innerHeight && !v.fixed ? 1.55 : 1);
  rig.yaw = v.yaw;
  rig.pitch = v.pitch;
  document.querySelectorAll('[data-oview]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.oview === name)));
  dirty = true;
}
let dirty = true;
let viewMin = 5;
const minZoom = () => (walking ? 2.5 : viewMin);
let drag = null;
const pointers = new Map();
canvas.addEventListener('pointerdown', (e) => {
  pointers.set(e.pointerId, e);
  canvas.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, yaw: rig.yaw, pitch: rig.pitch, dist: rig.dist, pinch: null };
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  pointers.set(e.pointerId, e);
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (!drag.pinch) drag.pinch = d;
    if (!windowView) rig.dist = Math.max(minZoom(), Math.min(walking ? 90 : 6000, drag.dist * (drag.pinch / d)));
  } else {
    rig.yaw = drag.yaw - (e.clientX - drag.x) * 0.0045;
    rig.pitch = Math.max(walking ? -0.35 : -0.45, Math.min(1.1, drag.pitch + (e.clientY - drag.y) * 0.003));
    if (windowView) { rig.yaw = Math.max(windowView.yaw - 1.25, Math.min(windowView.yaw + 1.25, rig.yaw)); rig.pitch = Math.max(-0.5, Math.min(0.85, rig.pitch)); }
  }
  dirty = true;
});
const tapRay = new THREE.Raycaster();
const tapAt = new THREE.Vector2();
function tap(e) {
  if (windowView) return;
  const r = canvas.getBoundingClientRect();
  tapAt.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  tapRay.setFromCamera(tapAt, camera);
  const targets = [...crowd.sprites.filter((q) => q.visible), ...(animals?.sprites || []), ...(window.CHURCH_CHAT?.targets() || []), ...(mine.sprite.visible ? [mine.sprite] : [])];
  const hit = tapRay.intersectObjects(targets).find((h) => h.distance < 120);
  if (hit) {
    const u = hit.object.userData;
    if (u.me) window.dispatchEvent(new CustomEvent('me-tap'));
    else if (u.visitor) window.CHURCH_CHAT.tap(u.visitor);
    else if (u.person) window.CHURCH_NOTE?.(`${u.person.role}: ${u.person.doing}.`);
    else if (u.animal) window.CHURCH_NOTE?.(`${u.animal}.`);
    return;
  }
  const p = tapRay.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -player.y), new THREE.Vector3());
  if (p && templeLife?.tapFloor(p.x, p.z)) return;
  if (p) { templeLife?.standIfSeated(); player.walkTo(p.x, p.z); }
}
const end = (e) => {
  const isTap = canWalk && walking && drag && pointers.size === 1 && e.type === 'pointerup' && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8;
  pointers.delete(e.pointerId);
  if (isTap) tap(e);
  if (!pointers.size) drag = null;
};
canvas.addEventListener('pointerup', end);
canvas.addEventListener('pointercancel', end);
canvas.addEventListener('wheel', (e) => { e.preventDefault(); if (!windowView) rig.dist = Math.max(minZoom(), Math.min(walking ? 90 : 6000, rig.dist * (1 + e.deltaY * 0.001))); dirty = true; }, { passive: false });
document.querySelectorAll('[data-oview]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.oview)));
document.querySelectorAll('[data-season]').forEach((b) => b.addEventListener('click', () => setSeason(b.dataset.season)));
document.querySelectorAll('[data-otime]').forEach((b) => b.addEventListener('click', () => { setTime(b.dataset.otime); dirty = true; }));
function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  if (!r.width) return;
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
  dirty = true;
}
addEventListener('resize', resize);
// Water keeps moving at up to 30 frames a second. Without motion, it draws only on change.
const still = params.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastDraw = 0;
const tmpFwd = new THREE.Vector3();
let lastFrame = performance.now();
let doorShown = false;
function frame(now) {
  requestAnimationFrame(frame);
  if (window.CHURCH_PLACE && window.CHURCH_PLACE !== 'outside') { lastFrame = now; doorShown = false; return; }
  const dt = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  if (canWalk) {
    if (!walking && moves.size) { walking = true; rig.dist = 7.5; rig.pitch = 0.14; }
    if (templeLife?.seated && moves.size) templeLife.standIfSeated();
    if (windowView && moves.size) templeLife.leaveWindow();
    if (walking && !templeLife?.seated && player.step(dt, moves, rig.yaw, 8)) dirty = true;
    templeLife?.update(dt, now);
    mine.sprite.visible = walking && myShown && !windowView && !camNear;
    if (mine.sprite.visible) { place(); mine.setAt(player.x, player.y, player.z, player.face, player.walking, camera, now, templeLife?.seated || false); }
    crowd.update(dt, now, camera, !still);
    animals?.update(dt, now, camera, walking ? player : null);
    window.CHURCH_CHAT?.frame(scene, PLACE, camera, dt, now, player, Boolean(templeLife?.seated));
    const atDoor = !TEMPLE && walking && player.y > -2 && player.z < 9.5 && Math.abs(player.x) < 9;
    if (atDoor !== doorShown) { doorShown = atDoor; const b = document.getElementById('enterBtn'); if (b) b.hidden = !atDoor; }
  }
  if (!still && now - lastDraw >= 33) {
    skyU.uTime.value = now * 0.001;
    petals.uTime.value = now * 0.001;
    fountains.update(now * 0.001, renderer.domElement.height, camera);
    cloudSea?.update(now * 0.001);
    islands?.update(now * 0.001);
    dirty = true;
  }
  if (!dirty) return;
  dirty = false;
  lastDraw = now;
  place();
  camera.getWorldDirection(tmpFwd);
  petals.uCenter.value.copy(camera.position).addScaledVector(tmpFwd, 62);
  renderer.render(scene, camera);
  window.CHURCH_FACADE.triangles = renderer.info.render.triangles;
  window.CHURCH_FACADE.calls = renderer.info.render.calls;
}
const setTimeTracked = (n) => { timeNow = n; setTime(n); applyWeatherLight(); fountains.setTime(n); animals?.setTime(n); templeLife?.setPhase(n); if (crowd) crowd.setTime(n); dirty = true; };
window.CHURCH_FACADE = { scene, look(t, d, y, p) { walking = false; rig.target.set(...t); rig.dist = d; rig.yaw = y; rig.pitch = p; dirty = true; }, setView, setTime: setTimeTracked, walkTo, get guard() { return camGuard; }, cameraNow: () => camera.position.toArray(), resize, player, time: () => timeNow, redraw: () => { dirty = true; } };
if (canWalk) { document.querySelectorAll('[data-otime]').forEach((b) => b.addEventListener('click', () => { timeNow = b.dataset.otime; crowd.setTime(timeNow); fountains.setTime(timeNow); animals?.setTime(timeNow); applyWeatherLight(); templeLife?.setPhase(timeNow); dirty = true; })); document.getElementById('enterBtn')?.addEventListener('click', () => window.CHURCH_WORLD?.goInside()); document.querySelectorAll('[data-owalk]').forEach((b) => b.addEventListener('click', () => walkTo(b.dataset.owalk))); }
resize();
setSeason(SEASONS[params.get('season')] ? params.get('season') : seasonOnDate());
if (canWalk) makeAnimals();
setTimeTracked(TIMES[params.get('time')] ? params.get('time') : 'sunset');
fountains.update(12, renderer.domElement.height || 700, camera);
if (canWalk) {
  // Once the scene is complete, sort its solid shapes for the camera. Trees and water do not count.
  setTimeout(() => {
    window.CHURCH_GUARD.fromScene(scene, (o) => !o.userData.noGuard && !o.material?.userData?.noGuard && !o.material?.transparent && !o.material?.isShaderMaterial && !o.material?.isMeshBasicMaterial && (!o.isInstancedMesh || o.userData.guard))
      .then((g) => { camGuard = g; dirty = true; });
  }, 400);
}
if (canWalk) walkTo(TEMPLE ? 'greatGate' : 'doors'); else setView(params.get('view') || 'overview');
requestAnimationFrame(frame);
