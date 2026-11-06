// Where a visitor can walk. Each place lists floors, things in the way, and places to arrive.
// Plain data and maths, so it runs in the page and in the tests.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CHURCH_WALK = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  const R = (x0, x1, z0, z1, y = 0) => ({ rect: [x0, x1, z0, z1], y });
  const S = (a, b, w, ext = 1.2, lift) => ({ seg: [a, b], w, ext, lift }); // a and b are [x, z, y].
  const O = (x0, x1, z0, z1) => ({ rect: [x0, x1, z0, z1] });
  const C = (x, z, r) => ({ circle: [x, z, r] });
  const both = (f) => [...f(1), ...f(-1)];
  const mir = (s, a, b) => (s > 0 ? [a, b] : [-b, -a]);

  const PIERS = [30, 41, 52, 63, 74, 85, 96, 107, 118];
  const BAYS = PIERS.slice(0, -1).map((z) => z + 5.5);
  const CHAPEL_E = [46.5, 57.5, 90.5, 101.5];
  const CHAPEL_W = [46.5, 57.5, 68.5, 79.5, 90.5, 101.5];
  const nave = { camera: 'areas', areas: [], blocks: [] };
  nave.areas.push(R(-10.2, 10.2, 8, 117.5), R(-10.2, 10.2, -19.5, 8), R(-51.5, 51.5, 8.6, 29.4));
  for (const s of [1, -1]) {
    const [a, b] = mir(s, 11.6, 19.4);
    nave.areas.push(R(a, b, 29, 117.4));
    for (const c of BAYS) nave.areas.push(R(...mir(s, 10, 12), c - 3.6, c + 3.6));
    for (const c of s > 0 ? [...CHAPEL_E, 68.5, 79.5] : CHAPEL_W) nave.areas.push(R(...mir(s, 19, 21), c - 3.4, c + 3.4));
    for (const c of s > 0 ? CHAPEL_E : CHAPEL_W) {
      nave.areas.push(R(...mir(s, 20.6, 29.6), c - 4.9, c + 4.9));
      nave.blocks.push(O(...mir(s, 26.5, 30), c - 2.7, c + 2.7), O(...mir(s, 22.1, 26.3), c - 5.4, c - 4.5));
      for (const q of [-1.8, 1.8]) nave.blocks.push(O(...mir(s, 23.4, 26.6), c + q - 0.2, c + q + 0.2));
    }
    nave.blocks.push(O(...mir(s, 1.7, 10.2), 37.5, 106.5));
    for (const z of PIERS) nave.blocks.push(C(s * 10.8, z, z === 30 || z === 118 ? 1.2 : 1.6));
    for (const c of [35.5, 112.5]) nave.blocks.push(O(...mir(s, 18.7, 19.6), c - 2, c + 2));
    nave.blocks.push(O(...mir(s, 5.6, 9.6), -18.1, -17.1), O(...mir(s, 11, 15), 18.6, 19.4));
    nave.areas.push(R(a, b, 30.6, 117.4, 20.3));
  }
  nave.areas.push(R(20.6, 26.9, 63.6, 84.4), R(-20, 20, 106.8, 117.6, 20.4));
  nave.blocks.push(O(23, 27, 63.5, 64.4), O(23, 27, 83.6, 84.5));

  const crypt = { camera: 'areas', areas: [R(-19.6, 19.6, -9.6, 39.6)], blocks: [] };
  for (const s of [1, -1]) {
    crypt.areas.push(R(...mir(s, 20.6, 35.4), 0.5, 29.5));
    for (const c of [5, 15, 25]) crypt.areas.push(R(...mir(s, 19, 21), c - 2.8, c + 2.8));
    for (const x of [4, 12]) for (const z of [0, 10, 20, 30]) crypt.blocks.push(C(s * x, z, 0.85));
    for (const x of [8, 16]) for (const z of [5, 25]) crypt.blocks.push(O(...mir(s, x - 0.95, x + 0.95), z - 1.8, z + 1.8));
    for (let z = 4; z <= 25; z += 3.2) crypt.blocks.push(O(...mir(s, 23.4, 28.6), z - 0.25, z + 0.3));
    crypt.blocks.push(O(...mir(s, 32.5, 36), 12.3, 17.7));
  }
  crypt.blocks.push(O(-4.5, 4.5, -10, -3.8));

  const hall = {
    camera: 'areas',
    areas: [R(-26.4, 26.4, 36.6, 55.4), R(-15.9, -12.1, 55, 57.4), R(-26.4, -1.6, 57.2, 72.4)],
    blocks: [O(-9.2, 18.2, 40.2, 42.8), O(-9.2, 18.2, 49.2, 51.8), O(21.3, 26.4, 38.5, 53.5), O(17.3, 18.3, 38.1, 39.1),
      O(-19.7, -8.3, 63.8, 66.2), O(-2.3, -1.4, 57.8, 62.2), O(-2.4, -1.4, 63.5, 66.5), O(-2.3, -1.4, 67.3, 71.7),
      O(-26.5, -25.8, 60.3, 63.7), O(-26.4, -23.5, 70.6, 72.5), O(-26.4, -24, 57.2, 59.5)],
  };

  const road = [[0, 568, -120], [-70, 508, -102], [50, 438, -82], [-20, 368, -66], [0, 338, -60]];
  const outside = {
    camera: 'free',
    camBlocks: [[-56, 56, -300, -0.4], [15, 128, 57.5, 59], [-128, -15, 57.5, 59], [126.6, 128, -200, 59], [-128, -126.6, -200, 59]],
    areas: [
      R(-5, 5, 566, 582, -120),
      ...road.slice(1).map((p, i) => S(road[i], p, 7.4, 1.5)),
      R(-4.9, 4.9, 208, 338.5, -60), R(5, 24, 263.6, 282.4, -60),
      R(-27.5, 27.5, 176.4, 208.5, -60), R(-65.5, -24.5, 130.4, 163.6, -40), R(24.5, 65.5, 90.4, 125.6, -20),
      S([-20, 176, -60], [-42, 164, -40], 7.4, 8), S([-24, 147, -40], [24, 108, -20], 7.4, 4), S([36, 90, -20], [0, 58, 0], 13, 9),
      R(-14, 14, 56.5, 60), R(-56, 56, 1.2, 57.3), R(55.5, 126, -50, 57.2, -0.8), R(-126, -55.5, -50, 57.2, -0.8),
    ],
    blocks: [C(0, 192, 8.2), C(-45, 147, 8.2), C(45, 108, 8.2), C(0, 34, 3.2),
      ...both((s) => [C(s * 90, 27, 3.8), O(...mir(s, 66, 86), 6, 24), O(...mir(s, 66, 86), 30, 50), O(...mir(s, 94, 118), 6, 24), O(...mir(s, 94, 118), 30, 50)])],
  };
  // Am Mây: the same climb, then the old temple plan on the top terrace.
  // A point in the plan is at world x, plan y - 1.8 and plan z - 55.
  const TDY = -1.8; const TDZ = -55;
  // A long straight stair up the ridge, in three flights with two wide landings.
  const TEMPLE_CLIMB = {
    terraces: [[-28, 28, 176, 208, -60], [-16, 16, 133.5, 145, -40], [-16, 16, 91, 102.5, -20]],
    flights: [[176, -60, 145, -40], [133.5, -40, 102.5, -20], [91, -20, 58.75, 0]],
    gates: [178.5, 566],
    width: 10,
  };
  const gatePosts = (z) => [C(-3.4, z - 1.1, 0.3), C(3.4, z - 1.1, 0.3), C(-3.4, z + 1.1, 0.3), C(3.4, z + 1.1, 0.3), O(3.2, 15.5, z - 0.35, z + 0.35), O(-15.5, -3.2, z - 0.35, z + 0.35)];
  const temple = { camera: 'mixed', camBlocks: [], stepLimit: 1, areas: [
    R(-5, 5, 566, 582, -120),
    ...road.slice(1).map((p, i) => S(road[i], p, 7.8, 1.5, 0.25)),
    R(-4.9, 4.9, 208, 338.5, -60), R(5, 24, 263.6, 282.4, -60),
    R(-27.5, 27.5, 176.4, 208.5, -60),
    ...TEMPLE_CLIMB.terraces.slice(1).map(([a, b, d, e, y]) => R(a + 0.5, b - 0.5, d, e, y)),
    ...TEMPLE_CLIMB.flights.map(([za, ya, zb, yb]) => S([0, za, ya], [0, zb, yb], 9.6, 0.7, 0.2)),
    R(-9, 9, 47.8, 58.9, 0), S([0, 48.4, 0], [0, 45.2, -1.75], 4.6, 0.8),
  ], blocks: [] };
  const TEMPLE_BASE = temple.areas.length;
  function useTemplePlan(world) {
    const skip = new Set(['avenue', 'steps-s', 'outer', 'steps-n']);
    temple.areas = temple.areas.slice(0, TEMPLE_BASE);
    temple.camBlocks = [];
    temple.blocks = [C(0, 192, 8.2), ...TEMPLE_CLIMB.gates.flatMap(gatePosts)];
    for (const [x, z] of [[-14.2, 134.7], [14.2, 134.7], [-14.2, 143.8], [14.2, 143.8], [-14.2, 92.2], [14.2, 92.2], [-14.2, 101.3], [14.2, 101.3]]) temple.blocks.push(C(x, z, 0.5));
    for (const p of world.PLACES) {
      if (p.building) { const b = p.building; temple.camBlocks.push([b.x0, b.x1, b.z0 + TDZ, b.z1 + TDZ]); }
      if (skip.has(p.id)) continue;
      const [x0, x1, z0, z1] = p.rect;
      const area = R(x0, x1, z0 + TDZ, z1 + TDZ, p.elevation + TDY);
      if (p.id === 'island') area.holes = [{ circle: [world.TOWER.x, world.TOWER.z + TDZ, world.TOWER.ground] }];
      temple.areas.push(area);
    }
    const at = new Map(world.PLACES.map((p) => [p.id, p]));
    for (const d of world.DOORS) {
      if (skip.has(d.a) || skip.has(d.b)) continue;
      const y = (at.get(d.a).elevation + at.get(d.b).elevation) / 2 + TDY;
      temple.areas.push(R(d.at[0] - 1.9, d.at[0] + 1.9, d.at[1] + TDZ - 1.9, d.at[1] + TDZ + 1.9, y));
    }
    // The pagoda: a round floor on each level, with the stairwells cut out of it.
    const T = world.TOWER;
    const flat = (s) => ({ seg: [[s.from[0], s.from[1] + TDZ], [s.to[0], s.to[1] + TDZ]], w: s.width / 2 + 0.1 });
    for (const l of T.levels) {
      const cuts = T.stairs.filter((s) => s.i === l.i || s.i === l.i - 1).map(flat);
      temple.areas.push({ circle: [T.x, T.z + TDZ, l.i === 0 ? T.ground : l.apothem - 0.32], y: l.y + TDY, holes: cuts });
      const band = [l.y + TDY - 0.2, l.y + TDY + 2];
      temple.blocks.push({ ...C(T.x, T.z + TDZ, l.centre), y: band });
      if (l.i === 0) for (let c = 0; c < 8; c++) { const a = (c / 8) * Math.PI * 2 + Math.PI / 8; temple.blocks.push({ ...C(T.x + Math.sin(a) * l.r, T.z + TDZ + Math.cos(a) * l.r, 0.3), y: band }); }
      if (l.i === 1) for (const a of [Math.PI * 0.25, Math.PI * 1.25]) temple.blocks.push({ ...C(T.x + Math.sin(a) * (l.apothem - 0.35), T.z + TDZ + Math.cos(a) * (l.apothem - 0.35), 1.1), y: band });
    }
    for (const o of [...world.OFFERINGS.incense, ...world.OFFERINGS.votive]) temple.blocks.push({ ...C(o.x, o.z + TDZ, 1.4), y: [o.y + TDY - 1, o.y + TDY + 3] });
    { const t = world.OFFERINGS.table; temple.blocks.push({ ...O(t.x - 2.3, t.x + 2.3, t.z + TDZ - 0.9, t.z + TDZ + 0.9), y: [t.y + TDY - 1, t.y + TDY + 3] }); }
    for (const p of world.PLACES) if (p.bell) temple.blocks.push(C(p.bell[0], p.bell[1] + TDZ, 1.8));
    const main = world.PLACES.find((p) => p.altar);
    temple.blocks.push(O(-10.5, 10.5, main.altar.z - 8 + TDZ, main.altar.z + 0.8 + TDZ));
    const spot = (id, yaw) => { const p = at.get(id); return { name: id, at: [p.spot[0], p.spot[1] + TDZ, p.elevation + TDY], yaw }; };
    { const l = T.levels[T.FLOORS - 1]; TEMPLE_SPOTS.towerTop = { name: 'Top of the pagoda', at: [T.x + 2.2, T.z + TDZ - 2.2, l.y + TDY], yaw: 0 }; }
    Object.assign(TEMPLE_SPOTS, { garden: spot('garden', 0), deck: spot('deck', 0), tamquan: spot('tamquan', 0), lakeSouth: spot('south', 0), tower: spot('island', 0), mainHall: spot('main', 0), lecture: spot('lecture', 0), zen: spot('zen', Math.PI / 2), guest: spot('guest', -Math.PI / 2), tea: spot('tea', 0), bell: spot('bell', 0) });
  }
  const PLACES = { nave, crypt, hall, outside, temple };
  // Arrival points outdoors: x, z, y, and the way the camera faces.
  const SPOTS = {
    gate: { name: 'Valley gate', at: [-12, 556, -116.4], yaw: 3.0 },
    road: { name: 'Forest road', at: [-20, 368, -66], yaw: 0.2 },
    bridge: { name: 'Bridge', at: [0, 325, -60], yaw: 0 },
    balcony: { name: 'Gorge balcony', at: [18, 273, -60], yaw: -1.57 },
    terrace1: { name: 'Lower terrace', at: [0, 203, -60], yaw: 0.2 },
    stairs1: { name: 'First stairs', at: [-22, 175, -59], yaw: 0.6 },
    terrace2: { name: 'Cliff terrace', at: [-58, 156, -40], yaw: -0.8 },
    stairs2: { name: 'Second stairs', at: [-22, 145, -39], yaw: -0.8 },
    terrace3: { name: 'High terrace', at: [40, 124, -20], yaw: 0.2 },
    stairs3: { name: 'Grand stairs', at: [34, 88, -19], yaw: 0.8 },
    forecourt: { name: 'Forecourt', at: [0, 50, 0], yaw: 0 },
    gardenE: { name: 'East gardens', at: [74, 27, -0.8], yaw: -1.57 },
    gardenW: { name: 'West gardens', at: [-74, 27, -0.8], yaw: 1.57 },
    doors: { name: 'Church doors', at: [0, 9, 0], yaw: 0 },
  };
  const TEMPLE_SPOTS = {
    gate: { name: 'Valley gate', at: [0, 574, -120], yaw: 0 },
    road: { name: 'Forest road', at: [-20, 368, -66], yaw: 0.2 },
    bridge: { name: 'Bridge', at: [0, 325, -60], yaw: 0 },
    terrace1: { name: 'Lower terrace', at: [0, 203, -60], yaw: 0.2 },
    stairs1: { name: 'First stairs', at: [0, 174, -59], yaw: 0, pitch: -0.08 },
    terrace2: { name: 'First landing', at: [0, 142, -40], yaw: 0 },
    stairs2: { name: 'Second stairs', at: [0, 132, -39], yaw: 0, pitch: -0.08 },
    terrace3: { name: 'Second landing', at: [0, 99, -20], yaw: 0 },
    stairs3: { name: 'Last stairs', at: [0, 90, -19], yaw: 0, pitch: -0.08 },
    greatGate: { name: 'Great Gate', at: [0, 55, 0], yaw: 0 },
  };
  const hits = (b, x, z, pad = 0.3) => {
    if (b.circle) return Math.hypot(x - b.circle[0], z - b.circle[1]) < b.circle[2] + pad;
    const [x0, x1, z0, z1] = b.rect;
    return x > x0 - pad && x < x1 + pad && z > z0 - pad && z < z1 + pad;
  };
  const inHole = (h, x, z) => {
    if (h.circle) return Math.hypot(x - h.circle[0], z - h.circle[1]) < h.circle[2];
    const [p, q] = h.seg;
    const dx = q[0] - p[0]; const dz = q[1] - p[1];
    const t = Math.max(0, Math.min(1, ((x - p[0]) * dx + (z - p[1]) * dz) / (dx * dx + dz * dz)));
    return Math.hypot(x - p[0] - dx * t, z - p[1] - dz * t) < h.w;
  };
  function floorAt(place, x, z, near) {
    let best = null;
    for (const a of PLACES[place].areas) {
      let y = null;
      if (a.holes && a.holes.some((h) => inHole(h, x, z))) continue;
      if (a.circle) { if (Math.hypot(x - a.circle[0], z - a.circle[1]) <= a.circle[2]) y = a.y; } else if (a.rect) { const [x0, x1, z0, z1] = a.rect; if (x >= x0 && x <= x1 && z >= z0 && z <= z1) y = a.y; } else {
        const [p, q] = a.seg;
        const dx = q[0] - p[0]; const dz = q[1] - p[1]; const len2 = dx * dx + dz * dz; const len = Math.sqrt(len2);
        const t = ((x - p[0]) * dx + (z - p[1]) * dz) / len2;
        if (t >= -a.ext / len && t <= 1 + a.ext / len) {
          const k = Math.max(0, Math.min(1, t));
          if (Math.hypot(x - (p[0] + dx * t), z - (p[1] + dz * t)) <= a.w / 2) y = p[2] + (q[2] - p[2]) * k + (a.lift ?? (a.ext > 2 ? 0.25 * Math.min(1, 12 * k * (1 - k)) : 0.55));
        }
      }
      if (y !== null && (best === null || near === undefined || Math.abs(y - near) < Math.abs(best - near))) best = y;
    }
    return best;
  }
  function standY(place, x, z, near) {
    const y = floorAt(place, x, z, near);
    if (y === null || Math.abs(y - near) > (PLACES[place].stepLimit ?? 2.5)) return null;
    for (const b of PLACES[place].blocks) if ((!b.y || (y >= b.y[0] && y <= b.y[1])) && hits(b, x, z)) return null;
    return y;
  }
  // How far the camera can pull back before it would pass through a wall.
  function cameraRoom(place, x, z, y, cx, cz) {
    const P = PLACES[place];
    if (floorAt(place, x, z, y) === null) return 1;
    // Inside a building the camera stays in the rooms. Outdoors it is free, but stays out of buildings.
    const indoors = (P.camBlocks || []).some((r) => x > r[0] && x < r[1] && z > r[2] && z < r[3]);
    const byAreas = P.camera === 'areas' || (P.camera === 'mixed' && indoors);
    for (let i = 1; i <= 20; i++) {
      const t = i / 20; const qx = x + (cx - x) * t; const qz = z + (cz - z) * t;
      const inBlock = (P.camBlocks || []).some((r) => qx > r[0] && qx < r[1] && qz > r[2] && qz < r[3]);
      const out = byAreas ? floorAt(place, qx, qz, y) === null || Math.abs(floorAt(place, qx, qz, y) - y) > 2.5 : inBlock;
      if (out) return Math.max(0.05, (i - 1) / 20);
    }
    return 1;
  }
  function createPlayer(place, x, z, y = 0) {
    const me = {
      place, x, z, y, target: null, face: [0, -1], walking: false,
      go(p, nx, nz, ny = 0) { me.place = p; me.x = nx; me.z = nz; me.y = ny; me.target = null; me.walking = false; },
      walkTo(nx, nz) { me.target = [nx, nz]; },
      step(dt, moves, yaw, speed) {
        let dx = 0; let dz = 0;
        const f = (moves.has('w') ? 1 : 0) - (moves.has('s') ? 1 : 0);
        const r = (moves.has('d') ? 1 : 0) - (moves.has('a') ? 1 : 0);
        if (f || r) {
          me.target = null;
          dx = -Math.sin(yaw) * f + Math.cos(yaw) * r; dz = -Math.cos(yaw) * f - Math.sin(yaw) * r;
        } else if (me.target) {
          dx = me.target[0] - me.x; dz = me.target[1] - me.z;
          if (Math.hypot(dx, dz) < 0.25) { me.target = null; dx = 0; dz = 0; }
        }
        const n = Math.hypot(dx, dz);
        if (!n) { me.walking = false; return false; }
        dx /= n; dz /= n;
        me.face = [dx, dz];
        const len = speed * dt;
        const free = floorAt(me.place, me.x, me.z, me.y) === null; // Arrived somewhere off the map: let them walk back on.
        const tryAt = (qx, qz) => {
          const q = free ? (floorAt(me.place, qx, qz, me.y) ?? me.y) : standY(me.place, qx, qz, me.y);
          if (q === null) return false;
          me.x = qx; me.z = qz; me.y = q;
          return true;
        };
        const moved = tryAt(me.x + dx * len, me.z + dz * len) || (Math.abs(dx) > 0.05 && tryAt(me.x + Math.sign(dx) * len * Math.max(0.4, Math.abs(dx)), me.z)) || (Math.abs(dz) > 0.05 && tryAt(me.x, me.z + Math.sign(dz) * len * Math.max(0.4, Math.abs(dz))));
        if (!moved) me.target = null;
        me.walking = moved;
        return moved;
      },
    };
    return me;
  }
  // Pews: rows run from the altar end (row 1) to the doors, on each side of the centre aisle.
  const PEWS = { rows: 44, z0: 38, step: 1.55, seats: [3.2, 4.9, 6.6, 8.3] };
  const rowNear = (z) => Math.max(1, Math.min(PEWS.rows, Math.round((z - PEWS.z0) / PEWS.step) + 1));
  // The first free place in a row. taken lists [x, z] of anyone already seated.
  function seatSpot(side, row, taken = []) {
    const z = PEWS.z0 + (Math.max(1, Math.min(PEWS.rows, row)) - 1) * PEWS.step;
    const free = PEWS.seats.find((s) => !taken.some(([x, q]) => Math.abs(x - side * s) < 0.9 && Math.abs(q - z) < 0.7));
    return { x: side * (free ?? PEWS.seats[0]), z, full: free === undefined };
  }
  // Is this visitor within reach of a pew? slack widens the area, so the popup does not flicker at its edge.
  function nearPews(place, x, z, y, slack = 0) {
    if (place !== 'nave' || y > 15) return false;
    return Math.abs(x) < 10.5 + slack && z > 35.5 - slack && z < 108.8 + slack;
  }
  return { PLACES, SPOTS, TEMPLE_SPOTS, TEMPLE_CLIMB, useTemplePlan, PEWS, rowNear, seatSpot, nearPews, floorAt, standY, cameraRoom, createPlayer };
}));
