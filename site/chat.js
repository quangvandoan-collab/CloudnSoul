// Chat and other visitors. Chat works only outside the church, so nobody is distracted while praying.
// Public chat reaches everyone outside. Private chat starts only when both agree,
// and each message is encrypted between the two browsers. Nothing is stored anywhere.
// The connection comes from the page host when it offers one. Without it, the page works alone.
import * as THREE from './vendor/three.module.min.js';
import { peopleSheet, rowFor } from './people.js';

const O = window.CHURCH_OPTIONS;
const $ = (id) => document.getElementById(id);
const MAX = 300;
const css = document.createElement('style');
css.textContent = `#chatDialog { position: fixed; inset: auto auto 76px max(12px, env(safe-area-inset-left, 0px)); margin: 0; width: min(350px, calc(100vw - 24px)); height: min(460px, calc(100dvh - 150px)); padding: 12px; box-sizing: border-box; background: #1a1712; color: var(--cream); border: 1px solid var(--gold); z-index: 5; }
#chatDialog[open] { display: flex; flex-direction: column; gap: 8px; }
#chatDialog h2 { margin: 0; font: 700 20px/1.2 var(--display); color: var(--gold); }
.chatHead { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.chatTabs { display: flex; gap: 4px; flex-wrap: wrap; }
.chatTabs button { padding: 5px 9px; font-size: 13px; touch-action: manipulation; }
.chatLog { flex: 1; min-height: 0; overflow-y: auto; font-size: 14px; line-height: 1.4; border: 1px solid var(--line); padding: 8px; background: #0f0d0a; }
.chatLog p { margin: 0 0 6px; overflow-wrap: anywhere; }
.chatLog b { color: var(--gold); font-weight: 600; }
.chatLog .sys { color: var(--muted); font-size: 12px; }
.chatForm { display: flex; gap: 6px; }
.chatForm input { flex: 1; min-width: 0; font: 16px var(--body); background: #0f0d0a; color: var(--cream); border: 1px solid var(--line); padding: 8px; }
.chatRow { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.chatRow button { font-size: 13px; padding: 6px 9px; touch-action: manipulation; }
.chatNote { margin: 0; font-size: 12px; line-height: 1.4; color: var(--muted); }
#chatPeople button { display: block; width: 100%; text-align: left; margin-bottom: 4px; }
.chatBtn { pointer-events: auto; min-height: 46px; touch-action: manipulation; }
.visitorCard { position: fixed; left: 50%; top: 22%; transform: translateX(-50%); background: #1a1712; border: 1px solid var(--gold); color: var(--cream); padding: 12px; z-index: 6; width: min(300px, calc(100vw - 24px)); box-sizing: border-box; }
.visitorCard h3 { margin: 0 0 8px; font: 700 18px/1.2 var(--display); color: var(--gold); overflow-wrap: anywhere; }`;
document.head.appendChild(css);

const outside = () => window.CHURCH_PLACE === 'outside' && !window.CHURCH_QUIET;
const SITE = () => document.body.dataset.site || 'church';
const sameSite = (w) => (w === 'temple') === (SITE() === 'temple');
const Rules = window.CHURCH_RULES;
const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f\u007f​-‏‪-‮⁦-⁩]/g, ' ').trim().slice(0, n);
const store = { get(k) { try { return localStorage.getItem(`church.${k}`); } catch { return null; } }, set(k, v) { try { localStorage.setItem(`church.${k}`, v); } catch { /* Storage can be blocked. */ } } };
const state = {
  room: null, connected: false, canSend: true, name: store.get('name') || '', agreed: store.get('chatAgreed') === '1', allowPrivate: store.get('chatPrivate') !== '0',
  tab: 'all', peers: new Map(), logs: { all: [] }, threads: new Map(), blocked: new Set(), asked: new Map(), unread: 0, quiet: '', inBooth: false, myPeer: null,
};

// ---------- Interface ----------
const dialog = document.createElement('dialog');
dialog.id = 'chatDialog';
dialog.setAttribute('aria-labelledby', 'chatTitle');
document.body.appendChild(dialog);
const pill = document.createElement('button');
pill.id = 'chatBtn';
pill.className = 'chatBtn';
pill.textContent = 'Chat';
document.querySelector('.controls [data-keep]').appendChild(pill);
pill.addEventListener('click', () => { if (dialog.open) dialog.close(); else openChat(); });
function paintPill() { pill.textContent = state.unread ? `Chat (${state.unread})` : 'Chat'; pill.hidden = !outside() || state.off; }
function openChat(tab) {
  if (!outside()) return;
  if (tab) state.tab = tab;
  render();
  if (!dialog.open) dialog.show();
  state.unread = 0; paintPill();
}
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; if (cls) n.className = cls; return n; };
function button(text, fn, cls) { const b = el('button', text, cls); b.type = 'button'; b.addEventListener('click', fn); return b; }
const peerName = (id) => clean(state.peers.get(id)?.presence?.n, 24) || 'A visitor';
function render() {
  dialog.textContent = '';
  const head = el('div', undefined, 'chatHead');
  const title = el('h2', 'Chat'); title.id = 'chatTitle';
  head.append(title, button('Close', () => dialog.close()));
  dialog.append(head);
  if (!state.room) {
    dialog.append(el('p', 'Chat needs other visitors connected. In this view, no connection is available, so you are walking alone.', 'chatNote'));
    return;
  }
  if (!state.agreed) return renderWelcome();
  const tabs = el('div', undefined, 'chatTabs');
  const tabBtn = (id, text) => { const b = button(text, () => { state.tab = id; const t = state.threads.get(id); if (t) t.unread = 0; render(); }); b.setAttribute('aria-pressed', String(state.tab === id)); tabs.append(b); };
  tabBtn('all', 'Everyone');
  tabBtn('people', `Here now (${visitors().length})`);
  for (const [id, t] of state.threads) tabBtn(id, `${peerName(id)}${t.unread ? ` (${t.unread})` : ''}`);
  dialog.append(tabs);
  if (state.tab === 'people') return renderPeople();
  const thread = state.threads.get(state.tab);
  if (state.tab !== 'all' && !thread) state.tab = 'all';
  const log = el('div', undefined, 'chatLog');
  log.setAttribute('role', 'log');
  log.setAttribute('aria-live', 'polite');
  const lines = state.tab === 'all' ? state.logs.all : thread.log;
  for (const m of lines) {
    if (m.sys) { log.append(el('p', m.text, 'sys')); continue; }
    const p = el('p'); p.append(el('b', `${m.who}: `), m.text); log.append(p);
  }
  dialog.append(log);
  if (state.tab === 'all') dialog.append(el('p', `Everyone here can read this. Nothing is saved. You are ${state.name}.`, 'chatNote'));
  else {
    dialog.append(el('p', thread.status === 'open' ? 'Private and encrypted between you two. Nothing is saved.' : thread.status === 'waiting' ? 'Waiting for them to accept.' : thread.status === 'asked' ? 'Only accept if you want to talk with them.' : 'This private chat has ended.', 'chatNote'));
    if (thread.status === 'asked') {
      const row = el('div', undefined, 'chatRow');
      row.append(button('Accept', () => answer(state.tab, true), 'strong'), button('Decline', () => answer(state.tab, false)), button('Block', () => block(state.tab)));
      dialog.append(row);
    } else {
      const row = el('div', undefined, 'chatRow');
      if (thread.status !== 'ended') row.append(button('End private chat', () => endThread(state.tab)));
      row.append(button('Block', () => block(state.tab)));
      dialog.append(row);
    }
  }
  const form = el('form', undefined, 'chatForm');
  const input = document.createElement('input');
  input.id = 'chatInput'; input.maxLength = MAX; input.autocomplete = 'off'; input.setAttribute('aria-label', 'Your message');
  const ready = state.connected && state.canSend && !state.quiet && (state.tab === 'all' || thread.status === 'open');
  input.disabled = !ready;
  input.placeholder = state.quiet || (!state.canSend ? 'Your access lets you read but not send.' : !state.connected ? 'Connecting...' : 'Write a message');
  const send = el('button', 'Send', 'strong'); send.type = 'submit'; send.disabled = !ready;
  form.append(input, send);
  form.addEventListener('submit', (e) => { e.preventDefault(); const v = clean(input.value, MAX); if (v) { input.value = ''; submit(v); } });
  dialog.append(form);
  log.scrollTop = log.scrollHeight;
  if (ready && dialog.open) input.focus({ preventScroll: true });
}
function renderWelcome() {
  dialog.append(el('p', 'Choose the name others will see. Do not use your full name or share your address, phone number or money details.', 'chatNote'));
  dialog.append(el('p', 'Be kind and respectful: this is a place of prayer. Private chat starts only if both people agree, and you can block anyone. Messages are not saved, so they cannot be recovered or reviewed later.', 'chatNote'));
  const form = el('form', undefined, 'chatForm');
  const input = document.createElement('input');
  input.id = 'chatName'; input.maxLength = 24; input.value = state.name; input.placeholder = 'Your name'; input.autocomplete = 'off'; input.setAttribute('aria-label', 'Your name');
  const go = el('button', 'Start chatting', 'strong'); go.type = 'submit';
  form.append(input, go);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = clean(input.value, 24);
    if (!v) { input.focus(); return; }
    state.name = v; state.agreed = true; store.set('name', v); store.set('chatAgreed', '1');
    sendPresence(true); render();
  });
  dialog.append(form);
}
function renderPeople() {
  const box = el('div', undefined, 'chatLog'); box.id = 'chatPeople';
  const list = visitors();
  if (!list.length) box.append(el('p', 'Nobody else is here right now.', 'sys'));
  for (const p of list) box.append(button(`${peerName(p.peer)} (${placeName(p.presence.w)})`, () => showCard(p.peer)));
  dialog.append(box);
  const row = el('label', undefined, 'chatRow');
  const check = document.createElement('input'); check.type = 'checkbox'; check.checked = state.allowPrivate;
  check.addEventListener('change', () => { state.allowPrivate = check.checked; store.set('chatPrivate', check.checked ? '1' : '0'); });
  row.append(check, 'Allow private chat requests');
  dialog.append(row);
}
const PLACE_NAMES = { nave: 'in the church', crypt: 'in the crypt', hall: 'in the refectory', outside: 'outside', temple: 'at the temple' };
const placeName = (w) => PLACE_NAMES[w] || 'somewhere here';
const visitors = () => [...state.peers.values()].filter((p) => !p.isMe && p.kind === 'viewer' && !state.blocked.has(p.peer) && p.presence.w && sameSite(p.presence.w));
let card = null;
window.addEventListener('church-lang', () => { if (dialog.open) render(); });
function closeCard() { if (card) { card.remove(); card = null; } }
function showInsideCard(peer) {
  closeCard();
  card = el('div', undefined, 'visitorCard');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', peerName(peer));
  card.append(el('h3', peerName(peer)), el('p', 'Chat is available outside the church, so that everyone can pray in peace.', 'chatNote'));
  const row = el('div', undefined, 'chatRow');
  row.style.marginTop = '8px';
  row.append(button('Close', closeCard));
  card.append(row);
  document.body.append(card);
}
function showCard(peer) {
  closeCard();
  card = el('div', undefined, 'visitorCard');
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-label', peerName(peer));
  card.append(el('h3', peerName(peer)));
  const row = el('div', undefined, 'chatRow');
  if (state.peers.get(peer)?.presence.k && state.agreed) row.append(button('Chat privately', () => { closeCard(); requestPrivate(peer); }, 'strong'));
  if (!state.agreed) row.append(button('Set up chat first', () => { closeCard(); openChat(); }, 'strong'));
  row.append(button('Block', () => { closeCard(); block(peer); }), button('Close', closeCard));
  card.append(row);
  document.body.append(card);
}
function log(where, entry) {
  const list = where === 'all' ? state.logs.all : state.threads.get(where).log;
  list.push(entry);
  if (list.length > 100) list.shift();
  if (dialog.open && state.tab === where) render();
  else if (!entry.sys) {
    if (where !== 'all') state.threads.get(where).unread += 1;
    state.unread += 1; paintPill();
    if (dialog.open) render();
  }
}

// ---------- Sending ----------
const REFUSED = { link: 'Links are not allowed here.', contact: 'For your safety, phone numbers and emails are not allowed here.', blocked: 'That message was not sent. Please keep chat kind, and never ask for money.', long: 'That message is too long.' };
async function submit(text) {
  const checked = Rules.cleanChat(text);
  if (!checked.ok) { if (REFUSED[checked.reason]) log(state.tab, { sys: true, text: REFUSED[checked.reason] }); return; }
  try {
    if (state.tab === 'all') { await state.room.emit('chat', { t: text, s: SITE() }); return; }
    const t = state.threads.get(state.tab);
    const box = await seal(state.tab, text);
    await state.room.emit('dm', { to: state.tab, iv: box.iv, ct: box.ct });
    log(state.tab, { who: state.name, text });
    showBubble('self', text, true);
    void t;
  } catch (e) { sendFailed(e); }
}
function sendFailed(e) {
  if (e?.code === 'not_permitted') { state.canSend = false; render(); }
}
async function requestPrivate(peer) {
  if (state.blocked.has(peer)) return;
  const known = state.threads.get(peer);
  if (known && known.status !== 'ended') { openChat(peer); return; }
  state.threads.set(peer, { status: 'waiting', log: [{ sys: true, text: `You asked ${peerName(peer)} to chat privately.` }], unread: 0 });
  openChat(peer);
  try { await state.room.emit('dm', { to: peer, a: 'ask' }); } catch (e) { sendFailed(e); }
}
function answer(peer, yes) {
  const t = state.threads.get(peer);
  if (yes) { t.status = 'open'; t.log.push({ sys: true, text: 'You accepted. This chat is private.' }); } else state.threads.delete(peer);
  state.tab = yes ? peer : 'all';
  state.room.emit('dm', { to: peer, a: yes ? 'yes' : 'no' }).catch(sendFailed);
  render();
}
function endThread(peer) {
  const t = state.threads.get(peer);
  if (!t) return;
  t.status = 'ended'; t.log = [{ sys: true, text: 'You ended this chat. Its messages were erased.' }];
  state.room.emit('dm', { to: peer, a: 'end' }).catch(() => {});
  render();
}
function block(peer) {
  state.blocked.add(peer);
  if (state.threads.has(peer)) { state.room.emit('dm', { to: peer, a: 'end' }).catch(() => {}); state.threads.delete(peer); }
  if (state.tab === peer) state.tab = 'all';
  state.logs.all = state.logs.all.filter((m) => m.peer !== peer);
  log('all', { sys: true, text: 'Blocked for this visit. You will not see them or their messages.' });
  render();
}

// ---------- Encryption between two browsers ----------
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
let keys = null; let myKey = null;
const shared = new Map();
async function secretWith(peer) {
  const k = state.peers.get(peer)?.presence.k;
  if (!k || typeof k.x !== 'string' || typeof k.y !== 'string') throw new Error('No key');
  const id = `${peer}:${k.x}`;
  if (!shared.has(id)) {
    const theirs = await crypto.subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: k.x, y: k.y, ext: true }, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    shared.set(id, await crypto.subtle.deriveKey({ name: 'ECDH', public: theirs }, keys.privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']));
  }
  return shared.get(id);
}
const label = (a, b) => new TextEncoder().encode([a, b].sort().join('|'));
async function seal(peer, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: label(state.myPeer, peer) }, await secretWith(peer), new TextEncoder().encode(text));
  return { iv: b64(iv), ct: b64(ct) };
}
async function open_(peer, box) {
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv), additionalData: label(state.myPeer, peer) }, await secretWith(peer), unb64(box.ct));
  return new TextDecoder().decode(plain);
}

// ---------- Hearing ----------
function onChat(m) {
  if (!outside() || state.blocked.has(m.peer) || m.kind !== 'viewer') return;
  const text = clean(m.data?.t, MAX);
  if (!text || (m.data?.s || 'church') !== SITE() || !Rules.cleanChat(text).ok) return;
  log('all', { who: m.sameTab ? state.name : peerName(m.peer), text, peer: m.peer });
  showBubble(m.sameTab ? 'self' : m.peer, text, false);
}
async function onDm(m) {
  if (m.sameTab) state.myPeer = m.peer;
  if (m.isMe || m.data?.to !== state.myPeer || state.blocked.has(m.peer)) return;
  const a = m.data.a; let t = state.threads.get(m.peer);
  if (a === 'ask') {
    if (!outside()) { state.room.emit('dm', { to: m.peer, a: 'inside' }).catch(() => {}); return; }
    if (!state.allowPrivate || !state.agreed) { state.room.emit('dm', { to: m.peer, a: 'no' }).catch(() => {}); return; }
    const last = state.asked.get(m.peer) || 0;
    if (Date.now() - last < 30000 || (t && t.status !== 'ended')) return;
    state.asked.set(m.peer, Date.now());
    state.threads.set(m.peer, { status: 'asked', log: [{ sys: true, text: `${peerName(m.peer)} would like to chat privately.` }], unread: 1 });
    state.unread += 1; paintPill();
    if (dialog.open) render();
    return;
  }
  if (!t) return;
  if (a === 'yes' && t.status === 'waiting') { t.status = 'open'; log(m.peer, { sys: true, text: 'They accepted. This chat is private.' }); render(); return; }
  if (a === 'no' && t.status === 'waiting') { t.status = 'ended'; log(m.peer, { sys: true, text: 'They did not accept.' }); render(); return; }
  if (a === 'inside') { if (t.status === 'waiting') t.status = 'ended'; log(m.peer, { sys: true, text: 'They are inside the church. You can chat when they come back outside.' }); return; }
  if (a === 'end') { t.status = 'ended'; t.log = [{ sys: true, text: 'They ended this chat. Its messages were erased.' }]; if (dialog.open) render(); return; }
  if (t.status !== 'open' || !m.data.iv) return;
  try {
    const text = clean(await open_(m.peer, m.data), MAX);
    if (!Rules.cleanChat(text).ok) return;
    log(m.peer, { who: peerName(m.peer), text });
    if (outside()) showBubble(m.peer, text, true);
  } catch { /* Could not be read: ignore it. */ }
}

// ---------- Presence ----------
const mine = { w: null, p: null, r: 'back', c: 0 };
let lastSent = 0; let lastKey = '';
function sendPresence(force) {
  if (!state.room) return;
  const now = performance.now();
  if (!force && now - lastSent < 160) return;
  if (state.inBooth !== false) {
    const key = `booth${state.inBooth}`;
    if (key !== lastKey) { lastKey = key; state.room.presence({ b: state.inBooth, s: null, w: null, p: null, r: null, n: null, l: null, k: null }).catch(() => {}); }
    return;
  }
  const look = window.CHURCH_ME?.me;
  const shown = window.CHURCH_ME?.shown !== false;
  const patch = { b: null, s: mine.s ? true : null, w: shown ? mine.w : null, p: shown ? mine.p : null, r: mine.r, n: state.agreed ? state.name : null, l: look || null, k: myKey };
  const key = JSON.stringify(patch);
  if (key === lastKey) return;
  lastKey = key; lastSent = now;
  state.room.presence(patch).catch(() => {});
}
function boothsChanged() {
  const busy = [...state.peers.values()].filter((p) => !p.isMe && Number.isInteger(p.presence.b)).map((p) => p.presence.b);
  window.dispatchEvent(new CustomEvent('booth-peers', { detail: busy }));
}

// ---------- Other visitors in the world ----------
const sprites = new Map();
function nameTag(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 48;
  const g = c.getContext('2d');
  g.font = '600 26px system-ui, sans-serif';
  const w = Math.min(248, g.measureText(text).width + 22);
  g.fillStyle = 'rgba(18,14,10,.82)'; g.fillRect((256 - w) / 2, 4, w, 40);
  g.fillStyle = '#f0d58f'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 25, 236);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  s.scale.set(1.9, 0.36, 1); s.position.set(0, 2.15, 0);
  return s;
}
function makeSprite(peer) {
  const blank = document.createElement('canvas'); blank.width = 320; blank.height = 192;
  const tex = new THREE.CanvasTexture(blank);
  tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.repeat.set(1 / 10, 1 / 4);
  const body = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, alphaTest: 0.5 }));
  body.scale.set(1.25, 1.88, 1); body.center.set(0.5, 2 / 48); body.userData.visitor = peer; body.renderOrder = 2;
  const group = new THREE.Group(); group.add(body);
  const entry = { group, body, tex, lookKey: '', name: '', tag: null, x: 0, y: 0, z: 0, seen: false, face: [0, -1], bubbleUntil: 0, bubble: null };
  sprites.set(peer, entry);
  return entry;
}
function drop(peer) {
  const e = sprites.get(peer);
  if (!e) return;
  e.group.removeFromParent();
  e.tex.dispose(); e.body.material.dispose();
  sprites.delete(peer);
}
// A comic speech bubble above someone's head. Private ones are tinted and appear only on the two screens.
const self = { group: new THREE.Group(), bubble: null, bubbleUntil: 0 };
function wrap(g, text, width, maxLines) {
  const lines = []; let line = '';
  const words = text.split(/\s+/);
  for (let w of words) {
    while (g.measureText(w).width > width) {
      let cut = w.length - 1;
      while (cut > 1 && g.measureText(w.slice(0, cut)).width > width) cut -= 1;
      if (line) { lines.push(line); line = ''; }
      lines.push(w.slice(0, cut));
      w = w.slice(cut);
    }
    const next = line ? `${line} ${w}` : w;
    if (g.measureText(next).width > width) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -1)}...`; }
  return lines;
}
function bubbleSprite(text, isPrivate) {
  const c = document.createElement('canvas');
  const g = c.getContext('2d');
  const font = '500 34px system-ui, -apple-system, "Segoe UI", sans-serif';
  g.font = font;
  const lines = wrap(g, text, 440, 4);
  const textW = Math.max(...lines.map((l) => g.measureText(l).width));
  const W = Math.max(150, Math.ceil(textW) + 72); const lineH = 44; const H = lines.length * lineH + 44; const tail = 40;
  c.width = W + 20; c.height = H + tail + 18;
  g.font = font;
  const shape = (ox, oy) => {
    const x = 7 + ox; const y = 7 + oy; const r = 30; const tx = x + W * 0.42;
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + W - r, y); g.quadraticCurveTo(x + W, y, x + W, y + r);
    g.lineTo(x + W, y + H - r); g.quadraticCurveTo(x + W, y + H, x + W - r, y + H);
    g.lineTo(tx + 36, y + H); g.lineTo(tx, y + H + tail); g.lineTo(tx + 2, y + H);
    g.lineTo(x + r, y + H); g.quadraticCurveTo(x, y + H, x, y + H - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  };
  shape(7, 7); g.fillStyle = '#17121c'; g.fill();
  shape(0, 0); g.fillStyle = isPrivate ? '#ffe9a8' : '#ffffff'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#17121c'; g.lineJoin = 'round'; g.stroke();
  g.fillStyle = '#17121c'; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => g.fillText(l, 7 + W / 2, 7 + 22 + lineH * i + lineH / 2));
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
  const k = 0.0054;
  s.scale.set(c.width * k, c.height * k, 1);
  s.center.set(0.45, 0);
  s.renderOrder = 6;
  return s;
}
function clearBubble(e) {
  if (!e.bubble) return;
  e.group.remove(e.bubble); e.bubble.material.map.dispose(); e.bubble.material.dispose(); e.bubble = null;
}
function showBubble(who, text, isPrivate) {
  const e = who === 'self' ? self : sprites.get(who);
  if (!e || !outside()) return;
  clearBubble(e);
  e.bubble = bubbleSprite(text, isPrivate);
  e.bubble.position.set(0, who === 'self' ? 2.05 : 2.45, 0);
  e.group.add(e.bubble);
  e.bubbleUntil = performance.now() + Math.min(14000, 5000 + text.length * 70);
}
function frame(scene, place, camera, dt, now, me, seated = false) {
  if (self.group.parent !== scene) scene.add(self.group);
  self.group.position.set(me.x, me.y, me.z);
  if (self.bubble && now > self.bubbleUntil) clearBubble(self);
  mine.s = seated;
  mine.w = place; mine.p = [Math.round(me.x * 10) / 10, Math.round(me.y * 10) / 10, Math.round(me.z * 10) / 10]; mine.r = me.face.map((v) => Math.round(v * 10) / 10);
  sendPresence(false);
  for (const p of state.peers.values()) {
    if (p.isMe || p.kind !== 'viewer') continue;
    const pos = p.presence.p;
    const here = p.presence.w === place && Array.isArray(pos) && pos.length === 3 && pos.every(Number.isFinite) && !state.blocked.has(p.peer);
    if (!here) { if (sprites.has(p.peer)) drop(p.peer); continue; }
    const e = sprites.get(p.peer) || makeSprite(p.peer);
    if (e.group.parent !== scene) scene.add(e.group);
    const lookKey = JSON.stringify(p.presence.l || {});
    if (lookKey !== e.lookKey) { e.lookKey = lookKey; e.tex.image = peopleSheet(O.lookFrom(O.clean(p.presence.l))); e.tex.needsUpdate = true; }
    const name = clean(p.presence.n, 24) || 'A visitor';
    if (name !== e.name) { e.name = name; if (e.tag) { e.group.remove(e.tag); e.tag.material.map.dispose(); e.tag.material.dispose(); } e.tag = nameTag(name); e.group.add(e.tag); }
    if (!e.seen) { e.x = pos[0]; e.y = pos[1]; e.z = pos[2]; e.seen = true; }
    const k = Math.min(1, dt * 7);
    const moving = Math.hypot(pos[0] - e.x, pos[2] - e.z) > 0.05;
    e.x += (pos[0] - e.x) * k; e.y += (pos[1] - e.y) * k; e.z += (pos[2] - e.z) * k;
    e.group.position.set(e.x, e.y + 0.05, e.z);
    if (Array.isArray(p.presence.r) && p.presence.r.length === 2) e.face = p.presence.r.map(Number);
    const sits = p.presence.s === true && !moving;
    e.body.position.y = sits ? 0.42 : 0;
    if (e.tag) e.tag.visible = outside();
    const col = sits ? 6 : moving ? 2 + (Math.floor(now / 190) % 4) : Math.floor(now / 650) % 2;
    e.tex.offset.set(col / 10, 1 - (rowFor(e.x, e.z, e.face, camera) + 1) / 4);
    if (e.bubble && (now > e.bubbleUntil || !outside())) clearBubble(e);
  }
  for (const id of [...sprites.keys()]) if (!state.peers.has(id)) drop(id);
}

// ---------- Connecting ----------
async function connect() {
  for (let i = 0; i < 25 && !window.claude?.use; i++) await new Promise((r) => { setTimeout(r, 200); });
  // Where there is no live room (for example on a plain web host), chat is simply not offered.
  const room = window.claude?.use ? await window.claude.use('room').catch(() => null) : null;
  if (!room) { state.off = true; paintPill(); return; }
  state.room = room;
  try {
    keys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
    const jwk = await crypto.subtle.exportKey('jwk', keys.publicKey);
    myKey = { x: jwk.x, y: jwk.y };
  } catch { myKey = null; }
  room.on('chat', onChat);
  room.on('dm', onDm);
  room.onConnection((on) => { state.connected = on; if (dialog.open) render(); });
  room.onPeers((c) => {
    state.peers = new Map(c.peers.map((p) => [p.peer, p]));
    const me = c.peers.find((p) => p.sameTab);
    if (me) state.myPeer = me.peer;
    for (const l of c.left) { const t = state.threads.get(l.peer); if (t && t.status !== 'ended') { t.status = 'ended'; t.log = [{ sys: true, text: `${clean(l.presence?.n, 24) || 'They'} left. The chat was erased.` }]; } }
    boothsChanged();
    if (dialog.open && (c.joined.length || c.left.length) && state.tab === 'people') render();
    else if (c.left.length && dialog.open) render();
  });
  sendPresence(true);
  window.dispatchEvent(new CustomEvent('room-ready'));
  if (dialog.open) render();
}
window.addEventListener('my-look', () => { lastKey = ''; });
window.CHURCH_SAME_PLACE = (peer) => state.peers.get(peer)?.presence.w === 'temple';
window.CHURCH_CHAT = {
  frame,
  targets() { return [...sprites.values()].map((e) => e.body); },
  tap(peer) { if (outside()) showCard(peer); else showInsideCard(peer); },
  open: openChat,
  seated() { return [...state.peers.values()].filter((p) => !p.isMe && p.presence.s === true && Array.isArray(p.presence.p)).map((p) => [p.presence.p[0], p.presence.p[2]]); },
  sameSite,
  placeChanged() {
    if (!outside()) {
      if (dialog.open) dialog.close();
      closeCard();
      clearBubble(self);
      for (const [id, t] of state.threads) if (t.status === 'open' && state.room) state.room.emit('dm', { to: id, a: 'inside' }).catch(() => {});
    }
    paintPill();
  },
  enterBooth(i) { state.inBooth = i; closeCard(); sendPresence(true); },
  leaveBooth() { state.inBooth = false; lastKey = ''; sendPresence(true); },
  get state() { return state; },
};
state.inBooth = false;
paintPill();
connect();
