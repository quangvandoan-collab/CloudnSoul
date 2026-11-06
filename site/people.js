// Everyone in the nave, drawn by code as original pixel art. Frames are 32 by 48.
import * as THREE from './vendor/three.module.min.js';

const W = 32; const H = 48; const COLS = 10;
const ROW = { front: 0, back: 1, left: 2, right: 3 };
const LINE = '#17121c';
const POSE = { idle: 0, sit: 6, kneel: 7, pray: 7, work: 8 };

function head(p, o, dir, hy) {
  const shade = o.shade || '#00000033';
  if (o.head === 'veil' || o.head === 'mantilla') {
    if (dir === 'back') { p(9, hy - 1, 14, o.head === 'veil' ? 26 : 18, o.veil); p(10, hy - 2, 12, 1, o.veil); return; }
    if (dir === 'left') {
      p(12, hy - 1, 12, o.head === 'veil' ? 24 : 16, o.veil); p(10, hy - 1, 6, 2, o.coif);
      p(9, hy + 1, 8, 11, o.skin); p(9, hy + 1, 8, 1, o.coif); p(15, hy + 1, 2, 12, o.coif); p(11, hy + 5, 2, 2, LINE);
      return;
    }
    p(8, hy - 1, 16, o.head === 'veil' ? 24 : 15, o.veil); p(10, hy, 12, 13, o.coif);
    p(11, hy + 2, 10, 9, o.skin); p(13, hy + 5, 2, 2, LINE); p(18, hy + 5, 2, 2, LINE); p(15, hy + 9, 3, 1, shade);
    if (o.head === 'veil') p(11, hy + 13, 10, 3, o.coif);
    return;
  }
  const style = o.hairStyle;
  // A shaved head shows only skin, a shade darker on top.
  const hair = style === 'shaved' ? (o.scalp || o.skin) : o.hair;
  if (dir === 'back') {
    p(10, hy, 12, 12, hair); p(11, hy + 12, 10, 1, o.skin);
    if (style === 'long') p(10, hy + 8, 12, 12, hair);
    if (style === 'bun') p(13, hy - 3, 6, 4, hair);
    if (style === 'curly') { p(8, hy - 2, 16, 12, hair); p(10, hy - 3, 12, 1, hair); }
    if (style === 'ponytail') { p(14, hy + 3, 4, 15, hair); }
    if (style === 'shaved') { p(10, hy, 12, 12, o.skin); p(10, hy, 12, 4, hair); }
  } else if (dir === 'left') {
    p(9, hy + 1, 12, 10, o.skin); p(11, hy + 11, 8, 2, o.skin); p(13, hy, 10, 5, hair); p(19, hy + 4, 4, 6, hair); p(11, hy + 5, 2, 2, LINE);
    if (style === 'long') p(16, hy + 4, 7, 14, hair);
    if (style === 'bun') p(21, hy - 2, 5, 5, hair);
    if (style === 'curly') { p(12, hy - 2, 12, 5, hair); p(17, hy + 3, 7, 7, hair); }
    if (style === 'ponytail') p(22, hy + 3, 3, 13, hair);
    if (style === 'shaved') { p(13, hy, 10, 2, hair); p(19, hy + 2, 4, 8, o.skin); }
  } else {
    p(10, hy + 1, 12, 11, o.skin); p(11, hy + 12, 10, 1, o.skin); p(10, hy, 12, 3, hair); p(9, hy + 2, 2, 5, hair); p(21, hy + 2, 2, 5, hair);
    p(13, hy + 6, 2, 2, LINE); p(18, hy + 6, 2, 2, LINE); p(15, hy + 10, 3, 1, shade);
    if (style === 'long') { p(8, hy + 3, 3, 15, hair); p(21, hy + 3, 3, 15, hair); }
    if (style === 'bun') p(13, hy - 3, 6, 4, hair);
    if (style === 'curly') { p(8, hy - 2, 16, 4, hair); p(7, hy + 1, 4, 7, hair); p(21, hy + 1, 4, 7, hair); }
    if (style === 'shaved') { p(9, hy + 2, 2, 5, o.skin); p(21, hy + 2, 2, 5, o.skin); p(10, hy, 12, 2, hair); }
  }
  if (o.head === 'toque') { p(10, hy - 7, 12, 8, '#fbfaf5'); p(9, hy - 9, 14, 4, '#ffffff'); p(10, hy, 12, 2, '#d9d5c9'); }
  if (o.head === 'crown') {
    // A five-panel ceremonial crown with long white ribbons.
    p(8, hy - 5, 16, 6, '#b8261e'); p(8, hy, 16, 1, '#e0b34a'); p(8, hy - 6, 16, 1, '#e0b34a');
    if (dir !== 'back') for (const cx of [9, 13, 17, 21]) { p(cx, hy - 5, 2, 4, '#e0b34a'); p(cx, hy - 4, 2, 2, '#f4e6c0'); }
    p(dir === 'left' ? 20 : 7, hy + 1, 1, 16, '#f4f1e8'); if (dir !== 'left') p(24, hy + 1, 1, 16, '#f4f1e8');
  }
  if (o.cap) { p(10, hy - 1, 12, 3, o.cap); if (dir !== 'back') p(dir === 'left' ? 6 : 10, hy + 1, dir === 'left' ? 7 : 12, 1, o.cap); }
}
function held(p, o, dir, col, y) {
  const working = col === 8 || col === 9;
  const side = dir === 'left';
  if (dir === 'back' && o.hold !== 'broom' && o.hold !== 'cane') return;
  if (o.hold === 'broom') {
    const a = col === 8 ? -2 : col === 9 ? 2 : 0;
    const x = side ? 8 : 25;
    for (let k = 0; k < 8; k++) p(x - Math.round((a * (8 - k)) / 8), 13 + y + k * 3, 1, 3, '#a47a48');
    p(x - 3, 37, 7, 3, '#7a5a30'); p(x - 4, 40, 9, 5, '#c7a35d'); p(x - 4, 44, 9, 1, '#8f7238');
    p(side ? 8 : 24, 27 + y, 3, 3, o.skin);
  }
  if (o.hold === 'cane') { const x = side ? 7 : 25; p(x, 26 + y, 1, 19, '#6a4526'); p(x - 1, 26 + y, 3, 1, '#6a4526'); p(x - 1, 27 + y, 3, 2, o.skin); }
  if (o.hold === 'tray') {
    const x = side ? 3 : 7;
    p(x, 28 + y, 18, 2, '#c7ccd2'); p(x, 30 + y, 18, 1, '#858a91');
    for (const k of [2, 8, 13]) { p(x + k, 24 + y, 5, 4, '#b77a35'); p(x + k + 1, 24 + y, 3, 1, '#dca45a'); }
    p(side ? 12 : 9, 30 + y, 3, 2, o.skin); if (!side) p(20, 30 + y, 3, 2, o.skin);
  }
  if (o.hold === 'taper') {
    const up = working ? -8 : 0;
    const x = side ? 8 : 24;
    p(x, 16 + y + up, 1, 18, '#e9d9a8'); p(x, 13 + y + up, 1, 3, '#ffd27a'); p(x, 12 + y + up, 1, 1, '#fff2c2');
    p(x - 1, 29 + y + up, 3, 2, o.skin);
  }
  if (o.hold === 'rosary' && !side) { for (let k = 0; k < 5; k++) p(13 + k, 28 + y + (k % 2), 1, 1, '#a57b45'); p(15, 30 + y, 2, 5, '#c9a65a'); p(14, 31 + y, 4, 1, '#c9a65a'); }
  if (o.hold === 'mala' && !side) {
    // Prayer beads round the neck, with no cross or pendant.
    for (const [bx, by] of [[11, 20], [11, 22], [12, 24], [13, 26], [15, 27], [17, 27], [19, 26], [20, 24], [21, 22], [21, 20]]) p(bx, by + y, 1, 1, '#5a3218');
    p(15, 28 + y, 2, 1, '#5a3218');
  }
  if (o.hold === 'book' && !side) { p(13, 27 + y, 6, 5, '#4d1c1f'); p(14, 28 + y, 4, 3, '#e0c678'); }
}
function draw(p, o, dir, col) {
  const walk = col >= 2 && col < 6 ? col - 2 : -1;
  const sit = col === 6; const kneel = col === 7;
  const low = sit ? 9 : kneel ? 7 : 0;
  const lift = (col === 1 || walk === 1 || walk === 3) ? 1 : 0;
  const bend = col === 8 ? 1 : 0;
  const y = lift + low + bend;
  const side = dir === 'left'; const back = dir === 'back';
  const sway = walk === 0 ? 1 : walk === 2 ? -1 : 0;
  const B = o.bottom || o.top; const BD = o.bottomD || o.dark;
  // Legs or long skirt.
  if (o.long) {
    p(10, 24 + y, 12, Math.max(1, 21 - y), B);
    p(9 + Math.min(sway, 0), 37 + y, 14 + Math.abs(sway), Math.max(1, 8 - y), B);
    p(20, 24 + y, 3, Math.max(1, 21 - y), BD);
    if (!o.bottom) p(10, 24 + y, 2, Math.max(1, 21 - y), o.light);
    if (!low) { p(10 + sway, 45, 5, 1, '#1b1612'); p(17 + sway, 45, 5, 1, '#1b1612'); }
  } else if (low) {
    p(10, 37, 12, 8, B); p(19, 37, 3, 8, BD);
  } else if (side) {
    const a = walk === 0 ? 2 : walk === 2 ? -2 : 0;
    p(13 + a, 33, 4, 12, BD); p(15 - a, 33, 4, 12, B); p(12 + a, 45, 5, 1, '#1b1612'); p(14 - a, 45, 5, 1, '#1b1612');
  } else {
    const l = walk === 0 ? 1 : 0; const r = walk === 2 ? 1 : 0;
    p(11, 33 + y, 5, 12 - y - l, B); p(17, 33 + y, 5, 12 - y - r, BD);
    p(11, 45 - l, 5, 1, '#1b1612'); p(17, 45 - r, 5, 1, '#1b1612');
  }
  // Body.
  const slim = o.slim && !side ? 1 : 0;
  const bx = (side ? 11 : 9) + slim; const bw = (side ? 10 : 14) - slim * 2;
  const bodyH = o.long ? 8 : o.tunic ? 18 : 15;
  p(bx, 19 + y, bw, Math.min(bodyH, 45 - 19 - y), o.top); p(bx, 19 + y, 2, Math.min(bodyH, 45 - 19 - y), o.light); p(bx + bw - 2, 19 + y, 2, Math.min(bodyH, 45 - 19 - y), o.dark);
  if (o.surplice) { const h = Math.min(18, 45 - 19 - y); p(bx - 1, 19 + y, bw + 2, h, o.top); p(bx - 1, 19 + y, 2, h, o.light); p(bx + bw - 1, 19 + y, 2, h, o.dark); for (let k = 0; k < bw; k += 3) p(bx + k, 19 + y + h - 1, 1, 1, o.dark); }
  if (o.apron && !back) { p(side ? 11 : 11, 25 + y, side ? 7 : 10, Math.min(18, 45 - 25 - y), o.apron); p(side ? 11 : 11, 25 + y, side ? 7 : 10, 1, '#00000055'); }
  if (o.apron && back) { p(9, 27 + y, 14, 1, o.apron); }
  if (o.sash) p(bx, 27 + y, bw, 2, o.sash);
  // A monk's outer robe draped from one shoulder across the body.
  if (o.kasaya) {
    const w = o.kasayaW || 3; const len = Math.min(o.kasayaW ? 22 : 9, 45 - 19 - y);
    for (let k = 0; k < len; k++) p(back ? bx + bw - w - Math.min(k, bw - w) : bx + Math.min(k, bw - w), 19 + y + k, w, 1, o.kasaya);
    if (o.kasayaW && !side) p(back ? bx + bw - 4 : bx, 19 + y, 4, Math.min(16, 45 - 19 - y), o.kasaya);
  }
  // Gold lines on a ceremonial patchwork robe.
  if (o.grid) {
    const top = 19 + y; const bottom = 45 - (low ? 2 : 1);
    for (const gx of [bx + 3, bx + 7, bx + 11]) if (gx < bx + bw) p(gx, top, 1, bottom - top, o.grid);
    for (let gy = top + 5; gy < bottom; gy += 6) p(bx, gy, bw, 1, o.grid);
  }
  // The grey-blue inner robe shows at the neck under the outer robe.
  if (o.collar) { if (back) p(13, 19 + y, 6, 1, o.collar); else if (side) p(11, 19 + y, 3, 3, o.collar); else { p(12, 19 + y, 8, 2, o.collar); p(14, 21 + y, 4, 1, o.collar); p(15, 22 + y, 2, 1, o.collar); } }
  if (o.tie && !back) { if (!side) { p(14, 19 + y, 4, 6, '#f0ece2'); p(15, 19 + y, 2, 9, '#7c1d22'); p(bx, 31 + y, bw, 1, o.dark); } else p(12, 19 + y, 3, 5, '#f0ece2'); }
  // Arms.
  const praying = kneel || (col === 7);
  if (praying && !back) {
    if (side) { p(8, 25 + y, 6, 3, o.light); p(6, 22 + y, 3, 5, o.skin); } else { p(8, 21 + y, 3, 7, o.light); p(21, 21 + y, 3, 7, o.dark); p(11, 26 + y, 10, 2, o.light); p(14, 22 + y, 4, 5, o.skin); }
  } else if (side) {
    const s = walk === 0 ? -2 : walk === 2 ? 2 : 0;
    p(14 + s, 21 + y, 4, 10, o.light); p(14 + s, 31 + y, 4, 2, o.skin);
  } else {
    p(7 + slim, 21 + y, 3, 11, back ? o.dark : o.light); p(22 - slim, 21 + y, 3, 11, o.dark); p(7 + slim, 32 + y, 3, 2, o.skin); p(22 - slim, 32 + y, 3, 2, o.skin);
  }
  head(p, o, dir, 7 + y);
  if (!sit && !praying) held(p, o, dir, col, lift + bend);
}
function outline(g, x0, y0) {
  const d = g.getImageData(x0, y0, W, H).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0;
  g.fillStyle = LINE;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) g.fillRect(x0 + x, y0 + y, 1, 1);
}
// Which row of the sheet to show, from the way someone faces and where the camera is.
export function rowFor(x, z, face, camera) {
  const vx = x - camera.position.x; const vz = z - camera.position.z;
  const n = Math.hypot(vx, vz) || 1;
  const along = (vx * face[0] + vz * face[1]) / n;
  const across = (vx * face[1] - vz * face[0]) / n;
  return along > 0.5 ? ROW.back : along < -0.5 ? ROW.front : across > 0 ? ROW.right : ROW.left;
}
export function peopleSheet(look) {
  const c = document.createElement('canvas');
  c.width = COLS * W; c.height = 4 * H;
  const g = c.getContext('2d', { willReadFrequently: true });
  for (const dir of ['front', 'back', 'left']) for (let col = 0; col < COLS; col++) {
    const x0 = col * W; const y0 = ROW[dir] * H;
    draw((x, y, w, h, color) => { if (h > 0 && w > 0) { g.fillStyle = color; g.fillRect(x0 + x, y0 + y, w, h); } }, look, dir, col);
    outline(g, x0, y0);
  }
  for (let col = 0; col < COLS; col++) {
    g.save(); g.translate(col * W + W, ROW.right * H); g.scale(-1, 1);
    g.drawImage(c, col * W, ROW.left * H, W, H, 0, 0, W, H);
    g.restore();
  }
  return c;
}
export function createPeople(scene, list = window.CHURCH_CAST.CAST) {
  const { LOOKS, onDuty } = window.CHURCH_CAST;
  const baseMaps = {};
  const mapFor = (name) => {
    if (!baseMaps[name]) {
      const t = new THREE.CanvasTexture(peopleSheet(LOOKS[name]));
      t.colorSpace = THREE.SRGBColorSpace;
      t.magFilter = t.minFilter = THREE.NearestFilter;
      t.generateMipmaps = false;
      t.repeat.set(1 / COLS, 1 / 4);
      baseMaps[name] = t;
    }
    const m = baseMaps[name].clone();
    m.needsUpdate = true;
    return m;
  };
  const people = list.map((c) => {
    const material = new THREE.SpriteMaterial({ map: mapFor(c.look), alphaTest: 0.5 });
    const sprite = new THREE.Sprite(material);
    const k = LOOKS[c.look].small ? 0.72 : 1;
    sprite.scale.set(1.25 * k, 1.88 * k, 1);
    sprite.center.set(0.5, 2 / H);
    sprite.renderOrder = 2;
    const [x, z] = c.route[0];
    sprite.position.set(x, (c.y || 0) + 0.05 + (c.route[0][3] === 'sit' ? 0.42 : 0), z);
    sprite.userData.person = c;
    scene.add(sprite);
    return { c, sprite, material, stop: 0, wait: (c.route[0][2] || 0) * 0.4, face: c.route[0][4] || [0, -1], pose: c.route[0][3] || 'idle', moving: false };
  });
  let show = true;
  let time = 'sunset';
  const refresh = () => { for (const q of people) q.sprite.visible = show && onDuty(q.c.hours, time); };
  const TINT = { day: 1, morning: 1, sunrise: 0.96, sunset: 0.94, night: 0.74 };
  return {
    sprites: people.map((q) => q.sprite),
    setTime(name) { time = name; for (const q of people) q.material.color.setScalar(TINT[name] ?? 1); refresh(); },
    setShown(on) { show = on; refresh(); },
    get shown() { return show; },
    update(dt, now, camera, moving) {
      for (const q of people) {
        if (!q.sprite.visible) continue;
        const r = q.c.route;
        let col = Math.floor(now / 650) % 2;
        if (moving) {
          if (q.wait > 0) {
            q.wait -= dt;
            q.moving = false;
          } else if (r.length > 1) {
            const next = r[(q.stop + 1) % r.length];
            const dx = next[0] - q.sprite.position.x; const dz = next[1] - q.sprite.position.z;
            const d = Math.hypot(dx, dz);
            const stepLen = dt * (q.c.speed || 1.05);
            if (d <= stepLen) {
              q.sprite.position.x = next[0]; q.sprite.position.z = next[1];
              q.stop = (q.stop + 1) % r.length;
              q.wait = next[2] || 0;
              q.pose = next[3] || 'idle';
              if (next[4]) q.face = next[4];
              q.moving = false;
            } else {
              q.sprite.position.x += (dx / d) * stepLen; q.sprite.position.z += (dz / d) * stepLen;
              q.face = [dx / d, dz / d];
              q.moving = true;
            }
          }
        }
        if (q.moving) col = q.c.sweeps ? 8 + (Math.floor(now / 420) % 2) : 2 + (Math.floor(now / 190) % 4);
        else if (q.pose === 'work') col = 8 + (Math.floor(now / 600) % 2);
        else if (POSE[q.pose]) col = POSE[q.pose];
        q.material.map.offset.set(col / COLS, 1 - (rowFor(q.sprite.position.x, q.sprite.position.z, q.face, camera) + 1) / 4);
      }
    },
  };
}

// The visitor's own character, standing just ahead of the camera.
export function createMe() {
  const blank = document.createElement('canvas');
  blank.width = COLS * W; blank.height = 4 * H;
  const texture = new THREE.CanvasTexture(blank);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.repeat.set(1 / COLS, 1 / 4);
  const material = new THREE.SpriteMaterial({ map: texture, alphaTest: 0.5 });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.25, 1.88, 1);
  sprite.center.set(0.5, 2 / H);
  sprite.renderOrder = 3;
  sprite.userData.me = true;
  sprite.visible = false;
  return {
    sprite,
    setSheet(canvas) { texture.image = canvas; texture.needsUpdate = true; },
    setAt(x, y, z, face, walking, camera, now, seated = false) {
      sprite.position.set(x, y + 0.05 + (seated === true ? 0.42 : 0), z);
      const col = seated === 'pray' ? POSE.kneel : seated ? POSE.sit : walking ? 2 + (Math.floor(now / 190) % 4) : Math.floor(now / 650) % 2;
      texture.offset.set(col / COLS, 1 - (rowFor(x, z, face, camera) + 1) / 4);
    },
  };
}
