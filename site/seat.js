// The popup that offers a seat when a visitor comes close to the pews.
const W = window.CHURCH_WALK;
const css = document.createElement('style');
css.textContent = `.seatCard { position: absolute; left: 50%; top: 84px; transform: translateX(-50%); width: min(340px, calc(100% - 32px)); box-sizing: border-box; background: #1a1712; border: 1px solid var(--gold); color: var(--cream); padding: 12px; z-index: 3; pointer-events: auto; }
.seatCard h2 { margin: 0 0 8px; font: 700 19px/1.2 var(--display); color: var(--gold); }
.seatCard p { margin: 0 0 8px; font-size: 13px; color: var(--muted); }
.seatRow { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 8px; }
.seatRow label { font-size: 14px; }
.seatRow select { font: 16px var(--body); background: #0f0d0a; color: var(--cream); border: 1px solid var(--line); padding: 6px; }
.seatRow button { min-height: 40px; touch-action: manipulation; }
.seatPrimary { background: var(--gold); color: var(--ink); border-color: var(--gold); font-weight: 600; }
.standBtn { position: absolute; left: 50%; bottom: 76px; transform: translateX(-50%); min-height: 44px; background: var(--gold); color: var(--ink); border-color: var(--gold); font-weight: 600; pointer-events: auto; touch-action: manipulation; }
@media (max-width: 560px) { .seatCard { top: 124px; } }`;
document.head.appendChild(css);
const stage = document.querySelector('.stage');
const card = document.createElement('div');
card.id = 'seatCard';
card.className = 'seatCard';
card.setAttribute('role', 'dialog');
card.setAttribute('aria-labelledby', 'seatTitle');
card.hidden = true;
card.innerHTML = `<h2 id="seatTitle">Would you like to sit down?</h2>
<p id="seatHint"></p>
<div class="seatRow"><label for="seatRowPick">Row</label><select id="seatRowPick"></select></div>
<div class="seatRow"><button type="button" id="seatLeft">Left side</button><button type="button" id="seatRight">Right side</button></div>
<div class="seatRow"><button type="button" id="seatGo" class="seatPrimary">Sit here</button><button type="button" id="seatNo">Not now</button></div>`;
stage.appendChild(card);
const stand = document.createElement('button');
stand.id = 'standBtn';
stand.className = 'standBtn';
stand.textContent = 'Stand up';
stand.hidden = true;
stage.appendChild(stand);
const $ = (id) => document.getElementById(id);
for (let r = 1; r <= W.PEWS.rows; r++) {
  const o = document.createElement('option');
  o.value = r;
  o.textContent = r === 1 ? 'Row 1 (front)' : r === W.PEWS.rows ? `Row ${r} (back)` : `Row ${r}`;
  $('seatRowPick').appendChild(o);
}
let side = -1;
function paintSide() {
  $('seatLeft').setAttribute('aria-pressed', String(side < 0));
  $('seatRight').setAttribute('aria-pressed', String(side > 0));
}
$('seatLeft').addEventListener('click', () => { side = -1; paintSide(); });
$('seatRight').addEventListener('click', () => { side = 1; paintSide(); });
export function createSeatPopup({ onSit, onStand }) {
  let dismissed = false;
  let open = false;
  $('seatGo').addEventListener('click', () => { card.hidden = true; open = false; onSit(side, Number($('seatRowPick').value)); $('seatRowPick').blur(); });
  $('seatNo').addEventListener('click', () => { card.hidden = true; open = false; dismissed = true; });
  stand.addEventListener('click', () => onStand());
  return {
    // Called each frame with the visitor's place. The popup never stops them walking.
    update(player, seated) {
      stand.hidden = !seated;
      const near = !seated && W.nearPews(player.place, player.x, player.z, player.y);
      if (!near) {
        if (open) { card.hidden = true; open = false; }
        if (!seated && !W.nearPews(player.place, player.x, player.z, player.y, 3)) dismissed = false;
        return;
      }
      if (!open && !dismissed) {
        const row = W.rowNear(player.z);
        $('seatRowPick').value = row;
        side = player.x > 0.2 ? 1 : -1;
        paintSide();
        $('seatHint').textContent = `You are beside row ${row}. Choose any row, on either side.`;
        card.hidden = false;
        open = true;
      }
    },
  };
}
