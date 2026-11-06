// Incense sticks, smoke and furnace flames. Nothing here is stored or bought.
import * as THREE from '../vendor/three.module.min.js';

function soft(colorStops) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 1, 32, 32, 31);
  colorStops.forEach(([at, col]) => r.addColorStop(at, col));
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const seed = (i) => (Math.sin(i * 12.9898) * 43758.5453) % 1;

export function createOfferings(group, spots, reduced) {
  const smokeTex = soft([[0, 'rgba(245,245,240,.95)'], [0.5, 'rgba(240,240,235,.35)'], [1, 'rgba(235,235,230,0)']]);
  const fireTex = soft([[0, 'rgba(255,240,170,1)'], [0.35, 'rgba(255,150,50,.85)'], [1, 'rgba(220,40,10,0)']]);
  const urns = spots.incense.map((o, i) => {
    const smoke = [];
    for (let k = 0; k < 16; k++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 }));
      group.add(s);
      smoke.push(s);
    }
    return { o, i, top: o.y + 1.72, smoke, burning: [], base: 3 };
  });
  const MAX = 30;
  const stickGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.85, 5); stickGeo.translate(0, 0.42, 0);
  const sticks = new THREE.InstancedMesh(stickGeo, new THREE.MeshLambertMaterial({ color: 0xa8341f }), MAX * urns.length);
  const tips = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff6a2a, toneMapped: false }), MAX * urns.length);
  sticks.frustumCulled = tips.frustumCulled = false;
  group.add(sticks, tips);
  const m4 = new THREE.Matrix4(); const q = new THREE.Quaternion(); const e = new THREE.Euler();
  function layoutSticks() {
    let n = 0;
    for (const u of urns) {
      const count = Math.min(MAX, u.base + u.burning.length);
      for (let k = 0; k < count; k++) {
        const a = k * 2.4; const r = 0.1 + 0.075 * Math.sqrt(k);
        const x = u.o.x + Math.cos(a) * r; const z = u.o.z + Math.sin(a) * r;
        e.set(Math.sin(a) * 0.06, 0, Math.cos(a) * 0.06);
        q.setFromEuler(e);
        m4.compose(new THREE.Vector3(x, u.top, z), q, new THREE.Vector3(1, 1, 1));
        sticks.setMatrixAt(n, m4);
        m4.makeTranslation(x + Math.cos(a) * 0.05 * 0.85, u.top + 0.85, z);
        tips.setMatrixAt(n, m4);
        n += 1;
      }
    }
    sticks.count = tips.count = n;
    sticks.instanceMatrix.needsUpdate = tips.instanceMatrix.needsUpdate = true;
  }
  layoutSticks();
  const furnaces = spots.votive.map((o) => {
    const flames = [];
    for (let k = 0; k < 14; k++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
      group.add(s);
      flames.push(s);
    }
    const embers = [];
    for (let k = 0; k < 12; k++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: fireTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
      s.scale.setScalar(0.07);
      group.add(s);
      embers.push(s);
    }
    const smoke = [];
    for (let k = 0; k < 10; k++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 }));
      group.add(s);
      smoke.push(s);
    }
    return { o, flames, embers, smoke, until: 0 };
  });
  return {
    incense(i, now) {
      const u = urns[i];
      if (!u) return;
      for (let k = 0; k < 3; k++) u.burning.push(now + 180000);
      if (u.burning.length > MAX - u.base) u.burning.splice(0, u.burning.length - (MAX - u.base));
      layoutSticks();
    },
    burn(i, now) { if (furnaces[i]) furnaces[i].until = now + 18000; },
    update(now, px, pz, py) {
      const t = reduced ? 8 : now * 0.001;
      let changed = false;
      for (const u of urns) {
        while (u.burning.length && u.burning[0] < now) { u.burning.shift(); changed = true; }
        if (Math.hypot(u.o.x - px, u.o.z - pz, u.o.y - py) > 140) { for (const s of u.smoke) s.visible = false; continue; }
        const strength = 0.6 + Math.min(1, u.burning.length / 9) * 0.4;
        u.smoke.forEach((s, k) => {
          s.visible = true;
          const life = (t * 0.16 + k / u.smoke.length) % 1;
          const y = u.top + 0.85 + life * 5;
          s.position.set(u.o.x + Math.sin(t * 0.7 + k + life * 5) * (0.08 + life * 0.7), y, u.o.z + Math.cos(t * 0.5 + k * 2 + life * 4) * (0.08 + life * 0.7));
          s.scale.setScalar(0.25 + life * 1.5);
          s.material.opacity = Math.sin(life * Math.PI) * 0.42 * strength;
        });
      }
      if (changed) layoutSticks();
      for (const f of furnaces) {
        const near = Math.hypot(f.o.x - px, f.o.z - pz, f.o.y - py) < 140;
        const on = f.until > now;
        const fx = f.o.x; const fz = f.o.z + 1.28; const fy = f.o.y + 0.62;
        f.flames.forEach((s, k) => {
          s.visible = near;
          if (!near) return;
          const life = (t * (on ? 1.1 : 0.45) + k / f.flames.length + Math.abs(seed(k))) % 1;
          const size = on ? 0.9 : 0.34;
          s.position.set(fx + Math.sin(k * 3.1 + t * 3) * 0.2 * (1 - life), fy + life * (on ? 1.15 : 0.4), fz);
          s.scale.setScalar(size * (1 - life * 0.65));
          s.material.opacity = (1 - life) * (on ? 0.95 : 0.6);
        });
        f.embers.forEach((s, k) => {
          s.visible = near && on;
          if (!s.visible) return;
          const life = (t * 0.28 + k / f.embers.length) % 1;
          s.position.set(f.o.x + Math.sin(k * 5 + life * 4) * (0.2 + life), f.o.y + 3.6 + life * 6, f.o.z + Math.cos(k * 3 + life * 3) * (0.2 + life));
          s.material.opacity = 1 - life;
        });
        f.smoke.forEach((s, k) => {
          s.visible = near;
          if (!near) return;
          const life = (t * 0.13 + k / f.smoke.length) % 1;
          s.position.set(f.o.x + Math.sin(k + life * 4) * (0.1 + life * 0.9), f.o.y + 3.6 + life * 6, f.o.z + Math.cos(k * 2 + life * 3) * (0.1 + life * 0.9));
          s.scale.setScalar(0.5 + life * 2);
          s.material.opacity = Math.sin(life * Math.PI) * (on ? 0.5 : 0.16);
        });
      }
    },
  };
}
