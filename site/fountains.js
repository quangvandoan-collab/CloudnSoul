// Three original fountains for the terraces, with rising water, cascades and coloured night lighting.
import * as THREE from './vendor/three.module.min.js';
import { makeFigure } from './figures.js';

const G = 9.8;
const POINT_VS = `
attribute vec3 aVel; attribute vec2 aInfo; // aInfo: phase, life
uniform float uTime, uScale, uSize;
varying float vAge;
void main() {
  float t = fract(uTime / aInfo.y + aInfo.x) * aInfo.y;
  vec3 p = position + aVel * t + vec3(0.0, -4.9 * t * t, 0.0);
  vAge = t / aInfo.y;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.5, uSize * (1.1 - vAge * 0.5) * uScale / -mv.z);
}`;
const POINT_FS = `
uniform vec3 uTint; uniform float uGlow;
varying float vAge;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = smoothstep(1.0, 0.25, d) * (0.62 - vAge * 0.2);
  vec3 c = mix(vec3(0.93, 0.97, 1.0), uTint * 1.25, uGlow * (0.55 + vAge * 0.45));
  gl_FragColor = vec4(c, a * (0.75 + uGlow * 0.5));
}`;
const SHEET_VS = `varying vec2 vUv; varying float vY; void main() { vUv = uv; vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SHEET_FS = `
uniform float uTime, uGlow; uniform vec3 uTint; varying vec2 vUv;
float hash(float n) { return fract(sin(n) * 43758.5453); }
void main() {
  float xx = vUv.x * 150.0;
  float i0 = floor(xx); float w = smoothstep(0.0, 1.0, fract(xx));
  float streak = mix(hash(i0), hash(mod(i0 + 1.0, 150.0)), w);
  float flow = 0.5 + 0.5 * sin(vUv.y * 15.0 + uTime * (4.5 + streak * 3.0) + streak * 40.0);
  float a = smoothstep(0.2, 0.75, streak) * (0.3 + 0.55 * flow);
  vec3 c = mix(vec3(0.92, 0.97, 1.0), uTint * 1.2, uGlow * 0.8);
  gl_FragColor = vec4(c, a * (0.3 + 0.7 * vUv.y) * 0.8);
}`;
const POOL_VS = `varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const POOL_FS = `
uniform float uTime, uGlow, uR; uniform vec3 uDeep, uTint; varying vec3 vP;
void main() {
  float r = length(vP.xz);
  float a = sin(r * 5.0 - uTime * 3.2) * 0.5 + sin((vP.x + vP.z) * 3.1 + uTime * 1.3) * 0.3 + sin((vP.x - vP.z) * 4.3 - uTime * 1.9) * 0.2;
  float edge = smoothstep(uR * 0.55, uR, r);
  vec3 c = mix(uDeep, uDeep * 1.7 + 0.1, a * 0.5 + 0.5);
  c = mix(c, uTint * 1.05, uGlow * (0.18 + 0.42 * edge));
  c += vec3(pow(max(a, 0.0), 6.0)) * (0.5 + uGlow * 0.3);
  gl_FragColor = vec4(c, 0.9);
}`;
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 1, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.3, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const lathe = (pts, seg = 48) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
// A basin whose rim rolls in soft scallops, like a shell.
function shellBowl(r, y, depth, lobes, amount) {
  const g = lathe([[0.2, y - depth], [r * 0.45, y - depth * 0.85], [r * 0.85, y - depth * 0.3], [r, y], [r * 0.98, y + 0.09], [r * 0.9, y + 0.04], [0.1, y - 0.02]], 96);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i); const z = p.getZ(i); const a = Math.atan2(z, x); const k = Math.hypot(x, z) / r;
    const w = 1 + Math.cos(a * lobes) * amount * k * k;
    p.setX(i, x * w); p.setZ(i, z * w);
    p.setY(i, p.getY(i) + Math.cos(a * lobes) * amount * r * 0.5 * k * k * k);
  }
  g.computeVertexNormals();
  return g;
}
export function createFountains(scene, opts) {
  const { phone, stone, gold } = opts;
  const glowTex = glowTexture();
  const time = { value: 12 };
  const scale = { value: 700 };
  const glow = { value: 0 };
  const all = [];
  const density = phone ? 0.5 : 1.9;
  const shine = gold.clone();
  shine.emissive = new THREE.Color(0x7a5414);
  function build(cx, y0, cz, tint, deep, design) {
    const group = new THREE.Group();
    group.position.set(cx, y0, cz);
    scene.add(group);
    const uTint = { value: new THREE.Color(tint) };
    const body = stone.clone();
    body.emissive = new THREE.Color(tint); body.emissiveIntensity = 0;
    const metal = shine;
    const add = (g, m = body) => { const me = new THREE.Mesh(g, m); group.add(me); return me; };
    // Outer basin with a moulded rim and a paved step around it.
    add(lathe([[8.1, 0.03], [8.1, 0.2], [7.6, 0.2], [7.5, 0.25], [7.5, 0.72], [7.7, 0.84], [7.7, 0.98], [7.25, 1.06], [6.95, 0.98], [6.9, 0.3], [0, 0.3]]));
    const R = 6.95;
    const pool = new THREE.Mesh(new THREE.CircleGeometry(R, 64).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ vertexShader: POOL_VS, fragmentShader: POOL_FS, transparent: true, uniforms: { uTime: time, uGlow: glow, uR: { value: R }, uDeep: { value: new THREE.Color(deep) }, uTint } }));
    pool.position.y = 0.72;
    group.add(pool);
    // Lights set under the water around the rim.
    const lights = [];
    const n = 16;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 6.283;
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: tint, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
      s.position.set(Math.cos(a) * 6.5, 0.85, Math.sin(a) * 6.5);
      s.scale.set(1.9, 1.9, 1);
      group.add(s);
      lights.push(s);
    }
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: tint, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    halo.position.set(0, 4.2, 0); halo.scale.set(19, 15, 1);
    group.add(halo);
    // Water.
    const pos = []; const vel = []; const info = [];
    function jet(o, v, count, floorY = 0.75, jitter = 0.05) {
      const c = Math.max(6, Math.round(count * density));
      const life = (v[1] + Math.sqrt(Math.max(0, v[1] * v[1] + 2 * G * (o[1] - floorY)))) / G;
      for (let i = 0; i < c; i++) {
        pos.push(o[0] + (Math.random() - 0.5) * 0.05, o[1], o[2] + (Math.random() - 0.5) * 0.05);
        vel.push(v[0] * (1 + (Math.random() - 0.5) * jitter), v[1] * (1 + (Math.random() - 0.5) * jitter), v[2] * (1 + (Math.random() - 0.5) * jitter));
        info.push(i / c + Math.random() * 0.012, life);
      }
    }
    // Jets in a ring: from radius r, out (or in, if negative) at speed out, and up at speed up.
    function ring(r, y, count, out, up, each, floorY) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * 6.283 + 0.13;
        jet([Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * out, up, Math.sin(a) * out], each, floorY);
      }
    }
    const sheets = [];
    function curtain(r, top, bottom, lobes = 0, amount = 0) {
      const g = new THREE.CylinderGeometry(r, r * 1.05, top - bottom, 72, 1, true);
      g.translate(0, (top + bottom) / 2, 0);
      if (lobes) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i); const z = p.getZ(i); const w = 1 + Math.cos(Math.atan2(z, x) * lobes) * amount; p.setX(i, x * w); p.setZ(i, z * w); } }
      const m = new THREE.ShaderMaterial({ vertexShader: SHEET_VS, fragmentShader: SHEET_FS, transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uTime: time, uGlow: glow, uTint } });
      sheets.push(new THREE.Mesh(g, m));
      group.add(sheets[sheets.length - 1]);
    }
    const tools = { add, body, metal, ring, jet, curtain };
    design(tools);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aVel', new THREE.Float32BufferAttribute(vel, 3));
    geo.setAttribute('aInfo', new THREE.Float32BufferAttribute(info, 2));
    const pts = new THREE.Points(geo, new THREE.ShaderMaterial({ vertexShader: POINT_VS, fragmentShader: POINT_FS, transparent: true, depthWrite: false, uniforms: { uTime: time, uScale: scale, uSize: { value: phone ? 0.26 : 0.17 }, uTint, uGlow: glow } }));
    pts.frustumCulled = false;
    group.add(pts);
    all.push({ body, lights, halo });
  }
  // Lower terrace: slender stacked tiers with long rose-lit arcs.
  if (!opts.temple) build(0, -60, 192, 0xff86bd, 0x1c4d6a, ({ add, metal, ring, jet, curtain }) => {
    add(lathe([[1.5, 0.3], [1.15, 0.7], [0.7, 1.3], [0.55, 2.1], [0.85, 2.6], [0.5, 3.0]]));
    add(shellBowl(3.5, 3.5, 0.75, 16, 0.05));
    add(lathe([[0.55, 3.45], [0.34, 4.1], [0.3, 4.9], [0.55, 5.25], [0.3, 5.5]]));
    add(shellBowl(2.15, 5.75, 0.5, 12, 0.06));
    add(lathe([[0.3, 5.7], [0.2, 6.5], [0.42, 6.85], [0.2, 7.05]]));
    add(shellBowl(1.05, 7.3, 0.28, 8, 0.07));
    add(lathe([[0.16, 7.25], [0.24, 7.6], [0.12, 8], [0.07, 8.35], [0, 8.42]], 16), metal);
    curtain(3.45, 3.5, 0.8, 16, 0.05);
    curtain(2.1, 5.75, 3.6, 12, 0.06);
    curtain(1, 7.3, 5.8, 8, 0.07);
    jet([0, 8.4, 0], [0, 7, 0], 90, 7.3, 0.03);
    ring(3.4, 3.6, 12, 2.1, 7, 46);
    ring(2.1, 5.8, 8, 1.2, 5.2, 40, 3.55);
    ring(7, 0.85, 22, -1.6, 10.2, 40);
  });
  // Cliff terrace: scalloped cascades under a carved fruit crown, in warm gold light.
  if (!opts.temple) build(-45, -40, 147, 0xffb347, 0x20434a, ({ add, body, metal, ring, jet, curtain }) => {
    add(lathe([[1.8, 0.3], [1.3, 0.8], [1, 1.6], [1.3, 2.1]]));
    add(shellBowl(4.7, 2.7, 1, 26, 0.035));
    add(lathe([[1, 2.6], [0.8, 3.3], [1, 3.8]]));
    add(shellBowl(3.1, 4.2, 0.8, 20, 0.045));
    // The carved body: a tapered form covered in rows of rounded scales.
    const prof = [];
    for (let i = 0; i <= 44; i++) { const t = i / 44; prof.push([0.42 + 1.22 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.08)), 0.72), 4.1 + t * 3.15]); }
    const fruit = lathe(prof, 112);
    const p = fruit.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i); const a = Math.atan2(z, x);
      const row = Math.round(y * 3.4); const w = 1 + 0.085 * Math.max(0, Math.cos((a + (row % 2) * 0.224) * 14)) * Math.max(0, Math.cos((y * 3.4 - row) * 3.14));
      p.setX(i, x * w); p.setZ(i, z * w);
    }
    fruit.computeVertexNormals();
    add(fruit, body);
    const leaf = new THREE.ConeGeometry(0.2, 1, 4).scale(1, 1, 0.35);
    for (let tier = 0; tier < 3; tier++) for (let i = 0; i < 8; i++) {
      const a = (i / 8) * 6.283 + tier * 0.4;
      const m = add(leaf.clone(), metal);
      const r = 0.34 - tier * 0.08;
      m.position.set(Math.cos(a) * r, 7.5 + tier * 0.32, Math.sin(a) * r);
      m.rotation.set(0, -a, -0.75 + tier * 0.25);
    }
    curtain(4.65, 2.75, 0.8, 26, 0.035);
    curtain(3.05, 4.2, 2.85, 20, 0.045);
    jet([0, 8.5, 0], [0, 5.6, 0], 70, 4.2, 0.03);
    ring(3.05, 4.3, 18, 1.1, 2.6, 22, 2.75);
    ring(4.65, 2.85, 26, 1.1, 2.2, 20);
    ring(7, 0.85, 16, -1.5, 6.2, 30);
  });
  // High terrace: a rocky hill with three angels, surrounded by turquoise water and cool blue light.
  if (!opts.temple) build(45, -20, 108, 0x46d7ff, 0x1f9fa6, ({ add, metal, ring, jet, curtain }) => {
    const rock = new THREE.IcosahedronGeometry(1, 4);
    const stones = [[0, 1.1, 0, 4, 1.7, 4], [2.5, 0.8, 1.3, 2.3, 1.3, 2], [-2.5, 0.8, 1.2, 2.3, 1.1, 2.1], [0.2, 0.8, -2.9, 2.5, 1.3, 2], [0, 2.8, 0, 2.3, 1.6, 2.2], [1.1, 2.3, -0.9, 1.5, 1.2, 1.4]];
    for (const [x, y, z, a, b, c] of stones) {
      const g = rock.clone();
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const nx = p.getX(i); const ny = p.getY(i); const nz = p.getZ(i);
        const k = 1 + Math.sin(nx * 4.3 + x) * Math.sin(ny * 3.7 + z) * Math.sin(nz * 5.1) * 0.22;
        p.setXYZ(i, nx * k, ny * k, nz * k);
      }
      g.computeVertexNormals();
      const m = add(g);
      m.position.set(x, y, z); m.scale.set(a, b, c);
    }
    if (opts.temple) {
      // A lotus opening on the rocks.
      const petal = new THREE.SphereGeometry(1, 16, 12).scale(0.42, 0.14, 1);
      for (const [r, y, n, tilt] of [[1.1, 4.2, 10, 0.5], [0.72, 4.5, 8, 0.95], [0.34, 4.75, 6, 1.35]]) for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.283 + r;
        const m = add(petal.clone());
        m.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
        m.rotation.set(-tilt, a, 0, 'YXZ');
      }
      add(new THREE.SphereGeometry(0.36, 16, 12), metal).position.set(0, 4.85, 0);
    } else {
      add(lathe([[0.75, 3.9], [0.5, 4.5], [0.34, 7.2], [0.5, 7.5], [0.7, 7.6], [0.7, 7.8], [0, 7.8]], 24));
      add(new THREE.BoxGeometry(0.2, 1.7, 0.2).translate(0, 8.6, 0), metal);
      add(new THREE.BoxGeometry(0.95, 0.2, 0.2).translate(0, 8.9, 0), metal);
      const fig = makeFigure('angel', phone);
      const robe = new THREE.MeshStandardMaterial({ color: 0xdcecf0, roughness: 0.6 });
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * 6.283 + 0.5;
        for (const [g, mat] of [[fig.marble, robe], [fig.paint, robe], [fig.gold, metal]]) {
          const m = add(g, mat);
          m.position.set(Math.sin(a) * 2.5, 2.2, Math.cos(a) * 2.5);
          m.rotation.y = a;
          m.scale.setScalar(0.95);
        }
      }
    }
    curtain(4.1, 1.7, 0.75, 7, 0.14);
    jet([0, 5, 0], [0, 6.4, 0], 80, 4.6, 0.03);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283; jet([Math.cos(a) * 3.3, 1.8, Math.sin(a) * 3.3], [Math.cos(a) * 1.7, 4.4, Math.sin(a) * 1.7], 46); }
    ring(7, 0.85, 26, -1.9, 9.6, 38);
    ring(5.4, 0.8, 12, 0.3, 6.6, 30);
  });
  return {
    update(t, canvasHeight, camera) { time.value = t; scale.value = canvasHeight / (2 * Math.tan((camera.fov * Math.PI) / 360)); },
    setTime(name) {
      const g = { sunrise: 0.22, morning: 0, sunset: 0.55, night: 1 }[name] ?? 0;
      glow.value = g;
      for (const f of all) {
        f.body.emissiveIntensity = 0.1 * g;
        for (const s of f.lights) s.material.opacity = 0.95 * g;
        f.halo.material.opacity = 0.2 * g;
      }
    },
  };
}
