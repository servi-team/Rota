import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DB_PATH,
  HttpError,
  addDays,
  addSubject,
  createExam,
  db,
  deleteExam,
  deleteSubject,
  exportCsv,
  getBootstrap,
  getDay,
  getStats,
  listDays,
  listExams,
  listSubjects,
  saveDay,
  todayISO,
  updateSettings,
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT) || 5173;
const HOST = process.env.HOST || '127.0.0.1';
const MAX_BODY = 1_000_000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'Gönderilen veri çok büyük.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'Geçersiz JSON gövdesi.'));
      }
    });
    req.on('error', reject);
  });
}

async function serveStatic(req, res, pathname) {
  let relative;
  try {
    relative = decodeURIComponent(pathname);
  } catch {
    throw new HttpError(400, 'Geçersiz dosya yolu.');
  }
  if (relative === '/' || relative === '') relative = '/index.html';

  const filePath = path.resolve(PUBLIC_DIR, `.${relative}`);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) throw new HttpError(403, 'Erişim yok.');

  let content;
  try {
    content = await readFile(filePath);
  } catch (err) {
    if (err.code === 'ENOENT' || err.code === 'EISDIR') throw new HttpError(404, 'Sayfa bulunamadı.');
    throw err;
  }

  res.writeHead(200, {
    'Content-Type': MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'Content-Length': content.length,
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(req.method === 'HEAD' ? undefined : content);
}

async function handleApi(req, res, url) {
  const { pathname } = url;
  const method = req.method;
  const params = url.searchParams;

  if (pathname === '/api/bootstrap' && method === 'GET') {
    return sendJson(res, 200, getBootstrap());
  }

  if (pathname === '/api/stats' && method === 'GET') {
    return sendJson(res, 200, getStats(Number(params.get('days')) || 30));
  }

  if (pathname === '/api/days' && method === 'GET') {
    const to = params.get('to') || todayISO();
    const from = params.get('from') || addDays(to, -29);
    return sendJson(res, 200, listDays(from, to));
  }

  const dayMatch = pathname.match(/^\/api\/days\/(\d{4}-\d{2}-\d{2})$/);
  if (dayMatch) {
    if (method === 'GET') return sendJson(res, 200, getDay(dayMatch[1]));
    if (method === 'PUT') return sendJson(res, 200, saveDay(dayMatch[1], await readJson(req)));
    throw new HttpError(405, 'Desteklenmeyen metot.');
  }

  if (pathname === '/api/exams' && method === 'GET') {
    return sendJson(res, 200, listExams());
  }
  if (pathname === '/api/exams' && method === 'POST') {
    return sendJson(res, 201, createExam(await readJson(req)));
  }

  const examMatch = pathname.match(/^\/api\/exams\/(\d+)$/);
  if (examMatch && method === 'DELETE') {
    deleteExam(examMatch[1]);
    res.writeHead(204);
    return res.end();
  }

  if (pathname === '/api/settings' && method === 'PUT') {
    return sendJson(res, 200, updateSettings(await readJson(req)));
  }

  if (pathname === '/api/subjects' && method === 'GET') {
    return sendJson(res, 200, listSubjects());
  }
  if (pathname === '/api/subjects' && method === 'POST') {
    const body = await readJson(req);
    return sendJson(res, 201, addSubject(body.name, body.track));
  }

  const subjectMatch = pathname.match(/^\/api\/subjects\/(\d+)$/);
  if (subjectMatch && method === 'DELETE') {
    deleteSubject(Number(subjectMatch[1]));
    res.writeHead(204);
    return res.end();
  }

  if (pathname === '/api/export.csv' && method === 'GET') {
    const csv = exportCsv();
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kocluk-${todayISO()}.csv"`,
      'Content-Length': Buffer.byteLength(csv),
      'Cache-Control': 'no-store',
    });
    return res.end(csv);
  }

  throw new HttpError(404, 'API yolu bulunamadı.');
}

const server = http.createServer(async (req, res) => {
  const started = Date.now();
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
    } else if (req.method === 'GET' || req.method === 'HEAD') {
      await serveStatic(req, res, url.pathname);
    } else {
      throw new HttpError(405, 'Desteklenmeyen metot.');
    }
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    if (status === 500) console.error(err);
    if (!res.headersSent) sendJson(res, status, { error: err.message || 'Sunucu hatası.' });
    else res.end();
  } finally {
    if (!url.pathname.startsWith('/api/')) {
      console.log(`${req.method} ${url.pathname} ${res.statusCode} ${Date.now() - started}ms`);
    }
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} zaten kullanımda. Başka bir port için: PORT=5174 npm start\n`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  Koçluk paneli çalışıyor');
  console.log(`  → http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(`  Veritabanı: ${DB_PATH}`);
  console.log('');
});

function shutdown() {
  server.close(() => {
    try {
      db.close();
    } catch {
      /* zaten kapalı */
    }
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
