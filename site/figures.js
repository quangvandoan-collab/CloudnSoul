// Statues built in code: marble body, painted mantle and gilded details.
import * as THREE from './vendor/three.module.min.js';

const TRS = (x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
function mergePlain(list) {
  let count = 0;
  const flat = list.map((g) => { const f = g.index ? g.toNonIndexed() : g; f.computeVertexNormals(); count += f.attributes.position.count; return f; });
  const pos = new Float32Array(count * 3); const nor = new Float32Array(count * 3);
  let o = 0;
  for (const g of flat) { pos.set(g.attributes.position.array, o); nor.set(g.attributes.normal.array, o); o += g.attributes.position.array.length; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return out;
}
const placed = (g, m) => { const c = g.clone(); c.applyMatrix4(m); return c; };
function foldedRobe(profile, folds, depth, phi = Math.PI * 2, start = 0, segs = 28) {
  const lathe = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segs, start, phi);
  const p = lathe.attributes.position;
  const top = profile[profile.length - 1][1];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
    const a = Math.atan2(z, x);
    const k = 1 + Math.sin(a * folds + y * 1.3) * depth * (1 - y / (top * 1.05));
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  return lathe;
}
export function makeFigure(kind, low = false) {
  const marble = []; const paint = []; const gold = [];
  const seg = low ? 16 : 28;
  const Sph = (r) => new THREE.SphereGeometry(r, low ? 8 : 16, low ? 6 : 12);
  const robe = foldedRobe([[0.01, 0], [0.42, 0], [0.4, 0.2], [0.33, 0.7], [0.27, 1.05], [0.25, 1.32], [0.27, 1.48], [0.2, 1.62], [0.07, 1.68]], 11, 0.09, Math.PI * 2, 0, seg);
  const mantle = foldedRobe([[0.47, 0.34], [0.42, 0.72], [0.35, 1.08], [0.32, 1.4], [0.25, 1.62], [0.14, 1.72]], 9, 0.08, Math.PI * 1.36, Math.PI * 0.32, Math.round(seg * 0.7));
  marble.push(robe);
  paint.push(mantle);
  marble.push(placed(Sph(0.13), TRS(0, 1.86, 0.03, 0, 0, 0, 0.92, 1.1, 1)));
  marble.push(placed(new THREE.CylinderGeometry(0.06, 0.075, 0.14, 10), TRS(0, 1.72, 0)));
  // Hair falling behind the head, or a veil.
  (kind === 'mary' ? paint : marble).push(placed(Sph(0.15), TRS(0, 1.87, -0.065, 0, 0, 0, 1.06, 1.14, 1)));
  (kind === 'mary' ? paint : marble).push(placed(new THREE.CylinderGeometry(0.13, 0.19, 0.42, low ? 7 : 14), TRS(0, 1.62, -0.1, 0, 0.18)));
  gold.push(placed(new THREE.TorusGeometry(0.255, 0.018, low ? 4 : 8, low ? 18 : 34), TRS(0, 1.94, -0.14)));
  gold.push(placed(new THREE.TorusGeometry(0.24, 0.02, 4, low ? 14 : 28), TRS(0, 1.46, 0.02, 0, Math.PI / 2, 0, 1.05, 0.88, 1)));
  gold.push(placed(new THREE.TorusGeometry(0.42, 0.018, 4, low ? 16 : 36), TRS(0, 0.07, 0, 0, Math.PI / 2)));
  // Arms and hands joined in prayer, or holding a gold object.
  for (const side of [-1, 1]) {
    marble.push(placed(Sph(0.1), TRS(side * 0.25, 1.56, 0, 0, 0, 0, 1, 0.9, 0.95)));
    marble.push(placed(new THREE.CapsuleGeometry(0.075, 0.3, low ? 2 : 4, low ? 6 : 10), TRS(side * 0.27, 1.34, 0.08, 0, -0.35, side * -0.1)));
    marble.push(placed(new THREE.CapsuleGeometry(0.065, 0.24, low ? 2 : 4, low ? 6 : 10), TRS(side * 0.13, 1.25, 0.24, 0, -1.25, side * 0.7)));
    marble.push(placed(new THREE.SphereGeometry(0.055, 6, 5), TRS(side * 0.025, 1.34, 0.37, 0, 0, 0, 0.55, 1.5, 0.75)));
  }
  if (kind === 'sword') {
    gold.push(placed(new THREE.BoxGeometry(0.045, 1.5, 0.018), TRS(0, 1.95, 0.42)));
    gold.push(placed(new THREE.BoxGeometry(0.27, 0.045, 0.045), TRS(0, 1.2, 0.42)));
  } else if (kind === 'trumpet') {
    gold.push(placed(new THREE.CylinderGeometry(0.1, 0.012, 0.75, 14), TRS(0.02, 1.88, 0.42, 0, Math.PI / 2 - 0.42)));
  } else if (kind === 'saint') {
    gold.push(placed(new THREE.BoxGeometry(0.035, 1.05, 0.035), TRS(0.05, 1.4, 0.42)));
    gold.push(placed(new THREE.BoxGeometry(0.28, 0.035, 0.035), TRS(0.05, 1.68, 0.42)));
  } else if (kind === 'mary') {
    for (let i = 0; i < 7; i++) gold.push(placed(new THREE.ConeGeometry(0.03, 0.1, 5), TRS(Math.cos((i / 7) * 6.283) * 0.14, 2.05, 0.02 + Math.sin((i / 7) * 6.283) * 0.14)));
    gold.push(placed(new THREE.TorusGeometry(0.14, 0.018, 6, 22), TRS(0, 2, 0.02, 0, Math.PI / 2)));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; gold.push(placed(new THREE.OctahedronGeometry(0.035), TRS(Math.cos(a) * 0.29, 1.9 + Math.sin(a) * 0.29, -0.13))); }
  }
  // Wings: layered feathers with gilded tips.
  if (['sword', 'trumpet', 'angel'].includes(kind)) {
    for (const side of [-1, 1]) {
      const featherCount = low ? 7 : 11;
      for (let f = 0; f < featherCount; f++) {
        const t = f / (featherCount - 1);
        const len = 0.42 + t * 0.85;
        const feather = new THREE.Shape();
        feather.moveTo(0, 0);
        feather.quadraticCurveTo(0.17, len * 0.55, 0, len);
        feather.quadraticCurveTo(-0.17, len * 0.55, 0, 0);
        const geo = new THREE.ExtrudeGeometry(feather, { depth: 0.025, bevelEnabled: false, curveSegments: low ? 2 : 4 });
        const m = TRS(side * 0.16, 1.5, -0.17 - t * 0.05, 0, 0.1, side * -(2.05 - t * 1.6));
        (f >= featherCount - 2 ? gold : marble).push(placed(geo, m));
      }
    }
  }
  return { marble: mergePlain(marble), paint: mergePlain(paint), gold: mergePlain(gold) };
}
