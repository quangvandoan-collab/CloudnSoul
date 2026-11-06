// Builds the pagoda from the plan in world.js. Everything here is generic:
// a new entry in PLACES with a `building` gets platform, columns, walls and a
// curved roof automatically, and an `altar` gets its tiers and statues.
import * as THREE from '../vendor/three.module.min.js';
import { Baker, trs } from './baker.js';
import { addBuddha } from './statue.js';

const WORLD = window.AM_WORLD;

function canvasTexture(size, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
function speckle(g, s, count, alpha, seed = 7) {
  let r = seed;
  const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < count; i++) {
    g.fillStyle = rnd() > 0.5 ? `rgba(255,240,220,${alpha * rnd()})` : `rgba(20,10,5,${alpha * rnd()})`;
    g.fillRect(rnd() * s, rnd() * s, 1 + rnd() * 5, 1 + rnd() * 3);
  }
}

function makeMaterials() {
  // Bát Tràng style terracotta tiles, laid square.
  const floorTex = canvasTexture(256, (g, s) => {
    g.fillStyle = '#a0603f';
    g.fillRect(0, 0, s, s);
    const n = 2;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = ['#a7664a', '#99593c', '#a25f42', '#ad6d4e'][(i * 3 + j) % 4];
      g.fillRect((i * s) / n + 2, (j * s) / n + 2, s / n - 4, s / n - 4);
    }
    speckle(g, s, 500, 0.1);
  });
  // Old, mossy yin-yang roof tiles.
  const roofTex = canvasTexture(256, (g, s) => {
    g.fillStyle = '#6f4a38';
    g.fillRect(0, 0, s, s);
    const cols = 4;
    for (let i = 0; i < cols; i++) {
      const x = (i * s) / cols;
      const grad = g.createLinearGradient(x, 0, x + s / cols, 0);
      grad.addColorStop(0, '#3e2a22'); grad.addColorStop(0.5, '#8a5f49'); grad.addColorStop(1, '#3e2a22');
      g.fillStyle = grad;
      g.fillRect(x, 0, s / cols, s);
    }
    g.fillStyle = 'rgba(30,18,12,.35)';
    for (let j = 0; j < 8; j++) g.fillRect(0, (j * s) / 8, s, 3);
    g.fillStyle = 'rgba(85,105,70,.16)';
    for (let k = 0; k < 40; k++) g.fillRect(((k * 73) % s), ((k * 131) % s), 26, 12);
    speckle(g, s, 500, 0.08, 11);
  });
  const brickTex = canvasTexture(256, (g, s) => {
    g.fillStyle = '#6f6a5c';
    g.fillRect(0, 0, s, s);
    for (let row = 0; row < 8; row++) for (let col = 0; col < 5; col++) {
      g.fillStyle = ['#8c4e36', '#804530', '#96583e', '#7a4631'][(row + col * 3) % 4];
      g.fillRect(((col + (row % 2) * 0.5) * s) / 4 - 40, (row * s) / 8 + 1, s / 4 - 3, s / 8 - 3);
    }
    speckle(g, s, 400, 0.12, 21);
  });
  // Lime plaster with age and moss near the ground.
  const plasterTex = canvasTexture(256, (g, s) => {
    g.fillStyle = '#d8cfb4';
    g.fillRect(0, 0, s, s);
    speckle(g, s, 900, 0.07, 31);
  });
  // A carved gilded screen for behind the statues: repeated lotus and bodhi leaves.
  const screenTex = canvasTexture(512, (g, s) => {
    g.fillStyle = '#6b1d15';
    g.fillRect(0, 0, s, s);
    g.strokeStyle = '#d8ad56';
    g.lineWidth = 5;
    g.strokeRect(14, 14, s - 28, s - 28);
    g.lineWidth = 3;
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const x = 64 + i * 128;
      const y = 64 + j * 128;
      g.beginPath();
      g.moveTo(x, y + 48);
      g.bezierCurveTo(x - 50, y + 12, x - 26, y - 22, x, y - 48);
      g.bezierCurveTo(x + 26, y - 22, x + 50, y + 12, x, y + 48);
      g.stroke();
      g.beginPath();
      g.moveTo(x, y + 48);
      g.lineTo(x, y - 18);
      g.moveTo(x, y + 18); g.lineTo(x - 18, y - 2);
      g.moveTo(x, y + 18); g.lineTo(x + 18, y - 2);
      g.stroke();
    }
  });

  const lambert = (o = {}) => new THREE.MeshLambertMaterial({ vertexColors: true, ...o });
  // Roof undersides would otherwise read as black.
  const roofGlow = { emissive: 0x241a14 };
  return {
    paint: lambert(),
    floor: lambert({ map: floorTex }),
    roof: lambert({ map: roofTex, side: THREE.DoubleSide, ...roofGlow }),
    brick: lambert({ map: brickTex }),
    plaster: lambert({ map: plasterTex }),
    screen: lambert({ map: screenTex }),
    leaf: Object.assign(lambert({ side: THREE.DoubleSide }), { userData: { noGuard: true } }),
    gold: new THREE.MeshPhongMaterial({ vertexColors: true, specular: 0xffe0a0, shininess: 42, emissive: 0x241600 }),
    glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  };
}

function planeXZ(x0, x1, z0, z1, y, uvScale) {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array([x0, y, z1, x1, y, z1, x1, y, z0, x0, y, z1, x1, y, z0, x0, y, z0]);
  const nor = new Float32Array(18);
  for (let i = 0; i < 6; i++) nor[i * 3 + 1] = 1;
  const uv = new Float32Array([x0, z1, x1, z1, x1, z0, x0, z1, x1, z0, x0, z0].map((v) => v * uvScale));
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g;
}

// A wall (or plank) with uv in metres so textures keep their real size.
function wallPiece(baker, mat, x0, z0, x1, z1, y0, y1, thick, color = 0xffffff) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  if (len < 0.01) return;
  const g = new THREE.BoxGeometry(len, y1 - y0, thick);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len * 0.4, uv.getY(i) * (y1 - y0) * 0.4);
  const yaw = -Math.atan2(z1 - z0, x1 - x0);
  baker.add(g, mat, trs((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, 0, yaw, 0), color);
}

const LACQUER = 0x8e2a1c;
const WOOD = 0x5c3421;
const STONE = 0x8c8a7d;

function addColumn(baker, m, x, y, z, h, r = 0.2) {
  baker.add(new THREE.CylinderGeometry(r * 0.88, r, h, 14), m.paint, trs(x, y + h / 2, z), LACQUER);
  // Blue stone base carved as a lotus.
  baker.add(new THREE.CylinderGeometry(r * 1.25, r * 1.65, 0.2, 14), m.paint, trs(x, y + 0.1, z), STONE);
  baker.add(new THREE.CylinderGeometry(r * 1.05, r * 1.3, 0.09, 14), m.paint, trs(x, y + 0.24, z), 0x9a998c);
  baker.add(new THREE.CylinderGeometry(r * 1.04, r * 1.04, 0.1, 14), m.gold, trs(x, y + h - 0.18, z), 0xc99b48);
}

// A hip roof whose eaves sweep up at the corners: the "đao" that makes a
// Vietnamese roof unmistakable.
function addRoof(baker, m, b, y0, overhang, lift, options = {}) {
  const { ridgeRatio = 0.42, tier = 0 } = options;
  const X0 = b.x0 - overhang;
  const X1 = b.x1 + overhang;
  const Z0 = b.z0 - overhang;
  const Z1 = b.z1 + overhang;
  const alongZ = b.ridgeAxis === 'z' || (b.z1 - b.z0 > b.x1 - b.x0 && b.ridgeAxis !== 'x');
  const H = options.ridgeH ?? b.ridgeH;
  const cx = (X0 + X1) / 2;
  const cz = (Z0 + Z1) / 2;
  const hw = (X1 - X0) / 2;
  const hd = (Z1 - Z0) / 2;
  const ridge = alongZ
    ? [[cx, cz - (hd - hw * (1 - ridgeRatio) * 0.8)], [cx, cz + (hd - hw * (1 - ridgeRatio) * 0.8)]]
    : [[cx - (hw - hd * (1 - ridgeRatio) * 0.8), cz], [cx + (hw - hd * (1 - ridgeRatio) * 0.8), cz]];
  const E = { nw: [X0, Z0], ne: [X1, Z0], se: [X1, Z1], sw: [X0, Z1] };
  const [R0, R1] = ridge;
  const faces = alongZ
    ? [[E.sw, E.nw, R1, R0], [E.ne, E.se, R0, R1], [E.nw, E.ne, R0, R0], [E.se, E.sw, R1, R1]]
    : [[E.sw, E.se, R0, R1], [E.ne, E.nw, R1, R0], [E.se, E.ne, R1, R1], [E.nw, E.sw, R0, R0]];
  const NU = 22;
  const NV = 7;
  const height = (u, v) => {
    const c = Math.abs(u * 2 - 1);
    return y0 + H * Math.pow(v, 1.3) + lift * Math.pow(c, 4) * Math.pow(1 - v, 2);
  };
  const faceColor = (x, y) => 0xffffff - (y < y0 + 0.6 ? 0x050505 : 0);
  for (const [a, c, r0, r1] of faces) {
    const pos = [];
    const uv = [];
    const lenU = Math.hypot(c[0] - a[0], c[1] - a[1]);
    const lenV = Math.hypot(H, Math.hypot((r0[0] + r1[0]) / 2 - (a[0] + c[0]) / 2, (r0[1] + r1[1]) / 2 - (a[1] + c[1]) / 2));
    for (let i = 0; i <= NU; i++) {
      for (let j = 0; j <= NV; j++) {
        const u = i / NU;
        const v = j / NV;
        const ex = a[0] + (c[0] - a[0]) * u;
        const ez = a[1] + (c[1] - a[1]) * u;
        const rx = r0[0] + (r1[0] - r0[0]) * u;
        const rz = r0[1] + (r1[1] - r0[1]) * u;
        pos.push(ex + (rx - ex) * v, height(u, v), ez + (rz - ez) * v);
        uv.push(u * lenU * 0.55, v * lenV * 0.55);
      }
    }
    const idx = [];
    for (let i = 0; i < NU; i++) {
      for (let j = 0; j < NV; j++) {
        const p = i * (NV + 1) + j;
        idx.push(p, p + NV + 1, p + 1, p + 1, p + NV + 1, p + NV + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    baker.add(g, m.roof, null, faceColor);
  }

  const top = y0 + H;
  const dark = 0x4a3227;
  // Ridge and hip lines.
  const ridgeLine = (p0, p1, liftAt0 = 0, liftAt1 = 0, r = 0.13) => {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const f = i / 8;
      const v = 1 - f;
      const x = p0[0] + (p1[0] - p0[0]) * f;
      const z = p0[2] + (p1[2] - p0[2]) * f;
      const y = p0[1] + (p1[1] - p0[1]) * f + liftAt0 * Math.pow(v, 3) + liftAt1 * Math.pow(f, 3);
      pts.push(new THREE.Vector3(x, y, z));
    }
    baker.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, r, 6), m.paint, null, dark);
  };
  ridgeLine([R0[0], top + 0.08, R0[1]], [R1[0], top + 0.08, R1[1]], 0.34, 0.34, 0.17);
  const hipFrom = alongZ
    ? [[E.nw, R0], [E.ne, R0], [E.se, R1], [E.sw, R1]]
    : [[E.nw, R0], [E.sw, R0], [E.ne, R1], [E.se, R1]];
  for (const [e, r] of hipFrom) {
    const py = height(1, 0);
    ridgeLine([e[0], py + 0.05, e[1]], [r[0], top + 0.05, r[1]], 0.5, 0, 0.1);
    // The upturned "đao" tip: a tapering curl pointing out and up.
    const dx = Math.sign(e[0] - r[0]) || 1;
    const dz = Math.sign(e[1] - r[1]) || 1;
    const curl = new THREE.CatmullRomCurve3([
      new THREE.Vector3(e[0], py + 0.1, e[1]),
      new THREE.Vector3(e[0] + dx * 0.3, py + 0.42, e[1] + dz * 0.3),
      new THREE.Vector3(e[0] + dx * 0.42, py + 0.82, e[1] + dz * 0.42),
      new THREE.Vector3(e[0] + dx * 0.28, py + 1.08, e[1] + dz * 0.28),
    ]);
    baker.add(new THREE.TubeGeometry(curl, 12, 0.085, 6), m.paint, null, dark);
    baker.add(new THREE.SphereGeometry(0.13, 8, 6), m.paint, trs(e[0] + dx * 0.25, py + 1.1, e[1] + dz * 0.25), dark);
  }

  // Top tier ornament: two dragons facing a central moon, simplified.
  if (options.ornament !== false && tier === 0) {
    const mx = (R0[0] + R1[0]) / 2;
    const mz = (R0[1] + R1[1]) / 2;
    const sideOnX = !alongZ;
    const offset = (d) => (sideOnX ? [mx + d, mz] : [mx, mz + d]);
    const [ax, az] = offset(0);
    const orbRy = sideOnX ? 0 : Math.PI / 2;
    baker.add(new THREE.SphereGeometry(0.32, 16, 12), m.gold, trs(ax, top + 0.7, az), 0xe5be66);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      baker.add(new THREE.ConeGeometry(0.07, 0.3, 5), m.gold,
        new THREE.Matrix4().multiplyMatrices(trs(ax, top + 0.7, az, 0, orbRy, 0), trs(Math.sin(a) * 0.42, Math.cos(a) * 0.42, 0, 0, 0, -a)),
        0xd9ad54);
    }
    for (const dir of [-1, 1]) {
      const L = (d, h) => {
        const [x, z] = offset(dir * d);
        return new THREE.Vector3(x, top + h, z);
      };
      const body = new THREE.CatmullRomCurve3([L(3.1, 0.25), L(2.6, 0.75), L(2.05, 0.38), L(1.5, 0.82), L(0.85, 0.72)]);
      baker.add(new THREE.TubeGeometry(body, 26, 0.095, 7), m.paint, null, 0x4f7a68);
      const h = L(0.76, 0.76);
      baker.add(new THREE.SphereGeometry(0.17, 10, 8), m.paint, trs(h.x, h.y, h.z, 0, 0, 0, 1, 0.85, 1), 0x5a8a76);
      for (const f of [1.1, 1.75, 2.35]) {
        const fin = L(f, 0.98 - (f > 2 ? 0.34 : 0));
        baker.add(new THREE.ConeGeometry(0.07, 0.26, 4), m.paint, trs(fin.x, fin.y, fin.z), 0x6e9d88);
      }
    }
  }
}

function addBuilding(baker, m, place) {
  const b = place.building;
  const y = place.elevation;
  const W = b.x1 - b.x0;
  const D = b.z1 - b.z0;
  const thick = 0.24;

  // Raised brick platform with blue stone edge, then tiled floor.
  const g = new THREE.BoxGeometry(W + 0.6, y, D + 0.6);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (W + D) * 0.2, uv.getY(i) * 0.3);
  baker.add(g, m.brick, trs((b.x0 + b.x1) / 2, y / 2, (b.z0 + b.z1) / 2));
  baker.add(planeXZ(b.x0 - 0.3, b.x1 + 0.3, b.z0 - 0.3, b.z1 + 0.3, y + 0.005, 0.5), m.floor);
  const sides = {
    s: (a) => [b.x0 + a, b.z1], n: (a) => [b.x0 + a, b.z0], e: (a) => [b.x1, b.z0 + a], w: (a) => [b.x0, b.z0 + a],
  };

  // Walls, leaving gaps at openings. The lower part is ironwood panel.
  const wall = (side, length) => {
    const openings = (place.openings || [])
      .filter((o) => o.side === side)
      .map((o) => {
        const base = side === 's' || side === 'n' ? b.x0 : b.z0;
        return [o.at - base - o.width / 2, o.at - base + o.width / 2];
      })
      .sort((p, q) => p[0] - q[0]);
    let cursor = 0;
    const segments = [];
    for (const [s0, s1] of openings) {
      if (s0 > cursor) segments.push([cursor, s0]);
      cursor = s1;
    }
    if (cursor < length) segments.push([cursor, length]);
    const top = y + b.wallH;
    const isPlain = b.wallpaper?.side === side || b.noWindows?.includes(side);

    // Windows are real gaps in the wall, kept clear of doors and corners.
    const HALF = 1.2;
    const sill = y + 1.5;
    const head = Math.min(top - 0.9, y + 4.6);
    const windows = [];
    if (!isPlain) {
      const count = Math.floor((length - 2) / 4.8);
      for (let i = 0; i < count; i++) {
        const at = ((i + 0.5) * length) / count;
        if (segments.some(([s0, s1]) => at - HALF - 0.5 >= s0 && at + HALF + 0.5 <= s1)) windows.push(at);
      }
    }
    const piece = (mat, s0, s1, y0, y1, depth, color) => {
      const [x0, z0] = sides[side](s0);
      const [x1, z1] = sides[side](s1);
      wallPiece(baker, mat, x0, z0, x1, z1, y0, y1, depth, color);
    };
    const solid = (s0, s1, y0 = y, y1 = top) => {
      if (y0 < y + 1.1) piece(m.paint, s0, s1, y0, Math.min(y1, y + 1.1), thick + 0.05, WOOD);
      if (y1 > y + 1.1) piece(m.plaster, s0, s1, Math.max(y0, y + 1.1), y1, thick);
      if (y0 < y + 1.1) piece(m.paint, s0, s1, y + 1.08, y + 1.2, thick + 0.08, 0x3f2417);
    };
    for (const [s0, s1] of segments) {
      let at = s0;
      for (const w of windows.filter((c) => c > s0 && c < s1)) {
        solid(at, w - HALF);
        solid(w - HALF, w + HALF, y, sill);
        solid(w - HALF, w + HALF, head, top);
        // Paper screen in the gap, with a frame and lattice seen from both sides.
        piece(m.lantern, w - HALF, w + HALF, sill, head, 0.05, 0xbfd6c8);
        piece(m.paint, w - HALF - 0.1, w - HALF + 0.03, sill - 0.1, head + 0.1, thick + 0.12, 0x3f2417);
        piece(m.paint, w + HALF - 0.03, w + HALF + 0.1, sill - 0.1, head + 0.1, thick + 0.12, 0x3f2417);
        piece(m.paint, w - HALF, w + HALF, sill - 0.1, sill + 0.03, thick + 0.12, 0x3f2417);
        piece(m.paint, w - HALF, w + HALF, head - 0.03, head + 0.1, thick + 0.12, 0x3f2417);
        for (let k = -2; k <= 2; k++) piece(m.paint, w + k * 0.4 - 0.025, w + k * 0.4 + 0.025, sill, head, 0.1, 0x4a2a1a);
        const rows = Math.max(2, Math.round((head - sill) / 0.45));
        for (let k = 1; k < rows; k++) {
          const ly = sill + (k / rows) * (head - sill);
          piece(m.paint, w - HALF, w + HALF, ly - 0.025, ly + 0.025, 0.1, 0x4a2a1a);
        }
        at = w + HALF;
      }
      solid(at, s1);
    }
    for (const [s0, s1] of openings) {
      const [x0, z0] = sides[side](s0);
      const [x1, z1] = sides[side](s1);
      // Red lintel above, gold fretwork strip beneath it.
      wallPiece(baker, m.paint, x0, z0, x1, z1, y + 3.3, top, thick + 0.1, LACQUER);
      wallPiece(baker, m.gold, x0, z0, x1, z1, y + 3.17, y + 3.3, thick + 0.14, 0xc99b48);
      addColumn(baker, m, x0, y, z0, b.wallH, 0.16);
      addColumn(baker, m, x1, y, z1, b.wallH, 0.16);
    }
  };
  wall('s', W);
  wall('n', W);
  wall('e', D);
  wall('w', D);

  // Rows of lacquered columns and tie beams.
  const colH = b.wallH + 0.12;
  if (b.ridgeAxis === 'z') {
    const step = b.colZ || 4;
    for (let z = b.z1 - 1; z >= b.z0 + 1; z -= step) {
      for (const x of [-b.colX, b.colX]) addColumn(baker, m, (b.x0 + b.x1) / 2 + x, y, z, colH + 1, 0.2);
      // No beams across the view of the statues.
      if (place.altar && z < place.altar.z + 8) continue;
      wallPiece(baker, m.paint, b.x0, z, b.x1, z, y + b.wallH, y + b.wallH + 0.34, 0.26, 0x6b2519);
      wallPiece(baker, m.paint, (b.x0 + b.x1) / 2 - b.colX, z, (b.x0 + b.x1) / 2 + b.colX, z, y + b.wallH + 1.05, y + b.wallH + 1.3, 0.22, 0x6b2519);
      baker.box(0.18, 1.8, 0.18, (b.x0 + b.x1) / 2, y + b.wallH + 2, z, m.paint, 0x5c2015);
    }
  } else {
    const midZ = (b.z0 + b.z1) / 2;
    const step = b.colX || 4;
    const half = D * 0.28;
    for (let x = b.x0 + 1.5; x <= b.x1 - 1; x += step) {
      for (const z of [midZ - half, midZ + half]) {
        // Keep the middle bay clear so the way through stays open.
        if (Math.abs(x) >= 1.4) addColumn(baker, m, x, y, z, colH + 0.6, 0.18);
      }
      wallPiece(baker, m.paint, x, b.z0, x, b.z1, y + b.wallH, y + b.wallH + 0.3, 0.24, 0x6b2519);
      wallPiece(baker, m.paint, x, midZ - half, x, midZ + half, y + b.wallH + 0.8, y + b.wallH + 1, 0.2, 0x6b2519);
      baker.box(0.14, 1.3, 0.14, x, y + b.wallH + 1.5, midZ, m.paint, 0x5c2015);
    }
  }
  addRoof(baker, m, b, y + b.wallH + 0.15, 1.5, 0.75, {});

  // Steps at the courtyard opening.
  for (const o of place.openings || []) {
    if (o.side !== 's' || !y || o.width < 4) continue;
    const steps = Math.max(2, Math.round(y / 0.17));
    for (let i = 0; i < steps; i++) {
      const h = (y * (steps - i)) / (steps + 0.2);
      baker.box(o.width + 1, h, 0.34, o.at, h / 2, b.z1 + 0.42 + (i * 0.34), m.paint, STONE);
    }
  }
}

function addAltar(baker, m, place, lit) {
  const a = place.altar;
  const b = place.building;
  const y = place.elevation;
  const cx = (b.x0 + b.x1) / 2;
  const back = a.z - a.depth;
  // Tiers rise towards the back, as in northern pagodas.
  const tiers = [
    { z: a.z - 0.75, d: 1.5, h: 0.45, w: a.width * 0.72 },
    { z: a.z - 2.2, d: 1.6, h: 1.0, w: a.width * 0.88 },
    { z: back + 1.55, d: 3.1, h: 1.75, w: a.width },
  ];
  tiers.forEach((t) => {
    baker.box(t.w, t.h, t.d, cx, y + t.h / 2, t.z, m.paint, 0x711f15);
    baker.box(t.w + 0.1, 0.07, t.d + 0.06, cx, y + t.h, t.z, m.gold, 0xc99b48);
    baker.box(t.w + 0.05, 0.05, 0.03, cx, y + t.h * 0.45, t.z + t.d / 2 + 0.01, m.gold, 0xb98c3e);
    baker.box(t.w, 0.09, t.d, cx, y + 0.05, t.z, m.gold, 0x8a6a2c);
  });

  // Carved screen and hanging banners behind the statues.
  const screenH = b.wallH + 1.2;
  const sg = new THREE.PlaneGeometry(a.width, screenH);
  const suv = sg.attributes.uv;
  for (let i = 0; i < suv.count; i++) suv.setXY(i, suv.getX(i) * (a.width / 4.2), suv.getY(i) * (screenH / 4.2));
  baker.add(sg, m.screen, trs(cx, y + screenH / 2, back + 0.14));

  // Three Times Buddhas on the top tier, central figure largest.
  for (const [dx, scale] of a.statues) {
    addBuddha(baker, m, cx + dx, y + 1.77, back + 1.55, scale);
  }

  // Incense table in front of the altar: bronze burner, candles, flowers, fruit.
  const tz = a.z + 0.05;
  const th = 0.98;
  baker.box(3.6, 0.09, 0.95, cx, y + th, tz, m.paint, LACQUER);
  baker.box(3.72, 0.03, 1.04, cx, y + th + 0.05, tz, m.gold, 0xc99b48);
  for (const [lx, lz] of [[-1.65, -0.35], [1.65, -0.35], [-1.65, 0.35], [1.65, 0.35]]) {
    baker.box(0.13, th, 0.13, cx + lx, y + th / 2, tz + lz, m.paint, 0x5e1a12);
  }
  baker.box(3.5, 0.5, 0.05, cx, y + th - 0.27, tz + 0.42, m.paint, 0x711f15);
  const tableY = y + th + 0.06;
  baker.add(
    new THREE.LatheGeometry([[0, 0], [0.13, 0], [0.11, 0.06], [0.22, 0.12], [0.25, 0.26], [0.2, 0.34], [0.23, 0.37], [0.03, 0.37]].map(([r, h]) => new THREE.Vector2(r, h)), 18),
    m.gold, trs(cx, tableY, tz), 0x9b7433
  );
  for (const dx of [-0.05, 0, 0.05]) baker.box(0.01, 0.34, 0.01, cx + dx, tableY + 0.53, tz, m.paint, 0x6e2d1b);
  lit.push(new THREE.Vector3(cx, tableY + 0.72, tz));
  for (const side of [-1, 1]) {
    // Candlestick with a small warm flame.
    baker.add(new THREE.CylinderGeometry(0.03, 0.09, 0.42, 10), m.gold, trs(cx + side * 0.8, tableY + 0.21, tz), 0xbd9440);
    baker.add(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 10), m.paint, trs(cx + side * 0.8, tableY + 0.52, tz), 0xc73a26);
    baker.add(new THREE.SphereGeometry(0.03, 8, 6), m.glow, trs(cx + side * 0.8, tableY + 0.67, tz, 0, 0, 0, 0.7, 1.4, 0.7), 0xffc86a);
    // Vase of lotus.
    baker.add(
      new THREE.LatheGeometry([[0, 0], [0.09, 0], [0.13, 0.12], [0.1, 0.27], [0.05, 0.34], [0.08, 0.4]].map(([r, h]) => new THREE.Vector2(r, h)), 12),
      m.paint, trs(cx + side * 1.4, tableY, tz), 0xe8e3d0
    );
    for (let i = 0; i < 3; i++) {
      const ox = (i - 1) * 0.1;
      baker.box(0.012, 0.32, 0.012, cx + side * 1.4 + ox, tableY + 0.56, tz, m.paint, 0x5a7a4b);
      baker.add(new THREE.SphereGeometry(0.075, 8, 6), m.paint, trs(cx + side * 1.4 + ox, tableY + 0.74, tz, 0, 0, 0, 0.8, 1.15, 0.8), 0xf0b2b5);
    }
    // A plate of pomelo, offered on a stand.
    baker.add(new THREE.CylinderGeometry(0.17, 0.08, 0.1, 14), m.gold, trs(cx + side * 0.36, tableY + 0.05, tz + 0.15), 0xbd9440);
    baker.add(new THREE.SphereGeometry(0.11, 12, 10), m.paint, trs(cx + side * 0.36, tableY + 0.19, tz + 0.15), 0xb8bd62);
  }

  // Bronze bell-bowl and a cushion for whoever leads the chanting: an empty place.
  baker.add(new THREE.CylinderGeometry(0.28, 0.2, 0.1, 18), m.paint, trs(cx + 2.1, y + 0.06, a.z + 0.25), 0x7a2118);
  baker.add(new THREE.SphereGeometry(0.2, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), m.gold, trs(cx + 2.1, y + 0.29, a.z + 0.25, 0, 0, 0, 1, 0.85, 1), 0xa47e36);
  // Wooden fish on a small stand.
  baker.add(new THREE.CylinderGeometry(0.26, 0.2, 0.1, 18), m.paint, trs(cx - 2.1, y + 0.06, a.z + 0.25), 0x7a2118);
  baker.add(new THREE.SphereGeometry(0.2, 12, 10), m.paint, trs(cx - 2.1, y + 0.26, a.z + 0.25, 0, 0, 0, 1.05, 0.85, 0.9), 0x8c4d22);

  // Hanging silk banners, one each side.
  for (const dx of [-9, -4.7, 4.7, 9]) {
    baker.box(0.9, 4.2, 0.04, cx + dx, y + 7, a.z - 0.5, m.paint, Math.abs(dx) > 6 ? 0xb88d27 : 0x9e2b1f);
    baker.box(0.9, 0.1, 0.05, cx + dx, y + 4.9, a.z - 0.5, m.gold, 0xc99b48);
  }
}

function addCushions(baker, m) {
  for (const seat of WORLD.SEATS) {
    const y = WORLD.elevationAt(seat.x, seat.z);
    baker.add(new THREE.CylinderGeometry(0.33, 0.36, 0.11, 14), m.paint, trs(seat.x, y + 0.06, seat.z), 0x71786c);
  }
}

// A gate on the axis with short walls running out to `reach`. Tall centre roof;
// `tiers: 2` adds the lower skirt roof of a main Tam quan.
function addGate(baker, m, z, { hw = 2.4, height = 5.1, tiers = 2, reach = 6.2 }) {
  const b = { x0: -hw, x1: hw, z0: z - 1.3, z1: z + 1.3, ridgeAxis: 'x', ridgeH: 1.6 };
  for (const x of [-hw, hw]) for (const dz of [-1.1, 1.1]) addColumn(baker, m, x, 0, z + dz, height, 0.2);
  wallPiece(baker, m.paint, -hw, z, hw, z, height - 1.5, height + 0.1, 0.3, LACQUER);
  wallPiece(baker, m.gold, -hw, z, hw, z, height - 1.68, height - 1.5, 0.34, 0xc99b48);
  addRoof(baker, m, b, height + 0.05, 1.1, 0.6, {});
  if (tiers > 1) addRoof(baker, m, { ...b, ridgeH: 0.8 }, height - 1.25, 1.55, 0.5, { tier: 1 });
  for (const side of [-1, 1]) {
    const x1 = side * reach;
    // Two lower side openings give the "three gates" of a Tam quan.
    if (tiers > 1) {
      baker.box(2.4, 0.26, 1.3, side * (hw + 1.6), 3.4, z, m.paint, 0x4a3227);
      addColumn(baker, m, side * (hw + 2.9), 0, z, 3.3, 0.14);
      baker.box(reach - hw - 3, 2.3, 0.4, side * ((reach + hw + 2.9) / 2), 1.15, z, m.brick, 0xffffff);
    } else {
      baker.box(reach - hw, 2.3, 0.4, side * ((reach + hw) / 2), 1.15, z, m.brick, 0xffffff);
    }
    baker.box(0.8, 3.9, 0.8, x1, 1.95, z, m.brick, 0xffffff);
    baker.box(1, 0.2, 1, x1, 4, z, m.paint, STONE);
    baker.add(new THREE.SphereGeometry(0.28, 12, 8), m.gold, trs(x1, 4.32, z), 0xc99b48);
  }
}

function addPavilion(baker, m, cx, cz, hw, height, two) {
  for (const x of [-hw, hw]) for (const z of [-hw, hw]) addColumn(baker, m, cx + x, 0, cz + z, height, 0.15);
  const b = { x0: cx - hw, x1: cx + hw, z0: cz - hw, z1: cz + hw, ridgeH: 1.7, ridgeAxis: 'x' };
  addRoof(baker, m, b, height, 0.9, 0.65, { ridgeRatio: 0.2, ornament: false });
  if (two) addRoof(baker, m, { ...b, ridgeH: 0.7 }, height - 1.9, 1.3, 0.5, { tier: 1, ridgeRatio: 0.3 });
  baker.box(hw * 2 + 0.9, 0.05, hw * 2 + 0.9, cx, 0.03, cz, m.paint, STONE);
}

function addBell(baker, m, cx, cz) {
  addPavilion(baker, m, cx, cz, 2.6, 5.6, true);
  wallPiece(baker, m.paint, cx - 2.6, cz, cx + 2.6, cz, 4.85, 5.1, 0.24, 0x6b2519);
  const bronze = 0x5e6a4f;
  baker.add(
    new THREE.LatheGeometry(
      [[0.01, 0], [0.42, 0], [0.44, 0.1], [0.36, 0.34], [0.33, 0.8], [0.31, 1.2], [0.2, 1.36], [0.01, 1.4]].map(([r, h]) => new THREE.Vector2(r, h)),
      22
    ),
    m.gold, trs(cx, 3.02, cz), bronze
  );
  [3.42, 3.82, 4.2].forEach((y) => baker.add(new THREE.TorusGeometry(0.335, 0.016, 6, 24), m.gold, trs(cx, y, cz, Math.PI / 2), 0x8a8f60));
  baker.box(0.05, 0.42, 0.05, cx, 4.65, cz, m.paint, 0x2e2e22);
}

// A covered walkway: columns, a simple pitched roof.
function addCorridor(baker, m, x0, z0, x1, z1, width = 2.6) {
  const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  const len = alongX ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const count = Math.floor(len / 4.2);
  for (let i = 0; i <= count; i++) {
    const t = -len / 2 + (i * len) / count;
    for (const side of [-1, 1]) {
      const x = alongX ? cx + t : cx + side * width / 2;
      const z = alongX ? cz + side * width / 2 : cz + t;
      baker.add(new THREE.CylinderGeometry(0.11, 0.13, 3, 8), m.paint, trs(x, 1.5, z), LACQUER);
    }
  }
  for (const side of [-1, 1]) {
    const g = new THREE.BoxGeometry(alongX ? len + 0.8 : width / 2 + 0.75, 0.12, alongX ? width / 2 + 0.75 : len + 0.8);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len * 0.5, uv.getY(i) * 2);
    const offset = side * (width / 4 + 0.36);
    const tilt = 0.36 * side;
    baker.add(g, m.roof, alongX ? trs(cx, 3.42, cz + offset, tilt, 0, 0) : trs(cx + offset, 3.42, cz, 0, 0, -tilt));
  }
}

// The tall tower. Octagonal roofs with upturned corners get smaller as it climbs.
function octPoint(cx, cz, radius, i) {
  const a = ((i % 8) / 8) * Math.PI * 2 + Math.PI / 8;
  return [cx + Math.sin(a) * radius, cz + Math.cos(a) * radius];
}

function addOctRoof(baker, m, cx, cz, y, R, inner, H, lift) {
  const NU = 8;
  const NV = 4;
  for (let s = 0; s < 8; s++) {
    const [ax, az] = octPoint(cx, cz, R, s);
    const [bx, bz] = octPoint(cx, cz, R, s + 1);
    const [cxi, czi] = octPoint(cx, cz, inner, s);
    const [dxi, dzi] = octPoint(cx, cz, inner, s + 1);
    const pos = [];
    const uv = [];
    const side = Math.hypot(bx - ax, bz - az);
    for (let i = 0; i <= NU; i++) {
      for (let j = 0; j <= NV; j++) {
        const u = i / NU;
        const v = j / NV;
        const ex = ax + (bx - ax) * u;
        const ez = az + (bz - az) * u;
        const ix = cxi + (dxi - cxi) * u;
        const iz = czi + (dzi - czi) * u;
        const corner = Math.abs(u * 2 - 1);
        pos.push(ex + (ix - ex) * v, y + H * Math.pow(v, 1.25) + lift * Math.pow(corner, 3) * Math.pow(1 - v, 2), ez + (iz - ez) * v);
        uv.push(u * side * 0.55, v * (R - inner) * 0.7);
      }
    }
    const idx = [];
    for (let i = 0; i < NU; i++) {
      for (let j = 0; j < NV; j++) {
        const p = i * (NV + 1) + j;
        idx.push(p, p + NV + 1, p + 1, p + 1, p + NV + 1, p + NV + 2);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    baker.add(g, m.towerRoof);
    // Hip rib with an upturned tip and a small red lantern beneath.
    const dirX = (ax - cx) / R;
    const dirZ = (az - cz) / R;
    const rib = new THREE.CatmullRomCurve3([
      new THREE.Vector3(cxi, y + H + 0.03, czi),
      new THREE.Vector3(cx + dirX * (inner + (R - inner) * 0.5), y + H * 0.42 + 0.12, cz + dirZ * (inner + (R - inner) * 0.5)),
      new THREE.Vector3(ax, y + lift + 0.08, az),
      new THREE.Vector3(ax + dirX * 0.34, y + lift + 0.42, az + dirZ * 0.34),
      new THREE.Vector3(ax + dirX * 0.34, y + lift + 0.78, az + dirZ * 0.34),
    ]);
    baker.add(new THREE.TubeGeometry(rib, 14, 0.075, 6), m.paint, null, 0x223c37);
    baker.box(0.02, 0.32, 0.02, ax - dirX * 0.1, y + lift - 0.2, az - dirZ * 0.1, m.paint, 0x2b1a12);
    baker.add(new THREE.SphereGeometry(0.17, 10, 8), m.lantern, trs(ax - dirX * 0.1, y + lift - 0.48, az - dirZ * 0.1, 0, 0, 0, 1, 1.15, 1), 0xd8362a);
  }
}

// A flat octagon with its top at y, and an optional opening where a stair comes up.
function octSlab(baker, m, cx, cz, R, y, thick, color, stair) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 8; i++) { const [px, pz] = octPoint(0, 0, R, i); if (i) shape.lineTo(px, pz); else shape.moveTo(px, pz); }
  shape.closePath();
  if (stair) {
    const ax = stair.from[0] - cx; const az = stair.from[1] - cz; const bx = stair.to[0] - cx; const bz = stair.to[1] - cz;
    const len = Math.hypot(bx - ax, bz - az); const ux = (bx - ax) / len; const uz = (bz - az) / len;
    const w = stair.width / 2 + 0.1; const nx = -uz * w; const nz = ux * w;
    const hole = new THREE.Path();
    // The opening is as long as the part of the stair with too little headroom.
    const sx = bx - ux * len * 0.62; const sz = bz - uz * len * 0.62; const ex = bx + ux * 0.05; const ez = bz + uz * 0.05;
    hole.moveTo(sx + nx, sz + nz); hole.lineTo(ex + nx, ez + nz); hole.lineTo(ex - nx, ez - nz); hole.lineTo(sx - nx, sz - nz); hole.closePath();
    shape.holes.push(hole);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, steps: 1 });
  g.rotateX(Math.PI / 2);
  baker.add(g, m.paint, trs(cx, y, cz), color);
}

function addTower(baker, m, cx, cz) {
  const T = WORLD.TOWER;
  // Stone plinth, with two low steps all the way round.
  baker.add(new THREE.CylinderGeometry(9.9, 10, 0.17, 8), m.paint, trs(cx, 0.635, cz, 0, Math.PI / 8), 0x8d8c80);
  baker.add(new THREE.CylinderGeometry(9.45, 9.5, 0.17, 8), m.paint, trs(cx, 0.805, cz, 0, Math.PI / 8), 0x9a988b);
  let y = 0;
  T.levels.forEach((L, i) => {
    y = L.y;
    const { r, h, roof: H } = L;
    const t = i / (T.FLOORS - 1);
    const below = T.stairs[i - 1];
    if (i > 0) octSlab(baker, m, cx, cz, r + 0.42, y, 0.28, 0x7a2f20, below);
    for (let c = 0; c < 8; c++) {
      const [x, z] = octPoint(cx, cz, r, c);
      if (i === 0) addColumn(baker, m, x, y, z, h, 0.21);
      else baker.add(new THREE.CylinderGeometry(0.1, 0.12, h, 8), m.paint, trs(x, y + h / 2, z), LACQUER);
    }
    if (i > 0) {
      // Eight walls: four with real window openings, four solid with a lit screen outside.
      const wallH = i === T.FLOORS - 1 ? h : h + H;
      const A = L.apothem + 0.11;
      const W = 2 * (L.core + 0.12) * Math.sin(Math.PI / 8) + 0.08;
      for (let c = 0; c < 8; c++) {
        const a = (c / 8) * Math.PI * 2;
        const piece = (u0, u1, v0, v1, color, out = A, thick = 0.22, mat = m.paint) => {
          const u = (u0 + u1) / 2;
          baker.box(u1 - u0, v1 - v0, thick, cx + Math.sin(a) * out + Math.cos(a) * u, y + (v0 + v1) / 2, cz + Math.cos(a) * out - Math.sin(a) * u, mat, color, a);
        };
        if (c % 2 === 0) {
          const win = Math.min(0.85, W / 2 - 0.3); const sill = 0.78; const head = Math.min(2.75, h - 0.35);
          piece(-W / 2, -win, 0, wallH, 0xe6dcc0);
          piece(win, W / 2, 0, wallH, 0xe6dcc0);
          piece(-win, win, 0, sill, 0xa33d29);
          piece(-win, win, head, wallH, 0xa33d29);
          // The frame.
          piece(-win - 0.07, -win, sill - 0.04, head + 0.04, 0x4a2318, A, 0.3);
          piece(win, win + 0.07, sill - 0.04, head + 0.04, 0x4a2318, A, 0.3);
          piece(-win - 0.07, win + 0.07, head, head + 0.08, 0x4a2318, A, 0.3);
          piece(-win - 0.07, win + 0.07, sill - 0.08, sill, 0x4a2318, A, 0.3);
        } else {
          piece(-W / 2, W / 2, 0, wallH, 0xe6dcc0);
          piece(-W / 2, W / 2, 0, h * 0.26, 0xa33d29, A + 0.01, 0.23);
          piece(-0.55, 0.55, h * 0.3, h * 0.82, 0x4a2318, A + 0.1, 0.05);
          piece(-0.42, 0.42, h * 0.36, h * 0.76, 0xc99b4b, A + 0.12, 0.05, m.lantern);
        }
      }
      if (i === T.FLOORS - 1) octSlab(baker, m, cx, cz, L.core + 0.2, y + h + 0.02, 0.2, 0x6b2519);
      // Balcony rail.
      for (let c = 0; c < 8; c++) {
        const [ax, az] = octPoint(cx, cz, r + 0.36, c); const [bx, bz] = octPoint(cx, cz, r + 0.36, c + 1);
        const len = Math.hypot(bx - ax, bz - az); const ry = Math.atan2(bx - ax, bz - az);
        baker.box(0.1, 0.1, len, (ax + bx) / 2, y + 0.98, (az + bz) / 2, m.paint, 0x7a2a1d, ry);
        baker.box(0.05, 0.05, len, (ax + bx) / 2, y + 0.58, (az + bz) / 2, m.paint, 0x7a2a1d, ry);
        for (let k = 1; k < 5; k++) baker.box(0.05, 0.95, 0.05, ax + (bx - ax) * k / 5, y + 0.5, az + (bz - az) * k / 5, m.paint, 0x8e3a26);
      }
    }
    const nextR = i < T.FLOORS - 1 ? T.levels[i + 1].r : 0.55;
    const R = r + 2.15 - t * 0.5;
    addOctRoof(baker, m, cx, cz, y + h, R, Math.max(0.3, nextR - 0.5), H, 1 - t * 0.2);
  });
  const last = T.levels[T.FLOORS - 1];
  y = last.y + last.h + last.roof;
  // Gilded spire.
  [[0.42, 0.15], [0.34, 0.26], [0.42, 0.1], [0.22, 0.3], [0.31, 0.26], [0.14, 0.32], [0.2, 0.2], [0.07, 0.42]].forEach(([rad, hh]) => {
    baker.add(new THREE.SphereGeometry(rad, 12, 8), m.gold, trs(cx, y + hh / 2, cz, 0, 0, 0, 1, Math.max(0.5, hh / (rad * 1.2)), 1), 0xd9ae5c);
    y += hh * 0.82;
  });
  baker.add(new THREE.ConeGeometry(0.06, 1.05, 8), m.gold, trs(cx, y + 0.5, cz), 0xe6c278);
  return y;
}

const beamBetween = (ax, ay, az, bx, by, bz) => new THREE.Matrix4()
  .lookAt(new THREE.Vector3(bx, by, bz), new THREE.Vector3(ax, ay, az), new THREE.Vector3(0, 1, 0))
  .setPosition((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);

function lotusBase(baker, m, x, y, z, R, height = 0.5) {
  baker.add(new THREE.CylinderGeometry(R * 0.82, R, height * 0.4, 12), m.paint, trs(x, y + height * 0.2, z), 0x8e2a1c);
  const petal = new THREE.SphereGeometry(1, 8, 5);
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2;
    baker.add(petal, m.gold, trs(x + Math.sin(a) * R * 0.78, y + height * 0.62, z + Math.cos(a) * R * 0.78, -0.65, a, 0, R * 0.2, height * 0.1, R * 0.32), k % 2 ? 0xe2b85e : 0xd9a24a);
  }
  baker.add(new THREE.CylinderGeometry(R * 0.68, R * 0.74, height * 0.3, 12), m.paint, trs(x, y + height * 0.85, z), 0xc99b48);
}
function lotusLamp(baker, m, x, y, z) {
  baker.add(new THREE.CylinderGeometry(0.1, 0.14, 0.1, 8), m.gold, trs(x, y + 0.05, z), 0xc99b48);
  baker.add(new THREE.SphereGeometry(0.07, 8, 6), m.glow, trs(x, y + 0.17, z, 0, 0, 0, 0.7, 1.4, 0.7), 0xffd27a);
}
function wheel(baker, m, x, y, z, R, ry) {
  baker.add(new THREE.TorusGeometry(R, R * 0.09, 8, 24), m.gold, trs(x, y, z, 0, ry), 0xd9ae5c);
  baker.add(new THREE.TorusGeometry(R * 0.22, R * 0.06, 6, 14), m.gold, trs(x, y, z, 0, ry), 0xd9ae5c);
  for (let k = 0; k < 8; k++) {
    const spin = new THREE.Matrix4().makeRotationY(ry).multiply(new THREE.Matrix4().makeRotationZ((k / 8) * Math.PI * 2));
    const piece = new THREE.BoxGeometry(R * 0.08, R, R * 0.06); piece.translate(0, R * 0.55, 0);
    baker.add(piece, m.gold, new THREE.Matrix4().makeTranslation(x, y, z).multiply(spin), 0xc99b48);
  }
}
function wallScroll(baker, m, cx, cz, L, a) {
  const d = L.apothem - 0.04; const y = L.y;
  const x = cx + Math.sin(a) * d; const z = cz + Math.cos(a) * d;
  baker.box(1.1, 2.1, 0.04, x, y + 1.95, z, m.paint, 0x8e2a1c, a);
  baker.box(1.25, 0.07, 0.07, x, y + 3.02, z, m.gold, 0xc99b48, a);
  baker.box(1.25, 0.07, 0.07, x, y + 0.88, z, m.gold, 0xc99b48, a);
  wheel(baker, m, x - Math.sin(a) * 0.05, y + 1.95, z - Math.cos(a) * 0.05, 0.36, a);
}
function hangingLantern(baker, m, cx, cz, top, drop) {
  baker.box(0.03, drop, 0.03, cx, top - drop / 2, cz, m.paint, 0x2b1a12);
  baker.add(new THREE.SphereGeometry(0.42, 12, 10), m.lantern, trs(cx, top - drop - 0.35, cz, 0, 0, 0, 1, 1.2, 1), 0xd8362a);
  baker.box(0.34, 0.06, 0.34, cx, top - drop + 0.1, cz, m.gold, 0xc99b48);
  baker.box(0.34, 0.06, 0.34, cx, top - drop - 0.82, cz, m.gold, 0xc99b48);
}
// Stairs and Buddhist furnishings inside the pagoda. Only the shell is mirrored in the water.
function addPagodaRooms(baker, m) {
  const T = WORLD.TOWER; const cx = T.x; const cz = T.z;
  for (const s of T.stairs) {
    const [ax, az, ay] = s.from; const [bx, bz, by] = s.to;
    const n = Math.round((by - ay) / 0.25);
    const ry = Math.atan2(bx - ax, bz - az);
    const nx = Math.cos(ry); const nz = -Math.sin(ry);
    for (let k = 0; k < n; k++) {
      const f = (k + 0.5) / n; const top = ay + ((by - ay) * (k + 1)) / n;
      baker.box(s.width, 0.14, Math.hypot(bx - ax, bz - az) / n * 1.1, ax + (bx - ax) * f, top - 0.07, az + (bz - az) * f, m.paint, k % 2 ? 0x6b3a22 : 0x75432a, ry);
    }
    for (const side of [-1, 1]) {
      const ox = nx * side * (s.width / 2 + 0.05); const oz = nz * side * (s.width / 2 + 0.05);
      baker.add(new THREE.BoxGeometry(0.1, 0.34, Math.hypot(bx - ax, by - ay, bz - az) + 0.25), m.paint, beamBetween(ax + ox, ay - 0.12, az + oz, bx + ox, by - 0.12, bz + oz), 0x4a2318);
      baker.add(new THREE.BoxGeometry(0.07, 0.07, Math.hypot(bx - ax, by - ay, bz - az)), m.paint, beamBetween(ax + ox, ay + 1, az + oz, bx + ox, by + 1, bz + oz), 0x8e2a1c);
      for (let k = 0; k <= 5; k++) {
        const f = k / 5;
        baker.box(0.06, 1, 0.06, ax + (bx - ax) * f + ox, ay + (by - ay) * f + 0.5, az + (bz - az) * f + oz, m.paint, 0x8e2a1c);
      }
    }
  }
  const free = [Math.PI * 0.25, Math.PI * 1.25];
  for (const L of T.levels) {
    const y = L.y; const top = y + L.h + L.roof - 0.02;
    // A lotus carpet, a hanging lantern and painted scrolls in every room.
    baker.add(new THREE.CylinderGeometry(L.centre + 0.75, L.centre + 0.75, 0.02, 24), m.paint, trs(cx, y + 0.015, cz), 0x8e2a1c);
    baker.add(new THREE.CylinderGeometry(L.centre + 0.5, L.centre + 0.5, 0.02, 24), m.paint, trs(cx, y + 0.025, cz), 0xc99b48);
    if (L.i > 0) {
      hangingLantern(baker, m, cx, cz, L.i === T.FLOORS - 1 ? y + L.h : top, 0.28);
      if (L.i !== 1) for (const a of free) wallScroll(baker, m, cx, cz, L, a);
    }
    const ring = (n, R) => { for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; lotusLamp(baker, m, cx + Math.sin(a) * R, y + 0.03, cz + Math.cos(a) * R); } };
    if (L.i === 0) {
      // The Buddha hall.
      baker.add(new THREE.CylinderGeometry(1.75, 1.85, 0.5, 8), m.paint, trs(cx, y + 0.25, cz, 0, Math.PI / 8), 0x8d8c80);
      lotusBase(baker, m, cx, y + 0.5, cz, 1.5, 0.75);
      addBuddha(baker, m, cx, y + 1.5, cz + 0.1, 1.25);
      ring(10, 2.1);
      hangingLantern(baker, m, cx + 4, cz, y + L.h + 0.1, 0.9);
      hangingLantern(baker, m, cx - 4, cz, y + L.h + 0.1, 0.9);
    } else if (L.i === 1) {
      // The sutra room: shelves of wrapped texts and a reading stand.
      for (const a of free) {
        const d = L.apothem - 0.3; const x = cx + Math.sin(a) * d; const z = cz + Math.cos(a) * d;
        baker.box(2.1, 2.6, 0.5, x, y + 1.3, z, m.paint, 0x4a2318, a);
        for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) {
          const u = -0.84 + col * 0.28;
          const col2 = [0xc9a24a, 0x9a2a1d, 0xe6dcc0, 0x7a2f20][(row + col) % 4];
          baker.box(0.22, 0.3, 0.1, x + Math.cos(a) * u - Math.sin(a) * 0.26, y + 0.5 + row * 0.56, z - Math.sin(a) * u - Math.cos(a) * 0.26, m.paint, col2, a);
        }
      }
      baker.box(0.9, 0.9, 0.6, cx, y + 0.45, cz, m.paint, 0x4a2318);
      baker.add(new THREE.BoxGeometry(0.85, 0.05, 0.6), m.paint, trs(cx, y + 0.97, cz, 0.2), 0xe6dcc0);
      baker.add(new THREE.SphereGeometry(0.2, 10, 8), m.paint, trs(cx + 0.72, y + 0.2, cz + 0.2, 0, 0, 0, 1, 0.7, 1), 0x8a4a1c);
      ring(6, 1.25);
    } else if (L.i === 2) {
      // Many small Buddhas on two walls, and a tall lamp in the middle.
      for (const a of free) {
        const d = L.apothem - 0.08; const x = cx + Math.sin(a) * d; const z = cz + Math.cos(a) * d;
        baker.box(2.1, 3, 0.1, x, y + 2, z, m.paint, 0x6b2519, a);
        for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
          const u = -0.75 + col * 0.5; const yy = y + 0.85 + row * 0.72;
          const px = x + Math.cos(a) * u - Math.sin(a) * 0.14; const pz = z - Math.sin(a) * u - Math.cos(a) * 0.14;
          baker.add(new THREE.SphereGeometry(0.17, 8, 6), m.gold, trs(px, yy, pz, 0, 0, 0, 1, 0.8, 0.6), 0xd9ae5c);
          baker.add(new THREE.SphereGeometry(0.1, 8, 6), m.gold, trs(px, yy + 0.2, pz), 0xe2c070);
        }
      }
      lotusBase(baker, m, cx, y, cz, 0.85, 0.5);
      baker.add(new THREE.CylinderGeometry(0.1, 0.16, 1.1, 8), m.gold, trs(cx, y + 1, cz), 0xc99b48);
      for (const [r, h] of [[0.5, 1.25], [0.34, 1.5]]) { baker.add(new THREE.CylinderGeometry(r, r * 0.8, 0.07, 10), m.gold, trs(cx, y + h, cz), 0xc99b48); for (let k = 0; k < 6; k++) { const a = (k / 6) * 6.28; lotusLamp(baker, m, cx + Math.sin(a) * r * 0.8, y + h + 0.03, cz + Math.cos(a) * r * 0.8); } }
    } else if (L.i === 3) {
      // The Dharma wheel.
      lotusBase(baker, m, cx, y, cz, 0.9, 0.6);
      wheel(baker, m, cx, y + 1.55, cz, 0.85, Math.PI / 4);
      ring(8, 1.3);
    } else if (L.i === 4) {
      // A small Buddha among lamps.
      lotusBase(baker, m, cx, y, cz, 0.9, 0.55);
      addBuddha(baker, m, cx, y + 1.02, cz, 0.72, Math.PI / 4);
      ring(12, 1.3);
    } else if (L.i === 5) {
      // A golden stupa.
      lotusBase(baker, m, cx, y, cz, 0.9, 0.5);
      let h = y + 0.5;
      for (const [r0, r1, tall] of [[0.72, 0.72, 0.25], [0.6, 0.72, 0.15], [0.52, 0.6, 0.5], [0.2, 0.3, 0.2], [0.26, 0.26, 0.05], [0.04, 0.2, 0.75]]) { baker.add(new THREE.CylinderGeometry(r0, r1, tall, 12), m.gold, trs(cx, h + tall / 2, cz), 0xd9ae5c); h += tall; }
      baker.add(new THREE.SphereGeometry(0.08, 10, 8), m.gold, trs(cx, h + 0.05, cz), 0xf0d48c);
      ring(8, 1.3);
    } else {
      // The top room.
      lotusBase(baker, m, cx, y, cz, 0.9, 0.55);
      addBuddha(baker, m, cx, y + 1.02, cz, 0.72, Math.PI / 4);
      ring(8, 1.3);
    }
  }
}
// Incense urns, paper furnaces and the free table in the Guest hall.
function addOfferingPlaces(baker, m) {
  const O = WORLD.OFFERINGS;
  const bronze = 0x5b5337; const dark = 0x3f3a28;
  for (const { x, z, y } of O.incense) {
    baker.add(new THREE.CylinderGeometry(1.25, 1.35, 0.26, 8), m.paint, trs(x, y + 0.13, z, 0, Math.PI / 8), 0x8d8c80);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * 6.283 + 0.5;
      baker.add(new THREE.CylinderGeometry(0.15, 0.09, 0.55, 8), m.gold, trs(x + Math.sin(a) * 0.62, y + 0.5, z + Math.cos(a) * 0.62), bronze);
    }
    const bowl = new THREE.LatheGeometry([[0.01, 0], [0.55, 0], [0.9, 0.3], [1.02, 0.65], [0.92, 0.9], [0.84, 0.95], [0.98, 1.06]].map(([r, h]) => new THREE.Vector2(r, h)), 20);
    baker.add(bowl, m.gold, trs(x, y + 0.68, z), bronze);
    baker.add(new THREE.CylinderGeometry(0.93, 0.93, 0.03, 20), m.paint, trs(x, y + 1.7, z), 0xb8ad97);
    baker.add(new THREE.TorusGeometry(0.3, 0.06, 6, 14), m.gold, trs(x + 1.08, y + 1.5, z, 0, Math.PI / 2), dark);
    baker.add(new THREE.TorusGeometry(0.3, 0.06, 6, 14), m.gold, trs(x - 1.08, y + 1.5, z, 0, Math.PI / 2), dark);
  }
  for (const { x, z, y } of O.votive) {
    baker.add(new THREE.CylinderGeometry(1.38, 1.45, 0.3, 8), m.paint, trs(x, y + 0.15, z, 0, Math.PI / 8), 0x8d8c80);
    const body = new THREE.CylinderGeometry(1.0, 1.18, 2.7, 8);
    baker.add(body, m.paint, trs(x, y + 1.65, z, 0, Math.PI / 8), (px, py) => (Math.floor((py - y) / 0.28) % 2 ? 0x9a4a30 : 0x8a3f28));
    baker.box(0.96, 1.15, 0.05, x, y + 0.95, z + 1.09, m.paint, 0x140c08);
    baker.box(1.16, 0.1, 0.12, x, y + 1.56, z + 1.09, m.gold, 0xc99b48);
    baker.box(0.1, 1.2, 0.12, x - 0.53, y + 0.96, z + 1.09, m.gold, 0xc99b48);
    baker.box(0.1, 1.2, 0.12, x + 0.53, y + 0.96, z + 1.09, m.gold, 0xc99b48);
    const roof = new THREE.ConeGeometry(1.7, 0.9, 8);
    baker.add(roof, m.paint, trs(x, y + 3.45, z, 0, Math.PI / 8), 0x6e3a24);
    baker.add(new THREE.CylinderGeometry(0.42, 0.5, 0.5, 8), m.paint, trs(x, y + 4.05, z), 0x6b3a22);
    baker.add(new THREE.SphereGeometry(0.16, 10, 8), m.gold, trs(x, y + 4.42, z), 0xc99b48);
  }
  const t = O.table;
  baker.box(4.4, 0.1, 1.5, t.x, t.y + 0.85, t.z, m.paint, 0x5a2a1a);
  baker.box(4.2, 0.8, 1.3, t.x, t.y + 0.4, t.z, m.paint, 0x7a2118);
  // Three jars of incense sticks.
  for (const dx of [-1.6, -0.9, -0.2]) {
    baker.add(new THREE.CylinderGeometry(0.2, 0.17, 0.42, 12), m.gold, trs(t.x + dx, t.y + 1.11, t.z), 0xc99b48);
    for (let k = 0; k < 16; k++) {
      const a = k * 2.4; const r = 0.03 + k * 0.009;
      baker.box(0.02, 0.8, 0.02, t.x + dx + Math.cos(a) * r, t.y + 1.5, t.z + Math.sin(a) * r, m.paint, k % 3 ? 0xa8341f : 0xd97a3a);
    }
  }
  // Stacks of plain gold and red paper with a lotus mark. They do not copy any real money.
  for (const dx of [0.6, 1.3]) {
    for (let k = 0; k < 9; k++) baker.box(0.56, 0.035, 0.36, t.x + dx, t.y + 0.92 + k * 0.035, t.z, m.paint, k % 2 ? 0xd9ae5c : 0xb4301f, k % 3 ? 0.03 : -0.05);
    baker.add(new THREE.SphereGeometry(0.1, 8, 5), m.gold, trs(t.x + dx, t.y + 1.25, t.z, 0, 0, 0, 1, 0.3, 1), 0xf0d48c);
  }
}

function seeded(seed) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}

function rockGeometry(rnd) {
  const g = new THREE.IcosahedronGeometry(1, 1);
  const p = g.attributes.position;
  const seen = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!seen.has(key)) seen.set(key, 0.75 + rnd() * 0.42);
    const f = seen.get(key);
    p.setXYZ(i, p.getX(i) * f, p.getY(i) * f, p.getZ(i) * f);
  }
  const n = g.index ? g.toNonIndexed() : g;
  n.computeVertexNormals();
  return n;
}

function addRock(baker, m, x, z, sx, sy, sz, rnd, y = 0, color = 0x7d7c74) {
  const hex = new THREE.Color(color).offsetHSL(0, 0, (rnd() - 0.5) * 0.08).getHex();
  baker.add(rockGeometry(rnd), m.paint, trs(x, y + sy * 0.45, z, rnd(), rnd() * 6, rnd() * 0.4, sx, sy, sz), hex);
}

function addTree(baker, m, x, z, s, leaf = 0x4e7a44, y = 0) {
  baker.add(new THREE.CylinderGeometry(0.28 * s, 0.5 * s, 3.8 * s, 7), m.paint, trs(x, y + 1.9 * s, z), 0x4a3829);
  const rnd = seeded(Math.floor(Math.abs(x * 137 + z * 73)) + 3);
  for (let i = 0; i < 10; i++) {
    const a = rnd() * Math.PI * 2;
    const r = rnd() * 2.1 * s;
    baker.add(new THREE.IcosahedronGeometry((1.15 + rnd() * 0.9) * s, 1), m.leaf,
      trs(x + Math.cos(a) * r, y + (3.6 + rnd() * 2.6) * s, z + Math.sin(a) * r, 0, 0, 0, 1, 0.74, 1),
      new THREE.Color(leaf).offsetHSL((rnd() - 0.5) * 0.03, 0, (rnd() - 0.5) * 0.09).getHex());
  }
}

// A shaped garden pine: leaning trunk, flat pads of needles.
function addPine(baker, m, x, z, s, y = 0) {
  const rnd = seeded(Math.floor(Math.abs(x * 91 + z * 57)) + 5);
  const lean = (rnd() - 0.5) * 1.3;
  const trunk = new THREE.CatmullRomCurve3([
    new THREE.Vector3(x, y, z),
    new THREE.Vector3(x + lean * 0.7 * s, y + 1.5 * s, z),
    new THREE.Vector3(x + lean * 0.1 * s, y + 3 * s, z + 0.3 * s),
    new THREE.Vector3(x + lean * s, y + 4.4 * s, z),
  ]);
  baker.add(new THREE.TubeGeometry(trunk, 12, 0.2 * s, 7), m.paint, null, 0x4e3b2c);
  for (let i = 0; i < 6; i++) {
    const a = rnd() * 6.28;
    const r = (0.6 + rnd() * 1.5) * s;
    const yy = y + (2.4 + i * 0.48) * s;
    baker.add(new THREE.IcosahedronGeometry(1, 1), m.leaf,
      trs(x + lean * 0.5 * s + Math.cos(a) * r, yy, z + Math.sin(a) * r, 0, a, 0, (1 + rnd() * 0.5) * s, 0.28 * s, (0.8 + rnd() * 0.3) * s),
      new THREE.Color(0x35593c).offsetHSL(0, 0, (rnd() - 0.5) * 0.06).getHex());
  }
}

function addBamboo(baker, m, cx, cz, count) {
  const rnd = seeded(Math.floor(Math.abs(cx * 31 + cz * 53)) + 3);
  for (let i = 0; i < count; i++) {
    const x = cx + (rnd() - 0.5) * 3.4;
    const z = cz + (rnd() - 0.5) * 3.4;
    const h = 6 + rnd() * 4;
    const tilt = (rnd() - 0.5) * 0.14;
    baker.add(new THREE.CylinderGeometry(0.035, 0.07, h, 5), m.paint, trs(x, h / 2, z, tilt, 0, tilt), 0x7a9650);
    for (let k = 0; k < 4; k++) {
      const yy = h * (0.6 + k * 0.1);
      baker.add(new THREE.IcosahedronGeometry(0.62, 0), m.leaf,
        trs(x + tilt * yy + (rnd() - 0.5) * 0.7, yy, z + (rnd() - 0.5) * 0.7, rnd(), rnd(), 0, 1, 0.5, 1),
        new THREE.Color(0x5d8a42).offsetHSL(0, 0, (rnd() - 0.5) * 0.08).getHex());
    }
  }
}

// Karesansui: raked gravel lines that flow in rings around each stone group.
const GRAVEL_WEST = [[-38, 80, 3.6], [-21, 92, 2.5], [-15, 75, 2]];
const GRAVEL_EAST = [[33, 91, 3.8], [18, 78, 2.4], [42, 74, 2]];

function gravelMaterial(x0, x1, z0, z1, stones) {
  const W = 1024;
  const H = Math.round((W * (z1 - z0)) / (x1 - x0));
  const texture = canvasTexture(W, (g) => {
    const c = g.canvas;
    c.height = H;
    const sx = W / (x1 - x0);
    const sz = H / (z1 - z0);
    g.fillStyle = '#d9d6c9';
    g.fillRect(0, 0, W, H);
    g.lineWidth = 2.2;
    for (let z = 0; z < z1 - z0; z += 0.42) {
      g.strokeStyle = 'rgba(112,108,92,.38)';
      g.beginPath();
      g.moveTo(0, z * sz);
      g.lineTo(W, z * sz);
      g.stroke();
      g.strokeStyle = 'rgba(255,255,248,.5)';
      g.beginPath();
      g.moveTo(0, z * sz + 3);
      g.lineTo(W, z * sz + 3);
      g.stroke();
    }
    for (const [x, z, r] of stones) {
      const px = (x - x0) * sx;
      const py = (z - z0) * sz;
      const rings = 8;
      const outer = r + rings * 0.42;
      g.fillStyle = '#d9d6c9';
      g.beginPath();
      g.ellipse(px, py, outer * sx, outer * sz, 0, 0, 7);
      g.fill();
      for (let k = 0; k <= rings; k++) {
        const rr = r + k * 0.42;
        g.strokeStyle = 'rgba(112,108,92,.42)';
        g.beginPath();
        g.ellipse(px, py, rr * sx, rr * sz, 0, 0, 7);
        g.stroke();
        g.strokeStyle = 'rgba(255,255,248,.5)';
        g.beginPath();
        g.ellipse(px, py, rr * sx + 3, rr * sz + 3, 0, 0, 7);
        g.stroke();
      }
    }
    for (let i = 0; i < 4000; i++) {
      g.fillStyle = i % 2 ? 'rgba(90,86,74,.06)' : 'rgba(255,255,255,.08)';
      g.fillRect((i * 7919) % W, (i * 104729) % H, 2, 2);
    }
  }, false);
  return new THREE.MeshLambertMaterial({ map: texture });
}

function gravelPlane(baker, material, x0, x1, z0, z1) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
  g.rotateX(-Math.PI / 2);
  baker.add(g, material, trs((x0 + x1) / 2, 0.03, (z0 + z1) / 2));
}

function addZenGarden(baker, m) {
  const west = gravelMaterial(-50, -2.5, 68.5, 104, GRAVEL_WEST);
  const east = gravelMaterial(2.5, 50, 68.5, 104, GRAVEL_EAST);
  gravelPlane(baker, west, -50, -2.5, 68.5, 104);
  gravelPlane(baker, east, 2.5, 50, 68.5, 104);
  // Stone path and viewing deck.
  baker.add(planeXZ(-2.5, 2.5, 68.5, 100.2, 0.05, 0.3), m.paint, null, 0x9a988b);
  baker.add(planeXZ(-44, 44, 63.4, 68.5, 0.055, 0.5), m.floor);
  // Stepping-stone edges and low dark kerbs.
  for (const [a, b, c, d] of [[-2.6, 68.5, -2.6, 100], [2.6, 68.5, 2.6, 100], [-50, 68.6, -2.6, 68.6], [2.6, 68.6, 50, 68.6]]) {
    wallPiece(baker, m.paint, a, b, c, d, 0, 0.12, 0.22, 0x55554e);
  }
  const rnd = seeded(77);
  for (const [x, z, r] of [...GRAVEL_WEST, ...GRAVEL_EAST]) {
    baker.add(new THREE.CircleGeometry(r * 0.95, 20).rotateX(-Math.PI / 2), m.paint, trs(x, 0.05, z), 0x5d7a45);
    addRock(baker, m, x, z, r * 0.55, r * 0.92, r * 0.46, rnd, 0, 0x6f6e68);
    addRock(baker, m, x + r * 0.55, z + r * 0.3, r * 0.34, r * 0.42, r * 0.32, rnd, 0, 0x76756c);
    addRock(baker, m, x - r * 0.5, z - r * 0.18, r * 0.28, r * 0.28, r * 0.3, rnd, 0, 0x83827a);
  }
  // Moss banks and shaped pines along the walls.
  for (const x of [-46, -30, -13, 13, 28, 46]) {
    addPine(baker, m, x, 102, 1.25);
    baker.add(new THREE.SphereGeometry(1, 12, 6, 0, 6.3, 0, 1.57), m.leaf, trs(x, 0.02, 102, 0, 0, 0, 3.8, 0.55, 1.4), 0x56733f);
  }
  addPine(baker, m, -8, 72, 1.1);
  addPine(baker, m, 8, 72, 1.1);
}

function addPond(baker, reflected, m, scene) {
  const P = WORLD.POND;
  const [x0, x1, z0, z1] = P.rect;
  // Stone kerb around the water.
  for (const [a, b, c, d] of [[x0, z0, x1, z0], [x0, z1, x1, z1], [x0, z0, x0, z1], [x1, z0, x1, z1]]) {
    wallPiece(baker, m.paint, a, b, c, d, -0.25, 0.26, 0.5, 0x8b897c);
  }
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(x1 - x0, z1 - z0),
    new THREE.MeshPhongMaterial({ color: 0x2f6a70, specular: 0xdff2f2, shininess: 120, transparent: true, opacity: 0.56, depthWrite: false })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set((x0 + x1) / 2, P.waterY, (z0 + z1) / 2);
  water.renderOrder = 2;
  scene.add(water);

  // Lotus at the corners, leaving open water for the koi.
  const rnd = seeded(23);
  for (const [cx, cz, rx, rz, count] of [[-23, 43, 6, 6, 26], [23, 43, 6, 6, 26], [-24, -9, 5, 6, 22], [24, -9, 5, 6, 22]]) {
    for (let i = 0; i < count; i++) {
      const x = cx + (rnd() - 0.5) * rx * 2;
      const z = cz + (rnd() - 0.5) * rz * 2;
      const r = 0.42 + rnd() * 0.45;
      baker.add(new THREE.CylinderGeometry(r, r * 0.98, 0.012, 10), m.paint, trs(x, P.waterY + 0.03, z), new THREE.Color(0x4f8347).offsetHSL(0, 0, (rnd() - 0.5) * 0.1).getHex());
      if (i % 4 === 0) {
        const fx = x + 0.15;
        baker.add(new THREE.CylinderGeometry(0.012, 0.014, 0.5, 4), m.paint, trs(fx, P.waterY + 0.25, z), 0x5a7a4b);
        for (let p = 0; p < 6; p++) {
          const a = (p / 6) * Math.PI * 2;
          baker.add(new THREE.SphereGeometry(0.09, 6, 5), m.paint, trs(fx + Math.cos(a) * 0.08, P.waterY + 0.54, z + Math.sin(a) * 0.08, Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4, 0.6, 1.35, 0.6), p % 2 ? 0xef9fb0 : 0xf6c4cc);
        }
      }
    }
  }

  // Island: stone wall, tiled top, rocks and small pines. These are reflected.
  const y = WORLD.get('island').elevation;
  const [ix0, ix1, iz0, iz1] = WORLD.get('island').rect;
  const iw = ix1 - ix0 + 1.2;
  const id = iz1 - iz0 + 1.2;
  const g = new THREE.BoxGeometry(iw, y + 0.6, id);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * iw * 0.4, uv.getY(i));
  reflected.add(g, m.brick, trs((ix0 + ix1) / 2, (y - 0.6) / 2, (iz0 + iz1) / 2), 0xb9b3a5);
  reflected.add(planeXZ(ix0 - 0.6, ix1 + 0.6, iz0 - 0.6, iz1 + 0.6, y + 0.005, 0.5), m.floor);
  const rock = seeded(41);
  for (let i = 0; i < 26; i++) {
    const side = i % 4;
    const t = rock();
    const x = side < 2 ? ix0 - 0.6 + t * iw : side === 2 ? ix0 - 0.7 : ix1 + 0.7;
    const z = side >= 2 ? iz0 - 0.6 + t * id : side === 0 ? iz0 - 0.7 : iz1 + 0.7;
    if (Math.abs(x) < 3) continue;
    addRock(reflected, m, x, z, 0.8 + rock() * 1.1, 0.8 + rock() * 1, 0.8 + rock() * 1.1, rock, -0.15);
  }
  for (const [x, z, s] of [[-9.6, 7.5, 0.95], [9.6, 7.5, 0.9], [-9.6, 27.4, 0.8], [9.6, 27.4, 0.85]]) addPine(reflected, m, x, z, s, y);

  // Bridges with stone posts along the axis.
  const deck = 0.55;
  for (const [z0b, z1b] of [[29.6, 50.2], [-16.2, 5.4]]) {
    const len = z1b - z0b;
    const cz = (z0b + z1b) / 2;
    reflected.box(4.2, 0.2, len, 0, deck - 0.09, cz, m.paint, 0x9a988b);
    reflected.add(planeXZ(-2, 2, z0b, z1b, deck + 0.015, 0.3), m.paint, null, 0xa5a397);
    for (const side of [-2.1, 2.1]) {
      reflected.box(0.11, 0.09, len, side, deck + 0.68, cz, m.paint, 0x77756a);
      for (let z = z0b; z <= z1b + 0.01; z += len / 6) {
        reflected.box(0.24, 0.8, 0.24, side, deck + 0.36, z, m.paint, 0x88877c);
        reflected.add(new THREE.SphereGeometry(0.15, 8, 6), m.paint, trs(side, deck + 0.86, z), 0x98978b);
      }
    }
    for (let z = z0b + 2; z < z1b; z += 5) reflected.box(3.2, 1, 0.5, 0, deck - 0.65, z, m.paint, 0x75746a);
  }
  addTower(reflected, m, P.tower.x, P.tower.z);
}

// The approach: a stone avenue, wide steps, and a great three-bay gate on a terrace.
function addEntrance(baker, m) {
  const Y = 1.8;
  // Terrace.
  baker.box(19, Y, 11, 0, Y / 2, 108.25, m.brick, 0xd6c7ae);
  baker.box(19.4, 0.14, 11.4, 0, Y + 0.02, 108.25, m.paint, 0x8b897c);
  baker.add(planeXZ(-9.3, 9.3, 102.8, 113.7, Y + 0.1, 0.5), m.floor);
  const north = 10;
  for (let i = 0; i < north; i++) {
    const h = 1.8 * ((north - i) / north);
    baker.box(5.2, h, 0.37, 0, h / 2, 103 - i * 0.34, m.paint, i % 2 ? 0x90897a : 0x9a9485);
  }

  // Gate: tall centre bay with a two-tier roof, lower side bays.
  const z = 108;
  const y = Y + 0.1;
  for (const x of [-3.6, 3.6]) for (const dz of [-1.5, 1.5]) addColumn(baker, m, x, y, z + dz, 7.4, 0.3);
  wallPiece(baker, m.paint, -3.6, z, 3.6, z, y + 5.5, y + 7.5, 0.38, LACQUER);
  wallPiece(baker, m.gold, -3.6, z, 3.6, z, y + 5.25, y + 5.5, 0.42, 0xc99b48);
  const center = { x0: -3.6, x1: 3.6, z0: z - 1.8, z1: z + 1.8, ridgeAxis: 'x', ridgeH: 2.1 };
  addRoof(baker, m, center, y + 7.45, 1.5, 0.85, {});
  addRoof(baker, m, { ...center, ridgeH: 1 }, y + 5.55, 2.2, 0.7, { tier: 1 });
  for (const side of [-1, 1]) {
    const x0 = side * 3.6;
    const x1 = side * 9;
    for (const dz of [-1.1, 1.1]) addColumn(baker, m, x1, y, z + dz, 4.8, 0.22);
    wallPiece(baker, m.paint, x0, z, x1, z, y + 3.2, y + 4.9, 0.3, LACQUER);
    wallPiece(baker, m.brick, side * 6.6, z, x1, z, y, y + 3.2, 0.4);
    const bay = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: z - 1.4, z1: z + 1.4, ridgeAxis: 'x', ridgeH: 1.2 };
    addRoof(baker, m, bay, y + 4.85, 0.9, 0.6, { ornament: false, tier: 1 });
    // Pillar towers mark the corners of the terrace.
    for (const [px, pz] of [[side * 11.8, 113], [side * 13, 106]]) {
      baker.box(1.4, 6.6, 1.4, px, 3.3, pz, m.brick, 0xdfd1b7);
      baker.box(1.9, 0.26, 1.9, px, 6.7, pz, m.paint, STONE);
      baker.add(new THREE.ConeGeometry(0.9, 1, 4), m.paint, trs(px, 7.3, pz, 0, Math.PI / 4), 0x4f3a2b);
      baker.add(new THREE.SphereGeometry(0.3, 12, 8), m.gold, trs(px, 8, pz), 0xc99b48);
    }
  }

}
// A plain wooden box on a stand. Its label is added in main.js, in the visitor's language.
function addWishBoxes(baker, m) {
  for (const box of WORLD.WISH_BOXES) {
    const y = WORLD.elevationAt(box.x, box.z);
    baker.box(0.62, 0.62, 0.5, box.x, y + 0.31, box.z, m.paint, 0x4a2a1a);
    baker.box(0.86, 0.64, 0.66, box.x, y + 0.94, box.z, m.paint, 0x7a2118);
    baker.box(0.9, 0.05, 0.7, box.x, y + 1.27, box.z, m.gold, 0xc99b48);
    baker.box(0.9, 0.05, 0.7, box.x, y + 0.63, box.z, m.gold, 0xc99b48);
    baker.box(0.34, 0.012, 0.05, box.x, y + 1.305, box.z, m.paint, 0x161210);
  }
}

function addShrub(baker, m, x, z, r, color, rnd) {
  baker.add(new THREE.IcosahedronGeometry(1, 1), m.leaf, trs(x, r * 0.5, z, 0, rnd() * 6, 0, r * 1.15, r * 0.72, r),
    new THREE.Color(color).offsetHSL((rnd() - 0.5) * 0.02, 0, (rnd() - 0.5) * 0.06).getHex());
}

// Flowers, shrubs, lawns and small trees, so the courts feel planted rather than paved.
function addCourtGardens(baker, m) {
  const rnd = seeded(101);
  const lawn = (x0, x1, z0, z1, color = 0x668a4c) => baker.add(planeXZ(x0, x1, z0, z1, 0.005, 0.2), m.paint, null, color);
  lawn(-57.5, -41, 23, 60.5);
  lawn(41, 57.5, 23, 60.5);
  lawn(-57.5, -41, -89, -1);
  lawn(41, 57.5, -89, -1);
  lawn(-40, 57.5, -89, -32, 0x6b8f50);
  lawn(16.5, 40, -32, -23);
  const azalea = [0xd65f8a, 0xe88aa6, 0xc94f6f, 0xf0b3c2, 0xe4dfd2];
  // Flowering borders along both garden lawns by the pond court.
  for (const side of [-1, 1]) {
    for (let z = 25; z < 60; z += 2.4) {
      addShrub(baker, m, side * 43, z, 0.8 + rnd() * 0.3, z % 3 < 1.2 ? azalea[Math.floor(rnd() * azalea.length)] : 0x4f7a45, rnd);
    }
    for (let i = 0; i < 16; i++) addShrub(baker, m, side * (45 + rnd() * 11), 26 + rnd() * 33, 0.7 + rnd() * 0.9, rnd() > 0.55 ? azalea[Math.floor(rnd() * azalea.length)] : 0x4e7a44, rnd);
    addPine(baker, m, side * 50, 45, 1.4);
    addPine(baker, m, side * 48, 31, 1.15);
    addRock(baker, m, side * 53, 37, 1.4, 1.5, 1.2, rnd, 0, 0x75746b);
    addRock(baker, m, side * 46, 53, 1, 0.9, 1.1, rnd, 0, 0x7d7c73);
    // Beds in the lawn behind the side halls.
    for (let z = -6; z > -88; z -= 7) {
      if (rnd() > 0.35) addShrub(baker, m, side * (44 + rnd() * 12), z, 0.9 + rnd() * 0.9, rnd() > 0.5 ? azalea[Math.floor(rnd() * 5)] : 0x4e7a44, rnd);
    }
    // Clipped trees and pots along the banks facing the water.
    for (let z = -12; z <= 46; z += 11.6) {
      baker.add(new THREE.CylinderGeometry(0.42, 0.3, 0.55, 12), m.paint, trs(side * 36.9, 0.28, z), 0x4f6d78);
      addShrub(baker, m, side * 36.9, z + 0, 0.65, 0x4a7c3f, rnd);
      baker.add(new THREE.CylinderGeometry(0.04, 0.05, 0.5, 5), m.paint, trs(side * 36.9, 0.6, z), 0x4e3b2c);
      baker.add(new THREE.IcosahedronGeometry(0.62, 1), m.leaf, trs(side * 36.9, 1.15, z), 0x4f8346);
    }
    // Pots either side of the Tam quan.
    baker.add(new THREE.CylinderGeometry(0.55, 0.4, 0.7, 12), m.paint, trs(side * 4.2, 0.35, 52.6), 0x4f6d78);
    addPine(baker, m, side * 4.2, 52.6, 0.42, 0.65);
  }
  // Rear garden: a winding planted court behind the main hall, with a small tea garden.
  for (const [x, z, s] of [[-30, -72, 1.3], [24, -48, 1.2], [36, -60, 1.4], [14, -56, 1.05], [-27, -46, 1.2]]) addPine(baker, m, x, z, s);
  for (let i = 0; i < 44; i++) {
    const x = -38 + rnd() * 76;
    const z = -87 + rnd() * 24;
    if (Math.abs(x) < 17 && z > -83) continue;
    addShrub(baker, m, x, z, 0.8 + rnd() * 1.1, rnd() > 0.45 ? azalea[Math.floor(rnd() * 5)] : 0x4e7a44, rnd);
  }
  for (let i = 0; i < 30; i++) addShrub(baker, m, 18 + rnd() * 20, -60 + rnd() * 26, 0.7 + rnd() * 0.9, rnd() > 0.5 ? azalea[Math.floor(rnd() * 5)] : 0x56803f, rnd);

  // Zen garden: moss islands, more stone settings, and flowering borders against the wall.
  const stone = (x, z, r) => {
    baker.add(new THREE.CircleGeometry(r * 1.3, 18).rotateX(-Math.PI / 2), m.paint, trs(x, 0.05, z), 0x5d7a45);
    addRock(baker, m, x, z, r * 0.6, r * 0.7, r * 0.55, rnd, 0, 0x6f6e68);
  };
  stone(-44, 92, 1.3); stone(-28, 73, 1.1); stone(44, 86, 1.3); stone(26, 72, 1);
  for (const side of [-1, 1]) {
    for (let x = 15; x < 50; x += 2.6) addShrub(baker, m, side * x, 104.6, 0.85 + rnd() * 0.4, x % 5 < 2.6 ? azalea[Math.floor(rnd() * 5)] : 0x48703e, rnd);
    for (let z = 72; z < 104; z += 2.8) addShrub(baker, m, side * 49.3, z, 0.8 + rnd() * 0.4, z % 7 < 2.8 ? azalea[Math.floor(rnd() * 5)] : 0x48703e, rnd);
    addBamboo(baker, m, side * 52.5, 92, 10);
    addBamboo(baker, m, side * 53, 75, 8);
  }
}

// A forest all around the site: thousands of simple trees in two draw calls.
function addForest(scene, count) {
  const rnd = seeded(2027);
  const broad = new THREE.IcosahedronGeometry(1, 0).toNonIndexed();
  const pos = broad.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i); const y = pos.getY(i); const z = pos.getZ(i);
    const n = 1 + Math.sin(x * 5.1 + y * 3.3) * 0.08 + Math.cos(z * 4.7 + y * 2.1) * 0.08;
    pos.setXYZ(i, x * n, y * n, z * n);
  }
  broad.computeVertexNormals();
  const cone = new THREE.ConeGeometry(1, 1, 6, 1);
  const material = new THREE.MeshLambertMaterial();
  snowify(material, { rooms: false, sway: true });
  const broadMesh = new THREE.InstancedMesh(broad, material, Math.floor(count * 0.72));
  const coneMesh = new THREE.InstancedMesh(cone, material, count - broadMesh.count);
  const clear = (x, z) => (Math.abs(x) < 61 && z > -93 && z < 109) || (Math.abs(x) < 16 && z < 182);
  const tones = [0x3f6b39, 0x4a7a40, 0x365f34, 0x54834a, 0x2f5532, 0x5e8c4f];
  const c = new THREE.Color();
  const place = (mesh, i, sMin, sMax, tall) => {
    let x; let z;
    do {
      const a = rnd() * Math.PI * 2;
      const r = 62 + Math.pow(rnd(), 0.65) * 300;
      x = Math.sin(a) * r;
      z = Math.cos(a) * r;
    } while (clear(x, z));
    const s = sMin + rnd() * (sMax - sMin);
    const h = s * tall;
    mesh.setMatrixAt(i, trs(x, h * (mesh === coneMesh ? 0.5 : 0.8), z, 0, rnd() * 6, 0, s, h, s));
    mesh.setColorAt(i, c.set(tones[Math.floor(rnd() * tones.length)]).offsetHSL(0, 0, (rnd() - 0.5) * 0.05));
  };
  for (let i = 0; i < broadMesh.count; i++) place(broadMesh, i, 3.2, 6.4, 1.05);
  for (let i = 0; i < coneMesh.count; i++) place(coneMesh, i, 2.4, 4, 4.2);
  for (const mesh of [broadMesh, coneMesh]) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = false;
    mesh.frustumCulled = false;
    scene.add(mesh);
  }
}

// Soft drifting clouds, painted once and reused.
function addClouds(scene) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = 256;
  const g = canvas.getContext('2d');
  const rnd = seeded(404);
  for (let i = 0; i < 70; i++) {
    const t = rnd();
    const x = size * (0.1 + t * 0.8);
    const spread = Math.sin(t * Math.PI);
    const y = 165 - rnd() * 95 * spread;
    const r = (22 + rnd() * 58) * (0.45 + spread * 0.75);
    const grad = g.createRadialGradient(x, y, 1, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,.34)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const clouds = [];
  for (let i = 0; i < 26; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, fog: false, opacity: 0.9 }));
    const a = rnd() * Math.PI * 2;
    const r = 180 + rnd() * 330;
    const w = 150 + rnd() * 210;
    sprite.position.set(Math.sin(a) * r, 92 + rnd() * 130, Math.cos(a) * r);
    sprite.scale.set(w, w * 0.42, 1);
    sprite.renderOrder = -0.5;
    sprite.userData.speed = 0.7 + rnd() * 1.3;
    scene.add(sprite);
    clouds.push(sprite);
  }
  return clouds;
}

function addLandscape(baker, m) {
  const [px0, px1, pz0, pz1] = WORLD.POND.rect;
  const G = 0x4c7240;
  // Fields and earth beyond the walls, with the pond cut out so water shows.
  baker.add(planeXZ(-60, px0, -92, 108, -0.03, 0.2), m.paint, null, G);
  baker.add(planeXZ(px1, 60, -92, 108, -0.03, 0.2), m.paint, null, G);
  baker.add(planeXZ(px0, px1, pz1, 108, -0.03, 0.2), m.paint, null, G);
  baker.add(planeXZ(px0, px1, -92, pz0, -0.03, 0.2), m.paint, null, G);
  // Paved banks, entrance path and rear courts.
  baker.add(planeXZ(-38, px0, -22, 54, 0.012, 0.5), m.floor);
  baker.add(planeXZ(px1, 38, -22, 54, 0.012, 0.5), m.floor);
  baker.add(planeXZ(-38, 38, pz1, 54, 0.012, 0.5), m.floor);
  baker.add(planeXZ(-38, 38, -22, pz0, 0.012, 0.5), m.floor);
  baker.add(planeXZ(-3, 3, 54, 64, 0.014, 0.5), m.floor);
  baker.add(planeXZ(-16.5, -9.5, -62, -22, 0.014, 0.5), m.floor);
  baker.add(planeXZ(38, 47.5, -30.5, -17.5, 0.014, 0.5), m.floor);
  baker.add(planeXZ(-52.5, -43.5, 61.5, 72.5, 0.014, 0.5), m.floor);
  baker.add(planeXZ(43.5, 52.5, 61.5, 72.5, 0.014, 0.5), m.floor);

  // Outer wall, and the inner wall that divides garden from pond court.
  const wall = (x0, z0, x1, z1) => {
    wallPiece(baker, m.brick, x0, z0, x1, z1, 0, 2.15, 0.34);
    wallPiece(baker, m.paint, x0, z0, x1, z1, 2.15, 2.32, 0.6, 0x4f3a2b);
  };
  wall(-58, 106, -13.5, 106);
  wall(13.5, 106, 58, 106);
  wall(-58, 106, -58, -90);
  wall(58, 106, 58, -90);
  wall(-58, -90, 58, -90);
  wall(-58, 61, -7.6, 61);
  wall(7.6, 61, 58, 61);
  // Covered walkways frame the pond's long sides, as in the reference plan.
  addCorridor(baker, m, -39.6, -16, -39.6, 0);
  addCorridor(baker, m, -39.6, 22, -39.6, 56);
  addCorridor(baker, m, 39.6, -16, 39.6, 0);
  addCorridor(baker, m, 39.6, 22, 39.6, 56);

  // Trees and bamboo.
  for (const [x, z, s] of [[-50, 40, 1.5], [50, 42, 1.6], [-48, -18, 1.5], [52, -14, 1.4], [-30, -58, 1.7], [30, -55, 1.8], [40, -74, 1.5], [-42, -78, 1.5]]) {
    addTree(baker, m, x, z, s, 0x4a7740);
  }
  for (const [x, z, n] of [[-49, 30, 14], [49, 32, 14], [22, -42, 14], [-52, -40, 14], [50, -40, 14], [25, -72, 12]]) addBamboo(baker, m, x, z, n);

}

function addSky(scene) {
  const material = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: new THREE.Color() }, low: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    // Mirrored about the horizon, so the water reflects the sky too.
    fragmentShader: 'varying vec3 p; uniform vec3 top; uniform vec3 low; void main(){ float t = clamp(abs(p.y)*1.5,0.,1.); gl_FragColor = vec4(mix(low, top, pow(t,.7)),1.); }',
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), material);
  sky.renderOrder = -1;
  sky.frustumCulled = false;
  scene.add(sky);
  return material;
}

// The reflection: an upside-down copy of the tower under a translucent water
// surface. It costs a few draw calls and works on any phone.
function mirrorMeshes(meshes, scene, waterY) {
  const cache = new Map();
  for (const source of meshes) {
    const g = source.geometry.clone();
    const p = g.attributes.position;
    const n = g.attributes.normal;
    for (let i = 0; i < p.count; i++) {
      // Anything already under water must not pop up above it when flipped.
      p.setY(i, Math.min(waterY - 0.02, 2 * waterY - p.getY(i)));
      n.setY(i, -n.getY(i));
    }
    if (!cache.has(source.material)) {
      const material = source.material.clone();
      material.side = THREE.DoubleSide;
      cache.set(source.material, material);
    }
    const mesh = new THREE.Mesh(g, cache.get(source.material));
    mesh.matrixAutoUpdate = false;
    mesh.userData.noGuard = true;
    scene.add(mesh);
  }
}

// Snow settles on upward surfaces, except under the roofs of halls.
const snowUniforms = { uTime: { value: 0 }, uWind: { value: 0 }, uSnow: { value: 0 }, uRooms: { value: Array.from({ length: 8 }, () => new THREE.Vector4(1e5, 1e5, 1e5, 1e5)) } };
function snowify(material, { rooms = true, frontOnly = false, sway = false } = {}) {
  material.customProgramCacheKey = () => `snow-${rooms}-${frontOnly}-${sway}`;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSnow = snowUniforms.uSnow;
    shader.uniforms.uRooms = snowUniforms.uRooms;
    shader.uniforms.uTime = snowUniforms.uTime;
    shader.uniforms.uWind = snowUniforms.uWind;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uWind;\nvarying vec3 vSnowP;\nvarying float vSnowUp;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vSnowP = position;
        vSnowUp = normal.y;
        ${sway ? `#ifdef USE_INSTANCING
          vec2 swayAt = instanceMatrix[3].xz;
        #else
          vec2 swayAt = position.xz * 0.2;
        #endif
        float swayH = abs(position.y);
        float swayPhase = uTime * 1.7 + swayAt.x * 0.31 + swayAt.y * 0.23;
        transformed.x += uWind * swayH * 0.035 * (0.7 + sin(swayPhase));
        transformed.z += uWind * swayH * 0.014 * sin(swayPhase * 1.4);` : ''}`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uSnow;\nuniform vec4 uRooms[8];\nvarying vec3 vSnowP;\nvarying float vSnowUp;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float snowAmount = uSnow * smoothstep(0.28, 0.78, vSnowUp);
        ${frontOnly ? 'if (!gl_FrontFacing) snowAmount = 0.0;' : ''}
        ${rooms ? 'for (int i = 0; i < 8; i++) { vec4 r = uRooms[i]; if (vSnowP.x > r.x && vSnowP.x < r.y && vSnowP.z > r.z && vSnowP.z < r.w) snowAmount = 0.0; }' : ''}
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.93, 0.97), snowAmount * 0.93);`);
  };
}

export function buildWorld(scene, renderer, quality) {
  const m = makeMaterials();
  m.lantern = new THREE.MeshBasicMaterial({ vertexColors: true });
  m.towerRoof = new THREE.MeshLambertMaterial({ vertexColors: true, map: m.roof.map.clone(), side: THREE.DoubleSide, emissive: 0x1d2a24 });
  m.towerRoof.color.set(0xa6dcc0);
  WORLD.PLACES.filter((p) => p.building).slice(0, 8).forEach((p, i) => {
    const b = p.building;
    snowUniforms.uRooms.value[i].set(b.x0 - 0.1, b.x1 + 0.1, b.z0 - 0.1, b.z1 + 0.1);
  });
  [m.paint, m.floor, m.brick].forEach((mat) => snowify(mat));
  snowify(m.leaf, { sway: true });
  [m.roof, m.towerRoof].forEach((mat) => snowify(mat, { rooms: false, frontOnly: true }));
  const baker = new Baker();
  const reflected = new Baker();
  const incense = [];
  addLandscape(baker, m);
  addZenGarden(baker, m);
  addPond(baker, reflected, m, scene);
  for (const place of WORLD.PLACES) {
    if (place.building) addBuilding(baker, m, place);
    if (place.altar) addAltar(baker, m, place, incense);
    if (place.pavilion) addPavilion(baker, m, place.pavilion[0], place.pavilion[1], 3, 4.2, false);
    if (place.bell) addBell(baker, m, place.bell[0], place.bell[1]);
  }
  addEntrance(baker, m);
  addWishBoxes(baker, m);
  addCourtGardens(baker, m);
  addGate(baker, m, 60, { hw: 2.5, height: 5.4, tiers: 2, reach: 7.6 });
  addCushions(baker, m);
  const casters = quality.shadows ? [m.paint, m.roof, m.towerRoof, m.brick, m.plaster, m.leaf, m.gold] : [];
  const receivers = [m.paint, m.floor, m.brick, m.plaster, m.roof, m.towerRoof, m.leaf];
  baker.build(scene, { cast: casters, receive: receivers });
  const towerMeshes = reflected.build(scene, { cast: casters, receive: receivers });
  mirrorMeshes(towerMeshes, scene, WORLD.POND.waterY);
  // Wallpapers are separate pictures on the back wall of halls without statues.
  const wallpapers = [];
  const loader = new THREE.TextureLoader();
  for (const place of WORLD.PLACES) {
    const b = place.building;
    if (!b?.wallpaper) continue;
    const texture = loader.load(`textures/${b.wallpaper.file}`);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    const material = new THREE.MeshBasicMaterial({ map: texture, fog: false });
    wallpapers.push(material);
    const across = b.wallpaper.side === 'n' ? b.x1 - b.x0 : b.z1 - b.z0;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(across, b.wallH), material);
    const midX = (b.x0 + b.x1) / 2;
    const midZ = (b.z0 + b.z1) / 2;
    const midY = place.elevation + b.wallH / 2;
    if (b.wallpaper.side === 'n') mesh.position.set(midX, midY, b.z0 + 0.17);
    if (b.wallpaper.side === 'w') { mesh.position.set(b.x0 + 0.17, midY, midZ); mesh.rotation.y = Math.PI / 2; }
    if (b.wallpaper.side === 'e') { mesh.position.set(b.x1 - 0.17, midY, midZ); mesh.rotation.y = -Math.PI / 2; }
    scene.add(mesh);
  }
  const skyMaterial = addSky(scene);
  addForest(scene, quality.shadows ? 3200 : 1800);
  const clouds = addClouds(scene);

  // Warm interior lights from the plan. Only the nearest few are switched on.
  const lamps = [];
  for (const place of WORLD.PLACES) {
    for (const [x, y, z, intensity] of place.lights || []) {
      lamps.push({ position: new THREE.Vector3(x, y + place.elevation, z), base: intensity * 34 });
    }
  }
  const pool = [0, 1, 2].map(() => {
    const l = new THREE.PointLight(0xffc07a, 0, 30, 1.6);
    scene.add(l);
    return l;
  });
  const altarSpot = new THREE.PointLight(0xffd59a, 26, 28, 1.3);
  const main = WORLD.PLACES.find((p) => p.altar);
  if (main) {
    altarSpot.position.set(0, main.elevation + 7, main.altar.z - 0.6);
    scene.add(altarSpot);
  }
  return { materials: m, skyMaterial, lamps, pool, incense, altarSpot, clouds, wallpapers, snow: snowUniforms.uSnow, wind: snowUniforms.uWind, time: snowUniforms.uTime };
}

// The same buildings, gardens and pond, placed inside a group on the mountain.
// The sky, land and forest come from the shared landscape.
export function buildTemple(scene, quality) {
  const m = makeMaterials();
  m.lantern = new THREE.MeshBasicMaterial({ vertexColors: true });
  m.towerRoof = new THREE.MeshLambertMaterial({ vertexColors: true, map: m.roof.map.clone(), side: THREE.DoubleSide, emissive: 0x06120c, emissiveIntensity: 0.45 });
  m.towerRoof.color.set(0xa6dcc0);
  WORLD.PLACES.filter((p) => p.building).slice(0, 8).forEach((p, i) => {
    const pb = p.building;
    snowUniforms.uRooms.value[i].set(pb.x0 - 0.1, pb.x1 + 0.1, pb.z0 - 0.1, pb.z1 + 0.1);
  });
  [m.paint, m.floor, m.brick].forEach((mat) => snowify(mat));
  snowify(m.leaf, { sway: true });
  [m.roof, m.towerRoof].forEach((mat) => snowify(mat, { rooms: false, frontOnly: true }));
  const baker = new Baker();
  const reflected = new Baker();
  const incense = [];
  addLandscape(baker, m);
  addZenGarden(baker, m);
  addPond(baker, reflected, m, scene);
  for (const place of WORLD.PLACES) {
    if (place.building) addBuilding(baker, m, place);
    if (place.altar) addAltar(baker, m, place, incense);
    if (place.pavilion) addPavilion(baker, m, place.pavilion[0], place.pavilion[1], 3, 4.2, false);
    if (place.bell) addBell(baker, m, place.bell[0], place.bell[1]);
  }
  addEntrance(baker, m);
  addWishBoxes(baker, m);
  addCourtGardens(baker, m);
  addGate(baker, m, 60, { hw: 2.5, height: 5.4, tiers: 2, reach: 7.6 });
  addCushions(baker, m);
  addPagodaRooms(baker, m);
  addOfferingPlaces(baker, m);
  // A gate at the foot of the mountain, 120 m below the Great Gate terrace.
  const low = new Baker();
  addGate(low, m, 0, { hw: 3.4, height: 6.4, tiers: 2, reach: 15 });
  const lowGroup = new THREE.Group();
  low.build(lowGroup, { cast: [], receive: [] });
  // Small towers on nearby peaks, seen across the clouds.
  const far = new Baker();
  addPavilion(far, m, 0, 0, 3.6, 5.4, true);
  addPavilion(far, m, 0, 0, 2.2, 8.6, false);
  const farGroup = new THREE.Group();
  far.build(farGroup, { cast: [], receive: [] });
  const casters = quality.shadows ? [m.paint, m.roof, m.towerRoof, m.brick, m.plaster, m.leaf, m.gold] : [];
  const receivers = [m.paint, m.floor, m.brick, m.plaster, m.roof, m.towerRoof, m.leaf];
  baker.build(scene, { cast: casters, receive: receivers });
  const towerMeshes = reflected.build(scene, { cast: casters, receive: receivers });
  mirrorMeshes(towerMeshes, scene, WORLD.POND.waterY);
  const wallpapers = [];
  const loader = new THREE.TextureLoader();
  for (const place of WORLD.PLACES) {
    const bd = place.building;
    if (!bd?.wallpaper) continue;
    const texture = loader.load(`textures/${bd.wallpaper.file}`);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, fog: false });
    wallpapers.push(material);
    const across = bd.wallpaper.side === 'n' ? bd.x1 - bd.x0 : bd.z1 - bd.z0;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(across, bd.wallH), material);
    const midX = (bd.x0 + bd.x1) / 2; const midZ = (bd.z0 + bd.z1) / 2; const midY = place.elevation + bd.wallH / 2;
    if (bd.wallpaper.side === 'n') mesh.position.set(midX, midY, bd.z0 + 0.17);
    if (bd.wallpaper.side === 'w') { mesh.position.set(bd.x0 + 0.17, midY, midZ); mesh.rotation.y = Math.PI / 2; }
    if (bd.wallpaper.side === 'e') { mesh.position.set(bd.x1 - 0.17, midY, midZ); mesh.rotation.y = -Math.PI / 2; }
    scene.add(mesh);
  }
  const lamps = [];
  for (const l of WORLD.TOWER.levels) lamps.push({ position: new THREE.Vector3(WORLD.TOWER.x + 0.6, l.y + 2.9, WORLD.TOWER.z + 0.6), base: l.i === 0 ? 2.2 : 1.5 });
  for (const place of WORLD.PLACES) for (const [x, y, z, intensity] of place.lights || []) lamps.push({ position: new THREE.Vector3(x, y + place.elevation, z), base: intensity * 34 });
  const pool = [0, 1, 2].map(() => { const l = new THREE.PointLight(0xffc07a, 0, 30, 1.6); scene.add(l); return l; });
  const altarSpot = new THREE.PointLight(0xffd59a, 26, 28, 1.3);
  const main = WORLD.PLACES.find((p) => p.altar);
  if (main) { altarSpot.position.set(0, main.elevation + 7, main.altar.z - 0.6); scene.add(altarSpot); }
  return { lowGate: lowGroup, farTower: farGroup, lamps, pool, wallpapers, altarSpot, snow: snowUniforms.uSnow, wind: snowUniforms.uWind, time: snowUniforms.uTime };
}
