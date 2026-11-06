// Seasons: real flowering species, the ground colour, snow and falling petals.
// Each forest tree belongs to one of six groups. A season says what each group looks like.
import * as THREE from './vendor/three.module.min.js';

const G = 0x4f8a43;
export const SEASONS = {
  spring: {
    label: 'Spring', grass: [1.05, 1.16, 0.84], snow: 0, snowLine: 0, petals: [0xf9c9d8, 0xffe7ee], petalAmount: 1, shape: 0,
    groups: [
      { name: 'Sakura', bloom: 0xf8c4d4, cover: 0.97, leaf: 0x8cab62 },
      { name: 'Peach (hoa đào)', bloom: 0xe65f96, cover: 0.9, leaf: 0x7fa55a },
      { name: 'Orchid tree (hoa ban)', bloom: 0xf5eee4, cover: 0.88, leaf: 0x86ad5c },
      { name: 'Plum (hoa mận)', bloom: 0xf6f7ea, cover: 0.85, leaf: 0x93b566 },
      { name: 'Fresh leaves', bloom: 0x9cc65f, cover: 0, leaf: 0x8fbf5a },
      { name: 'Yoshino cherry', bloom: 0xfbdde6, cover: 0.97, leaf: 0x8cab62 },
    ],
  },
  summer: {
    label: 'Summer', grass: [0.92, 1.05, 0.82], snow: 0, snowLine: 260, petals: [0xe2401e, 0xf28a2a], petalAmount: 0.25, shape: 0,
    groups: [
      { name: 'Flamboyant (phượng vỹ)', bloom: 0xe43c1c, cover: 0.82, leaf: 0x3e7a35 },
      { name: 'Queen’s crape myrtle (bằng lăng)', bloom: 0x9a5cc8, cover: 0.72, leaf: 0x41763a },
      { name: 'Golden shower (muồng hoàng yến)', bloom: 0xf3cd2a, cover: 0.76, leaf: 0x4b8038 },
      { name: 'Deep green', bloom: G, cover: 0, leaf: 0x376f33 },
      { name: 'Deep green', bloom: G, cover: 0, leaf: 0x2f6431 },
      { name: 'Flamboyant (phượng vỹ)', bloom: 0xef5a22, cover: 0.82, leaf: 0x3e7a35 },
    ],
  },
  autumn: {
    label: 'Autumn', grass: [1.22, 1.02, 0.6], snow: 0, snowLine: 100, petals: [0xe0761f, 0xc8321f], petalAmount: 0.65, shape: 1,
    groups: [
      { name: 'Red maple', bloom: 0xc9311f, cover: 1, leaf: 0xc9311f },
      { name: 'Ginkgo', bloom: 0xeab81f, cover: 1, leaf: 0xeab81f },
      { name: 'Sweetgum (sau sau)', bloom: 0xdd7420, cover: 1, leaf: 0xb3471e },
      { name: 'Milk tree (hoa sữa)', bloom: 0xe7e4c2, cover: 0.34, leaf: 0x4b6b38 },
      { name: 'Turning leaves', bloom: 0xa68f33, cover: 0.55, leaf: 0x6d7d3a },
      { name: 'Crimson maple', bloom: 0x9d1f2b, cover: 1, leaf: 0x9d1f2b },
    ],
  },
  winter: {
    label: 'Winter', grass: [0.82, 0.84, 0.76], snow: 0.82, snowLine: -360, petals: [0xffffff, 0xeaf2ff], petalAmount: 0.85, shape: 2,
    groups: [
      { name: 'Bare branches', bare: 1, bloom: 0x4f4239, cover: 0, leaf: 0x4f4239 },
      { name: 'Bare branches', bare: 1, bloom: 0x5a4c41, cover: 0, leaf: 0x5a4c41 },
      { name: 'Himalayan cherry (mai anh đào)', bloom: 0xf08db0, cover: 0.9, leaf: 0x5a4c41, bare: 0.25 },
      { name: 'Bare branches', bare: 1, bloom: 0x483b34, cover: 0, leaf: 0x483b34 },
      { name: 'Evergreen', bloom: 0x35513a, cover: 0, leaf: 0x35513a },
      { name: 'Camellia (trà my)', bloom: 0xc8374a, cover: 0.24, leaf: 0x35513a },
    ],
  },
};
// Season start dates follow the traditional Vietnamese calendar: lập xuân, lập hạ, lập thu and lập đông.
export function seasonOnDate(date = new Date(Date.now() + 7 * 3600 * 1000)) {
  const v = (date.getUTCMonth() + 1) * 100 + date.getUTCDate();
  if (v >= 204 && v < 506) return 'spring';
  if (v >= 506 && v < 808) return 'summer';
  if (v >= 808 && v < 1107) return 'autumn';
  return 'winter';
}
export const seasonU = {
  uSeasonSnow: { value: 0 }, uGrass: { value: new THREE.Vector3(1, 1, 1) },
  uLeaf: { value: Array.from({ length: 6 }, () => new THREE.Color()) }, uBloom: { value: Array.from({ length: 6 }, () => new THREE.Color()) },
  uCover: { value: new Float32Array(6) }, uBare: { value: new Float32Array(6) },
};
export function addSnow(material, extraKey = 'snow') {
  const prior = material.onBeforeCompile;
  material.onBeforeCompile = (shader, r) => {
    if (prior) prior(shader, r);
    shader.uniforms.uSeasonSnow = seasonU.uSeasonSnow;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying float vSnowN;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvSnowN = normal.y;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSeasonSnow;\nvarying float vSnowN;')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.93, 0.97), uSeasonSnow * smoothstep(0.35, 0.75, vSnowN));');
  };
  material.customProgramCacheKey = () => extraKey;
}

export function createSeasonForest(scene, phone, rand, TRS, spots) {
  const crown = new THREE.IcosahedronGeometry(1, phone ? 0 : 1).toNonIndexed();
  const p = crown.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i); const y = p.getY(i); const z = p.getZ(i);
    const k = 1 + Math.sin(x * 3.4 + y * 2.1) * 0.13 + Math.cos(z * 3.1 - y * 2.7) * 0.11;
    p.setXYZ(i, x * k, y * k * 0.86, z * k);
  }
  crown.computeVertexNormals();
  crown.translate(0, 1.1, 0);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.92 });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uSeasonSnow: seasonU.uSeasonSnow, uLeaf: seasonU.uLeaf, uBloom: seasonU.uBloom, uCover: seasonU.uCover, uBare: seasonU.uBare });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aGroup;\nattribute float aTone;\nvarying vec3 vTreeP;\nvarying float vTreeUp;\nvarying float vGroup;\nvarying float vTone;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvTreeP = (instanceMatrix * vec4(position, 1.0)).xyz;\nvTreeUp = normal.y;\nvGroup = aGroup;\nvTone = aTone;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uLeaf[6]; uniform vec3 uBloom[6]; uniform float uCover[6]; uniform float uBare[6]; uniform float uSeasonSnow;
        varying vec3 vTreeP; varying float vTreeUp; varying float vGroup; varying float vTone;
        float treeH(vec3 p){ return fract(sin(dot(floor(p), vec3(12.9, 78.2, 37.7))) * 43758.5); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        int g = int(vGroup + 0.5);
        float fine = treeH(vTreeP * 1.25);
        float clump = treeH(vTreeP * 0.42);
        if (uBare[g] > 0.0 && fine * 0.6 + clump * 0.4 < uBare[g] * 0.72) discard;
        vec3 tc = mix(uLeaf[g], uBloom[g], step(fine * 0.55 + clump * 0.45, uCover[g]));
        tc *= (0.8 + vTone * 0.32) * (0.88 + clump * 0.24);
        tc = mix(tc, vec3(0.9, 0.93, 0.97), uSeasonSnow * smoothstep(0.45, 0.85, vTreeUp) * 0.8);
        diffuseColor.rgb = tc;`);
  };
  const mesh = new THREE.InstancedMesh(crown, material, spots.length);
  const groups = new Float32Array(spots.length); const tones = new Float32Array(spots.length);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.17, 1, 5, 1, true), new THREE.MeshStandardMaterial({ color: 0x43352b, roughness: 1 }), spots.length);
  spots.forEach(([x, y, z, s, g], i) => {
    mesh.setMatrixAt(i, TRS(x, y, z, rand() * 6.28, 0, 0, s, s * (0.82 + rand() * 0.3), s));
    trunk.setMatrixAt(i, TRS(x, y + s * 0.5, z, 0, 0, 0, s, s * 1.1, s));
    groups[i] = g; tones[i] = rand();
  });
  crown.setAttribute('aGroup', new THREE.InstancedBufferAttribute(groups, 1));
  crown.setAttribute('aTone', new THREE.InstancedBufferAttribute(tones, 1));
  mesh.frustumCulled = false; trunk.frustumCulled = false;
  scene.add(mesh, trunk);
}

export function createPetals(scene, phone) {
  const count = phone ? 420 : 1100;
  const seed = new Float32Array(count * 3); const extra = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    seed.set([Math.random(), Math.random(), Math.random()], i * 3);
    extra.set([Math.random(), Math.random() * 6.28, 0.7 + Math.random() * 0.8], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(seed, 3));
  geo.setAttribute('aExtra', new THREE.BufferAttribute(extra, 3));
  const u = {
    uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uA: { value: new THREE.Color() }, uB: { value: new THREE.Color() }, uAmount: { value: 1 }, uShape: { value: 0 },
    uDim: { value: 1 }, uPx: { value: Math.min(devicePixelRatio || 1, 2) * (innerHeight / 700) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false,
    vertexShader: `attribute vec3 aExtra; uniform float uTime, uAmount, uPx, uShape; uniform vec3 uCenter; varying vec2 vRot; varying float vPick;
      void main(){ vec3 box = vec3(150.0, 70.0, 150.0);
        vec3 p = position * box;
        float speed = uShape > 1.5 ? 2.4 : 1.6;
        p.y -= uTime * speed * aExtra.z;
        p.x += uTime * 1.3 + sin(uTime * 0.7 * aExtra.z + aExtra.y) * 2.6;
        p.z += cos(uTime * 0.5 + aExtra.y * 2.0) * 2.2;
        p = mod(p - uCenter + box * 0.5, box) - box * 0.5 + uCenter;
        vec4 mv = viewMatrix * vec4(p, 1.0);
        float rot = uTime * (0.8 + aExtra.x * 2.0) + aExtra.y;
        vRot = vec2(cos(rot), sin(rot)); vPick = aExtra.x;
        gl_PointSize = step(aExtra.x, uAmount) * clamp(460.0 * uPx * (uShape > 1.5 ? 0.11 : uShape > 0.5 ? 0.22 : 0.16) / -mv.z, 1.5, 34.0);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec2 vRot; varying float vPick; uniform vec3 uA, uB; uniform float uShape, uDim;
      void main(){ vec2 q = gl_PointCoord - 0.5; if (uShape > 1.5) { if (length(q) > 0.5) discard; } else {
          q = mat2(vRot.x, -vRot.y, vRot.y, vRot.x) * q;
          float squash = 0.32 + abs(vRot.x) * 0.3; if (length(q / vec2(squash, 0.5)) > 1.0) discard; }
        gl_FragColor = vec4(mix(uA, uB, vPick) * uDim, 0.95);
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 6;
  scene.add(points);
  return u;
}

export function applySeason(name) {
  const s = SEASONS[name];
  seasonU.uSeasonSnow.value = s.snow;
  seasonU.uGrass.value.set(...s.grass);
  s.groups.forEach((g, i) => {
    seasonU.uLeaf.value[i].set(g.leaf);
    seasonU.uBloom.value[i].set(g.bloom);
    seasonU.uCover.value[i] = g.cover;
    seasonU.uBare.value[i] = g.bare || 0;
  });
  return s;
}
