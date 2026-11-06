// A slow sea of cloud below the summit, with soft banks drifting past the peaks.
import * as THREE from './vendor/three.module.min.js';
import { skyU, SKY_GLSL } from './scenery.js';

export const SEA_Y = -232;
export function createCloudSea(scene, { phone, rand }) {
  const octaves = phone ? 3 : 5;
  const shared = { uTop: skyU.uTop, uLow: skyU.uLow, uSunDir: skyU.uSunDir, uSunCol: skyU.uSunCol, uGlow: skyU.uGlow, uGlowAmt: skyU.uGlowAmt, uCloud: skyU.uCloud, uCloudCol: skyU.uCloudCol, uSunSize: skyU.uSunSize, uTime: skyU.uTime };
  const layer = (y, cut, feather, scale, speed, solid) => {
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: shared,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `varying vec3 vW; ${SKY_GLSL}
        float cloudNoise(vec2 p){ float a = 0.52, s = 0.0; for (int i = 0; i < ${octaves}; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(11.3, 7.1); a *= 0.5; } return s; }
        void main(){
          vec3 toP = vW - cameraPosition; float dist = length(toP); vec3 view = toP / dist;
          vec2 p = vW.xz * ${scale.toFixed(5)} + vec2(uTime * ${speed.toFixed(4)}, uTime * ${(speed * 0.4).toFixed(4)});
          vec2 warp = vec2(cloudNoise(p * 0.7 + 3.1), cloudNoise(p * 0.7 + 9.7)) - 0.45;
          vec2 q = p + warp * 1.5;
          float n = cloudNoise(q);
          vec2 toSun = normalize(uSunDir.xz + vec2(0.0001)) * 0.07;
          float lit = clamp(0.5 + (n - cloudNoise(q + toSun)) * 9.0, 0.0, 1.0);
          float alpha = ${solid ? '1.0' : `smoothstep(${cut.toFixed(2)}, ${(cut + feather).toFixed(2)}, n)`};
          vec3 shade = mix(uLow, uTop, 0.42) * 0.72;
          vec3 bright = mix(uCloudCol, uSunCol, 0.28);
          vec3 c = mix(shade, bright, lit * 0.62 + smoothstep(0.3, 0.75, n) * 0.38);
          c *= 0.74 + 0.5 * smoothstep(0.26, 0.68, n);
          float az = max(dot(normalize(view.xz), normalize(uSunDir.xz + vec2(0.0001))), 0.0);
          c = mix(c, uGlow, uGlowAmt * pow(az, 2.5) * 0.62);
          c += uSunCol * pow(az, 26.0) * 0.28 * clamp(1.0 - uSunDir.y * 1.5, 0.0, 1.0);
          // Far away, the clouds melt into the sky at the horizon.
          c = mix(c, skyColor(normalize(vec3(view.x, 0.012, view.z))), smoothstep(2200.0, 9000.0, dist));
          gl_FragColor = vec4(c, alpha);
          #include <colorspace_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(24000, 24000).rotateX(-Math.PI / 2), m);
    mesh.position.y = y;
    mesh.frustumCulled = false;
    mesh.renderOrder = solid ? -2 : -1;
    scene.add(mesh);
  };
  layer(SEA_Y - 22, 0, 1, 0.00105, 0.012, true);
  layer(SEA_Y + 26, 0.34, 0.34, 0.00165, 0.016, false);
  // Soft banks that drift around the mountain.
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  for (let i = 0; i < 240; i++) {
    const x = 50 + rand() * 410; const spread = Math.sin(((x - 50) / 410) * Math.PI);
    const y = 150 + (rand() - 0.5) * 90 * spread; const r = (16 + rand() * 46) * (0.45 + spread * 0.7);
    const gr = g.createRadialGradient(x, y, 1, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const banks = [];
  const count = phone ? 26 : 62;
  for (let i = 0; i < count; i++) {
    const near = i < count * 0.45;
    const r = near ? 170 + rand() * 330 : 520 + rand() * 1500;
    const a = rand() * 6.283;
    const w = near ? 90 + rand() * 170 : 260 + rand() * 560;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0.8 }));
    s.scale.set(w, w * 0.34, 1);
    const y = near ? -150 + rand() * 118 : -205 + rand() * 90;
    s.position.set(Math.cos(a) * r, y, Math.sin(a) * r + 90);
    scene.add(s);
    banks.push({ s, r, a, y, speed: (0.004 + rand() * 0.008) * (rand() < 0.5 ? -1 : 1), bob: rand() * 6.28 });
  }
  // Wisps that cross the bridge gorge and the terraces.
  for (const [x, y, z, w] of [[10, -92, 275, 170], [-70, -74, 250, 150], [64, -82, 300, 190], [-92, -60, 160, 120], [92, -46, 86, 120], [-40, -82, 340, 140]]) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, opacity: 0.7 }));
    s.scale.set(w, w * 0.3, 1);
    s.position.set(x, y, z);
    scene.add(s);
    banks.push({ s, drift: x, y, z, w, speed: 0, bob: rand() * 6.28 });
  }
  const tint = new THREE.Color();
  return {
    update(t) {
      for (const b of banks) {
        if (b.speed) {
          const a = b.a + t * b.speed;
          b.s.position.set(Math.cos(a) * b.r, b.y + Math.sin(t * 0.09 + b.bob) * 8, Math.sin(a) * b.r + 90);
        } else {
          b.s.position.x = b.drift + Math.sin(t * 0.05 + b.bob) * 26;
          b.s.position.y = b.y + Math.sin(t * 0.08 + b.bob) * 4;
        }
      }
    },
    setTime(night) {
      tint.copy(skyU.uCloudCol.value).lerp(skyU.uGlow.value, skyU.uGlowAmt.value * 0.45);
      for (const b of banks) { b.s.material.color.copy(tint); b.s.material.opacity = 0.82 - night * 0.45; }
    },
  };
}
