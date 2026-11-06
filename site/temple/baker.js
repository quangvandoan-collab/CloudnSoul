// Merges many small shapes into a few big meshes, so phones draw the whole
// pagoda in a few dozen calls instead of thousands.
import * as THREE from '../vendor/three.module.min.js';

const tmpColor = new THREE.Color();

export class Baker {
  constructor() {
    this.buckets = new Map();
  }

  // color may be a hex number, or a function (x, y, z) => hex for painted gradients.
  add(geometry, material, matrix, color = 0xffffff) {
    const g = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    if (matrix) g.applyMatrix4(matrix);
    if (!g.attributes.normal) g.computeVertexNormals();
    const n = g.attributes.position.count;
    const pos = g.attributes.position.array;
    const colors = new Float32Array(n * 3);
    if (typeof color === 'function') {
      for (let i = 0; i < n; i++) {
        tmpColor.set(color(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
        colors.set([tmpColor.r, tmpColor.g, tmpColor.b], i * 3);
      }
    } else {
      tmpColor.set(color);
      for (let i = 0; i < n; i++) colors.set([tmpColor.r, tmpColor.g, tmpColor.b], i * 3);
    }
    let bucket = this.buckets.get(material);
    if (!bucket) {
      bucket = { position: [], normal: [], uv: [], color: [] };
      this.buckets.set(material, bucket);
    }
    bucket.position.push(pos);
    bucket.normal.push(g.attributes.normal.array);
    bucket.uv.push(g.attributes.uv ? g.attributes.uv.array : new Float32Array(n * 2));
    bucket.color.push(colors);
    if (g !== geometry) g.dispose();
  }

  box(w, h, d, x, y, z, material, color, ry = 0) {
    const m = new THREE.Matrix4().compose(
      new THREE.Vector3(x, y, z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)),
      new THREE.Vector3(1, 1, 1)
    );
    this.add(new THREE.BoxGeometry(w, h, d), material, m, color);
  }

  // Bake everything into meshes and add them to the scene.
  build(scene, { cast = [], receive = [] } = {}) {
    const meshes = [];
    for (const [material, b] of this.buckets) {
      const geometry = new THREE.BufferGeometry();
      for (const [name, size] of [['position', 3], ['normal', 3], ['uv', 2], ['color', 3]]) {
        const total = b[name].reduce((sum, a) => sum + a.length, 0);
        const merged = new Float32Array(total);
        let offset = 0;
        for (const a of b[name]) { merged.set(a, offset); offset += a.length; }
        geometry.setAttribute(name, new THREE.BufferAttribute(merged, size));
      }
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = cast.includes(material);
      mesh.receiveShadow = receive.includes(material);
      mesh.matrixAutoUpdate = false;
      scene.add(mesh);
      meshes.push(mesh);
    }
    this.buckets.clear();
    return meshes;
  }
}

export const trs = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz)
  );
