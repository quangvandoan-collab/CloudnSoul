// A seated Buddha built from code: full lotus, meditation gesture, raised
// ushnisha, tightly curled dark hair, long earlobes, three neck lines, gilded
// over red lacquer, on a lotus base. Conventions follow Vietnamese statue
// descriptions; see the manual. To replace it with a commissioned 3D model,
// keep the same origin (centre of the plinth's underside, facing +z).
import * as THREE from '../vendor/three.module.min.js';
import { trs } from './baker.js';

const sphere = new THREE.SphereGeometry(1, 16, 10);
const smallSphere = new THREE.SphereGeometry(1, 5, 3);

function tube(points, radius, segments = 16, radial = 8) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, segments, radius, radial, false);
}

function petalGeometry() {
  // A pointed lotus petal: a flattened sphere pinched towards its tip.
  const g = new THREE.SphereGeometry(1, 12, 8);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const taper = 1 - Math.pow(Math.max(0, y), 1.6) * 0.92;
    p.setX(i, p.getX(i) * taper);
    p.setZ(i, p.getZ(i) * 0.26 * taper + Math.max(0, y) * Math.max(0, y) * 0.28);
  }
  g.computeVertexNormals();
  return g;
}
const petal = petalGeometry();

export function addBuddha(baker, mats, x, y, z, scale, yaw = 0) {
  const base = trs(x, y, z, 0, yaw, 0, scale);
  let put = (geometry, material, m, color) =>
    baker.add(geometry, material, new THREE.Matrix4().multiplyMatrices(base, m), color);

  const gold = mats.gold;
  const darkGold = 0xb88d3c;
  const skin = 0xe6bd6a;

  // Plinth: red lacquer with stepped gilded mouldings.
  put(new THREE.CylinderGeometry(0.98, 1.08, 0.2, 8), mats.paint, trs(0, 0.1, 0), 0x7a2118);
  put(new THREE.CylinderGeometry(0.85, 0.98, 0.05, 8), gold, trs(0, 0.225, 0), darkGold);
  put(new THREE.CylinderGeometry(0.68, 0.76, 0.2, 8), mats.paint, trs(0, 0.35, 0), 0x7a2118);
  put(new THREE.CylinderGeometry(0.82, 0.7, 0.05, 8), gold, trs(0, 0.475, 0), darkGold);

  // Lotus: a lower ring turned down, two upper rings opening upward.
  const ring = (count, radius, height, tilt, size, color, offset = 0) => {
    for (let i = 0; i < count; i++) {
      const a = ((i + offset) / count) * Math.PI * 2;
      const m = new THREE.Matrix4()
        .makeRotationY(a)
        .multiply(trs(0, height, radius, tilt, 0, 0, size * 0.8, size, size));
      put(petal, gold, m, color);
    }
  };
  ring(20, 0.74, 0.58, 2.3, 0.16, 0xd7ab55);
  ring(20, 0.68, 0.72, 0.48, 0.2, 0xe2bb68);
  ring(18, 0.52, 0.78, 0.3, 0.22, 0xecca7a, 0.5);
  put(new THREE.CylinderGeometry(0.62, 0.66, 0.1, 24), gold, trs(0, 0.82, 0), 0xd4a650);

  const seat = 0.86; // Figure sits on top of the lotus.
  const F = (cx, cy, cz, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) => trs(cx, seat + cy, cz, rx, ry, rz, sx, sy, sz);

  // Crossed legs under draped robe.
  put(sphere, gold, F(0, 0.13, 0.08, 0, 0, 0, 0.66, 0.17, 0.42), 0xd2a14a);
  put(tube([[-0.58, 0.13, 0.2], [-0.25, 0.1, 0.4], [0.2, 0.12, 0.44], [0.5, 0.17, 0.27]], 0.115), gold, F(0, 0, 0), 0xd6a64f);
  put(tube([[0.58, 0.14, 0.2], [0.25, 0.18, 0.37], [-0.2, 0.21, 0.42], [-0.48, 0.24, 0.27]], 0.105), gold, F(0, 0, 0), 0xdaad58);
  put(sphere, gold, F(-0.59, 0.15, 0.2, 0, 0, 0, 0.15, 0.13, 0.17), 0xd8a950);
  put(sphere, gold, F(0.59, 0.15, 0.2, 0, 0, 0, 0.15, 0.13, 0.17), 0xd8a950);

  // Torso: slim and long-necked, after Lý period proportions.
  const torso = new THREE.LatheGeometry(
    [[0.01, 0.14], [0.36, 0.16], [0.34, 0.34], [0.33, 0.52], [0.355, 0.72], [0.36, 0.86], [0.29, 0.98], [0.13, 1.05], [0.01, 1.07]].map(
      ([r, h]) => new THREE.Vector2(r, h)
    ),
    28
  );
  put(torso, gold, trs(0, seat, 0, 0, 0, 0, 1, 1, 0.68), 0xd8a94f);

  // Robe folds: raised cords across chest and over the left shoulder.
  [
    [[-0.3, 0.96, 0.15], [-0.11, 0.78, 0.25], [0.08, 0.58, 0.25], [0.3, 0.42, 0.14]],
    [[-0.34, 0.86, 0.16], [-0.16, 0.66, 0.26], [0.03, 0.46, 0.27], [0.27, 0.32, 0.16]],
    [[-0.34, 0.72, 0.17], [-0.2, 0.54, 0.26], [-0.02, 0.36, 0.28], [0.2, 0.25, 0.2]],
    [[0.25, 0.97, 0.13], [0.12, 0.84, 0.22], [0.02, 0.76, 0.25], [-0.02, 0.68, 0.26]],
  ].forEach((pts) => put(tube(pts, 0.012, 14, 5), gold, F(0, 0, 0), darkGold));

  // Arms in loose sleeves, resting to the lap.
  for (const side of [-1, 1]) {
    put(
      tube([[side * 0.33, 0.92, 0], [side * 0.45, 0.67, 0.05], [side * 0.42, 0.44, 0.2], [side * 0.18, 0.36, 0.34]], 0.085, 20, 10),
      gold,
      F(0, 0, 0),
      0xd5a44c
    );
    put(sphere, gold, F(side * 0.32, 0.93, 0, 0, 0, 0, 0.1, 0.095, 0.11), 0xd8a94f);
    // Sleeve edge folds.
    put(tube([[side * 0.5, 0.56, 0.12], [side * 0.47, 0.42, 0.25], [side * 0.33, 0.34, 0.33]], 0.012, 10, 5), gold, F(0, 0, 0), darkGold);
  }

  // Meditation gesture: one palm over the other, thumbs just touching.
  put(sphere, gold, F(0, 0.335, 0.37, 0.12, 0, 0, 0.2, 0.05, 0.1), skin);
  put(sphere, gold, F(0, 0.375, 0.38, 0.12, 0, 0, 0.19, 0.045, 0.095), 0xeac471);
  put(tube([[-0.12, 0.39, 0.37], [-0.02, 0.45, 0.37]], 0.018, 5, 5), gold, F(0, 0, 0), skin);
  put(tube([[0.12, 0.39, 0.37], [0.02, 0.45, 0.37]], 0.018, 5, 5), gold, F(0, 0, 0), skin);

  // Everything from here up is enlarged about the neck, for a full, round head
  // in the proportion of about four heads to a seated figure.
  const pivot = seat + 1.06;
  const headM = new THREE.Matrix4().makeTranslation(0, pivot, 0)
    .multiply(new THREE.Matrix4().makeScale(1.3, 1.3, 1.3))
    .multiply(new THREE.Matrix4().makeTranslation(0, -pivot, 0));
  const putBody = put;
  put = (geometry, material, m, color) => putBody(geometry, material, new THREE.Matrix4().multiplyMatrices(headM, m), color);

  // Neck with the three auspicious lines.
  put(new THREE.CylinderGeometry(0.1, 0.13, 0.2, 16), gold, F(0, 1.1, 0), skin);
  [1.05, 1.09, 1.13].forEach((h) => put(new THREE.TorusGeometry(0.112, 0.006, 5, 22), gold, F(0, h, 0.002, Math.PI / 2), darkGold));

  // Head: full, round, and gently oval.
  const headY = 1.39;
  put(sphere, gold, F(0, headY, 0, 0, 0, 0, 0.21, 0.255, 0.225), skin);
  put(sphere, gold, F(0, headY - 0.12, 0.05, 0, 0, 0, 0.165, 0.135, 0.165), skin); // Full cheeks and chin.

  // Features are soft and raised, with eyes lowered in meditation.
  const fy = headY;
  const fz = 0.208;
  const shade = 0x8a5f22;
  for (const side of [-1, 1]) {
    // Long arched brow flowing into the nose line.
    put(tube([[side * 0.015, fy + 0.035, fz + 0.007], [side * 0.07, fy + 0.058, fz - 0.003], [side * 0.135, fy + 0.038, fz - 0.05]], 0.0065, 10, 5), gold, F(0, 0, 0), 0xa87a30);
    // Lowered eyelid: a lotus-petal shaped curve.
    put(tube([[side * 0.03, fy + 0.002, fz + 0.002], [side * 0.075, fy - 0.012, fz + 0.002], [side * 0.125, fy + 0.006, fz - 0.043]], 0.005, 10, 5), gold, F(0, 0, 0), shade);
    put(sphere, gold, F(side * 0.077, fy + 0.008, fz - 0.012, 0, side * 0.26, 0, 0.05, 0.018, 0.018), 0xedc97a);
    // Long earlobes.
    put(sphere, gold, F(side * 0.222, fy + 0.0, -0.01, 0, 0, side * 0.08, 0.026, 0.07, 0.05), skin);
    put(sphere, gold, F(side * 0.228, fy - 0.1, 0, 0, 0, side * 0.06, 0.021, 0.07, 0.03), skin);
  }
  put(sphere, gold, F(0, fy - 0.045, fz + 0.012, 0, 0, 0, 0.025, 0.055, 0.03), 0xeac471); // Nose.
  put(sphere, gold, F(0, fy - 0.1, fz - 0.018, 0, 0, 0, 0.036, 0.009, 0.017), shade); // Mouth line.
  put(sphere, gold, F(0, fy - 0.114, fz - 0.018, 0, 0, 0, 0.03, 0.012, 0.016), 0xe2b562); // Lower lip.
  put(smallSphere, gold, F(0, fy + 0.078, fz - 0.002, 0, 0, 0, 0.01), 0xf5dc9b); // Urna.

  // Hair: rows of tight curls, with an ushnisha and a small jewel above.
  const hairColor = 0x232326;
  put(sphere, mats.paint, F(0, headY + 0.055, -0.012, 0, 0, 0, 0.207, 0.207, 0.214), hairColor);
  put(sphere, mats.paint, F(0, headY + 0.25, -0.01, 0, 0, 0, 0.098, 0.085, 0.1), hairColor);
  const curl = (cx, cy, cz, r) => put(smallSphere, mats.paint, F(cx, cy, cz, 0, 0, 0, r), 0x2f2f33);
  for (let lat = 0; lat < 7; lat++) {
    const phi = 0.2 + lat * 0.2;
    const count = 9 + lat * 4;
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      const nx = Math.sin(phi) * Math.sin(theta);
      const nz = Math.sin(phi) * Math.cos(theta);
      const ny = Math.cos(phi);
      // Leave the forehead clear with a soft hairline.
      if (nz > 0.2 && ny < 0.56) continue;
      curl(nx * 0.218, headY + 0.055 + ny * 0.215, -0.012 + nz * 0.225, 0.015);
    }
  }
  for (let lat = 0; lat < 3; lat++) {
    const phi = 0.2 + lat * 0.4;
    const count = 5 + lat * 4;
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2;
      curl(Math.sin(phi) * Math.sin(theta) * 0.1, headY + 0.25 + Math.cos(phi) * 0.09, -0.01 + Math.sin(phi) * Math.cos(theta) * 0.105, 0.0135);
    }
  }
  put(sphere, gold, F(0, headY + 0.345, -0.01, 0, 0, 0, 0.023, 0.03, 0.023), 0xeed08a);

  // Halo: lotus rays in a thin gilded ring behind the head.
  const hz = -0.3;
  put(new THREE.TorusGeometry(0.46, 0.014, 6, 48), gold, F(0, headY + 0.03, hz), 0xe0b75f);
  put(new THREE.TorusGeometry(0.36, 0.007, 6, 40), gold, F(0, headY + 0.03, hz), 0xd9ac50);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    put(
      petal,
      gold,
      new THREE.Matrix4().multiplyMatrices(F(0, headY + 0.03, hz), trs(Math.sin(a) * 0.41, Math.cos(a) * 0.41, 0, 0, 0, -a, 0.03, 0.048, 0.015)),
      0xd8ad54
    );
  }
}
