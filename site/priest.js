// An original pixel-art priest with four outfits. Frames are 32 by 48.
import * as THREE from './vendor/three.module.min.js';

const W = 32; const H = 48; const COLS = 6;
const ROW = { front: 0, back: 1, left: 2, right: 3 };
const SKIN = '#e4b58f'; const SHADE = '#b98765'; const HAIR = '#39302c'; const LINE = '#17121c';
export const OUTFITS = {
  day: { label: 'Day', note: 'Black cassock with silver crosses', robe: '#23222a', light: '#3b3a46', dark: '#121118', trim: '#d9dbe2', cuff: '#a9acb6', sash: '#16151b' },
  night: { label: 'Night', note: 'White cassock, shoulder cape and staff', robe: '#f1eee6', light: '#ffffff', dark: '#c9c5ba', trim: '#b7b2a3', cuff: '#fff', sash: '#e2d6b6', cape: true, staff: true, cross: '#c49a3b' },
  holiday: { label: 'Holiday', note: 'Red cassock, red cap and gold chain', robe: '#a81622', light: '#cf2a33', dark: '#73101b', trim: '#d9b24a', cuff: '#a81622', sash: '#8d121d', cap: true, chain: true },
  weekend: { label: 'Weekend', note: 'Ivory robes, gold bands and a mitre', robe: '#efe5cf', light: '#fbf4e2', dark: '#c4b48f', trim: '#d6a93f', cuff: '#efe5cf', sash: '#efe5cf', mitre: true, cope: true, chain: true },
};

function draw(p, o, dir, col) {
  const walk = col >= 2 ? col - 2 : -1;
  const lift = col === 1 || walk === 1 || walk === 3 ? 1 : 0;
  const side = dir === 'left';
  const back = dir === 'back';
  const y = lift;
  // Long robe to the floor, with a sway when walking.
  const sway = walk === 0 ? 1 : walk === 2 ? -1 : 0;
  if (o.staff && !back) { p(side ? 7 : 25, 8 + y, 1, 37, '#8a5a30'); p(side ? 7 : 25, 8 + y, 1, 2, '#c49a3b'); }
  p(10, 24 + y, 12, 13, o.robe);
  p(9 + Math.min(sway, 0), 37 + y, 14 + Math.abs(sway), 8 - y, o.robe);
  p(10, 24 + y, 2, 21 - y, o.light);
  p(20, 24 + y, 3, 21 - y, o.dark);
  p(10 + sway, 45, 5, 1, '#1b1612'); p(17 + sway, 45, 5, 1, '#1b1612');
  // Shoulders.
  p(9, 19 + y, 14, 6, o.robe); p(9, 19 + y, 2, 6, o.light); p(21, 19 + y, 2, 6, o.dark);
  if (!back && !side) {
    if (!o.cope) for (let k = 21; k < 44; k += 3) p(16, k + y, 1, 1, o.trim);
    p(14, 18 + y, 4, 2, '#fff'); // Collar.
  }
  if (o.cope) {
    p(8, 20 + y, 16, 22, o.light); p(21, 20 + y, 3, 22, o.dark);
    if (!back) { p(14, 20 + y, 4, 24, o.trim); p(15, 20 + y, 2, 24, '#8f6a22'); p(8, 40 + y, 16, 2, o.trim); }
    else { p(12, 22 + y, 8, 20, o.trim); p(13, 23 + y, 6, 18, o.light); }
  }
  // Sash with trailing end.
  if (!o.cope) {
    p(10, 28 + y, 13, 3, o.sash);
    if (!back) { p(side ? 12 : 18, 31 + y, 3, 12, o.sash); if (o.trim) { p(side ? 12 : 18, 31 + y, 1, 12, o.trim); p(side ? 14 : 20, 31 + y, 1, 12, o.trim); } }
  }
  if (o === OUTFITS.day && !back) {
    for (const [cx, cy] of [[side ? 13 : 19, 22], [side ? 13 : 19, 34], [side ? 13 : 19, 39]]) { p(cx, cy + y, 1, 4, o.trim); p(cx - 1, cy + 1 + y, 3, 1, o.trim); }
  }
  // Cape over the shoulders.
  if (o.cape) { p(7, 19 + y, 18, 8, o.light); p(21, 19 + y, 4, 8, o.dark); p(7, 26 + y, 18, 1, o.trim); if (!back) p(14, 18 + y, 4, 2, '#d5d0c4'); }
  // Arms: hands together, or holding the staff.
  if (side) {
    const s = walk === 0 ? -2 : walk === 2 ? 2 : 0;
    p(14 + s, 21 + y, 4, 11, o.cape ? o.robe : o.light); p(14 + s, 31 + y, 4, 2, o.cuff); p(14 + s, 33 + y, 4, 2, SKIN);
  } else if (!back) {
    if (o.staff) {
      p(21, 21 + y, 3, 9, o.robe); p(24, 26 + y, 2, 3, SKIN);
      p(8, 21 + y, 3, 12, o.robe); p(8, 33 + y, 3, 2, SKIN);
    } else {
      p(8, 21 + y, 3, 8, o.light); p(21, 21 + y, 3, 8, o.dark);
      p(9, 28 + y, 4, 2, o.cuff); p(19, 28 + y, 4, 2, o.cuff);
      p(13, 27 + y, 6, 3, o.light); p(14, 26 + y, 4, 3, SKIN);
    }
  } else { p(7, 21 + y, 3, 12, o.dark); p(22, 21 + y, 3, 12, o.dark); p(7, 33 + y, 3, 2, SKIN); p(22, 33 + y, 3, 2, SKIN); }
  // Chain and cross on the chest.
  if ((o.chain || o.cross) && !back && !side) {
    const c = o.cross || '#e0b94e';
    for (let k = 0; k < 4; k++) { p(13 + k, 20 + k + y, 1, 1, c); p(18 - k, 20 + k + y, 1, 1, c); }
    p(15, 24 + y, 2, 6, o.chain ? '#e5e7ec' : c); p(14, 25 + y, 4, 2, o.chain ? '#e5e7ec' : c);
  }
  // Head.
  const hy = 7 + y;
  if (back) {
    p(10, hy, 12, 12, HAIR); p(11, hy + 12, 10, 1, SHADE);
  } else if (side) {
    p(9, hy + 1, 12, 10, SKIN); p(11, hy + 11, 8, 2, SHADE); p(13, hy, 10, 5, HAIR); p(19, hy + 4, 4, 6, HAIR); p(11, hy + 5, 2, 2, LINE);
  } else {
    p(10, hy + 1, 12, 11, SKIN); p(11, hy + 12, 10, 1, SHADE); p(10, hy, 12, 3, HAIR); p(9, hy + 2, 2, 5, HAIR); p(21, hy + 2, 2, 5, HAIR);
    p(13, hy + 6, 2, 2, LINE); p(18, hy + 6, 2, 2, LINE); p(15, hy + 10, 3, 1, SHADE);
  }
  if (o.cap) { p(11, hy - 1, 10, 3, '#b81a28'); p(12, hy - 2, 8, 1, '#d93240'); }
  if (o.mitre) {
    p(10, hy - 7, 12, 9, o.light); p(9, hy, 14, 2, o.trim); p(15, hy - 7, 2, 8, o.trim); p(11, hy - 8, 4, 1, o.light); p(17, hy - 8, 4, 1, o.light); p(13, hy - 10, 2, 2, o.light); p(17, hy - 10, 2, 2, o.light);
    p(13, hy - 4, 6, 1, o.trim);
  }
}
function outline(g, x0, y0) {
  const d = g.getImageData(x0, y0, W, H).data;
  const on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0;
  g.fillStyle = LINE;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!on(x, y) && (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1))) g.fillRect(x0 + x, y0 + y, 1, 1);
}
export function priestSheet(name) {
  const c = document.createElement('canvas');
  c.width = COLS * W; c.height = 4 * H;
  const g = c.getContext('2d', { willReadFrequently: true });
  for (const dir of ['front', 'back', 'left']) for (let col = 0; col < COLS; col++) {
    const x0 = col * W; const y0 = ROW[dir] * H;
    draw((x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x0 + x, y0 + y, w, h); }, OUTFITS[name], dir, col);
    outline(g, x0, y0);
  }
  for (let col = 0; col < COLS; col++) {
    g.save();
    g.translate(col * W + W, ROW.right * H);
    g.scale(-1, 1);
    g.drawImage(c, col * W, ROW.left * H, W, H, 0, 0, W, H);
    g.restore();
  }
  return c;
}
export function createPriest(scene) {
  const maps = {};
  for (const name of Object.keys(OUTFITS)) {
    const t = new THREE.CanvasTexture(priestSheet(name));
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.repeat.set(1 / COLS, 1 / 4);
    maps[name] = t;
  }
  const material = new THREE.SpriteMaterial({ map: maps.day, alphaTest: 0.5 });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.25, 1.88, 1);
  sprite.center.set(0.5, 2 / H);
  sprite.renderOrder = 2;
  scene.add(sprite);
  const path = { z: 100, dir: -1, wait: 0 };
  sprite.position.set(0, 0.05, path.z);
  const api = {
    setOutfit(name) { material.map = maps[name]; material.needsUpdate = true; },
    place(x, z) { sprite.position.set(x, 0.05, z); path.z = z; },
    update(dt, now, camera, moving) {
      let col = Math.floor(now / 650) % 2;
      if (moving) {
        if (path.wait > 0) path.wait -= dt;
        else {
          path.z += path.dir * dt * 1.15;
          col = 2 + (Math.floor(now / 190) % 4);
          if (path.z < 36) { path.dir = 1; path.wait = 5; }
          if (path.z > 106) { path.dir = -1; path.wait = 5; }
        }
        sprite.position.z = path.z;
      }
      const toward = Math.sign(camera.position.z - path.z) === path.dir;
      const row = path.wait > 0 || toward ? 'front' : 'back';
      const m = material.map;
      m.offset.set(col / COLS, 1 - (ROW[row] + 1) / 4);
    },
  };
  return api;
}
