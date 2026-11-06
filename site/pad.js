// The small Move button, its arrow pad, and the arrow keys.
const moves = new Set();
window.CHURCH_MOVES = moves;
const controls = document.querySelector('.controls');
const css = document.createElement('style');
css.textContent = `.moveWrap { position: absolute; right: max(16px, env(safe-area-inset-right, 0px)); bottom: 14px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; pointer-events: none; }
.moveBtn { pointer-events: auto; min-height: 46px; padding-inline: 16px; touch-action: manipulation; }
.pad { pointer-events: auto; background: var(--panel); border: 1px solid var(--line); padding: 8px; width: 186px; box-sizing: border-box; }
.padKeys { display: grid; grid-template-columns: repeat(3, 50px); grid-auto-rows: 44px; gap: 4px; justify-content: center; }
.padKeys button { padding: 0; font-size: 19px; touch-action: none; user-select: none; -webkit-user-select: none; }
.pad p { margin: 8px 0 0; font-size: 12px; line-height: 1.4; color: var(--muted); }`;
document.head.appendChild(css);
const wrap = document.createElement('div');
wrap.className = 'moveWrap';
wrap.innerHTML = `<div class="pad" id="movePad"><div class="padKeys">
<span></span><button data-move="w" aria-label="Walk forward">▲</button><span></span>
<button data-move="a" aria-label="Walk left">◀</button><button data-move="s" aria-label="Walk back">▼</button><button data-move="d" aria-label="Walk right">▶</button></div>
<p data-vi="Bấm xuống nền để đi đến đó, hoặc dùng các mũi tên. Kéo để xoay máy quay quanh nhân vật. Cuộn để phóng to.">Click the floor to walk there, or use the arrows. Drag to turn the camera around your character. Scroll to zoom.</p></div>
<button class="moveBtn" id="moveBtn" aria-expanded="true" aria-controls="movePad" data-vi="Di chuyển">Move</button>`;
controls.parentElement.appendChild(wrap);
const pad = document.getElementById('movePad');
const btn = document.getElementById('moveBtn');
function showPad(on) { pad.hidden = !on; btn.setAttribute('aria-expanded', String(on)); try { localStorage.setItem('church.pad', on ? '1' : '0'); } catch { /* Storage can be blocked. */ } }
let saved = null;
try { saved = localStorage.getItem('church.pad'); } catch { /* Storage can be blocked. */ }
showPad(saved === null ? !matchMedia('(max-width: 560px)').matches : saved === '1');
btn.addEventListener('click', () => showPad(pad.hidden));
wrap.querySelectorAll('[data-move]').forEach((b) => {
  b.addEventListener('pointerdown', (e) => { e.preventDefault(); moves.add(b.dataset.move); b.setPointerCapture(e.pointerId); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, () => moves.delete(b.dataset.move));
});
const KEY = { arrowup: 'w', arrowdown: 's', arrowleft: 'a', arrowright: 'd', w: 'w', a: 'a', s: 's', d: 'd' };
const typing = (t) => t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
addEventListener('keydown', (e) => {
  const k = KEY[e.key.toLowerCase()];
  if (!k || typing(e.target) || document.querySelector('dialog[open]:modal')) return;
  e.preventDefault();
  moves.add(k);
});
addEventListener('keyup', (e) => { const k = KEY[e.key.toLowerCase()]; if (k) moves.delete(k); });
addEventListener('blur', () => moves.clear());
