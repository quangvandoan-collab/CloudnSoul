// Original pixel-art visitor, drawn by code with no image files.
// Frames are 32 by 48. Rows: front, back, left, right.
import * as THREE from './vendor/three.module.min.js';

export const FRAME = { IDLE: 0, IDLE2: 1, WALK: 2, SIT: 6, BOW1: 7, BOW2: 8, PALMS: 9, KNEEL: 10 };
const COLUMNS = 11;
const W = 32;
const H = 48;
const ROW = { front: 0, back: 1, left: 2, right: 3 };

const C = {
  outline: '#1b1420', skin: '#f2c9a0', skinDark: '#d79f78', hair: '#2a1d2c', hairLight: '#4a3550',
  robe: '#a42f35', robeLight: '#d0504a', robeDark: '#6f1f2d', gold: '#e8bd5a', white: '#efe7d6', whiteDark: '#b9b0a7',
  shoe: '#3a2432', eye: '#201524', blush: '#e89a84',
};

function drawHead(p, dir, y, closed) {
  if (dir === 'back') {
    p(10, y, 12, 12, C.hair); p(9, y + 2, 14, 8, C.hair); p(12, y + 1, 5, 2, C.hairLight);
    p(14, y - 4, 5, 5, C.hair); p(15, y - 4, 2, 2, C.hairLight); p(13, y - 1, 7, 1, C.gold);
    p(11, y + 12, 10, 1, C.skinDark);
    return;
  }
  if (dir === 'front') {
    p(10, y + 1, 12, 11, C.skin); p(9, y + 3, 14, 7, C.skin); p(11, y + 12, 10, 1, C.skinDark);
    p(10, y, 12, 3, C.hair); p(9, y + 2, 2, 6, C.hair); p(21, y + 2, 2, 6, C.hair); p(11, y + 3, 4, 2, C.hair); p(18, y + 3, 3, 1, C.hair);
    p(12, y + 1, 5, 1, C.hairLight);
    p(14, y - 4, 5, 5, C.hair); p(15, y - 4, 2, 2, C.hairLight); p(13, y - 1, 7, 1, C.gold);
    if (closed) { p(12, y + 7, 3, 1, C.eye); p(18, y + 7, 3, 1, C.eye); } else {
      p(13, y + 6, 2, 3, C.eye); p(18, y + 6, 2, 3, C.eye); p(13, y + 6, 1, 1, '#ffffff'); p(18, y + 6, 1, 1, '#ffffff');
    }
    p(11, y + 9, 2, 1, C.blush); p(20, y + 9, 2, 1, C.blush); p(15, y + 10, 3, 1, C.skinDark);
    return;
  }
  // Facing left. The right-facing row is a mirror of this.
  p(9, y + 2, 12, 10, C.skin); p(11, y + 12, 8, 1, C.skinDark);
  p(10, y, 12, 3, C.hair); p(15, y + 2, 8, 8, C.hair); p(9, y + 2, 4, 2, C.hair); p(12, y + 1, 5, 1, C.hairLight);
  p(19, y - 3, 5, 5, C.hair); p(20, y - 3, 2, 2, C.hairLight); p(18, y, 6, 1, C.gold);
  if (closed) p(10, y + 7, 3, 1, C.eye); else { p(11, y + 6, 2, 3, C.eye); p(11, y + 6, 1, 1, '#ffffff'); }
  p(10, y + 9, 2, 1, C.blush);
}

function drawFrame(p, dir, col) {
  const side = dir === 'left';
  const back = dir === 'back';
  const walk = col >= FRAME.WALK && col < FRAME.SIT ? col - FRAME.WALK : -1;
  const seated = col === FRAME.SIT || col === FRAME.KNEEL;
  const praying = col === FRAME.PALMS || col === FRAME.KNEEL;
  const bow = col === FRAME.BOW1 ? 1 : col === FRAME.BOW2 ? 2 : 0;
  const lift = col === FRAME.IDLE2 || walk === 1 || walk === 3 ? 1 : 0;
  const drop = seated ? 7 : 0;
  const top = 25 + lift + drop + bow;
  const headY = 10 + lift + drop + bow * 3 + (seated ? 0 : 0);

  if (seated) {
    p(7, 40, 18, 5, C.robe); p(6, 42, 20, 3, C.robeDark); p(9, 39, 14, 2, C.robeLight); p(7, 44, 18, 1, C.outline);
    p(5, 43, 4, 2, C.white); p(23, 43, 4, 2, C.white);
  } else {
    const a = walk === 0 ? 2 : walk === 2 ? -2 : 0;
    if (side) {
      p(14 + a, 39, 4, 6, C.white); p(14 + a, 45, 4, 1, C.shoe);
      p(15 - a, 39, 4, 6, C.whiteDark); p(15 - a, 45, 4, 1, C.shoe);
      const sway = walk >= 0 ? (walk === 1 || walk === 3 ? 0 : 1) : 0;
      p(11, 33, 10 + sway, 7, C.robe); p(11 + sway, 40, 9, 3, C.robeDark); p(17, 33, 4, 7, C.robeDark);
    } else {
      const lh = walk === 0 ? 1 : 0;
      const rh = walk === 2 ? 1 : 0;
      p(12, 39, 4, 6 - lh, C.white); p(12, 45 - lh, 4, 1, C.shoe);
      p(17, 39, 4, 6 - rh, C.whiteDark); p(17, 45 - rh, 4, 1, C.shoe);
      p(10, 33, 13, 7, C.robe); p(10, 40, 5, 3, C.robeDark); p(18, 40, 5, 3, C.robeDark);
      p(15, 34, 3, 6, C.robeLight); p(10, 33, 2, 7, C.robeDark); p(21, 33, 2, 7, C.robeDark);
    }
  }
  // Tunic.
  const bx = side ? 12 : 11;
  const bw = side ? 8 : 11;
  const bh = Math.max(4, 33 + (seated ? 7 : 0) - top);
  p(bx, top, bw, bh, C.robe);
  p(bx, top, 1, bh, C.robeLight);
  p(bx + bw - 2, top, 2, bh, C.robeDark);
  if (!back) { p(side ? 12 : 14, top, side ? 3 : 5, 2, C.gold); p(side ? 13 : 16, top + 2, 1, bh - 2, C.gold); }
  else p(bx + 3, top, 5, 1, C.gold);
  // Arms.
  if (praying || bow) {
    if (side) { p(9, top + 3, 5, 3, C.robeLight); p(7, top + 1, 3, 4, C.skin); } else if (!back) {
      p(10, top + 3, 4, 3, C.robeLight); p(19, top + 3, 4, 3, C.robeDark); p(15, top + 1, 3, 5, C.skin); p(16, top + 1, 1, 5, C.skinDark);
    } else { p(9, top + 1, 3, 6, C.robeDark); p(21, top + 1, 3, 6, C.robeDark); }
  } else if (side) {
    const s = walk === 0 ? -2 : walk === 2 ? 2 : 0;
    p(15 + s, top + 1, 3, 7, C.robeLight); p(15 + s, top + 8, 3, 2, C.skin);
  } else {
    const s = walk === 0 ? 1 : walk === 2 ? -1 : 0;
    p(8, top + 1 + s, 3, 7, C.robeLight); p(8, top + 8 + s, 3, 2, C.skin);
    p(22, top + 1 - s, 3, 7, C.robeDark); p(22, top + 8 - s, 3, 2, C.skin);
  }
  drawHead(p, dir, headY, praying || bow > 0);
}

// A dark outline around the whole figure gives the hand-drawn sprite look.
function outline(g, x0, y0) {
  const img = g.getImageData(x0, y0, W, H);
  const d = img.data;
  const solid = (x, y) => x >= 0 && y >= 0 && x < W && y < H && d[(y * W + x) * 4 + 3] > 0;
  const add = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) add.push([x, y]);
  }
  g.fillStyle = C.outline;
  for (const [x, y] of add) g.fillRect(x0 + x, y0 + y, 1, 1);
}

export function createSheet() {
  const c = document.createElement('canvas');
  c.width = COLUMNS * W;
  c.height = 4 * H;
  const g = c.getContext('2d', { willReadFrequently: true });
  for (const dir of ['front', 'back', 'left']) {
    for (let col = 0; col < COLUMNS; col++) {
      const x0 = col * W;
      const y0 = ROW[dir] * H;
      drawFrame((x, y, w, h, color) => { g.fillStyle = color; g.fillRect(x0 + x, y0 + y, w, h); }, dir, col);
      outline(g, x0, y0);
    }
  }
  g.save();
  g.translate(c.width, 0);
  g.scale(-1, 1);
  for (let col = 0; col < COLUMNS; col++) {
    const flipped = (COLUMNS - 1 - col) * W;
    g.drawImage(c, col * W, ROW.left * H, W, H, flipped, ROW.right * H, W, H);
  }
  g.restore();
  // The mirror above reverses column order, so copy each frame back into place.
  const right = document.createElement('canvas');
  right.width = c.width;
  right.height = H;
  right.getContext('2d').drawImage(c, 0, ROW.right * H, c.width, H, 0, 0, c.width, H);
  g.clearRect(0, ROW.right * H, c.width, H);
  g.drawImage(right, 0, ROW.right * H);
  return c;
}

let sheetTexture = null;
export function createCharacter() {
  if (!sheetTexture) {
    sheetTexture = new THREE.CanvasTexture(createSheet());
    sheetTexture.colorSpace = THREE.SRGBColorSpace;
    sheetTexture.magFilter = sheetTexture.minFilter = THREE.NearestFilter;
    sheetTexture.generateMipmaps = false;
  }
  const map = sheetTexture.clone();
  map.needsUpdate = true;
  map.repeat.set(1 / COLUMNS, 1 / 4);
  const material = new THREE.SpriteMaterial({ map, alphaTest: 0.5 });
  const sprite = new THREE.Sprite(material);
  const height = 2.15;
  sprite.scale.set(height * (W / H), height, 1);
  sprite.center.set(0.5, 2 / H);
  sprite.renderOrder = 2;
  return {
    sprite,
    set(row, col) {
      map.offset.set(col / COLUMNS, 1 - (ROW[row] + 1) / 4);
    },
  };
}
