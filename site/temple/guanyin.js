// A standing white statue of Quan Âm Bồ Tát on a lotus and a carved round base.
// Built from code, so nothing here copies a photograph. The statue faces south (+z), towards arriving visitors.
import * as THREE from '../vendor/three.module.min.js';

const WHITE = 0xe9e6dc;
const SHADE = 0xd9d5c8;
const TEAL = 0xa9d3cf;
const DARK = 0x2d2a28;

class Merge {
  constructor() { this.pos = []; this.nor = []; this.col = []; this.c = new THREE.Color(); }
  add(geo, matrix, hex = WHITE) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (!g.attributes.normal) g.computeVertexNormals();
    if (matrix) g.applyMatrix4(matrix);
    const p = g.attributes.position.array; const n = g.attributes.normal.array;
    this.c.set(hex);
    for (let i = 0; i < p.length; i++) { this.pos.push(p[i]); this.nor.push(n[i]); }
    for (let i = 0; i < p.length / 3; i++) this.col.push(this.c.r, this.c.g, this.c.b);
    g.dispose();
  }
  build(material) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    return new THREE.Mesh(g, material);
  }
}
const M = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));

// A surface through a stack of oval rings. a0 to a1 is the part of the circle it covers; 0 is the front.
function loft(rings, seg, fold, a0 = 0, a1 = Math.PI * 2) {
  const closed = Math.abs(a1 - a0 - Math.PI * 2) < 1e-4;
  const steps = 8;
  const pts = [];
  for (let i = 0; i < rings.length - 1; i++) for (let s = 0; s < steps; s++) {
    const t = s / steps; const k = t * t * (3 - 2 * t);
    const A = rings[i]; const B = rings[i + 1];
    pts.push(A.map((v, n) => v + (B[n] - v) * k));
  }
  pts.push(rings[rings.length - 1]);
  const pos = []; const idx = [];
  const row = closed ? seg : seg + 1;
  pts.forEach(([y, rx, rz, cz = 0], i) => {
    for (let j = 0; j < row; j++) {
      const a = a0 + ((a1 - a0) * j) / seg;
      const f = 1 + fold(a, y);
      pos.push(Math.sin(a) * rx * f, y, cz + Math.cos(a) * rz * f);
    }
    if (i === pts.length - 1) return;
    for (let j = 0; j < seg; j++) {
      const p = i * row + j; const q = i * row + (closed ? (j + 1) % seg : j + 1);
      idx.push(p, p + row, q, q, p + row, q + row);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function limb(points, radius, seg = 14, radial = 10) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), seg, radius, radial);
}
function petalShape() {
  const g = new THREE.SphereGeometry(1, 14, 12);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const w = Math.pow(Math.max(0, 1 - Math.pow((y + 1) / 2, 2.4)), 0.7);
    p.setXYZ(i, p.getX(i) * w, y, p.getZ(i) * (0.3 + 0.7 * w));
  }
  g.computeVertexNormals();
  return g;
}
function scrollBand() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#d9ece8'; g.fillRect(0, 0, 512, 128);
  const swirl = (ox, oy, r, flip, col, w) => {
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath();
    for (let a = 0; a < 11; a += 0.2) { const q = r * (a / 11); const x = ox + Math.cos(a * flip) * q; const y = oy + Math.sin(a * flip) * q; if (a) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke();
  };
  for (let i = 0; i < 4; i++) {
    const x = 64 + i * 128; const f = i % 2 ? -1 : 1;
    for (const [col, w, d] of [['#7fb9b3', 12, 2], ['#fbfaf5', 8, 0]]) { swirl(x + d, 66 + d, 46, f, col, w); swirl(x + 56 + d, 34 + d, 22, -f, col, w * 0.7); swirl(x - 52 + d, 98 + d, 20, -f, col, w * 0.7); }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.repeat.set(5, 1); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function addGuanyin(scene, { x, y, z, phone }) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const m = new Merge();
  const SEG = phone ? 56 : 112;
  // ---------- The round base with arched doorways ----------
  m.add(new THREE.CylinderGeometry(8.1, 8.1, 3.1, 48), M(0, 1.55, 0), TEAL);
  m.add(new THREE.CylinderGeometry(8.7, 8.6, 0.4, 48), M(0, 3.25, 0));
  m.add(new THREE.CylinderGeometry(8.5, 8.5, 0.28, 48), M(0, 0.14, 0));
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.72; const r = 8.12;
    if (i % 2 === 0) {
      // Arched doorway with a white surround.
      const arch = (w, h) => { const s = new THREE.Shape(); s.moveTo(-w, 0); s.lineTo(-w, h - w); s.absarc(0, h - w, w, Math.PI, 0, true); s.lineTo(w, 0); s.closePath(); return new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: false, curveSegments: 12 }); };
      m.add(arch(1.05, 2.8), M(Math.sin(a) * r, 0.25, Math.cos(a) * r, 0, a), WHITE);
      m.add(arch(0.72, 2.45), M(Math.sin(a) * (r + 0.06), 0.25, Math.cos(a) * (r + 0.06), 0, a), DARK);
    } else {
      // A carved panel between the doors.
      m.add(new THREE.BoxGeometry(1.5, 2, 0.1), M(Math.sin(a) * r, 1.6, Math.cos(a) * r, 0, a), SHADE);
      m.add(new THREE.BoxGeometry(1.1, 1.55, 0.1), M(Math.sin(a) * (r + 0.05), 1.6, Math.cos(a) * (r + 0.05), 0, a), 0xd4d0c4);
    }
  }
  // ---------- The lotus ----------
  const petal = petalShape();
  m.add(new THREE.CylinderGeometry(6.2, 6.5, 0.5, 40), M(0, 5.95, 0));
  for (const [n, r, py, tilt, s, skew] of [[20, 6.4, 6.85, 1.05, 1.5, 0], [16, 5.2, 7.55, 0.62, 1.55, 0.2], [12, 4, 8.15, 0.3, 1.35, 0.1]]) {
    for (let i = 0; i < n; i++) {
      const a = ((i + skew * 5) / n) * Math.PI * 2;
      m.add(petal, M(Math.sin(a) * r, py, Math.cos(a) * r, tilt, a, 0, s * 0.9, s, s * 0.34), i % 2 ? WHITE : 0xf7f5ef);
    }
  }
  m.add(new THREE.CylinderGeometry(4.4, 4.6, 0.7, 40), M(0, 8.5, 0));
  const beads = new THREE.TorusGeometry(4.45, 0.13, 8, 64);
  m.add(beads, M(0, 8.85, 0, Math.PI / 2), SHADE);
  // ---------- The figure: unit height, scaled up, standing on the lotus ----------
  const S = 21; const body = new THREE.Matrix4().makeTranslation(0, 8.9, 0).multiply(new THREE.Matrix4().makeScale(S, S, S));
  const put = (g, mat, hex) => m.add(g, mat ? new THREE.Matrix4().multiplyMatrices(body, mat) : body, hex);
  const pleats = (a, py) => {
    const low = Math.max(0, 1 - py / 0.62);
    const front = Math.max(0, Math.cos(a));
    return (Math.sin(a * 20) * 0.034 + Math.sin(a * 41 + py * 8) * 0.012) * (0.3 + low) + front * Math.sin(a * 58) * 0.02 * low;
  };
  // The inner robe, falling straight to a wide hem.
  put(loft([[0, 0.185, 0.17], [0.05, 0.165, 0.145], [0.24, 0.125, 0.105], [0.44, 0.112, 0.09], [0.58, 0.098, 0.078], [0.7, 0.112, 0.086], [0.79, 0.112, 0.074], [0.825, 0.06, 0.05], [0.86, 0.031, 0.031]], SEG, pleats));
  // The long cloak, open down the front.
  const cloakFold = (a, py) => {
    const low = Math.max(0, 1 - py / 0.72);
    return (Math.sin(a * 9 + py * 4) * 0.08 + Math.sin(a * 19 - py * 7) * 0.05 + Math.sin(a * 37 + py * 3) * 0.018) * (0.28 + low * 1.1);
  };
  put(loft([[0.01, 0.235, 0.215, -0.012], [0.09, 0.215, 0.185, -0.012], [0.28, 0.175, 0.14, -0.012], [0.48, 0.165, 0.125, -0.012], [0.63, 0.155, 0.112, -0.012], [0.74, 0.14, 0.103, -0.012], [0.8, 0.128, 0.09, -0.01], [0.838, 0.06, 0.058, -0.004]], SEG, cloakFold, 0.52, Math.PI * 2 - 0.52), null, SHADE);
  put(loft([[0.012, 0.228, 0.208, -0.012], [0.09, 0.208, 0.178, -0.012], [0.28, 0.168, 0.133, -0.012], [0.48, 0.158, 0.118, -0.012], [0.63, 0.148, 0.105, -0.012], [0.74, 0.133, 0.097, -0.012], [0.8, 0.12, 0.084, -0.01]], SEG, cloakFold, 0.52, Math.PI * 2 - 0.52).scale(1, 1, 1));
  // Inner side of the cloak faces backwards, so give it a second, reversed copy.
  { const g = loft([[0.012, 0.226, 0.206, -0.012], [0.28, 0.166, 0.131, -0.012], [0.63, 0.146, 0.103, -0.012], [0.8, 0.118, 0.082, -0.01]], SEG, cloakFold, Math.PI * 2 - 0.52, 0.52); put(g, null, 0xd8d4c8); }
  // Sash and hanging ties.
  put(new THREE.TorusGeometry(0.094, 0.005, 8, 40), M(0, 0.585, -0.002, Math.PI / 2, 0, 0, 1, 0.82, 1), SHADE);
  for (const dx of [-0.018, 0.018]) put(new THREE.BoxGeometry(0.018, 0.34, 0.005), M(dx, 0.41, 0.093, -0.06));
  for (let i = 0; i < 9; i++) { const a = (i - 4) * 0.22; put(new THREE.SphereGeometry(0.0048, 6, 5), M(Math.sin(a) * 0.042, 0.76 + (1 - Math.cos(a)) * 0.05, 0.066 + Math.cos(a) * 0.012)); }
  // Her right arm raises a hand in blessing, on the viewer's left.
  put(limb([[-0.118, 0.785, 0], [-0.155, 0.69, 0.025], [-0.14, 0.625, 0.07], [-0.095, 0.68, 0.135], [-0.078, 0.725, 0.16]], 0.024));
  put(loft([[0.4, 0.015, 0.03], [0.5, 0.04, 0.05], [0.62, 0.052, 0.07], [0.7, 0.04, 0.055]], 28, (a, py) => Math.sin(a * 9 + py * 12) * 0.08), M(-0.158, 0, 0.055));
  put(new THREE.SphereGeometry(0.021, 12, 10), M(-0.075, 0.745, 0.165, 0, 0, 0, 0.85, 1.2, 0.5));
  for (let i = 0; i < 4; i++) put(new THREE.CapsuleGeometry(0.0042, 0.026, 3, 6), M(-0.09 + i * 0.0092, 0.775 - Math.abs(i - 1.5) * 0.003, 0.167));
  put(new THREE.CapsuleGeometry(0.0048, 0.018, 3, 6), M(-0.058, 0.742, 0.17, 0, 0, -0.9));
  // Her left arm holds the small vase, on the viewer's right.
  put(limb([[0.118, 0.785, 0], [0.155, 0.69, 0.025], [0.14, 0.615, 0.065], [0.09, 0.625, 0.125], [0.05, 0.635, 0.155]], 0.024));
  put(loft([[0.38, 0.015, 0.03], [0.48, 0.04, 0.05], [0.6, 0.052, 0.07], [0.68, 0.04, 0.055]], 28, (a, py) => Math.sin(a * 9 + py * 12) * 0.08), M(0.158, 0, 0.055));
  put(new THREE.SphereGeometry(0.023, 12, 10), M(0.035, 0.636, 0.165, 0, 0, 0, 1.15, 0.45, 1));
  put(new THREE.LatheGeometry([[0.001, 0], [0.012, 0.004], [0.022, 0.022], [0.019, 0.042], [0.008, 0.056], [0.0065, 0.074], [0.012, 0.082], [0.001, 0.084]].map(([r, h]) => new THREE.Vector2(r, h)), 16), M(0.033, 0.643, 0.166));
  // ---------- The head ----------
  const hy = 0.905;
  put(new THREE.SphereGeometry(1, 28, 22), M(0, hy, 0.006, 0, 0, 0, 0.041, 0.054, 0.047));
  put(new THREE.SphereGeometry(1, 10, 8), M(0, hy - 0.006, 0.05, 0.15, 0, 0, 0.0065, 0.014, 0.008));
  for (const s of [-1, 1]) {
    put(new THREE.SphereGeometry(1, 10, 6), M(s * 0.0165, hy + 0.009, 0.0465, 0, s * 0.3, 0, 0.0075, 0.0018, 0.002), 0x4c4640);
    put(new THREE.SphereGeometry(1, 10, 6), M(s * 0.0165, hy + 0.0155, 0.0465, 0, s * 0.3, s * -0.08, 0.0105, 0.0014, 0.002), 0x8b8378);
    put(new THREE.CapsuleGeometry(0.0042, 0.015, 3, 6), M(s * 0.0425, hy - 0.006, 0.006, 0, 0, s * 0.05), SHADE);
  }
  put(new THREE.SphereGeometry(1, 10, 6), M(0, hy - 0.0255, 0.0465, 0, 0, 0, 0.0085, 0.0024, 0.003), 0xc99d90);
  put(new THREE.SphereGeometry(0.0022, 6, 5), M(0, hy + 0.024, 0.0475), 0xc99d90);
  // Hair and the veil falling behind the shoulders.
  put(loft([[0.8, 0.09, 0.075, -0.012], [0.84, 0.072, 0.066, -0.012], [0.88, 0.058, 0.058, -0.008], [0.93, 0.052, 0.055, -0.006], [0.965, 0.04, 0.044, -0.006], [0.985, 0.024, 0.028, -0.006]], 44, (a, py) => Math.sin(a * 13 + py * 8) * 0.025, 0.95, Math.PI * 2 - 0.95));
  put(loft([[0.8, 0.088, 0.073, -0.012], [0.88, 0.056, 0.056, -0.008], [0.965, 0.038, 0.042, -0.006]], 44, () => 0, Math.PI * 2 - 0.95, 0.95), null, SHADE);
  // The high crown.
  put(new THREE.LatheGeometry([[0.033, 0], [0.032, 0.012], [0.024, 0.03], [0.017, 0.06], [0.01, 0.078], [0.001, 0.084]].map(([r, h]) => new THREE.Vector2(r, h)), 20), M(0, 0.945, 0));
  put(new THREE.TorusGeometry(0.041, 0.0036, 8, 28), M(0, 0.95, 0.008, Math.PI / 2 - 0.1), SHADE);
  put(new THREE.SphereGeometry(1, 12, 10), M(0, 0.978, 0.03, 0, 0, 0, 0.0085, 0.013, 0.004), SHADE);
  put(new THREE.SphereGeometry(0.0045, 8, 6), M(0, 0.988, 0.032));
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, emissive: 0xffffff, emissiveIntensity: 0 });
  const mesh = m.build(material);
  mesh.castShadow = mesh.receiveShadow = true;
  group.add(mesh);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.4, 2.3, 48, 1, true), new THREE.MeshStandardMaterial({ map: scrollBand(), roughness: 0.7 }));
  band.position.y = 4.6;
  group.add(band);
  scene.add(group);
  return { setTime(night) { material.emissiveIntensity = night * 0.3; band.material.emissive?.setScalar?.(night * 0.08); } };
}
