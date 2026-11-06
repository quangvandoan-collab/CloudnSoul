// Public-domain hymns only. Melodies are written out here, and the browser plays them, so no recording is used.
// A melody note is NOTE:BEATS or NOTE:BEATS:CHORD. ~ starts a note held on the same syllable. _ in a lyric holds the last word.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CHURCH_HYMNS = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  const J = {
    a: 'E4:1:C E4:1 F4:1 G4:1 G4:1:G F4:1 E4:1 D4:1',
    b: 'C4:1:C C4:1 D4:1 E4:1 E4:1.5:G D4:.5 D4:2',
    c: 'C4:1:C C4:1 D4:1 E4:1 D4:1.5:G C4:.5:C C4:2',
  };
  const NIGHT3 = 'A4:2:F A4:1 C5:1.5 B4:.5 A4:1 G4:1.5:C A4:.5 G4:1 E4:3';
  return [
    {
      id: 'amazing-grace', title: 'Amazing Grace', words: 'John Newton, 1779', tune: 'New Britain, traditional American', bpm: 76, beatsPerBar: 3,
      lines: [
        'D4:1:G G4:2:G B4:.5 ~G4:.5 B4:2:G A4:1 G4:2:C E4:1 D4:2:G',
        'D4:1 G4:2:G B4:.5 ~G4:.5 B4:2:D A4:1 D5:2:G',
        'B4:1 D5:2:G B4:.5 ~G4:.5 B4:2:G A4:1 G4:2:C E4:1 D4:2:G',
        'D4:1 G4:2:G B4:.5 ~G4:.5 B4:2:D A4:1 G4:3:G',
      ],
      verses: [
        ['A-ma-zing grace! how sweet the sound', 'That saved a wretch like me!', 'I once was lost, but now am found,', 'Was blind, but now I see.'],
        ['\'Twas grace that taught my heart to fear,', 'And grace my fears re-lieved;', 'How pre-cious did that grace ap-pear', 'The hour I first be-lieved!'],
        ['Through ma-ny dan-gers, toils and snares,', 'I have al-rea-dy come;', '\'Tis grace hath brought me safe thus far,', 'And grace will lead me home.'],
      ],
    },
    {
      id: 'silent-night', title: 'Silent Night', words: 'Joseph Mohr, 1816; English by John F. Young, 1859', tune: 'Franz Gruber, 1818', bpm: 66, beatsPerBar: 3,
      lines: [
        'G4:1.5:C A4:.5 ~G4:1 E4:3 G4:1.5 A4:.5 ~G4:1 E4:3',
        'D5:2:G D5:1 B4:3 C5:2:C C5:1 G4:3',
        NIGHT3,
        NIGHT3,
        'D5:2:G D5:1 F5:1.5 D5:.5 B4:1 C5:3:C ~E5:3',
        'C5:1.5:C G4:.5 E4:1 G4:1.5:G F4:.5 ~D4:1 C4:6:C',
      ],
      verses: [
        ['Si-lent night, ho-ly night,', 'All is calm, all is bright', 'Round yon Vir-gin Mo-ther and-_ Child,', 'Ho-ly In-fant, so ten-der and mild,', 'Sleep in hea-ven-ly peace,', 'Sleep in hea-ven-ly peace.'],
        ['Si-lent night, ho-ly night,', 'Shep-herds quake at the sight;', 'Glo-ries stream from hea-ven a-_-far,', 'Hea-ven-ly hosts sing Al-le-lu-ia!', 'Christ the Sa-vior is born!', 'Christ the Sa-vior is born!'],
        ['Si-lent night, ho-ly night,', 'Son of God, love\'s pure light;', 'Ra-di-ant beams from Thy ho-ly face,', 'With the dawn of re-deem-ing-_ grace,', 'Je-sus, Lord, at Thy birth,', 'Je-sus, Lord, at Thy birth.'],
      ],
    },
    {
      id: 'joyful', title: 'Joyful, Joyful, We Adore Thee', words: 'Henry van Dyke, 1907', tune: 'Ludwig van Beethoven, 1824', bpm: 100, beatsPerBar: 4,
      lines: [J.a, J.b, J.a, J.c, 'D4:1:G D4:1 E4:1:C C4:1 D4:1:G E4:.5 ~F4:.5 E4:1:C C4:1', 'D4:1:G E4:.5 ~F4:.5 E4:1 D4:1 C4:1:C D4:1:D G3:2:G', J.a, J.c],
      verses: [
        ['Joy-ful, joy-ful, we a-dore Thee,', 'God of glo-ry, Lord of love;', 'Hearts un-fold like flow\'rs be-fore Thee,', 'Op\'n-ing to the sun a-bove.', 'Melt the clouds of sin and sad-ness;', 'Drive the dark of doubt a-way;', 'Gi-ver of im-mor-tal glad-ness,', 'Fill us with the light of day!'],
        ['All Thy works with joy sur-round Thee,', 'Earth and heav\'n re-flect Thy rays,', 'Stars and an-gels sing a-round Thee,', 'Cen-ter of un-bro-ken praise.', 'Field and for-est, vale and moun-tain,', 'Flow\'-ry mea-dow, flash-ing sea,', 'Sing-ing bird and flow-ing foun-tain', 'Call us to re-joice in Thee.'],
      ],
    },
    {
      id: 'doxology', title: 'Praise God, from Whom All Blessings Flow', words: 'Thomas Ken, 1674', tune: 'Old Hundredth, Louis Bourgeois, 1551', bpm: 76, beatsPerBar: 4,
      lines: [
        'G4:2:G G4:1 F#4:1:D E4:1:C D4:1:G G4:1 A4:1:D B4:2:G',
        'B4:2:G B4:1 B4:1:Em A4:1:D G4:1:G C5:1:C B4:1:G A4:2:D',
        'G4:2:G A4:1:D B4:1:G A4:1:D G4:1:G E4:1:C F#4:1:D G4:2:G',
        'D5:2:G B4:1 G4:1:Em A4:1:D C5:1:Am B4:1:G A4:1:D G4:2:G',
      ],
      verses: [['Praise God, from whom all bless-ings flow;', 'Praise Him, all crea-tures here be-low;', 'Praise Him a-bove, ye heav\'n-ly host;', 'Praise Fa-ther, Son, and Ho-ly Ghost.']],
    },
  ];
}));
