// The picture list and large viewer. Tap a picture on the gallery wall to open it here.
const { PICTURES } = window.CHURCH_MEDIA;
const dialog = document.createElement('dialog');
dialog.id = 'picturesDialog';
dialog.className = 'panel wide';
dialog.setAttribute('aria-labelledby', 'picturesTitle');
dialog.innerHTML = `<form method="dialog"><button class="close">Close</button></form>
<h2 id="picturesTitle">Pictures</h2>
<div id="picGrid" class="picGrid"></div>
<div id="picLarge" hidden>
  <img id="picImage" alt="">
  <p id="picName"></p>
  <p id="picCredit" class="fine"></p>
  <div class="row"><button id="picPrev">Previous</button><button id="picNext">Next</button><button id="picAll">All pictures</button><button id="picWall" class="strong">See it on the wall</button></div>
</div>`;
document.body.appendChild(dialog);
const $ = (id) => document.getElementById(id);
let current = 0;
function show(i) {
  current = (i + PICTURES.length) % PICTURES.length;
  const pic = PICTURES[current];
  $('picImage').src = `pictures/${pic.id}.jpg`;
  $('picImage').alt = pic.title;
  $('picName').textContent = pic.title;
  $('picCredit').textContent = pic.credit;
  $('picGrid').hidden = true;
  $('picLarge').hidden = false;
}
function grid() { $('picGrid').hidden = false; $('picLarge').hidden = true; }
PICTURES.forEach((pic, i) => {
  const b = document.createElement('button');
  b.className = 'picThumb';
  const img = document.createElement('img');
  img.loading = 'lazy';
  img.src = `pictures/${pic.id}-small.jpg`;
  img.alt = '';
  const s = document.createElement('span');
  s.textContent = pic.title;
  b.append(img, s);
  b.addEventListener('click', () => show(i));
  $('picGrid').appendChild(b);
});
$('picPrev').addEventListener('click', () => show(current - 1));
$('picNext').addEventListener('click', () => show(current + 1));
$('picAll').addEventListener('click', grid);
$('picWall').addEventListener('click', () => { dialog.close(); window.CHURCH_NAVE.seePicture(current); });
document.querySelectorAll('[data-pictures]').forEach((b) => b.addEventListener('click', () => { grid(); dialog.showModal(); }));
window.addEventListener('picture-tap', (e) => { show(e.detail); if (!dialog.open) dialog.showModal(); });
