/* Koçluk paneli — bağımlılıksız istemci */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
const WEEKDAYS_SHORT = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const MOOD_COLORS = ['#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399'];

const state = {
  settings: null,
  subjects: [],
  today: localISO(new Date()),
  date: localISO(new Date()),
  day: null,
  stats: null,
  days: [],
  heat: null,
  exams: [],
  mood: null,
  rangeDays: 30,
  examChartType: 'TYT',
  historyLoaded: false,
  examsLoaded: false,
};

let dayDirty = false;

/* ------------------------------------------------------------- helpers */

function localISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return localISO(d);
}

function weekdayIndex(iso) {
  return (parseISO(iso).getDay() + 6) % 7;
}

function fmtDate(iso, style = 'short') {
  const d = parseISO(iso);
  const day = d.getDate();
  const month = MONTHS[d.getMonth()];
  if (style === 'short') return `${day} ${month.slice(0, 3)}`;
  if (style === 'day') return `${day}`;
  return `${day} ${month} ${d.getFullYear()}`;
}

function fmtDateLong(iso) {
  return `${fmtDate(iso, 'long')}, ${WEEKDAYS[weekdayIndex(iso)]}`;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

function fmtMinutes(total) {
  const m = Math.max(0, Math.round(Number(total) || 0));
  if (m === 0) return '0 dk';
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h === 0) return `${rest} dk`;
  if (rest === 0) return `${h} saat`;
  return `${h}sa ${rest}dk`;
}

function fmtNum(n) {
  return Number(n || 0).toLocaleString('tr-TR');
}

function fmtNet(n) {
  const value = Math.round((Number(n) || 0) * 10) / 10;
  return value.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
}

function pct(value, goal) {
  if (!goal) return 0;
  return Math.round((value / goal) * 100);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* boş gövde */
  }
  if (!res.ok) throw new Error(data?.error || `İstek başarısız (${res.status}).`);
  return data;
}

let toastTimer = null;
function toast(message, isError = false) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.toggle('error', isError);
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* --------------------------------------------------------------- init */

async function init() {
  bindEvents();

  try {
    const boot = await api('/api/bootstrap');
    state.settings = boot.settings;
    state.subjects = boot.subjects;
    state.today = boot.today;
    state.date = boot.today;

    $('#dbPath').textContent = boot.dbPath;
    $('#studentName').textContent = `${boot.settings.student_name} · YKS 2027`;
    document.title = `${boot.settings.student_name} · Koçluk`;

    $('#dateInput').max = boot.today;
    $('#examDate').value = boot.today;

    renderSettingsForm();
    renderSubjectManager();
    renderExamResults();
    await loadDay();
    await loadStats();
  } catch (err) {
    toast(err.message, true);
  }
}

function bindEvents() {
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
  $$('[data-tab-link]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    switchTab(link.dataset.tabLink);
  }));

  $('#prevDay').addEventListener('click', () => changeDate(addDays(state.date, -1)));
  $('#nextDay').addEventListener('click', () => changeDate(addDays(state.date, 1)));
  $('#todayBtn').addEventListener('click', () => changeDate(state.today));
  $('#dateInput').addEventListener('change', (event) => {
    const value = event.target.value;
    if (!value) return;
    changeDate(value > state.today ? state.today : value);
  });

  $('#dayForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveDay();
  });
  $('#dayForm').addEventListener('input', () => {
    dayDirty = true;
  });
  $('#dayForm').addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      saveDay();
    }
  });

  window.addEventListener('beforeunload', (event) => {
    if (!dayDirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  $('#minutesInput').addEventListener('input', () => {
    syncForm();
    updateMinuteChips();
  });

  $('#minuteChips').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-min]');
    if (!btn) return;
    $('#minutesInput').value = btn.dataset.min;
    dayDirty = true;
    syncForm();
    updateMinuteChips();
  });

  $('#moodRow').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-mood]');
    if (!btn) return;
    const mood = Number(btn.dataset.mood);
    state.mood = state.mood === mood ? null : mood;
    dayDirty = true;
    renderMood();
  });

  $('#subjectRows').addEventListener('input', syncForm);
  $('#subjectRows').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-step]');
    if (!btn) return;
    const input = $('input.q', btn.closest('.subject-row'));
    const step = event.shiftKey ? 1 : Number(btn.dataset.step);
    input.value = clamp((Number(input.value) || 0) + step, 0, 5000);
    dayDirty = true;
    syncForm();
  });

  $('#rangeToggle').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-days]');
    if (!btn) return;
    state.rangeDays = Number(btn.dataset.days);
    $$('#rangeToggle button').forEach((b) => b.classList.toggle('active', b === btn));
    loadHistory().catch((err) => toast(err.message, true));
  });

  $('#daysTableBody').addEventListener('click', (event) => {
    const row = event.target.closest('tr[data-date]');
    if (!row) return;
    openDay(row.dataset.date);
  });

  $('#examType').addEventListener('change', renderExamResults);
  $('#examResults').addEventListener('input', updateExamLiveNet);
  $('#examForm').addEventListener('submit', saveExam);

  $('#examTypeFilter').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-type]');
    if (!btn) return;
    state.examChartType = btn.dataset.type;
    $$('#examTypeFilter button').forEach((b) => b.classList.toggle('active', b === btn));
    renderExamChart();
  });

  $('#examList').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-delete-exam]');
    if (!btn) return;
    deleteExam(Number(btn.dataset.deleteExam));
  });

  $('#settingsForm').addEventListener('submit', saveSettings);
  $('#subjectForm').addEventListener('submit', addSubject);
  $('#subjectManager').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-del-subject]');
    if (!btn) return;
    removeSubject(Number(btn.dataset.delSubject));
  });
}

function switchTab(name) {
  $$('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === name));
  $$('.tab-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `tab-${name}`));

  if (name === 'gecmis' && !state.historyLoaded) {
    state.historyLoaded = true;
    loadHistory().catch((err) => {
      state.historyLoaded = false;
      toast(err.message, true);
    });
  } else if (name === 'gecmis') {
    renderRange();
  }
  if (name === 'denemeler' && !state.examsLoaded) {
    state.examsLoaded = true;
    loadExams().catch((err) => {
      state.examsLoaded = false;
      toast(err.message, true);
    });
  }
  if (name === 'bugun') renderDayStats();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------------------------------------------------------------- day */

async function loadDay() {
  const day = await api(`/api/days/${state.date}`);
  state.day = day;
  dayDirty = false;
  renderDayHeader();
  renderDayForm();
  renderDayStats();
}

function renderDayHeader() {
  const isToday = state.date === state.today;
  const isYesterday = state.date === addDays(state.today, -1);

  let eyebrow;
  if (isToday) eyebrow = `Bugün · ${fmtDateLong(state.date)}`;
  else if (isYesterday) eyebrow = `Dün · ${fmtDateLong(state.date)}`;
  else eyebrow = fmtDateLong(state.date);

  $('#dayEyebrow').textContent = eyebrow;
  $('#dayTitle').textContent = isToday ? 'Günlük kayıt' : 'Geçmiş kayıt';
  $('#dateInput').value = state.date;
  $('#dateInput').max = state.today;
  $('#nextDay').disabled = state.date >= state.today;
  $('#todayBtn').style.opacity = isToday ? '0.5' : '1';
}

function renderDayForm() {
  const day = state.day;
  state.mood = day.mood ?? null;

  $('#minutesInput').value = day.study_minutes || 0;
  $('#minutesHint').textContent = `Günlük hedef: ${fmtMinutes(state.settings.daily_minutes)} · ${fmtNum(state.settings.daily_questions)} soru`;
  $('#noteInput').value = day.note || '';

  const bySubject = new Map(day.subjects.map((s) => [s.subject_id, s]));
  $('#subjectRows').innerHTML = state.subjects.map((subject) => {
    const row = bySubject.get(subject.id) ?? {};
    return subjectRowHTML(subject, row);
  }).join('');

  renderMood();
  updateMinuteChips();
  syncForm();
}

function subjectRowHTML(subject, row) {
  return `
    <div class="subject-row" data-id="${subject.id}">
      <div class="subject-name">
        <span title="${esc(subject.name)}">${esc(subject.name)}</span>
        <span class="track-tag">${esc(subject.track)}</span>
      </div>
      <div class="stepper">
        <button type="button" data-step="-5" aria-label="azalt" title="Shift ile 1 azalt">−</button>
        <input class="q" type="number" min="0" max="5000" step="1" inputmode="numeric"
               value="${row.questions ?? 0}" aria-label="${esc(subject.name)} soru sayısı">
        <button type="button" data-step="5" aria-label="artır" title="Shift ile 1 artır">+</button>
      </div>
      <label class="acc c"><span>DOĞRU</span>
        <input class="accuracy c" type="number" min="0" max="5000" step="1" inputmode="numeric"
               value="${row.correct ?? ''}" placeholder="—" aria-label="${esc(subject.name)} doğru">
      </label>
      <label class="acc w"><span>YANLIŞ</span>
        <input class="accuracy w" type="number" min="0" max="5000" step="1" inputmode="numeric"
               value="${row.wrong ?? ''}" placeholder="—" aria-label="${esc(subject.name)} yanlış">
      </label>
    </div>
  `;
}

function renderMood() {
  $$('#moodRow .mood').forEach((btn) => {
    const active = Number(btn.dataset.mood) === state.mood;
    btn.classList.toggle('active', active);
    btn.style.background = active ? MOOD_COLORS[Number(btn.dataset.mood) - 1] : '';
  });
}

function updateMinuteChips() {
  const minutes = Number($('#minutesInput').value) || 0;
  $$('#minuteChips button').forEach((btn) => {
    btn.classList.toggle('active', minutes > 0 && Number(btn.dataset.min) === minutes);
  });
}

function collectDay() {
  const subjects = $$('#subjectRows .subject-row').map((row) => {
    const correct = $('input.c', row).value;
    const wrong = $('input.w', row).value;
    return {
      subject_id: Number(row.dataset.id),
      questions: Number($('input.q', row).value) || 0,
      correct: correct === '' ? null : Number(correct),
      wrong: wrong === '' ? null : Number(wrong),
    };
  });

  return {
    study_minutes: Number($('#minutesInput').value) || 0,
    mood: state.mood,
    note: $('#noteInput').value,
    subjects,
  };
}

function formTotals() {
  let questions = 0;
  let correct = 0;
  let wrong = 0;
  let accuracyEntered = false;

  $$('#subjectRows .subject-row').forEach((row) => {
    questions += Number($('input.q', row).value) || 0;
    const c = $('input.c', row).value;
    const w = $('input.w', row).value;
    if (c !== '') { correct += Number(c) || 0; accuracyEntered = true; }
    if (w !== '') { wrong += Number(w) || 0; accuracyEntered = true; }
  });

  return {
    questions,
    correct,
    wrong,
    accuracyEntered,
    minutes: Number($('#minutesInput').value) || 0,
    net: correct - wrong / 4,
  };
}

function syncForm() {
  const totals = formTotals();
  $('#liveQuestions').textContent = `${fmtNum(totals.questions)} soru`;
  $('#liveAccuracy').textContent = totals.accuracyEntered ? `net ${fmtNet(totals.net)}` : '';
  $('#saveSummary').textContent = `${fmtNum(totals.questions)} soru · ${fmtMinutes(totals.minutes)}`;
  renderDayStats();
}

async function saveDay() {
  const btn = $('#saveDayBtn');
  const form = $('#dayForm');
  btn.disabled = true;
  btn.textContent = 'Kaydediliyor…';
  form.classList.add('saving');

  let saved = false;
  try {
    const day = await api(`/api/days/${state.date}`, {
      method: 'PUT',
      body: JSON.stringify(collectDay()),
    });
    state.day = day;
    dayDirty = false;
    saved = true;
    toast(day.exists ? 'Gün kaydedildi.' : 'Boş gün kaydı silindi.');
  } catch (err) {
    toast(err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Kaydet';
    form.classList.remove('saving');
  }

  if (!saved) return;
  try {
    if (state.historyLoaded) await loadHistory();
    else await loadStats();
  } catch {
    /* kayıt başarılı; özet yenilenemese de sorun değil */
  }
  renderDayStats();
}

function changeDate(date) {
  const next = date > state.today ? state.today : date;
  if (next === state.date) {
    $('#dateInput').value = state.date;
    return;
  }
  if (dayDirty && !window.confirm('Kaydedilmemiş değişiklikler var. Yine de başka güne geçilsin mi?')) {
    $('#dateInput').value = state.date;
    return;
  }
  state.date = next;
  loadDay().catch((err) => toast(err.message, true));
}

function openDay(date) {
  if (date === state.date) {
    switchTab('bugun');
    return;
  }
  if (dayDirty && !window.confirm('Kaydedilmemiş değişiklikler var. Yine de başka güne geçilsin mi?')) {
    return;
  }
  state.date = date;
  switchTab('bugun');
  loadDay().catch((err) => toast(err.message, true));
}

/* ----------------------------------------------------------- day stats */

function statCard({ label, value, unit = '', badge = '', sub = '', progress = null, tone = '', cls = '' }) {
  return `
    <div class="stat ${cls}">
      <div class="stat-top">
        <span class="stat-label">${label}</span>
        ${badge ? `<span class="stat-badge">${badge}</span>` : ''}
      </div>
      <div class="stat-value">${value}${unit ? `<span class="unit">${unit}</span>` : ''}</div>
      ${progress !== null ? `<div class="progress ${tone}"><span style="width:${clamp(progress, 0, 100)}%"></span></div>` : ''}
      ${sub ? `<div class="stat-sub">${sub}</div>` : ''}
    </div>
  `;
}

function renderDayStats() {
  if (!state.settings) return;
  const totals = formTotals();
  const goals = state.settings;

  const qProgress = pct(totals.questions, goals.daily_questions);
  const mProgress = pct(totals.minutes, goals.daily_minutes);
  const week = state.stats?.week ?? { questions: 0, minutes: 0 };
  const weekProgress = pct(week.questions, goals.weekly_questions);
  const minutesValue = totals.minutes >= 60
    ? (totals.minutes % 60 === 0
        ? `${Math.floor(totals.minutes / 60)} saat`
        : `${Math.floor(totals.minutes / 60)}sa ${totals.minutes % 60}dk`)
    : String(totals.minutes);

  const netCard = totals.accuracyEntered
    ? statCard({
        label: 'Net',
        value: fmtNet(totals.net),
        unit: 'net',
        sub: `${fmtNum(totals.correct)} doğru · ${fmtNum(totals.wrong)} yanlış`,
      })
    : statCard({
        label: 'Net',
        value: '—',
        sub: 'doğru / yanlış girersen hesaplanır',
      });

  $('#todayStats').innerHTML = [
    statCard({
      label: 'Soru',
      value: fmtNum(totals.questions),
      unit: 'soru',
      badge: goals.daily_questions ? `hedefin %${qProgress}` : '',
      sub: goals.daily_questions
        ? `Hedef ${fmtNum(goals.daily_questions)} · ${totals.questions >= goals.daily_questions
            ? `+${fmtNum(totals.questions - goals.daily_questions)} fazla`
            : `${fmtNum(goals.daily_questions - totals.questions)} kaldı`}`
        : 'Hedef belirlemek için Ayarlar',
      progress: qProgress,
      tone: qProgress >= 100 ? 'green' : qProgress < 40 ? 'amber' : '',
    }),
    statCard({
      label: 'Süre',
      value: minutesValue,
      unit: totals.minutes >= 60 ? '' : 'dk',
      badge: goals.daily_minutes ? `hedefin %${mProgress}` : '',
      sub: `Hedef ${fmtMinutes(goals.daily_minutes)}`,
      progress: mProgress,
      tone: mProgress >= 100 ? 'green' : mProgress < 40 ? 'amber' : '',
    }),
    netCard,
    statCard({
      label: 'Seri',
      value: fmtNum(state.stats?.streak ?? 0),
      unit: 'gün',
      sub: 'kesintisiz çalışma',
      cls: 'flame',
    }),
    statCard({
      label: 'Bu hafta',
      value: fmtNum(week.questions),
      unit: 'soru',
      badge: goals.weekly_questions ? `hedefin %${weekProgress}` : '',
      sub: `${fmtMinutes(week.minutes)} · hedef ${fmtMinutes(goals.weekly_minutes)}`,
      progress: weekProgress,
      tone: weekProgress >= 100 ? 'green' : '',
    }),
  ].join('');
}

async function loadStats() {
  state.stats = await api(`/api/stats?days=${state.rangeDays}`);
  renderDayStats();
  if (state.historyLoaded) renderRange();
}

/* -------------------------------------------------------------- history */

async function loadHistory() {
  const [stats, days, heat] = await Promise.all([
    api(`/api/stats?days=${state.rangeDays}`),
    api(`/api/days?from=${addDays(state.today, -(state.rangeDays - 1))}&to=${state.today}`),
    api('/api/stats?days=168'),
  ]);
  state.stats = stats;
  state.days = days;
  state.heat = heat;
  renderDayStats();
  renderRange();
}

function renderRange() {
  const stats = state.stats;
  if (!stats) return;
  const range = stats.range;
  const goals = state.settings;
  const week = stats.week;
  const lastWeek = stats.lastWeek;

  $('#rangeStats').innerHTML = [
    statCard({
      label: 'Toplam soru',
      value: fmtNum(range.questions),
      unit: 'soru',
      sub: `Günlük ort. ${fmtNum(range.avgQuestions)}`,
    }),
    statCard({
      label: 'Toplam süre',
      value: fmtMinutes(range.minutes),
      sub: `Günlük ort. ${fmtMinutes(range.avgMinutes)}`,
    }),
    statCard({
      label: 'Aktif gün',
      value: fmtNum(range.activeDays),
      unit: `/ ${range.days} gün`,
      badge: `%${pct(range.activeDays, range.days)}`,
      sub: range.moodAvg ? `Ort. ruh hali ${fmtNet(range.moodAvg)} / 5` : 'Ruh hali girilmedi',
    }),
    statCard({
      label: 'Aktif günde',
      value: fmtNum(range.perActiveDayQuestions),
      unit: 'soru',
      sub: `${fmtMinutes(range.perActiveDayMinutes)} · günlük ort.`,
    }),
    statCard({
      label: 'Bu hafta',
      value: fmtNum(week.questions),
      unit: 'soru',
      badge: goals.weekly_questions ? `hedefin %${pct(week.questions, goals.weekly_questions)}` : '',
      sub: `${fmtMinutes(week.minutes)} · geçen hafta ${fmtNum(lastWeek.questions)} soru`,
      progress: pct(week.questions, goals.weekly_questions),
      tone: pct(week.questions, goals.weekly_questions) >= 100 ? 'green' : '',
    }),
  ].join('');

  $('#questionChartMeta').textContent = `${fmtNum(range.questions)} soru · ort. ${fmtNum(range.avgQuestions)}/gün`;
  $('#minutesChartMeta').textContent = `${fmtMinutes(range.minutes)} · ort. ${fmtMinutes(range.avgMinutes)}/gün`;

  const labelEvery = state.rangeDays <= 7 ? 1 : Math.ceil(state.rangeDays / 8);
  const labelFn = state.rangeDays <= 7
    ? (d) => WEEKDAYS_SHORT[weekdayIndex(d.date)]
    : (d) => fmtDate(d.date, 'day');

  renderBarChart($('#questionsChart'), {
    series: stats.series,
    valueFn: (d) => d.questions,
    goal: goals.daily_questions,
    color: '#8b95ff',
    tooltip: (d, v) => `${fmtDate(d.date)} · ${fmtNum(v)} soru`,
    goalLabel: (g) => `${fmtNum(g)} soru`,
    yLabel: 'soru',
    labelEvery,
    labelFn,
  });

  renderBarChart($('#minutesChart'), {
    series: stats.series,
    valueFn: (d) => d.minutes / 60,
    goal: goals.daily_minutes / 60,
    color: '#34d399',
    tooltip: (d) => `${fmtDate(d.date)} · ${fmtMinutes(d.minutes)}`,
    goalLabel: (g) => `${fmtNet(g)} saat`,
    yLabel: 'saat',
    labelEvery,
    labelFn,
    valueFormat: (v) => `${fmtNet(v)} sa`,
  });

  renderBreakdown(stats.subjects);
  renderHeatmap(state.heat);
  renderDaysTable();
}

function renderBarChart(container, options) {
  const { series, valueFn, goal = 0, color, tooltip, goalLabel, labelEvery = 1, labelFn, valueFormat } = options;
  const values = series.map(valueFn);

  if (!series.length || values.every((v) => v === 0)) {
    container.innerHTML = '<div class="chart-empty">Bu aralıkta henüz veri yok.</div>';
    return;
  }

  const W = 620;
  const H = 200;
  const pad = { top: 16, right: 10, bottom: 26, left: 10 };
  const plotH = H - pad.top - pad.bottom;
  const plotW = W - pad.left - pad.right;
  const max = Math.max(goal || 0, ...values) * 1.08 || 1;
  const slot = plotW / series.length;
  const barW = Math.max(2, Math.min(24, slot * 0.62));
  const yFor = (value) => pad.top + plotH - (value / max) * plotH;

  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(options.yLabel || 'grafik')}">
    <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${W - pad.right}" y2="${pad.top + plotH}" stroke="#1f2a3a" stroke-width="1" />`;

  if (goal > 0) {
    const gy = yFor(goal);
    svg += `<line x1="${pad.left}" y1="${gy}" x2="${W - pad.right}" y2="${gy}" stroke="#55657d" stroke-width="1" stroke-dasharray="4 5" />
      <text x="${W - pad.right}" y="${gy - 6}" text-anchor="end" fill="#64748b" font-size="10">hedef ${goalLabel ? goalLabel(goal) : goal}</text>`;
  }

  series.forEach((d, i) => {
    const value = values[i];
    const x = pad.left + slot * i + (slot - barW) / 2;
    const h = value > 0 ? Math.max(2, (value / max) * plotH) : 0;
    if (h > 0) {
      svg += `<rect class="bar" x="${x.toFixed(1)}" y="${(pad.top + plotH - h).toFixed(1)}" width="${barW.toFixed(1)}"
        height="${h.toFixed(1)}" rx="${Math.min(4, barW / 2).toFixed(1)}" fill="${color}">
        <title>${esc(tooltip(d, value))}</title></rect>`;
    }
    if (i % labelEvery === 0 || i === series.length - 1) {
      svg += `<text x="${(x + barW / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" fill="#64748b" font-size="10">${esc(labelFn(d))}</text>`;
    }
  });

  container.innerHTML = `${svg}</svg>`;
}

function renderBreakdown(subjects) {
  const container = $('#subjectBreakdown');
  const rows = subjects.filter((s) => s.questions > 0);
  if (!rows.length) {
    container.innerHTML = '<div class="breakdown-empty">Bu aralıkta ders bazlı kayıt yok.</div>';
    return;
  }
  const max = Math.max(...rows.map((s) => s.questions), 1);
  container.innerHTML = rows.map((s) => `
    <div class="breakdown-row">
      <span class="name" title="${esc(s.name)}">${esc(s.name)}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(s.questions / max) * 100}%"></span></span>
      <span class="value">${fmtNum(s.questions)}</span>
    </div>
  `).join('');
}

function renderHeatmap(heat) {
  const el = $('#heatmap');
  if (!heat) {
    el.innerHTML = '';
    return;
  }
  const goals = state.settings;
  const cells = [];
  const first = heat.series[0].date;
  for (let i = 0; i < weekdayIndex(first); i += 1) {
    cells.push('<i class="hm empty" aria-hidden="true"></i>');
  }

  for (const d of heat.series) {
    let level = 0;
    if (d.questions > 0 || d.minutes > 0) {
      const qRatio = goals.daily_questions ? d.questions / goals.daily_questions : 0;
      const mRatio = goals.daily_minutes ? d.minutes / goals.daily_minutes : 0;
      const ratio = Math.max(qRatio, mRatio);
      level = ratio >= 1 ? 4 : ratio >= 0.7 ? 3 : ratio >= 0.35 ? 2 : 1;
    }
    cells.push(`<i class="hm l${level}" title="${esc(fmtDate(d.date))} · ${fmtNum(d.questions)} soru · ${fmtMinutes(d.minutes)}"></i>`);
  }

  while (cells.length % 7 !== 0) cells.push('<i class="hm empty" aria-hidden="true"></i>');
  el.innerHTML = cells.join('');
}

function renderDaysTable() {
  const body = $('#daysTableBody');
  if (!state.days.length) {
    body.innerHTML = '<tr class="empty-row"><td colspan="6">Bu aralıkta kayıt yok. Bugün sekmesinden ilk günü ekle.</td></tr>';
    return;
  }

  body.innerHTML = state.days.map((d) => {
    const hasAccuracy = d.correct + d.wrong > 0;
    const mood = d.mood
      ? `<span style="color:${MOOD_COLORS[d.mood - 1]}">●</span> ${d.mood}/5`
      : '<span class="muted">—</span>';
    return `
      <tr class="clickable" data-date="${d.date}" title="Düzenle">
        <td class="strong">
          ${d.date === state.today ? '<span class="week-tag">bugün</span>' : ''}
          ${esc(fmtDate(d.date))}
        </td>
        <td class="num">${fmtNum(d.questions)}</td>
        <td class="num">${fmtMinutes(d.study_minutes)}</td>
        <td class="num">${hasAccuracy ? fmtNet(d.net) : '—'}</td>
        <td class="num">${mood}</td>
        <td class="note" title="${esc(d.note || '')}">${esc(d.note || '—')}</td>
      </tr>
    `;
  }).join('');
}

/* ---------------------------------------------------------------- exams */

async function loadExams() {
  state.exams = await api('/api/exams');
  renderExamChart();
  renderExamSummary();
  renderExamList();
}

function examSubjectRowHTML(subject) {
  return `
    <div class="exam-result-row" data-id="${subject.id}">
      <span class="name" title="${esc(subject.name)}">${esc(subject.name)}</span>
      <input class="c" type="number" min="0" max="500" step="1" inputmode="numeric" aria-label="${esc(subject.name)} doğru">
      <input class="w" type="number" min="0" max="500" step="1" inputmode="numeric" aria-label="${esc(subject.name)} yanlış">
      <input class="b" type="number" min="0" max="500" step="1" inputmode="numeric" aria-label="${esc(subject.name)} boş">
      <span class="net">0</span>
    </div>
  `;
}

function renderExamResults() {
  const type = $('#examType').value;
  const subjects = state.subjects.filter((s) => (type === 'BRANŞ' ? true : s.track === type));

  if (!subjects.length) {
    $('#examResults').innerHTML = `<div class="empty-state">Bu tür için ders yok. Ayarlar → Dersler bölümünden ekleyebilirsin.</div>`;
    updateExamLiveNet();
    return;
  }

  $('#examResults').innerHTML = `
    <div class="exam-result-head">
      <span>Ders</span><span>Doğru</span><span>Yanlış</span><span>Boş</span><span>Net</span>
    </div>
    ${subjects.map(examSubjectRowHTML).join('')}
  `;
  updateExamLiveNet();
}

function syncExamRows() {
  const type = $('#examType').value;
  const visible = state.subjects.filter((s) => (type === 'BRANŞ' ? true : s.track === type));
  const container = $('#examResults');

  if (!visible.length || !$('.exam-result-head', container)) {
    renderExamResults();
    return;
  }

  $$('.exam-result-row', container).forEach((row) => {
    if (!visible.some((s) => s.id === Number(row.dataset.id))) row.remove();
  });

  const existing = new Set($$('.exam-result-row', container).map((row) => Number(row.dataset.id)));
  for (const subject of visible) {
    if (existing.has(subject.id)) continue;
    const order = state.subjects.map((s) => s.id);
    const index = order.indexOf(subject.id);
    const next = visible.find((s) => order.indexOf(s.id) > index && existing.has(s.id));
    const row = document.createElement('div');
    row.innerHTML = examSubjectRowHTML(subject);
    const el = row.firstElementChild;
    if (next) $(`.exam-result-row[data-id="${next.id}"]`, container).before(el);
    else container.append(el);
    existing.add(subject.id);
  }

  updateExamLiveNet();
}

function examTotals() {
  let correct = 0;
  let wrong = 0;
  $$('#examResults .exam-result-row').forEach((row) => {
    const c = Number($('input.c', row).value) || 0;
    const w = Number($('input.w', row).value) || 0;
    const net = c - w / 4;
    $('.net', row).textContent = fmtNet(net);
    $('.net', row).style.color = net < 0 ? '#f87171' : net > 0 ? '#34d399' : '#91a1b8';
    correct += c;
    wrong += w;
  });
  return { correct, wrong, net: correct - wrong / 4 };
}

function updateExamLiveNet() {
  $('#examLiveNet').textContent = fmtNet(examTotals().net);
}

async function saveExam(event) {
  event.preventDefault();
  const results = $$('#examResults .exam-result-row').map((row) => ({
    subject_id: Number(row.dataset.id),
    correct: Number($('input.c', row).value) || 0,
    wrong: Number($('input.w', row).value) || 0,
    blank: Number($('input.b', row).value) || 0,
  })).filter((r) => r.correct + r.wrong + r.blank > 0);

  if (!results.length) {
    toast('En az bir ders için sonuç gir.', true);
    return;
  }

  const button = $('button[type="submit"]', $('#examForm'));
  button.disabled = true;
  try {
    await api('/api/exams', {
      method: 'POST',
      body: JSON.stringify({
        date: $('#examDate').value || state.today,
        type: $('#examType').value,
        name: $('#examName').value,
        note: $('#examNote').value,
        results,
      }),
    });
    $('#examName').value = '';
    $('#examNote').value = '';
    renderExamResults();
    await loadExams();
    toast('Deneme kaydedildi.');
  } catch (err) {
    toast(err.message, true);
  } finally {
    button.disabled = false;
  }
}

async function deleteExam(id) {
  if (!window.confirm('Bu deneme silinsin mi? Net trendinden de çıkacak.')) return;
  try {
    await api(`/api/exams/${id}`, { method: 'DELETE' });
    await loadExams();
    toast('Deneme silindi.');
  } catch (err) {
    toast(err.message, true);
  }
}

function renderExamChart() {
  const exams = state.exams
    .filter((e) => e.type === state.examChartType)
    .sort((a, b) => (a.date === b.date ? a.id - b.id : a.date.localeCompare(b.date)));

  $('#examCount').textContent = `${state.exams.length} kayıt`;

  if (!exams.length) {
    $('#examChart').innerHTML = '<div class="chart-empty">Henüz deneme yok.</div>';
    return;
  }

  const W = 620;
  const H = 190;
  const pad = { top: 18, right: 14, bottom: 28, left: 30 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const maxNet = Math.max(...exams.map((e) => Math.max(0, e.net)), 10);
  const max = Math.ceil(maxNet / 10) * 10;
  const xFor = (i) => exams.length === 1 ? pad.left + plotW / 2 : pad.left + (plotW * i) / (exams.length - 1);
  const yFor = (net) => pad.top + plotH - (Math.max(0, net) / max) * plotH;

  const points = exams.map((e, i) => `${xFor(i).toFixed(1)},${yFor(e.net).toFixed(1)}`).join(' ');
  const labelEvery = Math.max(1, Math.ceil(exams.length / 6));

  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Deneme net trendi">
    <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${W - pad.right}" y2="${pad.top + plotH}" stroke="#1f2a3a" />`;

  for (let step = 0; step <= 2; step += 1) {
    const value = (max / 2) * step;
    const y = yFor(value);
    svg += `<line x1="${pad.left}" y1="${y}" x2="${W - pad.right}" y2="${y}" stroke="#1b2534" stroke-dasharray="2 4" />
      <text x="${pad.left - 7}" y="${y + 3}" text-anchor="end" fill="#64748b" font-size="9">${fmtNum(value)}</text>`;
  }

  svg += `<polyline points="${points}" fill="none" stroke="#8b95ff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />`;

  exams.forEach((e, i) => {
    const x = xFor(i);
    const y = yFor(e.net);
    svg += `<circle cx="${x}" cy="${y}" r="3.4" fill="#0e141d" stroke="#a78bfa" stroke-width="2">
      <title>${esc(fmtDate(e.date))} · ${esc(e.type)}${e.name ? ` · ${esc(e.name)}` : ''} · ${fmtNet(e.net)} net</title>
    </circle>`;
    if (exams.length === 1 || i % labelEvery === 0 || i === exams.length - 1) {
      svg += `<text x="${x}" y="${H - 8}" text-anchor="middle" fill="#64748b" font-size="9">${esc(fmtDate(e.date, 'short'))}</text>`;
    }
  });

  if (exams.length === 1) {
    svg += `<text x="${xFor(0)}" y="${yFor(exams[0].net) - 10}" text-anchor="middle" fill="#e9eff8" font-size="12" font-weight="600">${fmtNet(exams[0].net)} net</text>`;
  }

  $('#examChart').innerHTML = `${svg}</svg>`;
}

function renderExamSummary() {
  const types = ['TYT', 'AYT'];
  const html = types.map((type) => {
    const list = state.exams
      .filter((e) => e.type === type)
      .sort((a, b) => (a.date === b.date ? a.id - b.id : a.date.localeCompare(b.date)));
    const tag = `<span class="exam-type">${type}</span>`;

    if (!list.length) {
      return `<div class="exam-summary-row">
        ${tag}
        <span class="summary-main">
          <span class="summary-value muted">—</span>
          <span class="summary-sub">henüz deneme yok</span>
        </span>
        <span class="summary-meta"></span>
      </div>`;
    }

    const last = list[list.length - 1];
    const prev = list.length > 1 ? list[list.length - 2] : null;
    const diff = prev ? last.net - prev.net : 0;
    const cls = !prev ? 'delta-flat' : diff > 0.05 ? 'delta-up' : diff < -0.05 ? 'delta-down' : 'delta-flat';
    const delta = prev ? `${diff > 0 ? '+' : ''}${fmtNet(diff)}` : 'ilk';
    const last3 = list.slice(-3);
    const avg = last3.reduce((sum, e) => sum + e.net, 0) / last3.length;

    return `<div class="exam-summary-row">
      ${tag}
      <span class="summary-main">
        <span class="summary-top">
          <span class="summary-value">${fmtNet(last.net)}</span>
          <span class="delta ${cls}">${delta}</span>
        </span>
        <span class="summary-sub">${esc(last.name || `${type} denemesi`)} · ${esc(fmtDate(last.date))}</span>
      </span>
      <span class="summary-meta">son 3 ort.<br><b>${fmtNet(avg)}</b></span>
    </div>`;
  });
  $('#examSummary').innerHTML = html.join('');
}

function renderExamList() {
  const container = $('#examList');
  if (!state.exams.length) {
    container.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1">İlk denemeyi soldaki formdan ekle.</div>';
    return;
  }
  container.innerHTML = state.exams.map((e) => `
    <details class="exam-card">
      <summary>
        <span class="exam-type">${esc(e.type)}</span>
        <span class="exam-info">
          <b>${esc(e.name || (e.type === 'BRANŞ' ? 'Branş denemesi' : `${e.type} denemesi`))}</b>
          <small>${esc(fmtDate(e.date))} · ${e.results.length} ders</small>
        </span>
        <span class="exam-net-badge">${fmtNet(e.net)}<small>net</small></span>
      </summary>
      <div class="exam-detail">
        ${e.results.map((r) => `
          <div>
            <span>${esc(r.name)}</span>
            <span>${fmtNet(r.net)} net <span class="muted">· ${r.correct}D ${r.wrong}Y ${r.blank}B</span></span>
          </div>
        `).join('')}
        ${e.note ? `<div><span class="muted">${esc(e.note)}</span></div>` : ''}
        <div class="exam-detail-foot">
          <span class="muted">${e.correct} doğru · ${e.wrong} yanlış · ${e.blank} boş</span>
          <button type="button" class="link-danger" data-delete-exam="${e.id}">Sil</button>
        </div>
      </div>
    </details>
  `).join('');
}

/* ------------------------------------------------------------- settings */

function renderSettingsForm() {
  const s = state.settings;
  $('#studentNameInput').value = s.student_name;
  $('#dailyQuestions').value = s.daily_questions;
  $('#dailyHours').value = trimZero(s.daily_minutes / 60);
  $('#weeklyQuestions').value = s.weekly_questions;
  $('#weeklyHours').value = trimZero(s.weekly_minutes / 60);
  $('#minutesHint').textContent = `Günlük hedef: ${fmtMinutes(s.daily_minutes)} · ${fmtNum(s.daily_questions)} soru`;
}

function trimZero(value) {
  return String(Math.round(value * 10) / 10);
}

async function saveSettings(event) {
  event.preventDefault();
  const button = $('button[type="submit"]', $('#settingsForm'));
  button.disabled = true;
  try {
    const settings = await api('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({
        student_name: $('#studentNameInput').value,
        daily_questions: Number($('#dailyQuestions').value) || 0,
        daily_minutes: Math.round((Number($('#dailyHours').value) || 0) * 60),
        weekly_questions: Number($('#weeklyQuestions').value) || 0,
        weekly_minutes: Math.round((Number($('#weeklyHours').value) || 0) * 60),
      }),
    });
    state.settings = settings;
    $('#studentName').textContent = `${settings.student_name} · YKS 2027`;
    document.title = `${settings.student_name} · Koçluk`;
    renderSettingsForm();
    renderDayStats();
    if (state.historyLoaded) renderRange();
    toast('Ayarlar kaydedildi.');
  } catch (err) {
    toast(err.message, true);
  } finally {
    button.disabled = false;
  }
}

function renderSubjectManager() {
  $('#subjectManager').innerHTML = state.subjects.map((s) => `
    <div class="subject-manager-row">
      <span class="track-tag">${esc(s.track)}</span>
      <span class="grow" title="${esc(s.name)}">${esc(s.name)}</span>
      <button type="button" data-del-subject="${s.id}" title="Dersi sil" aria-label="${esc(s.name)} dersini sil">×</button>
    </div>
  `).join('');
}

async function addSubject(event) {
  event.preventDefault();
  const nameInput = $('#newSubjectName');
  try {
    const subject = await api('/api/subjects', {
      method: 'POST',
      body: JSON.stringify({ name: nameInput.value, track: $('#newSubjectTrack').value }),
    });
    state.subjects = await api('/api/subjects');
    nameInput.value = '';
    renderSubjectManager();
    insertSubjectRow(subject);
    syncExamRows();
    toast(`${subject.name} eklendi.`);
  } catch (err) {
    toast(err.message, true);
  }
}

function insertSubjectRow(subject) {
  const container = $('#subjectRows');
  if (!container || $('.subject-row', container) === null) {
    renderDayForm();
    return;
  }
  const row = document.createElement('div');
  row.innerHTML = subjectRowHTML(subject, {});
  const el = row.firstElementChild;

  const order = state.subjects.map((s) => s.id);
  const index = order.indexOf(subject.id);
  let nextId = null;
  for (let i = index + 1; i < order.length; i += 1) {
    if ($(`.subject-row[data-id="${order[i]}"]`, container)) {
      nextId = order[i];
      break;
    }
  }
  if (nextId) {
    $(`.subject-row[data-id="${nextId}"]`, container).before(el);
  } else {
    container.append(el);
  }
  syncForm();
}

async function removeSubject(id) {
  const subject = state.subjects.find((s) => s.id === id);
  if (!subject) return;
  if (!window.confirm(`"${subject.name}" dersi silinsin mi?`)) return;

  try {
    await api(`/api/subjects/${id}`, { method: 'DELETE' });
    state.subjects = state.subjects.filter((s) => s.id !== id);
    renderSubjectManager();
    $(`.subject-row[data-id="${id}"]`)?.remove();
    $(`.exam-result-row[data-id="${id}"]`)?.remove();
    syncForm();
    syncExamRows();
    toast(`${subject.name} silindi.`);
  } catch (err) {
    toast(err.message, true);
  }
}

/* ----------------------------------------------------------------- run */

init();
