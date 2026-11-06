// The choices for a visitor's own character. Every choice is open to everyone.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CHURCH_OPTIONS = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  const hex = (h, k) => {
    const n = parseInt(h.slice(1), 16);
    const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k))).toString(16).padStart(2, '0');
    return `#${c(16)}${c(8)}${c(0)}`;
  };
  const GROUPS = [
    { key: 'gender', label: 'Gender', items: [['woman', 'Woman'], ['man', 'Man'], ['other', 'Another, or prefer not to say']] },
    { key: 'figure', label: 'Figure', items: [['slim', 'Slimmer'], ['broad', 'Broader']] },
    { key: 'skin', label: 'Skin tone', swatch: true, items: [['#f6d8bd', 'Very light'], ['#f0c9a6', 'Light'], ['#e4b58f', 'Fair'], ['#c98f63', 'Tan'], ['#99633d', 'Brown'], ['#6a4128', 'Deep brown'], ['#4a2c1b', 'Very deep brown']] },
    { key: 'hair', label: 'Hair', items: [['short', 'Short'], ['long', 'Long'], ['bun', 'Bun'], ['curly', 'Curly'], ['ponytail', 'Ponytail'], ['shaved', 'Shaved']] },
    { key: 'hairColor', label: 'Hair colour', swatch: true, items: [['#17110e', 'Black'], ['#3a261b', 'Dark brown'], ['#7a4f2c', 'Brown'], ['#b98b4c', 'Blond'], ['#8e3f22', 'Red'], ['#c9c5bd', 'Grey']] },
    { key: 'cover', label: 'Head covering', items: [['none', 'None'], ['veil', 'Lace veil'], ['scarf', 'Headscarf'], ['cap', 'Cap']] },
    { key: 'outfit', label: 'Clothes', items: [['shirt', 'Shirt and trousers'], ['suit', 'Suit'], ['aoDai', 'Áo dài'], ['dress', 'Long dress'], ['robe', 'Long robe']] },
    { key: 'top', label: 'Clothes colour', swatch: true, items: [['#31546a', 'Blue'], ['#a82b36', 'Red'], ['#3b6a5c', 'Green'], ['#51436f', 'Purple'], ['#c7883c', 'Gold'], ['#e8e3d7', 'White'], ['#26252c', 'Black'], ['#c9d7ea', 'Pale blue'], ['#7b8287', 'Grey'], ['#b4681f', 'Saffron'], ['#7d5a33', 'Brown']] },
    { key: 'bottom', label: 'Trousers colour', swatch: true, items: [['#2b2c35', 'Charcoal'], ['#2f4560', 'Navy'], ['#5a4a3a', 'Brown'], ['#f4f1e8', 'White'], ['#6e6e74', 'Grey']] },
  ];
  const DEFAULTS = { gender: 'other', figure: 'slim', skin: '#e4b58f', hair: 'short', hairColor: '#17110e', cover: 'none', outfit: 'shirt', top: '#31546a', bottom: '#2b2c35' };
  const STARTS = { woman: { hair: 'long', outfit: 'aoDai', top: '#c9d7ea', bottom: '#f4f1e8', figure: 'slim' }, man: { hair: 'short', outfit: 'shirt', top: '#31546a', bottom: '#2b2c35', figure: 'broad' }, other: {} };
  // Keeps only known choices, so an old or damaged saved copy cannot break the page.
  function clean(saved) {
    const out = { ...DEFAULTS };
    for (const g of GROUPS) if (saved && g.items.some(([v]) => v === saved[g.key])) out[g.key] = saved[g.key];
    return out;
  }
  function chooseGender(me, gender) { return clean({ ...me, ...STARTS[gender], gender }); }
  function randomise(pick) {
    const out = {};
    for (const g of GROUPS) out[g.key] = g.items[Math.floor(pick() * g.items.length) % g.items.length][0];
    return clean(out);
  }
  function lookFrom(me) {
    const c = clean(me);
    const look = { skin: c.skin, hair: c.hairColor, hairStyle: c.hair, top: c.top, light: hex(c.top, 1.28), dark: hex(c.top, 0.68), slim: c.figure === 'slim' };
    if (c.cover === 'veil') { look.head = 'mantilla'; look.veil = '#e9e4d8'; look.coif = '#e9e4d8'; }
    if (c.cover === 'scarf') { look.head = 'mantilla'; look.veil = hex(c.top, 0.85); look.coif = hex(c.top, 1.1); }
    if (c.cover === 'cap') look.cap = hex(c.top, 0.7);
    if (c.outfit === 'dress' || c.outfit === 'robe') look.long = true;
    else { look.bottom = c.bottom; look.bottomD = hex(c.bottom, 0.68); }
    if (c.outfit === 'aoDai') look.tunic = true;
    if (c.outfit === 'suit') look.tie = true;
    if (c.outfit === 'robe') { look.sash = hex(c.top, 0.6); }
    return look;
  }
  return { GROUPS, DEFAULTS, clean, chooseGender, randomise, lookFrom };
}));
