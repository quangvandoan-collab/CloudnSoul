// Who is in the nave, what they look like and where they go.
// A route lists stops: x, z, how many seconds to wait, what to do there, and which way to face.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CHURCH_CAST = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  const SKIN = { light: '#f0c9a6', fair: '#e4b58f', tan: '#c98f63', brown: '#99633d', deep: '#6a4128' };
  const LOOKS = {
    nunBlack: { top: '#1d1b22', light: '#33303b', dark: '#100f14', long: true, head: 'veil', veil: '#17151b', coif: '#f2eee4', skin: SKIN.fair, hold: 'rosary' },
    nunWhite: { top: '#e8e3d7', light: '#f8f4ea', dark: '#bdb6a6', long: true, head: 'veil', veil: '#27334f', coif: '#fbf8f0', skin: SKIN.tan, hold: 'book', sash: '#27334f' },
    acolyte: { top: '#f4f0e6', light: '#ffffff', dark: '#c8c2b4', bottom: '#8a1820', bottomD: '#5e0f16', long: true, surplice: true, hair: '#2c2320', hairStyle: 'short', skin: SKIN.fair, hold: 'taper' },
    acolyte2: { top: '#f4f0e6', light: '#ffffff', dark: '#c8c2b4', bottom: '#1f1e26', bottomD: '#111017', long: true, surplice: true, hair: '#17110e', hairStyle: 'short', skin: SKIN.brown, hold: 'taper' },
    janitor: { top: '#31507a', light: '#47709f', dark: '#203654', bottom: '#2b3a52', bottomD: '#1b2638', hair: '#2d2522', hairStyle: 'short', skin: SKIN.tan, hold: 'broom', apron: '#6f7f91', cap: '#203654' },
    janitor2: { top: '#5f6b4c', light: '#7c8a63', dark: '#454e36', bottom: '#3c4231', bottomD: '#292d21', hair: '#777069', hairStyle: 'bun', skin: SKIN.fair, hold: 'broom', apron: '#8f9a86' },
    monk: { top: '#f08a1c', light: '#ffa94a', dark: '#c96a0c', long: true, hairStyle: 'shaved', skin: SKIN.tan, scalp: '#b47e55', kasaya: '#d9730f', hold: 'mala' },
    monk2: { top: '#f2c230', light: '#f8d65e', dark: '#c99a1c', long: true, hairStyle: 'shaved', skin: SKIN.fair, scalp: '#cfa27e', collar: '#a9bcc8', hold: 'mala' },
    monkBrown: { top: '#4a2e1e', light: '#5e3c28', dark: '#352015', long: true, hairStyle: 'shaved', skin: SKIN.light, scalp: '#d6ac8c', kasaya: '#e08a22', kasayaW: 6, collar: '#3b2a20', hold: 'mala' },
    nunYellow: { top: '#f2a83a', light: '#f8c266', dark: '#c98222', long: true, hairStyle: 'shaved', skin: SKIN.light, scalp: '#dcb595', collar: '#b9cfdc', slim: true },
    abbot: { top: '#b8261e', light: '#cf3a2c', dark: '#861a14', long: true, hairStyle: 'shaved', skin: SKIN.fair, scalp: '#cfa27e', grid: '#e0b34a', collar: '#cfd6d2', head: 'crown', hold: 'mala' },
    nunGrey: { top: '#6f7276', light: '#8b8e92', dark: '#505358', long: true, hair: '#3a3532', hairStyle: 'shaved', skin: SKIN.light, hold: 'rosary' },
    layGrey: { top: '#7b8287', light: '#969da2', dark: '#5a6065', long: true, hair: '#17110e', hairStyle: 'bun', skin: SKIN.fair },
    cook2: { top: '#f5f2ea', light: '#ffffff', dark: '#cbc6ba', bottom: '#3b3c44', bottomD: '#25262c', hair: '#3a261b', hairStyle: 'bun', skin: SKIN.brown, apron: '#b9d0c5', head: 'toque' },
    cook: { top: '#f5f2ea', light: '#ffffff', dark: '#cbc6ba', bottom: '#3b3c44', bottomD: '#25262c', hair: '#2c2320', hairStyle: 'short', skin: SKIN.fair, hold: 'tray', apron: '#e6e2d6', head: 'toque' },
    man: { top: '#31546a', light: '#47738c', dark: '#213c4d', bottom: '#2b2c35', bottomD: '#1b1c22', hair: '#1f1a18', hairStyle: 'short', skin: SKIN.fair },
    manDeep: { top: '#b9b3a3', light: '#d7d1c0', dark: '#8f8a7c', bottom: '#3a3540', bottomD: '#25212a', hair: '#120e0d', hairStyle: 'short', skin: SKIN.deep },
    elder: { top: '#6c5a45', light: '#88745b', dark: '#4e3f30', bottom: '#46403a', bottomD: '#302b27', hair: '#c9c5bd', hairStyle: 'short', skin: SKIN.light, hold: 'cane' },
    aoDai: { top: '#c9d7ea', light: '#e3ecf7', dark: '#9aaecb', bottom: '#f4f1e8', bottomD: '#cfcabc', tunic: true, hair: '#17110e', hairStyle: 'long', skin: SKIN.fair },
    aoDaiRed: { top: '#a82b36', light: '#c9464e', dark: '#761b26', bottom: '#f4f1e8', bottomD: '#cfcabc', tunic: true, hair: '#231a17', hairStyle: 'bun', skin: SKIN.tan },
    woman: { top: '#51436f', light: '#6c5b91', dark: '#382e50', long: true, head: 'mantilla', veil: '#e9e4d8', coif: '#e9e4d8', hair: '#2a1d17', skin: SKIN.brown },
    womanLight: { top: '#3b6a5c', light: '#4f8878', dark: '#274a40', long: true, hair: '#7a4f2c', hairStyle: 'long', skin: SKIN.light },
    child: { top: '#c7883c', light: '#e0a75a', dark: '#94622a', bottom: '#2f4560', bottomD: '#1f2e42', hair: '#1a1412', hairStyle: 'short', skin: SKIN.tan, small: true },
  };
  const AISLE = 16;
  const CAST = [
    { look: 'nunBlack', role: 'Nun', doing: 'walking the east aisle and praying in the side chapels', hours: 'all', route: [[AISLE, 104, 0], [AISLE, 57.5, 0], [25, 57.5, 14, 'kneel', [1, 0]], [AISLE, 57.5, 0], [AISLE, 46.5, 0], [25, 46.5, 10, 'pray', [1, 0]], [AISLE, 46.5, 0]] },
    { look: 'nunWhite', role: 'Nun', doing: 'reading and walking the west aisle', hours: 'all', route: [[-AISLE, 42, 0], [-AISLE, 74, 6, 'idle', [0, 1]], [-AISLE, 104, 0], [-AISLE, 101.5, 0], [-25, 101.5, 12, 'kneel', [-1, 0]], [-AISLE, 101.5, 0], [-AISLE, 90, 0]] },
    { look: 'nunBlack', role: 'Nun', doing: 'praying before the altar', hours: 'all', route: [[-3.4, 33.5, 600, 'kneel', [0, -1]]] },
    { look: 'acolyte', role: 'Acolyte', doing: 'lighting candles at the front of the nave', hours: 'all', route: [[-5.5, 34.5, 4, 'work', [0, -1]], [5.5, 34.5, 4, 'work', [0, -1]]] },
    { look: 'acolyte2', role: 'Acolyte', doing: 'lighting candles in the west chapels', hours: 'all', route: [[-24, 43.3, 7, 'work', [0, -1]], [-AISLE, 43.3, 0], [-AISLE, 54.3, 0], [-24, 54.3, 7, 'work', [0, -1]], [-AISLE, 54.3, 0], [-AISLE, 65.3, 0], [-24, 65.3, 7, 'work', [0, -1]], [-AISLE, 65.3, 0], [-AISLE, 43.3, 0]] },
    { look: 'janitor', role: 'Janitor', doing: 'sweeping behind the pews', hours: 'all', speed: 0.5, sweeps: true, route: [[-9, 109.5, 1.5, 'work', [1, 0]], [9, 109.5, 1.5, 'work', [-1, 0]]] },
    { look: 'janitor2', role: 'Janitor', doing: 'sweeping the east aisle', hours: 'all', speed: 0.45, sweeps: true, route: [[13, 92, 1.5, 'work', [0, 1]], [13, 113, 1.5, 'work', [0, -1]]] },
    { look: 'man', role: 'Visitor', doing: 'walking to the altar', hours: 'open', route: [[-0.9, 103, 8, 'idle', [0, -1]], [-0.9, 40, 12, 'pray', [0, -1]]] },
    { look: 'aoDai', role: 'Visitor', doing: 'walking toward the confession chapel', hours: 'open', speed: 0.9, route: [[14, 105, 4, 'idle', [0, -1]], [14, 74, 16, 'idle', [1, 0]]] },
    { look: 'elder', role: 'Visitor', doing: 'walking slowly with a cane', hours: 'open', speed: 0.55, route: [[-13, 100, 6, 'idle', [1, 0]], [-13, 60, 6, 'idle', [1, 0]]] },
    { look: 'woman', role: 'Visitor', doing: 'sitting in a pew', hours: 'open', route: [[-4.2, 80, 600, 'sit', [0, -1]]] },
    { look: 'manDeep', role: 'Visitor', doing: 'sitting in a pew', hours: 'open', route: [[7, 72, 600, 'sit', [0, -1]]] },
    { look: 'aoDaiRed', role: 'Visitor', doing: 'sitting in a pew', hours: 'all', route: [[-7.4, 58, 600, 'sit', [0, -1]]] },
    { look: 'womanLight', role: 'Visitor', doing: 'sitting in a pew', hours: 'open', route: [[4.5, 49, 600, 'sit', [0, -1]]] },
    { look: 'child', role: 'Visitor', doing: 'sitting with family', hours: 'open', route: [[-3, 80, 600, 'sit', [0, -1]]] },
    { look: 'man', role: 'Visitor', doing: 'kneeling in a side chapel', hours: 'all', route: [[25, 90.5, 600, 'kneel', [1, 0]]] },
    { look: 'womanLight', role: 'Visitor', doing: 'looking at the pictures', hours: 'open', y: 20.3, route: [[18, 96, 12, 'idle', [1, 0]], [18, 85, 12, 'idle', [1, 0]]] },
    { look: 'manDeep', role: 'Visitor', doing: 'looking at the pictures', hours: 'open', y: 20.3, route: [[18, 74, 14, 'idle', [1, 0]], [18, 63, 14, 'idle', [1, 0]]] },
  ];
  const ROOM_CAST = {
    crypt: [
      { look: 'nunBlack', role: 'Nun', doing: 'praying at the crypt altar', hours: 'all', route: [[-1.8, -3.2, 600, 'kneel', [0, -1]]] },
      { look: 'acolyte', role: 'Acolyte', doing: 'tending the candles by the tombs', hours: 'all', route: [[-10, 2.5, 6, 'work', [1, 0]], [-10, 28, 6, 'work', [1, 0]], [10, 28, 6, 'work', [-1, 0]], [10, 2.5, 6, 'work', [-1, 0]]] },
      { look: 'elder', role: 'Visitor', doing: 'walking slowly through the crypt', hours: 'open', speed: 0.55, route: [[2.6, 27, 6, 'idle', [0, -1]], [2.6, 2, 10, 'idle', [0, -1]]] },
      { look: 'aoDaiRed', role: 'Visitor', doing: 'sitting in the quiet chapel', hours: 'open', route: [[26, 12.4, 600, 'sit', [1, 0]]] },
      { look: 'womanLight', role: 'Visitor', doing: 'sitting in the quiet chapel', hours: 'open', route: [[-26, 15.6, 600, 'sit', [-1, 0]]] },
    ],
    hall: [
      { look: 'cook', role: 'Cook', doing: 'carrying bread to the refectory', hours: 'all', speed: 1.2, route: [[-14, 62, 3, 'idle', [0, 1]], [-14, 46, 0], [19, 46, 4, 'idle', [1, 0]], [-14, 46, 0]] },
      { look: 'cook2', role: 'Cook', doing: 'tending the fire and the pot', hours: 'all', route: [[-12, 72.4, 9, 'work', [0, 1]], [-20, 72.4, 7, 'work', [0, 1]], [-21, 66, 6, 'idle', [1, 0]], [-20, 72.4, 0]] },
      { look: 'janitor', role: 'Janitor', doing: 'sweeping the refectory', hours: 'all', speed: 0.5, sweeps: true, route: [[-24, 46, 1.5, 'work', [0, 1]], [-24, 38, 1.5, 'work', [0, -1]], [-12, 38, 1.5, 'work', [1, 0]], [-24, 38, 1.5, 'work', [-1, 0]]] },
      { look: 'nunBlack', role: 'Nun', doing: 'eating in the refectory', hours: 'open', route: [[-3, 40.5, 600, 'sit', [0, 1]]] },
      { look: 'nunWhite', role: 'Nun', doing: 'eating in the refectory', hours: 'open', route: [[-0.6, 40.5, 600, 'sit', [0, 1]]] },
      { look: 'man', role: 'Visitor', doing: 'eating in the refectory', hours: 'open', route: [[8, 51.5, 600, 'sit', [0, -1]]] },
      { look: 'aoDai', role: 'Visitor', doing: 'eating in the refectory', hours: 'open', route: [[10.5, 51.5, 600, 'sit', [0, -1]]] },
      { look: 'child', role: 'Visitor', doing: 'eating with family', hours: 'open', route: [[13, 51.5, 600, 'sit', [0, -1]]] },
      { look: 'manDeep', role: 'Visitor', doing: 'eating in the refectory', hours: 'open', route: [[4, 42.5, 600, 'sit', [0, -1]]] },
    ],
  };
  ROOM_CAST.outside = [
    { look: 'man', role: 'Visitor', doing: 'crossing the forecourt', hours: 'open', route: [[-20, 44, 6, 'idle', [0, -1]], [-8, 12, 8, 'idle', [0, -1]]] },
    { look: 'aoDai', role: 'Visitor', doing: 'crossing the forecourt', hours: 'open', speed: 0.9, route: [[14, 16, 7, 'idle', [0, -1]], [22, 46, 7, 'idle', [0, 1]]] },
    { look: 'womanLight', role: 'Visitor', doing: 'standing on the bridge', hours: 'open', y: -60, route: [[2.6, 270, 600, 'idle', [1, 0]]] },
    { look: 'elder', role: 'Visitor', doing: 'resting on the terrace', hours: 'open', y: -60, route: [[-14, 186, 600, 'idle', [1, 0]]] },
    { look: 'janitor2', role: 'Gardener', doing: 'sweeping the garden path', hours: 'open', y: -0.8, speed: 0.45, sweeps: true, route: [[62, 28, 1.5, 'work', [0, 1]], [62, 8, 1.5, 'work', [0, -1]]] },
    { look: 'nunWhite', role: 'Nun', doing: 'walking in the garden', hours: 'open', y: -0.8, speed: 0.7, route: [[-90, 54, 6, 'idle', [1, 0]], [-62, 54, 6, 'idle', [-1, 0]]] },
  ];
  // Am Mây, in world coordinates: world z is the plan's z minus 55, and floors sit 1.8 lower.
  ROOM_CAST.temple = [
    { look: 'monk', role: 'Monk', doing: 'walking by the lake', hours: 'all', y: -1.8, speed: 0.7, route: [[-34, -6, 7, 'idle', [1, 0]], [-34, -55, 7, 'idle', [1, 0]]] },
    { look: 'monk2', role: 'Monk', doing: 'sweeping the path', hours: 'open', y: -1.8, speed: 0.45, sweeps: true, route: [[34, -6, 2, 'work', [0, -1]], [34, -60, 2, 'work', [0, 1]]] },
    { look: 'monkBrown', role: 'Monk', doing: 'meditating in the main hall', hours: 'all', y: -0.95, route: [[-6, -92, 600, 'pray', [0, -1]]] },
    { look: 'monk2', role: 'Monk', doing: 'meditating in the main hall', hours: 'all', y: -0.95, route: [[6, -92, 600, 'pray', [0, -1]]] },
    { look: 'nunYellow', role: 'Nun', doing: 'walking in the Zen garden', hours: 'open', y: -1.75, speed: 0.6, route: [[0, 40, 8, 'idle', [0, -1]], [0, 18, 8, 'idle', [0, -1]]] },
    { look: 'monk', role: 'Monk', doing: 'crossing the stone bridge', hours: 'open', y: -1.25, speed: 0.8, route: [[-0.8, -8, 6, 'idle', [1, 0]], [-0.8, -24, 6, 'idle', [1, 0]]] },
    { look: 'nunYellow', role: 'Nun', doing: 'looking at the koi', hours: 'open', y: -1.8, route: [[-16, -2.2, 600, 'idle', [0, -1]]] },
    { look: 'monk2', role: 'Monk', doing: 'resting on the terrace', hours: 'open', y: -60, route: [[14, 186, 600, 'idle', [-1, 0]]] },
    { look: 'monkBrown', role: 'Monk', doing: 'walking slowly over the bridge', hours: 'open', y: -60, speed: 0.55, route: [[-2.4, 300, 6, 'idle', [0, -1]], [-2.4, 230, 6, 'idle', [0, 1]]] },
    { look: 'abbot', role: 'Abbot', doing: 'praying before the Buddha in the pagoda', hours: 'all', y: -0.91, route: [[-2.6, -33.2, 600, 'pray', [0.5, -1]]] },
    { look: 'monk', role: 'Monk', doing: 'climbing up to the temple', hours: 'open', y: -60, speed: 0.5, route: [[-12, 200, 8, 'idle', [0, -1]], [12, 200, 8, 'idle', [0, -1]]] },
  ];
  const ROOM_BOUNDS = { crypt: { x: [-35, 35], z: [-9, 39] }, hall: { x: [-26, 26], z: [37, 73] } };
  // day: only in daylight. open: day and sunset. all: every hour.
  const onDuty = (hours, time) => hours === 'all' || (hours === 'open' && time !== 'night') || (hours === 'day' && time === 'day');
  return { LOOKS, CAST, ROOM_CAST, ROOM_BOUNDS, onDuty };
}));
