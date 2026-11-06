// Weather a visitor chooses for themselves. It only changes their own view and
// sound, so one person's snow never disturbs anyone else.
import * as THREE from '../vendor/three.module.min.js';

export const WEATHERS = {
  clear: { key: 'weatherClear' },
  summer: { key: 'weatherSummer', sunScale: 1.65, hemiScale: 1.12, sunColor: 0xffdf9c, top: 0x2f83cf, low: 0xffe3a8, fogNear: 120, fogFar: 760, cloudOpacity: 0.4, tint: 0xfff6dd, cloud: 0.6, sway: 0.08 },
  rain: { key: 'weatherRain', sunScale: 0.25, hemiScale: 0.72, top: 0x5a6670, low: 0x9aa6a9, fogNear: 30, fogFar: 300, cloudOpacity: 1, tint: 0x8d969c, cloud: 1.6, sway: 0.3 },
  snow: { key: 'weatherSnow', sunScale: 0.55, hemiScale: 1.05, top: 0x9fb1c2, low: 0xe6ecef, fogNear: 45, fogFar: 340, cloudOpacity: 1, tint: 0xdde4ea, cloud: 0.7, snowCover: 1 },
  wind: { key: 'weatherWind', sunScale: 0.85, hemiScale: 0.98, top: 0x7396ab, low: 0xd8e1dc, fogNear: 90, fogFar: 620, cloudOpacity: 1, tint: 0xf2f4f4, cloud: 5, sway: 1 },
};

export function createWeather(scene, camera, count) {
  const BOX = 44;
  // Rain: thin falling streaks.
  const rainPos = new Float32Array(count * 6);
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0xc9d6dc, transparent: true, opacity: 0.42, depthWrite: false }));
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);
  const drops = Array.from({ length: count }, () => ({ x: (Math.random() - 0.5) * BOX, y: Math.random() * 30, z: (Math.random() - 0.5) * BOX, v: 22 + Math.random() * 9 }));

  // Snow and wind-blown petals share one soft particle system.
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(16, 16, 1, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.6, 'rgba(255,255,255,.75)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  const flakeCount = Math.floor(count * 0.9);
  const flakePos = new Float32Array(flakeCount * 3);
  const flakeGeo = new THREE.BufferGeometry();
  flakeGeo.setAttribute('position', new THREE.BufferAttribute(flakePos, 3));
  const flakeMat = new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 0.2, transparent: true, depthWrite: false, color: 0xffffff });
  const flakes = new THREE.Points(flakeGeo, flakeMat);
  flakes.frustumCulled = false;
  flakes.visible = false;
  scene.add(flakes);
  const motes = Array.from({ length: flakeCount }, () => ({ x: (Math.random() - 0.5) * BOX, y: Math.random() * 24, z: (Math.random() - 0.5) * BOX, p: Math.random() * 6.28, v: 0.8 + Math.random() * 1.1 }));

  const wrap = (v, centre) => {
    const half = BOX / 2;
    let d = v - centre;
    if (d > half) d -= BOX;
    if (d < -half) d += BOX;
    return centre + d;
  };

  let kind = 'clear';
  return {
    set(next) {
      kind = next;
      flakeMat.size = next === 'wind' ? 0.15 : 0.2;
      flakeMat.color.set(next === 'wind' ? 0xf0b7c4 : 0xffffff);
    },
    update(dt, now, indoors, reducedMotion) {
      const showRain = kind === 'rain' && !indoors;
      const showFlakes = (kind === 'snow' || kind === 'wind') && !indoors;
      rain.visible = showRain;
      flakes.visible = showFlakes;
      const cx = camera.position.x;
      const cz = camera.position.z;
      const floor = camera.position.y - 8;
      if (showRain) {
        for (let i = 0; i < count; i++) {
          const d = drops[i];
          if (!reducedMotion) d.y -= d.v * dt;
          if (d.y < floor) d.y = floor + 22 + Math.random() * 8;
          d.x = wrap(d.x, cx);
          d.z = wrap(d.z, cz);
          rainPos.set([d.x, d.y, d.z, d.x + 0.03, d.y + 0.62, d.z + 0.02], i * 6);
        }
        rainGeo.attributes.position.needsUpdate = true;
      }
      if (showFlakes) {
        const windy = kind === 'wind';
        for (let i = 0; i < flakeCount; i++) {
          const m = motes[i];
          if (!reducedMotion) {
            m.y -= (windy ? m.v * 0.5 : m.v) * dt;
            m.x += (windy ? 6.5 + m.v * 3 : Math.sin(now * 0.0007 + m.p) * 0.55) * dt;
            m.z += (windy ? Math.sin(now * 0.001 + m.p) * 1.6 : Math.cos(now * 0.0006 + m.p) * 0.4) * dt;
          }
          if (m.y < 0) m.y = 18 + Math.random() * 8;
          m.x = wrap(m.x, cx);
          m.z = wrap(m.z, cz);
          flakePos.set([m.x, m.y, m.z], i * 3);
        }
        flakeGeo.attributes.position.needsUpdate = true;
      }
    },
  };
}
