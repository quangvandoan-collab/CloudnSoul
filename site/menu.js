// Puts the page's controls behind one Menu button.
const css = document.createElement('style');
css.textContent = `#menuDialog { border: 1px solid var(--gold); background: #1a1712; color: var(--cream); padding: 16px; width: min(560px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); box-sizing: border-box; }
#menuDialog::backdrop { background: rgba(5,4,3,.6); }
#menuDialog h2 { margin: 0 0 12px; font: 700 25px/1.2 var(--display); color: var(--gold); }
#menuDialog .menuHead { display: flex; justify-content: space-between; align-items: center; width: 100%; min-height: 48px; margin: 0; padding: 0 12px; background: transparent; border: 0; border-top: 1px solid rgba(217,174,92,.28); color: var(--cream); font: 600 16px/1.3 var(--body); text-align: left; touch-action: manipulation; }
#menuDialog .menuHead::after { content: '+'; color: var(--gold); font-size: 22px; font-weight: 400; }
#menuDialog .menuHead[aria-expanded="true"]::after { content: '−'; }
#menuDialog .group.collapsed { display: none !important; }
#menuDialog .group { padding: 2px 8px 12px; }
#menuDialog .menuLeave { display: block; width: 100%; min-height: 48px; margin-top: 12px; background: var(--gold); color: var(--ink); border-color: var(--gold); font-weight: 600; touch-action: manipulation; }
#menuDialog .group { pointer-events: auto; }
#menuDialog .group button { min-height: 42px; touch-action: manipulation; }
#menuDialog .close { float: right; touch-action: manipulation; }
.menuOpen { min-height: 46px; padding-inline: 20px !important; font-weight: 600; pointer-events: auto; touch-action: manipulation !important; }`;
document.head.appendChild(css);
const controls = document.querySelector('.controls');
const site = document.body.dataset.site;
for (const g of [...controls.querySelectorAll('[data-site]')]) if (g.dataset.site !== site) g.remove();
const dialog = document.createElement('dialog');
dialog.id = 'menuDialog';
dialog.setAttribute('aria-labelledby', 'menuTitle');
const close = document.createElement('button');
close.className = 'close';
close.textContent = 'Close';
close.dataset.vi = 'Đóng';
const title = document.createElement('h2');
title.id = 'menuTitle';
title.textContent = 'Menu';
dialog.append(close, title);
// Only the section names show at first. Opening one closes the others.
const heads = [];
function openSection(head) {
  for (const h of heads) {
    const open = h === head && h.getAttribute('aria-expanded') !== 'true';
    h.setAttribute('aria-expanded', String(open));
    h.nextElementSibling.classList.toggle('collapsed', !open);
  }
}
for (const group of [...controls.querySelectorAll('.group:not([data-keep])')]) {
  const h = document.createElement('button');
  h.type = 'button';
  h.className = 'menuHead';
  h.dataset.stay = '';
  h.textContent = group.getAttribute('aria-label');
  if (group.dataset.vi) h.dataset.vi = group.dataset.vi;
  if (group.dataset.where) h.dataset.where = group.dataset.where;
  h.setAttribute('aria-expanded', 'false');
  group.classList.add('collapsed');
  h.addEventListener('click', () => openSection(h));
  heads.push(h);
  dialog.append(h, group);
}
const leave = document.createElement('button');
leave.type = 'button';
leave.className = 'menuLeave';
leave.textContent = site === 'temple' ? 'Leave the temple' : 'Leave the church';
leave.dataset.vi = site === 'temple' ? 'Rời khỏi chùa' : 'Rời khỏi nhà thờ';
leave.dataset.goHome = '';
leave.addEventListener('click', () => { location.reload(); });
dialog.append(leave);
document.body.appendChild(dialog);
const open = document.createElement('button');
open.className = 'menuOpen';
open.id = 'menuOpen';
open.textContent = 'Menu';
open.setAttribute('aria-haspopup', 'dialog');
controls.prepend(open);
open.addEventListener('click', () => { openSection(null); dialog.showModal(); });
dialog.addEventListener('click', (e) => { if (e.target.closest('button') && !e.target.closest('[data-stay]')) dialog.close(); });
