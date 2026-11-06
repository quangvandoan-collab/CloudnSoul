// Who is in which booth. Only a booth number is ever shared, never anything a visitor writes.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.CHURCH_BOOTHS = factory();
}(typeof self !== 'undefined' ? self : this, function () {
  function createBooths(count = 3) {
    const state = Array(count).fill(null);
    const listeners = [];
    const changed = () => listeners.forEach((f) => f(state.slice()));
    return {
      get state() { return state.slice(); },
      onChange(f) { listeners.push(f); f(state.slice()); },
      isFree: (i) => state[i] === null,
      mine: () => state.indexOf('you'),
      enter(i) {
        if (state[i] !== null || state.includes('you')) return false;
        state[i] = 'you'; changed(); return true;
      },
      leave() { const i = state.indexOf('you'); if (i < 0) return false; state[i] = null; changed(); return true; },
      // Other visitors' booths, as reported by the connection. Never moves the real visitor.
      setOthers(list) {
        const busy = new Set(list);
        for (let i = 0; i < count; i++) if (state[i] !== 'you') state[i] = busy.has(i) ? 'other' : null;
        changed();
      },
      // Preview only: pretend another visitor comes or goes. Never moves the real visitor.
      simulate(pick) {
        const i = Math.floor(pick * count) % count;
        if (state[i] === 'you') return;
        state[i] = state[i] === 'other' ? null : 'other';
        changed();
      },
    };
  }
  return { createBooths };
}));
