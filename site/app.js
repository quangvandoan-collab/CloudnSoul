import * as THREE from './vendor/three.module.min.js';

const { LEVELS, SPACES, PATHS, LINKS, FUTURE, ground } = window.CHURCH;
const $ = (id) => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent, text) => {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text !== undefined) node.textContent = text;
  if (parent) parent.appendChild(node);
  return node;
};
const KINDS = { grand: 'Grand hall', hall: 'Hall', chapel: 'Chapel', altar: 'Altar area', view: 'Viewpoint', arrive: 'Arrival', path: 'Route', service: 'Service', garden: 'Garden' };
const color = (kind) => getComputedStyle(document.documentElement).getPropertyValue(`--${kind}`).trim();
const size = (s) => [s.rect[1] - s.rect[0], s.rect[3] - s.rect[2]];
const area = (s) => { const [w, d] = size(s); return s.ring ? Math.round(w * d - 22 * 22) : Math.round(s.curved ? w * d * 0.8 : w * d); };
const byId = new Map(SPACES.map((s) => [s.id, s]));
const linksOf = (id) => LINKS.filter((l) => l.a === id || l.b === id);
const fmt = (n) => n.toLocaleString('en-US');

// ---------- Level maps ----------
let level = 4;
let selected = 'nave';
function detail() {
  const s = byId.get(selected);
  const box = $('detail');
  box.textContent = '';
  if (!s) return;
  const h = document.createElement('h2');
  h.textContent = s.name;
  const vi = document.createElement('div');
  vi.className = 'note';
  vi.textContent = s.vi;
  const p = document.createElement('p');
  p.textContent = s.purpose;
  p.style.margin = '8px 0 0';
  const dl = document.createElement('dl');
  const [w, d] = size(s);
  const rows = [['Size', `${w} × ${d} m`], ['Floor height', `${s.y} m`], ['Ceiling', s.h ? `${s.h} m above floor` : 'Open sky'], ['Area', `${fmt(area(s))} m²`]];
  if (s.feature) rows.push(['Feature', s.feature]);
  if (s.noVisitors) rows.push(['Access', 'View only']);
  if (s.staff) rows.push(['Access', 'Staff characters, visitors by tour']);
  for (const [a, b] of rows) {
    const dt = document.createElement('dt'); dt.textContent = a; const dd = document.createElement('dd'); dd.textContent = b; dl.append(dt, dd);
  }
  const h3 = document.createElement('h3');
  h3.textContent = 'Connects to';
  const ul = document.createElement('ul');
  for (const l of linksOf(s.id)) {
    const li = document.createElement('li');
    const other = byId.get(l.a === s.id ? l.b : l.a);
    li.textContent = `${other.name} (${l.by})`;
    ul.appendChild(li);
  }
  box.append(h, vi, p, dl, h3, ul);
}
function drawMap() {
  const svg = $('mapSvg');
  svg.textContent = '';
  const here = SPACES.filter((s) => s.level === level);
  const paths = PATHS.filter((p) => p.level === level);
  const future = FUTURE.filter((f) => f.level === level);
  let x0 = Infinity; let x1 = -Infinity; let z0 = Infinity; let z1 = -Infinity;
  for (const r of [...here.map((s) => s.rect), ...future.map((s) => s.rect)]) { x0 = Math.min(x0, r[0]); x1 = Math.max(x1, r[1]); z0 = Math.min(z0, r[2]); z1 = Math.max(z1, r[3]); }
  for (const p of paths) for (const [x, z] of p.points) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const m = Math.max(x1 - x0, z1 - z0) * 0.07 + 6;
  const scaleW = Math.max(x1 - x0, z1 - z0);
  svg.setAttribute('viewBox', `${x0 - m} ${z0 - m} ${x1 - x0 + m * 2} ${z1 - z0 + m * 2}`);
  const font = scaleW * 0.021 + 0.8;
  for (const p of paths) {
    el('polyline', { points: p.points.map(([x, z]) => `${x},${z}`).join(' '), fill: 'none', stroke: color('path'), 'stroke-width': p.width, 'stroke-linejoin': 'round', 'stroke-dasharray': p.stepFree ? 'none' : `${p.width * 0.28} ${p.width * 0.14}` }, svg);
    const mid = p.points[Math.floor(p.points.length / 2)];
    el('text', { x: mid[0] + p.width, y: mid[1], 'font-size': font * 0.82 }, svg, p.name);
  }
  for (const f of future) {
    const [a, b, c, d] = f.rect;
    el('rect', { x: a, y: c, width: b - a, height: d - c, fill: 'none', stroke: 'var(--muted)', 'stroke-dasharray': `${font * 0.5} ${font * 0.4}`, 'stroke-width': font * 0.1 }, svg);
    el('text', { x: (a + b) / 2, y: (c + d) / 2, 'font-size': font * 0.8, 'text-anchor': 'middle', style: 'fill:var(--muted)' }, svg, `Future: ${f.name}`);
  }
  for (const s of here) {
    const [a, b, c, d] = s.rect;
    const g = el('g', { class: `sp${s.id === selected ? ' on' : ''}`, tabindex: 0, role: 'button', 'aria-label': s.name }, svg);
    const fill = color(s.kind);
    if (s.curved) {
      const r = (b - a) / 2;
      el('path', { d: `M${a} ${d} V${c + r} A${r} ${r} 0 0 1 ${b} ${c + r} V${d} Z`, fill, 'fill-opacity': 0.82, stroke: '#0b1433', 'stroke-width': font * 0.1 }, g);
    } else {
      el('rect', { x: a, y: c, width: b - a, height: d - c, fill, 'fill-opacity': s.h ? 0.82 : 0.45, stroke: '#0b1433', 'stroke-width': font * 0.1 }, g);
    }
    if (s.ring) el('circle', { cx: (a + b) / 2, cy: (c + d) / 2, r: 10, fill: '#0b1433' }, g);
    const w = b - a;
    const dd = d - c;
    const vertical = dd > w * 2.3 && w < font * s.name.length * 0.5;
    const cx = (a + b) / 2;
    const cy = (c + d) / 2;
    const fs = Math.min(font, Math.max(w, dd) / (s.name.length * 0.55));
    el('text', { x: cx, y: cy, 'font-size': fs, 'text-anchor': 'middle', 'dominant-baseline': 'middle', transform: vertical ? `rotate(-90 ${cx} ${cy})` : '', style: 'pointer-events:none;font-weight:600;paint-order:stroke;stroke:#0b1433;stroke-width:.35px' }, g, s.name);
    const pick = () => { selected = s.id; drawMap(); detail(); };
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  }
  if (level === 4) {
    for (let z = 41; z <= 107; z += 11) for (const x of [-11, 11]) el('rect', { x: x - 0.9, y: z - 0.9, width: 1.8, height: 1.8, fill: '#0b1433', style: 'pointer-events:none' }, svg);
  }
  const bar = scaleW > 200 ? 50 : scaleW > 90 ? 20 : 10;
  const bx = x0 - m * 0.6;
  const by = z1 + m * 0.65;
  el('rect', { x: bx, y: by, width: bar, height: font * 0.25, fill: 'var(--gold)' }, svg);
  el('text', { x: bx + bar + font * 0.4, y: by + font * 0.3, 'font-size': font * 0.8, style: 'fill:var(--gold)' }, svg, `${bar} m`);
}
function renderLevels() {
  const bar = $('levelBar');
  bar.textContent = '';
  for (const lv of LEVELS) {
    const b = document.createElement('button');
    b.textContent = `${lv.id}. ${lv.name}`;
    b.title = `${lv.vi}, ${lv.y}`;
    b.setAttribute('aria-pressed', String(lv.id === level));
    b.addEventListener('click', () => {
      level = lv.id;
      selected = SPACES.find((s) => s.level === level).id;
      renderLevels(); drawMap(); detail();
    });
    bar.appendChild(b);
  }
}
for (const [k, label] of Object.entries(KINDS)) {
  const span = document.createElement('span');
  const i = document.createElement('i');
  i.style.background = `var(--${k})`;
  span.append(i, label);
  $('legend').appendChild(span);
}

// ---------- Side sections ----------
function drawWide() {
  const svg = $('sectionWide');
  const W = 1200; const H = 430;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const zMin = -160; const zMax = 760;
  const X = (z) => 30 + ((zMax - z) / (zMax - zMin)) * (W - 60);
  const yMin = -50; const yMax = 300;
  const Y = (y) => H - 25 - ((y - yMin) / (yMax - yMin)) * (H - 50);
  let d = `M${X(zMax)} ${H} `;
  for (let z = zMax; z >= zMin; z -= 8) d += `L${X(z)} ${Y(ground(0, z))} `;
  d += `L${X(zMin)} ${H} Z`;
  el('path', { d, fill: '#2c3e6f', stroke: '#6d81bb' }, svg);
  const road = PATHS.find((p) => p.id === 'road');
  for (const p of [road, ...PATHS.filter((q) => q.id.startsWith('flight'))]) el('polyline', { points: p.points.map(([, z, y]) => `${X(z)},${Y(y)}`).join(' '), fill: 'none', stroke: 'var(--gold)', 'stroke-width': 3 }, svg);
  for (const s of SPACES) {
    if (Math.abs((s.rect[0] + s.rect[1]) / 2) > 40) continue;
    const a = X(s.rect[3]); const b = X(s.rect[2]);
    const top = s.h || 2;
    el('rect', { x: a, y: Y(s.y + top), width: Math.max(1.5, b - a), height: Math.max(2, Y(s.y) - Y(s.y + top)), fill: color(s.kind), 'fill-opacity': 0.85 }, svg);
  }
  const labels = [[720, 0, 'Valley gate, 0 m', 16], [405, 60, 'Great bridge, 60 m', 16], [240, 100, 'High terrace, 100 m', -20], [160, 120, 'Forecourt, 120 m', -26], [64, 170, 'Nave', -8], [20, 200, 'Dome, 194 m', -6], [125, 215, 'Tower lookout, 206 m', -10]];
  for (const [z, y, t, off] of labels) el('text', { x: X(z), y: Y(y) + off, 'font-size': 15, 'text-anchor': 'middle' }, svg, t);
  el('text', { x: X(-125), y: Y(250), 'font-size': 15, 'text-anchor': 'middle' }, svg, 'Cliff');
  el('text', { x: X(405), y: Y(-20), 'font-size': 15, 'text-anchor': 'middle' }, svg, 'Gorge');
}
function drawClose() {
  const svg = $('sectionClose');
  const W = 1200; const H = 680;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const zMin = -58; const zMax = 145;
  const X = (z) => 40 + ((zMax - z) / (zMax - zMin)) * (W - 80);
  const s = (W - 80) / (zMax - zMin);
  const Y = (y) => H - 20 - (y - 100) * s;
  el('rect', { x: 0, y: Y(115), width: W, height: H - Y(115), fill: '#2c3e6f' }, svg);
  const shown = ['crypt', 'narthex', 'nave', 'crossing', 'chancel', 'sanctuary', 'apse', 'choir-loft', 'gallery-e', 'tower', 'dome-gallery', 'lantern', 'lookout'];
  for (const id of shown) {
    const q = byId.get(id);
    const a = X(q.rect[3]); const b = X(q.rect[2]);
    const top = q.h || 1;
    el('rect', { x: a, y: Y(q.y + top), width: b - a, height: Y(q.y) - Y(q.y + top), fill: color(q.kind), 'fill-opacity': id === 'gallery-e' || id === 'dome-gallery' ? 0.3 : 0.75, stroke: '#0b1433' }, svg);
  }
  const t = byId.get('tower');
  el('rect', { x: X(t.rect[3]), y: Y(190), width: X(t.rect[2]) - X(t.rect[3]), height: Y(120) - Y(190), fill: color('view'), 'fill-opacity': 0.25, stroke: '#0b1433' }, svg);
  el('path', { d: `M${X(30)} ${Y(180)} A${(X(8) - X(30)) / 2} ${(X(8) - X(30)) / 2} 0 0 1 ${X(8)} ${Y(180)}`, fill: color('grand'), 'fill-opacity': 0.55 }, svg);
  const labels = [['narthex', 'Narthex 18 m'], ['nave', 'Nave 44 m'], ['crossing', 'Dome 74 m'], ['chancel', 'Chancel 40 m'], ['apse', 'Apse 36 m'], ['crypt', 'Crypt 9 m']];
  for (const [id, text] of labels) {
    const q = byId.get(id);
    el('text', { x: (X(q.rect[3]) + X(q.rect[2])) / 2, y: id === 'crypt' ? Y(110) : Y(q.y + q.h) + 19, 'font-size': 14, 'text-anchor': 'middle', style: 'font-weight:600;paint-order:stroke;stroke:#0b1433;stroke-width:3px' }, svg, text);
  }
  el('text', { x: X(74), y: Y(150), 'font-size': 13, 'text-anchor': 'middle' }, svg, 'Gallery behind columns');
  el('text', { x: X(19), y: Y(168), 'font-size': 13, 'text-anchor': 'middle', style: 'paint-order:stroke;stroke:#0b1433;stroke-width:3px' }, svg, 'Dome gallery');
  el('text', { x: X(125), y: Y(207) - 6, 'font-size': 13, 'text-anchor': 'middle' }, svg, 'Lookout 206 m');
  el('text', { x: X(19), y: Y(195) - 7, 'font-size': 13, 'text-anchor': 'middle' }, svg, 'Lantern 194 m');
  for (const z of [125, 75, 19, -12]) {
    const x = X(z);
    el('rect', { x: x - 2, y: Y(120 + 1.7), width: 4, height: Math.max(4, 1.7 * s), fill: '#fff' }, svg);
  }
}

// ---------- Table and notes ----------
function renderTable() {
  const t = $('spaceTable');
  const head = t.createTHead().insertRow();
  for (const label of ['Space', 'Level', 'Size (m)', 'Area (m²)', 'Floor (m)', 'Ceiling (m)', 'Purpose', 'Connects to']) {
    const th = document.createElement('th'); th.textContent = label; head.appendChild(th);
  }
  const body = t.createTBody();
  for (const s of SPACES) {
    const r = body.insertRow();
    const n = r.insertCell();
    n.textContent = s.name;
    const small = document.createElement('small'); small.textContent = s.vi; n.appendChild(small);
    r.insertCell().textContent = s.level;
    const [w, d] = size(s);
    r.insertCell().textContent = `${w} × ${d}`;
    const c1 = r.insertCell(); c1.className = 'num'; c1.textContent = fmt(area(s));
    const c2 = r.insertCell(); c2.className = 'num'; c2.textContent = s.y;
    const c3 = r.insertCell(); c3.className = 'num'; c3.textContent = s.h || 'Open';
    r.insertCell().textContent = s.purpose;
    r.insertCell().textContent = linksOf(s.id).map((l) => byId.get(l.a === s.id ? l.b : l.a).name).join(', ');
  }
}
const pathLen = (p) => p.points.slice(1).reduce((sum, q, i) => sum + Math.hypot(q[0] - p.points[i][0], q[1] - p.points[i][1], q[2] - p.points[i][2]), 0);
const climbMetres = Math.round(pathLen(PATHS.find((p) => p.id === 'road')) + 130 + 30 + ['flight-a', 'flight-b', 'flight-c'].reduce((sum, id) => sum + pathLen(PATHS.find((p) => p.id === id)), 0) + 60);
$('climbTime').textContent = `${Math.round(climbMetres / 7 / 6) * 10 / 10} minutes at game walking speed`.replace(/^(\d+)\s/, (m, a) => (Math.round(climbMetres / 7 / 30) / 2) + ' ');
const routes = [
  ['First visit', `Valley gate, forest road, bridge, stairs, forecourt, narthex, nave. About ${fmt(climbMetres)} m of walking to the forecourt.`],
  ['Stair-free', 'Forest road, bridge, funicular to the forecourt, level main doors, then lifts to the gallery, tower and crypt.'],
  ['To the confession chapel', 'Narthex, east aisle, then the two arches midway along.'],
  ['To the dome', 'West aisle, gallery lift, dome gallery, then the small lift to the lantern lookout.'],
  ['To the tower', 'Narthex, tower stairs or lift, bell chamber, then the lookout.'],
  ['To the crypt', 'Either transept, stairs or lift, then the quiet chapels.'],
  ['To the garden', 'South transept door, or through the corridor beside the sacristy. The west garden opens off the north transept.'],
];
for (const [a, b] of routes) {
  const li = document.createElement('li'); const strong = document.createElement('b'); strong.textContent = `${a}: `; li.append(strong, b); $('routes').appendChild(li);
}
for (const f of FUTURE) {
  const li = document.createElement('li'); const strong = document.createElement('b'); strong.textContent = `${f.name}: `; li.append(strong, f.note); $('future').appendChild(li);
}

// ---------- Block model ----------
let three = null;
const PRESETS = [
  ['Whole site', [120, 300, 620], [0, 100, 100], false],
  ['Valley gate', [0, 8, 770], [0, 60, 400], true],
  ['Bridge, looking at the church', [0, 66, 455], [0, 140, 110], true],
  ['High terrace', [40, 106, 240], [0, 150, 110], true],
  ['Forecourt, facing the doors', [0, 122, 182], [0, 145, 118], true],
  ['Narthex doorway', [0, 121.7, 120], [0, 135, 20], true],
  ['Middle of the nave', [0, 121.7, 72], [0, 138, -40], true],
  ['Under the dome, looking up', [0, 121.7, 24], [0, 190, 18], true],
  ['Altar rail', [0, 121.7, -18], [0, 132, -50], true],
  ['Confession chapel', [25, 121.7, 86], [25, 123, 62], true],
  ['East gallery', [15, 141.7, 110], [2, 152, 20], true],
  ['Choir loft', [0, 143.7, 124], [0, 135, 0], true],
  ['Dome gallery', [13, 166.7, 19], [-6, 178, 19], true],
  ['Tower lookout', [29, 208.5, 131], [5, 150, 420], true],
  ['Crypt', [0, 107.7, 36], [0, 109, -8], true, true],
  ['Cloister garden', [85, 121.7, 32], [85, 122, -20], true],
];
function initThree() {
  const canvas = $('view3d');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fb8d6);
  scene.fog = new THREE.Fog(0x9fb8d6, 300, 1500);
  const camera = new THREE.PerspectiveCamera(62, 1, 0.2, 2600);
  camera.rotation.order = 'YXZ';
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6a6a78, 1.5));
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.8);
  sun.position.set(-200, 400, 300);
  scene.add(sun);
  const walls = new THREE.Group(); const roofs = new THREE.Group(); const land = new THREE.Group();
  scene.add(walls, roofs, land);
  const mat = (hex) => new THREE.MeshLambertMaterial({ color: hex, side: THREE.DoubleSide });
  const wallMat = mat(0xd9d2c2); const floorMat = new Map();
  const box = (w, h, d, x, y, z, m, group = walls) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.position.set(x, y + h / 2, z);
    group.add(mesh);
    return mesh;
  };
  const touching = (a, b) => {
    const r = a.rect; const q = b.rect;
    const out = [];
    const overlap = (p0, p1, q0, q1) => [Math.max(p0, q0), Math.min(p1, q1)];
    const addIf = (side, range) => { if (range[1] - range[0] > 0.5) out.push({ side, range }); };
    if (r[0] === q[1]) addIf('w', overlap(r[2], r[3], q[2], q[3]));
    if (r[1] === q[0]) addIf('e', overlap(r[2], r[3], q[2], q[3]));
    if (r[2] === q[3]) addIf('n', overlap(r[0], r[1], q[0], q[1]));
    if (r[3] === q[2]) addIf('s', overlap(r[0], r[1], q[0], q[1]));
    return out;
  };
  for (const s of SPACES) {
    const [x0, x1, z0, z1] = s.rect;
    if (!floorMat.has(s.kind)) floorMat.set(s.kind, mat(new THREE.Color(color(s.kind)).getHex()));
    const fm = floorMat.get(s.kind);
    if (s.ring) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(10.5, 14.5, 40), fm);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(0, s.y, 19);
      walls.add(ring);
      continue;
    }
    // Open spaces stand on a plinth down to the ground.
    const plinth = s.h || s.level > 3 ? 0.4 : (s.y > ground((x0 + x1) / 2, (z0 + z1) / 2) ? Math.min(s.y - ground((x0 + x1) / 2, (z0 + z1) / 2) + 6, 110) : 0.4);
    box(x1 - x0, plinth, z1 - z0, (x0 + x1) / 2, s.y - plinth, (z0 + z1) / 2, fm);
    if (!s.h) continue;
    const h = s.id === 'crossing' ? 60 : s.h;
    const gaps = { n: [], s: [], e: [], w: [] };
    for (const other of SPACES) {
      if (other === s || other.y !== s.y) continue;
      const linked = LINKS.some((l) => l.open && ((l.a === s.id && l.b === other.id) || (l.b === s.id && l.a === other.id)));
      if (!linked) continue;
      for (const t of touching(s, other)) gaps[t.side].push({ range: t.range, top: Math.min(h, other.h || h) * 0.86, narrow: (s.id === 'forecourt') });
    }
    if (s.id === 'narthex') gaps.s.push({ range: [-5, 5], top: 12 });
    const t = 0.5;
    const addWall = (side, a0, a1) => {
      const list = gaps[side].sort((p, q) => p.range[0] - q.range[0]);
      let cursor = a0;
      const seg = (p, q, y0, y1) => {
        if (q - p < 0.02 || y1 - y0 < 0.02) return;
        if (side === 'n' || side === 's') box(q - p, y1 - y0, t, (p + q) / 2, y0, side === 'n' ? z0 : z1, wallMat);
        else box(t, y1 - y0, q - p, side === 'w' ? x0 : x1, y0, (p + q) / 2, wallMat);
      };
      for (const g of list) {
        seg(cursor, g.range[0], s.y, s.y + h);
        seg(g.range[0], g.range[1], s.y + g.top, s.y + h);
        cursor = g.range[1];
      }
      seg(cursor, a1, s.y, s.y + h);
    };
    addWall('n', x0, x1); addWall('s', x0, x1); addWall('w', z0, z1); addWall('e', z0, z1);
    if (s.id !== 'crossing') box(x1 - x0, 0.4, z1 - z0, (x0 + x1) / 2, s.y + h, (z0 + z1) / 2, wallMat, roofs);
  }
  // Nave columns and the people for scale.
  const col = new THREE.CylinderGeometry(1, 1.15, 20, 14);
  for (let z = 41; z <= 107; z += 11) for (const x of [-11, 11]) { const m = new THREE.Mesh(col, mat(0xb8c9b2)); m.position.set(x, 130, z); walls.add(m); }
  for (let z = 41; z <= 107; z += 11) for (const x of [-11, 11]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.1, 24, 14), mat(0xb8c9b2)); m.position.set(x, 152, z); walls.add(m); }
  const personMat = new THREE.MeshLambertMaterial({ color: 0xfff7e0 });
  for (const [x, y, z] of [[3, 120, 66], [-4, 120, 60], [0, 120, 22], [5, 120, 28], [0, 120, 150], [8, 120, 168], [0, 60, 430], [14, 140, 90], [25, 120, 80], [85, 120, 10], [-4, 106, 20], [0, 142, 124]]) {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.25, 1.2, 4, 8), personMat); m.position.set(x, y + 0.85, z); walls.add(m);
  }
  // Dome, lantern and tower: plain shapes to judge the skyline.
  const dome = new THREE.Mesh(new THREE.SphereGeometry(11, 32, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xcbb37b));
  dome.position.set(0, 180, 19);
  roofs.add(dome);
  box(22, 14, 0.5, 0, 180 - 14, 8, wallMat);
  const towerShaft = box(14, 70, 14, 29, 120, 125, wallMat);
  towerShaft.material = mat(0xc6bfae);
  box(14, 72, 14, -29, 120, 125, towerShaft.material);
  // Bridge.
  for (const z of [370, 405, 440]) box(10, 110, 12, 0, -50, z, mat(0x8b8780));
  // Sloped ways.
  for (const p of PATHS) {
    for (let i = 1; i < p.points.length; i++) {
      const a = p.points[i - 1]; const b = p.points[i];
      const len = Math.hypot(b[0] - a[0], b[2] - a[2], b[1] - a[1]);
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(p.width, 0.6, len), mat(p.id === 'funicular' ? 0x46506e : 0x8d90a3));
      mesh.position.set((a[0] + b[0]) / 2, (a[2] + b[2]) / 2, (a[1] + b[1]) / 2);
      mesh.lookAt(b[0], b[2], b[1]);
      walls.add(mesh);
    }
  }
  // Mountain.
  const geo = new THREE.PlaneGeometry(1500, 1500, 150, 150);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i); const z = pos.getZ(i) + 300;
    const h = ground(x, z);
    pos.setXYZ(i, x, h, z);
    c.set(h > 160 ? 0x8e8a80 : h < -10 ? 0x5a7a7c : 0x5f8151);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  land.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));

  const state = { yaw: 0, pitch: 0, walking: false, keys: new Set(), held: new Set(), floor: 0 };
  const aim = (p, target) => {
    camera.position.set(...p);
    const dx = target[0] - p[0]; const dy = target[1] - p[1]; const dz = target[2] - p[2];
    state.yaw = Math.atan2(-dx, -dz);
    state.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  };
  const resize = () => {
    const r = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize);
  const go = (i) => {
    const [, p, target, inside, under] = PRESETS[i];
    aim(p, target);
    roofs.visible = inside;
    land.visible = !under;
    $('roofBtn').setAttribute('aria-pressed', String(roofs.visible));
    $('groundBtn').setAttribute('aria-pressed', String(land.visible));
    if (state.walking) state.floor = p[1] - 1.7;
  };
  $('preset').addEventListener('change', (e) => go(Number(e.target.value)));
  $('roofBtn').addEventListener('click', () => { roofs.visible = !roofs.visible; $('roofBtn').setAttribute('aria-pressed', String(roofs.visible)); });
  $('groundBtn').addEventListener('click', () => { land.visible = !land.visible; $('groundBtn').setAttribute('aria-pressed', String(land.visible)); });
  $('modeBtn').addEventListener('click', () => {
    state.walking = !state.walking;
    $('modeBtn').setAttribute('aria-pressed', String(state.walking));
    if (state.walking) { const s = nearest(); state.floor = s ? s.y : Math.max(ground(camera.position.x, camera.position.z), 0); camera.position.y = state.floor + 1.7; }
  });
  const nearest = () => {
    const { x, y, z } = camera.position;
    let best = null; let gap = Infinity;
    for (const s of SPACES) {
      if (x < s.rect[0] || x > s.rect[1] || z < s.rect[2] || z > s.rect[3]) continue;
      const d = Math.abs(y - 1.7 - s.y);
      if (d < gap) { gap = d; best = s; }
    }
    return best;
  };
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: state.yaw, pitch: state.pitch }; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    state.yaw = drag.yaw + (e.clientX - drag.x) * 0.004;
    state.pitch = Math.max(-1.5, Math.min(1.5, drag.pitch + (e.clientY - drag.y) * 0.004));
  });
  canvas.addEventListener('pointerup', () => { drag = null; });
  addEventListener('keydown', (e) => { if (!$('tab-walk').hidden && 'wasdqe'.includes(e.key.toLowerCase())) state.keys.add(e.key.toLowerCase()); });
  addEventListener('keyup', (e) => state.keys.delete(e.key.toLowerCase()));
  document.querySelectorAll('.pad button').forEach((b) => {
    const m = b.dataset.m;
    b.addEventListener('pointerdown', (e) => { e.preventDefault(); state.held.add(m); b.setPointerCapture(e.pointerId); });
    for (const ev of ['pointerup', 'pointercancel']) b.addEventListener(ev, () => state.held.delete(m));
  });
  let last = performance.now();
  const tick = (now) => {
    requestAnimationFrame(tick);
    if ($('tab-walk').hidden) { last = now; return; }
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const on = (k, m) => state.keys.has(k) || state.held.has(m);
    const f = (on('w', 'f') ? 1 : 0) - (on('s', 'b') ? 1 : 0);
    const r = (on('d', 'r') ? 1 : 0) - (on('a', 'l') ? 1 : 0);
    const u = (on('e', 'up') ? 1 : 0) - (on('q', 'down') ? 1 : 0);
    const speed = state.walking ? 8 : Math.max(10, Math.min(90, Math.abs(camera.position.y - ground(camera.position.x, camera.position.z)) * 0.8));
    const sy = Math.sin(state.yaw); const cy = Math.cos(state.yaw);
    camera.position.x += (-sy * f + cy * r) * speed * dt;
    camera.position.z += (-cy * f - sy * r) * speed * dt;
    if (state.walking) {
      const s = nearest();
      if (s) state.floor = s.y;
      camera.position.y = state.floor + 1.7;
    } else {
      camera.position.y += (u + f * Math.sin(state.pitch)) * speed * dt;
    }
    camera.rotation.set(state.pitch, state.yaw, 0);
    const s = nearest();
    $('where').textContent = `${s && Math.abs(camera.position.y - s.y) < 75 ? s.name : 'Outside'}. Height ${Math.round(camera.position.y)} m`;
    renderer.render(scene, camera);
  };
  PRESETS.forEach(([name], i) => { const o = document.createElement('option'); o.value = i; o.textContent = name; $('preset').appendChild(o); });
  resize();
  go(0);
  requestAnimationFrame(tick);
  three = { resize, go, state, renderer, scene, camera };
  window.CHURCH_VIEW = three;
}

// ---------- Tabs ----------
const TABS = ['map', 'section', 'walk', 'spaces', 'notes'];
function show(tab) {
  if (!TABS.includes(tab)) tab = 'map';
  for (const t of TABS) $(`tab-${t}`).hidden = t !== tab;
  document.querySelectorAll('nav button').forEach((b) => b.setAttribute('aria-current', String(b.dataset.tab === tab)));
  if (tab === 'walk') {
    try {
      if (!three) initThree(); else three.resize();
    } catch (error) {
      console.error(error);
      $('where').textContent = 'This device could not start the 3D view. The other tabs still work.';
    }
  }
}
document.querySelectorAll('nav button').forEach((b) => b.addEventListener('click', () => { try { location.hash = b.dataset.tab; } catch { /* Ignore. */ } show(b.dataset.tab); }));
addEventListener('hashchange', () => show(location.hash.slice(1)));
renderLevels(); drawMap(); detail(); drawWide(); drawClose(); renderTable();
show(location.hash.slice(1) || 'map');
