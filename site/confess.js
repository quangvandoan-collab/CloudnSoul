// The confession booth: a private place to reflect. Words stay in this one text box.
// They are never sent, saved or logged, and leaving the booth erases them.
const $ = (id) => document.getElementById(id);
const TEXT = {
  en: {
    pick: 'Choose a booth', green: 'Green means free. Red means in use.', free: 'Free', busy: 'In use', you: 'You', booth: 'Booth', preview: 'In this preview, other visitors in the booths are simulated.', full: 'All booths are in use. Please wait for a green light.',
    noticeTitle: 'Before you begin',
    notice: ['This booth is a private place to reflect. It is not the Sacrament of Confession. No priest is here, nobody will reply, and it cannot give absolution. To receive the sacrament, please visit a priest in person.', 'Anything you write stays on this screen. It is not sent or saved, and it is erased when you clear it or leave. Keyboard apps may remember what you type, so writing is optional.', 'If you or someone else is in danger, in Vietnam call 113 for police, 115 for an ambulance, or 111 for child protection.'],
    begin: 'Enter the booth', back: 'Not now', inside: 'Inside the booth', prompts: ['What is weighing on you today?', 'Is there anyone you have hurt, or anyone you need to forgive?', 'What would you like to do differently tomorrow?'], label: 'Your private words', placeholder: 'Write here if you wish. Nothing is sent or saved.', clear: 'Clear my words', prayer: 'Show a prayer', leave: 'Leave the booth', cleared: 'Your words have been erased.', prayerText: 'O my God, I am heartily sorry for having offended Thee, and I detest all my sins because of Thy just punishments, but most of all because they offend Thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of Thy grace, to sin no more and to avoid the near occasions of sin. Amen.', prayerName: 'Act of Contrition, traditional prayer', limit: 'This booth closes after 20 minutes so that others can use it.',
  },
  vi: {
    pick: 'Chọn một phòng', green: 'Đèn xanh là còn trống. Đèn đỏ là đang có người.', free: 'Trống', busy: 'Có người', you: 'Bạn', booth: 'Phòng', preview: 'Trong bản xem thử này, những người khác trong phòng chỉ là mô phỏng.', full: 'Các phòng đều có người. Vui lòng chờ đèn xanh.',
    noticeTitle: 'Trước khi bắt đầu',
    notice: ['Đây là nơi riêng tư để suy ngẫm, không phải Bí tích Hòa Giải. Ở đây không có linh mục, không ai trả lời, và không thể ban ơn xá giải. Để lãnh nhận bí tích, xin hãy gặp trực tiếp một linh mục.', 'Những gì bạn viết chỉ nằm trên màn hình này. Nội dung không được gửi đi hay lưu lại, và sẽ bị xóa khi bạn xóa hoặc rời phòng. Ứng dụng bàn phím có thể ghi nhớ chữ bạn gõ, nên bạn không bắt buộc phải viết.', 'Nếu bạn hoặc ai đó đang gặp nguy hiểm, hãy gọi 113 (công an), 115 (cấp cứu) hoặc 111 (bảo vệ trẻ em).'],
    begin: 'Vào phòng', back: 'Để sau', inside: 'Trong phòng', prompts: ['Hôm nay điều gì đang đè nặng trong lòng bạn?', 'Có ai bạn đã làm tổn thương, hoặc cần tha thứ không?', 'Ngày mai bạn muốn làm điều gì khác đi?'], label: 'Những lời riêng của bạn', placeholder: 'Bạn có thể viết ở đây. Không có gì được gửi đi hay lưu lại.', clear: 'Xóa lời của tôi', prayer: 'Xem kinh', leave: 'Rời phòng', cleared: 'Những lời của bạn đã được xóa.', prayerText: 'Lạy Chúa con, Chúa là Đấng trọn tốt trọn lành vô cùng. Chúa đã dựng nên con, và cho Con Chúa ra đời chịu nạn chịu chết vì con, mà con đã cả lòng phản nghịch lỗi nghĩa cùng Chúa, thì con lo buồn đau đớn, cùng chê ghét mọi tội con trên hết mọi sự; con dốc lòng chừa cải, và nhờ ơn Chúa thì con sẽ lánh xa dịp tội cùng làm việc đền tội cho xứng. Amen.', prayerName: 'Kinh Ăn Năn Tội', limit: 'Phòng sẽ đóng sau 20 phút để người khác có thể sử dụng.',
  },
};
let lang = 'en';
try { lang = localStorage.getItem('church.lang') === 'vi' ? 'vi' : 'en'; } catch { /* Storage can be blocked. */ }
const LIMIT_MS = 20 * 60 * 1000;
const booths = window.CHURCH_BOOTHS.createBooths(3);
let chosen = -1; let stage = 'pick'; let timer = 0; let simTimer = 0;
const box = $('confessBody');
const el = (tag, text, cls) => { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; };
function render() {
  const t = TEXT[lang];
  box.textContent = '';
  $('confessDialog').dataset.stage = stage;
  if (stage === 'pick') {
    $('confessTitle').textContent = t.pick;
    box.append(el('p', t.green, 'fine'));
    const row = el('div', '', 'boothRow');
    let any = false;
    booths.state.forEach((who, i) => {
      const b = el('button', '', 'boothPick');
      const dot = el('span', '', `dot ${who ? 'red' : 'green'}`);
      b.append(dot, `${t.booth} ${i + 1}: ${who ? t.busy : t.free}`);
      b.disabled = Boolean(who);
      if (!who) any = true;
      b.addEventListener('click', () => { chosen = i; stage = 'notice'; window.CHURCH_NAVE.focusBooth(i); render(); });
      row.appendChild(b);
    });
    box.appendChild(row);
    if (!any) box.append(el('p', t.full));
    if (!realLights) box.append(el('p', t.preview, 'fine'));
  } else if (stage === 'notice') {
    $('confessTitle').textContent = `${t.booth} ${chosen + 1}: ${t.noticeTitle}`;
    t.notice.forEach((p) => box.append(el('p', p)));
    box.append(el('p', t.limit, 'fine'));
    const row = el('div', '', 'row');
    const go = el('button', t.begin, 'strong');
    go.addEventListener('click', enter);
    const back = el('button', t.back);
    back.addEventListener('click', () => { stage = 'pick'; render(); });
    row.append(go, back);
    box.append(row);
  } else {
    $('confessTitle').textContent = `${t.booth} ${chosen + 1}: ${t.inside}`;
    const list = el('ul', '', 'prompts');
    t.prompts.forEach((p) => list.append(el('li', p)));
    const label = el('label', t.label);
    label.htmlFor = 'confessText';
    const area = document.createElement('textarea');
    area.id = 'confessText';
    area.rows = 3;
    area.maxLength = 4000;
    area.placeholder = t.placeholder;
    area.spellcheck = false;
    for (const [k, v] of [['autocomplete', 'off'], ['autocorrect', 'off'], ['autocapitalize', 'off'], ['data-gramm', 'false'], ['data-lpignore', 'true']]) area.setAttribute(k, v);
    const said = el('p', '', 'fine');
    said.setAttribute('role', 'status');
    const pray = el('p', '', 'prayerText');
    pray.hidden = true;
    const row = el('div', '', 'row');
    const clear = el('button', t.clear);
    clear.addEventListener('click', () => { area.value = ''; said.textContent = t.cleared; });
    const show = el('button', t.prayer);
    show.addEventListener('click', () => { pray.hidden = !pray.hidden; pray.textContent = `${t.prayerText} (${t.prayerName})`; });
    const out = el('button', t.leave, 'strong');
    out.addEventListener('click', () => $('confessDialog').close());
    row.append(clear, show, out);
    box.append(list, label, area, row, said, pray);
  }
}
function enter() {
  if (!booths.enter(chosen)) { stage = 'pick'; render(); return; }
  stage = 'inside';
  window.CHURCH_NAVE.enterBooth(chosen);
  render();
  clearTimeout(timer);
  timer = setTimeout(() => $('confessDialog').close(), LIMIT_MS);
}
function erase() { const area = $('confessText'); if (area) area.value = ''; box.textContent = ''; }
$('confessDialog').addEventListener('close', () => {
  clearTimeout(timer);
  erase();
  if (booths.mine() >= 0) { booths.leave(); window.CHURCH_NAVE.leaveBooth(); }
  stage = 'pick'; chosen = -1;
});
export function openConfession(booth = null) {
  window.CHURCH_NAVE.setView('chapel');
  stage = 'pick';
  if (booth !== null && booths.isFree(booth)) { chosen = booth; stage = 'notice'; window.CHURCH_NAVE.focusBooth(booth); }
  render();
  if (!$('confessDialog').open) $('confessDialog').showModal();
}
booths.onChange((state) => {
  state.forEach((who, i) => window.CHURCH_NAVE.setBoothLight(i, Boolean(who)));
  if ($('confessDialog').open && stage === 'pick') render();
  if ($('confessDialog').open && stage === 'notice' && !booths.isFree(chosen)) { stage = 'pick'; render(); }
});
// Preview only: start with one booth taken, and let simulated visitors come and go.
let realLights = false;
window.addEventListener('room-ready', () => { realLights = true; clearInterval(simTimer); booths.setOthers([]); });
window.addEventListener('booth-peers', (e) => { realLights = true; clearInterval(simTimer); booths.setOthers(e.detail.filter((b) => b >= 0 && b < 3)); });
booths.simulate(0.5);
if (!new URLSearchParams(location.search).has('still')) simTimer = setInterval(() => booths.simulate(Math.random()), 30000);
document.querySelectorAll('[data-confess]').forEach((b) => b.addEventListener('click', () => openConfession()));
window.addEventListener('booth-tap', (e) => { if (!$('confessDialog').open) openConfession(e.detail); });
export function setLang(next) { lang = next; try { localStorage.setItem('church.lang', next); } catch { /* Storage can be blocked. */ } if ($('confessDialog').open) render(); }
document.querySelectorAll('#confessDialog [data-lang]').forEach((b) => b.addEventListener('click', () => { const area = $('confessText'); const kept = area ? area.value : ''; setLang(b.dataset.lang); const next = $('confessText'); if (next) next.value = kept; }));
window.CHURCH_CONFESS = { booths, openConfession, setLang, simTimer };
