// The church site plan. Everything else (maps, sections, block model, tests) reads this file.
// Units are metres. x runs across the church. z runs along it, with the altar at low z.
// y is height above the valley gate. To add a hall: add a SPACES entry and a LINKS entry, then run the tests.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CHURCH = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  // The perimeter wall runs 127 m either side of the centre line, from world z -60 to 190,
  // with a column and angel statue every 14 m.
  const LEVELS = [
    { id: 1, name: 'Valley and bridge', vi: 'Thung lũng và cầu', y: '0 to 60 m' },
    { id: 2, name: 'Pilgrim stairway', vi: 'Đường bậc hành hương', y: '60 to 120 m' },
    { id: 3, name: 'Forecourt and narthex', vi: 'Quảng trường và tiền đường', y: '120 m' },
    { id: 4, name: 'Main church', vi: 'Nhà thờ chính', y: '120 m' },
    { id: 5, name: 'Galleries and choir loft', vi: 'Hành lang trên và gác ca đoàn', y: '140 to 165 m' },
    { id: 6, name: 'Bell tower and lookouts', vi: 'Tháp chuông và đài ngắm', y: '190 to 206 m' },
    { id: 7, name: 'Crypt and quiet chapels', vi: 'Hầm mộ và nhà nguyện yên tĩnh', y: '106 m' },
    { id: 8, name: 'Cloister and service', vi: 'Tu viện và khu phục vụ', y: '120 m' },
  ];
  // h = height from floor to the highest point of its ceiling. h 0 = open sky.
  const S = (id, level, name, vi, rect, y, h, kind, purpose, extras = {}) => ({ id, level, name, vi, rect, y, h, kind, purpose, ...extras });
  const SPACES = [
    S('gate', 1, 'Valley gate', 'Cổng thung lũng', [-18, 18, 700, 740], 0, 14, 'arrive', 'First arrival. Stone gatehouse framing the first distant view of the church.'),
    S('bridge', 1, 'Great arched bridge', 'Cầu vòm lớn', [-6, 6, 340, 470], 60, 0, 'path', 'Crosses the gorge. The church rises straight ahead, the first big reveal.'),
    S('gorge-view', 1, 'Gorge balcony', 'Ban công hẻm núi', [6, 24, 395, 415], 60, 0, 'view', 'Place to stop on the bridge and look down at the river.'),
    S('terrace-1', 2, 'Lower terrace', 'Sân bậc dưới', [-28, 28, 308, 340], 60, 0, 'view', 'Rest point at the north end of the bridge, with the funicular station.'),
    S('terrace-2', 2, 'Cliff terrace', 'Sân bậc vách đá', [-66, -24, 262, 296], 80, 0, 'view', 'Viewpoint over the valley, on the first turn of the stairs.'),
    S('terrace-3', 2, 'High terrace', 'Sân bậc cao', [24, 66, 222, 258], 100, 0, 'view', 'Final rest. The full front of the church fills the view.'),
    S('forecourt', 3, 'Forecourt', 'Quảng trường trước nhà thờ', [-55, 55, 132, 190], 120, 0, 'arrive', 'Gathering square and the usual starting point for returning visitors.'),
    S('narthex', 3, 'Narthex', 'Tiền đường', [-22, 22, 118, 132], 120, 18, 'hall', 'Low entrance hall. Its modest height makes the nave feel enormous.'),
    S('nave', 4, 'Nave', 'Lòng nhà thờ', [-11, 11, 30, 118], 120, 44, 'grand', 'The main hall, with pews and a blue vault holding the Pozzo ceiling painting.', { feature: 'Pews and ceiling painting' }),
    S('aisle-w', 4, 'West aisle', 'Lối bên tây', [-20, -11, 30, 118], 120, 20, 'hall', 'Side walkway behind the columns, beneath the gallery.'),
    S('aisle-e', 4, 'East aisle', 'Lối bên đông', [11, 20, 30, 118], 120, 20, 'hall', 'Side walkway leading to the side chapels and confession chapel.'),
    S('chapels-w', 4, 'West side chapels', 'Nhà nguyện bên tây', [-30, -20, 40, 110], 120, 12, 'chapel', 'Small quiet chapels for sitting and candles.'),
    S('chapels-se', 4, 'East side chapels, south', 'Nhà nguyện bên đông, phía nam', [20, 30, 85, 110], 120, 12, 'chapel', 'Small quiet chapels.'),
    S('confession', 4, 'Confession chapel', 'Nhà nguyện giải tội', [20, 30, 63, 85], 120, 12, 'chapel', 'Three carved booths with red and green lights, used for private reflection. Not the sacrament.', { feature: 'Three confession booths' }),
    S('chapels-ne', 4, 'East side chapels, north', 'Nhà nguyện bên đông, phía bắc', [20, 30, 40, 63], 120, 12, 'chapel', 'Small quiet chapels.'),
    S('crossing', 4, 'Crossing under the dome', 'Giao điểm dưới vòm', [-11, 11, 8, 30], 120, 74, 'grand', 'Tallest interior. The painted dome is directly overhead.', { feature: 'Great painted dome and lantern' }),
    S('transept-n', 4, 'North transept', 'Cánh ngang bắc', [-52, -11, 8, 30], 120, 40, 'grand', 'Side arm with a large window wall and painted vault. Pulpit stands at its inner corner.'),
    S('transept-s', 4, 'South transept', 'Cánh ngang nam', [11, 52, 8, 30], 120, 40, 'grand', 'Side arm with a large window wall and painted vault. Lectern stands at its inner corner.'),
    S('chancel', 4, 'Chancel', 'Cung ca đoàn', [-11, 11, -20, 8], 120, 40, 'grand', 'Carved choir stalls on both sides, leading the eye to the altar.', { feature: 'Choir stalls' }),
    S('sanctuary', 4, 'Sanctuary', 'Cung thánh', [-11, 11, -36, -20], 120, 40, 'altar', 'High altar. Visitors can view it from the rail but cannot walk onto it.', { feature: 'High altar', noVisitors: true }),
    S('apse', 4, 'Apse', 'Hậu cung', [-11, 11, -52, -36], 120, 36, 'altar', 'Curved end wall with the largest mosaic or painting.', { curved: true, noVisitors: true }),
    S('lady-chapel', 4, 'Lady Chapel', 'Nhà nguyện Đức Mẹ', [-30, -11, -36, -2], 120, 18, 'chapel', 'Largest side chapel, for quiet prayer with candles.'),
    S('gallery-w', 5, 'West gallery', 'Hành lang trên phía tây', [-20, -11, 30, 118], 140, 21, 'hall', 'Upper walkway behind the balcony, with close views of the blue vault.'),
    S('gallery-e', 5, 'East gallery', 'Hành lang trên phía đông', [11, 20, 30, 118], 140, 21, 'hall', 'Upper walkway behind the balcony, with close views of the blue vault.'),
    S('choir-loft', 5, 'Choir loft', 'Gác ca đoàn', [-20, 20, 118, 130], 142, 20, 'hall', 'Organ and singers’ loft, looking down the whole nave to the altar.'),
    S('dome-gallery', 5, 'Dome gallery', 'Hành lang vòng quanh vòm', [-15, 15, 4, 34], 165, 26, 'view', 'Ring balcony close to the dome painting, 45 m above the floor.', { ring: true }),
    S('tower', 6, 'Bell tower', 'Tháp chuông', [22, 36, 118, 132], 190, 16, 'view', 'Bell chamber above the forecourt. The tower shaft rises from the narthex.'),
    S('lookout', 6, 'Tower lookout', 'Đài ngắm trên tháp', [24, 34, 120, 130], 206, 0, 'view', 'Highest open-air point, looking back across the bridge and valley.'),
    S('lantern', 6, 'Dome lantern lookout', 'Đài ngắm đỉnh vòm', [-7, 7, 12, 26], 194, 0, 'view', 'Open walkway around the very top of the dome.'),
    S('crypt', 7, 'Crypt', 'Hầm nhà thờ', [-20, 20, -10, 40], 106, 9, 'hall', 'Low vaulted hall below the main church, lit mainly by candles.'),
    S('quiet-w', 7, 'West quiet chapel', 'Nhà nguyện yên tĩnh tây', [-36, -20, 0, 30], 106, 7, 'chapel', 'Silent room with no chat and very little sound.'),
    S('quiet-e', 7, 'East quiet chapel', 'Nhà nguyện yên tĩnh đông', [20, 36, 0, 30], 106, 7, 'chapel', 'Silent room with no chat and very little sound.'),
    S('sacristy', 8, 'Sacristy (vestry)', 'Phòng thánh', [11, 30, -36, -2], 120, 9, 'service', 'Staff room where priests and acolytes prepare. Later characters start here.', { staff: true }),
    S('corridor', 8, 'Cloister corridor', 'Hành lang tu viện', [30, 58, -30, -12], 120, 6, 'service', 'Covered link from the church to the cloister.'),
    S('cloister', 8, 'Cloister garden', 'Vườn tu viện', [58, 112, -24, 36], 120, 0, 'garden', 'Garden court with covered walks. The suggested place for chat.', { feature: 'Suggested chat area' }),
    S('cloister-w', 8, 'West cloister garden', 'Vườn tu viện phía tây', [-112, -58, -24, 36], 120, 0, 'garden', 'Second garden court with covered walks and a fountain.'),
    S('gardens-e', 3, 'East forecourt gardens', 'Vườn phía đông quảng trường', [55, 127, 132, 190], 120, 0, 'garden', 'Hedged flower beds, a fountain and lamps inside the wall.'),
    S('gardens-w', 3, 'West forecourt gardens', 'Vườn phía tây quảng trường', [-127, -55, 132, 190], 120, 0, 'garden', 'Hedged flower beds, a fountain and lamps inside the wall.'),
    S('refectory', 8, 'Refectory', 'Nhà ăn', [58, 112, 36, 56], 120, 12, 'service', 'Long dining hall with a painted end wall.'),
    S('kitchen', 8, 'Kitchen', 'Nhà bếp', [58, 84, 56, 74], 120, 8, 'service', 'Working kitchen for the cooks later on.', { staff: true }),
    S('storage', 8, 'Storage', 'Kho', [84, 112, 56, 74], 120, 6, 'service', 'Stores and janitors’ workspace.', { staff: true }),
  ];
  // Sloped ways, drawn from point to point. Each point is [x, z, y].
  const PATHS = [
    { id: 'road', level: 1, name: 'Forest road', vi: 'Đường rừng', width: 8, stepFree: true, points: [[0, 700, 0], [-70, 640, 18], [50, 570, 38], [-20, 500, 54], [0, 470, 60]] },
    { id: 'flight-a', level: 2, name: 'First stairs', vi: 'Dãy bậc thứ nhất', width: 8, stepFree: false, points: [[-20, 308, 60], [-42, 296, 80]] },
    { id: 'flight-b', level: 2, name: 'Second stairs', vi: 'Dãy bậc thứ hai', width: 8, stepFree: false, points: [[-24, 279, 80], [24, 240, 100]] },
    { id: 'flight-c', level: 2, name: 'Grand stairs', vi: 'Dãy bậc lớn', width: 14, stepFree: false, points: [[36, 222, 100], [0, 190, 120]] },
    { id: 'funicular', level: 2, name: 'Funicular', vi: 'Tàu leo núi', width: 5, stepFree: true, points: [[28, 320, 60], [76, 250, 100], [60, 180, 120]] },
  ];
  // How spaces connect. stepFree is false only for routes that need stairs.
  const L = (a, b, by, stepFree = true, open = false) => ({ a, b, by, stepFree, open });
  const LINKS = [
    L('gate', 'bridge', 'Forest road'),
    L('bridge', 'gorge-view', 'Side opening', true, true),
    L('bridge', 'terrace-1', 'Bridge end', true, true),
    L('terrace-1', 'terrace-2', 'First stairs', false),
    L('terrace-2', 'terrace-3', 'Second stairs', false),
    L('terrace-3', 'forecourt', 'Grand stairs', false),
    L('terrace-1', 'terrace-2', 'Cliff lift'),
    L('terrace-1', 'terrace-3', 'Funicular'),
    L('terrace-3', 'forecourt', 'Funicular'),
    L('forecourt', 'narthex', 'Main doors', true, true),
    L('narthex', 'nave', 'Inner doors', true, true),
    L('narthex', 'aisle-w', 'Side door', true, true),
    L('narthex', 'aisle-e', 'Side door', true, true),
    L('nave', 'aisle-w', 'Column arcade', true, true),
    L('nave', 'aisle-e', 'Column arcade', true, true),
    L('aisle-w', 'chapels-w', 'Arches', true, true),
    L('aisle-e', 'chapels-se', 'Arches', true, true),
    L('aisle-e', 'confession', 'Arches', true, true),
    L('aisle-e', 'chapels-ne', 'Arches', true, true),
    L('nave', 'crossing', 'Open arch', true, true),
    L('crossing', 'transept-n', 'Open arch', true, true),
    L('crossing', 'transept-s', 'Open arch', true, true),
    L('crossing', 'chancel', 'Open arch', true, true),
    L('chancel', 'sanctuary', 'Altar rail, view only', true, true),
    L('sanctuary', 'apse', 'Open', true, true),
    L('chancel', 'lady-chapel', 'Side arch', true, true),
    L('chancel', 'sacristy', 'Staff door', true, true),
    L('sacristy', 'corridor', 'Door'),
    L('corridor', 'cloister', 'Door'),
    L('transept-s', 'cloister', 'South door'),
    L('transept-n', 'cloister-w', 'North door'),
    L('forecourt', 'gardens-e', 'Garden path', true, true),
    L('forecourt', 'gardens-w', 'Garden path', true, true),
    L('cloister', 'refectory', 'Door', true, true),
    L('refectory', 'kitchen', 'Door', true, true),
    L('kitchen', 'storage', 'Door', true, true),
    L('narthex', 'choir-loft', 'Stairs and lift'),
    L('aisle-w', 'gallery-w', 'Stairs and lift'),
    L('aisle-e', 'gallery-e', 'Stairs and lift'),
    L('choir-loft', 'gallery-w', 'Walkway'),
    L('choir-loft', 'gallery-e', 'Walkway'),
    L('gallery-w', 'dome-gallery', 'Spiral stairs and lift'),
    L('dome-gallery', 'lantern', 'Stairs and small lift'),
    L('narthex', 'tower', 'Tower stairs and lift'),
    L('tower', 'lookout', 'Short stairs and platform lift'),
    L('transept-n', 'crypt', 'Stairs and lift'),
    L('transept-s', 'crypt', 'Stairs and lift'),
    L('crypt', 'quiet-w', 'Arch', true, true),
    L('crypt', 'quiet-e', 'Arch', true, true),
  ];
  const FUTURE = [
    { id: 'future-west', level: 8, name: 'West service wing', rect: [-112, -58, 36, 74], note: 'Space behind the west garden for more halls.' },
    { id: 'future-crypt', level: 7, name: 'Crypt extension', rect: [-20, 20, -54, -10], note: 'More chapels or a museum beneath the altar.' },
    { id: 'future-pilgrim', level: 2, name: 'Pilgrim hall', rect: [-72, -24, 230, 262], note: 'A hall or shop-free rest house beside the cliff terrace.' },
    { id: 'future-library', level: 8, name: 'Library wing', rect: [112, 150, 0, 74], note: 'A large painted library beyond the service wing.' },
  ];
  // Rough ground height, used for drawings and the block model.
  function ground(x, z) {
    const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
    let h;
    if (z >= 470) h = lerp(60, 0, (z - 470) / 240);
    else if (z >= 340) h = 58 - Math.sin(((z - 340) / 130) * Math.PI) * 92;
    else if (z >= 190) h = lerp(114, 58, (z - 190) / 150);
    else if (z >= -70) h = 115;
    else h = lerp(115, 330, (-70 - z) / 150);
    const a = Math.abs(x);
    if (z > -60) h -= lerp(0, 95, (a - 130) / 120);
    else h += lerp(0, 45, a / 200);
    if (z > 480) h += lerp(0, 90, (a - 90) / 150);
    return h + Math.sin(x * 0.043 + z * 0.021) * Math.min(5, a / 35) + Math.cos(z * 0.05) * Math.min(3, a / 50);
  }
  return { LEVELS, SPACES, PATHS, LINKS, FUTURE, ground };
}));
