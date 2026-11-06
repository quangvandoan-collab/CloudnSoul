'use strict';
// The site plan, shared by the browser and the server so both agree on where
// people can walk, sit and feed fish. TO ADD A HALL: add one entry to PLACES,
// one door to DOORS, then run `npm test`. See the manual, "Add a new hall".
//
// Units are metres. x runs west to east. z runs north to south: visitors enter
// at the far south and walk north along the central axis.
(function (root, factory) {
  const world = factory();
  if (typeof module === 'object' && module.exports) module.exports = world;
  else root.AM_WORLD = world;
})(typeof self !== 'undefined' ? self : this, function () {
  const NORTH = 0; // A seat facing yaw 0 looks north.
  const SOUTH = Math.PI;
  const EAST = -Math.PI / 2;
  const WEST = Math.PI / 2;

  // Every place is a plain rectangle a person can cross in a straight line.
  // `list: false` hides connecting paths from the "go to" menu.
  const PLACES = [
    { id: 'avenue', name: 'Đường vào', rect: [-7, 7, 119.5, 170], elevation: 0, spot: [0, 135] },
    { id: 'steps-s', name: 'Bậc đá', list: false, rect: [-6, 6, 113, 119.5], elevation: 0.8, ramp: [119.5, 0, 113, 1.8], spot: [0, 116] },
    { id: 'outer', name: 'Đại môn', rect: [-6, 6, 103.5, 113], elevation: 1.8, spot: [0, 110.5] },
    { id: 'steps-n', name: 'Bậc đá', list: false, rect: [-2.5, 2.5, 100, 103.5], elevation: 0.9, ramp: [103.5, 1.8, 100, 0.05], spot: [0, 102] },
    { id: 'garden', name: 'Vườn thiền', chat: true, rect: [-2.5, 2.5, 68.5, 100], elevation: 0.05, spot: [0, 86] },
    {
      id: 'deck', name: 'Hiên vườn thiền', chat: true, list: false, rect: [-44, 44, 64, 68.5], elevation: 0.05, spot: [-12, 66],
      seats: { cols: 16, rows: 1, x0: -40, x1: 40, z0: 67.2, z1: 67.2, facing: SOUTH, aisle: 4 },
    },
    { id: 'pav-w', name: 'Đình phía tây', chat: true, list: false, rect: [-52, -44, 62, 72], elevation: 0.05, spot: [-48, 67], pavilion: [-48, 67] },
    { id: 'pav-e', name: 'Đình phía đông', chat: true, list: false, rect: [44, 52, 62, 72], elevation: 0.05, spot: [48, 67], pavilion: [48, 67] },
    { id: 'tamquan', name: 'Tam quan', rect: [-3, 3, 54, 64], elevation: 0.05, spot: [0, 56] },
    {
      id: 'south', name: 'Bờ hồ phía nam', rect: [-38, 38, 50, 54], elevation: 0, spot: [-14, 52],
      seats: { cols: 8, rows: 1, x0: -28, x1: 28, z0: 50.8, z1: 50.8, facing: NORTH, aisle: 5 },
    },
    {
      id: 'west', name: 'Bờ hồ phía tây', list: false, rect: [-38, -30, -22, 54], elevation: 0, spot: [-34, 20],
      seats: { cols: 1, rows: 7, x0: -31, x1: -31, z0: -8, z1: 44, facing: EAST },
    },
    {
      id: 'east', name: 'Bờ hồ phía đông', list: false, rect: [30, 38, -22, 54], elevation: 0, spot: [34, 20],
      seats: { cols: 1, rows: 7, x0: 31, x1: 31, z0: -8, z1: 44, facing: WEST },
    },
    { id: 'north', name: 'Bờ hồ phía bắc', list: false, rect: [-38, 38, -22, -16], elevation: 0, spot: [12, -19] },
    { id: 'bridge-s', name: 'Cầu đá', rect: [-2, 2, 29, 50], elevation: 0.55, spot: [0, 40] },
    { id: 'island', name: 'Tháp giữa hồ', rect: [-11, 11, 6, 29], elevation: 0.55, spot: [0, 27.2] },
    { id: 'bridge-n', name: 'Cầu đá phía bắc', list: false, rect: [-2, 2, -16, 6], elevation: 0.55, spot: [0, -6] },
    {
      id: 'main', name: 'Chính điện', rect: [-11, 11, -42, -24], elevation: 0.85, spot: [0, -26],
      building: { x0: -12, x1: 12, z0: -53, z1: -23, wallH: 9.5, ridgeH: 5.6, colX: 10, colZ: 5, ridgeAxis: 'z', noWindows: ['n'] },
      openings: [{ side: 's', at: 0, width: 8 }],
      altar: { z: -43.6, depth: 8, width: 21, statues: [[0, 2.25], [-6.6, 1.9], [6.6, 1.9]] },
      seats: { cols: 10, rows: 9, x0: -9, x1: 9, z0: -41, z1: -25.4, facing: NORTH },
      lights: [[0, 7, -41, 2.4], [0, 5.5, -30, 0.9]],
    },
    { id: 'passage', name: 'Lối sau', list: false, rect: [-18, -13, -61.5, -22], elevation: 0, spot: [-15.5, -40] },
    {
      id: 'lecture', name: 'Giảng đường', rect: [-15, 15, -80, -62.5], elevation: 0.6, spot: [-12, -66],
      building: { x0: -16, x1: 16, z0: -82, z1: -62, wallH: 6.8, ridgeH: 4.8, colX: 5, wallpaper: { side: 'n', file: 'wall-light.jpg' } },
      openings: [{ side: 's', at: -13, width: 4 }, { side: 's', at: 13, width: 4 }],
      seats: { cols: 8, rows: 3, x0: -10, x1: 10, z0: -76, z1: -68, facing: NORTH },
      lights: [[0, 5, -72, 1]],
    },
    {
      id: 'zen', name: 'Thiền đường', rect: [-55, -41, 1, 21], elevation: 0.5, spot: [-44, 11],
      building: { x0: -56, x1: -40, z0: 0, z1: 22, wallH: 5.8, ridgeH: 3.8, colX: 4, ridgeAxis: 'z', wallpaper: { side: 'w', file: 'wall-forest.jpg' } },
      openings: [{ side: 'e', at: 11, width: 4 }],
      seats: { cols: 4, rows: 6, x0: -53, x1: -45, z0: 3.4, z1: 18.6, facing: WEST },
      lights: [[-48, 4.4, 11, 0.9]],
    },
    {
      id: 'guest', name: 'Nhà khách', rect: [41, 55, 1, 21], elevation: 0.5, spot: [44, 11],
      building: { x0: 40, x1: 56, z0: 0, z1: 22, wallH: 5.8, ridgeH: 3.8, colX: 4, ridgeAxis: 'z', wallpaper: { side: 'e', file: 'wall-mountain.jpg' } },
      openings: [{ side: 'w', at: 11, width: 4 }],
      seats: { cols: 3, rows: 4, x0: 47, x1: 53, z0: 4, z1: 18, facing: EAST },
      lights: [[48, 4.4, 11, 0.9]],
    },
    {
      id: 'tea', name: 'Trà thất', rect: [-35, -21, -36, -24], elevation: 0.4, spot: [-28, -26],
      building: { x0: -36, x1: -20, z0: -37, z1: -23.4, wallH: 5.2, ridgeH: 3.2, colX: 4, wallpaper: { side: 'n', file: 'wall-lotus.jpg' } },
      openings: [{ side: 's', at: -28, width: 9 }],
      seats: { cols: 4, rows: 2, x0: -33, x1: -23, z0: -33, z1: -29, facing: NORTH },
      lights: [[-28, 4, -30, 0.8]],
    },
    { id: 'bell', name: 'Gác chuông', rect: [38, 47, -30, -18], elevation: 0, spot: [40, -19.2], bell: [42.5, -24] },
  ];

  const DOORS = [
    { a: 'avenue', b: 'steps-s', at: [0, 119.5] },
    { a: 'steps-s', b: 'outer', at: [0, 113] },
    { a: 'outer', b: 'steps-n', at: [0, 103.5] },
    { a: 'steps-n', b: 'garden', at: [0, 100] },
    { a: 'garden', b: 'deck', at: [0, 68.5] },
    { a: 'deck', b: 'pav-w', at: [-44, 66] },
    { a: 'deck', b: 'pav-e', at: [44, 66] },
    { a: 'deck', b: 'tamquan', at: [0, 64] },
    { a: 'tamquan', b: 'south', at: [0, 54] },
    { a: 'south', b: 'west', at: [-34, 52] },
    { a: 'south', b: 'east', at: [34, 52] },
    { a: 'south', b: 'bridge-s', at: [0, 50] },
    { a: 'bridge-s', b: 'island', at: [0, 29] },
    { a: 'island', b: 'bridge-n', at: [0, 6] },
    { a: 'bridge-n', b: 'north', at: [0, -16] },
    { a: 'west', b: 'north', at: [-34, -19] },
    { a: 'east', b: 'north', at: [34, -19] },
    { a: 'north', b: 'main', at: [0, -23] },
    { a: 'north', b: 'passage', at: [-15.5, -22] },
    { a: 'passage', b: 'lecture', at: [-14, -62] },
    { a: 'west', b: 'zen', at: [-39.5, 11] },
    { a: 'east', b: 'guest', at: [39.5, 11] },
    { a: 'north', b: 'tea', at: [-28, -23] },
    { a: 'north', b: 'bell', at: [38, -20] },
  ];

  const START = { x: 0, z: 160 };

  // Wish boxes, placed at the sides of entrances. Deliberately not in front of
  // an altar, where one would read as a temple offering box.
  const WISH_PRESETS = ['peace', 'weather', 'children', 'healing', 'kindness'];
  const WISH_BOXES = [
    { x: -5.2, z: 111.5 }, { x: 5.2, z: 111.5 },
    { x: -6.4, z: 52.6 }, { x: 6.4, z: 52.6 },
    { x: 5.2, z: -21 },
  ];

  // Water visitors can feed fish in. The island and bridges cut through it.
  const POND = {
    rect: [-30, 30, -16, 50],
    waterY: 0.12,
    tower: { x: 0, z: 17.5 },
    blocked: [[-11.6, 11.6, 5.4, 29.6], [-2.4, 2.4, -16, 50]],
  };

  // The pagoda: seven floors joined by straight stairs on opposite sides, so each climb crosses the room.
  const TOWER = (() => {
    const x = 0; const z = 17.5; const FLOORS = 7;
    const levels = [];
    let y = 0.89;
    for (let i = 0; i < FLOORS; i++) {
      const t = i / (FLOORS - 1);
      const r = 7.8 - t * 2.4;
      const h = i === 0 ? 4.5 : 3.5 - t * 0.4;
      const roof = i === FLOORS - 1 ? 2.55 : 1.3;
      const core = i === 0 ? r - 0.2 : r - 0.9;
      levels.push({ i, y, r, h, roof, core, apothem: core * Math.cos(Math.PI / 8), centre: i === 0 ? 1.8 : 1.05 });
      y += h + roof;
    }
    const stairs = [];
    for (let i = 0; i < FLOORS - 1; i++) {
      const rise = levels[i + 1].y - levels[i].y;
      const len = rise * 1.15;
      const room = Math.min(levels[i].apothem, levels[i + 1].apothem);
      const d = Math.min(room - 1.4, room * Math.SQRT2 - len / 2 - 0.65);
      const a = Math.PI * 0.75 + i * Math.PI; // Behind the Buddha on the ground floor, then on opposite sides.
      const cx = x + Math.sin(a) * d; const cz = z + Math.cos(a) * d;
      const tx = Math.cos(a); const tz = -Math.sin(a);
      stairs.push({ i, a, width: 1.2, from: [cx - tx * len / 2, cz - tz * len / 2, levels[i].y], to: [cx + tx * len / 2, cz + tz * len / 2, levels[i + 1].y] });
    }
    // Windows face the four directions on every floor above the open ground floor.
    const windows = [];
    for (const l of levels) {
      if (l.i === 0) continue;
      for (const a of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
        windows.push({ level: l.i, a, x: x + Math.sin(a) * (l.apothem - 0.5), z: z + Math.cos(a) * (l.apothem - 0.5), y: l.y, view: [x + Math.sin(a) * (l.apothem + 0.42), l.y + 1.75, z + Math.cos(a) * (l.apothem + 0.42)] });
      }
    }
    return { x, z, FLOORS, levels, stairs, windows, ground: 9.2 };
  })();

  // Incense urns and paper furnaces outdoors, and the free table in the Guest hall where visitors collect them.
  const OFFERINGS = {
    incense: [{ x: -10, z: -19, y: 0 }, { x: -10, z: 151.75, y: -18.2 }],
    votive: [{ x: 10, z: -19, y: 0 }, { x: 10, z: 151.75, y: -18.2 }],
    table: { x: 43.6, z: 2.3, y: 0.5, reach: { x: 43.6, z: 4.6 } },
  };

  function buildSeats() {
    const seats = [];
    for (const place of PLACES) {
      const s = place.seats;
      if (!s) continue;
      for (let r = 0; r < s.rows; r++) {
        for (let c = 0; c < s.cols; c++) {
          const x = s.cols === 1 ? s.x0 : s.x0 + (c / (s.cols - 1)) * (s.x1 - s.x0);
          const z = s.rows === 1 ? s.z0 : s.z0 + (r / (s.rows - 1)) * (s.z1 - s.z0);
          if (s.aisle && Math.abs(x) < s.aisle) continue;
          seats.push({ id: seats.length, place: place.id, x, z, yaw: s.facing });
        }
      }
    }
    return seats;
  }
  const SEATS = buildSeats();
  const byId = new Map(PLACES.map((p) => [p.id, p]));

  const inRect = (r, x, z, margin = 0) =>
    x >= r[0] - margin && x <= r[1] + margin && z >= r[2] - margin && z <= r[3] + margin;

  function placeAt(x, z) {
    return PLACES.find((p) => inRect(p.rect, x, z)) || null;
  }
  const isWalkable = (x, z) => placeAt(x, z) !== null;
  const isWater = (x, z) => inRect(POND.rect, x, z) && !POND.blocked.some((r) => inRect(r, x, z));

  function nearestPlace(x, z) {
    let best = PLACES[0];
    let bestD = Infinity;
    for (const p of PLACES) {
      const dx = Math.max(p.rect[0] - x, 0, x - p.rect[1]);
      const dz = Math.max(p.rect[2] - z, 0, z - p.rect[3]);
      const d = dx * dx + dz * dz;
      if (d < bestD) { bestD = d; best = p; }
    }
    return best;
  }

  // Shortest list of doors between two places, then the destination.
  function route(fromX, fromZ, toX, toZ) {
    const start = nearestPlace(fromX, fromZ).id;
    const goal = nearestPlace(toX, toZ).id;
    const destination = { x: toX, z: toZ };
    if (start === goal) return [destination];
    // Dijkstra by walking distance, so the bridge beats a longer way round the bank.
    const previous = new Map([[start, null]]);
    const cost = new Map([[start, { d: 0, x: fromX, z: fromZ }]]);
    const open = new Set([start]);
    while (open.size) {
      let here = null;
      for (const id of open) if (here === null || cost.get(id).d < cost.get(here).d) here = id;
      open.delete(here);
      if (here === goal) break;
      const at = cost.get(here);
      for (const door of DOORS) {
        const next = door.a === here ? door.b : door.b === here ? door.a : null;
        if (!next) continue;
        const d = at.d + Math.hypot(door.at[0] - at.x, door.at[1] - at.z);
        if (!cost.has(next) || d < cost.get(next).d) {
          cost.set(next, { d, x: door.at[0], z: door.at[1] });
          previous.set(next, { from: here, door });
          open.add(next);
        }
      }
    }
    if (!previous.has(goal)) return [destination];
    const path = [destination];
    for (let at = goal; previous.get(at); at = previous.get(at).from) {
      const door = previous.get(at).door;
      path.unshift({ x: door.at[0], z: door.at[1] });
    }
    return path;
  }

  const elevationAt = (x, z) => {
    const place = nearestPlace(x, z);
    if (!place.ramp) return place.elevation;
    const [z0, y0, z1, y1] = place.ramp;
    const f = Math.max(0, Math.min(1, (z - z0) / (z1 - z0)));
    return y0 + (y1 - y0) * f;
  };
  // Chat exists only in the Zen garden area; the server checks this too.
  const canChat = (x, z) => Boolean(placeAt(x, z)?.chat);

  return {
    PLACES, DOORS, SEATS, START, POND, TOWER, OFFERINGS, WISH_BOXES, WISH_PRESETS, placeAt, nearestPlace, isWalkable, isWater, canChat, route, elevationAt, inRect, get: (id) => byId.get(id),
  };
});
