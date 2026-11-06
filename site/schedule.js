// Which outfit the priest wears. Dates use Vietnam time. To change a holiday, edit fixed or the Easter offsets.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CHURCH_SCHEDULE = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  function easter(y) {
    const a = y % 19; const b = Math.floor(y / 100); const c = y % 100; const d = Math.floor(b / 4); const e = b % 4;
    const f = Math.floor((b + 8) / 25); const g = Math.floor((b - f + 1) / 3); const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4); const k = c % 4; const l = (32 + 2 * e + 2 * i - h - k) % 7; const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); const day = ((h + l - 7 * m + 114) % 31) + 1;
    return Date.UTC(y, month - 1, day);
  }
  const fixed = { '1-1': 'New Year', '11-1': 'All Saints', '11-24': 'Vietnamese Martyrs', '12-24': 'Christmas Eve', '12-25': 'Christmas' };
  const moving = { '-7': 'Palm Sunday', '-2': 'Good Friday', 0: 'Easter', 49: 'Pentecost' };
  function holiday(v) {
    const y = v.getUTCFullYear();
    const name = fixed[`${v.getUTCMonth() + 1}-${v.getUTCDate()}`];
    if (name) return name;
    const days = Math.round((Date.UTC(y, v.getUTCMonth(), v.getUTCDate()) - easter(y)) / 86400000);
    return moving[days] || null;
  }
  // now is a normal Date. Holidays win, then weekends, then the time of day.
  function outfitFor(now = new Date()) {
    const v = new Date(now.getTime() + 7 * 3600 * 1000);
    const h = holiday(v);
    if (h) return { outfit: 'holiday', why: h };
    const w = v.getUTCDay();
    if (w === 0 || w === 6) return { outfit: 'weekend', why: w === 0 ? 'Sunday' : 'Saturday' };
    const hour = v.getUTCHours();
    return hour >= 6 && hour < 18 ? { outfit: 'day', why: 'Daytime' } : { outfit: 'night', why: 'Night' };
  }
  return { outfitFor, easter, holiday };
}));
