#!/usr/bin/env node
/**
 * VersyFlow — local mock/test API (zero dependency).
 *
 * Companion of the app's MOCK data mode: while you click through the
 * frontend, every interaction is spooled by `src/dev/local-backend.ts` and
 * POSTed here. The server persists it (JSONL + snapshots) and serves a
 * dashboard so a manual test session can be inspected, filtered and exported.
 *
 *   node server/mock-api.mjs            # http://localhost:4000
 *   node server/mock-api.mjs --port 4100
 *
 * Endpoints
 *   GET  /api/health              → { ok, uptime, events, snapshots }
 *   POST /api/events              → { events: [{ type, at, payload, … }] }
 *   GET  /api/events?limit=&type=&order=desc
 *   POST /api/snapshot            → { snapshot: { collections: {…} } }
 *   GET  /api/snapshots           → metadata of stored snapshots
 *   GET  /api/snapshots/latest    → newest snapshot payload
 *   GET  /api/summary             → counters used by the dashboard
 *   GET  /api/export              → full JSON export (events + snapshots)
 *   POST /api/reset               → wipe events + snapshots
 *   GET  /                        → dashboard (auto-refresh)
 *
 * Storage lives in `data/mock-backend/` (git-ignored) and can be redirected
 * with `MOCK_DATA_DIR=/path/to/dir`.
 */

import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const PORT = Number(argValue('--port', process.env.MOCK_API_PORT || 4000));
const HOST = argValue('--host', process.env.MOCK_API_HOST || '0.0.0.0');
const DATA_DIR = path.resolve(
  ROOT,
  process.env.MOCK_DATA_DIR || 'data/mock-backend',
);
const EVENTS_FILE = path.join(DATA_DIR, 'events.jsonl');
const SNAPSHOT_DIR = path.join(DATA_DIR, 'snapshots');
const MAX_EVENTS_IN_MEMORY = 5000;

const startedAt = Date.now();

/** @type {Array<Record<string, unknown>>} */
let events = [];
/** @type {Array<{file: string, at: number, bytes: number, counts?: Record<string, number>}>} */
let snapshots = [];

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

async function ensureDirs() {
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  if (!existsSync(EVENTS_FILE)) await writeFile(EVENTS_FILE, '', 'utf8');
}

async function loadState() {
  await ensureDirs();
  try {
    const raw = await readFile(EVENTS_FILE, 'utf8');
    events = raw
      .split('\n')
      .filter(Boolean)
      .slice(-MAX_EVENTS_IN_MEMORY)
      .map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  } catch {
    events = [];
  }
  await refreshSnapshotIndex();
}

async function refreshSnapshotIndex() {
  try {
    const files = (await readdir(SNAPSHOT_DIR)).filter((f) => f.endsWith('.json'));
    const items = [];
    for (const file of files) {
      const full = path.join(SNAPSHOT_DIR, file);
      try {
        const stat = await readFile(full, 'utf8');
        const parsed = JSON.parse(stat);
        items.push({
          file,
          at: Number(parsed?.receivedAt ?? 0),
          bytes: Buffer.byteLength(stat),
          counts: summarizeCounts(parsed?.snapshot),
        });
      } catch {
        /* ignore malformed */
      }
    }
    snapshots = items.sort((a, b) => b.at - a.at).slice(0, 50);
  } catch {
    snapshots = [];
  }
}

function summarizeCounts(snapshot) {
  const collections = snapshot?.collections;
  if (!collections || typeof collections !== 'object') return undefined;
  /** @type {Record<string, number>} */
  const counts = {};
  for (const [key, value] of Object.entries(collections)) {
    counts[key] = Array.isArray(value) ? value.length : 0;
  }
  return counts;
}

async function appendEvents(batch) {
  const lines = batch.map((event) => JSON.stringify(event)).join('\n');
  await writeFile(EVENTS_FILE, `${lines}\n`, { flag: 'a' });
  events.push(...batch);
  if (events.length > MAX_EVENTS_IN_MEMORY) {
    events = events.slice(-MAX_EVENTS_IN_MEMORY);
  }
}

async function saveSnapshot(payload, sessionId) {
  const receivedAt = Date.now();
  const file = `snapshot-${new Date(receivedAt).toISOString().replace(/[:.]/g, '-')}.json`;
  const body = { receivedAt, sessionId: sessionId ?? null, snapshot: payload };
  await writeFile(path.join(SNAPSHOT_DIR, file), JSON.stringify(body, null, 2), 'utf8');
  snapshots.unshift({
    file,
    at: receivedAt,
    bytes: Buffer.byteLength(JSON.stringify(body)),
    counts: summarizeCounts(payload),
  });
  snapshots = snapshots.slice(0, 50);
  return file;
}

async function resetAll() {
  events = [];
  await writeFile(EVENTS_FILE, '', 'utf8');
  const files = await readdir(SNAPSHOT_DIR);
  await Promise.all(
    files
      .filter((f) => f.endsWith('.json'))
      .map((f) => unlink(path.join(SNAPSHOT_DIR, f)).catch(() => {})),
  );
  snapshots = [];
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    ...CORS_HEADERS,
  });
  res.end(payload);
}

function sendHtml(res, status, html) {
  res.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
    'Cache-Control': 'no-store',
    ...CORS_HEADERS,
  });
  res.end(html);
}

function readBody(req, limitBytes = 8 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limitBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function filteredEvents({ limit = 200, type, order = 'desc' }) {
  let list = events;
  if (type) {
    list = list.filter((event) =>
      String(event?.type ?? '').toLowerCase().includes(type.toLowerCase()),
    );
  }
  const sorted = [...list].sort((a, b) => Number(b?.at ?? 0) - Number(a?.at ?? 0));
  if (order === 'asc') sorted.reverse();
  return sorted.slice(0, Math.max(1, Math.min(Number(limit) || 200, 2000)));
}

function summary() {
  /** @type {Record<string, number>} */
  const byType = {};
  const sessions = new Set();
  for (const event of events) {
    const type = String(event?.type ?? 'unknown');
    const prefix = type.split('.')[0];
    byType[prefix] = (byType[prefix] ?? 0) + 1;
    if (event?.sessionId) sessions.add(event.sessionId);
  }
  const last = events.length ? events[events.length - 1] : null;
  return {
    ok: true,
    uptimeMs: Date.now() - startedAt,
    events: events.length,
    sessions: sessions.size,
    byType,
    lastEvent: last
      ? { type: last.type, at: last.at, sessionId: last.sessionId }
      : null,
    snapshots: snapshots.length,
    dataDir: DATA_DIR,
  };
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function dashboardHtml() {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>VersyFlow — Collecteur de tests</title>
<style>
  :root {
    --pink: #d81b97;
    --bg: #fbf9f9;
    --surface: #ffffff;
    --border: #f0e6ec;
    --text: #221a1f;
    --muted: #8a7b83;
    --ok: #16a34a;
    --warn: #d97706;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
  }
  header {
    display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
    justify-content: space-between;
    padding: 18px 24px; background: var(--surface); border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 5;
  }
  h1 { font-size: 17px; margin: 0; letter-spacing: -0.2px; }
  h1 span { color: var(--pink); }
  .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--ok); display: inline-block; margin-right: 6px; }
  .dot.off { background: var(--warn); }
  .status { font-size: 12px; color: var(--muted); display: flex; align-items: center; }
  main { padding: 20px 24px 60px; max-width: 1180px; margin: 0 auto; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; }
  .card .label { font-size: 10px; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); }
  .card .value { font-size: 24px; font-weight: 800; margin-top: 4px; }
  .toolbar { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 14px; }
  input[type=search] {
    flex: 1 1 200px; min-width: 160px; padding: 9px 12px; font-size: 13px;
    border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--text);
  }
  button {
    padding: 8px 14px; font-size: 12.5px; font-weight: 600; border-radius: 999px; cursor: pointer;
    border: 1px solid var(--border); background: var(--surface); color: var(--text); transition: .15s;
  }
  button:hover { border-color: var(--pink); color: var(--pink); }
  button.primary { background: var(--pink); border-color: var(--pink); color: #fff; }
  button.primary:hover { opacity: .9; color: #fff; }
  button.danger:hover { border-color: #dc2626; color: #dc2626; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
  .chip { font-size: 11.5px; padding: 5px 10px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); cursor: pointer; }
  .chip.active { background: var(--pink); border-color: var(--pink); color: #fff; }
  .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; margin-bottom: 20px; }
  .panel h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .07em; color: var(--muted); margin: 0; padding: 12px 16px; border-bottom: 1px solid var(--border); }
  .event { border-bottom: 1px solid var(--border); padding: 10px 16px; }
  .event:last-child { border-bottom: 0; }
  .event-head { display: flex; gap: 10px; align-items: baseline; flex-wrap: wrap; }
  .event-type { font-weight: 700; font-size: 13px; }
  .badge { font-size: 10px; padding: 2px 7px; border-radius: 999px; background: rgba(216,27,151,.1); color: var(--pink); font-weight: 700; text-transform: uppercase; }
  .event-meta { font-size: 11px; color: var(--muted); margin-left: auto; }
  pre { margin: 6px 0 0; padding: 8px 10px; background: #faf5f8; border-radius: 8px; font-size: 11px; overflow: auto; max-height: 220px; white-space: pre-wrap; word-break: break-word; }
  .empty { padding: 26px 16px; text-align: center; color: var(--muted); font-size: 13px; }
  .snap { display: flex; justify-content: space-between; gap: 10px; padding: 9px 16px; border-bottom: 1px solid var(--border); font-size: 12.5px; }
  .snap:last-child { border-bottom: 0; }
  .muted { color: var(--muted); }
  code { background: #faf5f8; padding: 1px 5px; border-radius: 5px; font-size: 11.5px; }
  @media (max-width: 600px) { main { padding: 14px 12px 50px; } }
</style>
</head>
<body>
<header>
  <div>
    <h1>Versy<span>Flow</span> · collecteur de tests manuels</h1>
    <div class="status" id="status"><span class="dot"></span> connexion…</div>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="primary" onclick="location.href='/api/export'">Exporter tout (JSON)</button>
    <button class="danger" onclick="resetAll()">Réinitialiser</button>
  </div>
</header>
<main>
  <div class="cards">
    <div class="card"><div class="label">Événements</div><div class="value" id="stat-events">–</div></div>
    <div class="card"><div class="label">Sessions</div><div class="value" id="stat-sessions">–</div></div>
    <div class="card"><div class="label">Instantanés</div><div class="value" id="stat-snapshots">–</div></div>
    <div class="card"><div class="label">Dernier événement</div><div class="value" id="stat-last" style="font-size:14px">–</div></div>
  </div>

  <div class="toolbar">
    <input id="search" type="search" placeholder="Filtrer (type, référence, chemin…)" oninput="render()" />
    <button onclick="refresh()">Rafraîchir</button>
    <button onclick="toggleLive()" id="live-btn">Pause auto-refresh</button>
  </div>
  <div class="chips" id="chips"></div>

  <div class="panel">
    <h2>Journal des événements</h2>
    <div id="events"><div class="empty">Aucun événement pour le moment. Ouvrez l'app en mode mock.</div></div>
  </div>

  <div class="panel">
    <h2>Instantanés de la base mock</h2>
    <div id="snapshots"><div class="empty">Aucun instantané.</div></div>
  </div>
</main>
<script>
  let allEvents = [];
  let snapshots = [];
  let activePrefix = '';
  let live = true;
  let timer = null;

  const fmtTime = (ms) => new Date(ms).toLocaleTimeString('fr-FR');
  const fmtDate = (ms) => new Date(ms).toLocaleString('fr-FR');

  async function refresh() {
    try {
      const [summary, evts, snaps] = await Promise.all([
        fetch('/api/summary').then((r) => r.json()),
        fetch('/api/events?limit=300').then((r) => r.json()),
        fetch('/api/snapshots').then((r) => r.json()),
      ]);
      allEvents = evts.events || [];
      snapshots = snaps.snapshots || [];
      document.getElementById('stat-events').textContent = summary.events ?? 0;
      document.getElementById('stat-sessions').textContent = summary.sessions ?? 0;
      document.getElementById('stat-snapshots').textContent = summary.snapshots ?? 0;
      document.getElementById('stat-last').textContent = summary.lastEvent
        ? summary.lastEvent.type + ' · ' + fmtTime(summary.lastEvent.at)
        : '–';
      document.getElementById('status').innerHTML =
        '<span class="dot"></span> API locale active · ' + (summary.dataDir || '');
      renderChips(summary.byType || {});
      render();
      renderSnapshots();
    } catch (error) {
      document.getElementById('status').innerHTML =
        '<span class="dot off"></span> serveur injoignable';
    }
  }

  function renderChips(byType) {
    const chips = document.getElementById('chips');
    const entries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    chips.innerHTML =
      '<span class="chip ' + (activePrefix === '' ? 'active' : '') + '" onclick="setPrefix(\\'\\')">Tout (' +
      Object.values(byType).reduce((a, b) => a + b, 0) +
      ')</span>' +
      entries
        .map(
          ([prefix, count]) =>
            '<span class="chip ' + (activePrefix === prefix ? 'active' : '') +
            '" onclick="setPrefix(\\'' + prefix + '\\')">' + prefix + ' (' + count + ')</span>',
        )
        .join('');
  }

  function setPrefix(prefix) {
    activePrefix = prefix;
    renderChips(prefixCounts());
    render();
  }

  function prefixCounts() {
    const out = {};
    for (const e of allEvents) {
      const p = String(e.type || '').split('.')[0];
      out[p] = (out[p] || 0) + 1;
    }
    return out;
  }

  function matches(event) {
    const query = document.getElementById('search').value.trim().toLowerCase();
    const type = String(event.type || '');
    if (activePrefix && !type.startsWith(activePrefix)) return false;
    if (!query) return true;
    return (type + ' ' + JSON.stringify(event.payload || {})).toLowerCase().includes(query);
  }

  function render() {
    const container = document.getElementById('events');
    const list = allEvents.filter(matches);
    if (list.length === 0) {
      container.innerHTML = '<div class="empty">Aucun événement ne correspond au filtre.</div>';
      return;
    }
    container.innerHTML = list
      .map(
        (e) =>
          '<div class="event"><div class="event-head">' +
          '<span class="event-type">' + escapeHtml(String(e.type)) + '</span>' +
          '<span class="badge">' + escapeHtml(String(e.type || '').split('.')[0]) + '</span>' +
          '<span class="event-meta">' + fmtTime(e.at) + ' · ' + escapeHtml(String(e.sessionId || '')) + '</span>' +
          '</div>' +
          (e.payload && Object.keys(e.payload).length
            ? '<pre>' + escapeHtml(JSON.stringify(e.payload, null, 2)) + '</pre>'
            : '') +
          '</div>',
      )
      .join('');
  }

  function renderSnapshots() {
    const container = document.getElementById('snapshots');
    if (!snapshots.length) {
      container.innerHTML = '<div class="empty">Aucun instantané. Utilisez « Envoyer l\\'instantané » dans /dev.</div>';
      return;
    }
    container.innerHTML = snapshots
      .map(
        (s) =>
          '<div class="snap"><span>' + fmtDate(s.at) + '</span>' +
          '<span class="muted">' +
          Object.entries(s.counts || {})
            .map(([k, v]) => k.replace(/_/g, ' ') + ': ' + v)
            .join(' · ') +
          '</span></div>',
      )
      .join('');
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function toggleLive() {
    live = !live;
    document.getElementById('live-btn').textContent = live
      ? 'Pause auto-refresh'
      : 'Reprendre auto-refresh';
    schedule();
  }

  function schedule() {
    if (timer) clearInterval(timer);
    timer = live ? setInterval(refresh, 4000) : null;
  }

  async function resetAll() {
    if (!confirm('Supprimer tous les événements et instantanés collectés ?')) return;
    await fetch('/api/reset', { method: 'POST' });
    refresh();
  }

  refresh();
  schedule();
</script>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }

  try {
    // Dashboard
    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      sendHtml(res, 200, dashboardHtml());
      return;
    }

    if (req.method === 'GET' && pathname === '/api/health') {
      sendJson(res, 200, { ok: true, ...summary() });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/summary') {
      sendJson(res, 200, summary());
      return;
    }

    if (req.method === 'GET' && pathname === '/api/events') {
      sendJson(res, 200, {
        events: filteredEvents({
          limit: url.searchParams.get('limit') ?? 200,
          type: url.searchParams.get('type') ?? undefined,
          order: url.searchParams.get('order') ?? 'desc',
        }),
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/events') {
      const body = await readBody(req);
      const batch = Array.isArray(body?.events)
        ? body.events
        : Array.isArray(body)
          ? body
          : body?.event
            ? [body.event]
            : [];
      const received = batch
        .filter((event) => event && typeof event === 'object')
        .map((event) => ({
          receivedAt: Date.now(),
          ...event,
        }));
      if (received.length > 0) await appendEvents(received);
      sendJson(res, 200, { ok: true, received: received.length, total: events.length });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/snapshots') {
      await refreshSnapshotIndex();
      sendJson(res, 200, { snapshots });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/snapshots/latest') {
      if (snapshots.length === 0) {
        sendJson(res, 404, { ok: false, error: 'No snapshot stored yet' });
        return;
      }
      const raw = await readFile(path.join(SNAPSHOT_DIR, snapshots[0].file), 'utf8');
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        ...CORS_HEADERS,
      });
      res.end(raw);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/snapshot') {
      const body = await readBody(req);
      const snapshot = body?.snapshot ?? body;
      const file = await saveSnapshot(snapshot, body?.sessionId);
      sendJson(res, 200, { ok: true, file });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/export') {
      await refreshSnapshotIndex();
      const snapshotPayloads = [];
      for (const item of snapshots.slice(0, 10)) {
        try {
          const raw = await readFile(path.join(SNAPSHOT_DIR, item.file), 'utf8');
          snapshotPayloads.push(JSON.parse(raw));
        } catch {
          /* ignore */
        }
      }
      const body = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          summary: summary(),
          events,
          snapshots: snapshotPayloads,
        },
        null,
        2,
      );
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="versyflow-test-collector-${new Date()
          .toISOString()
          .slice(0, 19)}.json"`,
        'Content-Length': Buffer.byteLength(body),
        ...CORS_HEADERS,
      });
      res.end(body);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/reset') {
      await resetAll();
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 404, { ok: false, error: `Not found: ${pathname}` });
  } catch (error) {
    console.error('[mock-api]', error);
    sendJson(res, 500, {
      ok: false,
      error: error instanceof Error ? error.message : 'Internal error',
    });
  }
});

await loadState();
server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  VersyFlow — API de test locale');
  console.log(`  ├─ API      : http://localhost:${PORT}/api`);
  console.log(`  ├─ Dashboard: http://localhost:${PORT}/`);
  console.log(`  └─ Données  : ${DATA_DIR}`);
  console.log('');
  console.log('  Astuce : npm run dev:mock démarre Vite + cette API ensemble.');
  console.log('');
});

const shutdown = async () => {
  console.log('\n[mock-api] arrêt…');
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
