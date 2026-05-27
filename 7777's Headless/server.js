// ─── Noob Controller — WebSocket Server ──────────────────────────────────────
// Listens on port 8082 (or PORT env var).
// Controller userscripts connect here; this server manages bot worker processes
// and now also broadcasts CHAT packets between all connected controller clients.
//
// Packet types (msgpack arrays from the controller):
//   ["M", 72011]              → handshake init
//   ["C", xorVal]             → handshake confirm (server replies ["Z", tankName])
//   ["Z", tankName]           → set bot tank
//   ["F", serverHash]         → spawn bot into game room
//   ["B"]                     → kill all bots
//   ["A", x, y, mx, my, ...]  → movement update
//   ["CHAT", text, username, role]  → chat message (NEW — broadcast to all clients)

const { WebSocketServer } = require('ws');
const { fork }            = require('child_process');
const path                = require('path');
const msgpack             = require('msgpackr'); // or swap with your custom impl below

// ── Fallback minimal msgpack if msgpackr isn't installed ──────────────────────
let mp;
try {
  mp = require('msgpackr');
} catch {
  // Use the same hand-rolled encoder/decoder from the userscript
  const te = new TextEncoder(), td = new TextDecoder();
  function _enc(v, b) {
    if (v == null)            { b.push(0xc0); return; }
    if (v === false)          { b.push(0xc2); return; }
    if (v === true)           { b.push(0xc3); return; }
    if (typeof v === 'number') {
      if (Number.isInteger(v)) {
        if (v >= 0) {
          if (v <= 0x7f)   b.push(v);
          else if (v <= 0xff)   b.push(0xcc, v);
          else if (v <= 0xffff) b.push(0xcd, v >> 8, v & 0xff);
          else b.push(0xce, (v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff);
        } else {
          if (v >= -32)    b.push(v & 0xff);
          else if (v >= -128)   b.push(0xd0, v & 0xff);
          else if (v >= -32768) b.push(0xd1, (v >> 8) & 0xff, v & 0xff);
          else b.push(0xd2, (v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff);
        }
      } else {
        const ab = new ArrayBuffer(8); new DataView(ab).setFloat64(0, v);
        const by2 = new Uint8Array(ab); b.push(0xcb); for (let i = 0; i < 8; i++) b.push(by2[i]);
      }
      return;
    }
    if (typeof v === 'string') {
      const bytes = te.encode(v), len = bytes.length;
      if (len <= 31) b.push(0xa0 | len);
      else if (len <= 0xff) b.push(0xd9, len);
      else if (len <= 0xffff) b.push(0xda, len >> 8, len & 0xff);
      else b.push(0xdb, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff);
      for (let i = 0; i < bytes.length; i++) b.push(bytes[i]);
      return;
    }
    if (Array.isArray(v)) {
      const len = v.length;
      if (len <= 15) b.push(0x90 | len);
      else if (len <= 0xffff) b.push(0xdc, len >> 8, len & 0xff);
      else b.push(0xdd, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff);
      for (let i = 0; i < len; i++) _enc(v[i], b);
      return;
    }
    if (typeof v === 'object') {
      const keys = Object.keys(v), len = keys.length;
      if (len <= 15) b.push(0x80 | len);
      else if (len <= 0xffff) b.push(0xde, len >> 8, len & 0xff);
      else b.push(0xdf, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff);
      for (const k of keys) { _enc(k, b); _enc(v[k], b); }
    }
  }
  function _dec(s) {
    const b = s.buf[s.pos++];
    if (b <= 0x7f) return b;
    if ((b & 0xe0) === 0xe0) return b - 256;
    if ((b & 0xf0) === 0x90) { const len = b & 0x0f, a = []; for (let i = 0; i < len; i++) a.push(_dec(s)); return a; }
    if ((b & 0xf0) === 0x80) { const len = b & 0x0f, o = {}; for (let i = 0; i < len; i++) { const k = _dec(s); o[k] = _dec(s); } return o; }
    if ((b & 0xe0) === 0xa0) { const len = b & 0x1f; const sl = s.buf.subarray(s.pos, s.pos + len); s.pos += len; return td.decode(sl); }
    switch (b) {
      case 0xc0: return null; case 0xc2: return false; case 0xc3: return true;
      case 0xcb: { const v = new DataView(s.buf.buffer, s.buf.byteOffset + s.pos).getFloat64(0); s.pos += 8; return v; }
      case 0xcc: return s.buf[s.pos++];
      case 0xcd: { const v = (s.buf[s.pos] << 8) | s.buf[s.pos + 1]; s.pos += 2; return v; }
      case 0xce: { const v = ((s.buf[s.pos] << 24) | (s.buf[s.pos + 1] << 16) | (s.buf[s.pos + 2] << 8) | s.buf[s.pos + 3]) >>> 0; s.pos += 4; return v; }
      case 0xd0: { const v = s.buf[s.pos++]; return v >= 0x80 ? v - 256 : v; }
      case 0xd1: { const v = (s.buf[s.pos] << 8) | s.buf[s.pos + 1]; s.pos += 2; return v >= 0x8000 ? v - 65536 : v; }
      case 0xd2: { const v = new DataView(s.buf.buffer, s.buf.byteOffset + s.pos).getInt32(0); s.pos += 4; return v; }
      case 0xd9: { const n = s.buf[s.pos++]; const sl = s.buf.subarray(s.pos, s.pos + n); s.pos += n; return td.decode(sl); }
      case 0xda: { const n = (s.buf[s.pos] << 8) | s.buf[s.pos + 1]; s.pos += 2; const sl = s.buf.subarray(s.pos, s.pos + n); s.pos += n; return td.decode(sl); }
      case 0xdc: { const n = (s.buf[s.pos] << 8) | s.buf[s.pos + 1]; s.pos += 2; const a = []; for (let i = 0; i < n; i++) a.push(_dec(s)); return a; }
      default: throw new Error('msgpack: unknown byte 0x' + b.toString(16));
    }
  }
  mp = {
    encode: (v) => { const b = []; _enc(v, b); return Buffer.from(b); },
    decode: (buf) => { const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf); return _dec({ buf: u, pos: 0 }); }
  };
  console.log('[server] Using built-in msgpack fallback (msgpackr not found)');
}

// ── Config ────────────────────────────────────────────────────────────────────
const PORT      = parseInt(process.env.PORT) || 8082;
const BOT_SCRIPT = path.join(__dirname, 'index.js');

// ── State ─────────────────────────────────────────────────────────────────────
const controllerClients = new Set(); // All connected controller WebSocket connections
const botWorkers        = new Map(); // ws → { worker, hash, tank }

// ── Helpers ───────────────────────────────────────────────────────────────────
function send(ws, ...args) {
  if (ws.readyState === ws.OPEN) {
    try { ws.send(mp.encode(args)); } catch {}
  }
}

/** Broadcast a packet to ALL controller clients (optionally skip one sender) */
function broadcast(args, skip = null) {
  const buf = mp.encode(args);
  for (const client of controllerClients) {
    if (client === skip) continue;
    if (client.readyState === client.OPEN) {
      try { client.send(buf); } catch {}
    }
  }
}

// ── WebSocket Server ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ port: PORT });
console.log(`[server] Listening on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('[server] Controller connected');
  controllerClients.add(ws);
  botWorkers.set(ws, { workers: [] });

  ws.on('message', (raw) => {
    let data;
    try { data = mp.decode(raw); } catch { return; }
    if (!Array.isArray(data) || data.length === 0) return;

    const type = data[0];

    // ── Handshake ──
    if (type === 'M') {
      // Client says hello — reply with a challenge value
      const challenge = Math.floor(Math.random() * 0xffff);
      ws._challenge = challenge;
      send(ws, 'M', challenge);
      return;
    }

    if (type === 'C') {
      // Client confirms handshake
      send(ws, 'Z', 'basic'); // tell client it's ready
      return;
    }

    // ── Spawn bot ──
    if (type === 'F') {
      const hash  = data[1] || '';
      const tank  = ws._currentTank || 'basic';
      console.log(`[server] Spawn bot → hash="${hash}" tank="${tank}"`);
      const worker = fork(BOT_SCRIPT);
      worker.send({ type: 'start', config: { hash, tank, autoRespawn: true } });
      botWorkers.get(ws).workers.push(worker);
      return;
    }

    // ── Kill all bots ──
    if (type === 'B') {
      const entry = botWorkers.get(ws);
      if (entry) {
        for (const w of entry.workers) {
          try { w.send({ type: 'destroy' }); } catch {}
        }
        entry.workers = [];
      }
      console.log('[server] Killed all bots');
      return;
    }

    // ── Tank select ──
    if (type === 'Z') {
      ws._currentTank = data[1];
      const entry = botWorkers.get(ws);
      if (entry) {
        for (const w of entry.workers) {
          try { w.send({ type: 'tankselect', tank: data[1] }); } catch {}
        }
      }
      return;
    }

    // ── Movement ──
    if (type === 'A') {
      const entry = botWorkers.get(ws);
      if (entry) {
        const msg = {
          type: 'position',
          x: data[1], y: data[2],
          mouseX: data[3], mouseY: data[4],
          mouseDown: data[5], rMouseDown: data[6],
          mouse: data[7], feeding: data[8], shift: data[9]
        };
        for (const w of entry.workers) {
          try { w.send(msg); } catch {}
        }
      }
      return;
    }

    // ── 💬 BOTCHAT — make all bot workers say something in-game ─────────────
    // Packet: ["BOTCHAT", text]
    if (type === 'BOTCHAT') {
      const text = String(data[1] || '').slice(0, 120);
      const entry = botWorkers.get(ws);
      if (entry) {
        for (const w of entry.workers) {
          try { w.send({ type: 'chat', text }); } catch {}
        }
      }
      console.log(`[botchat] ${entry ? entry.workers.length : 0} bot(s) → ${text}`);
      return;
    }

    // ── 💬 CHAT — broadcast to all other connected controllers ───────────────
    // Packet: ["CHAT", text, username, role, ts]
    if (type === 'CHAT') {
      const text     = String(data[1] || '').slice(0, 300);
      const username = String(data[2] || 'Unknown').slice(0, 64);
      const role     = String(data[3] || 'guest').slice(0, 16);
      const ts       = typeof data[4] === 'number' ? data[4] : Date.now();

      console.log(`[chat] ${username} (${role}): ${text}`);

      // Echo to every OTHER controller client with the same ts so dedup works.
      broadcast(['CHAT', text, username, role, ts], ws);
      return;
    }
  });

  ws.on('close', () => {
    console.log('[server] Controller disconnected');
    controllerClients.delete(ws);
    const entry = botWorkers.get(ws);
    if (entry) {
      for (const w of entry.workers) {
        try { w.send({ type: 'destroy' }); } catch {}
      }
    }
    botWorkers.delete(ws);
  });

  ws.on('error', (err) => {
    console.error('[server] WS error:', err.message);
  });
});
