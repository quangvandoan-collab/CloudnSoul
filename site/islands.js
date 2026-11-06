// Floating islands far from the Cloud Temple: rock with hanging spikes, trees on top,
// long thin waterfalls, and tree roots stretched between some of them.
import * as THREE from './vendor/three.module.min.js';
import { skyU } from './scenery.js';

// x, z, height of the top, radius.
const ISLANDS = [
  // Small groups far out on the horizon, about 5 km from the temple, with open sky between them.
  [-1150, -5000, 470, 170], [-700, -5400, 600, 230], [-250, -5100, 430, 130], [250, -5500, 540, 190],
  [4900, -1300, 480, 170], [5300, -700, 590, 220], [5000, -200, 420, 130],
  [-5100, -200, 520, 190], [-5500, 350, 430, 150], [-5050, 750, 560, 170],
  [1800, 5000, 470, 160], [2350, 5200, 580, 210],
  [-3300, 4300, 500, 170], [3600, -4200, 520, 150], [-3900, -3800, 480, 140],
];
// Which islands are joined by roots.
const ROOTS = [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [7, 8], [8, 9], [10, 11]];
const WATERFALL = `
uniform float uTime, uBright; uniform vec3 uCol; varying vec2 vUv; varying float vDist;
float h(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  float x = vUv.x * 26.0; float i0 = floor(x); float w = smoothstep(0.0, 1.0, fract(x));
  float streak = mix(h(i0), h(i0 + 1.0), w);
  float edge = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
  float flow = 0.62 + 0.38 * sin(vUv.y * 90.0 + uTime * (2.4 + streak * 2.2) + streak * 30.0);
  float a = edge * (0.3 + streak * 0.7) * flow * smoothstep(0.0, 0.5, vUv.y) * (0.45 + 0.55 * vUv.y);
  a *= 1.0 - smoothstep(3000.0, 7500.0, vDist) * 0.5;
  gl_FragColor = vec4(uCol * uBright, min(1.0, a * 1.25));
  #include <colorspace_fragment>
}`;
export function createIslands(scene, { phone, rand }) {
  const list = phone ? ISLANDS.filter((_, i) => ![3, 6, 14].includes(i)) : ISLANDS;
  const SEG = phone ? 30 : 72; const RINGS = phone ? 12 : 22;
  const pos = []; const col = [];
  const c = new THREE.Color();
  const grass = new THREE.Color(0x4f7d3a); const moss = new THREE.Color(0x3f6a35); const rockA = new THREE.Color(0x9a8a70); const rockB = new THREE.Color(0x4a3d33);
  const tri = (a, b, d, ca, cb, cd) => { pos.push(...a, ...b, ...d); col.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cd.r, cd.g, cd.b); };
  const treeSpots = []; const vines = []; const falls = []; const info = [];
  for (const [ix, iz, iy, R] of list) {
    const s1 = rand() * 6.28; const s2 = rand() * 6.28; const s3 = rand() * 6.28;
    const lump = (a) => 1 + 0.2 * Math.sin(a * 2 + s1) + 0.1 * Math.sin(a * 5 + s2) + 0.05 * Math.sin(a * 11 + s3);
    const depth = R * (1.25 + rand() * 0.55);
    const lean = [(rand() - 0.5) * R * 0.5, (rand() - 0.5) * R * 0.5];
    // Grid of points: dome on top, cliff at the edge, jagged spikes beneath.
    const point = (u, a) => {
      const L = lump(a);
      if (u < 0.34) {
        const f = u / 0.34;
        return [Math.cos(a) * R * L * f, R * 0.13 * (1 - f * f) + Math.sin(a * 3 + f * 5 + s1) * R * 0.025 * f, Math.sin(a) * R * L * f];
      }
      const f = (u - 0.34) / 0.66;
      const spike = Math.abs(Math.sin(a * 7 + s1)) * 0.55 + Math.abs(Math.sin(a * 13 + s2)) * 0.45 + Math.abs(Math.sin(a * 31 + s3)) * 0.35;
      // Bulging cliffs at the top that narrow into hanging spikes.
      const r = R * L * Math.pow(Math.max(0, 1 - Math.pow(f, 1.55)), 0.85) * (1 + Math.sin(a * 17 + s2 + f * 9) * 0.07 + Math.sin(a * 37 + s1 + f * 5) * 0.035);
      const y = -depth * f * (0.42 + spike * 0.66 * (0.12 + f * f)) + Math.sin(a * 23 + s2) * R * 0.02 * Math.min(1, f * 6);
      return [Math.cos(a) * r + lean[0] * f, y, Math.sin(a) * r + lean[1] * f];
    };
    const colour = (u, a) => {
      if (u < 0.34) return c.copy(grass).multiplyScalar(0.85 + 0.3 * rand()).clone();
      const f = (u - 0.34) / 0.66;
      const mossy = Math.sin(a * 9 + s2) + Math.sin(a * 21 + s1) * 0.5 > 0.1 + f * 5;
      const band = 0.86 + 0.2 * Math.sin(f * 40 + Math.sin(a * 5) * 2);
      return (mossy ? c.copy(moss) : c.copy(rockA).lerp(rockB, Math.min(1, f * 1.25))).multiplyScalar(band * (0.84 + 0.3 * rand())).clone();
    };
    for (let i = 0; i < RINGS; i++) {
      const u0 = i / RINGS; const u1 = (i + 1) / RINGS;
      for (let j = 0; j < SEG; j++) {
        const a0 = (j / SEG) * 6.2832; const a1 = ((j + 1) / SEG) * 6.2832;
        const p = [point(u0, a0), point(u0, a1), point(u1, a1), point(u1, a0)].map((q) => [q[0] + ix, q[1] + iy, q[2] + iz]);
        const ca = colour(u0, a0); const cb = colour(u1, a1);
        if (i > 0) tri(p[0], p[1], p[2], ca, ca, cb);
        if (i < RINGS - 1) tri(p[0], p[2], p[3], ca, cb, cb);
      }
    }
    // Trees on the top.
    const count = Math.round((R / 150) * (phone ? 24 : 70)) + 8;
    for (let k = 0; k < count; k++) {
      const a = rand() * 6.2832; const f = Math.sqrt(rand()) * 0.86;
      const q = point(0.34 * f, a);
      treeSpots.push([ix + q[0], iy + q[1], iz + q[2], R * (0.035 + rand() * 0.05)]);
    }
    // Vines hanging from the rim.
    const vc = phone ? 16 : 40;
    for (let k = 0; k < vc; k++) {
      const a = rand() * 6.2832; const q = point(0.38, a);
      vines.push([ix + q[0], iy + q[1], iz + q[2], R * (0.12 + rand() * 0.5), a]);
    }
    // Waterfalls from the rim, facing the temple where possible.
    const toward = Math.atan2(-iz, -ix);
    const nf = R > 110 ? 3 : R > 80 ? 2 : 1;
    for (let k = 0; k < nf; k++) {
      const a = toward + (k - (nf - 1) / 2) * 0.62 + (rand() - 0.5) * 0.2;
      const q = point(0.33, a);
      falls.push({ x: ix + q[0] * 1.02, y: iy + q[1], z: iz + q[2] * 1.02, h: iy + q[1] + 232 - rand() * 60, w: R * (0.1 + rand() * 0.08) });
    }
    info.push({ x: ix, y: iy, z: iz, R, point });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const rock = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  rock.frustumCulled = false; rock.userData.noGuard = true;
  scene.add(rock);
  // Trees: clouds of green with some in flower, as on the mountain.
  const trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, phone ? 0 : 1), new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }), treeSpots.length);
  const TRS = new THREE.Matrix4(); const Q = new THREE.Quaternion(); const tones = [0x3f6e36, 0x4c7f3c, 0x35602f, 0x5a8a42, 0xe39ab4, 0xe2b24a];
  treeSpots.forEach(([x, y, z, s], i) => {
    TRS.compose(new THREE.Vector3(x, y + s * 0.65, z), Q, new THREE.Vector3(s, s * 0.85, s));
    trees.setMatrixAt(i, TRS);
    trees.setColorAt(i, c.set(tones[Math.floor(rand() * tones.length)]));
  });
  trees.frustumCulled = false;
  scene.add(trees);
  // Vines: thin dark strips, and roots between islands, as tubes with a long sag.
  const parts = [];
  const push = (geo, m) => { const n = geo.index ? geo.toNonIndexed() : geo; n.applyMatrix4(m); parts.push(n); };
  const I = new THREE.Matrix4();
  for (const [x, y, z, len, a] of vines) {
    const v = new THREE.PlaneGeometry(1.1, len, 1, 1);
    push(v, new THREE.Matrix4().compose(new THREE.Vector3(x, y - len / 2, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, a, 0)), new THREE.Vector3(1, 1, 1)));
  }
  const rootCols = [];
  for (const [ai, bi] of ROOTS) {
    const A = info[list.indexOf(ISLANDS[ai])]; const B = info[list.indexOf(ISLANDS[bi])];
    if (!A || !B) continue;
    const dir = Math.atan2(B.z - A.z, B.x - A.x);
    const strands = phone ? 2 : 3;
    for (let k = 0; k < strands; k++) {
      const off = (k - (strands - 1) / 2) * 0.16;
      const pa = A.point(0.42, dir + off); const pb = B.point(0.42, dir + Math.PI - off);
      const a = new THREE.Vector3(A.x + pa[0], A.y + pa[1], A.z + pa[2]);
      const b = new THREE.Vector3(B.x + pb[0], B.y + pb[1], B.z + pb[2]);
      const sag = a.distanceTo(b) * (0.13 + k * 0.035);
      const pts = [];
      for (let t = 0; t <= 8; t++) {
        const f = t / 8; const p = a.clone().lerp(b, f);
        p.y -= Math.sin(f * Math.PI) * sag;
        p.x += Math.sin(f * 9 + k * 2) * 3 * Math.sin(f * Math.PI); p.z += Math.cos(f * 7 + k) * 3 * Math.sin(f * Math.PI);
        pts.push(p);
      }
      const radius = (A.R + B.R) * (0.03 + (k === 1 ? 0.016 : 0));
      const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), phone ? 18 : 30, radius, phone ? 5 : 7);
      push(tube, I);
      rootCols.push(parts.length - 1);
    }
  }
  if (parts.length) {
    const total = parts.reduce((s, q) => s + q.attributes.position.count, 0);
    const P = new Float32Array(total * 3); const N = new Float32Array(total * 3); const C = new Float32Array(total * 3);
    let o = 0;
    parts.forEach((q, i) => {
      P.set(q.attributes.position.array, o * 3); N.set(q.attributes.normal.array, o * 3);
      const isRoot = rootCols.includes(i);
      const count = q.attributes.position.count;
      for (let v = 0; v < count; v++) {
        const y = q.attributes.position.getY(v);
        if (isRoot) c.set(0x3a2c21).lerp(c.clone().set(0x46613a), Math.max(0, Math.sin(y * 0.11 + v * 0.013)) * 0.45);
        else c.set(0x36592f);
        C.set([c.r, c.g, c.b], (o + v) * 3);
      }
      o += count;
    });
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(P, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(N, 3));
    merged.setAttribute('color', new THREE.BufferAttribute(C, 3));
    const m = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }));
    m.frustumCulled = false; m.userData.noGuard = true;
    scene.add(m);
  }
  // Waterfalls always turn to face the viewer.
  const uni = { uTime: { value: 0 }, uBright: { value: 1 }, uCol: { value: new THREE.Color(0xf4fbff) } };
  const fallMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: uni,
    vertexShader: `attribute vec3 aBase; attribute vec2 aSize; varying vec2 vUv; varying float vDist;
      void main() { vUv = uv;
        vec3 base = aBase + vec3(0.0, (uv.y - 1.0) * aSize.y, 0.0);
        vec3 toCam = cameraPosition - base; vDist = length(toCam);
        vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam));
        gl_Position = projectionMatrix * viewMatrix * vec4(base + right * (uv.x - 0.5) * aSize.x, 1.0); }`,
    fragmentShader: WATERFALL,
  });
  const quad = new THREE.PlaneGeometry(1, 1, 1, 1);
  const fg = new THREE.InstancedBufferGeometry();
  fg.index = quad.index; fg.setAttribute('position', quad.attributes.position); fg.setAttribute('uv', quad.attributes.uv);
  fg.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(falls.flatMap((f) => [f.x, f.y, f.z])), 3));
  fg.setAttribute('aSize', new THREE.InstancedBufferAttribute(new Float32Array(falls.flatMap((f) => [f.w, f.h])), 2));
  fg.instanceCount = falls.length;
  const fm = new THREE.Mesh(fg, fallMat);
  fm.frustumCulled = false; fm.userData.noGuard = true;
  scene.add(fm);
  return {
    update(t) { uni.uTime.value = t; },
    setTime(night) {
      uni.uCol.value.copy(skyU.uCloudCol.value).lerp(c.set(0xffffff), 0.55);
      uni.uBright.value = 1 - night * 0.62;
    },
  };
}
