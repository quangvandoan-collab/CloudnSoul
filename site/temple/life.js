// Life at Am Mây: koi, wishes on the pond, the bell, beads, cushions, sound and weather.
// Wishes and food reach others live and are never stored.
import * as THREE from '../vendor/three.module.min.js';
import { buildTemple } from './build.js';
import { createPond } from './koi.js';
import { createLanterns } from './lanterns.js';
import { createOfferings } from './offerings.js';
import { SUTRAS, BOOK_URL } from './sutras.js';
import { createWeather, WEATHERS } from './weather.js';
import { createSound } from './sound.js';
import { i18n, t } from './i18n.js';

const WORLD = window.AM_WORLD;
const Rules = window.CHURCH_RULES;
const DZ = -55; const DY = -1.8;
const $ = (id) => document.getElementById(id);
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
function panel(id, title) {
  const d = el('dialog'); d.id = id; d.className = 'panel';
  const f = el('form'); f.method = 'dialog'; const c = el('button', t('close'), 'close'); f.append(c);
  const h = el('h2', title);
  const body = el('div'); body.id = `${id}Body`;
  d.append(f, h, body);
  document.body.append(d);
  return { d, body, h, c };
}
export function createTempleLife(scene, { camera, shadows, phone, reducedMotion, player, lookouts, onChange, setSky, setWindow }) {
  const group = new THREE.Group();
  group.position.set(0, DY, DZ);
  scene.add(group);
  const built = buildTemple(group, { shadows });
  built.lowGate.position.set(0, -120, 566);
  scene.add(built.lowGate);
  const courtGate = built.lowGate.clone();
  courtGate.position.set(0, -60, 178.5);
  scene.add(courtGate);
  for (const [x, z, y] of lookouts) { const tower = built.farTower.clone(); tower.position.set(x, y, z); tower.scale.setScalar(2.6); scene.add(tower); }
  const pond = createPond(group, reducedMotion);
  const lanterns = createLanterns(group, 40, reducedMotion);
  const offerings = createOfferings(group, WORLD.OFFERINGS, reducedMotion);
  const T = WORLD.TOWER;
  const weather = createWeather(scene, camera, phone ? 450 : 1100);
  const sound = createSound(false);
  const toPlan = (x, z) => [x, z - DZ];
  let room = null;
  // ---------- Quick actions beside the character ----------
  const bar = el('div', undefined, 'templeBar');
  document.querySelector('.stage').append(bar);
  const action = (key, fn) => { const b = el('button', t(key)); b.type = 'button'; b.hidden = true; b.dataset.key = key; b.addEventListener('click', () => { sound.ensure(); fn(); }); bar.append(b); return b; };
  const sitBtn = action('sit', () => sit());
  const standBtn = action('stand', () => stand());
  const palmsBtn = action('palms', () => { pose = pose === 'pray' ? true : 'pray'; onChange(); });
  const feedBtn = action('feed', feed);
  const bellBtn = action('bell', ring);
  const upBtn = action('goUp', () => changeFloor(1));
  const downBtn = action('goDown', () => changeFloor(-1));
  const readBtn = action('read', () => openReader());
  const lookBtn = action('lookOut', () => lookOut());
  const backBtn = action('stepBack', () => leaveWindow());
  const incenseBtn = action('offerIncense', () => useIncense());
  const paperBtn = action('burnPaper', () => usePaper());
  const takeIncenseBtn = action('takeIncense', () => { if (carry.incense >= 9) { window.CHURCH_NOTE?.(t('fullHands')); return; } carry.incense += 3; paintCarry(); window.CHURCH_NOTE?.(t('gotIncense')); });
  const takePaperBtn = action('takePaper', () => { if (carry.paper >= 3) { window.CHURCH_NOTE?.(t('fullHands')); return; } carry.paper += 1; paintCarry(); window.CHURCH_NOTE?.(t('gotPaper')); });
  // What the visitor is carrying lives only in this visit.
  const carry = { incense: 0, paper: 0 };
  function paintCarry() {
    incenseBtn.textContent = carry.incense ? `${t('offerIncense')} (${carry.incense})` : t('offerIncense');
    paperBtn.textContent = carry.paper ? `${t('burnPaper')} (${carry.paper})` : t('burnPaper');
  }
  const planY = () => player.y - DY;
  const nearOne = (list, reach) => { const [px, pz] = toPlan(player.x, player.z); return list.findIndex((o) => Math.hypot(o.x - px, o.z - pz) < reach && Math.abs(o.y - planY()) < 2); };
  function useIncense() {
    const i = nearOne(WORLD.OFFERINGS.incense, 3.6);
    if (i < 0) return;
    if (carry.incense < 3) { window.CHURCH_NOTE?.(t('noIncense')); return; }
    carry.incense -= 3; paintCarry();
    offerings.incense(i, performance.now());
    room?.emit('offer', { kind: 'incense', i }).catch(() => {});
    window.CHURCH_NOTE?.(t('litIncense'));
  }
  function usePaper() {
    const i = nearOne(WORLD.OFFERINGS.votive, 3.8);
    if (i < 0) return;
    if (carry.paper < 1) { window.CHURCH_NOTE?.(t('noPaper')); return; }
    carry.paper -= 1; paintCarry();
    offerings.burn(i, performance.now());
    room?.emit('offer', { kind: 'paper', i }).catch(() => {});
    window.CHURCH_NOTE?.(t('burntPaper'));
  }
  // ---------- Pagoda stairs: a button near the stairs moves you straight to the next floor ----------
  const nearStair = (key, level) => { const [px, pz] = toPlan(player.x, player.z); return T.stairs.find((s) => Math.abs(s[key][2] - planY()) < 0.4 && Math.hypot(s[key][0] - px, s[key][1] - pz) < 3.4 && s.i === level); };
  const levelHere = () => T.levels.findIndex((q) => Math.abs(q.y - planY()) < 0.4);
  function changeFloor(dir) {
    const here = levelHere();
    const s = dir > 0 ? nearStair('from', here) : nearStair('to', here - 1);
    if (!s) return;
    const to = dir > 0 ? s.to : s.from;
    const y = to[2] + DY;
    const Walk = window.CHURCH_WALK;
    for (let r = 0; r <= 4; r += 0.2) for (let a = 0; a < 6.28; a += 0.3) {
      const qx = to[0] + Math.cos(a) * r; const qz = to[1] + DZ + Math.sin(a) * r;
      const f = Walk.standY(player.place, qx, qz, y);
      if (f !== null && Math.abs(f - y) < 0.01) {
        player.go(player.place, qx, qz, f);
        onChange(Math.atan2(qx - T.x, qz - (T.z + DZ)));
        return;
      }
    }
  }
  // ---------- Pagoda windows ----------
  const frame = el('div', undefined, 'windowFrame'); frame.hidden = true;
  document.querySelector('.stage').append(frame);
  let atWindow = null; let windowHere = null; let floorShown = -1;
  function nearWindow() {
    const [px, pz] = toPlan(player.x, player.z);
    let best = null; let bestD = 1.95;
    for (const w of T.windows) {
      if (Math.abs(w.y - planY()) > 0.6) continue;
      const d = Math.hypot(w.x - px, w.z - pz);
      if (d < bestD) { best = w; bestD = d; }
    }
    return best;
  }
  function lookOut() {
    if (!windowHere) return;
    atWindow = windowHere;
    player.target = null;
    frame.hidden = false;
    const [x, y, z] = atWindow.view;
    setWindow({ p: [x, y + DY, z + DZ], yaw: atWindow.a + Math.PI });
  }
  function leaveWindow() {
    if (!atWindow) return;
    atWindow = null;
    frame.hidden = true;
    setWindow(null);
  }
  let seat = null; let pose = false; const taken = new Set();
  function nearestSeat() {
    const [px, pz] = toPlan(player.x, player.z);
    let best = null; let bestD = 1.7;
    for (const s of WORLD.SEATS) { const d = Math.hypot(s.x - px, s.z - pz); if (d < bestD && !taken.has(s.id)) { best = s; bestD = d; } }
    return best;
  }
  function sit() {
    const s = nearestSeat();
    if (!s) return;
    seat = s; pose = true;
    player.target = null;
    player.x = s.x; player.z = s.z + DZ;
    player.face = [-Math.sin(s.yaw), -Math.cos(s.yaw)];
    onChange(s.yaw);
  }
  function stand() { seat = null; pose = false; onChange(); }
  function feed() {
    const [px, pz] = toPlan(player.x, player.z);
    // Aim for the nearest open water.
    let bx = px; let bz = pz;
    for (let r = 1; r < 8; r += 0.5) for (let a = 0; a < 6.28; a += 0.5) { const qx = px + Math.cos(a) * r; const qz = pz + Math.sin(a) * r; if (WORLD.isWater(qx, qz)) { bx = qx; bz = qz; r = 9; break; } }
    if (!WORLD.isWater(bx, bz)) return;
    pond.dropFood(bx, bz);
    sound.ensure();
    room?.emit('feed', { x: bx, z: bz }).catch(() => {});
  }
  function ring() { sound.bell(); room?.emit('bell', {}).catch(() => {}); }
  // ---------- Panels ----------
  const beadP = panel('beadPanel', t('beads'));
  let beadCount = 0;
  const beadBtn = el('button', '', 'beadTap'); beadBtn.type = 'button';
  const beadHelp = el('p', t('beadHelp'), 'fine');
  const paintBeads = () => { beadBtn.textContent = String(beadCount % 108); beadBtn.setAttribute('aria-label', `${t('beadAria')}: ${beadCount % 108}`); };
  beadBtn.addEventListener('click', () => { beadCount += 1; sound.ensure(); sound.bead(); paintBeads(); });
  beadP.body.append(beadBtn, beadHelp); paintBeads();
  const wishP = panel('wishPanel', t('wishTitle'));
  const addLantern = (w) => { lanterns.add(w); };
  function renderWish() {
    wishP.body.textContent = '';
    wishP.body.append(el('p', t('wish1'), 'fine'), el('p', t('wish2'), 'fine'));
    for (const key of WORLD.WISH_PRESETS) {
      const b = el('button', t(`wish_${key}`), 'wishPick'); b.type = 'button';
      b.addEventListener('click', () => sendWish({ preset: key }));
      wishP.body.append(b);
    }
    const form = el('form', undefined, 'chatForm');
    const input = document.createElement('input'); input.maxLength = 120; input.autocomplete = 'off'; input.placeholder = t('wishOwn'); input.setAttribute('aria-label', t('wishOwn'));
    const go = el('button', t('wishSend'), 'strong'); go.type = 'submit';
    form.append(input, go);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const c = Rules.cleanChat(input.value);
      if (!c.ok) { note.textContent = c.reason === 'empty' ? '' : t('wishRefused'); return; }
      sendWish({ text: c.text.slice(0, 120) });
    });
    const note = el('p', '', 'fine'); note.setAttribute('role', 'status');
    wishP.body.append(form, note);
  }
  let lastWish = 0;
  function sendWish(w) {
    const now = performance.now();
    if (now - lastWish < 15000) { window.CHURCH_NOTE?.(t('wishSlow')); wishP.d.close(); return; }
    lastWish = now;
    addLantern(w);
    room?.emit('wish', w).catch(() => {});
    wishP.d.close();
    window.CHURCH_NOTE?.(t('wishFloat'));
  }
  const soundP = panel('soundPanel', t('sound'));
  function renderSound() {
    soundP.body.textContent = '';
    const vol = el('label', undefined, 'vol'); vol.append(`${t('volume')} `);
    const r = document.createElement('input'); r.type = 'range'; r.min = 0; r.max = 1; r.step = 0.05; r.value = 0.8;
    r.addEventListener('input', () => sound.setVolume(Number(r.value)));
    vol.append(r); soundP.body.append(vol);
    const off = el('button', t('soundOff'), 'track'); off.type = 'button';
    off.setAttribute('aria-pressed', String(sound.current === 'off'));
    off.addEventListener('click', () => { sound.ensure(); sound.play('off'); renderSound(); });
    soundP.body.append(off);
    let chantHead = false;
    for (const tr of sound.tracks) {
      if (tr.kind === 'chant' && !chantHead) { chantHead = true; soundP.body.append(el('h3', t('chantsHead'))); }
      const b = el('button', tr.nameKey ? t(tr.nameKey) : i18n.lang === 'en' ? tr.nameEn || tr.name : tr.name, 'track'); b.type = 'button';
      b.setAttribute('aria-pressed', String(sound.current === tr.id));
      b.addEventListener('click', () => { sound.ensure(); sound.play(tr.id); renderSound(); });
      soundP.body.append(b);
    }
  }
  sound.onChange = () => { if (soundP.d.open) renderSound(); };
  const weatherP = panel('weatherPanel', t('weather'));
  let weatherName = 'clear';
  function applyWeather(name) {
    weatherName = name;
    weather.set(name);
    built.snow.value = WEATHERS[name].snowCover || 0;
    built.wind.value = reducedMotion ? 0 : WEATHERS[name].sway || 0;
    setSky(WEATHERS[name]);
    sound.ensure();
    sound.setWeather(name);
  }
  function renderWeather() {
    weatherP.body.textContent = '';
    for (const [name, w] of Object.entries(WEATHERS)) {
      const b = el('button', t(w.key), 'track'); b.type = 'button';
      b.setAttribute('aria-pressed', String(name === weatherName));
      b.addEventListener('click', () => { applyWeather(name); renderWeather(); });
      weatherP.body.append(b);
    }
  }
  const readP = panel('readPanel', t('readTitle'));
  readP.d.classList.add('wide');
  let readingId = null;
  function renderRead() {
    const en = i18n.lang === 'en';
    const lang = en ? 'en' : 'vi';
    readP.body.textContent = '';
    const s = SUTRAS.find((x) => x.id === readingId);
    if (s) {
      readP.h.textContent = s.title[lang];
      const back = el('button', t('readBack'), 'track'); back.type = 'button';
      back.addEventListener('click', () => { readingId = null; renderRead(); readP.d.scrollTop = 0; });
      const box = el('div', undefined, 'sutraText');
      for (const p of s.text[lang]) box.append(el('p', p));
      readP.body.append(back, box, el('p', t('readNote'), 'fine'));
      return;
    }
    readP.h.textContent = t('readTitle');
    for (const x of SUTRAS) {
      const b = el('button', x.title[lang], 'sutraPick'); b.type = 'button';
      b.append(el('small', x.line[lang]));
      b.addEventListener('click', () => { readingId = x.id; renderRead(); readP.d.scrollTop = 0; });
      readP.body.append(b);
    }
    const link = el('a', t('readBook'), 'bookLink'); link.href = BOOK_URL; link.target = '_blank'; link.rel = 'noopener';
    readP.body.append(link, el('p', t('readNote'), 'fine'));
  }
  function openReader() { readingId = null; renderRead(); readP.d.showModal(); }
  const aboutP = panel('aboutPanel', t('aboutTitle'));
  function renderAbout() {
    aboutP.h.textContent = t('aboutTitle');
    aboutP.body.textContent = '';
    for (const k of ['about1', 'about2', 'about3']) aboutP.body.append(el('p', t(k)));
    aboutP.body.append(el('h3', t('dataHead')), el('p', t('about4')));
  }
  const open = { read: () => openReader(), beads: () => beadP.d.showModal(), wish: () => { renderWish(); wishP.d.showModal(); }, sound: () => { renderSound(); soundP.d.showModal(); }, weather: () => { renderWeather(); weatherP.d.showModal(); }, about: () => { renderAbout(); aboutP.d.showModal(); }, fish: () => { sound.ensure(); sound.fish(); } };
  document.querySelectorAll('[data-temple]').forEach((b) => b.addEventListener('click', () => open[b.dataset.temple]()));
  function relabel() {
    for (const b of bar.children) b.textContent = t(b.dataset.key);
    paintCarry();
    beadP.h.textContent = t('beads'); beadHelp.textContent = t('beadHelp');
    wishP.h.textContent = t('wishTitle'); soundP.h.textContent = t('sound'); weatherP.h.textContent = t('weather');
    for (const p of [beadP, wishP, soundP, weatherP, aboutP, readP]) p.c.textContent = t('close');
    if (readP.d.open) renderRead();
  }
  window.addEventListener('church-lang', (e) => { i18n.set(e.detail); relabel(); });
  // ---------- Live connection ----------
  const hook = setInterval(() => {
    const r = window.CHURCH_CHAT?.state.room;
    if (!r) return;
    clearInterval(hook);
    room = r;
    room.on('wish', (m) => {
      if (m.sameTab) return;
      const w = m.data || {};
      if (w.preset && WORLD.WISH_PRESETS.includes(w.preset)) addLantern({ preset: w.preset });
      else if (typeof w.text === 'string' && Rules.cleanChat(w.text).ok) addLantern({ text: w.text.slice(0, 120) });
    });
    room.on('feed', (m) => { if (!m.sameTab && Number.isFinite(m.data?.x) && WORLD.isWater(m.data.x, m.data.z) && window.CHURCH_SAME_PLACE?.(m.peer)) pond.dropFood(m.data.x, m.data.z); });
    room.on('offer', (m) => {
      if (m.sameTab || !Number.isInteger(m.data?.i)) return;
      if (m.data.kind === 'incense') offerings.incense(m.data.i, performance.now());
      else if (m.data.kind === 'paper') offerings.burn(m.data.i, performance.now());
    });
    room.on('bell', (m) => { if (!m.sameTab && window.CHURCH_SAME_PLACE?.(m.peer)) sound.bell(); });
  }, 500);
  setTimeout(() => clearInterval(hook), 15000);
  function inBuilding(x, z) {
    if (Math.hypot(x - T.x, z - T.z) < T.levels[0].r + 0.3) return true;
    return WORLD.PLACES.some((p) => p.building && x > p.building.x0 && x < p.building.x1 && z > p.building.z0 && z < p.building.z1);
  }
  return {
    get seated() { return pose; },
    get walkingAllowed() { return !seat; },
    standIfSeated() { if (seat) stand(); },
    leaveWindow,
    tapFloor(x, z) {
      const [px, pz] = toPlan(x, z);
      const w = lanterns.at(px, pz);
      if (!w) return false;
      window.CHURCH_NOTE?.(w.preset ? t(`wish_${w.preset}`) : w.text);
      return true;
    },
    update(dt, now) {
      pond.update(dt, now);
      lanterns.update(now);
      built.time.value = now * 0.001;
      { const [ox, oz] = toPlan(player.x, player.z); offerings.update(now, ox, oz, player.y - DY); }
      const [px, pz] = toPlan(player.x, player.z);
      const indoors = inBuilding(px, pz);
      weather.update(dt, now, indoors, reducedMotion);
      if (window.CHURCH_QUIET !== indoors) { window.CHURCH_QUIET = indoors; window.CHURCH_CHAT?.placeChanged(); }
      // Light the nearest rooms.
      const near = built.lamps.map((l) => [l, Math.hypot(l.position.x - px, l.position.y - planY(), l.position.z - pz)]).sort((a, b) => a[1] - b[1]).slice(0, 3);
      built.pool.forEach((light, i) => { const n = near[i]; if (n) { light.position.copy(n[0].position); light.intensity = n[0].base; } });
      const onLand = player.y > -3;
      const canSit = !seat && onLand && Boolean(nearestSeat());
      sitBtn.hidden = !canSit;
      standBtn.hidden = !seat;
      palmsBtn.hidden = !seat;
      feedBtn.hidden = seat || !onLand || !WORLD.isWater(px + 2.5, pz) && !WORLD.isWater(px - 2.5, pz) && !WORLD.isWater(px, pz + 2.5) && !WORLD.isWater(px, pz - 2.5);
      // Things that only appear when you come close.
      { const lv = levelHere(); const inTower = Math.hypot(px - T.x, pz - T.z) < T.levels[0].r + 0.5 && lv >= 0; upBtn.hidden = !inTower || atWindow || !nearStair('from', lv); downBtn.hidden = !inTower || atWindow || lv < 1 || !nearStair('to', lv - 1); }
      { const lv1 = T.levels[1]; readBtn.hidden = !seat && !(Math.abs(lv1.y - planY()) < 0.4 && Math.hypot(px - T.x, pz - T.z) < 2.6); }
      windowHere = atWindow ? null : nearWindow();
      lookBtn.hidden = !windowHere;
      backBtn.hidden = !atWindow;
      incenseBtn.hidden = nearOne(WORLD.OFFERINGS.incense, 3.6) < 0 || Boolean(seat);
      paperBtn.hidden = nearOne(WORLD.OFFERINGS.votive, 3.8) < 0 || Boolean(seat);
      { const tb = WORLD.OFFERINGS.table; const atTable = Math.hypot(tb.x - px, tb.z - pz) < 3.6 && Math.abs(tb.y - planY()) < 1.5 && !seat; takeIncenseBtn.hidden = !atTable; takePaperBtn.hidden = !atTable; }
      { const f = T.levels.findIndex((q) => Math.abs(q.y - planY()) < 0.3); const inside = Math.hypot(px - T.x, pz - T.z) < T.levels[0].r; if (inside && f >= 0 && f !== floorShown) { floorShown = f; window.CHURCH_NOTE?.(t(`floor${f}`)); } if (!inside) floorShown = -1; }
      bellBtn.hidden = !WORLD.PLACES.some((p) => p.bell && Math.hypot(p.bell[0] - px, p.bell[1] - pz) < 7);
    },
    setPhase(name) {
      const night = name === 'night';
      for (const p of built.wallpapers) p.color.setScalar(night ? 0.62 : 0.95);
      built.altarSpot.intensity = night ? 46 : 26;
    },
  };
}
