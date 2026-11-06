// Stage 2 interior sample: the nave, crossing and sanctuary, built in code.
// The nave ceiling is textures/ceiling-nave.jpg and the altar relief is textures/altar-relief.jpg.
import * as THREE from './vendor/three.module.min.js';
import { makeFigure } from './figures.js';
import { createPriest } from './priest.js';
import { createPeople, createMe } from './people.js';
import { buildRoom } from './rooms.js';
import './pad.js';
import { createSeatPopup } from './seat.js';
import { setupPriestPanel } from './reader.js';

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('view');
const phone = /Mobi|Android/i.test(navigator.userAgent);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, phone ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a130d);
const camera = new THREE.PerspectiveCamera(66, 1, 0.1, 400);
camera.rotation.order = 'YXZ';
let seedV = 2026;
const rand = () => (seedV = (seedV * 16807) % 2147483647) / 2147483647;
const anis = renderer.capabilities.getMaxAnisotropy();
const TRS = (x, y, z, ry = 0, rx = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
const scale = phone ? 0.5 : 1;

function tex(w, h, draw, repeat = false) {
  const c = document.createElement('canvas');
  c.width = Math.round(w * scale); c.height = Math.round(h * scale);
  const g = c.getContext('2d');
  g.scale(scale, scale);
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anis;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------- Painting tools ----------
function cloud(g, x, y, r, color, alpha) {
  for (let i = 0; i < 16; i++) {
    const a = rand() * 6.28; const d = rand() * r; const q = r * (0.25 + rand() * 0.5);
    const px = x + Math.cos(a) * d * 1.5; const py = y + Math.sin(a) * d * 0.6;
    const gr = g.createRadialGradient(px, py, 1, px, py, q);
    gr.addColorStop(0, `rgba(${color},${alpha})`); gr.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = gr; g.fillRect(px - q, py - q, q * 2, q * 2);
  }
}
const ROBE = [['#a84a44', '#5a2020'], ['#4e6ea6', '#233a68'], ['#c49a4e', '#6f5224'], ['#578a78', '#264e43'], ['#83648f', '#44304f'], ['#e6dcc8', '#a99c84']];
// An original, loosely painted winged figure in rising drapery.
function figure(g, x, y, size, angle, robe, wings = true) {
  g.save();
  g.translate(x, y); g.rotate(angle); g.scale(size, size);
  if (wings) {
    for (const side of [-1, 1]) {
      const w = g.createLinearGradient(0, 0, side * 46, -30);
      w.addColorStop(0, '#fff6df'); w.addColorStop(1, '#c79a56');
      g.fillStyle = w;
      g.beginPath(); g.moveTo(side * 6, -24); g.bezierCurveTo(side * 34, -58, side * 56, -38, side * 50, -2); g.bezierCurveTo(side * 38, -14, side * 22, -10, side * 7, -8); g.fill();
      g.strokeStyle = 'rgba(110,70,30,.42)'; g.lineWidth = 1;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(side * 9, -18 + i * 2); g.quadraticCurveTo(side * 30, -42 + i * 8, side * (47 - i * 6), -8 - i); g.stroke(); }
    }
  }
  const d = g.createLinearGradient(-20, -30, 22, 54);
  d.addColorStop(0, robe[0]); d.addColorStop(1, robe[1]);
  g.fillStyle = d;
  g.beginPath(); g.moveTo(-9, -28); g.bezierCurveTo(-24, -6, -28, 34, -18, 58); g.bezierCurveTo(-6, 48, 8, 66, 24, 50); g.bezierCurveTo(24, 22, 18, -10, 9, -28); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,240,210,.34)'; g.lineWidth = 1.6;
  for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 5, -18); g.bezierCurveTo(i * 11, 6, i * 4, 22, i * 13, 48); g.stroke(); }
  g.fillStyle = '#efc8a2';
  g.beginPath(); g.ellipse(-16, -18, 4, 11, 0.8, 0, 6.3); g.fill();
  g.beginPath(); g.ellipse(16, -18, 4, 11, -0.8, 0, 6.3); g.fill();
  g.beginPath(); g.arc(0, -38, 9, 0, 6.3); g.fill();
  g.fillStyle = 'rgba(82,48,22,.9)';
  g.beginPath(); g.arc(0, -41, 9.4, Math.PI, 0); g.fill();
  g.strokeStyle = 'rgba(255,214,110,.9)'; g.lineWidth = 2;
  g.beginPath(); g.arc(0, -40, 15, 0, 6.3); g.stroke();
  g.restore();
}
function glorySky(g, cx, cy, rw, rh, warm = '255,214,140') {
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rw, rh));
  gr.addColorStop(0, '#fff8df'); gr.addColorStop(0.2, '#ffdf9c'); gr.addColorStop(0.46, '#ec9f6d'); gr.addColorStop(0.68, '#6f90c8'); gr.addColorStop(1, '#2d4c95');
  g.save();
  g.translate(cx, cy); g.scale(rw / Math.max(rw, rh), rh / Math.max(rw, rh)); g.translate(-cx, -cy);
  g.fillStyle = gr; g.fillRect(cx - rw * 2, cy - rh * 2, rw * 4, rh * 4);
  g.restore();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 44; i++) {
    const a = (i / 44) * 6.283; const wd = 0.03 + rand() * 0.03;
    g.fillStyle = `rgba(${warm},${0.05 + rand() * 0.07})`;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a - wd) * rw * 1.2, cy + Math.sin(a - wd) * rh * 1.2); g.lineTo(cx + Math.cos(a + wd) * rw * 1.2, cy + Math.sin(a + wd) * rh * 1.2); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
}
function fresco(g, cx, cy, rw, rh) {
  g.save();
  g.beginPath(); g.ellipse(cx, cy, rw, rh, 0, 0, 6.283); g.clip();
  glorySky(g, cx, cy, rw, rh);
  for (let i = 0; i < 22; i++) {
    const a = rand() * 6.283; const r = 0.46 + rand() * 0.5;
    cloud(g, cx + Math.cos(a) * rw * r, cy + Math.sin(a) * rh * r, rw * (0.1 + rand() * 0.13), r > 0.75 ? '238,226,226' : '255,231,190', 0.27);
  }
  // Figures rise in loose groups on banks of cloud toward the light.
  for (let k = 0; k < 7; k++) {
    const a0 = rand() * 6.283; const r0 = 0.45 + rand() * 0.42;
    const gx = cx + Math.cos(a0) * rw * r0; const gy = cy + Math.sin(a0) * rh * r0;
    const n = 2 + Math.floor(rand() * 4);
    for (let i = 0; i < n; i++) {
      const s0 = (0.9 + r0 * 3.1) * (0.8 + rand() * 0.5);
      const x = gx + (rand() - 0.5) * 210; const y = gy + (rand() - 0.5) * 150;
      const toLight = Math.atan2(cy - y, cx - x) + Math.PI / 2 + (rand() - 0.5) * 0.9;
      figure(g, x, y, s0, toLight, ROBE[Math.floor(rand() * ROBE.length)], rand() < 0.55);
    }
    for (let i = 0; i < 3; i++) cloud(g, gx + (rand() - 0.5) * 220, gy + (rand() - 0.5) * 150, 62 + rand() * 80, '250,232,206', 0.15);
  }
  g.restore();
  // Carved gold frame.
  g.strokeStyle = '#7a5416'; g.lineWidth = 34; g.beginPath(); g.ellipse(cx, cy, rw + 15, rh + 15, 0, 0, 6.283); g.stroke();
  g.strokeStyle = '#efc660'; g.lineWidth = 18; g.beginPath(); g.ellipse(cx, cy, rw + 15, rh + 15, 0, 0, 6.283); g.stroke();
  g.strokeStyle = '#fff0b8'; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, rw + 8, rh + 8, 0, 0, 6.283); g.stroke();
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * 6.283;
    g.fillStyle = i % 2 ? '#8e2a2c' : '#2c56b0';
    g.beginPath(); g.arc(cx + Math.cos(a) * (rw + 15), cy + Math.sin(a) * (rh + 15), 5, 0, 6.3); g.fill();
  }
}
function stars(g, w, h, n, y0 = 0) {
  for (let i = 0; i < n; i++) {
    const x = rand() * w; const y = y0 + rand() * h; const r = 3 + rand() * 6;
    g.fillStyle = '#efc660';
    g.beginPath();
    for (let k = 0; k < 16; k++) { const a = (k / 16) * 6.283; const q = k % 2 ? r * 0.28 : r; g.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    g.fill();
  }
}
function paintVault(g, w, h) {
  g.fillStyle = '#16307f'; g.fillRect(0, 0, w, h);
  stars(g, w, h, 900);
}
function paintDome(g, w, h) {
  // Top of the image is the crown of the dome.
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#fff8de'); sky.addColorStop(0.1, '#ffe39f'); sky.addColorStop(0.28, '#f1a86f'); sky.addColorStop(0.55, '#7d97cc'); sky.addColorStop(1, '#2d4a92');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) cloud(g, rand() * w, h * (0.25 + rand() * 0.68), 58 + rand() * 90, i % 3 ? '255,236,206' : '230,226,238', 0.24);
  for (const [v, n, s] of [[0.78, 14, 3.4], [0.56, 11, 2.5], [0.37, 8, 1.7]]) {
    for (let i = 0; i < n; i++) {
      const x = ((i + rand() * 0.8) / n) * w; const y = h * v + (rand() - 0.5) * 70;
      cloud(g, x, y + 70, 80, '255,238,210', 0.2);
      figure(g, x, y, s, Math.PI + (rand() - 0.5) * 0.3, ROBE[Math.floor(rand() * ROBE.length)], rand() < 0.78);
    }
  }
  // Eight gold ribs and a border at the base.
  for (let i = 0; i < 8; i++) {
    const x = (i / 8) * w;
    g.fillStyle = '#7a5416'; g.fillRect(x - 18, 0, 36, h);
    g.fillStyle = '#efc660'; g.fillRect(x - 11, 0, 22, h);
    g.fillStyle = '#fff0b8'; g.fillRect(x - 2, 0, 4, h);
  }
  g.fillStyle = '#7a5416'; g.fillRect(0, h - 42, w, 42);
  g.fillStyle = '#e6bc58'; g.fillRect(0, h - 34, w, 24);
}
function paintMosaic(g, w, h) {
  const t = 15;
  for (let y = 0; y < h; y += t) for (let x = (y / t % 2) * t * 0.5; x < w; x += t) {
    const dx = (x - w / 2) / w; const dy = (y - h * 0.42) / h;
    const a = Math.atan2(dy, dx); const ray = Math.pow(Math.abs(Math.sin(a * 12)), 5);
    const v = 170 + rand() * 72 + ray * 28;
    g.fillStyle = `rgb(${v + 28},${v * 0.76 + 12},${v * 0.25})`;
    g.fillRect(x + 1, y + 1, t - 2, t - 2);
  }
  // Radiant cross in blue and white, kept symbolic.
  g.fillStyle = 'rgba(255,250,225,.8)';
  g.beginPath(); g.ellipse(w / 2, h * 0.44, w * 0.2, h * 0.34, 0, 0, 6.3); g.fill();
  g.fillStyle = '#1c348d';
  g.beginPath(); g.ellipse(w / 2, h * 0.44, w * 0.17, h * 0.3, 0, 0, 6.3); g.fill();
  stars(g, 0, 0, 0);
  for (let i = 0; i < 90; i++) {
    const a = rand() * 6.283; const r = rand();
    g.fillStyle = '#efc660';
    g.beginPath(); g.arc(w / 2 + Math.cos(a) * r * w * 0.16, h * 0.44 + Math.sin(a) * r * h * 0.29, 2 + rand() * 3, 0, 6.3); g.fill();
  }
  g.fillStyle = '#fff4d0';
  g.fillRect(w / 2 - 15, h * 0.2, 30, h * 0.48);
  g.fillRect(w / 2 - w * 0.09, h * 0.32, w * 0.18, 30);
}
function paintGlass(g, w, h) {
  const colors = ['#143fb6', '#a81d2e', '#d99d26', '#17795b', '#5b2ca0', '#2277c8', '#c04b1f'];
  g.fillStyle = '#0d0a0d'; g.fillRect(0, 0, w, h);
  const cell = w / 7;
  for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
    const dx = (x + cell / 2 - w / 2) / w;
    g.fillStyle = Math.abs(dx) > 0.38 ? '#d99d26' : colors[Math.floor(rand() * 2) * 5];
    g.fillRect(x + 2, y + 2, cell - 4, cell - 4);
  }
  for (let m = 0; m < 4; m++) {
    const cy = h * (0.14 + m * 0.24); const r = w * 0.34;
    g.fillStyle = '#0d0a0d'; g.beginPath(); g.arc(w / 2, cy, r + 5, 0, 6.3); g.fill();
    const segs = 12;
    for (let i = 0; i < segs; i++) {
      g.fillStyle = colors[(i + m) % colors.length];
      g.beginPath(); g.moveTo(w / 2, cy); g.arc(w / 2, cy, r, (i / segs) * 6.283 + 0.02, ((i + 1) / segs) * 6.283 - 0.02); g.fill();
    }
    g.fillStyle = '#fff3c0'; g.beginPath(); g.arc(w / 2, cy, r * 0.42, 0, 6.3); g.fill();
    g.fillStyle = colors[m]; g.beginPath(); g.arc(w / 2, cy, r * 0.32, 0, 6.3); g.fill();
    g.fillStyle = '#fff3c0'; g.fillRect(w / 2 - 3, cy - r * 0.26, 6, r * 0.52); g.fillRect(w / 2 - r * 0.17, cy - r * 0.1, r * 0.34, 6);
  }
  // Stone tracery: two lancets under a circle.
  g.strokeStyle = '#2a241d'; g.lineWidth = 11;
  g.beginPath(); g.moveTo(w / 2, h * 0.3); g.lineTo(w / 2, h); g.stroke();
  g.beginPath(); g.arc(w / 2, h * 0.17, w * 0.27, 0, 6.3); g.stroke();
  g.lineWidth = 8;
  g.beginPath(); g.moveTo(w * 0.03, h * 0.36); g.quadraticCurveTo(w * 0.1, h * 0.27, w / 2, h * 0.32); g.quadraticCurveTo(w * 0.9, h * 0.27, w * 0.97, h * 0.36); g.stroke();
}
function paintRose(g, w) {
  const colors = ['#143fb6', '#a81d2e', '#d99d26', '#17795b', '#5b2ca0', '#2277c8'];
  g.fillStyle = '#0d0a0d'; g.fillRect(0, 0, w, w);
  for (let r = 7; r >= 1; r--) for (let i = 0; i < 24; i++) {
    g.fillStyle = colors[(i * (r + 1) + r) % colors.length];
    g.beginPath(); g.moveTo(w / 2, w / 2); g.arc(w / 2, w / 2, (r / 7) * w * 0.49, (i / 24) * 6.283 + 0.012, ((i + 1) / 24) * 6.283 - 0.012); g.fill();
  }
  g.fillStyle = '#fff3c0'; g.beginPath(); g.arc(w / 2, w / 2, w * 0.05, 0, 6.3); g.fill();
}
function paintMarble(g, w, h, base, vein) {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.5;
  for (let i = 0; i < 70; i++) {
    let x = rand() * w; let y = rand() * h;
    g.strokeStyle = vein; g.lineWidth = 0.6 + rand() * 2.2;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 8; k++) { x += (rand() - 0.5) * 70; y += 16 + rand() * 42; g.lineTo(x, y); }
    g.stroke();
  }
  g.globalAlpha = 1;
}
function paintFloor(g, w) {
  // Large dark and pale stone slabs laid in a checker.
  const n = 4; const q = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const dark = (i + j) % 2;
    g.save(); g.translate(i * q, j * q);
    paintMarble(g, q, q, dark ? '#2b2926' : '#8a7e6a', dark ? 'rgba(120,110,100,.22)' : 'rgba(55,45,35,.28)');
    for (let k = 0; k < 500; k++) { g.fillStyle = `rgba(${k % 2 ? '255,240,215' : '15,10,5'},.05)`; g.fillRect(rand() * q, rand() * q, 1 + rand() * 7, 1 + rand() * 4); }
    g.strokeStyle = '#14100c'; g.lineWidth = 3; g.strokeRect(0, 0, q, q);
    g.restore();
  }
}
function paintStone(g, w, h) {
  g.fillStyle = '#6f6555'; g.fillRect(0, 0, w, h);
  const rows = 8; const cols = 4;
  for (let r = 0; r < rows; r++) for (let c = -1; c < cols; c++) {
    const v = 150 + rand() * 32;
    g.fillStyle = `rgb(${v},${v * 0.91},${v * 0.76})`;
    g.fillRect(((c + (r % 2) * 0.5) * w) / cols + 1, (r * h) / rows + 1, w / cols - 2, h / rows - 2);
  }
  for (let i = 0; i < 5200; i++) { g.fillStyle = `rgba(${i % 2 ? '255,240,215' : '35,25,15'},.055)`; g.fillRect(rand() * w, rand() * h, 1 + rand() * 6, 1 + rand() * 3); }
  for (let i = 0; i < 18; i++) {
    const x = rand() * w; const y = rand() * h; const r = 30 + rand() * 90;
    const gr = g.createRadialGradient(x, y, 1, x, y, r);
    gr.addColorStop(0, 'rgba(30,22,14,.16)'); gr.addColorStop(1, 'rgba(30,22,14,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
}

// ---------- Materials ----------
const lit = (o) => new THREE.MeshLambertMaterial(o);
const floorTex = tex(1024, 1024, paintFloor, true); floorTex.repeat.set(0.125, 0.125);
const stoneTex = tex(512, 512, paintStone, true); stoneTex.repeat.set(0.38, 0.38);
const whiteTex = tex(512, 512, (g, w, h) => paintMarble(g, w, h, '#ece4d4', 'rgba(120,110,100,.5)'), true); whiteTex.repeat.set(0.2, 0.2);
const glassTex = tex(320, 960, paintGlass);
const roseTex = tex(1024, 1024, (g, w) => paintRose(g, w));
const envScene = new THREE.Scene();
envScene.background = new THREE.Color(0x3a2a18);
for (const [c, x, y, z] of [[0xfff0c8, 0, 8, 0], [0xff9a50, 7, 2, 2], [0x5a78d0, -7, 3, -2]]) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(2.4, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(4) }));
  m.position.set(x, y, z);
  envScene.add(m);
}
const pm = new THREE.PMREMGenerator(renderer);
const envMap = pm.fromScene(envScene, 0.05).texture;
const M = {
  floor: lit({ map: floorTex }), stone: lit({ map: stoneTex }), carve: lit({ map: stoneTex, color: 0xe8ddc8 }), white: lit({ map: whiteTex }), iron: new THREE.MeshStandardMaterial({ color: 0x8c6a2c, metalness: 0.9, roughness: 0.42, envMap, envMapIntensity: 1 }),
  wood: lit({ color: 0x8f5a33 }), darkwood: lit({ color: 0x5a3820 }), red: lit({ color: 0x5a1317 }), blue: lit({ color: 0x1a3185 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xe9b84c, metalness: 0.95, roughness: 0.3, envMap, envMapIntensity: 1.5, emissive: 0x3c2506 }),
  glass: new THREE.MeshBasicMaterial({ map: glassTex, side: THREE.DoubleSide, toneMapped: false, color: 0xffffff }),
  rose: new THREE.MeshBasicMaterial({ map: roseTex, side: THREE.DoubleSide, toneMapped: false, color: 0xffffff }),
  dark: lit({ color: 0x16100c }),
  flame: new THREE.MeshBasicMaterial({ color: 0xffd27a, toneMapped: false }),
};
const skyTex = tex(512, 512, (g, w, h) => { g.fillStyle = '#16307f'; g.fillRect(0, 0, w, h); stars(g, w, h, 90); g.strokeStyle = '#e0b75f'; g.lineWidth = 7; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.lineWidth = 4; g.stroke(); }, true);
skyTex.repeat.set(1, 8);
M.sky = lit({ map: skyTex, emissive: 0xffffff, emissiveMap: skyTex, emissiveIntensity: 0.3, side: THREE.DoubleSide });
// Candles light the stone in soft pools around each chandelier and near the floor.
const candleU = { value: 1 };
function candleWash(m) {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uCandle = candleU;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uCandle;\nvarying vec3 vWP;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float inNave = smoothstep(26.0, 31.0, vWP.z) * smoothstep(120.0, 112.0, vWP.z);
        float bay = pow(abs(cos(3.14159 * (vWP.z - 35.5) / 11.0)), 2.0);
        float pool = mix(0.55, bay, inNave) * exp(-pow((vWP.y - 13.0) / 12.0, 2.0));
        float low = exp(-vWP.y / 7.0) * 0.62;
        float height = 1.0 - smoothstep(26.0, 46.0, vWP.y) * 0.72;
        totalEmissiveRadiance += uCandle * vec3(1.0, 0.68, 0.4) * diffuseColor.rgb * (pool * 0.52 + low * 0.55) * height;`);
  };
  m.customProgramCacheKey = () => 'candle-wash';
}
[M.floor, M.stone, M.carve, M.white].forEach(candleWash);
const WORLD_UV = new Set([M.floor, M.stone, M.carve, M.white]);
const parts = new Map();
function add(geometry, material, matrix) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
  if (matrix) g.applyMatrix4(matrix);
  if (!parts.has(material)) parts.set(material, []);
  parts.get(material).push(g);
}
function bake() {
  for (const [material, list] of parts) {
    let n = 0;
    for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3); const nor = new Float32Array(n * 3); const uv = new Float32Array(n * 2);
    let o = 0;
    const world = WORLD_UV.has(material);
    for (const g of list) {
      if (!g.attributes.normal) g.computeVertexNormals();
      const p = g.attributes.position; const q = g.attributes.normal; const u = g.attributes.uv;
      for (let i = 0; i < p.count; i++, o++) {
        const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i); const a = Math.abs(q.getX(i)); const b = Math.abs(q.getY(i)); const c = Math.abs(q.getZ(i));
        pos.set([x, y, z], o * 3); nor.set([q.getX(i), q.getY(i), q.getZ(i)], o * 3);
        if (world) { if (b > a && b > c) uv.set([x, z], o * 2); else if (a > c) uv.set([z, y], o * 2); else uv.set([x, y], o * 2); } else if (u) uv.set([u.getX(i), u.getY(i)], o * 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const mesh = new THREE.Mesh(geo, material);
    mesh.frustumCulled = false;
    scene.add(mesh);
  }
}
const box = (w, h, d, x, y, z, m = M.stone) => add(new THREE.BoxGeometry(w, h, d), m, TRS(x, y + h / 2, z));
const cyl = (r0, r1, h, x, y, z, m, seg = 16) => add(new THREE.CylinderGeometry(r0, r1, h, seg), m, TRS(x, y + h / 2, z));
function arch(p, cx, y0, w, spring) {
  p.moveTo(cx - w / 2, y0); p.lineTo(cx - w / 2, y0 + spring);
  p.absarc(cx + w / 2, y0 + spring, w, Math.PI, (2 * Math.PI) / 3, true);
  p.absarc(cx - w / 2, y0 + spring, w, Math.PI / 3, 0, true);
  p.lineTo(cx + w / 2, y0); p.closePath();
  return p;
}
// A wall along z (at x), or across x (at z), with pointed openings.
function wallZ(x, z0, z1, y0, y1, holes, t = 1.2, m = M.stone) {
  const s = new THREE.Shape([new THREE.Vector2(z0, y0), new THREE.Vector2(z1, y0), new THREE.Vector2(z1, y1), new THREE.Vector2(z0, y1)]);
  for (const [c, y, w, sp] of holes) s.holes.push(arch(new THREE.Path(), c, y, w, sp));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, -t / 2);
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1));
  fixMirror(g);
  add(g, m);
}
function wallX(z, x0, x1, y0, y1, holes, t = 1.2, m = M.stone) {
  const s = new THREE.Shape([new THREE.Vector2(x0, y0), new THREE.Vector2(x1, y0), new THREE.Vector2(x1, y1), new THREE.Vector2(x0, y1)]);
  for (const [c, y, w, sp] of holes) s.holes.push(arch(new THREE.Path(), c, y, w, sp));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, z - t / 2);
  add(g, m);
}
function fixMirror(g) {
  // The swap above mirrors the shape, so flip triangle order and normals.
  const ng = g.index ? g.toNonIndexed() : g;
  const p = ng.attributes.position;
  for (let i = 0; i < p.count; i += 3) {
    const ax = p.getX(i); const ay = p.getY(i); const az = p.getZ(i);
    p.setXYZ(i, p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1));
    p.setXYZ(i + 1, ax, ay, az);
  }
  ng.computeVertexNormals();
  g.setAttribute('normal', ng.attributes.normal);
}
function archTrim(c, y, w, sp, along, at, material = M.carve) {
  // Carved moulding around an opening.
  const s = arch(new THREE.Shape(), c, y, w + 0.8, sp);
  s.holes.push(arch(new THREE.Path(), c, y, w, sp));
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.24, bevelEnabled: false, curveSegments: 12 });
  if (along) {
    g.translate(0, 0, -0.12);
    g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, at, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1));
    fixMirror(g);
  } else g.translate(0, 0, at - 0.12);
  add(g, material);
}
function windowPane(along, at, c, y, w, sp, m = M.glass) {
  const s = arch(new THREE.Shape(), 0, 0, w, sp);
  const g = new THREE.ShapeGeometry(s, 12);
  const h = sp + w * 0.87;
  const p = g.attributes.position; const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h);
  if (along) g.applyMatrix4(TRS(at, y, c, Math.PI / 2)); else g.applyMatrix4(TRS(c, y, at));
  add(g, m);
}

// ---------- Vault helper ----------
const SPRING = 36; const APEX = 44; const HALF = 11;
const vaultY = (x, half = HALF, spring = SPRING, apex = APEX) => spring + (apex - spring) * (1 - Math.pow(Math.min(1, Math.abs(x) / half), 1.65));
function vaultSurface(x0, x1, z0, z1, spring, apex, material, along = true, nu = 28) {
  const half = Math.abs(along ? x1 - x0 : z1 - z0) / 2;
  const g = new THREE.BufferGeometry();
  const pos = []; const uv = []; const idx = [];
  for (let j = 0; j <= 2; j++) for (let i = 0; i <= nu; i++) {
    const u = i / nu; const v = j / 2;
    if (along) { const x = x0 + (x1 - x0) * u; pos.push(x, vaultY(x - (x0 + x1) / 2, half, spring, apex), z0 + (z1 - z0) * v); uv.push(u, v); } else {
      const z = z0 + (z1 - z0) * u; pos.push(x0 + (x1 - x0) * v, vaultY(z - (z0 + z1) / 2, half, spring, apex), z); uv.push(v, u);
    }
  }
  for (let j = 0; j < 2; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i; idx.push(a, a + 1, a + nu + 1, a + 1, a + nu + 2, a + nu + 1); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  add(g, material);
}
function rib(points, r = 0.2, m = M.carve) {
  add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 26, r, 6), m);
}

// ---------- Floor and main walls ----------
add(new THREE.PlaneGeometry(104, 180).rotateX(-Math.PI / 2), M.floor, TRS(0, 0, 33));
box(2.6, 0.03, 75, 0, 0, 68, M.red);
const piers = []; for (let z = 30; z <= 118; z += 11) piers.push(z);
const bays = piers.slice(0, -1).map((z) => z + 5.5);
// A carved Gothic capital: stacked mouldings and a ring of curling leaves.
const leafGeo = new THREE.ConeGeometry(0.22, 0.95, 5);
const leaves = [];
function capital(x, y, z, r) {
  cyl(r * 1.02, r, 0.25, x, y, z, M.carve, 22);
  cyl(r * 1.34, r * 1.04, 1.2, x, y + 0.25, z, M.carve, 22);
  cyl(r * 1.5, r * 1.5, 0.42, x, y + 1.45, z, M.carve, 8);
  for (const [tier, n, off] of [[0, 14, 0.4], [1, 14, 1.02]]) {
    for (let i = 0; i < n; i++) {
      const a = ((i + tier * 0.5) / n) * 6.283;
      const rr = r * (1.08 + tier * 0.2);
      leaves.push(TRS(x + Math.cos(a) * rr, y + off, z + Math.sin(a) * rr, -a + Math.PI / 2, 0.38 + tier * 0.1, 0));
    }
  }
}
for (const x of [-11, 11]) {
  const sx = Math.sign(x);
  const holes = bays.flatMap((c) => [[c, 0, 8, 12.4], [c - 2.85, 20.8, 2.25, 2.4], [c, 20.8, 2.25, 2.4], [c + 2.85, 20.8, 2.25, 2.4], [c, 26.4, 6, 4.4]]);
  wallZ(x, 30, 118, 0, SPRING, holes);
  for (const c of bays) {
    archTrim(c, 0, 8, 12.4, true, x * 0.955);
    archTrim(c, 0, 7.2, 12.4, true, x * 1.03);
    for (const d of [-2.85, 0, 2.85]) archTrim(c + d, 20.8, 2.25, 2.4, true, x * 0.955);
    archTrim(c, 26.4, 6, 4.4, true, x * 0.955);
    windowPane(true, x + sx * 0.3, c, 26.4, 6, 4.4);
  }
  box(0.5, 0.45, 88, x - sx * 0.7, 20.2, 74, M.carve);
  box(0.42, 0.34, 88, x - sx * 0.68, 26, 74, M.carve);
  for (const z of piers) {
    // Massive round columns on carved bases.
    const px = x - sx * 0.2;
    const R = z === 30 || z === 118 ? 1.2 : 1.6;
    add(new THREE.CylinderGeometry(R, R * 1.03, 16.2, 24), M.stone, TRS(px, 1.3 + 8.1, z));
    cyl(R * 1.18, R * 1.34, 0.65, px, 0.65, z, M.carve, 22);
    box(R * 3.1, 0.65, R * 3.1, px, 0, z, M.carve);
    capital(px, 17.5, z, R);
    // Slender shafts carry the eye up from the capital to the ribs.
    for (const off of [-0.72, 0, 0.72]) {
      cyl(0.17, 0.17, SPRING - 19.4, px - sx * 1.05, 19.4, z + off, M.carve, 8);
      cyl(0.26, 0.2, 0.36, px - sx * 1.05, 27, z + off, M.carve, 8);
      cyl(0.32, 0.17, 0.62, px - sx * 1.05, SPRING - 0.3, z + off, M.carve, 8);
    }
    if (z > 30 && z < 118) {
      cyl(0.72, 0.22, 0.8, px - sx * 1.1, 7, z, M.carve, 12);
      add(new THREE.ConeGeometry(0.85, 2.8, 6), M.carve, TRS(px - sx * 1.25, 12.6, z));
    }
  }
  box(9.6, 0.5, 88, sx * 15.8, 19.8, 74, M.stone);
  add(new THREE.PlaneGeometry(9, 88).rotateX(Math.PI / 2), M.sky, TRS(sx * 15.5, 19.75, 74));
  add(new THREE.PlaneGeometry(9, 88).rotateX(Math.PI / 2), M.sky, TRS(sx * 15.5, 27.4, 74));
  const isChapelBay = (c) => c > 41 && c < 107;
  const outer = bays.flatMap((c) => [isChapelBay(c) ? [c, 0, 7.4, 7.5] : [c, 2.8, 5.4, 8], [c, 20.9, 3, 2.3]]);
  wallZ(x + sx * 9, 30, 118, 0, 27.6, outer, 1);
  for (const c of bays) {
    if (!isChapelBay(c)) windowPane(true, x + sx * 9.05, c, 2.8, 5.4, 8);
    windowPane(true, x + sx * 9.05, c, 20.9, 3, 2.3);
    if (isChapelBay(c)) archTrim(c, 0, 7.4, 7.5, true, x + sx * 8.4); else archTrim(c, 2.8, 5.4, 8, true, x + sx * 8.4);
  }
}
// Ribbed vault. The panels between ribs hold the chosen ceiling paintings.
const vaultTex = tex(1024, 2048, paintVault);
const vaultMat = lit({ map: vaultTex, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: vaultTex, emissiveIntensity: 0.35 });
vaultSurface(-11, 11, 118, 30, SPRING, APEX, vaultMat);
const POZZO = { x: 10.4, z0: 52, z1: 96 };
const inPozzo = (z) => z > POZZO.z0 + 0.1 && z < POZZO.z1 - 0.1;
for (const z of piers) {
  if (inPozzo(z)) continue;
  const pts = [];
  for (let i = 0; i <= 12; i++) { const x = -11 + (22 * i) / 12; pts.push([x, vaultY(x) - 0.12, z]); }
  rib(pts, 0.3);
}
for (const c of bays) {
  if (inPozzo(c)) continue;
  for (const [xa, za] of [[-11, c - 5.5], [11, c - 5.5], [-11, c + 5.5], [11, c + 5.5]]) {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const t = i / 10; const x = xa * (1 - t); pts.push([x, vaultY(x) - 0.14, za + (c - za) * t]); }
    rib(pts, 0.2);
  }
  add(new THREE.SphereGeometry(0.72, 14, 10), M.gold, TRS(0, APEX - 0.3, c, 0, 0, 0, 1, 0.65, 1));
}
rib([[0, APEX - 0.08, 30], [0, APEX - 0.08, 41], [0, APEX - 0.08, POZZO.z0]], 0.16);
rib([[0, APEX - 0.08, POZZO.z1], [0, APEX - 0.08, 107], [0, APEX - 0.08, 118]], 0.16);
// The Pozzo painting follows the curve of the vault. Its lower edge faces the altar, so it reads upright to someone walking in.
const pozzoMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false, color: 0xe8e0d0 });
{
  const pos = []; const uv = []; const idx = [];
  const nx = 30; const nz = 8;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const x = -POZZO.x + (2 * POZZO.x * i) / nx;
    pos.push(x, vaultY(x) - 0.22, POZZO.z0 + ((POZZO.z1 - POZZO.z0) * j) / nz);
    uv.push(i / nx, j / nz);
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; idx.push(a, a + 1, a + nx + 1, a + 1, a + nx + 2, a + nx + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const panel = new THREE.Mesh(g, pozzoMat);
  panel.frustumCulled = false;
  scene.add(panel);
  new THREE.TextureLoader().load('textures/ceiling-nave.jpg', (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anis;
    pozzoMat.map = t; pozzoMat.needsUpdate = true;
    dirty = true;
  });
  // Carved gilt frame along both long edges.
  for (const side of [-1, 1]) rib([[side * POZZO.x, vaultY(POZZO.x) - 0.3, POZZO.z0], [side * POZZO.x, vaultY(POZZO.x) - 0.3, 74], [side * POZZO.x, vaultY(POZZO.x) - 0.3, POZZO.z1]], 0.26, M.gold);
  for (const z of [POZZO.z0, POZZO.z1]) {
    const pts = [];
    for (let i = 0; i <= 12; i++) { const x = -POZZO.x + (2 * POZZO.x * i) / 12; pts.push([x, vaultY(x) - 0.3, z]); }
    rib(pts, 0.26, M.gold);
  }
}
// West wall: three doors, choir loft and rose window.
wallX(118, -20, 20, 0, 44, [[0, 0, 7, 7], [-15.5, 0, 5, 6], [15.5, 0, 5, 6]]);
box(7, 11, 0.3, 0, 0, 118.6, M.darkwood);
for (const x of [-15.5, 15.5]) box(5, 8, 0.3, x, 0, 118.6, M.darkwood);
add(new THREE.CircleGeometry(6.5, 48), M.rose, TRS(0, 33, 117.3, Math.PI));
add(new THREE.TorusGeometry(6.6, 0.38, 8, 56), M.carve, TRS(0, 33, 117.2));
for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.283; add(new THREE.BoxGeometry(0.16, 6.2, 0.16), M.carve, TRS(Math.cos(a) * 3.2, 33 + Math.sin(a) * 3.2, 117.15, 0, 0, a - Math.PI / 2)); }
archTrim(0, 0, 7, 7, false, 117.3);
box(40, 0.8, 11, 0, 19.6, 112.2, M.darkwood);
for (let x = -19; x <= 19; x += 0.7) cyl(0.06, 0.08, 1.2, x, 20.4, 106.9, M.darkwood, 6);
box(40, 0.18, 0.28, 0, 21.6, 106.9, M.darkwood);
for (const side of [-1, 1]) for (let i = 0; i < 18; i++) {
  const x = side * (8 + i * 0.62); const tall = 8 + Math.sin(i * 0.5) * 4 + (18 - i) * 0.32;
  cyl(0.24, 0.24, tall, x, 21, 115.2, M.iron, 8);
  add(new THREE.ConeGeometry(0.24, 0.5, 8), M.iron, TRS(x, 21 + tall + 0.25, 115.2));
}
box(26, 2.2, 3, -13, 20.4, 115.2, M.darkwood); box(26, 2.2, 3, 13, 20.4, 115.2, M.darkwood);

// ---------- Pews ----------
const pewParts = [];
{
  const seat = new THREE.BoxGeometry(7.6, 0.1, 0.5).translate(0, 0.46, 0);
  const back = new THREE.BoxGeometry(7.6, 0.72, 0.08).translate(0, 0.84, -0.26 + 0.52);
  const ends = [-3.8, 3.8].map((x) => new THREE.BoxGeometry(0.1, 1.15, 0.72).translate(x, 0.58, 0.04));
  const list = [seat, back, ...ends].map((g) => g.toNonIndexed());
  const total = list.reduce((n, g) => n + g.attributes.position.count, 0);
  const p = new Float32Array(total * 3); const n = new Float32Array(total * 3);
  let o = 0;
  for (const g of list) { p.set(g.attributes.position.array, o); n.set(g.attributes.normal.array, o); o += g.attributes.position.array.length; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  for (const x of [-6.1, 6.1]) for (let z = 38; z < 106; z += 1.55) pewParts.push(TRS(x, 0, z));
  for (const x of [-6.1, 6.1]) for (let z = 38; z < 106; z += 1.55) for (const e of [-3.8, 3.8]) add(new THREE.ConeGeometry(0.1, 0.4, 5), M.darkwood, TRS(x + e, 1.32, z + 0.04));
  const pews = new THREE.InstancedMesh(geo, M.wood, pewParts.length);
  pewParts.forEach((m, i) => pews.setMatrixAt(i, m));
  pews.frustumCulled = false;
  scene.add(pews);
}

// ---------- Crossing and dome ----------
const CR = 11;
wallX(30, -11, 11, 0, 44, [[0, 0, 19, 19]], 2.4);
wallX(8, -11, 11, 0, 44, [[0, 0, 19, 19]], 2.4);
wallZ(-11, 8, 30, 0, 44, [[19, 0, 19, 19]], 2.4);
wallZ(11, 8, 30, 0, 44, [[19, 0, 19, 19]], 2.4);
archTrim(0, 0, 19, 19, false, 28.7);
// Carved wooden screen across the entrance to the crossing, with a gate in the middle.
for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
  const c = side * (3.8 + i * 2.5);
  wallX(32, c - 1.25, c + 1.25, 0, 2.4, [[c - 0.55, 0.75, 0.82, 0.8], [c + 0.55, 0.75, 0.82, 0.8]], 0.14, M.wood);
  box(0.14, 2.9, 0.22, c - 1.25, 0, 32, M.darkwood);
  box(0.14, 2.9, 0.22, c + 1.25, 0, 32, M.darkwood);
  add(new THREE.ConeGeometry(0.12, 0.5, 5), M.darkwood, TRS(c - 1.25, 3.1, 32));
  box(2.5, 0.14, 0.2, c, 2.4, 32, M.darkwood);
}
archTrim(0, 0, 19, 19, false, 9.3);
archTrim(19, 0, 19, 19, true, -9.7);
archTrim(19, 0, 19, 19, true, 9.7);
{
  const s = new THREE.Shape([new THREE.Vector2(-CR, -CR), new THREE.Vector2(CR, -CR), new THREE.Vector2(CR, CR), new THREE.Vector2(-CR, CR)]);
  s.holes.push(new THREE.Path().absarc(0, 0, CR - 0.4, 0, Math.PI * 2, true));
  add(new THREE.ExtrudeGeometry(s, { depth: 0.6, bevelEnabled: false, curveSegments: 40 }).rotateX(Math.PI / 2), M.gold, TRS(0, 44.6, 19));
}
// Drum with windows, then the painted dome and lantern.
add(new THREE.CylinderGeometry(CR - 0.4, CR - 0.4, 15, 40, 1, true), lit({ map: stoneTex, side: THREE.DoubleSide }), TRS(0, 52, 19));
const DRUM = 12;
for (let i = 0; i < DRUM; i++) {
  const a = (i / DRUM) * 6.283;
  const g = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, 0, 3, 6), 8);
  const p = g.attributes.position; const uv = g.attributes.uv;
  for (let k = 0; k < p.count; k++) uv.setXY(k, p.getX(k) / 3 + 0.5, p.getY(k) / 8.6);
  add(g, M.glass, TRS(Math.sin(a) * (CR - 0.55), 47, 19 + Math.cos(a) * (CR - 0.55), a + Math.PI));
  add(new THREE.BoxGeometry(0.26, 15, 0.26), M.gold, TRS(Math.sin(a + 0.26) * (CR - 0.7), 52, 19 + Math.cos(a + 0.26) * (CR - 0.7)));
}
for (const y of [44.9, 59.4]) add(new THREE.TorusGeometry(CR - 0.65, 0.3, 8, 48), M.gold, TRS(0, y, 19, 0, Math.PI / 2));
const domeTex = tex(3072, 1024, paintDome);
domeTex.wrapS = THREE.RepeatWrapping;
const domeMat = lit({ map: domeTex, side: THREE.BackSide, emissive: 0xffffff, emissiveMap: domeTex, emissiveIntensity: 0.4 });
add(new THREE.SphereGeometry(CR - 0.4, 48, 20, 0, Math.PI * 2, 0.1, Math.PI / 2 - 0.1), domeMat, TRS(0, 59.5, 19, 0, 0, 0, 1, 1.32, 1));
add(new THREE.CircleGeometry(1.2, 28).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xfff6d0, toneMapped: false }), TRS(0, 73.4, 19));
add(new THREE.TorusGeometry(1.25, 0.2, 8, 30), M.gold, TRS(0, 73.3, 19, 0, Math.PI / 2));
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * 6.283 + 0.19;
  const pts = [];
  for (let k = 0; k <= 10; k++) { const t = (k / 10) * (Math.PI / 2 - 0.11); const r = (CR - 0.5) * Math.cos(t); pts.push([Math.sin(a) * r, 59.5 + (CR - 0.5) * 1.32 * Math.sin(t), 19 + Math.cos(a) * r]); }
  rib(pts, 0.14);
}

// ---------- Transepts ----------
const starTex = tex(1024, 512, (g, w, h) => {
  g.fillStyle = '#16307f'; g.fillRect(0, 0, w, h); stars(g, w, h, 240);
});
const starMat = lit({ map: starTex, side: THREE.DoubleSide, emissive: 0xffffff, emissiveMap: starTex, emissiveIntensity: 0.3 });
for (const s of [-1, 1]) {
  const x0 = s * 11; const x1 = s * 52; const a = Math.min(x0, x1); const b = Math.max(x0, x1);
  wallX(8, a, b, 0, 34, [], 1); wallX(30, a, b, 0, 34, [], 1);
  wallZ(x1, 8, 30, 0, 40, [[19, 3, 13, 20]], 1);
  windowPane(true, x1 + s * 0.05, 19, 3, 13, 20);
  vaultSurface(a, b, 30, 8, 30, 40, starMat, false, 18);
}

// ---------- Chancel, sanctuary and apse ----------
wallZ(-11, -36, 8, 0, 34, [[-6, 0, 8, 11], [-28, 0, 8, 11], [-6, 18, 6, 9], [-17, 18, 6, 9], [-28, 18, 6, 9]], 1.2);
wallZ(11, -36, 8, 0, 34, [[-6, 0, 8, 11], [-28, 0, 8, 11], [-6, 18, 6, 9], [-17, 18, 6, 9], [-28, 18, 6, 9]], 1.2);
for (const x of [-11, 11]) {
  for (const c of [-6, -17, -28]) {
    windowPane(true, x * 1.03, c, 18, 6, 9);
    archTrim(c, 18, 6, 9, true, x * 0.96);
  }
  for (const c of [-6, -28]) box(0.3, 13, 8.4, x * 1.04, 0, c, M.darkwood);
  const sx = Math.sign(x);
  // Carved choir stalls.
  for (const row of [0, 1]) {
    const px = sx * (8.9 - row * 1.25);
    box(1.15, 0.5 + row * 0.1, 26, px, row * 0.25, -6.5, M.wood);
    box(0.12, 2.6, 26, sx * 9.65, 0, -6.5, M.darkwood);
    for (let z = 6; z >= -19; z -= 1.55) { box(0.1, 1.1, 0.1, px, 0.5, z, M.gold); }
  }
  for (let z = 6; z >= -19; z -= 3.1) add(new THREE.ConeGeometry(0.2, 1.3, 6), M.gold, TRS(sx * 9.6, 3.1, z));
}
wallX(-36.6, -11, -8.6, 0, 34, [], 0.5); wallX(-36.6, 8.6, 11, 0, 34, [], 0.5);
vaultSurface(-11, 11, 8, -36, 30, 40, vaultMat, true);
for (const z of [8, -3, -14, -25, -36]) {
  const pts = [];
  for (let i = 0; i <= 12; i++) { const x = -11 + (22 * i) / 12; pts.push([x, vaultY(x, 11, 30, 40) - 0.08, z]); }
  rib(pts, 0.24);
}
for (const y of [0.32, 0.64, 0.96]) box(22 - y * 2, 0.32, 18 - y * 2, 0, y - 0.32, -28.5 - y * 0.6, M.white);
box(22, 0.34, 0.3, 0, 0.3, -18.8, M.gold);
for (let x = -10; x <= 10; x += 0.85) if (Math.abs(x) > 1.6) cyl(0.07, 0.09, 0.8, x, 0, -18.4, M.gold, 8);
box(22, 0.14, 0.42, 0, 0.82, -18.4, M.white);
// Apse: five tall windows around the altar, under a star-painted half dome.
for (let i = 0; i < 5; i++) {
  const a = ((i - 2) / 5) * Math.PI;
  const cx = Math.sin(a) * 10.5; const cz = -41.5 - Math.cos(a) * 10.5;
  const w = 7.1;
  const shape = new THREE.Shape([new THREE.Vector2(-w / 2, 0), new THREE.Vector2(w / 2, 0), new THREE.Vector2(w / 2, 34), new THREE.Vector2(-w / 2, 34)]);
  shape.holes.push(arch(new THREE.Path(), 0, 9, 4.6, 15));
  const m = TRS(cx, 0, cz, -a);
  add(new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: false, curveSegments: 10 }), M.stone, m);
  const g = new THREE.ShapeGeometry(arch(new THREE.Shape(), 0, 9, 4.6, 15), 10);
  const p = g.attributes.position; const uv = g.attributes.uv;
  for (let k = 0; k < p.count; k++) uv.setXY(k, p.getX(k) / 4.6 + 0.5, (p.getY(k) - 9) / 19);
  add(g, M.glass, m);
  const ri = arch(new THREE.Shape(), 0, 9, 5.3, 15);
  ri.holes.push(arch(new THREE.Path(), 0, 9, 4.6, 15));
  add(new THREE.ExtrudeGeometry(ri, { depth: 0.2, bevelEnabled: false, curveSegments: 10 }), M.carve, new THREE.Matrix4().copy(m).multiply(new THREE.Matrix4().makeTranslation(0, 0, 0.72)));
}
add(new THREE.SphereGeometry(11.3, 40, 14, 0, Math.PI, 0, Math.PI / 2), M.sky, TRS(0, 33, -41.5, Math.PI, 0, 0, 1, 0.7, 1));
add(new THREE.PlaneGeometry(22, 46).rotateX(-Math.PI / 2), M.white, TRS(0, 0.97, -41.5));
const FY = 0.96; const RZ = -37.4;
// Altar table and stepped candle shelf.
box(8, 1.25, 2.4, 0, FY, -31, M.white);
box(8.3, 0.14, 2.7, 0, FY + 1.25, -31, M.gold);
for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) { add(new THREE.CylinderGeometry(0.14, 0.14, 1.1, 10), M.gold, TRS(x, FY + 0.62, -29.75)); }
box(7.4, 0.9, 0.04, 0, FY + 0.15, -29.78, M.red);
box(12, 0.8, 1.3, 0, FY + 1.3, -32.6, M.white);
box(12.2, 0.1, 1.4, 0, FY + 2.1, -32.6, M.gold);
// Gold tabernacle at the centre, topped by a small dome and cross.
box(1.5, 1.6, 1, 0, FY + 2.2, -32.8, M.gold);
archTrim(0, FY + 2.3, 0.8, 0.5, false, -32.25);
for (const x of [-0.68, 0.68]) cyl(0.08, 0.08, 1.6, x, FY + 2.2, -32.25, M.white, 8);
add(new THREE.SphereGeometry(0.7, 18, 10, 0, 6.3, 0, 1.57), M.gold, TRS(0, FY + 3.8, -32.8));
box(0.08, 0.6, 0.08, 0, FY + 4.5, -32.8, M.gold); box(0.34, 0.08, 0.08, 0, FY + 4.8, -32.8, M.gold);
// Six tall candlesticks.
const stick = new THREE.LatheGeometry([[0, 0], [0.34, 0], [0.3, 0.08], [0.12, 0.2], [0.09, 0.45], [0.17, 0.62], [0.08, 0.82], [0.06, 1.25], [0.14, 1.42], [0.06, 1.6], [0.2, 1.72], [0.2, 1.76], [0.05, 1.78]].map(([r, h]) => new THREE.Vector2(r, h)), 12);
const altarCandles = [];
for (const x of [-5.2, -3.7, -2.3, 2.3, 3.7, 5.2]) {
  add(stick, M.gold, TRS(x, FY + 2.15, -32.6));
  cyl(0.065, 0.075, 1.25, x, FY + 3.9, -32.6, M.white, 8);
  altarCandles.push([x, FY + 5.15, -32.6]);
}
// Solid back wall with three pointed niches.
{
  const q = new THREE.Shape([new THREE.Vector2(-10.6, FY), new THREE.Vector2(10.6, FY), new THREE.Vector2(10.6, 19), new THREE.Vector2(-10.6, 19)]);
  q.holes.push(arch(new THREE.Path(), 0, 4.4, 8.2, 8.8));
  q.holes.push(arch(new THREE.Path(), -7.1, 5.2, 3.9, 5.4));
  q.holes.push(arch(new THREE.Path(), 7.1, 5.2, 3.9, 5.4));
  add(new THREE.ExtrudeGeometry(q, { depth: 0.9, bevelEnabled: false, curveSegments: 12 }), M.white, TRS(0, 0, RZ - 0.45));
  for (const [c, y, w, sp] of [[0, 4.4, 8.2, 8.8], [-7.1, 5.2, 3.9, 5.4], [7.1, 5.2, 3.9, 5.4]]) {
    const r = arch(new THREE.Shape(), c, y, w + 0.9, sp + 0.2);
    r.holes.push(arch(new THREE.Path(), c, y, w, sp));
    add(new THREE.ExtrudeGeometry(r, { depth: 0.36, bevelEnabled: false, curveSegments: 12 }), M.gold, TRS(0, 0, RZ + 0.3));
    add(new THREE.ExtrudeGeometry(arch(new THREE.Shape(), c, y, w + 0.1, sp), { depth: 0.1, bevelEnabled: false, curveSegments: 12 }), M.blue, TRS(0, 0, RZ - 1.6));
    box(w + 0.5, 19, 1.2, c, 0, RZ - 2.4, M.dark);
  }
}
box(21.4, 0.22, 1.2, 0, 4.2, RZ + 0.25, M.gold);
box(21.4, 3.2, 0.7, 0, FY, RZ + 0.3, M.white);
for (const x of [-9, -5, 5, 9]) box(2.8, 2.1, 0.2, x, FY + 0.5, RZ + 0.68, M.gold);
box(21.4, 0.9, 1.1, 0, 19, RZ + 0.1, M.gold);
box(22, 0.3, 1.4, 0, 19.9, RZ + 0.1, M.white);
// Turquoise marble columns with gold capitals, matching the nave.
for (const x of [-10.2, -4.7, 4.7, 10.2]) {
  cyl(0.5, 0.5, 13.2, x, 4.4, RZ + 0.9, M.carve, 18);
  cyl(0.72, 0.62, 0.4, x, 4.4, RZ + 0.9, M.gold, 18);
  capital(x, 17.3, RZ + 0.9, 0.5, 1.2);
  add(new THREE.ConeGeometry(0.7, 5.5, 8), M.gold, TRS(x, 22.9, RZ + 0.5));
  box(1.2, 0.6, 1.2, x, 19.9, RZ + 0.5, M.white);
  add(new THREE.SphereGeometry(0.22, 10, 8), M.gold, TRS(x, 25.8, RZ + 0.5));
}
// A pointed gable and gold spire over the centre, framing the crucifix.
{
  const g = new THREE.Shape([new THREE.Vector2(-5.5, 19.6), new THREE.Vector2(5.5, 19.6), new THREE.Vector2(0, 30)]);
  g.holes.push(arch(new THREE.Path(), 0, 20.2, 4.4, 2.2));
  add(new THREE.ExtrudeGeometry(g, { depth: 0.6, bevelEnabled: false }), M.white, TRS(0, 0, RZ - 0.2));
  add(new THREE.ExtrudeGeometry(arch(new THREE.Shape(), 0, 20.2, 4.4, 2.2), { depth: 0.1 , bevelEnabled: false }), M.gold, TRS(0, 0, RZ - 0.1));
  const edge = (a, b) => { const len = Math.hypot(b[0] - a[0], b[1] - a[1]); add(new THREE.BoxGeometry(len, 0.3, 0.8), M.gold, TRS((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, RZ + 0.1, 0, 0, Math.atan2(b[1] - a[1], b[0] - a[0]))); };
  edge([-5.7, 19.5], [0, 30.2]); edge([5.7, 19.5], [0, 30.2]);
  add(new THREE.ConeGeometry(0.42, 4.2, 8), M.gold, TRS(0, 32, RZ + 0.1));
  box(0.14, 1.8, 0.14, 0, 33.6, RZ + 0.1, M.gold); box(0.9, 0.14, 0.14, 0, 34.7, RZ + 0.1, M.gold);
}
// Gold rays behind the relief, seen in the point of the arch.
const RAYZ = RZ - 1.42;
for (let i = 0; i < 48; i++) {
  const a = (i / 48) * 6.283; const long = i % 2 === 0; const len = long ? 8.6 : 6.6;
  add(new THREE.ConeGeometry(long ? 0.16 : 0.1, len, 4), M.gold, TRS(Math.cos(a) * (2 + len / 2), 12.5 + Math.sin(a) * (2 + len / 2), RAYZ, 0, 0, a - Math.PI / 2));
}
// Your relief image, in a gold frame at the centre of the altar. Replace textures/altar-relief.jpg to change it.
const reliefTex = new THREE.TextureLoader().load('textures/altar-relief.jpg', () => { dirty = true; });
reliefTex.colorSpace = THREE.SRGBColorSpace;
reliefTex.anisotropy = anis;
const RW = 7.4; const RH = RW * (586 / 468); const RB = 5.6;
const reliefMat = lit({ map: reliefTex, emissive: 0xffffff, emissiveMap: reliefTex, emissiveIntensity: 0.55 });
const relief = new THREE.Mesh(new THREE.PlaneGeometry(RW, RH), reliefMat);
relief.position.set(0, RB + RH / 2, RZ + 0.62);
scene.add(relief);
for (const [w, h, x, y] of [[RW + 0.6, 0.3, 0, RB - 0.15], [RW + 0.6, 0.3, 0, RB + RH], [0.3, RH + 0.6, -RW / 2 - 0.15, RB - 0.15], [0.3, RH + 0.6, RW / 2 + 0.15, RB - 0.15]]) box(w, h, 0.5, x, y, RZ + 0.5, M.gold);

// ---------- Statues ----------
const FIG = { saint: makeFigure('saint'), angel: makeFigure('trumpet') };
const marble = new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.42, envMap, envMapIntensity: 0.55 });
const painted = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, envMap, envMapIntensity: 0.3 });
const gilded = new THREE.MeshStandardMaterial({ color: 0xf0c04f, metalness: 0.85, roughness: 0.28, envMap, envMapIntensity: 1.5, emissive: 0x3c2506 });
const ROBES = [0xa52a35, 0x2f58b8, 0x1f7a68, 0x6c3ea6];
function statues(kind, list) {
  const f = FIG[kind];
  const meshes = [new THREE.InstancedMesh(f.marble, marble, list.length), new THREE.InstancedMesh(f.paint, painted, list.length), new THREE.InstancedMesh(f.gold, gilded, list.length)];
  const col = new THREE.Color();
  list.forEach((s, i) => {
    const m = TRS(s.x, s.y, s.z, s.ry, 0, 0, s.s, s.s, s.s);
    meshes.forEach((mesh) => mesh.setMatrixAt(i, m));
    meshes[1].setColorAt(i, col.set(s.c));
  });
  for (const mesh of meshes) { mesh.frustumCulled = false; scene.add(mesh); }
}
const saintList = []; const angelList = [];
piers.slice(1, -1).forEach((z, i) => {
  for (const x of [-1, 1]) {
    saintList.push({ x: x * 9.45, y: 7.8, z, ry: x > 0 ? -Math.PI / 2 : Math.PI / 2, s: 1.28, c: ROBES[(i + (x > 0 ? 2 : 0)) % 4] });
  }
});
angelList.push({ x: -7.4, y: 20.2, z: RZ + 0.1, ry: 0.5, s: 1.5, c: 0x2f58b8 }, { x: 7.4, y: 20.2, z: RZ + 0.1, ry: -0.5, s: 1.5, c: 0xa52a35 }, { x: -4.1, y: 1, z: -34.3, ry: 0.5, s: 1.25, c: 0x6c3ea6 }, { x: 4.1, y: 1, z: -34.3, ry: -0.5, s: 1.25, c: 0x1f7a68 });
saintList.push({ x: -7.1, y: 5.2, z: RZ - 0.7, ry: 0.15, s: 1.9, c: 0xa52a35 }, { x: 7.1, y: 5.2, z: RZ - 0.7, ry: -0.15, s: 1.9, c: 0x1f7a68 });
statues('saint', saintList);
statues('angel', angelList);

// ---------- Lights and glows ----------
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 1, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,240,205,1)'); r.addColorStop(0.2, 'rgba(255,205,130,.75)'); r.addColorStop(1, 'rgba(255,170,80,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
// ---------- Confession chapel and booths ----------
const BOOTH_Z = [67.6, 74, 80.4];
wallZ(30.6, 63, 85, 0, 12.2, [], 1);
wallX(63, 20, 31, 0, 12.2, [], 1);
wallX(85, 20, 31, 0, 12.2, [], 1);
add(new THREE.PlaneGeometry(11, 22).rotateX(Math.PI / 2), M.sky, TRS(25.5, 12, 74));
const walnutTex = tex(256, 512, (g, w, h) => {
  g.fillStyle = '#7b4c2c'; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.45;
  for (let i = 0; i < 300; i++) { g.strokeStyle = i % 3 ? '#3c2212' : '#a8744a'; g.lineWidth = 0.6 + rand() * 1.6; const x = rand() * w; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + rand() * 14 - 7, h * 0.3, x + rand() * 14 - 7, h * 0.7, x, h); g.stroke(); }
  g.globalAlpha = 1;
});
const WALNUT = lit({ map: walnutTex, color: 0xb9937a });
const WALNUT2 = lit({ map: walnutTex });
const CURTAIN = lit({ color: 0x5e2a1c, side: THREE.DoubleSide });
[WALNUT, WALNUT2, CURTAIN].forEach(candleWash);
const BRASS = M.gold;
function curtain(z, width) {
  const g = new THREE.PlaneGeometry(width, 3.2, 40, 6);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 15) * 0.055 + Math.sin(p.getX(i) * 33) * 0.016);
  g.computeVertexNormals();
  add(g, CURTAIN, TRS(27.3, 1.78, z, -Math.PI / 2));
  add(new THREE.CylinderGeometry(0.025, 0.025, width, 8), BRASS, TRS(27.28, 3.42, z, 0, Math.PI / 2));
}
const boothLights = [];
const hitBoxes = [];
const boothGlowTex = tex(64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 1, w / 2, w / 2, w / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w, w); });
BOOTH_Z.forEach((zc, index) => {
  const end = 2.8; const part = 0.85;
  box(3.1, 0.18, 6, 28.5, 0, zc, M.darkwood);
  box(0.1, 3.9, 5.7, 29.85, 0.18, zc, WALNUT);
  box(2.5, 0.12, 5.7, 28.65, 3.95, zc, WALNUT);
  for (const q of [-end, -part, part, end]) box(2.5, 3.9, 0.12, 28.65, 0.18, zc + q, WALNUT);
  // Pilasters and a heavy top with stepped mouldings.
  for (const q of [-end, -part, part, end]) {
    box(0.22, 3.75, 0.34, 27.35, 0.18, zc + q, WALNUT2);
    box(0.34, 0.2, 0.46, 27.33, 0.18, zc + q, WALNUT);
    box(0.32, 0.18, 0.46, 27.33, 3.72, zc + q, WALNUT);
  }
  box(0.3, 0.3, 5.9, 27.36, 3.9, zc, WALNUT);
  box(0.46, 0.08, 6, 27.3, 4.2, zc, WALNUT2);
  box(0.6, 0.12, 6.1, 27.28, 4.28, zc, WALNUT);
  for (let q = -2.7; q <= 2.71; q += 0.3) box(0.06, 0.08, 0.13, 27.18, 4.12, zc + q, WALNUT2);
  // Broken pointed top, holding the lamp box.
  for (const side of [-1, 1]) {
    const len = 1.5; const a = 0.5;
    add(new THREE.BoxGeometry(0.42, 0.2, len), WALNUT, TRS(27.35, 4.74, zc + side * 1.25, 0, side * a, 0));
    add(new THREE.ConeGeometry(0.1, 0.5, 6), WALNUT2, TRS(27.35, 4.62, zc + side * 2.72));
    box(0.2, 0.22, 0.2, 27.35, 4.4, zc + side * 2.72, WALNUT);
  }
  // Priest's door, always closed, with carved panels and a grille.
  box(0.08, 3.5, 1.42, 27.42, 0.18, zc, WALNUT2);
  box(0.06, 0.9, 1.05, 27.36, 0.42, zc, WALNUT);
  box(0.06, 0.5, 1.05, 27.36, 1.45, zc, WALNUT);
  box(0.05, 1.3, 0.95, 27.38, 2.08, zc, M.dark);
  for (let q = -0.38; q <= 0.39; q += 0.19) add(new THREE.CylinderGeometry(0.018, 0.018, 1.3, 6), BRASS, TRS(27.33, 2.73, zc + q));
  box(0.05, 0.05, 1, 27.33, 2.05, zc, WALNUT); box(0.05, 0.05, 1, 27.33, 3.38, zc, WALNUT);
  add(new THREE.SphereGeometry(0.04, 8, 6), BRASS, TRS(27.32, 1.75, zc + 0.56));
  // Two penitent sides behind curtains.
  for (const side of [-1, 1]) {
    const sz = zc + side * 1.825;
    curtain(sz, 1.68);
    box(1.3, 0.35, 0.42, 28.6, 0.18, zc + side * 1.1, WALNUT2);
    box(1.3, 0.08, 0.3, 28.6, 1.1, zc + side * 1.04, WALNUT2);
    box(0.06, 0.95, 0.06, 28.05, 0.2, zc + side * 1.04, WALNUT); box(0.06, 0.95, 0.06, 29.15, 0.2, zc + side * 1.04, WALNUT);
    // Grille in the wall facing the priest's room, with nobody behind it.
    const gz = zc + side * (part + 0.07);
    box(1.0, 0.9, 0.02, 28.65, 1.35, gz, M.dark);
    for (let q = -0.45; q <= 0.46; q += 0.15) box(0.03, 0.9, 0.03, 28.65 + q, 1.35, gz, BRASS);
    for (let q = 0; q <= 0.91; q += 0.15) box(1.0, 0.03, 0.03, 28.65, 1.35 + q, gz, BRASS);
    add(new THREE.BoxGeometry(0.03, 0.34, 0.03), BRASS, TRS(29.75, 2.3, zc + side * 1.825));
    add(new THREE.BoxGeometry(0.03, 0.03, 0.2), BRASS, TRS(29.75, 2.36, zc + side * 1.825));
  }
  // Lamp box with one red and one green lamp.
  box(0.34, 0.52, 1.0, 27.25, 4.4, zc, WALNUT);
  box(0.4, 0.06, 1.08, 27.23, 4.92, zc, BRASS);
  const lamp = (dz, color) => {
    const mat = new THREE.MeshBasicMaterial({ color, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 10), mat);
    mesh.position.set(27.04, 4.66, zc + dz);
    scene.add(mesh);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: boothGlowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }));
    glow.position.copy(mesh.position);
    glow.scale.set(1.25, 1.25, 1);
    scene.add(glow);
    return { mat, glow, on: new THREE.Color(color), off: new THREE.Color(color).multiplyScalar(0.1) };
  };
  boothLights.push({ red: lamp(-0.25, 0xff2418), green: lamp(0.25, 0x22ff5a) });
  // Booth number.
  const numTex = tex(96, 96, (g, w) => { g.fillStyle = '#21120a'; g.beginPath(); g.arc(w / 2, w / 2, 44, 0, 6.3); g.fill(); g.strokeStyle = '#e0b75f'; g.lineWidth = 5; g.stroke(); g.fillStyle = '#f0d58f'; g.font = '700 58px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(index + 1), w / 2, w / 2 + 3); });
  const num = new THREE.Mesh(new THREE.CircleGeometry(0.2, 24), new THREE.MeshBasicMaterial({ map: numTex }));
  num.position.set(27.2, 3.95, zc);
  num.rotation.y = -Math.PI / 2;
  scene.add(num);
  // An invisible shape that catches taps on the booth.
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 5.6), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.set(27.3, 2.5, zc);
  hit.userData.booth = index;
  scene.add(hit);
  hitBoxes.push(hit);
});
const boothLamp = new THREE.PointLight(0xffc98a, 0, 6, 1.6);
scene.add(boothLamp);

// ---------- Side chapels ----------
// Each chapel opens off an aisle through a tall arch and holds an altar with a picture or a statue.
const CHAPEL_ROBES = [0x2f58b8, 0x7a3a2a, 0x1f7a68, 0xa52a35, 0x6c3ea6, 0x8a6a2f];
const SIDE_CHAPELS = [
  { sx: 1, c: 46.5, pic: 'p2' }, { sx: 1, c: 57.5 }, { sx: 1, c: 90.5, pic: 'p8' }, { sx: 1, c: 101.5 },
  { sx: -1, c: 46.5, pic: 'p6' }, { sx: -1, c: 57.5 }, { sx: -1, c: 68.5, pic: 'p5' }, { sx: -1, c: 79.5 }, { sx: -1, c: 90.5, pic: 'p7' }, { sx: -1, c: 101.5 },
];
wallZ(-30.6, 41, 107, 0, 12.2, [], 1);
wallZ(30.6, 41, 63, 0, 12.2, [], 1);
wallZ(30.6, 85, 107, 0, 12.2, [], 1);
for (const z of [41, 52, 96, 107]) wallX(z, 20, 31, 0, 12.2, [], 1);
for (const z of [41, 52, 63, 74, 85, 96, 107]) wallX(z, -31, -20, 0, 12.2, [], 1);
add(new THREE.PlaneGeometry(11, 66).rotateX(Math.PI / 2), M.sky, TRS(-25.5, 12, 74));
add(new THREE.PlaneGeometry(11, 22).rotateX(Math.PI / 2), M.sky, TRS(25.5, 12, 52));
add(new THREE.PlaneGeometry(11, 22).rotateX(Math.PI / 2), M.sky, TRS(25.5, 12, 96));
const chapelStatues = [];
const chapelArt = [];
SIDE_CHAPELS.forEach((ch, i) => {
  const { sx, c } = ch;
  box(3.4, 0.2, 5.4, sx * 28.2, 0, c, M.carve);
  box(1.3, 1, 3.4, sx * 29, 0.2, c, M.white);
  box(1.4, 0.06, 3.6, sx * 29, 1.2, c, M.gold);
  box(0.5, 0.02, 3.62, sx * 29, 1.26, c, M.red);
  for (const q of [-1.8, 1.8]) box(3.2, 0.42, 0.42, sx * 25, 0, c + q, M.wood);
  for (const q of [-3.4, 3.4]) { windowPane(true, sx * 30.04, c + q, 3.2, 1.7, 4.2); archTrim(c + q, 3.2, 1.7, 4.2, true, sx * 30); }
  box(0.3, 0.3, 10.8, sx * 29.95, 8.9, c, M.carve);
  if (ch.pic) {
    const pic = window.CHURCH_MEDIA.PICTURES.findIndex((p) => p.id === ch.pic);
    const info = window.CHURCH_MEDIA.PICTURES[pic];
    const wide = info.w > info.h;
    const h = wide ? 3 : 4.6; const w = Math.min(wide ? 5.4 : 3.6, (h * info.w) / info.h);
    box(0.1, h + 0.36, w + 0.36, sx * 30.04, 1.9, c, M.gold);
    const mat = new THREE.MeshBasicMaterial({ color: 0x2a2018, toneMapped: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(sx * 29.97, 2.08 + h / 2, c);
    mesh.rotation.y = -sx * Math.PI / 2;
    mesh.userData.picture = pic;
    scene.add(mesh);
    chapelArt.push({ mesh, mat, id: ch.pic });
  } else {
    box(0.9, 1.4, 1.2, sx * 29.6, 0.2, c, M.carve);
    chapelStatues.push({ x: sx * 29.6, y: 1.6, z: c, ry: sx > 0 ? -Math.PI / 2 : Math.PI / 2, s: 1.3, c: CHAPEL_ROBES[i % 6] });
    add(new THREE.TorusGeometry(1.5, 0.05, 6, 28, Math.PI), M.gold, TRS(sx * 29.98, 3.6, c, -sx * Math.PI / 2));
  }
});
statues('saint', chapelStatues);
let chapelArtLoaded = false;
function loadChapelArt() {
  chapelArtLoaded = true;
  const loader = new THREE.TextureLoader();
  for (const a of chapelArt) loader.load(`pictures/${a.id}-small.jpg`, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    a.mat.map = t; a.mat.color.setScalar(0.92); a.mat.needsUpdate = true; dirty = true;
  });
}

// ---------- Pictures in the upper gallery ----------
const PICTURES = window.CHURCH_MEDIA.PICTURES;
const WALL_X = 19.42; const PIC_Y = 22.75;
const pictureMats = [];
const pictureMeshes = PICTURES.map((pic, i) => {
  const wide = pic.w > pic.h;
  const h = wide ? 2.05 : 3.1;
  const w = Math.min(wide ? 3.65 : 2.5, (h * pic.w) / pic.h);
  box(0.1, h + 0.3, w + 0.3, WALL_X + 0.02, PIC_Y - h / 2 - 0.15, pic.z, M.gold);
  box(0.1, h + 0.1, w + 0.1, WALL_X - 0.02, PIC_Y - h / 2 - 0.05, pic.z, M.dark);
  add(new THREE.CylinderGeometry(0.035, 0.035, w * 0.6, 8), M.gold, TRS(WALL_X - 0.24, PIC_Y + h / 2 + 0.28, pic.z, 0, Math.PI / 2));
  box(0.32, 0.05, 0.05, WALL_X - 0.12, PIC_Y + h / 2 + 0.26, pic.z, M.gold);
  const mat = new THREE.MeshBasicMaterial({ color: 0x2a2018, toneMapped: false });
  pictureMats.push(mat);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(WALL_X - 0.08, PIC_Y, pic.z);
  mesh.rotation.y = -Math.PI / 2;
  mesh.userData.picture = i;
  scene.add(mesh);
  return mesh;
});
let picturesLoaded = false;
let pictureLight = 0.85;
function loadPictures() {
  picturesLoaded = true;
  const loader = new THREE.TextureLoader();
  PICTURES.forEach((pic, i) => loader.load(`pictures/${pic.id}-small.jpg`, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    pictureMats[i].map = t;
    pictureMats[i].color.setScalar(pictureLight);
    pictureMats[i].needsUpdate = true;
    dirty = true;
  }));
}

// ---------- Candles ----------
const candleSpots = [];
const candle = (x, y, z, h = 0.34) => candleSpots.push([x, y, z, h]);
const ironRing = (r, y, z, x = 0) => add(new THREE.TorusGeometry(r, 0.07, 6, 28), M.iron, TRS(x, y, z, 0, Math.PI / 2));
function chandelier(x, y, z, size = 1) {
  const tiers = phone ? [[2.5, 12, 0], [1.4, 7, 1.3]] : [[2.6, 18, 0], [1.9, 12, 1], [1.15, 8, 2]];
  for (const [r0, n, up] of tiers) {
    const r = r0 * size; const ty = y + up * size;
    ironRing(r, ty, z, x);
    ironRing(r * 0.97, ty + 0.14, z, x);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283;
      candle(x + Math.cos(a) * r, ty + 0.16, z + Math.sin(a) * r);
      if (i % 3 === 0) {
        const curl = new THREE.TorusGeometry(0.3 * size, 0.04, 5, 10, Math.PI);
        add(curl, M.iron, TRS(x + Math.cos(a) * r, ty - 0.28 * size, z + Math.sin(a) * r, -a));
      }
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * 6.283;
      const len = r;
      add(new THREE.BoxGeometry(len, 0.07, 0.07), M.iron, TRS(x + (Math.cos(a) * len) / 2, ty, z + (Math.sin(a) * len) / 2, -a));
    }
  }
  add(new THREE.CylinderGeometry(0.07, 0.07, 3.4 * size, 8), M.iron, TRS(x, y + 1.7 * size, z));
  add(new THREE.SphereGeometry(0.3 * size, 10, 8), M.iron, TRS(x, y + 0.1, z));
  add(new THREE.ConeGeometry(0.28 * size, 0.8 * size, 8), M.iron, TRS(x, y - 0.55 * size, z, 0, Math.PI));
}
// Large chandeliers hang down the nave, with smaller ones in each aisle.
const chand = [];
for (const c of bays) {
  if (inPozzo(c)) {
    // Under the painting, pairs of small chandeliers keep its centre clear.
    for (const sx of [-1, 1]) {
      chandelier(sx * 6.6, 12.5, c, 0.62);
      add(new THREE.CylinderGeometry(0.03, 0.03, vaultY(6.6) - 14.5, 5), M.iron, TRS(sx * 6.6, (vaultY(6.6) + 14.5) / 2, c));
    }
  } else {
    chandelier(0, 15.5, c, 1.15);
    add(new THREE.CylinderGeometry(0.035, 0.035, APEX - 19, 5), M.iron, TRS(0, (APEX + 19) / 2, c));
  }
  chand.push([0, 15.5, c]);
  for (const sx of [-1, 1]) {
    chandelier(sx * 15.5, 10.5, c, 0.72);
    add(new THREE.CylinderGeometry(0.03, 0.03, 7, 5), M.iron, TRS(sx * 15.5, 16.2, c));
  }
}
// Tall iron stands along the central walk.
function stand(x, z, y0 = 0) {
  cyl(0.05, 0.08, 2.5, x, y0, z, M.iron, 8);
  add(new THREE.ConeGeometry(0.38, 0.22, 8), M.iron, TRS(x, y0 + 0.11, z));
  ironRing(0.42, y0 + 2.5, z, x);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * 6.283;
    candle(x + Math.cos(a) * 0.42, y0 + 2.52, z + Math.sin(a) * 0.42, 0.4);
  }
  candle(x, y0 + 2.6, z, 0.55);
}
for (const z of piers.slice(1, -1)) for (const sx of [-1, 1]) stand(sx * 2.05, z - 5.5);
for (const sx of [-1, 1]) { stand(sx * 9.2, 12); stand(sx * 9.2, 26); stand(sx * 6, -19.8, 0); stand(sx * 8.8, -26, 0.96);  }
// Racks of small votive candles against the aisle walls and beside the altar.
function rack(x, z, alongZ, n = phone ? 8 : 14) {
  const w = alongZ ? 0.8 : 4; const d = alongZ ? 4 : 0.8;
  for (let row = 0; row < 3; row++) {
    box(w * 0.9 + (alongZ ? row * -0.2 : 0), 0.08, d * 0.9 + (alongZ ? 0 : row * -0.2), x, 0.9 + row * 0.3, z, M.iron);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n - 0.5;
      candle(x + (alongZ ? (row - 1) * 0.2 : t * 3.8), 0.98 + row * 0.3, z + (alongZ ? t * 3.8 : (row - 1) * 0.2), 0.16);
    }
  }
  for (const a of [-1, 1]) box(0.08, 1.7, 0.08, x + (alongZ ? 0 : a * 1.9), 0, z + (alongZ ? a * 1.9 : 0), M.iron);
}
for (const c of bays) for (const sx of [-1, 1]) if (c < 41 || c > 107) rack(sx * 19.2, c, true);
for (const ch of SIDE_CHAPELS) {
  rack(ch.sx * 24.2, ch.c - 4.9, false, phone ? 5 : 8);
  for (const q of [-1.1, 1.1]) { cyl(0.03, 0.08, 0.42, ch.sx * 28.75, 1.36, ch.c + q, M.gold, 8); candle(ch.sx * 28.75, 1.78, ch.c + q, 0.28); }
}
for (const zb of [63.9, 84.1]) rack(25, zb, false);
chandelier(23.5, 7.2, 74, 0.6);
add(new THREE.CylinderGeometry(0.03, 0.03, 3.4, 5), M.iron, TRS(23.5, 10.3, 74));
for (const sx of [-1, 1]) { rack(sx * 7.6, -17.6, false); rack(sx * 13, 19, false); }
// Candles on every stone ledge of the gallery, and along the altar steps.
for (const c of bays) for (const sx of [-1, 1]) for (let i = 0; i < 8; i++) candle(sx * 10.3, 20.66, c - 4.2 + i * 1.2, 0.26);
for (let x = -10; x <= 10; x += 0.7) { if (Math.abs(x) > 1.8) candle(x, 0.98, -19.7, 0.24); }
for (const [x, y, z] of altarCandles) candleSpots.push([x, y, z, 0]);
bake();
{
  const body = new THREE.CylinderGeometry(0.04, 0.05, 1, 6).translate(0, 0.5, 0);
  const real = candleSpots.filter((q) => q[3] > 0);
  const mesh = new THREE.InstancedMesh(body, lit({ color: 0xf0e4c4, emissive: 0xff9c45, emissiveIntensity: 0.5 }), real.length);
  real.forEach(([x, y, z, h], i) => mesh.setMatrixAt(i, TRS(x, y, z, 0, 0, 0, 1, h, 1)));
  mesh.frustumCulled = false;
  scene.add(mesh);
  const leaf = new THREE.InstancedMesh(leafGeo, M.carve, leaves.length);
  leaves.forEach((m, i) => leaf.setMatrixAt(i, m));
  leaf.frustumCulled = false;
  scene.add(leaf);
}
const flamePos = new Float32Array(candleSpots.length * 3);
const flameSeed = new Float32Array(candleSpots.length * 2);
candleSpots.forEach(([x, y, z, h], i) => {
  flamePos.set([x, y + h + 0.09, z], i * 3);
  flameSeed.set([Math.random() * 6.28, 2 + Math.random() * 5], i * 2);
});
const flameGeo = new THREE.BufferGeometry();
flameGeo.setAttribute('position', new THREE.BufferAttribute(flamePos, 3));
flameGeo.setAttribute('aSeed', new THREE.BufferAttribute(flameSeed, 2));
const flameU = { uTime: { value: 12 }, uPx: { value: 1 } };
const flames = new THREE.Points(flameGeo, new THREE.ShaderMaterial({
  uniforms: flameU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: `attribute vec2 aSeed; uniform float uTime, uPx; varying float vF;
    void main(){ vF = 0.82 + 0.18 * sin(uTime * aSeed.y + aSeed.x) * sin(uTime * 2.3 + aSeed.x * 2.0);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = clamp(uPx * 190.0 * vF / -mv.z, 2.2, 90.0);
      gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `varying float vF;
    void main(){ vec2 q = gl_PointCoord - 0.5; q.y *= 1.0;
      float d = length(q) * 2.0;
      float halo = pow(max(1.0 - d, 0.0), 3.0) * 0.5;
      vec2 f = q * vec2(14.0, 6.4); f.y -= 0.05;
      float flame = exp(-dot(f, f));
      vec3 c = vec3(1.0, 0.56, 0.2) * halo * vF + vec3(1.0, 0.86, 0.56) * flame * 1.7;
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
}));
flames.frustumCulled = false;
flames.renderOrder = 8;
scene.add(flames);
// Warm pools on the floor under each chandelier.
const glowMap = glowTexture();
const floorGlow = new THREE.MeshBasicMaterial({ map: glowMap, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.2, color: 0xffa860 });
for (const c of bays) {
  for (const [x, r] of [[0, 15], [-15.5, 9], [15.5, 9]]) {
    const pool = new THREE.Mesh(new THREE.CircleGeometry(r, 20).rotateX(-Math.PI / 2), floorGlow);
    pool.position.set(x, 0.06, c);
    scene.add(pool);
  }
}
// Coloured window light on the floor, and soft beams through the air.
const poolTex = tex(128, 256, (g, w, h) => {
  const colors = ['#2a66ff', '#e8344a', '#ffb52e', '#25b083', '#8d4be8'];
  for (let i = 0; i < 90; i++) { g.fillStyle = colors[Math.floor(rand() * 5)]; g.globalAlpha = 0.25 + rand() * 0.3; g.fillRect(rand() * w, rand() * h, 14, 16); }
  g.globalAlpha = 1;
  g.globalCompositeOperation = 'destination-in';
  const r = g.createRadialGradient(w / 2, h / 2, 12, w / 2, h / 2, h / 2);
  r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, w, h);
});
const poolMat = new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 });
const beamTex = tex(32, 128, (g, w, h) => {
  const v = g.createLinearGradient(0, 0, 0, h); v.addColorStop(0, 'rgba(255,235,190,.9)'); v.addColorStop(1, 'rgba(255,225,170,0)');
  g.fillStyle = v; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-in';
  const s = g.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(0,0,0,0)'); s.addColorStop(0.5, 'rgba(0,0,0,1)'); s.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = s; g.fillRect(0, 0, w, h);
});
const beamMat = new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.2 });
for (const c of bays) {
  for (const side of [-1, 1]) {
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 9).rotateX(-Math.PI / 2), poolMat);
    pool.position.set(-side * 3.5, 0.04, c);
    pool.rotation.y = 0.1 * side;
    scene.add(pool);
  }
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(7, 36), beamMat);
  beam.position.set(3.6, 15, c);
  beam.rotation.set(0, Math.PI / 2, 0.68);
  scene.add(beam);
}
const domeBeamMat = beamMat.clone(); domeBeamMat.opacity = 0.34;
for (let i = 0; i < 6; i++) {
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(7, 72), domeBeamMat);
  beam.position.set(0, 36, 19);
  beam.rotation.y = (i / 6) * Math.PI;
  scene.add(beam);
}
const hemi = new THREE.HemisphereLight(0xd8d6d0, 0x4c4238, 0.5);
scene.add(hemi);
const lamps = [[0, 14, 41, 0xffb56a, 130], [0, 14, 74, 0xffb56a, 130], [0, 14, 107, 0xffb56a, 110], [0, 30, 19, 0xffd09a, 170], [0, 9, -26, 0xffb56a, 190], [0, 4, 5, 0xffb56a, 60]].map(([x, y, z, c, p]) => {
  const l = new THREE.PointLight(c, p * 0.72, 58, 1.5);
  l.position.set(x, y, z);
  l.userData.base = p * 0.72;
  scene.add(l);
  return l;
});
// A warm lamp so the carved wood of the booths can be seen.
const chapelLamp = new THREE.PointLight(0xffbd7a, 15, 15, 1.6);
chapelLamp.position.set(22.5, 5.5, 74);
chapelLamp.userData.base = 15;
scene.add(chapelLamp);
lamps.push(chapelLamp);
for (const [x, z, p] of [[-23, 60, 26], [-23, 88, 26], [24, 52, 22], [24, 96, 22]]) {
  const l = new THREE.PointLight(0xffbd7a, p, 19, 1.6);
  l.position.set(x, 6, z);
  l.userData.base = p;
  scene.add(l);
  lamps.push(l);
}
scene.fog = new THREE.FogExp2(0x20160d, 0.006);

// ---------- Times of day ----------
const TIMES = {
  day: { pozzo: 0.95, relief: 0.45, hemi: 0.62, lamp: 0.45, candle: 0.5, flame: 0.7, floor: 0.06, glass: 1.25, pool: 0.75, beam: 0.24, dome: 0.34, fresco: 0.3, picture: 1, fog: 0x2a2016, exposure: 1 },
  sunset: { pozzo: 0.62, relief: 0.5, hemi: 0.3, lamp: 0.75, candle: 0.95, flame: 1, floor: 0.13, glass: 1.05, pool: 0.65, beam: 0.2, dome: 0.2, fresco: 0.17, picture: 0.88, fog: 0x20140c, exposure: 1 },
  night: { pozzo: 0.3, relief: 0.42, hemi: 0.09, lamp: 1, candle: 1.3, flame: 1, floor: 0.2, glass: 0.07, pool: 0, beam: 0, dome: 0, fresco: 0.06, picture: 0.72, fog: 0x100906, exposure: 1 },
};
let currentTime = 'sunset';
function setTime(name) {
  const t = TIMES[name];
  currentTime = name;
  for (const r of Object.values(builtRooms)) { r.setTime(name); r.people.setTime(name); }
  hemi.intensity = t.hemi;
  for (const l of lamps) l.intensity = l.userData.base * t.lamp;
  M.glass.color.setScalar(t.glass); M.rose.color.setScalar(t.glass);
  pozzoMat.color.setScalar(t.pozzo);
  reliefMat.emissiveIntensity = t.relief;
  candleU.value = t.candle;
  floorGlow.opacity = t.floor;
  flames.material.opacity = t.flame;
  poolMat.opacity = t.pool; beamMat.opacity = t.beam; domeBeamMat.opacity = t.dome;
  vaultMat.emissiveIntensity = t.fresco; domeMat.emissiveIntensity = t.fresco * 1.1; starMat.emissiveIntensity = t.fresco * 0.9; M.sky.emissiveIntensity = t.fresco * 0.75;
  scene.fog.color.set(t.fog);
  pictureLight = t.picture;
  for (const m of pictureMats) if (m.map) m.color.setScalar(t.picture);
  if (typeof people !== 'undefined') people.setTime(name);
  renderer.toneMappingExposure = t.exposure;
  document.querySelectorAll('[data-time]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.time === name)));
  dirty = true;
}

// ---------- Camera ----------
const VIEWS = {
  chapel: { p: [21, 1.7, 65.2], look: [28.2, 3.3, 76.5] },
  chapelsE: { p: [16.5, 1.7, 46.5], look: [30, 3.4, 46.5] },
  chapelsW: { p: [-16.5, 1.7, 57.5], look: [-30, 3.2, 57.5] },
  crypt: { room: 'crypt', p: [0, 1.7, 37], look: [0, 2.5, -8] },
  refectory: { room: 'hall', p: [-24, 1.7, 46], look: [27, 3.4, 46] },
  kitchen: { room: 'hall', p: [-4.5, 1.7, 59], look: [-14.5, 2.6, 74] },
  pozzo: { p: [0, 1.7, 100], look: [0, 44, 70] },
  relief: { p: [0, 2.6, -13], look: [0, 10.5, -38] },
  doors: { p: [0, 1.9, 116.8], look: [0, 16, 20] },
  middle: { p: [0, 1.7, 75], look: [0, 10, 0] },
  up: { p: [0, 1.7, 74], look: [0, 44, 66] },
  angle: { p: [-8.6, 1.7, 104], look: [3, 20, 40] },
  gallery: { p: [13.6, 21.8, 104.5], look: [19.5, 22.5, 74] },
  loft: { p: [0, 22, 110], look: [0, 18, 10] },
  dome: { p: [0, 1.7, 22], look: [0, 74, 19] },
  altar: { p: [0, 1.7, -8], look: [0, 12, -37] },
  sidewalk: { p: [15.5, 1.7, 110], look: [14, 6, 36] },
};
const cam = { yaw: 0, pitch: 0 };
let inBooth = false;
const ORBIT = { dist: 5.6, min: 2.2, max: 16 };
const player = window.CHURCH_WALK.createPlayer('nave', 0, 108, 0);
// Sets the camera exactly, for inside a booth.
function poseCamera(p, look) {
  camera.position.set(...p);
  const dx = look[0] - p[0]; const dy = look[1] - p[1]; const dz = look[2] - p[2];
  cam.yaw = Math.atan2(-dx, -dz);
  cam.pitch = Math.atan2(dy, Math.hypot(dx, dz));
  dirty = true;
}
// Stands the character so that the camera, behind them, looks from p toward look.
function pose(p, look) {
  poseCamera(p, look);
  const d = myShown ? ORBIT.dist : 0.15;
  const yp = cam.pitch;
  player.go(player.place, p[0] - Math.sin(cam.yaw) * d, p[2] - Math.cos(cam.yaw) * d, p[1] > 15 ? (Math.abs(p[0]) < 11 ? 20.4 : 20.3) : 0);
  player.face = [-Math.sin(cam.yaw), -Math.cos(cam.yaw)];
  cam.pitch = yp;
}
const guards = new Map();
function orbitCamera() {
  const body = myShown ? 1.35 : 1.7;
  const d = myShown ? ORBIT.dist : 0.15;
  // Above this tilt the camera stops rising or falling and simply looks up, so the ceiling can be seen.
  const lean = Math.max(-1, Math.min(0.2, cam.pitch));
  const c = Math.cos(lean);
  const wantX = player.x + Math.sin(cam.yaw) * c * d; const wantZ = player.z + Math.cos(cam.yaw) * c * d;
  const k = window.CHURCH_WALK.cameraRoom(player.place, player.x, player.z, player.y, wantX, wantZ);
  let px = player.x + (wantX - player.x) * k; let py = Math.max(player.y + 0.25, player.y + body - Math.sin(lean) * d * k); let pz = player.z + (wantZ - player.z) * k;
  // The camera stops in front of anything solid in this room.
  const sc = activeRoom ? activeRoom.scene : scene;
  if (!guards.has(sc)) {
    guards.set(sc, null);
    setTimeout(() => window.CHURCH_GUARD.fromScene(sc, (o) => !o.material?.transparent && !o.material?.isShaderMaterial && !o.material?.isMeshBasicMaterial).then((g) => { guards.set(sc, g); }), 300);
  }
  const g = guards.get(sc);
  if (g && myShown) {
    const q = g.clip(player.x, player.y + body, player.z, px, py, pz, 3);
    px = player.x + (px - player.x) * q; py = player.y + body + (py - player.y - body) * q; pz = player.z + (pz - player.z) * q;
  }
  camera.position.set(px, py, pz);
}
// Rooms are separate scenes, built the first time someone goes there.
let activeRoom = null;
const builtRooms = {};
function goRoom(name) {
  if (name && !builtRooms[name]) {
    builtRooms[name] = buildRoom(name, { redraw: () => { dirty = true; } });
    builtRooms[name].setTime(currentTime);
    builtRooms[name].people.setTime(currentTime);
    if (!people.shown) builtRooms[name].people.setShown(false);
  }
  activeRoom = name ? builtRooms[name] : null;
  player.place = name || 'nave';
  (activeRoom ? activeRoom.scene : scene).add(mine.sprite);
  document.querySelector('.title h1').textContent = activeRoom ? activeRoom.title : (document.documentElement.lang === 'vi' ? 'Nhà thờ Tâm Hồn' : 'Church of the Lost Souls');
  document.getElementById('backToNave').hidden = !activeRoom;
  dirty = true;
}
function setView(name) {
  const v = VIEWS[name];
  seat = null;
  if (window.CHURCH_PLACE === 'outside') comeInside();
  goRoom(v.room || null);
  pose(v.p, v.look);
  document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
}
let dirty = true;
let drag = null;
canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, yaw: cam.yaw, pitch: cam.pitch }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  cam.yaw = drag.yaw - (e.clientX - drag.x) * 0.005;
  cam.pitch = Math.max(-1, Math.min(1.45, drag.pitch - (e.clientY - drag.y) * 0.004));
  dirty = true;
});
const tapRay = new THREE.Raycaster();
const tapPoint = new THREE.Vector2();
canvas.addEventListener('pointerup', (e) => {
  const moved = drag ? Math.hypot(e.clientX - drag.x, e.clientY - drag.y) : 99;
  drag = null;
  if (moved > 8 || inBooth) return;
  const r = canvas.getBoundingClientRect();
  tapPoint.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  tapRay.setFromCamera(tapPoint, camera);
  const upstairs = player.y > 15;
  const crowd = activeRoom ? activeRoom.people : people;
  const targets = [...(activeRoom ? [] : upstairs ? pictureMeshes : [...hitBoxes, ...chapelArt.map((a) => a.mesh)]), ...(crowd.shown ? crowd.sprites.filter((q) => q.visible) : []), ...(window.CHURCH_CHAT?.targets() || []), ...(mine.sprite.visible ? [mine.sprite] : [])];
  const hits = tapRay.intersectObjects(targets).filter((h) => {
    const u = h.object.userData;
    if (u.booth !== undefined) return player.x > 11 && h.distance < 26;
    if (u.picture !== undefined) return h.distance < 30 && (upstairs || Math.abs(player.x) > 11);
    if (u.person || u.visitor) return h.distance < 40 && Math.abs(h.point.y - player.y) < 8;
    return true;
  });
  const hit = hits.find((h) => !h.object.userData.me) || hits[0];
  if (hit) {
    const u = hit.object.userData;
    if (u.me) window.dispatchEvent(new CustomEvent('me-tap'));
    else if (u.visitor) window.CHURCH_CHAT.tap(u.visitor);
    else if (u.person) showPerson(u.person);
    else if (u.picture !== undefined) window.dispatchEvent(new CustomEvent('picture-tap', { detail: u.picture }));
    else if (u.booth !== undefined) window.dispatchEvent(new CustomEvent('booth-tap', { detail: u.booth }));
    return;
  }
  // Nothing to open here, so walk to the spot on the floor.
  const floorPoint = tapRay.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -player.y), new THREE.Vector3());
  if (floorPoint) player.walkTo(floorPoint.x, floorPoint.z);
});
const moves = window.CHURCH_MOVES;
canvas.addEventListener('wheel', (e) => { e.preventDefault(); ORBIT.dist = Math.max(ORBIT.min, Math.min(ORBIT.max, ORBIT.dist * (1 + e.deltaY * 0.001))); dirty = true; }, { passive: false });
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
document.querySelectorAll('[data-time]').forEach((b) => b.addEventListener('click', () => setTime(b.dataset.time)));
function resize() {
  const r = canvas.parentElement.getBoundingClientRect();
  if (!r.width) return;
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height;
  camera.fov = r.width < r.height ? 82 : 66;
  flameU.uPx.value = renderer.getPixelRatio() * (r.height / 700);
  camera.updateProjectionMatrix();
  dirty = true;
}
addEventListener('resize', resize);
const still = params.has('still') || matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastDraw = 0;
let frameCount = 0;
let doorShown = false;
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  if (window.CHURCH_PLACE === 'outside') { last = now; return; }
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  // Candles flicker at up to 30 frames a second, unless motion is turned off.
  if (!still && now - lastDraw >= 33) { flameU.uTime.value = now * 0.001; dirty = true; }
  if (typeof priest !== 'undefined') priest.update(dt, now, camera, !still);
  if (typeof people !== 'undefined') {
    if (seat && moves.size) standUp();
    if (!inBooth && !seat && player.step(dt, moves, cam.yaw, 5.5)) dirty = true;
    if (activeRoom) activeRoom.update(dt, now, camera, !still);
    else people.update(dt, now, camera, !still && !inBooth);
    mine.sprite.visible = myShown && !inBooth;
    if (mine.sprite.visible) mine.setAt(player.x, player.y, player.z, player.face, player.walking, camera, now, Boolean(seat));
    seatPopup.update(activeRoom ? { place: player.place, x: 0, z: 0, y: 99 } : player, Boolean(seat));
    window.CHURCH_CHAT?.frame(activeRoom ? activeRoom.scene : scene, player.place, camera, dt, now, player, Boolean(seat));
    const atDoor = !activeRoom && player.y < 15 && player.z > 110 && Math.abs(player.x) < 7;
    if (atDoor !== doorShown) { doorShown = atDoor; document.getElementById('doorBtn').hidden = !atDoor; }
    if (still) dirty = dirty || frameCount++ < 3;
  }
  if (!activeRoom && !picturesLoaded && player.y > 15) loadPictures();
  if (!activeRoom && !chapelArtLoaded && Math.abs(player.x) > 11 && player.y < 15) loadChapelArt();
  if (!dirty) return;
  dirty = false;
  lastDraw = now;
  if (!inBooth) orbitCamera();
  camera.rotation.set(cam.pitch, cam.yaw, 0);
  renderer.render(activeRoom ? activeRoom.scene : scene, camera);
  window.CHURCH_NAVE.triangles = renderer.info.render.triangles;
  window.CHURCH_NAVE.calls = renderer.info.render.calls;
}
let beforeBooth = null;
window.CHURCH_NAVE = {
  player, ORBIT, sitDown, standUp, setView, setTime, goOutside: (s) => goOutside(s), redraw: () => { dirty = true; },
  setMyLook(sheet, shown) { mine.setSheet(sheet); myShown = shown; dirty = true; },
  seePicture(i) { seat = null; if (window.CHURCH_PLACE === 'outside') comeInside(); goRoom(null); const z = PICTURES[i].z + 2; pose([12, 21.8, z], [19.4, 22.7, z - 1.1]); },
  setBoothLight(i, busy) {
    const b = boothLights[i];
    b.red.mat.color.copy(busy ? b.red.on : b.red.off); b.red.glow.visible = busy;
    b.green.mat.color.copy(busy ? b.green.off : b.green.on); b.green.glow.visible = !busy;
    dirty = true;
  },
  focusBooth(i) { seat = null; goRoom(null); pose([20.8, 1.7, BOOTH_Z[i] - 1.2], [28, 2.2, BOOTH_Z[i] + 0.5]); },
  enterBooth(i) {
    const z = BOOTH_Z[i];
    beforeBooth = { p: camera.position.toArray(), yaw: cam.yaw, pitch: cam.pitch };
    inBooth = true;
    moves.clear();
    boothLamp.position.set(28.2, 3.3, z - 1.9);
    boothLamp.intensity = 2.4;
    poseCamera([28.65, 1.72, z - 2.5], [28.65, 1.68, z - 0.85]);
    window.CHURCH_CHAT?.enterBooth(i);
  },
  leaveBooth() {
    inBooth = false;
    boothLamp.intensity = 0;
    if (beforeBooth) { cam.yaw = beforeBooth.yaw; cam.pitch = beforeBooth.pitch; }
    window.CHURCH_CHAT?.leaveBooth();
    dirty = true;
  },
};
const priest = createPriest(scene);
setupPriestPanel(priest);
window.CHURCH_PLACE = 'inside';
const people = createPeople(scene);
// Sitting in a pew.
let seat = null;
function takenSeats() {
  const list = window.CHURCH_CAST.CAST.filter((c) => c.route.length === 1 && c.route[0][3] === 'sit').map((c) => [c.route[0][0], c.route[0][1]]);
  return list.concat(window.CHURCH_CHAT?.seated() || []);
}
function sitDown(side, row) {
  const spot = window.CHURCH_WALK.seatSpot(side, row, takenSeats());
  seat = { side, row };
  player.target = null; player.walking = false;
  player.x = spot.x; player.z = spot.z; player.y = 0;
  player.face = [0, -1];
  cam.yaw = 0; cam.pitch = -0.08;
  dirty = true;
}
function standUp() {
  if (!seat) return;
  player.x = seat.side * 1; // Back into the centre aisle, at the end of the row.
  seat = null;
  dirty = true;
}
const seatPopup = createSeatPopup({ onSit: sitDown, onStand: standUp });
const mine = createMe();
let myShown = true;
scene.add(mine.sprite);
document.getElementById('backToNave').addEventListener('click', () => setView('middle'));
const personNote = document.getElementById('personNote');
let personTimer = 0;
function showNote(text) {
  personNote.textContent = text;
  personNote.hidden = false;
  clearTimeout(personTimer);
  personTimer = setTimeout(() => { personNote.hidden = true; }, 4000);
}
window.CHURCH_NOTE = showNote;
const showPerson = (c) => showNote(`${c.role}: ${c.doing}.`);
document.querySelectorAll('[data-people]').forEach((b) => b.addEventListener('click', () => { const on = !people.shown; people.setShown(on); for (const r of Object.values(builtRooms)) r.people.setShown(on); b.textContent = people.shown ? 'Hide people' : 'Show people'; dirty = true; }));
import('./me.js');
// ---------- Inside and outside ----------
const OUT_TIME = { day: 'morning', sunset: 'sunset', night: 'night' };
const IN_TIME = { morning: 'day', sunrise: 'day', sunset: 'sunset', night: 'night' };
const outsideCanvas = document.getElementById('outsideView');
const bodyPlace = (p) => { document.body.dataset.place = p; };
bodyPlace('inside');
async function goOutside(spot = 'doors') {
  document.getElementById('loadingNote').hidden = false;
  await new Promise((r) => { requestAnimationFrame(() => setTimeout(r, 30)); });
  window.CHURCH_PLACE = 'outside';
  document.getElementById('doorBtn').hidden = true; doorShown = false;
  bodyPlace('outside');
  canvas.hidden = true;
  outsideCanvas.hidden = false;
  document.getElementById('backToNave').hidden = true;
  document.querySelector('.title h1').textContent = document.documentElement.lang === 'vi' ? 'Bên ngoài nhà thờ' : 'Outside the church';
  seat = null;
  document.getElementById('seatCard').hidden = true;
  document.getElementById('standBtn').hidden = true;
  window.CHURCH_CHAT?.placeChanged();
  await import('./facade.js');
  window.CHURCH_FACADE.resize();
  window.CHURCH_FACADE.setTime(OUT_TIME[currentTime]);
  window.CHURCH_FACADE.walkTo(spot);
  document.getElementById('loadingNote').hidden = true;
}
function comeInside() {
  window.CHURCH_PLACE = 'inside';
    bodyPlace('inside');
  outsideCanvas.hidden = true;
  canvas.hidden = false;
  document.getElementById('enterBtn').hidden = true;
  window.CHURCH_CHAT?.placeChanged();
  document.querySelector('.title h1').textContent = document.documentElement.lang === 'vi' ? 'Nhà thờ Tâm Hồn' : 'Church of the Lost Souls';
  if (window.CHURCH_FACADE) setTime(IN_TIME[window.CHURCH_FACADE.time()] || 'sunset');
  resize();
  dirty = true;
}
window.CHURCH_WORLD = { goInside() { comeInside(); setView('doors'); } };
window.CHURCH_NAVE_API = { goOutside };
document.getElementById('doorBtn').addEventListener('click', () => goOutside('doors'));
document.querySelectorAll('[data-walk]').forEach((b) => b.addEventListener('click', () => goOutside(b.dataset.walk)));
document.querySelector('[data-go-in]').addEventListener('click', () => window.CHURCH_WORLD.goInside());
import('./chat.js');
import('./confess.js');
import('./music.js');
import('./pictures.js');
if (params.get('priest')) priest.place(1.6, Number(params.get('priest')));
resize();
setTime(params.get('time') || 'sunset');
setView(params.get('view') || 'doors');
requestAnimationFrame(frame);
