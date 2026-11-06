// Pictures and music supplied by the project owner. Record each source here before launch.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CHURCH_MEDIA = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  const OWNER = 'Supplied by the project owner. Photographer not recorded yet.';
  // z is the place on the east wall of the upper gallery.
  const PICTURES = [
    { id: 'p1', title: "Andrea Pozzo's ceiling, Sant'Ignazio, Rome", credit: 'Painting by Andrea Pozzo. Photo supplied by the project owner, photographer not recorded yet.', w: 476, h: 900, z: 97.9 },
    { id: 'p2', title: 'Saint Joseph and the Child, stained glass', credit: OWNER, w: 601, h: 900, z: 94.1 },
    { id: 'p3', title: 'Painted ceiling with clouds and open sky', credit: OWNER, w: 675, h: 900, z: 86.9 },
    { id: 'p4', title: 'Baroque nave by candlelight', credit: OWNER, w: 600, h: 900, z: 83.1 },
    { id: 'p5', title: 'Carved altar and mural', credit: OWNER, w: 600, h: 900, z: 75.9 },
    { id: 'p7', title: 'Gilded apse with stained glass', credit: OWNER, w: 688, h: 900, z: 72.1 },
    { id: 'p8', title: 'Stone statue with a cross and a book', credit: OWNER, w: 600, h: 900, z: 64.9 },
    { id: 'p9', title: 'Baroque ceiling with a golden heaven', credit: 'Photo by Nick Castelli on Unsplash.', w: 600, h: 900, z: 61.1 },
    { id: 'p6', title: 'Crucifix under a painted dome', credit: OWNER, w: 900, h: 506, z: 52 },
  ];
  const UNKNOWN = 'Composer not named in the file';
  const TRACKS = [
    { id: 'peaceful-piano', title: 'Peaceful Piano Instrumental', artist: UNKNOWN, mood: 'Calm', minutes: 38 },
    { id: 'worship-instrumental', title: 'Worship Instrumental for Prayer', artist: UNKNOWN, mood: 'Calm', minutes: 41 },
    { id: 'sacred-light', title: 'Sacred Light', artist: UNKNOWN, mood: 'Choir', minutes: 4 },
    { id: 'divine-lamentations', title: 'Divine Lamentations', artist: UNKNOWN, mood: 'Choir', minutes: 5 },
    { id: 'church-music', title: 'Church Music', artist: 'Noel Malekar', mood: 'Choir', minutes: 3 },
    { id: 'gospel-sunday', title: 'Gospel Sunday', artist: UNKNOWN, mood: 'Organ and choir', minutes: 2.5 },
    { id: 'celestial', title: 'Celestial', artist: 'The Cause', mood: 'Dramatic', minutes: 1.5 },
    { id: 'imperium', title: 'Imperium', artist: 'Talekeeper Music', mood: 'Dramatic', minutes: 3.3 },
  ];
  return { PICTURES, TRACKS };
}));
