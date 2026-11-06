// All sound is private to the visitor. Music here is generated live in the
// browser, so there are no recordings to license. Recordings, including sutras,
// are listed in audio/tracks.json and appear only once you have added them.
const PENTATONIC = [196, 220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];

const GENERATED = [
  { id: 'zen', nameKey: 'soundZen' },
  { id: 'temple', nameKey: 'soundTemple' },
  { id: 'nature', nameKey: 'soundNature' },
];

export function createSound(demo) {
  let ctx = null;
  let master = null;
  let timers = [];
  let nodes = [];
  let audio = null;
  let volume = 0.8;
  let weatherNodes = [];

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, { type = 'sine', vol = 0.2, attack = 0.005, decay = 1.5, dest = null, start = 0 } = {}) {
    const a = ensure();
    if (!a) return;
    const t = a.currentTime + start;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    o.connect(g).connect(dest || a.destination);
    o.start(t);
    o.stop(t + decay + 0.05);
  }

  function fish(dest) {
    const a = ensure();
    if (!a) return;
    const t = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    o.frequency.setValueAtTime(520, t);
    o.frequency.exponentialRampToValueAtTime(330, t + 0.09);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g).connect(dest || a.destination);
    o.start(t);
    o.stop(t + 0.22);
  }

  function bell(dest) {
    [[146, 0.3], [294, 0.16], [440, 0.09], [603, 0.05]].forEach(([f, v]) => tone(f, { vol: v, attack: 0.03, decay: 7, dest }));
  }

  function noiseBuffer(a) {
    const buffer = a.createBuffer(1, a.sampleRate * 4, a.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    return buffer;
  }

  function stop() {
    timers.forEach(clearTimeout);
    timers = [];
    if (ctx) {
      for (const n of nodes) {
        try { n.gain?.gain.setTargetAtTime(0, ctx.currentTime, 0.4); } catch { /* Already stopped. */ }
        setTimeout(() => { try { n.src?.stop(); } catch { /* Already stopped. */ } }, 1600);
      }
    }
    nodes = [];
    if (audio) { audio.pause(); audio = null; }
  }

  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function looped(buffer, frequency, volume, type = 'lowpass') {
    const a = ctx;
    const src = a.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = a.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    const gain = a.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(volume, a.currentTime, 0.8);
    src.connect(filter).connect(gain).connect(master);
    src.start();
    nodes.push({ src, gain });
  }

  // A slow plucked melody over a soft drone, never quite repeating.
  function playZen() {
    const a = ctx;
    const delay = a.createDelay(1.5);
    delay.delayTime.value = 0.62;
    const feedback = a.createGain();
    feedback.gain.value = 0.38;
    delay.connect(feedback).connect(delay);
    delay.connect(master);
    const drone = a.createOscillator();
    drone.frequency.value = 98;
    const dg = a.createGain();
    dg.gain.value = 0;
    dg.gain.setTargetAtTime(0.055, a.currentTime, 2);
    drone.connect(dg).connect(master);
    drone.start();
    nodes.push({ src: drone, gain: dg });
    let at = 3;
    const pluck = () => {
      at = Math.max(0, Math.min(PENTATONIC.length - 1, at + Math.round((Math.random() - 0.5) * 4)));
      const f = PENTATONIC[at];
      tone(f, { type: 'triangle', vol: 0.15, decay: 2.8, dest: delay });
      tone(f, { type: 'triangle', vol: 0.15, decay: 2.8, dest: master });
      tone(f * 2, { vol: 0.03, decay: 1.1, dest: master });
      later(pluck, 1400 + Math.random() * 3600);
    };
    later(pluck, 800);
  }

  // Steady wooden fish with a bell at the end of each phrase.
  function playTemple() {
    let beat = 0;
    const knock = () => {
      if (beat % 24 === 0) bell(master);
      else fish(master);
      beat++;
      later(knock, beat % 24 === 0 ? 7000 : 1050);
    };
    knock();
  }

  function playNature() {
    const buffer = noiseBuffer(ctx);
    looped(buffer, 460, 0.42);
    looped(buffer, 1900, 0.2, 'bandpass');
    const bird = () => {
      const base = 2100 + Math.random() * 1300;
      const notes = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < notes; i++) tone(base + Math.random() * 300, { vol: 0.03, attack: 0.01, decay: 0.14, dest: master, start: i * 0.17 });
      later(bird, 4000 + Math.random() * 9000);
    };
    later(bird, 2500);
  }

  const api = {
    current: 'off',
    tracks: [...GENERATED],
    ensure,
    fish: () => fish(),
    bell: () => bell(),
    get volume() { return volume; },
    setVolume(v) {
      volume = v;
      if (master) master.gain.setTargetAtTime(v, ctx.currentTime, 0.05);
      if (audio) audio.volume = v;
    },
    // A quiet sound bed for the chosen weather, independent of music.
    setWeather(kind) {
      if (!ensure()) return;
      for (const n of weatherNodes) {
        n.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
        const { src, lfo } = n;
        setTimeout(() => { try { src.stop(); lfo?.stop(); } catch { /* Already stopped. */ } }, 2000);
      }
      weatherNodes = [];
      const buffer = noiseBuffer(ctx);
      const layer = (type, freq, vol, lfoRate = 0, lfoDepth = 0) => {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.gain.setTargetAtTime(vol, ctx.currentTime, 1);
        src.connect(filter).connect(gain).connect(master);
        src.start();
        let lfo = null;
        if (lfoRate) {
          lfo = ctx.createOscillator();
          lfo.frequency.value = lfoRate;
          const depth = ctx.createGain();
          depth.gain.value = lfoDepth;
          lfo.connect(depth).connect(gain.gain);
          lfo.start();
        }
        weatherNodes.push({ src, gain, lfo });
      };
      if (kind === 'rain') { layer('bandpass', 2200, 0.5); layer('lowpass', 480, 0.28); }
      if (kind === 'wind') { layer('lowpass', 430, 0.5, 0.09, 0.26); layer('bandpass', 950, 0.08, 0.14, 0.05); }
      if (kind === 'summer') { layer('bandpass', 4300, 0.05, 26, 0.04); layer('lowpass', 300, 0.06); }
      if (kind === 'snow') layer('lowpass', 240, 0.13, 0.05, 0.05);
    },
    bead: () => tone(1500, { type: 'triangle', vol: 0.1, decay: 0.05 }),
    play(id) {
      if (!ensure()) return;
      if (id === api.current) id = 'off'; // Choosing the same sound again turns it off.
      stop();
      api.current = id;
      if (id === 'zen') playZen();
      else if (id === 'temple') playTemple();
      else if (id === 'nature') playNature();
      else if (id !== 'off') {
        const track = api.tracks.find((t) => t.id === id);
        if (track) {
          // One music track repeats; several play in turn as a playlist.
          const playlist = api.tracks.filter((x) => x.file && x.kind === track.kind);
          audio = new Audio(`audio/${track.file}`);
          audio.loop = playlist.length < 2;
          audio.volume = volume;
          audio.addEventListener('ended', () => {
            const next = playlist[(playlist.indexOf(track) + 1) % playlist.length];
            api.current = 'off';
            api.play(next.id);
            api.onChange?.();
          });
          audio.play().catch(() => {});
        }
      }
    },
  };

  {
    fetch('audio/tracks.json').then((r) => (r.ok ? r.json() : [])).then((list) => {
      if (Array.isArray(list)) api.tracks.push(...list.filter((t) => t.id && t.name && t.file));
    }).catch(() => {});
  }
  return api;
}
