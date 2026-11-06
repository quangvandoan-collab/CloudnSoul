// The live room on our own server, for when the page is not opened inside Claude.
// It behaves like Claude's room: emit, on, presence, onPeers, onConnection.
// Messages pass through the server and are not stored anywhere.
export async function connectRelay() {
  try {
    const r = await fetch('room/ping', { cache: 'no-store' });
    if (!r.ok || (await r.json()).relay !== 'cloud-temple') return null;
  } catch { return null; }
  const topics = {}; const peerFns = []; const connFns = [];
  const peers = new Map();
  let me = null; let secret = null; let mine = {}; let connected = false;
  const entry = (peer, presence) => ({ peer, by: null, isMe: peer === me, sameTab: peer === me, kind: 'viewer', guest: false, presence: presence || {}, updatedAt: Date.now() });
  const tell = (change) => { const list = [...peers.values()]; for (const f of peerFns) f({ peers: list, joined: [], left: [], updated: [], ...change }); };
  const setConn = (on) => { connected = on; for (const f of connFns) f(on); };
  const post = async (body) => {
    if (!me) throw Object.assign(new Error('Not connected'), { code: 'not_connected' });
    const r = await fetch('room/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ peer: me, secret, ...body }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); throw Object.assign(new Error(j.why || 'refused'), { code: r.status === 429 ? 'rate_limited' : 'refused' }); }
  };
  const es = new EventSource('room/stream');
  // Tests can set window.__relayWire = [] to see exactly what reached this browser.
  const wire = (e) => { if (Array.isArray(window.__relayWire)) window.__relayWire.push(e.data); };
  for (const t of ['hello', 'join', 'leave', 'presence', 'emit']) es.addEventListener(t, wire);
  es.addEventListener('hello', (e) => {
    const d = JSON.parse(e.data);
    me = d.peer; secret = d.secret;
    peers.clear();
    peers.set(me, entry(me, {}));
    for (const p of d.peers) peers.set(p.peer, entry(p.peer, p.presence));
    setConn(true);
    // After a reconnect, tell the others who we are again.
    if (Object.keys(mine).length) post({ kind: 'presence', patch: mine }).catch(() => {});
    tell({ joined: [...peers.values()] });
  });
  es.addEventListener('join', (e) => { const d = JSON.parse(e.data); const p = entry(d.peer, {}); peers.set(d.peer, p); tell({ joined: [p] }); });
  es.addEventListener('leave', (e) => { const d = JSON.parse(e.data); peers.delete(d.peer); tell({ left: [{ peer: d.peer, presence: d.presence || {} }] }); });
  es.addEventListener('presence', (e) => {
    const d = JSON.parse(e.data);
    const p = peers.get(d.peer) || entry(d.peer, {});
    p.presence = d.presence || {}; p.updatedAt = Date.now();
    peers.set(d.peer, p);
    tell({ updated: [p] });
  });
  es.addEventListener('emit', (e) => {
    const d = JSON.parse(e.data);
    const m = { topic: d.topic, data: d.data, peer: d.peer, by: null, isMe: d.peer === me, sameTab: d.peer === me, kind: 'viewer', guest: false };
    for (const f of topics[d.topic] || []) f(m);
  });
  es.onerror = () => { if (connected) setConn(false); };
  return {
    emit: (topic, data) => post({ kind: 'emit', topic, data }),
    on: (t, f) => { (topics[t] = topics[t] || []).push(f); return () => { topics[t] = topics[t].filter((g) => g !== f); }; },
    presence: async (patch) => {
      for (const k in patch) { if (patch[k] === null) delete mine[k]; else mine[k] = patch[k]; }
      const p = peers.get(me); if (p) p.presence = { ...mine };
      await post({ kind: 'presence', patch });
    },
    peers: () => [...peers.values()],
    onPeers: (f) => { peerFns.push(f); queueMicrotask(() => f({ peers: [...peers.values()], joined: [], left: [], updated: [] })); return () => {}; },
    connected: () => connected,
    onConnection: (f) => { connFns.push(f); queueMicrotask(() => f(connected)); return () => {}; },
  };
}
