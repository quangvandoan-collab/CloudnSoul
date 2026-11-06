// The My character panel. Choices stay on this device and are never sent anywhere.
import { peopleSheet } from './people.js';

const O = window.CHURCH_OPTIONS;
const dialog = document.createElement('dialog');
dialog.id = 'meDialog';
dialog.className = 'panel wide';
dialog.setAttribute('aria-labelledby', 'meTitle');
dialog.innerHTML = `<form method="dialog"><button class="close">Close</button></form>
<h2 id="meTitle">My character</h2>
<div class="meGrid">
  <div class="meStage"><canvas id="mePreview" width="32" height="48" role="img" aria-label="Preview of your character"></canvas>
    <div class="row"><button id="meTurn">Turn</button><button id="meRandom">Surprise me</button></div>
    <label class="meShow"><input type="checkbox" id="meShown"> Show me in the church</label>
    <p class="fine">Saved on this device only. Every choice is open to everyone.</p></div>
  <div id="meChoices"></div>
</div>`;
document.body.appendChild(dialog);
const $ = (id) => document.getElementById(id);
const read = () => { try { return JSON.parse(localStorage.getItem('church.me')); } catch { return null; } };
const stored = read() || {};
let me = O.clean(stored);
let shown = stored.shown !== false;
let sheet = null;
let facing = 0;
const save = () => { try { localStorage.setItem('church.me', JSON.stringify({ ...me, shown })); } catch { /* Storage can be blocked. */ } };
function paintPreview() {
  const c = $('mePreview').getContext('2d');
  c.clearRect(0, 0, 32, 48);
  c.imageSmoothingEnabled = false;
  c.drawImage(sheet, 0, facing * 48, 32, 48, 0, 0, 32, 48);
}
function apply() {
  sheet = peopleSheet(O.lookFrom(me));
  paintPreview();
  window.CHURCH_NAVE?.setMyLook?.(sheet, shown);
  window.dispatchEvent(new CustomEvent('my-look', { detail: { sheet, shown } }));
  for (const g of O.GROUPS) for (const b of document.querySelectorAll(`[data-group="${g.key}"]`)) b.setAttribute('aria-pressed', String(b.dataset.value === me[g.key]));
  $('meShown').checked = shown;
  const hasTrousers = me.outfit !== 'dress' && me.outfit !== 'robe';
  document.getElementById('meGroup-bottom').hidden = !hasTrousers;
}
for (const g of O.GROUPS) {
  const box = document.createElement('fieldset');
  box.id = `meGroup-${g.key}`;
  const leg = document.createElement('legend'); leg.textContent = g.label; box.appendChild(leg);
  for (const [value, name] of g.items) {
    const b = document.createElement('button');
    b.dataset.group = g.key; b.dataset.value = value; b.type = 'button';
    if (g.swatch) { b.className = 'swatch'; b.style.background = value; b.setAttribute('aria-label', name); b.title = name; } else b.textContent = name;
    b.addEventListener('click', () => { me = g.key === 'gender' ? O.chooseGender(me, value) : { ...me, [g.key]: value }; save(); apply(); });
    box.appendChild(b);
  }
  $('meChoices').appendChild(box);
}
$('meTurn').addEventListener('click', () => { facing = (facing + 1) % 4; paintPreview(); });
$('meRandom').addEventListener('click', () => { me = O.randomise(Math.random); save(); apply(); });
$('meShown').addEventListener('change', (e) => { shown = e.target.checked; save(); apply(); });
document.querySelectorAll('[data-me]').forEach((b) => b.addEventListener('click', () => dialog.showModal()));
window.addEventListener('me-tap', () => dialog.showModal());
apply();
window.CHURCH_ME = { get me() { return me; }, get sheet() { return sheet; }, get shown() { return shown; } };
