'use strict';
// Serves the website from ./site and passes live messages between visitors.
// Nothing is written to disk and nothing is kept after a visitor leaves:
// messages go straight from one visitor's browser to the others' and are then forgotten.
// No packages needed. Start with: node server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Rules = require('./site/chat-rules.js');

const ROOT = path.join(__dirname, 'site');
const PORT = Number(process.env.PORT) || 10000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8' };
const TOPICS = new Set(['chat', 'dm', 'wish', 'feed', 'bell', 'offer']);
const LIMITS = { visitors: 400, perAddress: 8, body: 4096, presenceKeys: 12 };

// ---------- Live room ----------
const visitors = new Map(); // peer id -> { res, secret, presence, address, buckets }
const send = (v, event, data) => { try { v.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`); } catch { /* gone */ } };
const everyone = (event, data, except) => { for (const [id, v] of visitors) if (id !== except) send(v, event, data); };
const addressOf = (req) => String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
// A simple allowance per visitor: so many actions per window of time.
function allowed(v, kind, max, ms) {
  const now = Date.now();
  const b = v.buckets[kind] || (v.buckets[kind] = []);
  while (b.length && now - b[0] > ms) b.shift();
  if (b.length >= max) return false;
  b.push(now);
  return true;
}
function openStream(req, res) {
  const address = addressOf(req);
  if (visitors.size >= LIMITS.visitors) { res.writeHead(503); res.end(); return; }
  if ([...visitors.values()].filter((v) => v.address === address).length >= LIMITS.perAddress) { res.writeHead(429); res.end(); return; }
  const peer = crypto.randomBytes(9).toString('base64url');
  const secret = crypto.randomBytes(18).toString('base64url');
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.write('retry: 3000\n\n');
  const v = { res, secret, presence: {}, address, buckets: {} };
  visitors.set(peer, v);
  send(v, 'hello', { peer, secret, peers: [...visitors].filter(([id]) => id !== peer).map(([id, o]) => ({ peer: id, presence: o.presence })) });
  everyone('join', { peer }, peer);
  const beat = setInterval(() => { try { res.write(': still here\n\n'); } catch { /* gone */ } }, 25000);
  req.on('close', () => {
    clearInterval(beat);
    const last = v.presence;
    visitors.delete(peer);
    everyone('leave', { peer, presence: last });
  });
}
function readBody(req) {
  return new Promise((resolve) => {
    let size = 0; const parts = [];
    req.on('data', (c) => { size += c.length; if (size > LIMITS.body) { req.destroy(); resolve(null); } else parts.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(parts).toString('utf8'))); } catch { resolve(null); } });
    req.on('error', () => resolve(null));
  });
}
async function receive(req, res) {
  const m = await readBody(req);
  const v = m && visitors.get(m.peer);
  const done = (code, why) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: code === 200, why })); };
  if (!v || typeof m.secret !== 'string' || m.secret !== v.secret) return done(403, 'unknown');
  if (m.kind === 'presence') {
    if (!allowed(v, 'presence', 30, 10000)) return done(429, 'rate');
    const patch = m.patch && typeof m.patch === 'object' ? m.patch : {};
    for (const [k, val] of Object.entries(patch)) {
      if (val === null) delete v.presence[k];
      else if (Object.keys(v.presence).length < LIMITS.presenceKeys || k in v.presence) v.presence[k] = val;
    }
    everyone('presence', { peer: m.peer, presence: v.presence });
    return done(200);
  }
  if (m.kind === 'emit' && TOPICS.has(m.topic)) {
    if (!allowed(v, 'emit', 24, 10000)) return done(429, 'rate');
    const data = m.data;
    if (m.topic === 'chat') {
      // Public messages are checked here as well as in the browser, and limited to a few a minute.
      if (!allowed(v, 'chat', 6, 30000)) return done(429, 'slow');
      const c = Rules.cleanChat(data && data.t);
      if (!c.ok) return done(400, c.reason);
      data.t = c.text;
    }
    if (m.topic === 'wish' && typeof data?.text === 'string' && !Rules.cleanChat(data.text).ok) return done(400, 'rules');
    const msg = { topic: m.topic, data, peer: m.peer };
    // Private messages go only to the person they are meant for.
    if (m.topic === 'dm') {
      const to = visitors.get(data && data.to);
      if (to) send(to, 'emit', msg);
      send(v, 'emit', msg);
    } else everyone('emit', msg);
    return done(200);
  }
  return done(400, 'bad');
}

// ---------- Files ----------
function serveFile(req, res) {
  let rel;
  try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); res.end(); return; }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.normalize(path.join(ROOT, rel));
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('Not found'); return; }
    const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const longCache = /^\/(audio|vendor|pictures|textures|bible)\//.test(rel);
    const headers = { 'Content-Type': type, 'Cache-Control': longCache ? 'public, max-age=604800' : 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Accept-Ranges': 'bytes' };
    // Audio is sent in pieces when the browser asks, so long recordings can start at once.
    const range = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (range) {
      const start = range[1] ? Number(range[1]) : Math.max(0, st.size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), st.size - 1) : st.size - 1;
      if (start >= st.size || start > end) { res.writeHead(416, { 'Content-Range': `bytes */${st.size}` }); res.end(); return; }
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Content-Length': end - start + 1 });
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(file, { start, end }).pipe(res);
      return;
    }
    res.writeHead(200, { ...headers, 'Content-Length': st.size });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(file).pipe(res);
  });
}

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/room/stream' && req.method === 'GET') return openStream(req, res);
  if (url === '/room/send' && req.method === 'POST') return receive(req, res);
  if (url === '/room/ping') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end('{"ok":true,"relay":"cloud-temple"}'); return; }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
  return serveFile(req, res);
}).listen(PORT, () => console.log(`Listening on ${PORT}`));
