// Background music. One track plays at a time and nothing starts by itself.
const { TRACKS } = window.CHURCH_MEDIA;
const audio = new Audio();
audio.preload = 'none';
const dialog = document.createElement('dialog');
dialog.id = 'musicDialog';
dialog.className = 'panel';
dialog.setAttribute('aria-labelledby', 'musicTitle');
dialog.innerHTML = `<form method="dialog"><button class="close">Close</button></form>
<h2 id="musicTitle">Music</h2>
<p class="fine" id="musicNow" role="status">Choose a track. Music keeps playing while you walk around.</p>
<div class="row"><button id="musicToggle" class="strong" disabled>Play</button><button id="musicNext">Next track</button>
<label class="vol">Volume <input id="musicVol" type="range" min="0" max="1" step="0.05" value="0.7"></label></div>
<div id="musicList" class="trackList"></div>`;
document.body.appendChild(dialog);
const $ = (id) => document.getElementById(id);
audio.volume = 0.7;
let current = -1;
const pill = document.createElement('button');
pill.id = 'musicPill';
pill.className = 'musicPill';
pill.hidden = true;
pill.textContent = 'Pause music';
document.querySelector('.controls').appendChild(pill);
const buttons = [];
let mood = '';
TRACKS.forEach((t, i) => {
  if (t.mood !== mood) { mood = t.mood; const h = document.createElement('h3'); h.textContent = mood; $('musicList').appendChild(h); }
  const b = document.createElement('button');
  b.className = 'track';
  const name = document.createElement('strong'); name.textContent = t.title;
  const by = document.createElement('small'); by.textContent = `${t.artist}, about ${Math.max(1, Math.round(t.minutes))} min`;
  b.append(name, by);
  b.addEventListener('click', () => (current === i && !audio.paused ? audio.pause() : play(i)));
  buttons.push(b);
  $('musicList').appendChild(b);
});
function paint() {
  const on = !audio.paused;
  buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(i === current && on)));
  $('musicToggle').disabled = current < 0;
  $('musicToggle').textContent = on ? 'Pause' : 'Play';
  pill.hidden = !on;
  if (current >= 0) $('musicNow').textContent = `${on ? 'Playing' : 'Paused'}: ${TRACKS[current].title}. ${TRACKS[current].artist}.`;
}
function play(i) {
  if (i !== current) { current = i; audio.src = `audio/${TRACKS[i].id}.mp3`; }
  window.dispatchEvent(new CustomEvent('music-start'));
  audio.play().catch(() => { $('musicNow').textContent = 'This track could not play. Check your connection and try again.'; });
}
for (const ev of ['play', 'pause', 'ended']) audio.addEventListener(ev, paint);
audio.addEventListener('ended', () => play((current + 1) % TRACKS.length));
audio.addEventListener('error', () => { if (current >= 0) $('musicNow').textContent = 'This track could not load. Choose another.'; });
$('musicToggle').addEventListener('click', () => (audio.paused ? play(current) : audio.pause()));
$('musicNext').addEventListener('click', () => play((current + 1) % TRACKS.length));
$('musicVol').addEventListener('input', (e) => { audio.volume = Number(e.target.value); });
pill.addEventListener('click', () => audio.pause());
window.addEventListener('hymn-start', () => audio.pause());
document.querySelectorAll('[data-music]').forEach((b) => b.addEventListener('click', () => dialog.showModal()));
paint();
window.CHURCH_MUSIC = { audio, play };
