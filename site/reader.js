// Bible reader and sing-along hymns. Everything runs in this browser and nothing is sent anywhere.
import { OUTFITS, priestSheet } from './priest.js';

const $ = (id) => document.getElementById(id);
const store = { get(k) { try { return JSON.parse(localStorage.getItem(`church.${k}`)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(`church.${k}`, JSON.stringify(v)); } catch { /* Storage can be blocked. */ } } };

// ---------- Bible ----------
const VERSIONS = {
  dra: { name: 'Douay-Rheims (English, Catholic)', note: 'Douay-Rheims 1899 American Edition. Public domain. Psalms use the older Catholic numbering, usually one lower than the King James from Psalm 10 to 147.' },
  kjv: { name: 'King James (English)', note: 'King James Version. Public domain in Vietnam as far as known. Crown rights apply to it in the United Kingdom.' },
  vie: { name: 'Kinh Thánh 1934 (Tiếng Việt, Tin Lành)', note: 'Vietnamese Bible, Cadman translation, 1934 edition. Public domain. This is a Protestant translation, and Catholic book and name spellings differ.' },
};
const OT = [['GEN', 'Genesis', 'Sáng-thế Ký'], ['EXO', 'Exodus', 'Xuất Ê-díp-tô Ký'], ['LEV', 'Leviticus', 'Lê-vi Ký'], ['NUM', 'Numbers', 'Dân-số Ký'], ['DEU', 'Deuteronomy', 'Phục-truyền Luật-lệ Ký'], ['JOS', 'Joshua', 'Giô-suê'], ['JDG', 'Judges', 'Các Quan Xét'], ['RUT', 'Ruth', 'Ru-tơ'], ['1SA', '1 Samuel', 'I Sa-mu-ên'], ['2SA', '2 Samuel', 'II Sa-mu-ên'], ['1KI', '1 Kings', 'I Các Vua'], ['2KI', '2 Kings', 'II Các Vua'], ['1CH', '1 Chronicles', 'I Sử-ký'], ['2CH', '2 Chronicles', 'II Sử-ký'], ['EZR', 'Ezra', 'E-xơ-ra'], ['NEH', 'Nehemiah', 'Nê-hê-mi'], ['TOB', 'Tobit', ''], ['JDT', 'Judith', ''], ['EST', 'Esther', 'Ê-xơ-tê'], ['1MA', '1 Maccabees', ''], ['2MA', '2 Maccabees', ''], ['JOB', 'Job', 'Gióp'], ['PSA', 'Psalms', 'Thi-thiên'], ['PRO', 'Proverbs', 'Châm-ngôn'], ['ECC', 'Ecclesiastes', 'Truyền-đạo'], ['SNG', 'Song of Songs', 'Nhã-ca'], ['WIS', 'Wisdom', ''], ['SIR', 'Sirach', ''], ['ISA', 'Isaiah', 'Ê-sai'], ['JER', 'Jeremiah', 'Giê-rê-mi'], ['LAM', 'Lamentations', 'Ca-thương'], ['BAR', 'Baruch', ''], ['EZK', 'Ezekiel', 'Ê-xê-chi-ên'], ['DAN', 'Daniel', 'Đa-ni-ên'], ['HOS', 'Hosea', 'Ô-sê'], ['JOL', 'Joel', 'Giô-ên'], ['AMO', 'Amos', 'A-mốt'], ['OBA', 'Obadiah', 'Áp-đia'], ['JON', 'Jonah', 'Giô-na'], ['MIC', 'Micah', 'Mi-chê'], ['NAM', 'Nahum', 'Na-hum'], ['HAB', 'Habakkuk', 'Ha-ba-cúc'], ['ZEP', 'Zephaniah', 'Sô-phô-ni'], ['HAG', 'Haggai', 'A-ghê'], ['ZEC', 'Zechariah', 'Xa-cha-ri'], ['MAL', 'Malachi', 'Ma-la-chi']];
const NT = [['MAT', 'Matthew', 'Ma-thi-ơ'], ['MRK', 'Mark', 'Mác'], ['LUK', 'Luke', 'Lu-ca'], ['JHN', 'John', 'Giăng'], ['ACT', 'Acts', 'Công-vụ các Sứ-đồ'], ['ROM', 'Romans', 'Rô-ma'], ['1CO', '1 Corinthians', 'I Cô-rinh-tô'], ['2CO', '2 Corinthians', 'II Cô-rinh-tô'], ['GAL', 'Galatians', 'Ga-la-ti'], ['EPH', 'Ephesians', 'Ê-phê-sô'], ['PHP', 'Philippians', 'Phi-líp'], ['COL', 'Colossians', 'Cô-lô-se'], ['1TH', '1 Thessalonians', 'I Tê-sa-lô-ni-ca'], ['2TH', '2 Thessalonians', 'II Tê-sa-lô-ni-ca'], ['1TI', '1 Timothy', 'I Ti-mô-thê'], ['2TI', '2 Timothy', 'II Ti-mô-thê'], ['TIT', 'Titus', 'Tít'], ['PHM', 'Philemon', 'Phi-lê-môn'], ['HEB', 'Hebrews', 'Hê-bơ-rơ'], ['JAS', 'James', 'Gia-cơ'], ['1PE', '1 Peter', 'I Phi-e-rơ'], ['2PE', '2 Peter', 'II Phi-e-rơ'], ['1JN', '1 John', 'I Giăng'], ['2JN', '2 John', 'II Giăng'], ['3JN', '3 John', 'III Giăng'], ['JUD', 'Jude', 'Giu-đe'], ['REV', 'Revelation', 'Khải-huyền']];
const bible = { index: null, cache: new Map(), place: store.get('bible') || { v: 'dra', b: 'PSA', c: 22, size: 19 } };
const fill = (sel, items) => { sel.textContent = ''; for (const [value, text] of items) { const o = document.createElement('option'); o.value = value; o.textContent = text; sel.appendChild(o); } };
function renderBooks() {
  const v = bible.place.v; const have = bible.index[v]; const sel = $('bibleBook');
  sel.textContent = '';
  for (const [label, list] of [[v === 'vie' ? 'Cựu Ước' : 'Old Testament', OT], [v === 'vie' ? 'Tân Ước' : 'New Testament', NT]]) {
    const group = document.createElement('optgroup'); group.label = label;
    for (const [id, en, vi] of list) if (have[id]) { const o = document.createElement('option'); o.value = id; o.textContent = v === 'vie' ? vi : en; group.appendChild(o); }
    sel.appendChild(group);
  }
  if (!have[bible.place.b]) { bible.place.b = 'JHN'; bible.place.c = 1; }
  sel.value = bible.place.b;
}
async function renderChapter() {
  const { v, b, c } = bible.place;
  const max = bible.index[v][b];
  fill($('bibleChapter'), Array.from({ length: max }, (_, i) => [i + 1, `${v === 'vie' ? 'Đoạn' : 'Chapter'} ${i + 1}`]));
  $('bibleChapter').value = c;
  $('bibleVersion').value = v;
  $('bibleNote').textContent = VERSIONS[v].note;
  const page = $('biblePage');
  page.style.fontSize = `${bible.place.size}px`;
  page.lang = v === 'vie' ? 'vi' : 'en';
  page.textContent = v === 'vie' ? 'Đang mở...' : 'Opening...';
  store.set('bible', bible.place);
  const key = `${v}/${b}`;
  try {
    if (!bible.cache.has(key)) {
      const r = await fetch(`bible/${key}.json`);
      if (!r.ok) throw new Error(r.status);
      bible.cache.set(key, await r.json());
    }
  } catch { page.textContent = 'This book could not be opened. Check your connection and try again.'; return; }
  if (bible.place.v !== v || bible.place.b !== b || bible.place.c !== c) return;
  page.textContent = '';
  const h = document.createElement('h3');
  const book = [...OT, ...NT].find((x) => x[0] === b);
  h.textContent = `${v === 'vie' ? book[2] : book[1]} ${c}`;
  page.appendChild(h);
  for (const [n, text] of bible.cache.get(key)[c] || []) {
    const p = document.createElement('p');
    const s = document.createElement('sup'); s.textContent = n;
    p.append(s, ` ${text}`);
    page.appendChild(p);
  }
  page.scrollTop = 0;
}
async function openBible() {
  $('bibleDialog').showModal();
  if (!bible.index) {
    try { bible.index = await (await fetch('bible/index.json')).json(); } catch { $('biblePage').textContent = 'The Bible could not be opened. Check your connection and try again.'; return; }
    fill($('bibleVersion'), Object.entries(VERSIONS).map(([k, x]) => [k, x.name]));
  }
  renderBooks();
  renderChapter();
}
$('bibleVersion').addEventListener('change', (e) => {
  const old = bible.place.v; bible.place.v = e.target.value;
  // Psalm numbers differ between versions, so moving between them opens the same number only.
  if (old !== bible.place.v) { renderBooks(); bible.place.c = Math.min(bible.place.c, bible.index[bible.place.v][bible.place.b]); }
  renderChapter();
});
$('bibleBook').addEventListener('change', (e) => { bible.place.b = e.target.value; bible.place.c = 1; renderChapter(); });
$('bibleChapter').addEventListener('change', (e) => { bible.place.c = Number(e.target.value); renderChapter(); });
function turn(by) {
  const all = [...OT, ...NT].map((x) => x[0]).filter((id) => bible.index[bible.place.v][id]);
  let i = all.indexOf(bible.place.b); let c = bible.place.c + by;
  if (c < 1) { i -= 1; if (i < 0) return; c = bible.index[bible.place.v][all[i]]; }
  else if (c > bible.index[bible.place.v][all[i]]) { i += 1; if (i >= all.length) return; c = 1; }
  bible.place.b = all[i]; bible.place.c = c;
  $('bibleBook').value = all[i];
  renderChapter();
}
$('biblePrev').addEventListener('click', () => turn(-1));
$('bibleNext').addEventListener('click', () => turn(1));
$('bibleSmaller').addEventListener('click', () => { bible.place.size = Math.max(14, bible.place.size - 2); renderChapter(); });
$('bibleBigger').addEventListener('click', () => { bible.place.size = Math.min(30, bible.place.size + 2); renderChapter(); });

// ---------- Hymns ----------
const HYMNS = window.CHURCH_HYMNS;
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midi = (n) => { const m = /^([A-G])(#?)(\d)$/.exec(n); return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] ? 1 : 0); };
const CHORD = { C: [48, 52, 55], D: [50, 54, 57], Em: [52, 55, 59], F: [53, 57, 60], G: [43, 55, 59], Am: [45, 57, 60] };
export function parseLyric(line) {
  const out = [];
  for (const word of line.split(' ')) {
    const bits = word.split('-');
    bits.forEach((b, i) => out.push({ text: b, more: i < bits.length - 1, gap: i === bits.length - 1 }));
  }
  return out;
}
function timeline(hymn, verseChoice, tempo) {
  const secs = 60 / (hymn.bpm * tempo);
  const notes = []; const chords = []; const lines = [];
  let t = hymn.beatsPerBar * secs; // One bar of count-in.
  let chord = null;
  const verses = verseChoice === 'all' ? hymn.verses : [hymn.verses[Number(verseChoice)]];
  verses.forEach((verse, vi) => {
    verse.forEach((text, li) => {
      const syl = parseLyric(text);
      const start = t; let s = -1; const marks = [];
      for (const token of hymn.lines[li].split(' ')) {
        const held = token[0] === '~';
        const [n, b, c] = (held ? token.slice(1) : token).split(':');
        if (!held) { s += 1; marks.push(t); }
        const dur = Number(b) * secs;
        notes.push({ t, dur, m: midi(n) });
        if (c && c !== chord) { chord = c; chords.push({ t, c }); }
        t += dur;
      }
      lines.push({ start, end: t, syl, marks, verse: vi });
    });
  });
  chords.forEach((c, i) => { c.end = i + 1 < chords.length ? chords[i + 1].t : t; });
  return { notes, chords, lines, end: t, secs };
}
const player = { ctx: null, master: null, melodyBus: null, timer: 0, raf: 0, playing: false, tl: null, t0: 0, cursor: 0, chordCursor: 0, nodes: new Set() };
function audio() {
  if (player.ctx) return player.ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC();
  player.ctx = ctx;
  player.master = ctx.createGain();
  player.master.gain.value = 0.7;
  player.melodyBus = ctx.createGain();
  const dry = ctx.createGain(); dry.gain.value = 0.7;
  const wet = ctx.createGain(); wet.gain.value = 0.5;
  const verb = ctx.createConvolver();
  const len = ctx.sampleRate * 3.2;
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3; }
  verb.buffer = ir;
  player.master.connect(dry).connect(ctx.destination);
  player.master.connect(verb).connect(wet).connect(ctx.destination);
  player.melodyBus.connect(player.master);
  return ctx;
}
// A soft pipe-organ sound built from a few pure tones.
function pipe(m, at, dur, vol, bus) {
  const ctx = player.ctx;
  const hz = 440 * 2 ** ((m - 69) / 12);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.05);
  g.gain.setValueAtTime(vol, Math.max(at + 0.05, at + dur - 0.07));
  g.gain.linearRampToValueAtTime(0, at + dur);
  g.connect(bus);
  for (const [mul, amt, type] of [[1, 1, 'sine'], [2, 0.42, 'sine'], [3, 0.16, 'sine'], [1, 0.2, 'triangle']]) {
    const o = ctx.createOscillator(); o.type = type; o.frequency.value = hz * mul;
    const a = ctx.createGain(); a.gain.value = amt;
    o.connect(a).connect(g);
    o.start(at); o.stop(at + dur + 0.05);
    player.nodes.add(o); o.onended = () => player.nodes.delete(o);
  }
}
function pump() {
  if (!player.playing) return;
  const { tl, t0, ctx } = player; const now = ctx.currentTime; const ahead = now + 0.4; const shift = Number($('hymnKey').value);
  while (player.cursor < tl.notes.length && t0 + tl.notes[player.cursor].t < ahead) {
    const n = tl.notes[player.cursor++];
    pipe(n.m + shift, t0 + n.t, n.dur * 0.97, 0.2, player.melodyBus);
  }
  while (player.chordCursor < tl.chords.length && t0 + tl.chords[player.chordCursor].t < ahead) {
    const c = tl.chords[player.chordCursor++];
    const d = c.end - c.t;
    const notes = CHORD[c.c];
    pipe(notes[0] - 12 + shift, t0 + c.t, d * 0.98, 0.1, player.master);
    for (const m of notes) pipe(m + shift, t0 + c.t, d * 0.98, 0.075, player.master);
  }
}
let shownLine = null;
function paintLine(i) {
  const { lines } = player.tl; const here = lines[i]; const next = lines[i + 1];
  const row = (host, line) => {
    host.textContent = '';
    if (!line) return [];
    return line.syl.map((s) => {
      const span = document.createElement('span');
      span.textContent = s.text === '_' ? '' : s.text;
      host.appendChild(span);
      if (s.gap) host.append(' ');
      return span;
    });
  };
  player.spans = row($('hymnNow'), here);
  row($('hymnNext'), next);
  $('hymnVerse').textContent = `Verse ${here.verse + 1}`;
}
function tick() {
  if (!player.playing) return;
  const t = player.ctx.currentTime - player.t0;
  const { lines, end } = player.tl;
  $('hymnBar').style.width = `${Math.min(100, (t / end) * 100)}%`;
  if (t >= end + 0.6) { stopHymn(); $('hymnNow').textContent = 'Amen'; $('hymnNext').textContent = ''; return; }
  let i = lines.findIndex((l) => t < l.end);
  if (i < 0) i = lines.length - 1;
  if (t < lines[0].start) {
    const left = Math.ceil((lines[0].start - t) / player.tl.secs);
    $('hymnVerse').textContent = `Starting in ${left}`;
    if (shownLine !== 0) { shownLine = 0; paintLine(0); $('hymnVerse').textContent = `Starting in ${left}`; }
  } else {
    if (shownLine !== i) { shownLine = i; paintLine(i); }
    (player.spans || []).forEach((span, k) => span.classList.toggle('sung', t >= lines[i].marks[k]));
  }
  player.raf = requestAnimationFrame(tick);
}
function stopHymn() {
  player.playing = false;
  clearInterval(player.timer);
  cancelAnimationFrame(player.raf);
  for (const o of player.nodes) { try { o.stop(); } catch { /* Already stopped. */ } }
  player.nodes.clear();
  $('hymnPlay').textContent = 'Play and sing';
  $('hymnPlay').setAttribute('aria-pressed', 'false');
}
async function playHymn() {
  if (player.playing) { stopHymn(); return; }
  window.dispatchEvent(new CustomEvent('hymn-start'));
  const hymn = HYMNS.find((x) => x.id === $('hymnPick').value);
  const ctx = audio();
  await ctx.resume();
  player.tl = timeline(hymn, $('hymnVerses').value, Number($('hymnTempo').value));
  player.cursor = 0; player.chordCursor = 0; player.t0 = ctx.currentTime + 0.15; player.playing = true; shownLine = null;
  player.melodyBus.gain.value = $('hymnGuide').checked ? 1 : 0;
  $('hymnPlay').textContent = 'Stop';
  $('hymnPlay').setAttribute('aria-pressed', 'true');
  pump();
  player.timer = setInterval(pump, 100);
  tick();
}
function renderHymn() {
  const hymn = HYMNS.find((x) => x.id === $('hymnPick').value);
  $('hymnCredit').textContent = `Words: ${hymn.words}. Music: ${hymn.tune}. Public domain.`;
  fill($('hymnVerses'), [['all', hymn.verses.length > 1 ? 'All verses' : 'Whole hymn'], ...(hymn.verses.length > 1 ? hymn.verses.map((_, i) => [i, `Verse ${i + 1}`]) : [])]);
  const text = $('hymnText');
  text.textContent = '';
  hymn.verses.forEach((verse) => {
    const p = document.createElement('p');
    verse.forEach((line, i) => {
      if (i) p.appendChild(document.createElement('br'));
      p.append(parseLyric(line).map((s) => (s.text === '_' ? '' : s.text) + (s.gap ? ' ' : '')).join('').replace(/\s+/g, ' ').trim());
    });
    text.appendChild(p);
  });
  $('hymnNow').textContent = hymn.title;
  $('hymnNext').textContent = 'Press Play and sing to begin.';
  $('hymnVerse').textContent = '';
  $('hymnBar').style.width = '0';
}
fill($('hymnPick'), HYMNS.map((x) => [x.id, x.title]));
$('hymnPick').addEventListener('change', () => { stopHymn(); renderHymn(); });
$('hymnPlay').addEventListener('click', playHymn);
$('hymnGuide').addEventListener('change', (e) => { if (player.melodyBus) player.melodyBus.gain.value = e.target.checked ? 1 : 0; });
$('hymnVolume').addEventListener('input', (e) => { if (player.master) player.master.gain.value = Number(e.target.value); });
$('hymnDialog').addEventListener('close', stopHymn);
renderHymn();

// ---------- Priest outfits ----------
export function setupPriestPanel(priest) {
  const S = window.CHURCH_SCHEDULE;
  let choice = 'auto';
  const box = $('priestList');
  function apply() {
    const auto = S.outfitFor();
    const name = choice === 'auto' ? auto.outfit : choice;
    priest.setOutfit(name);
    $('priestNow').textContent = choice === 'auto' ? `Following the schedule: ${OUTFITS[auto.outfit].label} (${auto.why}).` : `Preview: ${OUTFITS[name].label}. The schedule resumes when you choose Follow the schedule.`;
    box.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.o === choice)));
    window.CHURCH_NAVE?.redraw?.();
  }
  const add = (key, label, note, sheet) => {
    const b = document.createElement('button');
    b.dataset.o = key;
    if (sheet) {
      const c = document.createElement('canvas');
      c.width = 32; c.height = 48;
      c.getContext('2d').drawImage(sheet, 0, 0, 32, 48, 0, 0, 32, 48);
      b.appendChild(c);
    }
    const s = document.createElement('strong'); s.textContent = label;
    const n = document.createElement('small'); n.textContent = note;
    b.append(s, n);
    b.addEventListener('click', () => { choice = key; apply(); });
    box.appendChild(b);
  };
  add('auto', 'Follow the schedule', 'Holidays first, then weekends, then the time of day.');
  for (const [k, o] of Object.entries(OUTFITS)) add(k, o.label, o.note, priestSheet(k));
  apply();
  setInterval(apply, 60000);
}
document.querySelectorAll('[data-panel]').forEach((b) => b.addEventListener('click', () => {
  const p = b.dataset.panel;
  if (p === 'bible') openBible(); else $(`${p}Dialog`).showModal();
}));
window.CHURCH_READER = { player, HYMNS, timeline, openBible };

window.addEventListener('music-start', () => { if (player.playing) stopHymn(); });
