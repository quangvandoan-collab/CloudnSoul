// The landscape beyond the church: mountains, a great lake, a waterfall and a curving river.
import * as THREE from './vendor/three.module.min.js';
import { seasonU } from './seasons.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, v) => { const t = clamp01((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
export const LAKE_Y = -165;
export const edgeX = (z) => -770 + 40 * Math.sin(z * 0.008);
const FALL_Z = 285;
const FALL_TOP = 66;
// A tiered fall: a wide stepped fan, a rocky shelf, then a single plunge to the river.
const F_X0 = -740; const F_FAN = 72; const F_SHELF_Y = -24; const F_LIP = -628; const FALL_X = -618;
const F_END = -600;
const stair = (t, n) => { const k = Math.min(n - 1e-4, Math.max(0, t * n)); const i = Math.floor(k); const f = k - i; return (i + Math.pow(Math.min(1, f * 1.5), 3) * 0.86 + f * 0.14) / n; };
function fallProfile(x, z) {
  const dz = Math.abs(z - FALL_Z);
  const n = rollingRaw(x * 2, z * 2);
  const ledges = 9;
  if (x < F_X0) return FALL_TOP - 7 + n;
  const fanEnd = F_X0 + F_FAN;
  if (x < fanEnd) return mix(FALL_TOP, F_SHELF_Y, stair((x - F_X0) / F_FAN, ledges)) + n * Math.min(4, dz * 0.03);
  if (x < F_LIP - 4) return F_SHELF_Y + n * 3 + Math.max(0, dz - 42) * 0.07;
  if (x < F_LIP + 5) return mix(F_SHELF_Y, -148, (x - F_LIP + 4) / 9);
  return -148;
}
const fallWeight = (x, z) => smooth(205, 112, Math.abs(z - FALL_Z)) * smooth(F_END, F_END - 16, x) * smooth(F_X0 - 42, F_X0 - 14, x);

// River course: x, z, water height, width, canyon width.
const COURSE = [
  [FALL_X, FALL_Z, -142, 36, 62], [-525, 262, -144, 38, 78], [-420, 312, -146, 42, 85], [-280, 248, -148, 46, 75],
  [-120, 302, -149, 52, 55], [0, 273, -150, 56, 40], [130, 232, -151, 58, 60], [290, 340, -153, 62, 80],
  [420, 520, -156, 68, 90], [380, 760, -159, 76, 90], [470, 1000, -163, 92, 70], [560, 1280, LAKE_Y, 130, 40],
];
const curve = new THREE.CatmullRomCurve3(COURSE.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
function sampleRiver(n) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = curve.getPoint(u);
    const k = u * (COURSE.length - 1);
    const a = COURSE[Math.min(COURSE.length - 1, Math.floor(k))];
    const b = COURSE[Math.min(COURSE.length - 1, Math.floor(k) + 1)];
    const f = k - Math.floor(k);
    const t = curve.getTangent(u);
    out.push({ x: p.x, z: p.z, y: mix(a[2], b[2], f), w: mix(a[3], b[3], f), c: mix(a[4], b[4], f), tx: t.x, tz: t.z, u });
  }
  return out;
}
const RIVER = sampleRiver(170);
export function riverNear(x, z) {
  if (summit) return null;
  if (z < -160 || z > 1500 || x < -850 || x > 800) return null;
  let best = null; let bd = Infinity;
  for (const s of RIVER) {
    const d = (s.x - x) * (s.x - x) + (s.z - z) * (s.z - z);
    if (d < bd) { bd = d; best = s; }
  }
  return { ...best, d: Math.sqrt(bd) };
}
export function lakeE(x, z) {
  if (summit) return 99;
  const e = (x / 3000) ** 2 + ((z - 2200) / 1250) ** 2;
  return e * (1 + 0.08 * Math.sin(x * 0.004) + 0.06 * Math.sin(z * 0.006 + x * 0.002));
}
const rollingRaw = (x, z) => Math.sin(x * 0.041 + z * 0.033) * 0.6 + Math.sin(x * 0.097 - z * 0.081 + 1.1) * 0.4;
const rolling = (x, z) => Math.sin(x * 0.0061 + z * 0.0043) * 0.5 + Math.sin(x * 0.0137 - z * 0.0091 + 1.7) * 0.28 + Math.sin(x * 0.031 + z * 0.027 + 0.6) * 0.14 + Math.sin(x * 0.071 - z * 0.059 + 2.1) * 0.08;

// The upper river: from a spring near the mountain top down to the waterfall's lip.
const UPPER_ROUTE = [[-430, -1215, 7, 26], [-560, -1000, 9, 30], [-440, -780, 11, 34], [-690, -560, 13, 38], [-600, -330, 16, 40], [-860, -120, 19, 40], [-790, 60, 22, 36], [-930, 190, 25, 34], [F_X0 - 110, 296, 27, 28], [F_X0 + 1, 285, 34, 16]];
let UPPER = null;
function upperRiver() {
  if (UPPER) return UPPER;
  const c = new THREE.CatmullRomCurve3(UPPER_ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const n = 150;
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const p = c.getPoint(u); const t = c.getTangent(u);
    const k = u * (UPPER_ROUTE.length - 1);
    const a = UPPER_ROUTE[Math.min(UPPER_ROUTE.length - 1, Math.floor(k))];
    const b = UPPER_ROUTE[Math.min(UPPER_ROUTE.length - 1, Math.floor(k) + 1)];
    const f = k - Math.floor(k);
    out.push({ x: p.x, z: p.z, tx: t.x, tz: t.z, w: mix(a[2], b[2], f), c: mix(a[3], b[3], f), y: landBase(p.x, p.z) });
  }
  // Water only runs downhill: each point sits at or below the one before it.
  const end = FALL_TOP + 3;
  for (let i = 0; i <= n; i++) {
    const room = 0.14 * (n - i);
    out[i].y = Math.max(end + room, Math.min(out[i].y - 4, i ? out[i - 1].y - 0.15 : Infinity));
  }
  for (let pass = 0; pass < 4; pass++) for (let i = 1; i < n; i++) out[i].y = (out[i - 1].y + out[i].y * 2 + out[i + 1].y) / 4;
  out[n].y = end; out[n - 1].y = Math.max(out[n - 1].y, end);
  out.forEach((s, i) => {
    const prev = out[Math.max(0, i - 2)]; const next = out[Math.min(n, i + 2)];
    const d = Math.hypot(next.x - prev.x, next.z - prev.z) || 1;
    const slope = (prev.y - next.y) / d;
    s.rough = Math.min(1, 0.32 + slope * 2.2);
  });
  UPPER = out;
  return out;
}
function upperNear(x, z) {
  if (x < -1120 || x > -300 || z < -1320 || z > 420) return null;
  let best = null; let bd = Infinity;
  for (const s of upperRiver()) {
    const d = (s.x - x) * (s.x - x) + (s.z - z) * (s.z - z);
    if (d < bd) { bd = d; best = s; }
  }
  return { ...best, d: Math.sqrt(bd) };
}
// The ground dips below each stairway, so it never pokes through the steps.
let STAIRWAYS = [[[-20, 176, -60], [-42, 164, -40], 8], [[-24, 147, -40], [24, 108, -20], 8], [[36, 90, -20], [0, 58, 0], 14]];
function belowStairs(x, z, h) {
  for (const [a, b, w] of STAIRWAYS) {
    const dx = b[0] - a[0]; const dz = b[1] - a[1]; const len2 = dx * dx + dz * dz;
    const t = clamp01(((x - a[0]) * dx + (z - a[1]) * dz) / len2);
    const d = Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t));
    const reach = w / 2 + 34;
    if (d < reach) {
      const stepY = a[2] + (b[2] - a[2]) * t - 4;
      if (h > stepY) h = mix(stepY, h, smooth(w / 2 + 6, reach, d));
    }
  }
  return h;
}
// A firm limit used last of all, after the ground has been shaped around paths and terraces.
export function underStairs(x, z, h) {
  for (const [a, b, w] of STAIRWAYS) {
    const dx = b[0] - a[0]; const dz = b[1] - a[1]; const len2 = dx * dx + dz * dz;
    const t = clamp01(((x - a[0]) * dx + (z - a[1]) * dz) / len2);
    if (Math.hypot(x - (a[0] + dx * t), z - (a[1] + dz * t)) < w / 2 + 9) h = Math.min(h, a[2] + (b[2] - a[2]) * t - 2.4);
  }
  return h;
}
// ---------- The summit, for the Cloud Temple ----------
// One high mountain with a long ridge down its south side, rising from a sea of cloud among other peaks.
let summit = false;
export function useSummit() { summit = true; STAIRWAYS = [[[0, 176, -60], [0, 145, -40], 10], [[0, 133.5, -40], [0, 102.5, -20], 10], [[0, 91, -20], [0, 58.75, 0], 10]]; }
export const LOOKOUTS = [[-390, 215, -46], [445, 300, -72], [-250, -420, -32]];
const RIDGE = [[0, 58, 0], [0, 91, -20], [0, 102.5, -20], [0, 133.5, -40], [0, 145, -40], [0, 176, -60], [0, 208, -60], null, [0, 338, -60], [-20, 368, -66], [50, 438, -82], [-70, 508, -102], [0, 568, -120], [0, 700, -190], [0, 840, -290]];
const PEAKS = [...LOOKOUTS.map(([x, z, t]) => [x, z, 190, t]),
  [-620, -40, 230, 40], [640, -60, 240, 62], [-520, 520, 190, -86], [560, 650, 210, -100], [-180, -760, 280, 90], [300, -640, 240, 50], [-860, 330, 260, 12], [900, 240, 280, 30],
  [-1050, -420, 340, 96], [1100, -480, 360, 120], [-250, 1120, 300, -30], [400, 1250, 330, -6], [-1250, 820, 340, 18], [1340, 860, 360, 30], [0, -1320, 420, 150], [-1620, -120, 420, 110], [1680, -60, 450, 130], [-880, -1180, 420, 118], [930, -1240, 450, 136], [-620, 1720, 400, 6], [760, 1800, 440, 20], [-2100, 660, 500, 60], [2200, 720, 520, 76], [0, 2300, 520, 18], [-2500, -900, 600, 180], [2600, -900, 620, 190], [0, -2500, 700, 240]];
// Peaks near the summit stay well below the temple, so the view from the top is open.
for (const p of PEAKS) {
  if (LOOKOUTS.some((q) => q[0] === p[0] && q[1] === p[1])) continue;
  p[3] = Math.min(p[3], -55 + Math.max(0, Math.hypot(p[0], p[1]) - 1300) * 0.07);
}
function summitLand(x, z) {
  const fall = (d) => (d < 55 ? d * 0.4 : 22 + (d - 55) * 1.7);
  const dx = Math.max(-133 - x, 0, x - 133); const dz = Math.max(-198 - z, 0, z - 64);
  let h = -2.2 - fall(Math.hypot(dx, dz));
  for (let i = 1; i < RIDGE.length; i++) {
    const a = RIDGE[i - 1]; const b = RIDGE[i];
    if (!a || !b) continue;
    const vx = b[0] - a[0]; const vz = b[1] - a[1];
    const t = clamp01(((x - a[0]) * vx + (z - a[1]) * vz) / (vx * vx + vz * vz));
    const d = Math.hypot(x - (a[0] + vx * t), z - (a[1] + vz * t));
    h = Math.max(h, a[2] + (b[2] - a[2]) * t - 1.5 - fall(d));
  }
  for (const [px, pz, r, top] of PEAKS) {
    const d = Math.hypot(x - px, z - pz);
    const ang = Math.atan2(z - pz, x - px);
    const lump = 1 + 0.15 * Math.sin(ang * 3 + px) + 0.09 * Math.sin(ang * 7 + pz) + 0.05 * Math.sin(ang * 13 + px * 0.3);
    const u = d / (r * lump);
    const crag = (Math.sin(x * 0.037 + Math.sin(z * 0.021) * 2.4) * Math.sin(z * 0.033 + Math.sin(x * 0.019) * 2.1) * 26 + Math.sin(x * 0.11 + z * 0.07) * 7) * Math.min(1, u * 1.6);
    let p = top - Math.pow(u, 2.3) * (top + 420) + crag;
    if (LOOKOUTS.some((q) => q[0] === px && q[1] === pz)) p = d < 26 ? top : Math.min(p, top - 0.5) - Math.max(0, 40 - d) * 0;
    h = Math.max(h, p);
  }
  const flat = clamp01((Math.hypot(dx, dz) - 20) / 90);
  h += (rolling(x * 2.6, z * 2.6) * 16 + rollingRaw(x * 0.7, z * 0.7) * 6) * flat;
  return Math.max(h, -420);
}
export function landHeight(x, z) {
  if (summit) return summitLand(x, z);
  let h = belowStairs(x, z, landBase(x, z));
  const up = upperNear(x, z);
  if (up && up.d < up.w / 2 + up.c + 14) {
    const d = up.d + rolling(x * 3, z * 3) * 4;
    h = mix(h, up.y - 1.6, (1 - smooth(up.w / 2 + 12, up.w / 2 + 12 + up.c, d)) * Math.max(smooth(F_X0 - 2, F_X0 - 34, x), smooth(60, 140, Math.abs(z - FALL_Z))));
  }
  return h;
}
function landBase(x, z) {
  const a = Math.abs(x);
  let h;
  if (z >= 568) h = mix(-121, -150, clamp01((z - 568) / 450));
  else if (z >= 338) h = mix(-63, -121, (z - 338) / 230);
  else if (z >= 208) h = -63;
  else if (z >= 58) h = mix(-7, -63, (z - 58) / 150);
  else if (z > -202) h = -6;
  else h = -6 + Math.min(720, 0.72 * (-202 - z));
  const e = lakeE(x, z);
  const open = smooth(1, 1.9, e);
  const wide = smooth(170, 800, a);
  h += -25 * smooth(130, 260, a) + wide * Math.min(320, 60 + 0.16 * a) * open;
  h += rolling(x, z) * (3 + 90 * wide + (z < -202 ? 26 : 0)) * open;
  // The high cliff that the waterfall drops from.
  const edge = edgeX(z);
  const nearFall = Math.abs(z - FALL_Z);
  const wall = smooth(edge, edge - 30, x) * smooth(1100, 500, nearFall);
  if (wall > 0) h = mix(h, Math.max(h, 66 + rolling(x, z) * 30 * smooth(60, 170, nearFall)), wall);
  // The river cuts its own canyon, except behind the waterfall.
  if (x > edge - 2) {
    const r = riverNear(x, z);
    if (r) {
      const d = r.d + rolling(x * 3, z * 3) * 9;
      h = mix(h, r.y - 6, 1 - smooth(r.w / 2, r.w / 2 + r.c, d));
    }
  }
  const fw = fallWeight(x, z);
  if (fw > 0) h = mix(h, fallProfile(x, z) - 2.5, fw);
  return mix(h, -182, smooth(1.07, 0.97, e));
}
const landBelow = (x, z) => landHeight(x, z);
export function isWaterSide(x, z) {
  if (summit) return false;
  const r = riverNear(x, z);
  const up = upperNear(x, z);
  return lakeE(x, z) < 1.05 || fallWeight(x, z) > 0.15 || (r && r.d < r.w / 2 + 12) || (up && up.d < up.w / 2 + 14);
}

// ---------- Shared sky and water code ----------
export const skyU = {
  uTop: { value: new THREE.Color() }, uLow: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() },
  uGlow: { value: new THREE.Color() }, uGlowAmt: { value: 0 }, uCloud: { value: 0 }, uCloudCol: { value: new THREE.Color() }, uSunSize: { value: 1 },
  uTime: { value: 12 }, uDeep: { value: new THREE.Color() }, uShallow: { value: new THREE.Color() }, uRidge: { value: new THREE.Color() }, uHaze: { value: new THREE.Color() },
  uGlitter: { value: 1 }, uLight: { value: 1 }, uSnow: { value: new THREE.Color(0xffffff) }, uSnowLine: { value: 0 },
};
export const SKY_GLSL = `
uniform vec3 uTop, uLow, uSunDir, uSunCol, uGlow, uCloudCol;
uniform float uGlowAmt, uCloud, uSunSize, uTime;
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ return vnoise(p) * 0.55 + vnoise(p * 2.1 + 7.0) * 0.3 + vnoise(p * 4.3 + 13.0) * 0.15; }
vec3 skyColor(vec3 d){
  float h = clamp(d.y * 1.6 + 0.02, 0.0, 1.0);
  vec3 c = mix(uLow, uTop, pow(h, 0.55));
  float s = max(dot(d, uSunDir), 0.0);
  float az = max(dot(normalize(vec3(d.x, 0.001, d.z)), normalize(vec3(uSunDir.x, 0.001, uSunDir.z))), 0.0);
  c = mix(c, uGlow, uGlowAmt * pow(az, 3.0) * exp(-max(d.y, 0.0) * 5.0));
  if (d.y > 0.005) {
    vec2 q = d.xz / (d.y + 0.12);
    float k = smoothstep(0.5, 0.76, fbm(q * vec2(0.9, 2.6) + uTime * 0.002)) * uCloud * smoothstep(0.01, 0.14, d.y);
    c = mix(c, mix(uCloudCol, uGlow, pow(az, 2.0) * uGlowAmt), k);
  }
  return c + uSunCol * (smoothstep(0.99955 + (1.0 - uSunSize) * 0.0003, 0.99985, s) * 4.0 + pow(s, 90.0) * 0.45 * uSunSize);
}`;
const crest = (x) => {
  const a = Math.abs(x);
  return 430 + 170 * Math.sin(x * 0.0011 + 1) + 110 * Math.sin(x * 0.0027 + 2.3) + 60 * Math.sin(x * 0.0063 + 0.7) + 28 * Math.sin(x * 0.015 + 4.1) - 210 * Math.exp(-(((a - 1740) / 650) ** 2));
};
const CREST_GLSL = `float crest(float x){ float a = abs(x), q = (a - 1740.0) / 650.0;
  return 430.0 + 170.0 * sin(x * 0.0011 + 1.0) + 110.0 * sin(x * 0.0027 + 2.3) + 60.0 * sin(x * 0.0063 + 0.7) + 28.0 * sin(x * 0.015 + 4.1) - 210.0 * exp(-q * q); }`;
const OUT = '\n#include <colorspace_fragment>\n';
const sharedU = (extra = {}) => ({ ...skyU, ...extra });

export function createSkyMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, uniforms: sharedU(),
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vP; ${SKY_GLSL} void main(){ gl_FragColor = vec4(skyColor(normalize(vP)), 1.0); ${OUT} }`,
  });
}

function addRidges(scene, phone) {
  const mat = (haze, snowAt) => new THREE.ShaderMaterial({
    uniforms: sharedU(), side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vW; varying vec3 vN; void main(){ vW = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vW; varying vec3 vN; uniform vec3 uRidge, uHaze, uSnow; uniform float uSnowLine; ${SKY_GLSL}
      void main(){ vec3 N = normalize(vN); if (N.y < 0.0) N = -N;
        float n = fbm(vW.xy * vec2(0.012, 0.03));
        float lit = max(dot(N, uSunDir), 0.0);
        vec3 c = uRidge * (0.62 + n * 0.6) + uSunCol * lit * 0.34 * (0.6 + n * 0.5);
        float snow = smoothstep(${snowAt.toFixed(1)}, ${(snowAt + 170).toFixed(1)}, vW.y - uSnowLine + n * 150.0);
        c = mix(c, uSnow * (0.4 + lit * 0.5) + uSunCol * lit * 0.28, snow * 0.92);
        float low = 1.0 - clamp((vW.y + 165.0) / 650.0, 0.0, 1.0);
        c = mix(c, uHaze, clamp(${haze.toFixed(2)} + low * 0.5, 0.0, 0.95));
        gl_FragColor = vec4(c, 1.0); ${OUT} }`,
  });
  const strip = (z, depth, crestFn, m) => {
    const nx = phone ? 260 : 520; const nz = 18;
    const g = new THREE.PlaneGeometry(1, 1, nx, nz);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) + 0.5; const v = p.getY(i) + 0.5;
      const x = (u - 0.5) * 18000;
      const prof = Math.pow(Math.sin(Math.min(1, v) * Math.PI * 0.5), 1.2);
      const zz = z - depth + v * depth;
      const ridged = (1 - Math.abs(Math.sin(x * 0.0041 + v * 2.4))) * 74 + (1 - Math.abs(Math.sin(x * 0.0113 + v * 5.2))) * 34 + (1 - Math.abs(Math.sin(x * 0.029 + v * 8))) * 11;
      p.setXYZ(i, x, -178 + (crestFn(x) + 178 + ridged * (v < 0.98 ? 1 : 0.2)) * prof, zz);
    }
    g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    scene.add(mesh);
  };
  strip(3950, 480, crest, mat(0.16, 620));
  strip(5100, 900, (x) => 900 + 300 * Math.sin(x * 0.0009 + 3.1) + 150 * Math.sin(x * 0.0023) + 70 * Math.sin(x * 0.0071 + 1) - (x < 0 ? 620 : 300) * Math.exp(-(((Math.abs(x) - 2230) / 800) ** 2)), mat(0.42, 640));
}

function addLake(scene, phone) {
  const g = new THREE.PlaneGeometry(7400, 2900, 1, 1).rotateX(-Math.PI / 2);
  const lake = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: sharedU(),
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec3 vW; uniform vec3 uDeep, uShallow, uRidge, uHaze; uniform float uGlitter; ${SKY_GLSL} ${CREST_GLSL}
      void main(){
        vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 V = toCam / dist;
        vec2 p = vW.xz; float t = uTime;
        float fade = 1.0 / (1.0 + dist * 0.0009);
        vec2 grad = vec2(0.0);
        grad += vec2(0.8, 0.6) * cos(dot(p, vec2(0.8, 0.6)) * 0.13 + t * 0.7) * 0.045;
        grad += vec2(-0.5, 0.86) * cos(dot(p, vec2(-0.5, 0.86)) * 0.31 + t * 1.0) * 0.032;
        grad += vec2(0.28, 0.96) * cos(dot(p, vec2(0.28, 0.96)) * 0.72 + t * 1.5) * 0.022;
        grad += vec2(fbm(p * 0.05 + t * 0.09) - 0.5, fbm(p * 0.05 + 31.0 - t * 0.08) - 0.5) * 0.09;
        vec3 N = normalize(vec3(grad.x * fade * 1.5, 1.0, grad.y * fade * 1.5));
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        vec3 refl = skyColor(R);
        if (R.z > 0.02) {
          float k = (3950.0 - vW.z) / R.z;
          float cy = vW.y + R.y * k;
          float over = smoothstep(-14.0, 14.0, cy - crest(vW.x + R.x * k));
          refl = mix(mix(uRidge, uHaze, 0.25), refl, over);
        }
        float e = pow(vW.x / 3000.0, 2.0) + pow((vW.z - 2200.0) / 1250.0, 2.0);
        float farShore = smoothstep(0.72, 1.0, e) * smoothstep(2500.0, 3300.0, vW.z);
        refl = mix(refl, uRidge * 0.65, farShore * 0.8);
        float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 body = mix(uDeep, uShallow, smoothstep(0.62, 1.02, e));
        vec3 c = mix(body, refl, clamp(0.52 + F * 0.48, 0.0, 1.0));
        float s = max(dot(R, uSunDir), 0.0);
        c += uSunCol * uGlitter * (pow(s, 260.0) * 2.6 + pow(s, 30.0) * 0.14);
        float cell = hash21(floor(p * 0.5) + floor(t * 3.0) * 0.37);
        c += uSunCol * uGlitter * step(0.982, cell) * pow(s, 22.0) * 3.2;
        gl_FragColor = vec4(c, 1.0); ${OUT} }`,
  }));
  lake.position.set(0, LAKE_Y, 2250);
  lake.frustumCulled = false;
  scene.add(lake);
  // Star-shaped sparkles that catch the low sun.
  const count = phone ? 1200 : 3400;
  const pos = new Float32Array(count * 3); const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const z = 1020 + Math.pow(Math.random(), 1.3) * 2300;
    const x = (Math.random() - 0.5) * (1300 + z * 0.75);
    pos.set([x, LAKE_Y + 0.4, z], i * 3);
    seed.set([(Math.random() - 0.5) * 0.11, (Math.random() - 0.5) * 0.05, 1 + Math.random() * 3.5, Math.random() * 6.28], i * 4);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const stars = new THREE.Points(geo, new THREE.ShaderMaterial({
    uniforms: sharedU({ uPx: { value: Math.min(devicePixelRatio || 1, 2) } }), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec4 aSeed; uniform vec3 uSunDir; uniform float uTime, uGlitter, uPx; varying float vA;
      void main(){ vec3 V = normalize(cameraPosition - position); vec3 N = normalize(vec3(aSeed.x, 1.0, aSeed.y));
        vec3 R = reflect(-V, N); float s = pow(max(dot(R, uSunDir), 0.0), 90.0);
        float tw = pow(0.5 + 0.5 * sin(uTime * aSeed.z + aSeed.w), 5.0);
        vA = s * tw * uGlitter; gl_PointSize = (2.5 + vA * 20.0) * uPx; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying float vA; uniform vec3 uSunCol;
      void main(){ vec2 q = abs(gl_PointCoord - 0.5) * 2.0; float d = length(q);
        float v = exp(-d * d * 22.0) + exp(-q.x * 26.0) * exp(-q.y * 3.2) * 0.75 + exp(-q.y * 26.0) * exp(-q.x * 3.2) * 0.75;
        if (vA < 0.01) discard;
        gl_FragColor = vec4(mix(uSunCol, vec3(1.0), 0.55) * v * vA * 2.2, 1.0); ${OUT} }`,
  }));
  stars.frustumCulled = false;
  stars.renderOrder = 3;
  scene.add(stars);
}

function ribbon(samples, widen) {
  const n = samples.length;
  const pos = new Float32Array(n * 6); const uv = new Float32Array(n * 4); const rough = new Float32Array(n * 2);
  const idx = [];
  let along = 0;
  samples.forEach((s, i) => {
    if (i) along += Math.hypot(s.x - samples[i - 1].x, s.z - samples[i - 1].z);
    const len = Math.hypot(s.tx, s.tz) || 1;
    const nx = -s.tz / len; const nz = s.tx / len;
    const hw = s.w / 2 + widen;
    pos.set([s.x + nx * hw, s.y, s.z + nz * hw, s.x - nx * hw, s.y, s.z - nz * hw], i * 6);
    uv.set([-1, along, 1, along], i * 4);
    const r = s.rough ?? (0.35 + 0.65 * smooth(0.42, 0.04, s.u) + 0.3 * Math.max(0, Math.sin(s.u * 40)));
    const fadeOut = s.u === undefined ? 1 : smooth(1, 0.9, s.u);
    rough.set([r * 10 + fadeOut * 0.0, r * 10], i * 2);
    samples[i].fade = fadeOut;
    if (i < n - 1) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const fade = new Float32Array(n * 2);
  samples.forEach((s, i) => fade.set([s.fade, s.fade], i * 2));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aRiver', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aRough', new THREE.BufferAttribute(rough, 1));
  g.setAttribute('aFade', new THREE.BufferAttribute(fade, 1));
  g.setIndex(idx);
  return g;
}

function addRiver(scene) {
  const material = new THREE.ShaderMaterial({
    uniforms: sharedU({ uRiverDeep: { value: new THREE.Color(0x0a5f6c) }, uRiverLight: { value: new THREE.Color(0x35b8aa) } }), transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute vec2 aRiver; attribute float aRough, aFade; varying vec2 vR; varying vec3 vW; varying float vRough, vFade;
      void main(){ vR = aRiver; vW = position; vRough = aRough * 0.1; vFade = aFade; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vR; varying vec3 vW; varying float vRough, vFade; uniform vec3 uRiverDeep, uRiverLight; uniform float uLight, uGlitter; ${SKY_GLSL}
      void main(){ float flow = vR.y - uTime * (7.0 + vRough * 12.0);
        float n = fbm(vec2(vR.x * 5.0 + 9.0, flow * 0.05));
        float m = fbm(vec2(vR.x * 13.0, flow * 0.14 + 3.0));
        vec3 body = mix(uRiverDeep, uRiverLight, clamp(smoothstep(0.2, 1.0, abs(vR.x)) + (n - 0.5) * 0.7, 0.0, 1.0)) * uLight;
        vec3 V = normalize(cameraPosition - vW);
        vec3 N = normalize(vec3((n - 0.5) * 0.3, 1.0, (m - 0.5) * 0.3));
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        float F = 0.03 + 0.97 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 c = mix(body, skyColor(R), clamp(F + 0.1, 0.0, 1.0));
        float foam = smoothstep(0.64 - vRough * 0.13, 0.82, m) * (0.2 + vRough * 0.8);
        c = mix(c, vec3(0.92) * max(uLight, 0.1), clamp(foam, 0.0, 0.9));
        c += uSunCol * uGlitter * pow(max(dot(R, uSunDir), 0.0), 180.0) * 1.8;
        gl_FragColor = vec4(c, vFade); ${OUT} }`,
  });
  const main = new THREE.Mesh(ribbon(sampleRiver(420), 14), material);
  main.frustumCulled = false;
  main.renderOrder = 1;
  scene.add(main);
  const top = new THREE.Mesh(ribbon(upperRiver().map((q) => ({ ...q })), 7), material);
  top.frustumCulled = false;
  top.renderOrder = 1;
  scene.add(top);
}

function addWaterfall(scene, rand) {
  // Rock the fall runs over: dark ledges, with moss on anything flat enough to hold it.
  const nx = 80; const nz = 110;
  const rg = new THREE.PlaneGeometry(1, 1, nx, nz).rotateX(-Math.PI / 2);
  const rp = rg.attributes.position;
  const fx0 = F_X0 - 42; const fx1 = F_END;
  for (let i = 0; i < rp.count; i++) {
    const x = fx0 + (rp.getX(i) + 0.5) * (fx1 - fx0);
    const z = FALL_Z + rp.getZ(i) * 420;
    const w = fallWeight(x, z);
    rp.setXYZ(i, x, mix(landBelow(x, z) - 8, fallProfile(x, z), smooth(0.02, 0.5, w)), z);
  }
  rg.computeVertexNormals();
  const rockMat = new THREE.MeshStandardMaterial({ roughness: 1, color: 0xffffff, side: THREE.DoubleSide });
  rockMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uSeasonSnow: seasonU.uSeasonSnow, uGrass: seasonU.uGrass });
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vFP;\nvarying float vFU;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvFP = position; vFU = normal.y;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      uniform float uSeasonSnow; uniform vec3 uGrass; varying vec3 vFP; varying float vFU;
      float fH(vec2 p){ return fract(sin(dot(floor(p), vec2(127.1, 311.7))) * 43758.5); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float a = fH(vFP.xz * 0.9); float b = fH(vec2(vFP.y * 1.8, (vFP.x + vFP.z) * 0.35));
        vec3 rock = mix(vec3(0.075, 0.07, 0.07), vec3(0.19, 0.175, 0.165), b) * (0.8 + a * 0.4);
        float moss = smoothstep(0.62, 0.86, vFU + (a - 0.5) * 0.24);
        vec3 green = mix(vec3(0.17, 0.27, 0.06), vec3(0.36, 0.4, 0.1), fH(vFP.xz * 0.28)) * uGrass;
        vec3 c = mix(rock, green, moss);
        diffuseColor.rgb = mix(c, vec3(0.88, 0.91, 0.95), uSeasonSnow * moss);`);
  };
  const rockMesh = new THREE.Mesh(rg, rockMat);
  rockMesh.frustumCulled = false; rockMesh.receiveShadow = true;
  scene.add(rockMesh);
  const fallMat = new THREE.ShaderMaterial({
    uniforms: sharedU(), transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'attribute float aStep; varying vec2 vU; varying float vS; void main(){ vU = uv; vS = aStep; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec2 vU; varying float vS; uniform float uLight; ${SKY_GLSL}
      void main(){
        float s = fbm(vec2(vU.x * 34.0, vU.y * 5.0 + uTime * 1.4));
        float q = fbm(vec2(vU.x * 90.0, vU.y * 14.0 + uTime * 2.8));
        float edge = smoothstep(0.0, 0.14 + s * 0.16, vU.x) * smoothstep(1.0, 0.86 - s * 0.16, vU.x);
        float strands = smoothstep(0.26 - vS * 0.2, 0.5, s + q * 0.34);
        vec3 c = mix(vec3(0.42, 0.56, 0.6), vec3(0.88, 0.91, 0.92), smoothstep(0.3, 0.72, s + q * 0.3)) * max(uLight, 0.12) + uSunCol * 0.03;
        gl_FragColor = vec4(c, edge * mix(0.1, 0.94, strands)); ${OUT} }`,
  });
  // A sheet that follows a path, x and y for each step, with its own width at each step.
  const sheet = (path, cz, order = 2) => {
    const n = path.length;
    const cols = 16;
    const pos = []; const uv = []; const st = []; const idx = [];
    path.forEach(([x, y, w, thin], j) => {
      for (let i = 0; i <= cols; i++) {
        const u = i / cols;
        pos.push(x + Math.sin(u * 19 + j) * 0.5, y, cz + (u - 0.5) * w);
        uv.push(u, 1 - j / (n - 1));
        st.push(thin);
      }
    });
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < cols; i++) {
      const a = j * (cols + 1) + i;
      idx.push(a, a + 1, a + cols + 1, a + 1, a + cols + 2, a + cols + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute('aStep', new THREE.Float32BufferAttribute(st, 1));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, fallMat);
    m.frustumCulled = false;
    m.renderOrder = order;
    scene.add(m);
  };
  // Upper fan: narrow at the top, spreading wide over every ledge.
  const fan = [];
  for (let j = 0; j <= 72; j++) {
    const t = j / 72;
    const x = F_X0 + t * F_FAN;
    fan.push([x, fallProfile(x, FALL_Z) + 1.1, 38 + Math.pow(t, 0.8) * 130, 0.12]);
  }
  sheet(fan, FALL_Z);
  // Water spreads across the shelf, then gathers toward the lip.
  const shelf = [];
  for (let j = 0; j <= 12; j++) {
    const t = j / 12;
    shelf.push([F_X0 + F_FAN - 1 + t * (F_LIP - F_X0 - F_FAN - 2), F_SHELF_Y + 3.6, 158 - t * 112, 0.34]);
  }
  sheet(shelf, FALL_Z);
  // Lower plunge: a single tall curtain, slightly narrowing.
  const drop = [];
  for (let j = 0; j <= 30; j++) {
    const t = j / 30;
    drop.push([F_LIP + 1 + Math.pow(t, 2) * 11 + 5 * Math.min(1, t * 12), F_SHELF_Y + 3 - t * (F_SHELF_Y + 3 + 142), 46 - t * 5, 0.75]);
  }
  sheet(drop, FALL_Z, 3);
  // Rising mist at the foot.
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const pen = c.getContext('2d');
  for (let i = 0; i < 40; i++) {
    const x = 28 + rand() * 72; const y = 28 + rand() * 72; const r = 12 + rand() * 24;
    const gr = pen.createRadialGradient(x, y, 1, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    pen.fillStyle = gr; pen.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  const mist = [];
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.32, fog: false }));
    s.position.set(FALL_X + 8 + rand() * 40, -138 + rand() * 30, FALL_Z + (rand() - 0.5) * 66);
    const w = 44 + rand() * 66;
    s.scale.set(w, w * 0.7, 1);
    s.renderOrder = 4;
    scene.add(s);
    mist.push(s);
  }
  return mist;
}

function addRocks(scene, phone, rand, TRS) {
  const g = new THREE.IcosahedronGeometry(1, 2).toNonIndexed();
  const p = g.attributes.position;
  const lump = (x, y, z) => 1 + Math.sin(x * 3.1 + y * 2.3) * 0.17 + Math.sin(y * 5.3 + z * 3.7 + 1) * 0.12 + Math.sin(z * 8.1 - x * 6.3) * 0.06;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
    const k = lump(x, y, z) * (y > 0.45 ? 0.88 : 1);
    p.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals();
  const count = phone ? 60 : 130;
  const material = new THREE.MeshStandardMaterial({ roughness: 0.95 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRockP;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRockP = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vRockP;\nfloat rockH(vec3 p){return fract(sin(dot(floor(p),vec3(12.9,78.2,37.7)))*43758.5);}')
      .replace('#include <color_fragment>', `#include <color_fragment>
        diffuseColor.rgb *= 0.72 + rockH(vRockP * 26.0) * 0.26 + rockH(vRockP * 6.0) * 0.28 - smoothstep(0.1, -0.5, vRockP.y) * 0.3;`);
  };
  const rocks = new THREE.InstancedMesh(g, material, count);
  const foamC = document.createElement('canvas');
  foamC.width = foamC.height = 128;
  const fg = foamC.getContext('2d');
  for (let i = 0; i < 700; i++) {
    const a = rand() * 6.28; const r = 34 + rand() * 26 * rand() + (rand() < 0.5 ? rand() * 8 : 0);
    fg.fillStyle = `rgba(255,255,255,${0.2 + rand() * 0.7})`;
    fg.fillRect(64 + Math.cos(a) * r, 64 + Math.sin(a) * r, 1 + rand() * 3, 1 + rand() * 2);
  }
  const foamTex = new THREE.CanvasTexture(foamC);
  const foam = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: foamTex, transparent: true, depthWrite: false, opacity: 0.9, fog: false }), count);
  foam.renderOrder = 2;
  const samples = sampleRiver(260);
  const col = new THREE.Color();
  let placed = 0; let foams = 0;
  const big = [[-30, 250, 15], [36, 300, 13], [58, 248, 19], [-62, 292, 17], [-105, 335, 21], [108, 205, 20], [165, 268, 22]];
  const put = (x, z, size, y, ry) => {
    rocks.setMatrixAt(placed, TRS(x, y, z, ry, (rand() - 0.5) * 0.4, (rand() - 0.5) * 0.4, size * (0.85 + rand() * 0.5), size * (0.6 + rand() * 0.4), size * (0.85 + rand() * 0.5)));
    rocks.setColorAt(placed, col.set([0x7a7264, 0x6c6659, 0x8a8172, 0x5f5b52][Math.floor(rand() * 4)]));
    placed++;
  };
  const foamAt = (x, z, y, size, ry) => { foam.setMatrixAt(foams, TRS(x, y + 0.12, z, ry, 0, 0, size * 3.1, 1, size * 2.5)); foams++; };
  for (const [x, z, size] of big) {
    const r = riverNear(x, z);
    put(x, z, size, r.y + size * 0.1, rand() * 6.28);
    if (r.d < r.w / 2 + 6) foamAt(x, z, r.y, size, Math.atan2(r.tx, r.tz));
  }
  while (placed < count) {
    const s = samples[Math.floor(4 + rand() * 225)];
    const len = Math.hypot(s.tx, s.tz) || 1;
    const nx = -s.tz / len; const nz = s.tx / len;
    const inRiver = rand() < 0.58;
    const off = inRiver ? (rand() - 0.5) * s.w * 0.86 : (rand() < 0.5 ? -1 : 1) * (s.w / 2 + 3 + rand() * 26);
    const x = s.x + nx * off; const z = s.z + nz * off;
    if (Math.abs(x) < 12) continue;
    const size = inRiver ? 2.5 + rand() * rand() * 11 : 5 + rand() * rand() * 22;
    if (inRiver) {
      put(x, z, size, s.y + size * 0.05, rand() * 6.28);
      foamAt(x, z, s.y, size, Math.atan2(s.tx, s.tz));
    } else put(x, z, size, landHeight(x, z) + size * 0.2, rand() * 6.28);
  }
  foam.count = foams;
  rocks.castShadow = true; rocks.receiveShadow = true; rocks.frustumCulled = false; foam.frustumCulled = false;
  scene.add(rocks, foam);
}

export function createScenery(scene, phone, rand, TRS) {
  if (summit) return { mist: [] };
  addRidges(scene, phone);
  addLake(scene, phone);
  addRiver(scene);
  const mist = addWaterfall(scene, rand);
  addRocks(scene, phone, rand, TRS);
  return { mist };
}
