// Keeps the walking camera out of buildings. It tests a few short rays against the real
// triangles of the scene, sorted into a grid so each test only looks at what is nearby.
(function (root, factory) {
  const g = factory();
  if (typeof module === 'object' && module.exports) module.exports = g;
  else root.CHURCH_GUARD = g;
}(typeof self !== 'undefined' ? self : this, function () {
  const CELL = 3;
  const key = (x, y, z) => (x + 2048) * 16777216 + (y + 2048) * 4096 + (z + 2048);
  function createGrid() {
    const cells = new Map();
    let tris = new Float32Array(9 * 4096);
    let n = 0;
    function add(ax, ay, az, bx, by, bz, cx, cy, cz) {
      // Tiny ornaments are ignored: they cost time and never hide the view.
      const ux = bx - ax; const uy = by - ay; const uz = bz - az; const vx = cx - ax; const vy = cy - ay; const vz = cz - az;
      const nx = uy * vz - uz * vy; const ny = uz * vx - ux * vz; const nz = ux * vy - uy * vx;
      if (nx * nx + ny * ny + nz * nz < 0.0025) return;
      if ((n + 1) * 9 > tris.length) { const bigger = new Float32Array(tris.length * 2); bigger.set(tris); tris = bigger; }
      tris.set([ax, ay, az, bx, by, bz, cx, cy, cz], n * 9);
      const x0 = Math.floor((Math.min(ax, bx, cx) - 0.2) / CELL); const x1 = Math.floor((Math.max(ax, bx, cx) + 0.2) / CELL);
      const y0 = Math.floor((Math.min(ay, by, cy) - 0.2) / CELL); const y1 = Math.floor((Math.max(ay, by, cy) + 0.2) / CELL);
      const z0 = Math.floor((Math.min(az, bz, cz) - 0.2) / CELL); const z1 = Math.floor((Math.max(az, bz, cz) + 0.2) / CELL);
      if ((x1 - x0 + 1) * (y1 - y0 + 1) * (z1 - z0 + 1) <= 6000) {
        for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
          const k = key(x, y, z);
          const list = cells.get(k);
          if (list) list.push(n); else cells.set(k, [n]);
        }
      }
      n += 1;
    }
    let stamp = 1; let seen = new Uint32Array(0);
    // Distance along the ray (0 to 1) of the first thing it meets, or 1.
    function firstHit(ox, oy, oz, ex, ey, ez) {
      const dx = ex - ox; const dy = ey - oy; const dz = ez - oz;
      const len = Math.hypot(dx, dy, dz);
      if (len < 1e-4) return 1;
      if (seen.length < n) seen = new Uint32Array(n);
      stamp += 1;
      let best = 1;
      const steps = Math.ceil(len / (CELL * 0.5));
      let last = NaN;
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        if (t > best + (CELL * 2) / len) break;
        const k = key(Math.floor((ox + dx * t) / CELL), Math.floor((oy + dy * t) / CELL), Math.floor((oz + dz * t) / CELL));
        if (k === last) continue;
        last = k;
        const list = cells.get(k);
        if (!list) continue;
        for (let i = 0; i < list.length; i++) {
          const id = list[i];
          if (seen[id] === stamp) continue;
          seen[id] = stamp;
          const p = id * 9;
          const ax = tris[p]; const ay = tris[p + 1]; const az = tris[p + 2];
          const e1x = tris[p + 3] - ax; const e1y = tris[p + 4] - ay; const e1z = tris[p + 5] - az;
          const e2x = tris[p + 6] - ax; const e2y = tris[p + 7] - ay; const e2z = tris[p + 8] - az;
          const px = dy * e2z - dz * e2y; const py = dz * e2x - dx * e2z; const pz = dx * e2y - dy * e2x;
          const det = e1x * px + e1y * py + e1z * pz;
          if (Math.abs(det) < 1e-9) continue;
          const inv = 1 / det;
          const tx = ox - ax; const ty = oy - ay; const tz = oz - az;
          const u = (tx * px + ty * py + tz * pz) * inv;
          if (u < 0 || u > 1) continue;
          const qx = ty * e1z - tz * e1y; const qy = tz * e1x - tx * e1z; const qz = tx * e1y - ty * e1x;
          const v = (dx * qx + dy * qy + dz * qz) * inv;
          if (v < 0 || u + v > 1) continue;
          const hit = (e2x * qx + e2y * qy + e2z * qz) * inv;
          if (hit > 0.0005 && hit < best) best = hit;
        }
      }
      return best;
    }
    // How far from the target (0 to 1) the camera can sit. Rays also go to the corners of a small box round it.
    function clip(tx, ty, tz, cx, cy, cz, rays = 5) {
      const len = Math.hypot(cx - tx, cy - ty, cz - tz);
      if (len < 1e-3 || !n) return 1;
      const sideX = (cz - tz) / len; const sideZ = -(cx - tx) / len;
      const w = 0.28; const margin = 0.3 / len;
      let k = firstHit(tx, ty, tz, cx, cy, cz);
      if (rays > 1) {
        for (const [a, b] of [[w, 0], [-w, 0], [0, w], [0, -w]].slice(0, rays - 1)) {
          const h = firstHit(tx, ty, tz, cx + sideX * a, cy + b, cz + sideZ * a);
          if (h < k) k = h;
        }
      }
      return k >= 1 ? 1 : Math.max(0.02, k - margin);
    }
    return { add, clip, firstHit, get count() { return n; } };
  }
  // Goes through a Three.js scene a little at a time, so the page does not freeze.
  async function fromScene(scene, wants) {
    const grid = createGrid();
    const meshes = [];
    scene.updateMatrixWorld(true);
    scene.traverse((o) => { if (o.isMesh && o.visible && wants(o)) meshes.push(o); });
    let done = 0;
    const put = (pos, index, e) => {
      const count = index ? index.count : pos.count;
      const at = (i) => {
        const v = index ? index.getX(i) : i;
        const x = pos.getX(v); const y = pos.getY(v); const z = pos.getZ(v);
        const w = 1 / (e[3] * x + e[7] * y + e[11] * z + e[15] || 1);
        return [(e[0] * x + e[4] * y + e[8] * z + e[12]) * w, (e[1] * x + e[5] * y + e[9] * z + e[13]) * w, (e[2] * x + e[6] * y + e[10] * z + e[14]) * w];
      };
      return (from, to) => {
        for (let i = from; i < to && i + 2 < count; i += 3) { const a = at(i); const b = at(i + 1); const c = at(i + 2); grid.add(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); }
        return count;
      };
    };
    const pause = async () => { done += 1; if (done % 2 === 0) await new Promise((r) => { setTimeout(r, 0); }); };
    const mul = (a, b) => {
      const r = new Array(16);
      for (let c = 0; c < 4; c++) for (let w = 0; w < 4; w++) r[c * 4 + w] = a[w] * b[c * 4] + a[w + 4] * b[c * 4 + 1] + a[w + 8] * b[c * 4 + 2] + a[w + 12] * b[c * 4 + 3];
      return r;
    };
    for (const m of meshes) {
      const pos = m.geometry.attributes.position; const index = m.geometry.index;
      if (m.isInstancedMesh) {
        const arr = m.instanceMatrix.array;
        for (let i = 0; i < m.count; i++) {
          const e = mul(m.matrixWorld.elements, Array.from(arr.subarray(i * 16, i * 16 + 16)));
          put(pos, index, e)(0, Infinity);
          if (i % 400 === 399) await pause();
        }
      } else {
        const fill = put(pos, index, m.matrixWorld.elements);
        const total = index ? index.count : pos.count;
        for (let s = 0; s < total; s += 30000) { fill(s, s + 30000); await pause(); }
      }
    }
    return grid;
  }
  return { createGrid, fromScene };
}));
