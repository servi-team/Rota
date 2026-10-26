import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'data', 'kocluk.db');

mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    student_name TEXT NOT NULL DEFAULT 'Öğrenci',
    daily_questions INTEGER NOT NULL DEFAULT 120,
    daily_minutes INTEGER NOT NULL DEFAULT 240,
    weekly_questions INTEGER NOT NULL DEFAULT 800,
    weekly_minutes INTEGER NOT NULL DEFAULT 1500
  );

  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    track TEXT NOT NULL DEFAULT 'TYT',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS days (
    date TEXT PRIMARY KEY,
    study_minutes INTEGER NOT NULL DEFAULT 0,
    mood INTEGER,
    note TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS day_subjects (
    date TEXT NOT NULL REFERENCES days(date) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    questions INTEGER NOT NULL DEFAULT 0,
    correct INTEGER,
    wrong INTEGER,
    PRIMARY KEY (date, subject_id)
  );

  CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exam_results (
    exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE RESTRICT,
    correct INTEGER NOT NULL DEFAULT 0,
    wrong INTEGER NOT NULL DEFAULT 0,
    blank INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (exam_id, subject_id)
  );

  CREATE INDEX IF NOT EXISTS idx_day_subjects_date ON day_subjects(date);
  CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(date);
`);

/* ---------------------------------------------------------------- seed */

const SCHEMA_VERSION = 2;

const SEED_SUBJECTS = [
  ['Türkçe', 'TYT', 10],
  ['Sosyal Bilimler', 'TYT', 20],
  ['Temel Matematik', 'TYT', 30],
  ['TYT Fizik', 'TYT', 40],
  ['TYT Kimya', 'TYT', 50],
  ['TYT Biyoloji', 'TYT', 60],
  ['Matematik', 'AYT', 70],
  ['Fizik', 'AYT', 80],
  ['Kimya', 'AYT', 90],
  ['Biyoloji', 'AYT', 100],
  ['Edebiyat', 'AYT', 110],
  ['Tarih', 'AYT', 120],
  ['Coğrafya', 'AYT', 130],
];

const insertSubject = db.prepare('INSERT OR IGNORE INTO subjects (name, track, sort_order) VALUES (?, ?, ?)');

// Version 1 shipped a single "Fen Bilimleri" row for TYT. Version 2 splits it
// into physics, chemistry and biology so each can be tracked separately.
// Historical rows cannot be split, so if the old subject already has data it
// is kept as "TYT Fizik" (old aggregate) instead of being dropped.
function migrateTytScience() {
  const legacy = db.prepare("SELECT id FROM subjects WHERE name = 'Fen Bilimleri' AND track = 'TYT'").get();
  if (legacy) {
    const usedDaily = db.prepare('SELECT COUNT(*) AS n FROM day_subjects WHERE subject_id = ?').get(legacy.id).n;
    const usedExam = db.prepare('SELECT COUNT(*) AS n FROM exam_results WHERE subject_id = ?').get(legacy.id).n;
    const target = db.prepare("SELECT id FROM subjects WHERE name = 'TYT Fizik'").get();
    if (usedDaily + usedExam === 0) {
      db.prepare('DELETE FROM subjects WHERE id = ?').run(legacy.id);
    } else if (!target) {
      db.prepare("UPDATE subjects SET name = 'TYT Fizik', sort_order = 40 WHERE id = ?").run(legacy.id);
    }
  }
  insertSubject.run('TYT Fizik', 'TYT', 40);
  insertSubject.run('TYT Kimya', 'TYT', 50);
  insertSubject.run('TYT Biyoloji', 'TYT', 60);
}

const schemaVersion = db.prepare('PRAGMA user_version').get().user_version;
if (schemaVersion < SCHEMA_VERSION) {
  transaction(() => {
    if (db.prepare('SELECT COUNT(*) AS n FROM subjects').get().n === 0) {
      for (const row of SEED_SUBJECTS) insertSubject.run(...row);
    }
    if (schemaVersion < 2) migrateTytScience();
  });
  db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
db.prepare('INSERT OR IGNORE INTO settings (id) VALUES (1)').run();

/* --------------------------------------------------------------- dates */

export function todayISO(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

export function startOfWeek(iso) {
  const d = parseISO(iso);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return todayISO(d);
}

export function isValidDate(iso) {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  return todayISO(parseISO(iso)) === iso;
}

/* -------------------------------------------------------------- errors */

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/* ------------------------------------------------------------ helpers */

function int(value, fallback = 0, min = 0, max = 1_000_000) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function nullableInt(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function text(value, maxLength = 2000) {
  return String(value ?? '').slice(0, maxLength).trim();
}

function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

/* ------------------------------------------------------------- settings */

export function getSettings() {
  return db.prepare('SELECT * FROM settings WHERE id = 1').get();
}

export function updateSettings(patch) {
  const current = getSettings();
  const next = {
    student_name: text(patch.student_name ?? current.student_name, 60) || 'Öğrenci',
    daily_questions: int(patch.daily_questions ?? current.daily_questions, 120, 0, 2000),
    daily_minutes: int(patch.daily_minutes ?? current.daily_minutes, 240, 0, 1440),
    weekly_questions: int(patch.weekly_questions ?? current.weekly_questions, 800, 0, 10000),
    weekly_minutes: int(patch.weekly_minutes ?? current.weekly_minutes, 1500, 0, 10080),
  };
  db.prepare(`
    UPDATE settings
       SET student_name = ?, daily_questions = ?, daily_minutes = ?,
           weekly_questions = ?, weekly_minutes = ?
     WHERE id = 1
  `).run(next.student_name, next.daily_questions, next.daily_minutes, next.weekly_questions, next.weekly_minutes);
  return getSettings();
}

/* ------------------------------------------------------------- subjects */

export function listSubjects() {
  return db.prepare("SELECT * FROM subjects ORDER BY CASE track WHEN 'TYT' THEN 0 WHEN 'AYT' THEN 1 WHEN 'YDT' THEN 2 ELSE 3 END, sort_order, name").all();
}

export function addSubject(name, track) {
  const cleanName = text(name, 40);
  const cleanTrack = ['TYT', 'AYT', 'YDT', 'DİĞER'].includes(track) ? track : 'TYT';
  if (!cleanName) throw new HttpError(400, 'Ders adı boş olamaz.');
  const exists = db.prepare('SELECT id FROM subjects WHERE lower(name) = lower(?)').get(cleanName);
  if (exists) throw new HttpError(409, 'Bu isimde bir ders zaten var.');
  const order = (db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS n FROM subjects').get().n || 0) + 10;
  const info = db.prepare('INSERT INTO subjects (name, track, sort_order) VALUES (?, ?, ?)').run(cleanName, cleanTrack, order);
  return db.prepare('SELECT * FROM subjects WHERE id = ?').get(Number(info.lastInsertRowid));
}

export function deleteSubject(id) {
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
  if (!subject) throw new HttpError(404, 'Ders bulunamadı.');
  const usedDaily = db.prepare('SELECT COUNT(*) AS n FROM day_subjects WHERE subject_id = ?').get(id).n;
  const usedExam = db.prepare('SELECT COUNT(*) AS n FROM exam_results WHERE subject_id = ?').get(id).n;
  if (usedDaily + usedExam > 0) {
    throw new HttpError(409, 'Bu derse ait kayıtlar var, silinemez. Geçmişi korumak için dersi bırakabilirsin.');
  }
  db.prepare('DELETE FROM subjects WHERE id = ?').run(id);
}

/* ----------------------------------------------------------------- days */

export function getDay(date) {
  if (!isValidDate(date)) throw new HttpError(400, 'Geçersiz tarih.');
  const day = db.prepare('SELECT * FROM days WHERE date = ?').get(date);
  const subjects = db.prepare(`
    SELECT subject_id, questions, correct, wrong
      FROM day_subjects WHERE date = ?
  `).all(date);
  return {
    date,
    study_minutes: day?.study_minutes ?? 0,
    mood: day?.mood ?? null,
    note: day?.note ?? '',
    subjects,
    exists: Boolean(day),
  };
}

export function saveDay(date, payload) {
  if (!isValidDate(date)) throw new HttpError(400, 'Geçersiz tarih.');
  const minutes = int(payload.study_minutes, 0, 0, 1440);
  const mood = nullableInt(payload.mood, 1, 5);
  const note = text(payload.note, 2000);
  const validSubjects = new Set(listSubjects().map((s) => s.id));

  const rows = [];
  for (const raw of Array.isArray(payload.subjects) ? payload.subjects.slice(0, 50) : []) {
    const subjectId = Number(raw?.subject_id);
    if (!validSubjects.has(subjectId)) continue;
    const questions = int(raw.questions, 0, 0, 5000);
    const correct = nullableInt(raw.correct, 0, 5000);
    const wrong = nullableInt(raw.wrong, 0, 5000);
    if (questions === 0 && correct === null && wrong === null) continue;
    rows.push([date, subjectId, questions, correct, wrong]);
  }

  return transaction(() => {
    if (minutes === 0 && mood === null && note === '' && rows.length === 0) {
      db.prepare('DELETE FROM days WHERE date = ?').run(date);
      return getDay(date);
    }

    db.prepare(`
      INSERT INTO days (date, study_minutes, mood, note, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(date) DO UPDATE SET
        study_minutes = excluded.study_minutes,
        mood = excluded.mood,
        note = excluded.note,
        updated_at = excluded.updated_at
    `).run(date, minutes, mood, note);

    db.prepare('DELETE FROM day_subjects WHERE date = ?').run(date);
    const insert = db.prepare('INSERT INTO day_subjects (date, subject_id, questions, correct, wrong) VALUES (?, ?, ?, ?, ?)');
    for (const row of rows) insert.run(...row);
    return getDay(date);
  });
}

export function listDays(from, to) {
  if (!isValidDate(from) || !isValidDate(to)) throw new HttpError(400, 'Geçersiz tarih aralığı.');
  const rows = db.prepare(`
    SELECT d.date, d.study_minutes, d.mood, d.note,
           COALESCE(SUM(s.questions), 0) AS questions,
           COALESCE(SUM(s.correct), 0) AS correct,
           COALESCE(SUM(s.wrong), 0) AS wrong
      FROM days d
      LEFT JOIN day_subjects s ON s.date = d.date
     WHERE d.date BETWEEN ? AND ?
     GROUP BY d.date
     ORDER BY d.date DESC
  `).all(from, to);
  return rows.map((r) => ({ ...r, net: round1(r.correct - r.wrong / 4) }));
}

/* ---------------------------------------------------------------- stats */

function round1(n) {
  return Math.round(n * 10) / 10;
}

function currentStreak(today) {
  const active = new Set(
    db.prepare(`
      SELECT date FROM days
       WHERE study_minutes > 0
          OR EXISTS (SELECT 1 FROM day_subjects s WHERE s.date = days.date AND s.questions > 0)
    `).all().map((r) => r.date),
  );
  let cursor = active.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (active.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function getStats(days = 30) {
  const span = Math.min(365, Math.max(1, int(days, 30, 1, 365)));
  const today = todayISO();
  const start = addDays(today, -(span - 1));
  const settings = getSettings();

  const byDate = new Map(
    db.prepare(`
      SELECT d.date, d.study_minutes AS minutes, d.mood,
             COALESCE(SUM(s.questions), 0) AS questions
        FROM days d
        LEFT JOIN day_subjects s ON s.date = d.date
       WHERE d.date BETWEEN ? AND ?
       GROUP BY d.date
    `).all(start, today).map((r) => [r.date, r]),
  );

  const series = [];
  for (let i = 0; i < span; i += 1) {
    const date = addDays(start, i);
    const row = byDate.get(date);
    series.push({
      date,
      questions: row?.questions ?? 0,
      minutes: row?.minutes ?? 0,
      mood: row?.mood ?? null,
    });
  }

  const totalQuestions = series.reduce((sum, d) => sum + d.questions, 0);
  const totalMinutes = series.reduce((sum, d) => sum + d.minutes, 0);
  const activeDays = series.filter((d) => d.questions > 0 || d.minutes > 0).length;
  const moodValues = series.map((d) => d.mood).filter((m) => m != null);

  const todayRow = getDay(today);
  const todayQuestions = todayRow.subjects.reduce((sum, s) => sum + s.questions, 0);
  const todayCorrect = todayRow.subjects.reduce((sum, s) => sum + (s.correct ?? 0), 0);
  const todayWrong = todayRow.subjects.reduce((sum, s) => sum + (s.wrong ?? 0), 0);

  const weekStart = startOfWeek(today);
  const weekEnd = addDays(weekStart, 6);
  const prevStart = addDays(weekStart, -7);
  const prevEnd = addDays(weekStart, -1);
  const rangeSum = (a, b) => {
    const row = db.prepare(`
      SELECT COALESCE(SUM(s.questions), 0) AS questions,
             COALESCE((SELECT SUM(study_minutes) FROM days WHERE date BETWEEN ? AND ?), 0) AS minutes
        FROM day_subjects s
       WHERE s.date BETWEEN ? AND ?
    `).get(a, b, a, b);
    return { questions: row.questions, minutes: row.minutes };
  };

  const subjects = db.prepare(`
    SELECT sub.id, sub.name, sub.track,
           SUM(s.questions) AS questions,
           SUM(COALESCE(s.correct, 0)) AS correct,
           SUM(COALESCE(s.wrong, 0)) AS wrong,
           COUNT(*) AS entries
      FROM day_subjects s
      JOIN subjects sub ON sub.id = s.subject_id
     WHERE s.date BETWEEN ? AND ?
     GROUP BY sub.id
     ORDER BY questions DESC, sub.sort_order
  `).all(start, today).map((r) => ({
    ...r,
    net: round1(r.correct - r.wrong / 4),
    hasAccuracy: r.correct + r.wrong > 0,
  }));

  return {
    today: {
      date: today,
      questions: todayQuestions,
      minutes: todayRow.study_minutes,
      mood: todayRow.mood,
      net: round1(todayCorrect - todayWrong / 4),
    },
    goals: settings,
    streak: currentStreak(today),
    week: { start: weekStart, end: weekEnd, ...rangeSum(weekStart, weekEnd) },
    lastWeek: { start: prevStart, end: prevEnd, ...rangeSum(prevStart, prevEnd) },
    range: {
      days: span,
      start,
      end: today,
      questions: totalQuestions,
      minutes: totalMinutes,
      activeDays,
      avgQuestions: Math.round(totalQuestions / span),
      avgMinutes: Math.round(totalMinutes / span),
      perActiveDayQuestions: activeDays ? Math.round(totalQuestions / activeDays) : 0,
      perActiveDayMinutes: activeDays ? Math.round(totalMinutes / activeDays) : 0,
      moodAvg: moodValues.length ? round1(moodValues.reduce((a, b) => a + b, 0) / moodValues.length) : null,
    },
    series,
    subjects,
  };
}

/* ---------------------------------------------------------------- exams */

const EXAM_TYPES = new Set(['TYT', 'AYT', 'YDT', 'BRANŞ']);

function examRows() {
  return db.prepare(`
    SELECT e.id, e.date, e.type, e.name, e.note,
           COALESCE(SUM(r.correct), 0) AS correct,
           COALESCE(SUM(r.wrong), 0) AS wrong,
           COALESCE(SUM(r.blank), 0) AS blank
      FROM exams e
      LEFT JOIN exam_results r ON r.exam_id = e.id
     GROUP BY e.id
     ORDER BY e.date DESC, e.id DESC
  `).all().map((exam) => {
    const results = db.prepare(`
      SELECT r.subject_id, sub.name, sub.track, r.correct, r.wrong, r.blank
        FROM exam_results r
        JOIN subjects sub ON sub.id = r.subject_id
       WHERE r.exam_id = ?
       ORDER BY sub.sort_order
    `).all(exam.id).map((r) => ({ ...r, net: round1(r.correct - r.wrong / 4) }));
    return {
      ...exam,
      net: round1(exam.correct - exam.wrong / 4),
      results,
    };
  });
}

export function listExams() {
  return examRows();
}

export function createExam(payload) {
  const date = payload.date;
  if (!isValidDate(date)) throw new HttpError(400, 'Geçersiz tarih.');
  const type = String(payload.type ?? 'TYT').toUpperCase();
  if (!EXAM_TYPES.has(type === 'BRANS' ? 'BRANŞ' : type)) throw new HttpError(400, 'Geçersiz sınav türü.');
  const name = text(payload.name, 80);
  const note = text(payload.note, 1000);
  const validSubjects = new Map(listSubjects().map((s) => [s.id, s]));

  const rows = [];
  for (const raw of Array.isArray(payload.results) ? payload.results.slice(0, 50) : []) {
    const subjectId = Number(raw?.subject_id);
    if (!validSubjects.has(subjectId)) continue;
    const correct = int(raw.correct, 0, 0, 500);
    const wrong = int(raw.wrong, 0, 0, 500);
    const blank = int(raw.blank, 0, 0, 500);
    if (correct + wrong + blank === 0) continue;
    rows.push([subjectId, correct, wrong, blank]);
  }
  if (rows.length === 0) throw new HttpError(400, 'En az bir ders için sonuç gir.');

  return transaction(() => {
    const info = db.prepare('INSERT INTO exams (date, type, name, note) VALUES (?, ?, ?, ?)').run(date, type, name, note);
    const examId = Number(info.lastInsertRowid);
    const insert = db.prepare('INSERT INTO exam_results (exam_id, subject_id, correct, wrong, blank) VALUES (?, ?, ?, ?, ?)');
    for (const row of rows) insert.run(examId, ...row);
    return examRows().find((e) => e.id === examId);
  });
}

export function deleteExam(id) {
  const info = db.prepare('DELETE FROM exams WHERE id = ?').run(Number(id));
  if (info.changes === 0) throw new HttpError(404, 'Deneme bulunamadı.');
}

/* ------------------------------------------------------------------ csv */

function csvCell(value) {
  const s = String(value ?? '');
  return /[;"\n\r]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

export function exportCsv() {
  const rows = db.prepare(`
    SELECT d.date, d.study_minutes, d.mood, d.note,
           sub.name AS subject, sub.track,
           s.questions, s.correct, s.wrong
      FROM days d
      LEFT JOIN day_subjects s ON s.date = d.date
      LEFT JOIN subjects sub ON sub.id = s.subject_id
     ORDER BY d.date, sub.sort_order
  `).all();

  const lines = ['tarih;ders;sinav_grubu;soru;dogru;yanlis;calisma_dakikasi;ruh_hali;not'];
  for (const r of rows) {
    lines.push([
      r.date,
      r.subject ?? '',
      r.track ?? '',
      r.questions ?? '',
      r.correct ?? '',
      r.wrong ?? '',
      r.study_minutes,
      r.mood ?? '',
      r.note,
    ].map(csvCell).join(';'));
  }
  return '\uFEFF' + lines.join('\r\n');
}

export function getBootstrap() {
  return {
    settings: getSettings(),
    subjects: listSubjects(),
    today: todayISO(),
    dbPath: DB_PATH,
  };
}
