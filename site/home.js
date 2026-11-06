// The homepage: choose the Cloud Temple (Am Mây) or the Church of the Lost Souls (Nhà thờ Tâm Hồn). Only the chosen place is loaded.
const params = new URLSearchParams(location.search);
const TEXT = {
  vi: { lead: 'Hôm nay bạn muốn đến đâu?', temple: 'Am Mây', templeName: 'Ngôi chùa trên đỉnh mây', templeLine: 'Vườn thiền, hồ cá koi, tháp giữa hồ và biển mây dưới chân núi.', church: 'Nhà thờ Tâm Hồn', churchName: 'Ngôi nhà thờ trên núi', churchLine: 'Thánh đường nến, ca đoàn, Kinh Thánh, phòng suy ngẫm riêng tư.', go: 'Vào thăm', note: 'Miễn phí. Không cần tài khoản. Tin nhắn không được lưu.', home: 'Trang chủ', lang: 'Ngôn ngữ', load: 'Đang mở...', walk: 'Kéo để xoay. Bấm xuống nền để đi. Chạm vào người để gặp họ.' },
  en: { lead: 'Where would you like to go today?', temple: 'Cloud Temple', templeName: 'A temple above the clouds', templeLine: 'A Zen garden, koi pond and lake tower on a summit above a sea of cloud.', church: 'Church of the Lost Souls', churchName: 'A church on the mountain', churchLine: 'A candlelit nave, hymns, the Bible and private rooms for reflection.', go: 'Visit', note: 'Free. No account needed. Messages are not stored.', home: 'Home', lang: 'Language', load: 'Opening...', walk: 'Drag to turn. Click the floor to walk. Tap a person to meet them.' },
};
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
let lang = read('church.lang') === 'en' ? 'en' : 'vi';
if (!read('church.lang') && !(navigator.language || 'vi').toLowerCase().startsWith('vi')) lang = 'en';
const $ = (id) => document.getElementById(id);
function applyLang(next) {
  lang = next;
  try { localStorage.setItem('church.lang', next); } catch { /* Storage can be blocked. */ }
  document.documentElement.lang = next;
  const T = TEXT[next];
  document.querySelectorAll('[data-home]').forEach((e) => { e.textContent = T[e.dataset.home]; });
  document.querySelectorAll('[data-pick-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.pickLang === next)));
  document.querySelectorAll('[data-vi]').forEach((b) => {
    if (b.tagName === 'DIV') return;
    if (!b.dataset.en) b.dataset.en = b.textContent;
    b.textContent = next === 'vi' ? b.dataset.vi : b.dataset.en;
  });
  window.dispatchEvent(new CustomEvent('church-lang', { detail: next }));
}
window.CHURCH_SET_LANG = applyLang;
let noteTimer = 0;
window.CHURCH_NOTE = (text) => {
  const n = $('personNote');
  n.textContent = text;
  n.hidden = false;
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => { n.hidden = true; }, 4000);
};
document.querySelectorAll('[data-pick-lang]').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.pickLang)));
async function enter(site) {
  document.body.dataset.site = site;
  $('homeLoading').hidden = false;
  await new Promise((r) => { requestAnimationFrame(() => setTimeout(r, 30)); });
  document.querySelector('.title h1').textContent = TEXT[lang][site === 'temple' ? 'temple' : 'church'];
  $('titleLine').textContent = TEXT[lang].walk;
  await import('./menu.js');
  if (site === 'church') {
    await import('./nave.js');
  } else {
    window.CHURCH_PLACE = 'outside';
    document.body.dataset.place = 'outside';
    $('view').hidden = true;
    $('outsideView').hidden = false;
    await import('./pad.js');
    await import('./facade.js');
    await import('./me.js');
    await import('./chat.js');
    window.CHURCH_FACADE.resize();
    window.CHURCH_CHAT.placeChanged();
    window.CHURCH_FACADE.setTime('morning');
    window.CHURCH_FACADE.walkTo('garden');
  }
  applyLang(lang);
  $('home').hidden = true;
  $('homeLoading').hidden = true;
}
document.querySelectorAll('[data-enter]').forEach((b) => b.addEventListener('click', () => enter(b.dataset.enter)));
document.querySelectorAll('[data-go-home]').forEach((b) => b.addEventListener('click', () => { location.reload(); }));
applyLang(lang);
if (params.get('site')) enter(params.get('site'));
