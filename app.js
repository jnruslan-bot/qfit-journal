const DB_KEY = 'qfit_journal_db';
const DB_VERSION = 12;
const PROFILE_KEY = 'qfit_journal_profile';
const LEGACY_DB_KEYS = [
  'qfit_journal_v24_plan_cleanup_db',
  'qfit_journal_v23_autocomplete_click_fix_db',
  'qfit_journal_v22_live_autocomplete_db',
  'qfit_journal_v21_exercises_source_db',
  'qfit_journal_v20_numeric_plan_db',
  'qfit_journal_v19_profile_plan_edit_db',
  'qfit_journal_v18_plan_agreed_db'
];

// Режимы:
// admin  — после титульной страницы выбор: Я / Арслан.
// ruslan — сразу открывает только профиль Я.
// arslan — сразу открывает только профиль Арслана.
const APP_MODE = 'admin';

const athletes = {
  ruslan: { label: 'Я' },
  arslan: { label: 'Арслан' }
};

const exerciseLibrary = {
  'Грудь': [
    { name: 'Жим штанги лёжа', type: 'strength', aliases: ['Жим лёжа'] },
    { name: 'Жим гантелей лёжа', type: 'strength' },
    { name: 'Жим гантелей на наклонной', type: 'strength' },
    { name: 'Разводка гантелей', type: 'strength' },
    { name: 'Брусья', type: 'strength' },
    { name: 'Отжимания', type: 'reps' },
    { name: 'Отжимания между стульями', type: 'reps' }
  ],
  'Спина': [
    { name: 'Становая тяга', type: 'strength', aliases: ['Становая'] },
    { name: 'Тяга штанги в наклоне', type: 'strength' },
    { name: 'Вертикальная тяга', type: 'strength' },
    { name: 'Горизонтальная тяга', type: 'strength' },
    { name: 'Тяга верхнего блока', type: 'strength' },
    { name: 'Подтягивания', type: 'strength' },
    { name: 'Подтягивания со жгутом', type: 'reps' },
    { name: 'Тяга жгута', type: 'reps' }
  ],
  'Ноги': [
    { name: 'Приседания', type: 'strength' },
    { name: 'Приседания с гантелью', type: 'strength' },
    { name: 'Жим ногами', type: 'strength' },
    { name: 'Выпады', type: 'strength' },
    { name: 'Румынская тяга', type: 'strength' }
  ],
  'Плечи': [
    { name: 'Жим штанги стоя', type: 'strength' },
    { name: 'Жим гантелей над головой', type: 'strength' },
    { name: 'Подъём гантелей над головой', type: 'strength' },
    { name: 'Махи гантелями в стороны', type: 'strength' }
  ],
  'Руки': [
    { name: 'Сгибание рук со штангой', type: 'strength' },
    { name: 'Французский жим', type: 'strength' },
    { name: 'Разгибание рук на блоке', type: 'strength' }
  ],
  'Кор': [
    { name: 'Пресс', type: 'reps' },
    { name: 'Скручивания', type: 'reps' },
    { name: 'Подъём ног', type: 'reps' },
    { name: 'Планка', type: 'time' }
  ],
  'Кардио / бокс': [
    { name: 'Груша', type: 'rounds' },
    { name: 'Канаты', type: 'rounds' },
    { name: 'Эллипсоид', type: 'time' },
    { name: 'Бокс', type: 'time' }
  ]
};
const allExercises = Object.entries(exerciseLibrary).flatMap(([group, items]) => items.map(x => ({ ...x, group })));
function normalizeText(value) {
  return String(value || '').trim().toLowerCase().replace(/ё/g, 'е');
}
function canonicalExerciseName(name) {
  const clean = normalizeText(name);
  const found = allExercises.find(x =>
    normalizeText(x.name) === clean ||
    (x.aliases || []).some(alias => normalizeText(alias) === clean)
  );
  return found ? found.name : String(name || '').trim();
}
function findExercise(name) {
  const clean = normalizeText(name);
  return allExercises.find(x =>
    normalizeText(x.name) === clean ||
    (x.aliases || []).some(alias => normalizeText(alias) === clean)
  );
}

const strength = (name, weight, sets, reps) => ({
  name,
  type: 'strength',
  sets: Array.from({ length: sets }, () => ({ weight, reps }))
});
const repsOnly = (name, sets, reps) => ({
  name,
  type: 'reps',
  sets: Array.from({ length: sets }, () => ({ weight: '', reps }))
});
const mixedStrength = (name, weight, groups) => ({
  name,
  type: 'strength',
  sets: groups.flatMap(([sets, reps]) => Array.from({ length: sets }, () => ({ weight, reps })))
});
const mixedReps = (name, groups) => ({
  name,
  type: 'reps',
  sets: groups.flatMap(([sets, reps]) => Array.from({ length: sets }, () => ({ weight: '', reps })))
});
const rounds = (name, roundCount, minutes) => ({ name, type: 'rounds', rounds: roundCount, minutes });
const timeOnly = (name, minutes) => ({ name, type: 'time', minutes });

const defaultPlan = {
  ruslan: {
    activeIndex: 0,
    workouts: [
      {
        id: 'r-001',
        title: 'Становая + брусья',
        cycle: 'Июнь — силовой блок',
        exercises: [
          rounds('Груша', 2, 2),
          strength('Становая тяга', 135, 5, 5),
          strength('Брусья', 20, 5, 5),
          repsOnly('Пресс', 1, 30),
          rounds('Канаты', 2, 1)
        ]
      },
      {
        id: 'r-002',
        title: 'Присед + жим + подтягивания',
        cycle: 'Июнь — силовой блок',
        exercises: [
          rounds('Груша', 2, 2),
          strength('Приседания', 115, 5, 5),
          strength('Жим штанги лёжа', 90, 5, 5),
          strength('Подтягивания', 10, 5, 5),
          repsOnly('Пресс', 1, 30)
        ]
      },
      {
        id: 'r-003',
        title: 'Становая + брусья',
        cycle: 'Июнь — силовой блок',
        exercises: [
          rounds('Груша', 2, 2),
          strength('Становая тяга', 137.5, 4, 4),
          strength('Брусья', 25, 4, 4),
          repsOnly('Пресс', 1, 30)
        ]
      },
      {
        id: 'r-004',
        title: 'Лёгкая / откат',
        cycle: 'Июнь — силовой блок',
        exercises: [
          rounds('Груша', 2, 2),
          strength('Приседания', 100, 3, 5),
          strength('Жим штанги лёжа', 85, 3, 5),
          strength('Подтягивания', 0, 3, 8),
          repsOnly('Пресс', 1, 30)
        ]
      }
    ]
  },
  arslan: {
    activeIndex: 0,
    workouts: [
      {
        id: 'a-001',
        title: 'Присед + жим',
        cycle: 'Июнь — возврат и техника',
        exercises: [
          timeOnly('Эллипсоид', 10),
          strength('Приседания', 90, 4, 3),
          strength('Жим лёжа', 65, 4, 3),
          mixedStrength('Подтягивания', 0, [[1, 5], [3, 4]]),
          repsOnly('Пресс', 1, 30),
          rounds('Груша', 2, 2)
        ]
      },
      {
        id: 'a-002',
        title: 'Становая + тяги',
        cycle: 'Июнь — возврат и техника',
        exercises: [
          timeOnly('Эллипсоид', 10),
          strength('Становая', 75, 4, 4),
          mixedStrength('Вертикальная тяга', 55, [[3, 7], [1, 6]]),
          mixedReps('Брусья', [[1, 5], [3, 4]]),
          mixedStrength('Горизонтальная тяга', 50, [[3, 7], [1, 6]]),
          repsOnly('Пресс', 1, 30),
          rounds('Груша', 2, 2)
        ]
      }
    ]
  }
};


function makeWorkoutId(prefix = 'w') {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}
function normalizeWorkoutShape(w) {
  w.id ||= makeWorkoutId('workout');
  w.title ||= 'Тренировка';
  w.cycle ||= '';
  w.exercises ||= [];
  w.exercises.forEach(normalizeExerciseShape);
}

let currentAthlete = resolveInitialAthlete();
// v29.1: эти переменные должны существовать ДО loadDb(), потому что миграция программ может вызвать normalizeProgramShape/adjustProgramTrainingCount.
let activeProgramTab = 'schedule';
let activeProgramTrainingIndex = 0;
let activeProgramExerciseUid = null;
let db = loadDb();
let activeExerciseIndex = null;
let activePlanIndex = null;
let activePlanExerciseIndex = null;
let liveSuggestions = {};
let liveSuggestTimer = null;
let lastSuggestionPick = { time: 0, name: "" };
let activeProgramIndex = null;
let activeEditContext = 'plan'; // plan | program
let simpleProgramDraft = { name: '', step: 1, totalTrainings: 4, exercises: [], days: [[], [], [], []] };
let simpleEditingProgramIndex = null;
let simplePointerDrag = null;
let simpleLoadOpenKey = null;

const $ = (id) => document.getElementById(id);
const startScreen = $('startScreen');
const appShell = $('appShell');
const profileScreen = $('profileScreen');
const menuScreen = $('menuScreen');
const todayScreen = $('todayScreen');
const setsScreen = $('setsScreen');
const planScreen = $('planScreen');
const planEditScreen = $('planEditScreen');
const journalScreen = $('journalScreen');
const baseScreen = $('baseScreen');
const savedScreen = $('savedScreen');
const programsScreen = $('programsScreen');
const programDetailScreen = $('programDetailScreen');
const programDaysScreen = $('programDaysScreen');
const programLoadScreen = $('programLoadScreen');

const saveState = $('saveState');
const workoutTitle = $('workoutTitle');
const workoutMetrics = $('workoutMetrics');
const exerciseList = $('exerciseList');
const generalComment = $('generalComment');
const menuPreviewTitle = $('menuPreviewTitle');
const menuPreviewText = $('menuPreviewText');
const planTwoList = $('planTwoList');
const planRestList = $('planRestList');
const journalList = $('journalList');

const setsExerciseName = $('setsExerciseName');
const setsPlanLabel = $('setsPlanLabel');
const setsSummary = $('setsSummary');
const setsList = $('setsList');
const exerciseComment = $('exerciseComment');
const fillPlanBtn = $('fillPlanBtn');
const addSetBtn = $('addSetBtn');

const planEditHeading = $('planEditHeading');
const planEditExercises = $('planEditExercises');
const planEditState = $('planEditState');
const muscleGrid = $('muscleGrid');
const exerciseGroupPanel = $('exerciseGroupPanel');
const savedSummary = $('savedSummary');
const programList = $('programList');
const programNameInput = $('programNameInput');
const programCountInput = $('programCountInput');
const programWeekInput = $('programWeekInput');
const createProgramBtn = $('createProgramBtn');
const programDetailTitle = $('programDetailTitle');
const programDetailMeta = $('programDetailMeta');
const programDetailState = $('programDetailState');
const programWorkoutList = $('programWorkoutList');
const programProgression = $('programProgression');

function resolveInitialAthlete() {
  if (APP_MODE === 'arslan') return 'arslan';
  if (APP_MODE === 'ruslan') return 'ruslan';
  return localStorage.getItem(PROFILE_KEY) === 'arslan' ? 'arslan' : 'ruslan';
}
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
function loadDb() {
  const fresh = () => ({ schemaVersion: DB_VERSION, plan: clone(defaultPlan), programs: makeDefaultPrograms(), drafts: {}, history: { ruslan: [], arslan: [] } });
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return migrateDb(JSON.parse(raw));
  } catch (e) { console.warn(e); }

  for (const key of LEGACY_DB_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const migrated = migrateDb(JSON.parse(raw));
      localStorage.setItem(DB_KEY, JSON.stringify(migrated));
      return migrated;
    } catch (e) { console.warn('legacy db read failed', key, e); }
  }
  return fresh();
}

function migrateDb(data) {
  const migrated = data && typeof data === 'object' ? data : {};
  migrated.schemaVersion = DB_VERSION;
  migrated.plan ||= clone(defaultPlan);
  migrated.programs ||= makeDefaultPrograms();
  migrated.drafts ||= {};
  migrated.history ||= { ruslan: [], arslan: [] };
  ['ruslan', 'arslan'].forEach(k => {
    migrated.plan[k] ||= clone(defaultPlan[k]);
    migrated.plan[k].workouts ||= clone(defaultPlan[k].workouts);
    migrated.plan[k].workouts.forEach(normalizeWorkoutShape);
    migrated.programs[k] ||= makeDefaultPrograms()[k];
    migrated.programs[k].forEach(normalizeProgramShape);
  });
  return migrated;
}

function normalizeExerciseShape(ex) {
  const found = findExercise(ex.name);
  ex.exerciseId = found ? found.name : (ex.exerciseId || '');
  if (found) ex.name = found.name;
  ex.type = found ? found.type : (['strength','reps','rounds','time'].includes(ex.type) ? ex.type : 'strength');
  if ((ex.type === 'strength' || ex.type === 'reps') && !Array.isArray(ex.sets)) {
    ex.sets = [{ weight: ex.type === 'strength' ? num(ex.weight || 0) : '', reps: num(ex.reps || 1) || 1 }];
  }
  if (ex.type === 'reps') ex.sets = (ex.sets || []).map(s => ({ weight: '', reps: num(s.reps) || 0 }));
  if (ex.type === 'strength') ex.sets = (ex.sets || []).map(s => ({ weight: s.weight === '' ? 0 : num(s.weight), reps: num(s.reps) || 0 }));
  if (ex.type === 'rounds') { ex.rounds = num(ex.rounds) || 0; ex.minutes = num(ex.minutes) || 0; delete ex.sets; }
  if (ex.type === 'time') { ex.minutes = num(ex.minutes) || 0; delete ex.sets; delete ex.rounds; }
}
function saveDb() { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function ensureDb() {
  db.schemaVersion = DB_VERSION;
  db.plan ||= clone(defaultPlan);
  db.programs ||= makeDefaultPrograms();
  db.drafts ||= {};
  db.history ||= { ruslan: [], arslan: [] };
  ['ruslan', 'arslan'].forEach(k => {
    db.plan[k] ||= clone(defaultPlan[k]);
    db.plan[k].workouts ||= clone(defaultPlan[k].workouts);
    if (!Number.isInteger(db.plan[k].activeIndex)) db.plan[k].activeIndex = 0;
    clampActiveIndex(k);
    db.history[k] ||= [];
    db.programs[k] ||= makeDefaultPrograms()[k];
    db.programs[k].forEach(normalizeProgramShape);
  });
}
function clampActiveIndex(k = currentAthlete) {
  const p = db.plan[k];
  if (!p.workouts.length) p.activeIndex = 0;
  if (p.activeIndex < 0) p.activeIndex = 0;
  if (p.activeIndex >= p.workouts.length) p.activeIndex = Math.max(0, p.workouts.length - 1);
}
function activePlanWorkout(k = currentAthlete) { ensureDb(); return db.plan[k].workouts[db.plan[k].activeIndex]; }
function nextPlanWorkout(k = currentAthlete) { ensureDb(); return db.plan[k].workouts[db.plan[k].activeIndex + 1] || null; }
function makeDraftFromPlan(k = currentAthlete) {
  const tpl = activePlanWorkout(k);
  return {
    sourceId: tpl.id,
    sourceIndex: db.plan[k].activeIndex,
    athlete: k,
    title: tpl.title,
    cycle: tpl.cycle,
    comment: '',
    exercises: tpl.exercises.map(ex => ({
      ...clone(ex),
      status: 'todo',
      factSets: [],
      factRounds: '',
      factMinutes: '',
      factText: '',
      note: ''
    }))
  };
}
function getWorkout(k = currentAthlete) {
  ensureDb();
  const tpl = activePlanWorkout(k);
  if (!db.drafts[k] || db.drafts[k].sourceId !== tpl.id) db.drafts[k] = makeDraftFromPlan(k);
  return db.drafts[k];
}
function showOnly(screen) {
  [profileScreen, menuScreen, todayScreen, setsScreen, planScreen, planEditScreen, journalScreen, baseScreen, savedScreen, programsScreen, programDetailScreen, programDaysScreen, programLoadScreen].filter(Boolean).forEach(s => s.classList.remove('is-active'));
  if (!screen) screen = menuScreen;
  screen.classList.add('is-active');
  screen.scrollTop = 0;
}
function openApp() {
  startScreen.classList.remove('is-active');
  appShell.classList.add('is-active');
  if (APP_MODE === 'admin') showOnly(profileScreen); else showOnly(menuScreen);
  renderAll();
}
function goStart() { appShell.classList.remove('is-active'); startScreen.classList.add('is-active'); }
function selectProfile(k) { currentAthlete = k; localStorage.setItem(PROFILE_KEY, k); getWorkout(k); saveDb(); showOnly(menuScreen); renderAll(); }
function renderAll() { ensureDb(); renderMenuPreview(); renderToday(); renderPlan(); renderPrograms(); renderJournal(); renderExerciseLibrary(); renderExerciseDatalist(); }
function renderMenuPreview() {
  const w = getWorkout();
  menuPreviewTitle.textContent = 'Текущая тренировка';
  menuPreviewText.textContent = `${w.exercises.length} упражнений · источник: План`;
}

function metric(label, value) { return `<div class="metric-tile"><span>${label}</span><strong>${value}</strong></div>`; }
function fmt(n) { return Number(n || 0).toLocaleString('ru-RU', { maximumFractionDigits: 1 }); }
function fmtNum(n) { if (n === '' || n === null || n === undefined) return ''; return String(Number(n)).replace('.', ','); }
function num(v) { if (v === null || v === undefined || v === '') return 0; const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : 0; }
function escapeHtml(s) { return String(s ?? '').replace(/[&<>'"]/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[ch])); }
function uid() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

function qfitModal(message, options = {}) {
  const existing = document.querySelector('.qfit-modal-backdrop');
  if (existing) existing.remove();
  const backdrop = document.createElement('div');
  backdrop.className = 'qfit-modal-backdrop';
  const title = options.title || 'QFit Journal';
  const okText = options.okText || 'Понятно';
  const cancelText = options.cancelText || 'Отмена';
  backdrop.innerHTML = `
    <div class="qfit-modal" role="dialog" aria-modal="true">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="qfit-modal-actions">
        ${options.confirm ? `<button class="small-btn" data-modal-cancel type="button">${escapeHtml(cancelText)}</button>` : ''}
        <button class="small-btn solid" data-modal-ok type="button">${escapeHtml(okText)}</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  const close = () => backdrop.remove();
  backdrop.querySelector('[data-modal-ok]')?.addEventListener('click', () => { close(); options.onOk?.(); });
  backdrop.querySelector('[data-modal-cancel]')?.addEventListener('click', () => { close(); options.onCancel?.(); });
}
function qfitAlert(message, title = 'QFit Journal') { qfitModal(message, { title }); }
function qfitConfirm(message, onOk, title = 'Подтвердите действие', okText = 'Подтвердить') {
  qfitModal(message, { title, confirm: true, okText, cancelText: 'Отмена', onOk });
}

function planSets(ex) { return (ex.sets || []).map(s => ({ weight: s.weight === '' ? '' : num(s.weight), reps: num(s.reps) })); }
function factSets(ex) { return (ex.factSets || []).map(s => ({ weight: s.weight === '' ? '' : num(s.weight), reps: num(s.reps) })); }
function totalsFromSets(sets) {
  let reps = 0, tonnage = 0;
  sets.forEach(s => { const r = num(s.reps), w = num(s.weight); if (r) reps += r; if (r && w) tonnage += r * w; });
  return { reps, tonnage };
}
function totalsForExercisePlan(ex) {
  if (ex.type === 'strength' || ex.type === 'reps') return totalsFromSets(planSets(ex));
  return { reps: 0, tonnage: 0 };
}
function totalsForExerciseFact(ex) {
  if (ex.status === 'done') return totalsForExercisePlan(ex);
  if (ex.status === 'skipped') return { reps: 0, tonnage: 0 };
  if (ex.type === 'strength' || ex.type === 'reps') return totalsFromSets(factSets(ex));
  return { reps: 0, tonnage: 0 };
}
function totalsForWorkout(w, mode) {
  return w.exercises.reduce((acc, ex) => {
    const t = mode === 'plan' ? totalsForExercisePlan(ex) : totalsForExerciseFact(ex);
    acc.reps += t.reps; acc.tonnage += t.tonnage;
    return acc;
  }, { reps: 0, tonnage: 0 });
}
function exercisePlanText(ex) {
  if (ex.type === 'rounds') return `${fmtNum(ex.rounds)} р по ${fmtNum(ex.minutes)} мин`;
  if (ex.type === 'time') return `${fmtNum(ex.minutes)} мин`;
  const sets = planSets(ex);
  if (!sets.length) return '—';
  return setsToText(sets, ex.type);
}
function setsToText(sets, type = 'strength') {
  const valid = sets.filter(s => num(s.reps) || num(s.weight));
  if (!valid.length) return '—';
  const sameWeight = valid.every(s => String(s.weight) === String(valid[0].weight));
  const sameReps = valid.every(s => Number(s.reps) === Number(valid[0].reps));
  const weightPart = type === 'strength' && num(valid[0].weight) ? `${fmtNum(valid[0].weight)} кг × ` : '';
  if (sameWeight && sameReps) return `${weightPart}${valid.length} × ${fmtNum(valid[0].reps)}`;
  if (sameWeight) {
    const groups = [];
    valid.forEach(s => {
      const last = groups[groups.length - 1];
      if (last && Number(last.reps) === Number(s.reps)) last.count += 1; else groups.push({ reps: s.reps, count: 1 });
    });
    return `${weightPart}${groups.map(g => `${g.count}×${fmtNum(g.reps)}`).join(' + ')}`;
  }
  return valid.map(s => type === 'strength' && num(s.weight) ? `${fmtNum(s.weight)}×${fmtNum(s.reps)}` : fmtNum(s.reps)).join(', ');
}
function factText(ex) {
  if (ex.status === 'todo') return '';
  if (ex.status === 'skipped') return 'не выполнено';
  if (ex.status === 'done') return 'как план';
  if (ex.type === 'strength' || ex.type === 'reps') return setsToText(factSets(ex), ex.type);
  if (ex.type === 'rounds') {
    const r = ex.factRounds || ex.rounds || '';
    const m = ex.factMinutes || ex.minutes || '';
    return r && m ? `${fmtNum(r)} р по ${fmtNum(m)} мин` : (ex.factText || 'изменено');
  }
  if (ex.type === 'time') return ex.factMinutes ? `${fmtNum(ex.factMinutes)} мин` : (ex.factText || 'изменено');
  return ex.factText || 'изменено';
}

function completionValue(fact, plan) {
  if (!plan) return null;
  return Math.round((fact / plan) * 100);
}
function completionPercent(fact, plan, started = true) {
  if (!started || !plan) return '—';
  return `${completionValue(fact, plan)}%`;
}
function completionTone(percent) {
  if (percent === null || percent === undefined) return 'neutral';
  if (percent >= 90) return 'good';
  if (percent >= 75) return 'warn';
  return 'bad';
}
function signed(n, suffix = '') {
  const value = Number(n || 0);
  if (!value) return `0${suffix}`;
  return `${value > 0 ? '+' : ''}${fmt(value)}${suffix}`;
}
function signedIfStarted(n, started, suffix = '') {
  return started ? signed(n, suffix) : '—';
}
function exerciseDiff(ex) {
  const p = totalsForExercisePlan(ex);
  const f = totalsForExerciseFact(ex);
  return { reps: f.reps - p.reps, tonnage: f.tonnage - p.tonnage, plan: p, fact: f };
}
function exerciseDiffText(ex) {
  if (ex.status === 'todo') return '';
  if (!(ex.type === 'strength' || ex.type === 'reps')) {
    if (ex.status === 'skipped') return 'Отклонение: не выполнено';
    if (ex.status === 'changed') return 'Отклонение: изменено';
    return '';
  }
  const d = exerciseDiff(ex);
  if (!d.plan.reps && !d.plan.tonnage) return '';
  const parts = [];
  if (d.plan.reps || d.fact.reps) parts.push(`${signed(d.reps)} повт.`);
  if (d.plan.tonnage || d.fact.tonnage) parts.push(`${signed(d.tonnage, ' кг')}`);
  return parts.length ? `Отклонение: ${parts.join(' · ')}` : '';
}
function progressBlock(label, fact, plan, suffix = '') {
  const started = label.started;
  const cleanLabel = label.title;
  const percent = completionValue(fact, plan);
  const tone = started ? completionTone(percent) : 'neutral';
  const percentText = completionPercent(fact, plan, started);
  const deltaText = plan ? signedIfStarted(fact - plan, started, suffix) : '—';
  const factText = started ? `${fmt(fact)}${suffix}` : '—';
  const planText = plan ? `${fmt(plan)}${suffix}` : '—';
  return `<div class="progress-card ${tone}">
    <div class="progress-head"><span>${cleanLabel}</span><strong>${percentText}</strong></div>
    <div class="progress-main"><b>${factText}</b><span>/ ${planText}</span></div>
    <div class="progress-delta">Отклонение: <strong>${deltaText}</strong></div>
  </div>`;
}
function totalsCompletionHtml(plan, fact, w) {
  const started = workoutHasStarted(w);
  return `<section class="progress-summary">
    ${progressBlock({ title: 'КПШ', started }, fact.reps, plan.reps, '')}
    ${progressBlock({ title: 'Тоннаж', started }, fact.tonnage, plan.tonnage, ' кг')}
  </section>`;
}
function renderToday() {
  const w = getWorkout();
  workoutTitle.textContent = 'Текущая тренировка';
  const cycleEl = document.getElementById('cycleLabel'); if (cycleEl) cycleEl.textContent = '';
  generalComment.value = w.comment || '';
  const plan = totalsForWorkout(w, 'plan');
  const fact = totalsForWorkout(w, 'fact');
  workoutMetrics.innerHTML = totalsCompletionHtml(plan, fact, w);
  exerciseList.innerHTML = '';
  w.exercises.forEach((ex, index) => {
    const card = document.createElement('article');
    card.className = 'exercise-card';
    const ft = factText(ex);
    const diff = exerciseDiffText(ex);
    card.innerHTML = `
      <div class="exercise-main">
        <div class="exercise-name">${index + 1}. ${escapeHtml(ex.name)}</div>
        <div class="exercise-plan-line"><span>План:</span> ${escapeHtml(exercisePlanText(ex))}</div>
        ${ft ? `<div class="fact-short"><span>Факт:</span> ${escapeHtml(ft)}</div>` : ''}
        ${diff ? `<div class="exercise-diff">${escapeHtml(diff)}</div>` : ''}
        ${ex.note ? `<div class="exercise-note"><span>Комментарий:</span> ${escapeHtml(ex.note)}</div>` : ''}
      </div>
      <div class="exercise-actions">
        <button class="status-btn done ${ex.status === 'done' ? 'is-active' : ''}" data-status="done" data-index="${index}" type="button">Выполнено</button>
        <button class="status-btn changed ${ex.status === 'changed' ? 'is-active' : ''}" data-status="changed" data-index="${index}" type="button">Изменить</button>
        <button class="status-btn skipped ${ex.status === 'skipped' ? 'is-active' : ''}" data-status="skipped" data-index="${index}" type="button">Не выполнено</button>
      </div>`;
    exerciseList.appendChild(card);
  });
}
function setStatus(index, status) {
  const ex = getWorkout().exercises[index];
  ex.status = status;
  if (status === 'done') {
    ex.factSets = clone(planSets(ex));
    ex.factRounds = ex.rounds || '';
    ex.factMinutes = ex.minutes || '';
    ex.factText = exercisePlanText(ex);
    ex.note = '';
  }
  if (status === 'skipped') {
    ex.factSets = [];
    ex.factText = '';
    ex.factRounds = '';
    ex.factMinutes = '';
  }
  if (status === 'changed') return openExerciseEdit(index);
  markUnsaved(); saveDb(); renderToday();
}
function openExerciseEdit(index) {
  activeExerciseIndex = index;
  const ex = getWorkout().exercises[index];
  ex.status = 'changed';
  if ((ex.type === 'strength' || ex.type === 'reps') && (!ex.factSets || !ex.factSets.length)) ex.factSets = clone(planSets(ex));
  if (ex.type === 'rounds') { ex.factRounds ||= ex.rounds || ''; ex.factMinutes ||= ex.minutes || ''; }
  if (ex.type === 'time') ex.factMinutes ||= ex.minutes || '';
  setsExerciseName.textContent = ex.name;
  setsPlanLabel.textContent = exercisePlanText(ex);
  exerciseComment.value = ex.note || '';
  showOnly(setsScreen);
  renderExerciseEdit();
}
function renderExerciseEdit() {
  const ex = getWorkout().exercises[activeExerciseIndex];
  const planTotals = totalsForExercisePlan(ex);
  const factTotals = totalsForExerciseFact(ex);
  setsSummary.innerHTML = [metric('План КПШ', planTotals.reps || '—'), metric('Факт КПШ', factTotals.reps || '—'), metric('План кг', planTotals.tonnage ? fmt(planTotals.tonnage) : '—'), metric('Факт кг', factTotals.tonnage ? fmt(factTotals.tonnage) : '—')].join('');
  fillPlanBtn.style.display = (ex.type === 'strength' || ex.type === 'reps') ? 'block' : 'none';
  addSetBtn.style.display = (ex.type === 'strength' || ex.type === 'reps') ? 'block' : 'none';
  setsList.innerHTML = '';
  if (ex.type === 'rounds') {
    setsList.innerHTML = `<div class="simple-grid"><label class="set-field"><input class="num-input" data-rounds-fact type="number" min="0" step="1" value="${valueAttr(ex.factRounds)}"><small>р</small></label><label class="set-field"><input class="num-input" data-minutes-fact type="number" min="0" step="0.5" value="${valueAttr(ex.factMinutes)}"><small>мин</small></label></div>`;
    return;
  }
  if (ex.type === 'time') {
    setsList.innerHTML = `<div class="simple-grid"><label class="set-field"><input class="num-input" data-minutes-fact type="number" min="0" step="0.5" value="${valueAttr(ex.factMinutes)}"><small>мин</small></label></div>`;
    return;
  }
  setsList.innerHTML = `<div class="set-row set-head"><div>№</div>${ex.type === 'strength' ? '<div>Вес, кг</div>' : '<div></div>'}<div>Повторы</div><div></div></div>`;
  (ex.factSets || []).forEach((s, i) => {
    const plan = planSets(ex)[i];
    const row = document.createElement('div');
    row.className = 'set-row';
    row.innerHTML = `
      <div class="set-num">${i + 1}</div>
      <div class="set-field">${ex.type === 'strength' ? `<input class="num-input" data-set-weight="${i}" type="number" inputmode="decimal" min="0" step="0.5" value="${valueAttr(s.weight)}"><small>кг</small>` : ''}</div>
      <div class="set-field"><input class="num-input" data-set-reps="${i}" type="number" inputmode="numeric" min="0" step="1" value="${valueAttr(s.reps)}"><small>раз</small></div>
      <button class="clear-set-btn" data-clear-set="${i}" type="button">×</button>
      <div class="set-plan-chip">План: ${plan ? setsToText([plan], ex.type) : 'доп. подход'}</div>`;
    setsList.appendChild(row);
  });
}
function updateSet(i, field, value) {
  const ex = getWorkout().exercises[activeExerciseIndex];
  ex.factSets[i] ||= { weight: '', reps: '' };
  ex.factSets[i][field] = value;
  ex.status = 'changed';
  saveDb();
  const planTotals = totalsForExercisePlan(ex);
  const factTotals = totalsForExerciseFact(ex);
  setsSummary.innerHTML = [metric('План КПШ', planTotals.reps || '—'), metric('Факт КПШ', factTotals.reps || '—'), metric('План кг', planTotals.tonnage ? fmt(planTotals.tonnage) : '—'), metric('Факт кг', factTotals.tonnage ? fmt(factTotals.tonnage) : '—')].join('');
  markUnsaved();
}
function updateSimpleFact(field, value) {
  const ex = getWorkout().exercises[activeExerciseIndex];
  ex[field] = value;
  ex.status = 'changed';
  saveDb(); markUnsaved();
}
function clearSet(i) { const ex = getWorkout().exercises[activeExerciseIndex]; ex.factSets.splice(i, 1); ex.status = 'changed'; saveDb(); renderExerciseEdit(); markUnsaved(); }
function fillByPlan() { const ex = getWorkout().exercises[activeExerciseIndex]; ex.factSets = clone(planSets(ex)); ex.status = 'done'; saveDb(); renderExerciseEdit(); markUnsaved(); }
function addSet() { const ex = getWorkout().exercises[activeExerciseIndex]; ex.factSets ||= []; ex.factSets.push({ weight: ex.type === 'strength' ? '' : '', reps: '' }); ex.status = 'changed'; saveDb(); renderExerciseEdit(); markUnsaved(); }
function closeExerciseEdit() { if (activeExerciseIndex !== null) { const ex = getWorkout().exercises[activeExerciseIndex]; ex.note = exerciseComment.value.trim(); ex.status = detectExerciseStatus(ex); } activeExerciseIndex = null; saveDb(); showOnly(todayScreen); renderToday(); }
function detectExerciseStatus(ex) {
  if (ex.status === 'skipped') return 'skipped';
  if (ex.type === 'rounds') return Number(ex.factRounds) === Number(ex.rounds) && Number(ex.factMinutes) === Number(ex.minutes) && !ex.note ? 'done' : 'changed';
  if (ex.type === 'time') return Number(ex.factMinutes) === Number(ex.minutes) && !ex.note ? 'done' : 'changed';
  const p = planSets(ex), f = factSets(ex);
  if (!f.length) return 'todo';
  const same = p.length === f.length && p.every((s, i) => Number(s.weight || 0) === Number(f[i].weight || 0) && Number(s.reps || 0) === Number(f[i].reps || 0));
  return same && !ex.note ? 'done' : 'changed';
}
function valueAttr(v) { return v === null || v === undefined ? '' : String(v); }

function renderPlan() {
  const p = db.plan[currentAthlete];
  const current = p.workouts[p.activeIndex];
  const next = p.workouts[p.activeIndex + 1];
  planTwoList.innerHTML = [
    planCard(current, p.activeIndex, 'Текущая тренировка', true),
    next ? planCard(next, p.activeIndex + 1, 'Следующая тренировка', false) : emptyPlanCard('Следующая тренировка не задана')
  ].join('');
  const rest = p.workouts.slice(p.activeIndex + 2);
  planRestList.innerHTML = rest.length ? `<div class="rest-title">Дальше по плану</div>${rest.map((w, i) => planCard(w, p.activeIndex + 2 + i, 'Следующая после текущей', false, true)).join('')}` : '';
}
function planCard(w, index, label, isCurrent, compact = false) {
  if (!w) return '';
  const plan = totalsForWorkout({ ...w, exercises: w.exercises.map(e => ({...e, status:'done'})) }, 'plan');
  const exRows = w.exercises.map((ex, i) => `<div class="mini-ex-row"><strong>${i + 1}. ${escapeHtml(ex.name)}</strong><span>${escapeHtml(exercisePlanText(ex))}</span></div>`).join('');
  return `<article class="plan-card ${isCurrent ? 'current' : ''}">
    <div class="plan-label"><span>${label}</span>${isCurrent ? '<b>в Сегодня</b>' : ''}</div>
    <div class="mini-ex-list">${exRows}</div>
    <div class="plan-mini-metrics"><span>КПШ ${fmt(plan.reps)}</span><span>${plan.tonnage ? fmt(plan.tonnage) + ' кг' : 'кг —'}</span></div>
    <div class="plan-actions ${compact ? 'single' : ''}"><button class="small-btn" data-edit-plan="${index}" type="button">Открыть / корректировать</button>${isCurrent ? '<button class="small-btn solid" type="button" data-open="today">Уже в Сегодня</button>' : `<button class="small-btn solid" data-assign-plan="${index}" type="button">Сделать сегодняшней</button>`}</div>
  </article>`;
}
function emptyPlanCard(text) { return `<article class="plan-card"><div class="plan-label"><span>${text}</span></div></article>`; }
function assignPlan(index) {
  const p = db.plan[currentAthlete];
  if (!p.workouts[index]) return;
  if (!workoutIsValid(p.workouts[index])) {
    activeEditContext = 'plan';
    activeProgramIndex = null;
    activePlanIndex = index;
    renderPlanEditExercises();
    showOnly(planEditScreen);
    planEditState.textContent = 'ошибка в плане';
    return;
  }
  p.activeIndex = index;
  db.drafts[currentAthlete] = makeDraftFromPlan(currentAthlete);
  saveDb();
  showOnly(todayScreen);
  renderAll();
}
function workoutIsValid(w) {
  return !!w && Array.isArray(w.exercises) && w.exercises.length > 0 && w.exercises.every(ex => isExerciseFromLibrary(ex));
}


function editableWorkout() {
  return db.plan[currentAthlete]?.workouts?.[activePlanIndex] || null;
}
function editableWorkoutList() {
  return db.plan[currentAthlete]?.workouts || [];
}
function backFromPlanEditor() {
  showOnly(planScreen);
  renderPlan();
}

function openPlanEdit(index) {
  activeEditContext = 'plan';
  activeProgramIndex = null;
  activePlanIndex = index;
  const w = editableWorkout();
  planEditHeading.textContent = 'План тренировки';
  planEditState.textContent = 'редактирование';
  if (planSetTodayBtn) planSetTodayBtn.style.display = 'block';
  renderPlanEditExercises();
  showOnly(planEditScreen);
}
function renderPlanEditExercises() {
  const w = editableWorkout();
  planEditExercises.innerHTML = '';
  w.exercises.forEach((ex, i) => {
    const valid = isExerciseFromLibrary(ex);
    const card = document.createElement('article');
    card.className = `plan-ex-card ${valid ? '' : 'has-error'}`;
    card.innerHTML = `
      <div class="plan-ex-head">
        <div class="set-num">${i + 1}</div>
        <div class="exercise-input-wrap">
          <input class="edit-input exercise-name-input ${valid ? '' : 'invalid'}" data-plan-name="${i}" data-exercise-autocomplete="${i}" autocomplete="off" type="text" value="${escapeHtml(ex.name || '')}" placeholder="Начните вводить упражнение">
          <div class="exercise-suggest" data-suggest="${i}"></div>
          ${valid ? '' : '<small class="field-error">Выберите упражнение из базы</small>'}
        </div>
        <div class="plan-ex-tools"><button class="move-btn" data-move-plan-ex="${i}:up" type="button">Выше</button><button class="move-btn" data-move-plan-ex="${i}:down" type="button">Ниже</button><button class="clear-set-btn remove-wide" data-remove-plan-ex="${i}" type="button">Удалить</button></div>
      </div>
      <div class="plan-ex-grid">
        <label>Тип<select class="edit-select" data-plan-type="${i}" ${valid ? '' : 'disabled'}>
          <option value="strength" ${ex.type === 'strength' ? 'selected' : ''}>Вес + подходы</option>
          <option value="reps" ${ex.type === 'reps' ? 'selected' : ''}>Повторы без веса</option>
          <option value="rounds" ${ex.type === 'rounds' ? 'selected' : ''}>Раунды</option>
          <option value="time" ${ex.type === 'time' ? 'selected' : ''}>Время</option>
        </select></label>
        <label>Итог<input class="edit-input" type="text" value="${escapeHtml(valid ? exercisePlanText(ex) : '—')}" readonly></label>
      </div>
      <div class="plan-edit-fields" data-plan-fields="${i}">${valid ? planEditFieldsHtml(ex, i) : ''}</div>`;
    planEditExercises.appendChild(card);
  });
}
function planEditFieldsHtml(ex, i) {
  if (ex.type === 'rounds') return `<div class="round-row"><label>Раундов<input class="edit-input numeric-plan" data-plan-rounds="${i}" type="number" min="0" step="1" value="${valueAttr(ex.rounds)}"></label><label>Минут<input class="edit-input numeric-plan" data-plan-minutes="${i}" type="number" min="0" step="0.5" value="${valueAttr(ex.minutes)}"></label></div>`;
  if (ex.type === 'time') return `<div class="round-row"><label>Минут<input class="edit-input numeric-plan" data-plan-minutes="${i}" type="number" min="0" step="0.5" value="${valueAttr(ex.minutes)}"></label></div>`;
  const rows = (ex.sets || []).map((s, si) => `<div class="plan-set-row"><div class="set-num">${si + 1}</div><div class="set-field">${ex.type === 'strength' ? `<input class="num-input" data-plan-weight="${i}:${si}" type="number" min="0" step="0.5" value="${valueAttr(s.weight)}"><small>кг</small>` : ''}</div><div class="set-field"><input class="num-input" data-plan-reps="${i}:${si}" type="number" min="0" step="1" value="${valueAttr(s.reps)}"><small>раз</small></div><button class="clear-set-btn" data-remove-plan-set="${i}:${si}" type="button">×</button></div>`).join('');
  return `<div class="plan-set-list">${rows}</div><button class="ghost-btn full" data-add-plan-set="${i}" type="button">+ Добавить подход</button>`;
}
function updatePlanFromDom() {
  if (activePlanIndex === null) return true;
  const w = editableWorkout();
  let ok = true;
  w.exercises.forEach((ex, i) => {
    const input = planEditExercises.querySelector(`[data-plan-name="${i}"]`);
    if (!input) return;
    const typed = input.value.trim();
    const found = findExercise(typed);
    if (found) {
      ex.name = found.name;
      ex.exerciseId = found.name;
      if (ex.type !== found.type) applyLibraryTypeToExercise(ex, found.type);
      input.classList.remove('invalid');
    } else if (!isExerciseFromLibrary(ex) || normalizeText(typed) !== normalizeText(ex.name)) {
      ok = false;
      input.classList.add('invalid');
    }
  });
  return ok;
}

function isExerciseFromLibrary(ex) {
  return !!findExercise(ex.name || ex.exerciseId);
}


function exerciseMatches(ex, q) {
  const n = normalizeText(ex.name);
  const g = normalizeText(ex.group);
  const aliases = (ex.aliases || []).map(alias => normalizeText(alias));
  return n.startsWith(q) || n.includes(q) || g.includes(q) || aliases.some(alias => alias.startsWith(q) || alias.includes(q));
}
function renderLiveSuggestions(input) {
  const i = Number(input.dataset.exerciseAutocomplete);
  const q = normalizeText(input.value);
  const box = planEditExercises.querySelector(`[data-suggest="${i}"]`);
  if (!box) return;
  if (!q) { box.innerHTML = ''; box.classList.remove('is-open'); liveSuggestions[i] = []; return; }
  const seen = new Set();
  const starts = [];
  const includes = [];
  allExercises.forEach(ex => {
    const key = normalizeText(ex.name);
    if (seen.has(key)) return;
    if (!exerciseMatches(ex, q)) return;
    seen.add(key);
    if (normalizeText(ex.name).startsWith(q)) starts.push(ex); else includes.push(ex);
  });
  const list = starts.concat(includes).slice(0, 10);
  liveSuggestions[i] = list;
  if (!list.length) {
    box.innerHTML = `<div class="exercise-suggest-empty">Нет в базе. Сохранение будет запрещено.</div>`;
    box.classList.add('is-open');
    return;
  }
  box.innerHTML = list.map((ex, pos) => `<button type="button" class="exercise-suggest-item" data-exercise-pick="${i}" data-exercise-name="${escapeHtml(ex.name)}" data-suggest-pos="${pos}"><strong>${escapeHtml(ex.name)}</strong><span>${escapeHtml(ex.group)} · ${typeLabel(ex.type)}</span></button>`).join('');
  box.classList.add('is-open');
}

function scheduleLiveSuggestions(input) {
  clearTimeout(liveSuggestTimer);
  const saved = input;
  liveSuggestTimer = setTimeout(() => renderLiveSuggestions(saved), 80);
}
function hideLiveSuggestions(i = null) {
  const selector = i === null ? '.exercise-suggest' : `[data-suggest="${i}"]`;
  planEditExercises.querySelectorAll(selector).forEach(box => { box.innerHTML = ''; box.classList.remove('is-open'); });
}
function chooseExerciseSuggestion(i, name) {
  if (activePlanIndex === null) return;
  const w = editableWorkout();
  const ex = w?.exercises?.[i];
  const found = findExercise(name);
  if (!found || !ex) return;
  ex.name = found.name;
  ex.exerciseId = found.name;
  applyLibraryTypeToExercise(ex, found.type);
  const input = planEditExercises.querySelector(`[data-plan-name="${i}"]`);
  if (input) { input.value = found.name; input.classList.remove('invalid'); input.dataset.selectedExercise = found.name; }
  hideLiveSuggestions(i);
  planEditState.textContent = 'не сохранено';
  saveDb();
  renderPlanEditExercises();
}

function applyLibraryTypeToExercise(ex, type) {
  ex.type = type;
  if (type === 'strength') { ex.sets = ex.sets?.length ? ex.sets.map(s => ({ weight: s.weight || 0, reps: s.reps || 1 })) : [{ weight: 0, reps: 1 }]; delete ex.rounds; delete ex.minutes; }
  if (type === 'reps') { ex.sets = ex.sets?.length ? ex.sets.map(s => ({ weight: '', reps: s.reps || 1 })) : [{ weight: '', reps: 1 }]; delete ex.rounds; delete ex.minutes; }
  if (type === 'rounds') { ex.rounds = ex.rounds || 2; ex.minutes = ex.minutes || 2; delete ex.sets; }
  if (type === 'time') { ex.minutes = ex.minutes || 10; delete ex.sets; delete ex.rounds; }
}

function changePlanExerciseType(i, type) {
  const ex = editableWorkout().exercises[i];
  applyLibraryTypeToExercise(ex, type);
  renderPlanEditExercises();
  planEditState.textContent = 'не сохранено';
}
function savePlanEdit() {
  const ok = updatePlanFromDom() && validateActivePlanWorkout();
  if (!ok) {
    planEditState.textContent = 'ошибка в плане';
    renderPlanEditExercises();
    return false;
  }
  if (activeEditContext === 'plan') {
    const p = db.plan[currentAthlete];
    if (activePlanIndex === p.activeIndex) db.drafts[currentAthlete] = makeDraftFromPlan(currentAthlete);
  }
  saveDb();
  renderAll();
  planEditState.textContent = 'сохранено';
  return true;
}

function validateActivePlanWorkout() {
  if (activePlanIndex === null) return true;
  const w = editableWorkout();
  return w.exercises.length > 0 && w.exercises.every(ex => isExerciseFromLibrary(ex));
}
function addPlanExercise() {
  const w = editableWorkout();
  w.exercises.push({ name: '', type: 'strength', sets: [{ weight: 0, reps: 1 }] });
  renderPlanEditExercises(); planEditState.textContent = 'не сохранено';
}
function removePlanExercise(i) { editableWorkout().exercises.splice(i, 1); renderPlanEditExercises(); planEditState.textContent = 'не сохранено'; }
function movePlanExercise(i, dir) {
  const list = editableWorkout().exercises;
  const j = dir === 'up' ? i - 1 : i + 1;
  if (j < 0 || j >= list.length) return;
  const tmp = list[i]; list[i] = list[j]; list[j] = tmp;
  saveDb();
  renderPlanEditExercises();
  planEditState.textContent = 'не сохранено';
}
function addPlanSet(i) { const ex = editableWorkout().exercises[i]; ex.sets ||= []; ex.sets.push({ weight: ex.type === 'strength' ? 0 : '', reps: 1 }); renderPlanEditExercises(); planEditState.textContent = 'не сохранено'; }
function removePlanSet(i, si) { const ex = editableWorkout().exercises[i]; ex.sets.splice(si, 1); renderPlanEditExercises(); planEditState.textContent = 'не сохранено'; }
function updatePlanNumeric(i, field, value, si = null) {
  const ex = editableWorkout().exercises[i];
  if (field === 'rounds' || field === 'minutes') ex[field] = value;
  if (field === 'weight' || field === 'reps') { ex.sets[si] ||= { weight: '', reps: '' }; ex.sets[si][field] = value; }
  planEditState.textContent = 'не сохранено';
  saveDb();
}


function renderExerciseDatalist() {
  const dl = document.getElementById('exerciseOptions');
  if (!dl) return;
  dl.innerHTML = allExercises.map(x => `<option value="${escapeHtml(x.name)}">${escapeHtml(x.group)}</option>`).join('');
}
function renderExerciseLibrary(activeGroup = null) {
  if (!muscleGrid || !exerciseGroupPanel) return;
  muscleGrid.innerHTML = Object.keys(exerciseLibrary).map(group => `
    <button class="muscle-card" data-muscle-group="${escapeHtml(group)}" type="button">
      <strong>${escapeHtml(group)}</strong>
      <small>${exerciseLibrary[group].length} упражнений</small>
    </button>`).join('');
  const group = activeGroup || Object.keys(exerciseLibrary)[0];
  renderExerciseGroup(group);
}
function renderExerciseGroup(group) {
  if (!exerciseGroupPanel) return;
  const items = exerciseLibrary[group] || [];
  exerciseGroupPanel.innerHTML = `
    <section class="exercise-group-card">
      <h3>${escapeHtml(group)}</h3>
      <div class="exercise-library-list">
        ${items.map(x => `<div class="library-ex-row"><strong>${escapeHtml(x.name)}</strong><span>${typeLabel(x.type)}</span></div>`).join('')}
      </div>
    </section>`;
}
function typeLabel(type) {
  return type === 'strength' ? 'вес + повторы' : type === 'reps' ? 'повторы' : type === 'rounds' ? 'раунды' : 'время';
}

function saveWorkout() {
  const w = getWorkout();
  if (!workoutIsValid(w)) {
    qfitAlert('В тренировке есть упражнение не из базы. Исправьте план перед сохранением.', 'План содержит ошибку');
    return;
  }
  w.comment = generalComment.value.trim();
  const entry = clone(w);
  entry.savedAt = new Date().toLocaleDateString('ru-RU');
  entry.planTotals = totalsForWorkout(w, 'plan');
  entry.factTotals = totalsForWorkout(w, 'fact');
  entry.id = `${w.athlete}-${w.sourceId}-${new Date().toISOString().slice(0,10)}`;
  db.history[currentAthlete] = (db.history[currentAthlete] || []).filter(x => x.id !== entry.id);
  db.history[currentAthlete].unshift(entry);
  const p = db.plan[currentAthlete];
  if (p.activeIndex < p.workouts.length - 1) p.activeIndex += 1;
  db.drafts[currentAthlete] = makeDraftFromPlan(currentAthlete);
  saveState.textContent = 'сохранено';
  saveDb();
  renderAll();
  renderSavedSummary(entry);
  showOnly(savedScreen);
}
function renderSavedSummary(entry) {
  if (!savedSummary || !entry) return;
  const plan = entry.planTotals || totalsForWorkout(entry, 'plan');
  const fact = entry.factTotals || totalsForWorkout(entry, 'fact');
  const started = true;
  savedSummary.innerHTML = `
    <section class="saved-card">
      <span class="eyebrow">СОХРАНЕНО</span>
      <h3>${escapeHtml(entry.savedAt || '')}</h3>
      <div class="progress-summary compact-summary">
        ${progressBlock({ title: 'КПШ', started }, fact.reps, plan.reps, '')}
        ${progressBlock({ title: 'Тоннаж', started }, fact.tonnage, plan.tonnage, ' кг')}
      </div>
      ${entry.comment ? `<div class="journal-note"><span>Комментарий:</span> ${escapeHtml(entry.comment)}</div>` : ''}
    </section>`;
}
function renderJournal() {
  const items = db.history[currentAthlete] || [];
  const dataPanel = dataToolsHtml();
  if (!items.length) {
    journalList.innerHTML = `<section class="journal-card"><h3>Пока пусто</h3><small>Сохранённые тренировки появятся здесь.</small></section>${dataPanel}`;
    return;
  }
  journalList.innerHTML = items.map(w => {
    const plan = w.planTotals || totalsForWorkout(w, 'plan');
    const fact = w.factTotals || totalsForWorkout(w, 'fact');
    const started = true;
    const rows = w.exercises.map(ex => {
      const diff = exerciseDiffText(ex);
      return `<article class="journal-exercise">
        <h4>${escapeHtml(ex.name)}</h4>
        <div><span>План:</span> ${escapeHtml(exercisePlanText(ex))}</div>
        <div><span>Факт:</span> ${escapeHtml(factText(ex) || '—')}</div>
        ${diff ? `<div class="journal-diff">${escapeHtml(diff)}</div>` : ''}
        ${ex.note ? `<div class="journal-note"><span>Комментарий:</span> ${escapeHtml(ex.note)}</div>` : ''}
      </article>`;
    }).join('');
    return `<section class="journal-card journal-card-polished">
      <h3>${escapeHtml(w.savedAt || '')}</h3>
      <div class="progress-summary compact-summary">
        ${progressBlock({ title: 'КПШ', started }, fact.reps, plan.reps, '')}
        ${progressBlock({ title: 'Тоннаж', started }, fact.tonnage, plan.tonnage, ' кг')}
      </div>
      <div class="journal-ex-list">${rows}</div>
      ${w.comment ? `<div class="journal-note total-note"><span>Комментарий к тренировке:</span> ${escapeHtml(w.comment)}</div>` : ''}
    </section>`;
  }).join('') + dataPanel;
}
function dataToolsHtml() {
  return `<section class="journal-card data-card">
    <h3>Данные</h3>
    <small>Резервная копия нужна до перехода на облако. Пока всё хранится в браузере.</small>
    <button class="primary-btn save-btn" id="exportJsonBtn" type="button">Экспорт JSON</button>
    <button class="ghost-btn full" id="importJsonBtn" type="button">Импорт JSON</button>
    <input id="importJsonFile" type="file" accept="application/json" hidden>
    <button class="ghost-btn full danger" id="resetDbBtn" type="button">Сброс базы</button>
  </section>`;
}
function exportDb() {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `qfit_journal_backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function importDbFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      db = migrateDb(imported);
      saveDb();
      ensureDb();
      db.drafts ||= {};
      renderAll();
      qfitAlert('Данные импортированы.', 'Импорт завершён');
    } catch (err) {
      qfitAlert('Не удалось импортировать файл. Проверьте JSON.', 'Ошибка импорта');
      console.error(err);
    }
  };
  reader.readAsText(file);
}
function resetDb() {
  qfitConfirm('Удалить все данные QFit Journal и вернуть стартовый план?', () => {
    localStorage.removeItem(DB_KEY);
    db = { schemaVersion: DB_VERSION, plan: clone(defaultPlan), programs: makeDefaultPrograms(), drafts: {}, history: { ruslan: [], arslan: [] } };
    saveDb();
    renderAll();
    qfitAlert('База сброшена.', 'Готово');
  }, 'Сброс базы', 'Сбросить');
}
function markUnsaved() { if (saveState) saveState.textContent = 'не сохранено'; }

$('startBtn').addEventListener('click', openApp);
$('profileBackBtn').addEventListener('click', goStart);
$('menuBackBtn').addEventListener('click', () => APP_MODE === 'admin' ? showOnly(profileScreen) : goStart());
$('todayBackBtn').addEventListener('click', () => showOnly(menuScreen));
$('setsBackBtn').addEventListener('click', closeExerciseEdit);
$('setsDoneBtn').addEventListener('click', closeExerciseEdit);
$('fillPlanBtn').addEventListener('click', fillByPlan);
$('addSetBtn').addEventListener('click', addSet);
$('planEditBackBtn').addEventListener('click', () => { if (savePlanEdit()) backFromPlanEditor(); });
$('planSaveBtn').addEventListener('click', savePlanEdit);
$('planAddExerciseBtn').addEventListener('click', addPlanExercise);
$('planSetTodayBtn').addEventListener('click', () => { if (activeEditContext === 'plan' && savePlanEdit()) assignPlan(activePlanIndex); });
createProgramBtn?.addEventListener('click', createProgram);
$('programDetailBackBtn')?.addEventListener('click', () => { showOnly(programsScreen); renderPrograms(); });
$('activateProgramBtn')?.addEventListener('click', () => activateProgram(activeProgramIndex));
$('saveWorkoutBtn').addEventListener('click', saveWorkout);
$('exportJsonBtn')?.addEventListener('click', exportDb);
$('importJsonBtn')?.addEventListener('click', () => $('importJsonFile')?.click());
$('importJsonFile')?.addEventListener('change', (e) => importDbFile(e.target.files?.[0]));
$('resetDbBtn')?.addEventListener('click', resetDb);
generalComment.addEventListener('input', () => { getWorkout().comment = generalComment.value; markUnsaved(); saveDb(); });
exerciseComment.addEventListener('input', () => { if (activeExerciseIndex !== null) { getWorkout().exercises[activeExerciseIndex].note = exerciseComment.value; markUnsaved(); saveDb(); } });

function screenByName(name) { return { today: todayScreen, plan: planScreen, programs: programsScreen, journal: journalScreen, base: baseScreen }[name] || menuScreen; }
function handleSuggestionPick(e) {
  const programPicked = e.target.closest('[data-program-exercise-pick]');
  if (programPicked) {
    e.preventDefault();
    e.stopPropagation();
    const name = programPicked.dataset.programExercisePick || programPicked.getAttribute('data-program-exercise-pick');
    const now = Date.now();
    if (e.type === 'click' && name && lastSuggestionPick.name === name && now - lastSuggestionPick.time < 500) return true;
    if (name) {
      lastSuggestionPick = { time: now, name };
      addProgramExerciseByName(name);
    }
    return true;
  }
  const picked = e.target.closest('[data-exercise-pick]');
  if (!picked) return false;
  e.preventDefault();
  e.stopPropagation();
  const i = Number(picked.dataset.exercisePick);
  const name = picked.dataset.exerciseName || liveSuggestions[i]?.[Number(picked.dataset.suggestPos)]?.name;
  const key = `plan:${i}:${name || ''}`;
  const now = Date.now();
  if (e.type === 'click' && name && lastSuggestionPick.name === key && now - lastSuggestionPick.time < 500) return true;
  if (name) {
    lastSuggestionPick = { time: now, name: key };
    chooseExerciseSuggestion(i, name);
  }
  return true;
}

document.addEventListener('pointerdown', (e) => { handleSuggestionPick(e); }, true);
document.addEventListener('click', (e) => {
  if (handleSuggestionPick(e)) return;
  if (!e.target.closest('.exercise-input-wrap')) hideLiveSuggestions();
  if (!e.target.closest('.program-picker-wrap')) hideProgramExerciseSuggestions();
  const profile = e.target.closest('[data-profile-athlete]'); if (profile) return selectProfile(profile.dataset.profileAthlete);
  const open = e.target.closest('[data-open]'); if (open) { showOnly(screenByName(open.dataset.open)); renderAll(); return; }
  if (e.target.closest('[data-back-menu]')) return showOnly(menuScreen);
  const status = e.target.closest('[data-status]'); if (status) { const idx = Number(status.dataset.index); const st = status.dataset.status; return st === 'changed' ? openExerciseEdit(idx) : setStatus(idx, st); }
  const clear = e.target.closest('[data-clear-set]'); if (clear) return clearSet(Number(clear.dataset.clearSet));
  const assign = e.target.closest('[data-assign-plan]'); if (assign) return assignPlan(Number(assign.dataset.assignPlan));
  const edit = e.target.closest('[data-edit-plan]'); if (edit) return openPlanEdit(Number(edit.dataset.editPlan));
  const moveEx = e.target.closest('[data-move-plan-ex]'); if (moveEx) { const [i, dir] = moveEx.dataset.movePlanEx.split(':'); return movePlanExercise(Number(i), dir); }
  const removeEx = e.target.closest('[data-remove-plan-ex]'); if (removeEx) return removePlanExercise(Number(removeEx.dataset.removePlanEx));
  const addSetBtn = e.target.closest('[data-add-plan-set]'); if (addSetBtn) return addPlanSet(Number(addSetBtn.dataset.addPlanSet));
  const removePlanSetBtn = e.target.closest('[data-remove-plan-set]'); if (removePlanSetBtn) { const [i, si] = removePlanSetBtn.dataset.removePlanSet.split(':').map(Number); return removePlanSet(i, si); }
  if (e.target.closest('#exportJsonBtn')) return exportDb();
  if (e.target.closest('#importJsonBtn')) return $('importJsonFile')?.click();
  if (e.target.closest('#resetDbBtn')) return resetDb();
  const openProgram = e.target.closest('[data-open-program]'); if (openProgram) return openProgramDetail(Number(openProgram.dataset.openProgram));
  const editSaved = e.target.closest('[data-edit-program]'); if (editSaved) return editSavedProgram(Number(editSaved.dataset.editProgram));
  const activate = e.target.closest('[data-activate-program]'); if (activate) return activateProgram(Number(activate.dataset.activateProgram));
  const copy = e.target.closest('[data-copy-program]'); if (copy) return copyProgram(Number(copy.dataset.copyProgram));
  const delProgram = e.target.closest('[data-delete-program]'); if (delProgram) return deleteProgram(Number(delProgram.dataset.deleteProgram));
  const muscle = e.target.closest('[data-muscle-group]'); if (muscle) return renderExerciseGroup(muscle.dataset.muscleGroup);
});
document.addEventListener('input', (e) => {
  if (e.target.matches('[data-set-weight]')) return updateSet(Number(e.target.dataset.setWeight), 'weight', e.target.value);
  if (e.target.matches('[data-set-reps]')) return updateSet(Number(e.target.dataset.setReps), 'reps', e.target.value);
  if (e.target.matches('[data-rounds-fact]')) return updateSimpleFact('factRounds', e.target.value);
  if (e.target.matches('[data-minutes-fact]')) return updateSimpleFact('factMinutes', e.target.value);
  if (e.target.matches('[data-plan-name]')) { scheduleLiveSuggestions(e.target); planEditState.textContent = 'не сохранено'; return; }
  if (e.target.matches('[data-program-exercise-search]')) { renderProgramExerciseSuggestions(e.target); return; }
  if (e.target.matches('[data-plan-type]')) return changePlanExerciseType(Number(e.target.dataset.planType), e.target.value);
  if (e.target.matches('[data-plan-rounds]')) return updatePlanNumeric(Number(e.target.dataset.planRounds), 'rounds', e.target.value);
  if (e.target.matches('[data-plan-minutes]')) return updatePlanNumeric(Number(e.target.dataset.planMinutes), 'minutes', e.target.value);
  if (e.target.matches('[data-plan-weight]')) { const [i, si] = e.target.dataset.planWeight.split(':').map(Number); return updatePlanNumeric(i, 'weight', e.target.value, si); }
  if (e.target.matches('[data-plan-reps]')) { const [i, si] = e.target.dataset.planReps.split(':').map(Number); return updatePlanNumeric(i, 'reps', e.target.value, si); }
});

document.addEventListener('change', (e) => {
  if (e.target.matches('#importJsonFile')) return importDbFile(e.target.files?.[0]);
  if (e.target.matches('[data-plan-name]')) {
    const i = Number(e.target.dataset.planName);
    const found = findExercise(e.target.value);
    if (found) chooseExerciseSuggestion(i, found.name);
    else { hideLiveSuggestions(i); planEditState.textContent = 'выберите упражнение из базы'; e.target.classList.add('invalid'); }
  }
});

document.addEventListener('focusin', (e) => { if (!e.target.matches('[data-plan-name]') && !e.target.closest('.exercise-input-wrap')) hideLiveSuggestions(); if (!e.target.matches('[data-program-exercise-search]') && !e.target.closest('.program-picker-wrap')) hideProgramExerciseSuggestions(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideLiveSuggestions(); if (e.target.matches('input[type="number"]') && ['e','E','+','-'].includes(e.key)) e.preventDefault(); });
document.addEventListener('paste', (e) => { if (!e.target.matches('input[type="number"]')) return; const text = (e.clipboardData || window.clipboardData).getData('text').trim(); if (!/^\d*([,.]\d*)?$/.test(text)) e.preventDefault(); });

ensureDb();
renderAll();


/* ==============================
   v30 — Program Table Builder
   Логика: создать программу → таблица тренировок → прогрессия по упражнениям → просмотр.
   ============================== */
function makeDefaultPrograms() {
  return {
    ruslan: [createStarterTableProgram('ruslan', 'Стартовый силовой цикл')],
    arslan: [createStarterTableProgram('arslan', 'Арслан — техника и возврат')]
  };
}

function createStarterTableProgram(k, name) {
  const source = defaultPlan[k]?.workouts?.length ? defaultPlan[k].workouts : defaultPlan.ruslan.workouts;
  const program = createEmptyTableProgram(name || 'Силовой цикл', 6);
  for (let ti = 0; ti < program.trainingCount; ti++) {
    const src = source[ti % source.length];
    (src.exercises || []).forEach(raw => {
      const found = findExercise(raw.name);
      if (!found) return;
      let pEx = program.exercises.find(x => normalizeText(x.name) === normalizeText(found.name));
      if (!pEx) {
        pEx = { uid: uid(), name: found.name, type: found.type };
        program.exercises.push(pEx);
        program.progression[pEx.uid] = {};
      }
      if (!program.workoutExercises[ti].includes(pEx.uid)) program.workoutExercises[ti].push(pEx.uid);
      program.progression[pEx.uid][ti] = compactCellFromExercise(raw);
    });
  }
  normalizeProgramShape(program);
  return program;
}

function createEmptyMatrixProgram(name = 'Новая программа', trainingCount = 6) {
  return createEmptyTableProgram(name, trainingCount);
}

function createEmptyTableProgram(name = 'Новая программа', trainingCount = 6) {
  const count = Math.max(1, Math.min(60, num(trainingCount) || 6));
  return {
    id: makeWorkoutId('program'),
    name,
    trainingCount: count,
    createdAt: new Date().toISOString(),
    exercises: [],
    progression: {},
    workoutExercises: Array.from({ length: count }, () => [])
  };
}

function normalizeProgramShape(program) {
  program.id ||= makeWorkoutId('program');
  program.name ||= 'Новая программа';
  program.trainingCount = Math.max(1, Math.min(60, num(program.trainingCount || program.workouts?.length || 6) || 6));
  program.exercises ||= [];
  program.progression ||= {};

  // Миграция старой логики A/B/C в новую таблицу тренировок.
  if (!Array.isArray(program.workoutExercises)) {
    program.workoutExercises = Array.from({ length: program.trainingCount }, (_, ti) => {
      if (Array.isArray(program.workouts) && program.workouts[ti]) return [];
      const day = program.sequence?.[ti] || ['A','B','C'][ti % 3];
      return Array.from(new Set(program.dayTemplates?.[day] || []));
    });
  }

  if ((!program.exercises || !program.exercises.length) && Array.isArray(program.workouts) && program.workouts.length) {
    program.exercises = [];
    program.progression = {};
    program.trainingCount = program.workouts.length;
    program.workoutExercises = Array.from({ length: program.trainingCount }, () => []);
    program.workouts.forEach((w, wi) => {
      (w.exercises || []).forEach(raw => {
        const found = findExercise(raw.name);
        if (!found) return;
        let pEx = program.exercises.find(x => normalizeText(x.name) === normalizeText(found.name));
        if (!pEx) {
          pEx = { uid: uid(), name: found.name, type: found.type };
          program.exercises.push(pEx);
          program.progression[pEx.uid] = {};
        }
        program.progression[pEx.uid][wi] = compactCellFromExercise(raw);
        if (!program.workoutExercises[wi].includes(pEx.uid)) program.workoutExercises[wi].push(pEx.uid);
      });
    });
  }

  program.exercises = (program.exercises || []).map(ex => {
    const found = findExercise(ex.name || ex.exerciseId);
    const item = {
      uid: ex.uid || uid(),
      name: found ? found.name : (ex.name || ''),
      type: found ? found.type : (['strength', 'reps', 'rounds', 'time'].includes(ex.type) ? ex.type : 'strength')
    };
    program.progression[item.uid] ||= {};
    for (let i = 0; i < program.trainingCount; i++) program.progression[item.uid][i] ||= defaultCellForType(item.type);
    return item;
  });

  const validUids = new Set(program.exercises.map(ex => ex.uid));
  program.workoutExercises = Array.from({ length: program.trainingCount }, (_, i) => {
    const existing = Array.isArray(program.workoutExercises?.[i]) ? program.workoutExercises[i] : [];
    return Array.from(new Set(existing.filter(uidKey => validUids.has(uidKey))));
  });
  Object.keys(program.progression).forEach(uidKey => { if (!validUids.has(uidKey)) delete program.progression[uidKey]; });
  delete program.workouts;
  delete program.dayTemplates;
  delete program.sequence;
}

function findExerciseInWorkout(workout, name) {
  return (workout?.exercises || []).find(ex => normalizeText(ex.name) === normalizeText(name));
}

function compactCellFromExercise(ex) {
  normalizeExerciseShape(ex);
  if (ex.type === 'rounds') return { rounds: num(ex.rounds) || 0, minutes: num(ex.minutes) || 0 };
  if (ex.type === 'time') return { minutes: num(ex.minutes) || 0 };
  const sets = ex.sets || [];
  if (ex.type === 'reps') return { sets: sets.length || 1, reps: num(sets[0]?.reps) || 1 };
  return { weight: num(sets[0]?.weight), sets: sets.length || 1, reps: num(sets[0]?.reps) || 1 };
}

function defaultCellForType(type) {
  if (type === 'rounds') return { rounds: 2, minutes: 2 };
  if (type === 'time') return { minutes: 10 };
  if (type === 'reps') return { sets: 1, reps: 10 };
  return { weight: 0, sets: 1, reps: 5 };
}

function adjustProgramTrainingCount(program, newCount, save = true) {
  const count = Math.max(1, Math.min(60, num(newCount) || 6));
  program.trainingCount = count;
  program.workoutExercises ||= [];
  while (program.workoutExercises.length < count) program.workoutExercises.push([]);
  if (program.workoutExercises.length > count) program.workoutExercises.length = count;
  (program.exercises || []).forEach(ex => {
    program.progression[ex.uid] ||= {};
    for (let i = 0; i < count; i++) program.progression[ex.uid][i] ||= defaultCellForType(ex.type);
    Object.keys(program.progression[ex.uid]).forEach(k => { if (Number(k) >= count) delete program.progression[ex.uid][k]; });
  });
  if (activeProgramTrainingIndex >= count) activeProgramTrainingIndex = count - 1;
  if (save) { saveDb(); renderProgramBuilder(); renderPrograms(); }
}

function cellToExercise(program, pEx, ti) {
  const cell = (program.progression?.[pEx.uid] || {})[ti] || defaultCellForType(pEx.type);
  const found = findExercise(pEx.name);
  const type = found?.type || pEx.type;
  if ((type === 'strength' || type === 'reps') && Array.isArray(cell.detailedSets) && cell.detailedSets.length) {
    return {
      name: pEx.name,
      type,
      sets: cell.detailedSets.map(s => ({ weight: type === 'strength' ? num(s.weight) : '', reps: num(s.reps) }))
    };
  }
  if (type === 'rounds') return rounds(pEx.name, num(cell.rounds), num(cell.minutes));
  if (type === 'time') return timeOnly(pEx.name, num(cell.minutes));
  if (type === 'reps') return repsOnly(pEx.name, Math.max(0, num(cell.sets)), num(cell.reps));
  return strength(pEx.name, num(cell.weight), Math.max(0, num(cell.sets)), num(cell.reps));
}
function cellText(program, pEx, ti) { return exercisePlanText(cellToExercise(program, pEx, ti)); }

function buildWorkoutsFromProgram(program) {
  normalizeProgramShape(program);
  return Array.from({ length: program.trainingCount }, (_, ti) => {
    const uids = program.workoutExercises[ti] || [];
    const exercises = uids.map(uidKey => program.exercises.find(x => x.uid === uidKey)).filter(Boolean).map(pEx => cellToExercise(program, pEx, ti));
    return { id: makeWorkoutId(`program-${ti + 1}`), title: `Тренировка ${ti + 1}`, cycle: program.name, day: `Т${ti + 1}`, exercises };
  });
}

function programTotals(program) {
  return buildWorkoutsFromProgram(program).reduce((acc, w) => {
    const t = totalsForWorkout({ ...w, exercises: w.exercises.map(e => ({ ...e, status: 'done' })) }, 'plan');
    acc.reps += t.reps; acc.tonnage += t.tonnage; return acc;
  }, { reps: 0, tonnage: 0 });
}
function programStatus(program) {
  normalizeProgramShape(program);
  const used = program.workoutExercises.filter(list => list.length).length;
  if (!program.exercises.length) return { key: 'empty', text: 'Пустая: добавьте упражнения', ready: false };
  if (!used) return { key: 'empty', text: 'Пустая: выберите упражнения в тренировках', ready: false };
  if (used < program.trainingCount) return { key: 'partial', text: `В работе: заполнено ${used}/${program.trainingCount}`, ready: true };
  return { key: 'ready', text: 'Готова к отправке в План', ready: true };
}
function workoutHasStarted(target = currentAthlete) {
  const w = typeof target === 'string' ? db.drafts?.[target] : target;
  if (!w) return false;
  if ((w.comment || '').trim()) return true;
  return (w.exercises || []).some(ex =>
    (ex.status && ex.status !== 'todo') ||
    (ex.factSets || []).length ||
    ex.factRounds ||
    ex.factMinutes ||
    ex.factText ||
    ex.note
  );
}

function setProgramHomeMode(mode = 'my') {
  const create = $('programCreatePanel');
  const choose = $('programChoosePanel');
  if (create) create.hidden = mode !== 'create';
  if (choose) choose.hidden = mode !== 'choose';
  document.querySelectorAll('[data-program-home]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.programHome === mode));
  renderPrograms(mode);
}

function renderPrograms(mode = 'my') {
  if (!programList) return;
  ensureDb();
  const items = db.programs[currentAthlete] || [];
  if (mode === 'create') { programList.innerHTML = ''; return; }
  if (!items.length) {
    programList.innerHTML = `<section class="program-card"><h3>Пока нет программ</h3><p>Создайте цикл и он появится здесь.</p></section>`;
    return;
  }
  programList.innerHTML = items.map((program, i) => {
    normalizeProgramShape(program);
    const totals = programTotals(program);
    const status = programStatus(program);
    const disabled = status.ready ? '' : 'disabled aria-disabled="true"';
    return `<article class="program-card program-status-${status.key}">
      <div class="program-card-head"><div><span class="eyebrow">ПРОГРАММА</span><h3>${escapeHtml(program.name)}</h3><p>${program.trainingCount} тренировок · упражнений: ${program.exercises.length}</p><div class="program-status">${escapeHtml(status.text)}</div></div></div>
      <div class="plan-mini-metrics"><span>КПШ ${fmt(totals.reps)}</span><span>${totals.tonnage ? fmt(totals.tonnage) + ' кг' : 'кг —'}</span></div>
      <div class="program-actions"><button class="small-btn solid" data-open-program="${i}" type="button">Открыть</button><button class="small-btn" data-activate-program="${i}" type="button" ${disabled}>В План</button><button class="small-btn" data-copy-program="${i}" type="button">Копия</button><button class="small-btn danger" data-delete-program="${i}" type="button">Удалить</button></div>
    </article>`;
  }).join('');
}

function createProgram() {
  const name = (programNameInput?.value || '').trim();
  if (!name) {
    programNameInput?.classList.add('invalid'); programNameInput?.focus();
    qfitAlert('Введите название программы. Например: Жимовой цикл.', 'Название обязательно'); return;
  }
  const count = num($('programCountInput')?.value) || 6;
  const program = createEmptyTableProgram(name, count);
  db.programs[currentAthlete] ||= [];
  db.programs[currentAthlete].unshift(program);
  if (programNameInput) programNameInput.value = '';
  activeProgramTab = 'schedule'; activeProgramTrainingIndex = 0; activeProgramExerciseUid = null;
  saveDb(); renderPrograms('my'); openProgramDetail(0);
}

function openProgramDetail(index) {
  ensureDb(); activeProgramIndex = index;
  const program = db.programs[currentAthlete]?.[index]; if (!program) return;
  normalizeProgramShape(program);
  activeProgramTab ||= 'schedule'; activeProgramTrainingIndex = Math.min(activeProgramTrainingIndex || 0, program.trainingCount - 1);
  if (!activeProgramExerciseUid || !program.exercises.some(ex => ex.uid === activeProgramExerciseUid)) activeProgramExerciseUid = program.exercises[0]?.uid || null;
  renderProgramBuilder(); showOnly(programDetailScreen);
}

function renderProgramBuilder() {
  const program = db.programs[currentAthlete]?.[activeProgramIndex]; if (!program) return;
  normalizeProgramShape(program);
  if (!activeProgramExerciseUid || !program.exercises.some(ex => ex.uid === activeProgramExerciseUid)) activeProgramExerciseUid = program.exercises[0]?.uid || null;
  const totals = programTotals(program); const status = programStatus(program);
  $('programDetailTitle').textContent = program.name;
  $('programDetailMeta').textContent = `Таблица на ${program.trainingCount} тренировок. Сначала состав, потом прогрессия.`;
  $('programDetailState').textContent = status.text;
  const activateBtn = $('activateProgramBtn'); if (activateBtn) activateBtn.style.display = activeProgramTab === 'preview' ? '' : 'none';
  const summary = $('programBuilderSummary');
  if (summary) summary.innerHTML = `<section class="program-builder-head-card"><label>Название<input class="edit-input" data-program-name-edit type="text" value="${escapeHtml(program.name)}"></label><label>Количество тренировок<input class="edit-input" data-program-training-count type="number" min="1" max="60" step="1" value="${program.trainingCount}"></label><div class="program-status">${escapeHtml(status.text)}</div><div class="plan-mini-metrics"><span>Упр. ${program.exercises.length}</span><span>КПШ ${fmt(totals.reps)}</span><span>${totals.tonnage ? fmt(totals.tonnage) + ' кг' : 'кг —'}</span></div></section>`;
  document.querySelectorAll('[data-program-tab]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.programTab === activeProgramTab));
  const panel = $('programBuilderPanel'); if (!panel) return;
  panel.innerHTML = activeProgramTab === 'progression' ? programProgressionHtml(program) : activeProgramTab === 'preview' ? programPreviewHtml(program) : programScheduleHtml(program);
}

function programScheduleHtml(program) {
  const tabs = Array.from({ length: program.trainingCount }, (_, i) => `<button class="train-tab ${i === activeProgramTrainingIndex ? 'is-active' : ''}" data-program-training-tab="${i}" type="button">Т${i + 1}</button>`).join('');
  const current = program.workoutExercises[activeProgramTrainingIndex] || [];
  const currentRows = current.map((uidKey, ix) => {
    const ex = program.exercises.find(x => x.uid === uidKey); if (!ex) return '';
    return `<div class="workout-ex-row"><strong>${ix + 1}. ${escapeHtml(ex.name)}</strong><span>${escapeHtml(cellText(program, ex, activeProgramTrainingIndex))}</span><button class="mini-remove" data-program-ex-delete="${activeProgramTrainingIndex}:${uidKey}" type="button">×</button></div>`;
  }).join('') || `<p class="muted-note">В этой тренировке упражнений пока нет.</p>`;
  const overview = program.workoutExercises.map((list, ti) => `<button class="program-training-row ${ti === activeProgramTrainingIndex ? 'is-active' : ''}" data-program-training-tab="${ti}" type="button"><strong>Тренировка ${ti + 1}</strong><span>${list.map(uidKey => program.exercises.find(x => x.uid === uidKey)?.name).filter(Boolean).join(', ') || 'пусто'}</span></button>`).join('');
  return `<section class="program-card"><h3>Таблица тренировок</h3><p>Выберите тренировку и добавьте упражнения. В итоге получится список: Т1 — упражнения, Т2 — упражнения и так далее.</p><div class="training-tabbar">${tabs}</div></section>
    <section class="program-card"><h3>Тренировка ${activeProgramTrainingIndex + 1}</h3><label>Поиск упражнения</label><div class="program-picker-wrap"><input id="programExerciseInput" class="edit-input" data-program-exercise-search autocomplete="off" type="text" placeholder="Например: жим" oninput="renderProgramExerciseSuggestions(this)"><div id="programExerciseSuggest" class="program-picker-results"></div><small class="field-hint">Нажмите вариант из списка — упражнение сразу попадёт в выбранную тренировку.</small></div><button class="ghost-btn full" data-program-add-exercise type="button">Добавить точное совпадение <span>＋</span></button><div class="workout-ex-list">${currentRows}</div></section>
    <section class="program-card"><h3>Состав программы</h3><div class="program-training-table">${overview}</div></section>`;
}

function programProgressionHtml(program) {
  if (!program.exercises.length) return `<section class="program-card"><h3>Сначала добавьте упражнения</h3><p>После выбора упражнений появится таблица прогрессии.</p></section>`;
  const selected = program.exercises.find(ex => ex.uid === activeProgramExerciseUid) || program.exercises[0];
  const exTabs = program.exercises.map(ex => `<button class="train-tab ${selected.uid === ex.uid ? 'is-active' : ''}" data-program-ex-select="${ex.uid}" type="button">${escapeHtml(ex.name)}</button>`).join('');
  return `<section class="program-card"><h3>Прогрессия по упражнению</h3><p>Выберите упражнение и заполните его значения по всем тренировкам цикла.</p><div class="training-tabbar exercise-switcher">${exTabs}</div></section>${programProgressionMatrix(program, selected)}`;
}
function programProgressionMatrix(program, pEx) {
  if (!pEx) return '';
  const rows = Array.from({ length: program.trainingCount }, (_, ti) => progressionMatrixRow(program, pEx, ti)).join('');
  const actions = pEx.type === 'strength' ? `<button class="small-btn" data-program-line-copy="${pEx.uid}" type="button">Т1 во все</button><button class="small-btn" data-program-line-linear="${pEx.uid}:2.5" type="button">Линия +2,5</button><button class="small-btn" data-program-line-linear="${pEx.uid}:5" type="button">Линия +5</button><button class="small-btn danger" data-program-line-clear="${pEx.uid}" type="button">Очистить всё</button>` : `<button class="small-btn" data-program-line-copy="${pEx.uid}" type="button">Т1 во все</button><button class="small-btn danger" data-program-line-clear="${pEx.uid}" type="button">Очистить всё</button>`;
  return `<article class="program-matrix-card"><div class="program-cell-title"><div><strong>${escapeHtml(pEx.name)}</strong><small>${typeLabel(pEx.type)} · все тренировки цикла</small></div></div><div class="prog-table">${rows}</div><div class="program-actions matrix-actions line-actions">${actions}</div></article>`;
}
function progressionMatrixRow(program, pEx, ti) {
  const cell = (program.progression[pEx.uid] || {})[ti] || defaultCellForType(pEx.type);
  const inWorkout = (program.workoutExercises[ti] || []).includes(pEx.uid);
  const label = `Т${ti + 1}${inWorkout ? '' : ' · нет в составе'}`;
  if (pEx.type === 'rounds') return `<div class="prog-row prog-row-three ${inWorkout ? '' : 'is-muted'}"><span class="prog-tag">${label}</span><label><small>Раунды</small><input class="edit-input" data-program-cell-at="${pEx.uid}:${ti}:rounds" type="number" min="0" step="1" value="${valueAttr(cell.rounds)}"></label><label><small>Минут</small><input class="edit-input" data-program-cell-at="${pEx.uid}:${ti}:minutes" type="number" min="0" step="0.5" value="${valueAttr(cell.minutes)}"></label></div>`;
  if (pEx.type === 'time') return `<div class="prog-row prog-row-two ${inWorkout ? '' : 'is-muted'}"><span class="prog-tag">${label}</span><label><small>Минут</small><input class="edit-input" data-program-cell-at="${pEx.uid}:${ti}:minutes" type="number" min="0" step="0.5" value="${valueAttr(cell.minutes)}"></label></div>`;
  if (pEx.type === 'reps') return `<div class="prog-row prog-row-three ${inWorkout ? '' : 'is-muted'}"><span class="prog-tag">${label}</span><label><small>Подходы</small><input class="edit-input" data-program-cell-at="${pEx.uid}:${ti}:sets" type="number" min="0" step="1" value="${valueAttr(cell.sets)}"></label><label><small>Повторы</small><input class="edit-input" data-program-cell-at="${pEx.uid}:${ti}:reps" type="number" min="0" step="1" value="${valueAttr(cell.reps)}"></label></div>`;
  return `<div class="prog-row prog-row-four ${inWorkout ? '' : 'is-muted'}"><span class="prog-tag">${label}</span><label><small>Вес</small><input class="edit-input" data-program-cell-at="${pEx.uid}:${ti}:weight" type="number" min="0" step="0.5" value="${valueAttr(cell.weight)}"></label><label><small>Подходы</small><input class="edit-input" data-program-cell-at="${pEx.uid}:${ti}:sets" type="number" min="0" step="1" value="${valueAttr(cell.sets)}"></label><label><small>Повторы</small><input class="edit-input" data-program-cell-at="${pEx.uid}:${ti}:reps" type="number" min="0" step="1" value="${valueAttr(cell.reps)}"></label></div>`;
}

function programPreviewHtml(program) {
  const workouts = buildWorkoutsFromProgram(program);
  const rows = workouts.map((w, i) => {
    const totals = totalsForWorkout({ ...w, exercises: w.exercises.map(e => ({ ...e, status: 'done' })) }, 'plan');
    const exRows = w.exercises.length ? w.exercises.map((ex, ix) => `<div class="mini-ex-row"><strong>${ix + 1}. ${escapeHtml(ex.name)}</strong><span>${escapeHtml(exercisePlanText(ex))}</span></div>`).join('') : '<small>В этой тренировке упражнения не выбраны.</small>';
    return `<article class="program-workout-card"><div class="program-workout-head"><h3>Тренировка ${i + 1}</h3><span>${fmt(totals.reps)} КПШ · ${totals.tonnage ? fmt(totals.tonnage) + ' кг' : 'кг —'}</span></div><div class="mini-ex-list">${exRows}</div></article>`;
  }).join('');
  const status = programStatus(program); const disabled = status.ready ? '' : 'disabled aria-disabled="true"';
  return `<section class="program-card"><h3>Готовая программа</h3><p>${escapeHtml(status.text)}. Если всё правильно, соберите программу в активный План.</p><button class="primary-btn save-btn" data-activate-program="${activeProgramIndex}" type="button" ${disabled}>Собрать программу в План <span>→</span></button></section>${rows}`;
}

function setProgramTab(tab) { activeProgramTab = tab; renderProgramBuilder(); }

function renderProgramExerciseSuggestions(input) {
  const box = $('programExerciseSuggest'); if (!box) return;
  input?.classList.remove('invalid');
  const q = normalizeText(input.value);
  if (!q) { box.innerHTML = ''; box.classList.remove('is-open'); return; }
  const seen = new Set(); const starts = []; const includes = [];
  allExercises.forEach(ex => { const key = normalizeText(ex.name); if (seen.has(key) || !exerciseMatches(ex, q)) return; seen.add(key); if (normalizeText(ex.name).startsWith(q)) starts.push(ex); else includes.push(ex); });
  const list = starts.concat(includes).slice(0, 10);
  if (!list.length) { box.innerHTML = `<div class="exercise-suggest-empty">Нет в базе. Начните вводить другое название.</div>`; box.classList.add('is-open'); return; }
  box.innerHTML = list.map(ex => `<button type="button" class="exercise-suggest-item" data-program-exercise-pick="${escapeHtml(ex.name)}"><strong>${escapeHtml(ex.name)}</strong><span>${escapeHtml(ex.group)} · ${typeLabel(ex.type)}</span></button>`).join('');
  box.classList.add('is-open');
}
function hideProgramExerciseSuggestions() { const box = $('programExerciseSuggest'); if (box) { box.innerHTML = ''; box.classList.remove('is-open'); } }

function addProgramExerciseByName(name) {
  const program = db.programs[currentAthlete]?.[activeProgramIndex]; const input = $('programExerciseInput'); if (!program) return false;
  const found = findExercise(name);
  if (!found) { input?.classList.add('invalid'); qfitAlert('Выберите упражнение из базы.', 'Упражнение не найдено'); return false; }
  let pEx = program.exercises.find(ex => normalizeText(ex.name) === normalizeText(found.name));
  if (!pEx) { pEx = { uid: uid(), name: found.name, type: found.type }; program.exercises.push(pEx); program.progression[pEx.uid] = {}; for (let i = 0; i < program.trainingCount; i++) program.progression[pEx.uid][i] = defaultCellForType(pEx.type); }
  program.workoutExercises[activeProgramTrainingIndex] ||= [];
  if (!program.workoutExercises[activeProgramTrainingIndex].includes(pEx.uid)) program.workoutExercises[activeProgramTrainingIndex].push(pEx.uid);
  activeProgramExerciseUid = pEx.uid;
  if (input) { input.value = ''; input.classList.remove('invalid'); }
  hideProgramExerciseSuggestions(); saveDb(); renderProgramBuilder(); renderPrograms(); return true;
}
function addProgramExercise() {
  const input = $('programExerciseInput'); if (!input) return;
  const found = findExercise(input.value); if (!found) { input.classList.add('invalid'); renderProgramExerciseSuggestions(input); qfitAlert('Сначала выберите упражнение из списка подсказок.', 'Выберите упражнение'); return; }
  addProgramExerciseByName(found.name);
}

function deleteProgramExercise(payload) {
  const program = db.programs[currentAthlete]?.[activeProgramIndex]; if (!program) return;
  const [tiRaw, uidKey] = String(payload).includes(':') ? String(payload).split(':') : [String(activeProgramTrainingIndex), null];
  const ti = Number(tiRaw); const ex = program.exercises.find(x => x.uid === uidKey) || program.exercises[Number(payload)]; if (!ex) return;
  qfitConfirm(`Удалить «${ex.name}» из тренировки ${ti + 1}?`, () => {
    program.workoutExercises[ti] = (program.workoutExercises[ti] || []).filter(x => x !== ex.uid);
    const stillUsed = program.workoutExercises.some(list => (list || []).includes(ex.uid));
    if (!stillUsed) { program.exercises = program.exercises.filter(x => x.uid !== ex.uid); delete program.progression[ex.uid]; if (activeProgramExerciseUid === ex.uid) activeProgramExerciseUid = program.exercises[0]?.uid || null; }
    saveDb(); renderProgramBuilder(); renderPrograms();
  }, 'Удалить упражнение', 'Удалить');
}
function moveProgramExercise() {}
function updateProgramName(value) { const program = db.programs[currentAthlete]?.[activeProgramIndex]; if (!program) return; program.name = value.trim() || 'Новая программа'; saveDb(); renderProgramBuilder(); renderPrograms(); }
function updateProgramCell(uidKey, field, value) { return updateProgramCellAt(uidKey, activeProgramTrainingIndex, field, value); }
function updateProgramCellAt(uidKey, ti, field, value) { const program = db.programs[currentAthlete]?.[activeProgramIndex]; if (!program) return; const ex = program.exercises.find(x => x.uid === uidKey); if (!ex) return; const cell = program.progression[uidKey][ti] ||= defaultCellForType(ex.type); cell[field] = value; saveDb(); renderPrograms(); }
function copyProgramCell(uidKey, mode) { const program = db.programs[currentAthlete]?.[activeProgramIndex]; if (!program) return; const ex = program.exercises.find(x => x.uid === uidKey); if (!ex) return; const src = clone(program.progression[uidKey]?.[activeProgramTrainingIndex] || defaultCellForType(ex.type)); const start = activeProgramTrainingIndex + 1; const end = mode === 'next' ? Math.min(program.trainingCount, start + 1) : program.trainingCount; for (let i = start; i < end; i++) program.progression[uidKey][i] = clone(src); saveDb(); renderProgramBuilder(); renderPrograms(); }
function clearProgramCell(uidKey) { const program = db.programs[currentAthlete]?.[activeProgramIndex]; if (!program) return; const ex = program.exercises.find(x => x.uid === uidKey); if (!ex) return; program.progression[uidKey][activeProgramTrainingIndex] = defaultCellForType(ex.type); saveDb(); renderProgramBuilder(); renderPrograms(); }
function bumpProgramCell(uidKey, step) { const program = db.programs[currentAthlete]?.[activeProgramIndex]; if (!program) return; const ex = program.exercises.find(x => x.uid === uidKey); if (!ex || ex.type !== 'strength') return; const base = program.progression[uidKey]?.[activeProgramTrainingIndex] || defaultCellForType('strength'); for (let i = activeProgramTrainingIndex + 1; i < program.trainingCount; i++) program.progression[uidKey][i] = { ...clone(base), weight: num(base.weight) + num(step) * (i - activeProgramTrainingIndex) }; saveDb(); renderProgramBuilder(); renderPrograms(); }
function copyProgramLineFromFirst(uidKey) { const program = db.programs[currentAthlete]?.[activeProgramIndex]; if (!program) return; const ex = program.exercises.find(x => x.uid === uidKey); if (!ex) return; const src = clone(program.progression[uidKey]?.[0] || defaultCellForType(ex.type)); for (let i = 0; i < program.trainingCount; i++) program.progression[uidKey][i] = clone(src); saveDb(); renderProgramBuilder(); renderPrograms(); }
function linearizeProgramLine(uidKey, step) { const program = db.programs[currentAthlete]?.[activeProgramIndex]; if (!program) return; const ex = program.exercises.find(x => x.uid === uidKey); if (!ex || ex.type !== 'strength') return; const base = clone(program.progression[uidKey]?.[0] || defaultCellForType(ex.type)); for (let i = 0; i < program.trainingCount; i++) program.progression[uidKey][i] = { ...clone(base), weight: num(base.weight) + num(step) * i }; saveDb(); renderProgramBuilder(); renderPrograms(); }
function clearProgramLine(uidKey) { const program = db.programs[currentAthlete]?.[activeProgramIndex]; if (!program) return; const ex = program.exercises.find(x => x.uid === uidKey); if (!ex) return; for (let i = 0; i < program.trainingCount; i++) program.progression[uidKey][i] = defaultCellForType(ex.type); saveDb(); renderProgramBuilder(); renderPrograms(); }
function toggleDayExercise() {}
function updateProgramSequence() {}

function activateProgram(index) {
  const program = db.programs[currentAthlete]?.[index];
  if (!program) return;
  normalizeProgramShape(program);
  const status = programStatus(program);
  if (!status.ready) {
    qfitAlert('Программа ещё не готова. Добавьте упражнения в тренировки и заполните прогрессию.', 'Программа не готова');
    openProgramDetail(index);
    if (typeof setProgramTab === 'function') setProgramTab('schedule');
    return;
  }
  const commit = () => {
    const workouts = buildWorkoutsFromProgram(program);
    db.plan[currentAthlete] = {
      activeIndex: 0,
      workouts: workouts.map((w, i) => ({ ...w, id: makeWorkoutId(`${currentAthlete}-active-${i + 1}`), cycle: program.name }))
    };
    db.drafts[currentAthlete] = makeDraftFromPlan(currentAthlete);
    saveDb();
    renderAll();
    showOnly(planScreen);
  };
  if (workoutHasStarted(currentAthlete)) {
    qfitConfirm('У вас есть начатая тренировка в разделе «Сегодня». Если заменить план, текущий несохранённый факт будет потерян.', commit, 'Заменить активный план?', 'Заменить');
    return;
  }
  commit();
}

function copyProgram(index) {
  const src = db.programs[currentAthlete]?.[index];
  if (!src) return;
  const copy = clone(src);
  copy.id = makeWorkoutId('program-copy');
  copy.name = `${src.name} — копия`;
  copy.createdAt = new Date().toISOString();
  db.programs[currentAthlete].splice(index + 1, 0, copy);
  saveDb(); renderPrograms();
}

function deleteProgram(index) {
  const programs = db.programs[currentAthlete] || [];
  if (programs.length <= 1) {
    qfitAlert('Оставьте хотя бы одну программу. Лучше создайте новую, потом удалите старую.', 'Нельзя удалить последнюю');
    return;
  }
  qfitConfirm('Удалить программу? Активный План и Журнал не удаляются.', () => {
    programs.splice(index, 1);
    activeProgramIndex = null;
    saveDb(); renderPrograms(); showOnly(programsScreen);
  }, 'Удалить программу', 'Удалить');
}

// v30: события конструктора программ.
document.addEventListener('click', (e) => {
  const home = e.target.closest('[data-program-home]'); if (home) return setProgramHomeMode(home.dataset.programHome);
  const tab = e.target.closest('[data-program-tab]'); if (tab) return setProgramTab(tab.dataset.programTab);
  const trainTab = e.target.closest('[data-program-training-tab]'); if (trainTab) { activeProgramTrainingIndex = Number(trainTab.dataset.programTrainingTab); return renderProgramBuilder(); }
  const exSel = e.target.closest('[data-program-ex-select]'); if (exSel) { activeProgramExerciseUid = exSel.dataset.programExSelect; return renderProgramBuilder(); }
  if (e.target.closest('[data-program-add-exercise]')) return addProgramExercise();
  const del = e.target.closest('[data-program-ex-delete]'); if (del) return deleteProgramExercise(del.dataset.programExDelete);
  const copyNext = e.target.closest('[data-program-cell-copy-next]'); if (copyNext) return copyProgramCell(copyNext.dataset.programCellCopyNext, 'next');
  const copyEnd = e.target.closest('[data-program-cell-copy-end]'); if (copyEnd) return copyProgramCell(copyEnd.dataset.programCellCopyEnd, 'end');
  const clear = e.target.closest('[data-program-cell-clear]'); if (clear) return clearProgramCell(clear.dataset.programCellClear);
  const bump = e.target.closest('[data-program-cell-bump]'); if (bump) { const [uidKey, step] = bump.dataset.programCellBump.split(':'); return bumpProgramCell(uidKey, step); }
  const lineCopy = e.target.closest('[data-program-line-copy]'); if (lineCopy) return copyProgramLineFromFirst(lineCopy.dataset.programLineCopy);
  const lineLinear = e.target.closest('[data-program-line-linear]'); if (lineLinear) { const [uidKey, step] = lineLinear.dataset.programLineLinear.split(':'); return linearizeProgramLine(uidKey, step); }
  const lineClear = e.target.closest('[data-program-line-clear]'); if (lineClear) return clearProgramLine(lineClear.dataset.programLineClear);
}, true);

document.addEventListener('change', (e) => {
  if (e.target.matches('[data-program-exercise-select]')) {
    const name = e.target.value;
    if (name) { addProgramExerciseByName(name); e.target.value = ''; }
    return;
  }
  if (e.target.matches('[data-program-training-count]')) {
    const program = db.programs[currentAthlete]?.[activeProgramIndex];
    if (program) return adjustProgramTrainingCount(program, e.target.value, true);
  }
  if (e.target.matches('[data-program-cell]')) {
    const [uidKey, field] = e.target.dataset.programCell.split(':');
    return updateProgramCell(uidKey, field, e.target.value);
  }
  if (e.target.matches('[data-program-cell-at]')) {
    const [uidKey, ti, field] = e.target.dataset.programCellAt.split(':');
    return updateProgramCellAt(uidKey, Number(ti), field, e.target.value);
  }
  if (e.target.matches('[data-day-toggle]')) {
    const [day, uidKey] = e.target.dataset.dayToggle.split(':');
    return toggleDayExercise(day, uidKey, e.target.checked);
  }
  if (e.target.matches('[data-sequence-index]')) return updateProgramSequence(Number(e.target.dataset.sequenceIndex), e.target.value);
});

document.addEventListener('blur', (e) => {
  if (e.target.matches('[data-program-name-edit]')) updateProgramName(e.target.value);
}, true);

// Повторный рендер после подключения v29-логики.
ensureDb();
saveDb();
renderAll();


/* ==============================
   v38 — Program Wizard Edit Clean
   Исправлено: на шаге 1 убран «Дубль», из карточек убраны подписи типа «вес + повторы»,
   подробные подходы теперь не имеют вложенного добавления подходов, добавлено редактирование сохранённых программ.

   v35 — Program Wizard + Accordion Loads
   Шаг 1: название + выбор упражнений.
   Шаг 2: отдельный экран распределения по 4 тренировочным дням 2×2.
   Шаг 3: нагрузки раскрываются по нажатию на упражнение.
   ============================== */
function createSimpleDraft() {
  return { name: '', step: 1, totalTrainings: 4, exercises: [], days: [[], [], [], []] };
}
function makeSimpleExerciseInstance(found) {
  return {
    instanceId: uid(),
    name: found.name,
    type: found.type,
    baseName: found.name,
    load: defaultSimpleLoadForType(found.type)
  };
}
function defaultSimpleLoadForType(type) {
  // v36: базовый быстрый режим — вес / подходы / повторения.
  // При необходимости строку можно раскрыть в подробные подходы: каждый подход со своим весом и повторениями.
  if (type === 'rounds') return { weight: 0, sets: 2, reps: 2 };
  if (type === 'time') return { weight: 0, sets: 1, reps: 10 };
  if (type === 'reps') return { weight: 0, sets: 1, reps: 10 };
  return { weight: 0, sets: 1, reps: 5 };
}
function normalizeSimpleItemLoad(item) {
  const count = Math.max(1, Math.min(60, num(simpleProgramDraft.totalTrainings) || 4));
  item.loads ||= [];
  const d = defaultSimpleLoadForType(item.type);
  for (let i = 0; i < count; i++) {
    item.loads[i] ||= clone(d);
    Object.keys(d).forEach(key => {
      if (item.loads[i][key] === undefined || item.loads[i][key] === null || item.loads[i][key] === '') item.loads[i][key] = d[key];
    });
  }
  if (item.loads.length > count) item.loads.length = count;
  // Совместимость со старыми версиями: первый день также держим в item.load.
  item.load = item.loads[0];
}
function simpleLoadCell(item, progressDayIndex) {
  normalizeSimpleItemLoad(item);
  return item.loads[progressDayIndex] || item.loads[0] || defaultSimpleLoadForType(item.type);
}
function simpleAssignedCount() {
  return simpleProgramDraft.days.reduce((sum, items) => sum + items.length, 0);
}
function openSimpleProgramCreate() {
  simpleEditingProgramIndex = null;
  simpleProgramDraft = createSimpleDraft();
  setSimpleProgramStep(1);
  setTimeout(() => $('simpleProgramNameInput')?.focus(), 50);
}
function setSimpleProgramStep(step) {
  simpleProgramDraft.step = step;
  if (step === 1) showOnly(programDetailScreen);
  if (step === 2) showOnly(programDaysScreen);
  if (step === 3) showOnly(programLoadScreen);
  renderSimpleProgramCreate();
}
function renderSimpleProgramCreate() {
  const nameInput = $('simpleProgramNameInput');
  const totalInput = $('simpleProgramTotalTrainingsInput');
  if (nameInput && simpleProgramDraft.step === 1) {
    nameInput.value = simpleProgramDraft.name || '';
    nameInput.classList.remove('invalid');
  }
  if (totalInput) totalInput.value = simpleProgramDraft.totalTrainings || 4;
  renderSimpleProgramExerciseList();
  renderSimpleProgramDays();
  renderSimpleProgramLoads();
}
function renderSimpleProgramExerciseList() {
  const list = $('simpleProgramExerciseList');
  if (!list) return;
  list.classList.add('simple-pool-list');
  if (!simpleProgramDraft.exercises.length) {
    list.innerHTML = `<p class="muted-note">Упражнения пока не добавлены.</p>`;
    return;
  }
  list.innerHTML = simpleProgramDraft.exercises.map((ex, i) => simpleProgramDragCardHtml(ex, { source: 'pool', index: i }, i + 1)).join('');
}
function renderSimpleProgramDays() {
  const pool = $('simpleProgramPoolList');
  const grid = $('simpleProgramDaysGrid');
  if (!pool || !grid) return;

  if (!simpleProgramDraft.exercises.length) {
    pool.innerHTML = `<p class="muted-note">Список пуст. Вернитесь назад и добавьте упражнения.</p>`;
  } else {
    pool.innerHTML = simpleProgramDraft.exercises.map((ex, i) => simpleProgramDragCardHtml(ex, { source: 'pool', index: i })).join('');
  }

  grid.innerHTML = simpleProgramDraft.days.map((items, dayIndex) => `
    <div class="simple-day-cell" data-simple-day="${dayIndex}">
      <div class="simple-day-title">Тренировка ${dayIndex + 1}</div>
      <div class="simple-day-drop-hint">Перетащите сюда</div>
      <div class="simple-day-items">
        ${items.length ? items.map((ex, i) => simpleProgramDragCardHtml(ex, { source: 'day', dayIndex, index: i })).join('') : ''}
      </div>
    </div>
  `).join('');
}
function simpleProgramDragCardHtml(ex, payload, number = null) {
  const data = escapeHtml(JSON.stringify(payload));
  const duplicateKey = payload.source === 'pool' ? `pool:${payload.index}` : `day:${payload.dayIndex}:${payload.index}`;
  const removeKey = payload.source === 'pool' ? `${payload.index}` : `day:${payload.dayIndex}:${payload.index}`;
  // На шаге 1 «Дубль» не нужен: там только выбираем базовый список упражнений.
  // В распределении по дням дубль оставляем, чтобы одно упражнение можно было поставить в разные дни.
  const showDuplicate = !(payload.source === 'pool' && number !== null);
  return `
    <div class="simple-drag-card" data-simple-drag="${data}" title="Зажмите и перетащите для изменения порядка или распределения">
      <div class="simple-drag-main">
        <strong>${number ? `${number}. ` : ''}${escapeHtml(ex.name)}</strong>
      </div>
      <div class="simple-drag-actions ${showDuplicate ? '' : 'only-remove'}">
        ${showDuplicate ? `<button class="mini-duplicate" data-simple-program-duplicate="${duplicateKey}" type="button">Дубль</button>` : ''}
        <button class="mini-remove" data-simple-program-remove="${removeKey}" type="button">×</button>
      </div>
    </div>`;
}
function renderSimpleProgramExerciseSuggestions(input) {
  const box = $('simpleProgramExerciseSuggest');
  if (!box || !input) return;
  input.classList.remove('invalid');
  const q = normalizeText(input.value);
  const seen = new Set();
  const starts = [];
  const includes = [];
  const popular = [];
  allExercises.forEach(ex => {
    const key = normalizeText(ex.name);
    if (seen.has(key)) return;
    const aliases = ex.aliases || [];
    const match = !q || exerciseMatches(ex, q);
    if (!match) return;
    seen.add(key);
    if (!q) popular.push(ex);
    else if (normalizeText(ex.name).startsWith(q) || aliases.some(alias => normalizeText(alias).startsWith(q))) starts.push(ex);
    else includes.push(ex);
  });
  const list = (q ? starts.concat(includes) : popular).slice(0, q ? 10 : 18);
  if (!list.length) {
    box.innerHTML = `<div class="exercise-suggest-empty">Ничего не найдено</div>`;
    box.classList.add('is-open');
    return;
  }
  box.innerHTML = list.map(ex => {
    const aliasText = ex.aliases?.length ? ` · также: ${ex.aliases.join(', ')}` : '';
    return `<button type="button" class="exercise-suggest-item" data-simple-program-pick="${escapeHtml(ex.name)}"><strong>${escapeHtml(ex.name)}</strong><span>${escapeHtml(ex.group)} · ${typeLabel(ex.type)}${escapeHtml(aliasText)}</span></button>`;
  }).join('');
  box.classList.add('is-open');
}
function hideSimpleProgramExerciseSuggestions() {
  const box = $('simpleProgramExerciseSuggest');
  if (!box) return;
  box.innerHTML = '';
  box.classList.remove('is-open');
}
function addSimpleProgramExerciseByName(name) {
  const found = findExercise(name);
  const input = $('simpleProgramExerciseInput');
  if (!found) {
    input?.classList.add('invalid');
    qfitAlert('Выберите упражнение из базы.', 'Упражнение не найдено');
    return;
  }
  const canonical = findExercise(canonicalExerciseName(found.name)) || found;
  const exists = simpleProgramDraft.exercises.some(ex => normalizeText(ex.name) === normalizeText(canonical.name));
  if (!exists) simpleProgramDraft.exercises.push(makeSimpleExerciseInstance(canonical));
  if (input) input.value = '';
  hideSimpleProgramExerciseSuggestions();
  renderSimpleProgramCreate();
}
function removeSimpleProgramExercise(key) {
  const raw = String(key);
  if (raw.startsWith('day:')) {
    const [, dayRaw, indexRaw] = raw.split(':');
    const dayIndex = Number(dayRaw);
    const index = Number(indexRaw);
    if (simpleProgramDraft.days[dayIndex]) simpleProgramDraft.days[dayIndex].splice(index, 1);
  } else {
    const index = Number(raw);
    simpleProgramDraft.exercises.splice(index, 1);
  }
  renderSimpleProgramCreate();
}
function duplicateSimpleProgramExercise(key) {
  const parts = String(key).split(':');
  let source = null;
  if (parts[0] === 'pool') source = simpleProgramDraft.exercises[Number(parts[1])];
  if (parts[0] === 'day') source = simpleProgramDraft.days[Number(parts[1])]?.[Number(parts[2])];
  if (!source) return;
  const copy = { ...clone(source), instanceId: uid(), load: clone(source.load || defaultSimpleLoadForType(source.type)), loads: clone(source.loads || []) };
  if (parts[0] === 'day') simpleProgramDraft.days[Number(parts[1])].splice(Number(parts[2]) + 1, 0, copy);
  else simpleProgramDraft.exercises.splice(Number(parts[1]) + 1, 0, copy);
  renderSimpleProgramCreate();
}
function moveSimpleProgramItem(key) {
  const parts = String(key).split(':');
  const dir = parts[parts.length - 1];
  const delta = dir === 'up' ? -1 : 1;
  let list = null;
  let index = -1;
  if (parts[0] === 'pool') {
    list = simpleProgramDraft.exercises;
    index = Number(parts[1]);
  }
  if (parts[0] === 'day') {
    list = simpleProgramDraft.days[Number(parts[1])];
    index = Number(parts[2]);
  }
  if (!list) return;
  const target = index + delta;
  if (target < 0 || target >= list.length) return;
  [list[index], list[target]] = [list[target], list[index]];
  renderSimpleProgramCreate();
}
function goSimpleProgramDays() {
  const nameInput = $('simpleProgramNameInput');
  const name = (nameInput?.value || simpleProgramDraft.name || '').trim();
  if (!name) {
    nameInput?.classList.add('invalid');
    nameInput?.focus();
    qfitAlert('Введите название программы.', 'Название обязательно');
    return;
  }
  if (!simpleProgramDraft.exercises.length) {
    qfitAlert('Добавьте хотя бы одно упражнение.', 'Список упражнений пуст');
    return;
  }
  simpleProgramDraft.name = name;
  setSimpleProgramStep(2);
}
function goSimpleProgramLoads() {
  const assignedCount = simpleAssignedCount();
  if (!assignedCount) {
    qfitAlert('Разложите хотя бы одно упражнение в тренировочный день.', 'Распределение пустое');
    return;
  }
  simpleProgramDraft.days.flat().forEach(normalizeSimpleItemLoad);
  if (!simpleProgramDraft.totalTrainings) simpleProgramDraft.totalTrainings = 4;
  simpleLoadOpenKey = simpleFirstAssignedLoadKey();
  setSimpleProgramStep(3);
}
function moveSimpleDragPayloadToDay(payload, targetDayIndex) {
  if (!payload || targetDayIndex < 0 || targetDayIndex > 3) return;
  let item = null;
  if (payload.source === 'pool') {
    // v40: список выбранных упражнений — это палитра, а не корзина нераспределённых.
    // При переносе в тренировочный день создаём отдельный экземпляр, чтобы при редактировании
    // исходный список не становился пустым и одно упражнение можно было использовать несколько раз.
    const source = simpleProgramDraft.exercises[Number(payload.index)];
    if (source) item = { ...clone(source), instanceId: uid(), load: clone(source.load || defaultSimpleLoadForType(source.type)), loads: clone(source.loads || []) };
  } else if (payload.source === 'day') {
    item = simpleProgramDraft.days[Number(payload.dayIndex)]?.splice(Number(payload.index), 1)[0];
  }
  if (!item) return;
  simpleProgramDraft.days[targetDayIndex] ||= [];
  simpleProgramDraft.days[targetDayIndex].push(item);
  renderSimpleProgramCreate();
}
function simpleFirstAssignedLoadKey() {
  for (let dayIndex = 0; dayIndex < simpleProgramDraft.days.length; dayIndex++) {
    const first = simpleProgramDraft.days[dayIndex]?.[0];
    if (first) return first.instanceId || `${dayIndex}:0`;
  }
  return null;
}

let simpleLoadDetailOpenKey = null;
function simpleLoadRowKey(dayIndex, itemIndex, progressIndex) {
  const item = getSimpleAssignedItem(dayIndex, itemIndex);
  return `${item?.instanceId || `${dayIndex}:${itemIndex}`}:${progressIndex}`;
}
function simpleLoadRowIsDetailed(load) {
  return load && load.mode === 'detailed' && Array.isArray(load.detailSets) && load.detailSets.length;
}
function ensureDetailedSets(load) {
  const count = Math.max(1, Math.min(30, num(load.sets) || 1));
  load.detailSets ||= Array.from({ length: count }, () => ({ weight: load.weight || 0, reps: load.reps || 1 }));
  while (load.detailSets.length < count) load.detailSets.push({ weight: load.weight || 0, reps: load.reps || 1 });
  if (load.detailSets.length > count) load.detailSets.length = count;
  load.mode = 'detailed';
  return load.detailSets;
}
function compactLoadFromDetailed(load) {
  if (!simpleLoadRowIsDetailed(load)) return;
  // v40: в подробном режиме вес и повторы сверху являются автоматической сводкой,
  // но «к-во подх.» остаётся ручным управляющим полем. Оно задаёт количество строк
  // подробных подходов, поэтому не перезаписываем его здесь.
}
function simpleDetailedMetricText(load, field) {
  const values = (load.detailSets || [])
    .map(s => num(s[field]))
    .filter(v => Number.isFinite(v));
  if (!values.length) return '—';
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? fmtNum(min) : `${fmtNum(min)}–${fmtNum(max)}`;
}
function simpleLoadCellShortText(load, itemType = 'strength') {
  if (simpleLoadRowIsDetailed(load)) {
    const count = (load.detailSets || []).length || 0;
    const weightText = itemType === 'strength' ? `${simpleDetailedMetricText(load, 'weight')} кг · ` : '';
    return `${count} подх. · ${weightText}${simpleDetailedMetricText(load, 'reps')} повт.`;
  }
  if (itemType === 'rounds') return `${fmtNum(load.sets)} р × ${fmtNum(load.reps)} мин`;
  if (itemType === 'time') return `${fmtNum(load.reps || load.sets)} мин`;
  if (itemType === 'reps') return `${fmtNum(load.sets)}×${fmtNum(load.reps)}`;
  return `${fmtNum(load.weight)}×${fmtNum(load.sets)}×${fmtNum(load.reps)}`;
}
function toggleSimpleLoadDetail(key) {
  const [dayIndex, itemIndex, progressIndex] = String(key).split(':').map(Number);
  const item = getSimpleAssignedItem(dayIndex, itemIndex);
  if (!item) return;
  normalizeSimpleItemLoad(item);
  const load = item.loads[progressIndex];
  if (!load) return;
  const rowKey = simpleLoadRowKey(dayIndex, itemIndex, progressIndex);
  if (simpleLoadDetailOpenKey === rowKey) {
    simpleLoadDetailOpenKey = null;
  } else {
    ensureDetailedSets(load);
    simpleLoadDetailOpenKey = rowKey;
  }
  item.load = item.loads[0];
  simpleLoadOpenKey = item.instanceId;
  renderSimpleProgramLoads();
}
function addSimpleDetailSet(key) {
  const [dayIndex, itemIndex, progressIndex] = String(key).split(':').map(Number);
  const item = getSimpleAssignedItem(dayIndex, itemIndex);
  if (!item) return;
  normalizeSimpleItemLoad(item);
  const load = item.loads[progressIndex];
  const sets = ensureDetailedSets(load);
  const last = sets[sets.length - 1] || { weight: load.weight || 0, reps: load.reps || 1 };
  sets.push({ weight: last.weight, reps: last.reps });
  load.sets = sets.length;
  simpleLoadDetailOpenKey = simpleLoadRowKey(dayIndex, itemIndex, progressIndex);
  renderSimpleProgramLoads();
}
function removeSimpleDetailSet(key) {
  const [dayIndex, itemIndex, progressIndex, setIndex] = String(key).split(':').map(Number);
  const item = getSimpleAssignedItem(dayIndex, itemIndex);
  if (!item) return;
  normalizeSimpleItemLoad(item);
  const load = item.loads[progressIndex];
  ensureDetailedSets(load);
  if (load.detailSets.length > 1) load.detailSets.splice(setIndex, 1);
  load.sets = load.detailSets.length;
  simpleLoadDetailOpenKey = simpleLoadRowKey(dayIndex, itemIndex, progressIndex);
  renderSimpleProgramLoads();
}
function refreshSimpleDetailSummaryDom(dayIndex, itemIndex, progressIndex, load, item) {
  const path = `${dayIndex}:${itemIndex}:${progressIndex}`;
  const setText = (field, value) => {
    document.querySelectorAll('[data-detail-summary]').forEach(el => {
      if (el.dataset.detailSummary === `${path}:${field}`) el.textContent = value;
    });
  };
  setText('weight', item.type === 'strength' ? simpleDetailedMetricText(load, 'weight') : '—');
  setText('sets', String(num(load.sets) || (load.detailSets || []).length || 0));
  setText('reps', simpleDetailedMetricText(load, 'reps'));
  document.querySelectorAll('[data-simple-load-meta]').forEach(el => {
    if (el.dataset.simpleLoadMeta === item.instanceId) el.textContent = simpleLoadSummaryText(item);
  });
}
function updateSimpleDetailLoadValue(dataset, value) {
  const [dayIndex, itemIndex, progressIndex, setIndex, field] = String(dataset).split(':');
  const item = getSimpleAssignedItem(dayIndex, itemIndex);
  if (!item || !field) return;
  normalizeSimpleItemLoad(item);
  const load = item.loads[Number(progressIndex)];
  ensureDetailedSets(load);
  load.detailSets[Number(setIndex)] ||= { weight: load.weight || 0, reps: load.reps || 1 };
  load.detailSets[Number(setIndex)][field] = value;
  compactLoadFromDetailed(load);
  item.load = item.loads[0];
  simpleLoadOpenKey = item.instanceId;
  refreshSimpleDetailSummaryDom(dayIndex, itemIndex, progressIndex, load, item);
}
function renderSimpleProgramLoads() {
  const panel = $('simpleProgramLoadsPanel');
  if (!panel) return;
  if (!simpleAssignedCount()) {
    panel.innerHTML = `<section class="program-card"><p class="muted-note">Сначала распределите упражнения по тренировочным дням.</p></section>`;
    return;
  }
  const count = Math.max(1, Math.min(60, num(simpleProgramDraft.totalTrainings) || 4));
  simpleProgramDraft.totalTrainings = count;
  simpleProgramDraft.days.flat().forEach(normalizeSimpleItemLoad);
  const validKeys = new Set(simpleProgramDraft.days.flat().map(item => item.instanceId).filter(Boolean));
  if (!simpleLoadOpenKey || !validKeys.has(simpleLoadOpenKey)) simpleLoadOpenKey = simpleFirstAssignedLoadKey();

  panel.innerHTML = simpleProgramDraft.days.map((items, dayIndex) => {
    if (!items.length) return '';
    const rows = items.map((item, itemIndex) => simpleLoadAccordionHtml(item, dayIndex, itemIndex, count)).join('');
    return `<section class="program-card simple-load-card simple-load-accordion-card">
      <h3>Тренировка ${dayIndex + 1}</h3>
      <p class="simple-load-card-note">У каждого упражнения своя прогрессия. Даже если название повторяется в другой тренировке.</p>
      <div class="simple-load-accordion">${rows}</div>
    </section>`;
  }).join('') || `<section class="program-card"><p class="muted-note">В тренировочных днях пока нет упражнений.</p></section>`;
}
function simpleLoadSummaryText(item) {
  normalizeSimpleItemLoad(item);
  const first = simpleLoadCell(item, 0);
  const last = simpleLoadCell(item, Math.max(0, (simpleProgramDraft.totalTrainings || 1) - 1));
  const firstText = simpleLoadCellShortText(first, item.type);
  const lastText = simpleLoadCellShortText(last, item.type);
  return firstText === lastText ? firstText : `${firstText} → ${lastText}`;
}
function simpleLoadAccordionHtml(item, dayIndex, itemIndex, count) {
  const key = item.instanceId || `${dayIndex}:${itemIndex}`;
  const isOpen = simpleLoadOpenKey === key;
  const rows = isOpen ? simpleLoadProgressTableHtml(item, dayIndex, itemIndex, count) : '';
  return `<article class="simple-load-item ${isOpen ? 'is-open' : ''}">
    <button class="simple-load-toggle" data-simple-load-toggle="${escapeHtml(key)}" type="button">
      <span class="simple-load-name">${escapeHtml(item.name)}</span>
      <span class="simple-load-meta" data-simple-load-meta="${escapeHtml(key)}">${escapeHtml(simpleLoadSummaryText(item))}</span>
      <span class="simple-load-arrow">${isOpen ? '↑' : '↓'}</span>
    </button>
    ${rows}
  </article>`;
}
function simpleLoadProgressTableHtml(item, dayIndex, itemIndex, count) {
  const rows = Array.from({ length: count }, (_, progressIndex) => {
    const load = simpleLoadCell(item, progressIndex);
    const path = `${dayIndex}:${itemIndex}:${progressIndex}`;
    const rowKey = simpleLoadRowKey(dayIndex, itemIndex, progressIndex);
    const isDetailed = simpleLoadRowIsDetailed(load);
    const detailOpen = simpleLoadDetailOpenKey === rowKey;
    if (isDetailed) compactLoadFromDetailed(load);
    const weightCell = isDetailed
      ? `<span class="matrix-readonly" data-detail-summary="${path}:weight">${item.type === 'strength' ? escapeHtml(simpleDetailedMetricText(load, 'weight')) : '—'}</span>`
      : `<input class="matrix-input" data-simple-load="${path}:weight" type="number" inputmode="decimal" min="0" step="0.5" value="${valueAttr(load.weight)}">`;
    const setsCell = isDetailed
      ? `<input class="matrix-input" data-simple-load="${path}:sets" type="number" inputmode="numeric" min="1" step="1" value="${valueAttr(load.sets || (load.detailSets || []).length || 1)}" title="Количество подходов">`
      : `<input class="matrix-input" data-simple-load="${path}:sets" type="number" inputmode="numeric" min="1" step="1" value="${valueAttr(load.sets)}" title="Количество подходов">`;
    const repsCell = isDetailed
      ? `<span class="matrix-readonly" data-detail-summary="${path}:reps">${escapeHtml(simpleDetailedMetricText(load, 'reps'))}</span>`
      : `<input class="matrix-input" data-simple-load="${path}:reps" type="number" inputmode="numeric" min="0" step="1" value="${valueAttr(load.reps)}">`;
    const mainRow = `<tr class="${isDetailed ? 'is-detailed-summary' : ''}">
      <th>${progressIndex + 1}</th>
      <td>${weightCell}</td>
      <td>${setsCell}</td>
      <td>${repsCell}</td>
      <td><button class="detail-btn ${isDetailed || detailOpen ? 'is-active' : ''}" data-simple-load-detail-toggle="${path}" type="button">подходы</button></td>
    </tr>`;
    if (!detailOpen) return mainRow;
    return mainRow + `<tr class="detail-row"><td colspan="5">${simpleDetailedSetsHtml(load, path)}</td></tr>`;
  }).join('');
  return `<div class="simple-load-panel">
    <table class="simple-load-progress-table detailed-mode">
      <thead><tr><th>№</th><th>вес</th><th>к-во<br>подх.</th><th>повторы</th><th>подходы</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="simple-load-actions">
      <button class="small-btn" data-simple-load-copy-first="${dayIndex}:${itemIndex}" type="button">1 строку вниз</button>
      <button class="small-btn" data-simple-load-linear="${dayIndex}:${itemIndex}:2.5" type="button">+2,5 кг</button>
      <button class="small-btn" data-simple-load-linear="${dayIndex}:${itemIndex}:5" type="button">+5 кг</button>
      <button class="small-btn danger" data-simple-load-clear="${dayIndex}:${itemIndex}" type="button">Очистить</button>
    </div>
  </div>`;
}
function simpleDetailedSetsHtml(load, path) {
  const sets = ensureDetailedSets(load);
  compactLoadFromDetailed(load);
  const rows = sets.map((set, setIndex) => `<tr>
    <th>${setIndex + 1}</th>
    <td><input class="matrix-input" data-simple-detail-load="${path}:${setIndex}:weight" type="number" inputmode="decimal" min="0" step="0.5" value="${valueAttr(set.weight)}"></td>
    <td><input class="matrix-input" data-simple-detail-load="${path}:${setIndex}:reps" type="number" inputmode="numeric" min="0" step="1" value="${valueAttr(set.reps)}"></td>
  </tr>`).join('');
  return `<div class="detail-sets-box">
    <div class="field-hint">Заполните вес и повторы по каждому подходу. Верхняя строка веса и повторов считается автоматически.</div>
    <table class="detail-sets-table">
      <thead><tr><th>подход</th><th>вес</th><th>повт.</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>`;
}
function toggleSimpleLoad(key) {
  simpleLoadOpenKey = simpleLoadOpenKey === key ? null : key;
  renderSimpleProgramLoads();
}
function getSimpleAssignedItem(dayIndex, itemIndex) {
  return simpleProgramDraft.days[Number(dayIndex)]?.[Number(itemIndex)] || null;
}
function copySimpleLoadFirst(key) {
  const [dayIndex, itemIndex] = String(key).split(':').map(Number);
  const item = getSimpleAssignedItem(dayIndex, itemIndex);
  if (!item) return;
  normalizeSimpleItemLoad(item);
  const src = clone(item.loads[0] || defaultSimpleLoadForType(item.type));
  for (let i = 0; i < item.loads.length; i++) item.loads[i] = clone(src);
  item.load = item.loads[0];
  simpleLoadOpenKey = item.instanceId;
  renderSimpleProgramLoads();
}
function linearSimpleLoad(key) {
  const [dayIndex, itemIndex, stepRaw] = String(key).split(':');
  const item = getSimpleAssignedItem(dayIndex, itemIndex);
  if (!item) return;
  normalizeSimpleItemLoad(item);
  const step = num(stepRaw);
  const base = clone(item.loads[0] || defaultSimpleLoadForType(item.type));
  for (let i = 0; i < item.loads.length; i++) item.loads[i] = { ...clone(base), weight: num(base.weight) + step * i };
  item.load = item.loads[0];
  simpleLoadOpenKey = item.instanceId;
  renderSimpleProgramLoads();
}
function clearSimpleLoad(key) {
  const [dayIndex, itemIndex] = String(key).split(':').map(Number);
  const item = getSimpleAssignedItem(dayIndex, itemIndex);
  if (!item) return;
  const d = defaultSimpleLoadForType(item.type);
  normalizeSimpleItemLoad(item);
  for (let i = 0; i < item.loads.length; i++) item.loads[i] = clone(d);
  item.load = item.loads[0];
  simpleLoadOpenKey = item.instanceId;
  renderSimpleProgramLoads();
}
function updateSimpleLoadValue(dataset, value) {
  const parts = String(dataset).split(':');
  const dayRaw = parts[0];
  const indexRaw = parts[1];
  let progressRaw = '0';
  let field = parts[2];
  if (parts.length >= 4) {
    progressRaw = parts[2];
    field = parts[3];
  }
  const item = simpleProgramDraft.days[Number(dayRaw)]?.[Number(indexRaw)];
  if (!item || !field) return;
  normalizeSimpleItemLoad(item);
  const progressIndex = Number(progressRaw) || 0;
  item.loads[progressIndex] ||= clone(defaultSimpleLoadForType(item.type));
  if (field === 'sets') value = Math.max(1, Math.min(30, num(value) || 1));
  item.loads[progressIndex][field] = value;
  if (item.loads[progressIndex].mode === 'detailed') {
    ensureDetailedSets(item.loads[progressIndex]);
    if (field === 'sets') {
      simpleLoadDetailOpenKey = simpleLoadRowKey(Number(dayRaw), Number(indexRaw), progressIndex);
      item.load = item.loads[0];
      renderSimpleProgramLoads();
      return;
    }
  }
  item.load = item.loads[0];
}
function updateSimpleTotalTrainings(value) {
  const count = Math.max(1, Math.min(60, num(value) || 4));
  simpleProgramDraft.totalTrainings = count;
  simpleProgramDraft.days.flat().forEach(normalizeSimpleItemLoad);
  renderSimpleProgramLoads();
}
function simpleLoadToCell(item, progressIndex = 0) {
  normalizeSimpleItemLoad(item);
  const load = simpleLoadCell(item, progressIndex);
  if ((item.type === 'strength' || item.type === 'reps') && simpleLoadRowIsDetailed(load)) {
    const detailedSets = (load.detailSets || []).map(s => ({ weight: item.type === 'strength' ? num(s.weight) : '', reps: num(s.reps) }));
    return { mode: 'detailed', detailedSets, weight: num(load.weight), sets: detailedSets.length, reps: num(load.reps) };
  }
  if (item.type === 'rounds') return { rounds: Math.max(0, num(load.sets)), minutes: num(load.reps) };
  if (item.type === 'time') return { minutes: num(load.reps) || num(load.sets) };
  if (item.type === 'reps') return { sets: Math.max(0, num(load.sets)), reps: num(load.reps) };
  return { weight: num(load.weight), sets: Math.max(0, num(load.sets)), reps: num(load.reps) };
}
function saveSimpleProgram() {
  const name = (simpleProgramDraft.name || '').trim();
  const assignedCount = simpleAssignedCount();
  const totalInput = $('simpleProgramTotalTrainingsInput');
  updateSimpleTotalTrainings(totalInput?.value || simpleProgramDraft.totalTrainings || 4);
  const progressionDays = simpleProgramDraft.totalTrainings || 4;
  if (!name) {
    setSimpleProgramStep(1);
    $('simpleProgramNameInput')?.classList.add('invalid');
    qfitAlert('Введите название программы.', 'Название обязательно');
    return;
  }
  if (!assignedCount) {
    setSimpleProgramStep(2);
    qfitAlert('Разложите хотя бы одно упражнение в тренировочный день.', 'Распределение пустое');
    return;
  }

  const activeDays = simpleProgramDraft.days
    .map((items, dayIndex) => ({ items, dayIndex }))
    .filter(x => x.items.length);
  const trainingCount = Math.max(1, progressionDays * activeDays.length);
  const program = createEmptyTableProgram(name, trainingCount);
  program.exercises = [];
  program.progression = {};
  program.workoutExercises = Array.from({ length: trainingCount }, () => []);

  const exerciseMap = new Map();
  activeDays.forEach(({ items }) => {
    items.forEach(item => {
      const found = findExercise(item.name);
      if (!found) return;
      const uidKey = item.instanceId || uid();
      item.instanceId = uidKey;
      const pEx = { uid: uidKey, name: found.name, type: found.type };
      exerciseMap.set(uidKey, { pEx, item });
      program.exercises.push(pEx);
      program.progression[uidKey] = {};
    });
  });

  for (let progressIndex = 0; progressIndex < progressionDays; progressIndex++) {
    activeDays.forEach(({ items }, activeDayOrder) => {
      const workoutIndex = progressIndex * activeDays.length + activeDayOrder;
      items.forEach(item => {
        const entry = exerciseMap.get(item.instanceId);
        if (!entry) return;
        program.workoutExercises[workoutIndex].push(entry.pEx.uid);
        program.progression[entry.pEx.uid][workoutIndex] = simpleLoadToCell(item, progressIndex);
      });
    });
  }
  program.simpleWizardDraft = {
    name,
    totalTrainings: progressionDays,
    exercises: clone(simpleProgramDraft.exercises || []),
    days: clone(simpleProgramDraft.days || [[], [], [], []])
  };
  db.programs[currentAthlete] ||= [];
  if (simpleEditingProgramIndex !== null && db.programs[currentAthlete][simpleEditingProgramIndex]) {
    const oldProgram = db.programs[currentAthlete][simpleEditingProgramIndex];
    program.id = oldProgram.id || program.id;
    program.createdAt = oldProgram.createdAt || program.createdAt;
    db.programs[currentAthlete][simpleEditingProgramIndex] = program;
  } else {
    db.programs[currentAthlete].unshift(program);
  }
  saveDb();
  simpleEditingProgramIndex = null;
  simpleProgramDraft = createSimpleDraft();
  qfitAlert('Программа сохранена. Её можно открыть, редактировать или отправить в План.', 'Готово');
  showOnly(programsScreen);
  renderPrograms();
}


function simpleLoadFromProgramCell(cell, type) {
  if (!cell) return defaultSimpleLoadForType(type);
  if (cell.mode === 'detailed' && Array.isArray(cell.detailedSets)) {
    const first = cell.detailedSets[0] || { weight: 0, reps: 1 };
    return {
      mode: 'detailed',
      weight: first.weight ?? cell.weight ?? 0,
      sets: cell.detailedSets.length || num(cell.sets) || 1,
      reps: first.reps ?? cell.reps ?? 1,
      detailSets: clone(cell.detailedSets)
    };
  }
  if (type === 'rounds') return { weight: 0, sets: num(cell.rounds) || 1, reps: num(cell.minutes) || 1 };
  if (type === 'time') return { weight: 0, sets: 1, reps: num(cell.minutes) || 10 };
  if (type === 'reps') return { weight: 0, sets: num(cell.sets) || 1, reps: num(cell.reps) || 1 };
  return { weight: num(cell.weight), sets: num(cell.sets) || 1, reps: num(cell.reps) || 1 };
}
function cloneSimpleDraftFromProgram(program) {
  normalizeProgramShape(program);
  if (program.simpleWizardDraft && Array.isArray(program.simpleWizardDraft.days)) {
    const draft = clone(program.simpleWizardDraft);
    draft.step = 1;
    draft.name = program.name || draft.name || '';
    draft.totalTrainings = Math.max(1, Math.min(60, num(draft.totalTrainings) || 4));
    draft.exercises ||= [];
    draft.days ||= [[], [], [], []];
    while (draft.days.length < 4) draft.days.push([]);
    if (draft.days.length > 4) draft.days.length = 4;
    draft.days.flat().forEach(item => { item.instanceId ||= uid(); normalizeSimpleItemLoad(item); });
    // v40: в старых версиях при распределении упражнения вырезались из списка выбора,
    // поэтому при редактировании шаг 1 открывался пустым. Восстанавливаем палитру
    // выбранных упражнений из уже распределённых дней.
    const selectedByName = new Map();
    (draft.exercises || []).forEach(item => selectedByName.set(normalizeText(item.name), item));
    draft.days.flat().forEach(item => {
      if (!item?.name) return;
      const key = normalizeText(item.name);
      if (!selectedByName.has(key)) {
        const found = findExercise(item.name);
        selectedByName.set(key, makeSimpleExerciseInstance(found || item));
      }
    });
    draft.exercises = Array.from(selectedByName.values());
    return draft;
  }

  const draft = createSimpleDraft();
  draft.name = program.name || '';
  const dayCount = Math.max(1, Math.min(4, program.trainingCount || 4));
  draft.totalTrainings = Math.max(1, Math.ceil((program.trainingCount || dayCount) / dayCount));
  for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
    const uidList = program.workoutExercises?.[dayIndex] || [];
    uidList.forEach(uidKey => {
      const pEx = program.exercises.find(x => x.uid === uidKey);
      const found = findExercise(pEx?.name);
      if (!found) return;
      const item = makeSimpleExerciseInstance(found);
      item.loads = Array.from({ length: draft.totalTrainings }, (_, progressIndex) => {
        const workoutIndex = progressIndex * dayCount + dayIndex;
        const cell = program.progression?.[uidKey]?.[workoutIndex] || program.progression?.[uidKey]?.[dayIndex];
        return simpleLoadFromProgramCell(cell, found.type);
      });
      item.load = item.loads[0];
      draft.days[dayIndex].push(item);
    });
  }
  const selectedByName = new Map();
  draft.days.flat().forEach(item => {
    if (!item?.name) return;
    const key = normalizeText(item.name);
    if (!selectedByName.has(key)) {
      const found = findExercise(item.name);
      selectedByName.set(key, makeSimpleExerciseInstance(found || item));
    }
  });
  draft.exercises = Array.from(selectedByName.values());
  return draft;
}
function editSavedProgram(index) {
  const program = db.programs[currentAthlete]?.[index];
  if (!program) return;
  simpleEditingProgramIndex = Number(index);
  simpleProgramDraft = cloneSimpleDraftFromProgram(program);
  // v40: если программа уже распределена, открываем сразу распределение,
  // чтобы было видно существующее состояние, а не пустой первый шаг.
  setSimpleProgramStep(simpleAssignedCount() ? 2 : 1);
  setTimeout(() => $('simpleProgramNameInput')?.focus(), 50);
}
function simpleListForPayload(payload) {
  if (!payload) return null;
  if (payload.source === 'pool') return simpleProgramDraft.exercises;
  if (payload.source === 'day') return simpleProgramDraft.days[Number(payload.dayIndex)] || null;
  return null;
}
function removeSimpleItemByPayload(payload) {
  const list = simpleListForPayload(payload);
  if (!list) return null;
  const index = Number(payload.index);
  if (index < 0 || index >= list.length) return null;
  return list.splice(index, 1)[0] || null;
}
function insertSimpleItemByPayload(item, targetPayload, insertAfter = false) {
  if (!item || !targetPayload) return false;
  const list = simpleListForPayload(targetPayload);
  if (!list) return false;
  let index = Number(targetPayload.index);
  if (insertAfter) index += 1;
  index = Math.max(0, Math.min(list.length, index));
  list.splice(index, 0, item);
  return true;
}
function moveSimpleDragPayloadToTarget(payload, targetPayload, insertAfter = false) {
  if (!payload || !targetPayload) return;
  // Если бросили на саму себя — ничего не меняем.
  if (payload.source === targetPayload.source && Number(payload.index) === Number(targetPayload.index) && Number(payload.dayIndex ?? -1) === Number(targetPayload.dayIndex ?? -1)) return;
  let item = null;
  let copiedFromPool = false;
  if (payload.source === 'pool' && targetPayload.source === 'day') {
    const source = simpleProgramDraft.exercises[Number(payload.index)];
    if (source) {
      item = { ...clone(source), instanceId: uid(), load: clone(source.load || defaultSimpleLoadForType(source.type)), loads: clone(source.loads || []) };
      copiedFromPool = true;
    }
  } else {
    item = removeSimpleItemByPayload(payload);
  }
  if (!item) return;
  // Если перенос внутри одного списка, после удаления индекс цели может сдвинуться.
  const sameList = payload.source === targetPayload.source && Number(payload.dayIndex ?? -1) === Number(targetPayload.dayIndex ?? -1);
  const adjusted = { ...targetPayload };
  if (sameList && Number(payload.index) < Number(targetPayload.index)) adjusted.index = Number(targetPayload.index) - 1;
  if (!insertSimpleItemByPayload(item, adjusted, insertAfter)) {
    // аварийный возврат на исходное место
    if (!copiedFromPool) insertSimpleItemByPayload(item, payload, false);
  }
  renderSimpleProgramCreate();
}
function moveSimpleDragPayloadToPool(payload) {
  const item = removeSimpleItemByPayload(payload);
  if (!item) return;
  simpleProgramDraft.exercises.push(item);
  renderSimpleProgramCreate();
}
function startSimplePointerDrag(e) {
  const card = e.target.closest('[data-simple-drag]');
  if (!card || e.target.closest('button')) return;
  let payload;
  try { payload = JSON.parse(card.dataset.simpleDrag || '{}'); } catch { return; }
  simplePointerDrag = {
    payload,
    card,
    startX: e.clientX,
    startY: e.clientY,
    moved: false,
    ghost: null,
    pointerId: e.pointerId
  };
  card.setPointerCapture?.(e.pointerId);
}
function moveSimplePointerDrag(e) {
  if (!simplePointerDrag) return;
  const dx = e.clientX - simplePointerDrag.startX;
  const dy = e.clientY - simplePointerDrag.startY;
  if (!simplePointerDrag.moved && Math.hypot(dx, dy) < 8) return;
  e.preventDefault();
  if (!simplePointerDrag.ghost) {
    simplePointerDrag.moved = true;
    simplePointerDrag.ghost = simplePointerDrag.card.cloneNode(true);
    simplePointerDrag.ghost.classList.add('simple-drag-ghost');
    simplePointerDrag.ghost.querySelectorAll('button').forEach(btn => btn.remove());
    document.body.appendChild(simplePointerDrag.ghost);
    document.body.classList.add('simple-dragging');
  }
  simplePointerDrag.ghost.style.left = `${e.clientX}px`;
  simplePointerDrag.ghost.style.top = `${e.clientY}px`;
  document.querySelectorAll('.simple-day-cell').forEach(cell => cell.classList.remove('is-drag-over'));
  const target = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('[data-simple-day]');
  target?.classList.add('is-drag-over');
}
function endSimplePointerDrag(e) {
  if (!simplePointerDrag) return;
  const drag = simplePointerDrag;
  simplePointerDrag = null;
  document.querySelectorAll('.simple-day-cell').forEach(cell => cell.classList.remove('is-drag-over'));
  document.body.classList.remove('simple-dragging');
  drag.ghost?.remove();
  if (!drag.moved) return;

  const under = document.elementFromPoint(e.clientX, e.clientY);
  const targetCard = under?.closest?.('[data-simple-drag]');
  if (targetCard && targetCard !== drag.card) {
    try {
      const targetPayload = JSON.parse(targetCard.dataset.simpleDrag || '{}');
      const rect = targetCard.getBoundingClientRect();
      const vertical = rect.height >= rect.width || targetCard.closest('.simple-day-items') || targetCard.closest('#simpleProgramExerciseList') || targetCard.closest('#simpleProgramPoolList');
      const insertAfter = vertical ? (e.clientY > rect.top + rect.height / 2) : (e.clientX > rect.left + rect.width / 2);
      return moveSimpleDragPayloadToTarget(drag.payload, targetPayload, insertAfter);
    } catch {}
  }

  if (under?.closest?.('#simpleProgramExerciseList') || under?.closest?.('#simpleProgramPoolList')) {
    return moveSimpleDragPayloadToPool(drag.payload);
  }

  const target = under?.closest?.('[data-simple-day]');
  if (!target) return;
  moveSimpleDragPayloadToDay(drag.payload, Number(target.dataset.simpleDay));
}
$('openSimpleProgramCreateBtn')?.addEventListener('click', openSimpleProgramCreate);
$('goSimpleProgramDaysBtn')?.addEventListener('click', goSimpleProgramDays);
$('goSimpleProgramLoadsBtn')?.addEventListener('click', goSimpleProgramLoads);
$('saveSimpleProgramBtn')?.addEventListener('click', saveSimpleProgram);
$('programDaysBackBtn')?.addEventListener('click', () => setSimpleProgramStep(1));
$('programLoadsBackBtn')?.addEventListener('click', () => setSimpleProgramStep(2));
$('backSimpleProgramToExercisesBtn')?.addEventListener('click', () => setSimpleProgramStep(1));
$('backSimpleProgramToDaysBtn')?.addEventListener('click', () => setSimpleProgramStep(2));

document.addEventListener('input', (e) => {
  if (e.target.matches('#simpleProgramNameInput')) {
    simpleProgramDraft.name = e.target.value;
    e.target.classList.remove('invalid');
    return;
  }
  if (e.target.matches('#simpleProgramExerciseInput')) {
    renderSimpleProgramExerciseSuggestions(e.target);
    return;
  }
  if (e.target.matches('#simpleProgramTotalTrainingsInput')) {
    updateSimpleTotalTrainings(e.target.value);
    return;
  }
  if (e.target.matches('[data-simple-load]')) {
    updateSimpleLoadValue(e.target.dataset.simpleLoad, e.target.value);
    return;
  }
  if (e.target.matches('[data-simple-detail-load]')) {
    updateSimpleDetailLoadValue(e.target.dataset.simpleDetailLoad, e.target.value);
    return;
  }
});

document.addEventListener('click', (e) => {

  const loadToggle = e.target.closest('[data-simple-load-toggle]');
  if (loadToggle) {
    e.preventDefault();
    e.stopPropagation();
    return toggleSimpleLoad(loadToggle.dataset.simpleLoadToggle);
  }
  const loadCopy = e.target.closest('[data-simple-load-copy-first]');
  if (loadCopy) {
    e.preventDefault();
    e.stopPropagation();
    return copySimpleLoadFirst(loadCopy.dataset.simpleLoadCopyFirst);
  }
  const loadLinear = e.target.closest('[data-simple-load-linear]');
  if (loadLinear) {
    e.preventDefault();
    e.stopPropagation();
    return linearSimpleLoad(loadLinear.dataset.simpleLoadLinear);
  }
  const loadClear = e.target.closest('[data-simple-load-clear]');
  if (loadClear) {
    e.preventDefault();
    e.stopPropagation();
    return clearSimpleLoad(loadClear.dataset.simpleLoadClear);
  }

  const detailToggle = e.target.closest('[data-simple-load-detail-toggle]');
  if (detailToggle) {
    e.preventDefault();
    e.stopPropagation();
    return toggleSimpleLoadDetail(detailToggle.dataset.simpleLoadDetailToggle);
  }
  const detailAdd = e.target.closest('[data-simple-detail-add-set]');
  if (detailAdd) {
    e.preventDefault();
    e.stopPropagation();
    return addSimpleDetailSet(detailAdd.dataset.simpleDetailAddSet);
  }
  const detailRemove = e.target.closest('[data-simple-detail-remove-set]');
  if (detailRemove) {
    e.preventDefault();
    e.stopPropagation();
    return removeSimpleDetailSet(detailRemove.dataset.simpleDetailRemoveSet);
  }

  const simplePick = e.target.closest('[data-simple-program-pick]');
  if (simplePick) {
    e.preventDefault();
    e.stopPropagation();
    return addSimpleProgramExerciseByName(simplePick.dataset.simpleProgramPick);
  }
  const move = e.target.closest('[data-simple-program-move]');
  if (move) {
    e.preventDefault();
    e.stopPropagation();
    return moveSimpleProgramItem(move.dataset.simpleProgramMove);
  }
  const duplicate = e.target.closest('[data-simple-program-duplicate]');
  if (duplicate) {
    e.preventDefault();
    e.stopPropagation();
    return duplicateSimpleProgramExercise(duplicate.dataset.simpleProgramDuplicate);
  }
  const simpleRemove = e.target.closest('[data-simple-program-remove]');
  if (simpleRemove) {
    e.preventDefault();
    e.stopPropagation();
    return removeSimpleProgramExercise(simpleRemove.dataset.simpleProgramRemove);
  }
  if (!e.target.closest('#simpleProgramExerciseInput') && !e.target.closest('#simpleProgramExerciseSuggest')) {
    hideSimpleProgramExerciseSuggestions();
  }
});


document.addEventListener('focusin', (e) => {
  if (e.target.matches('#simpleProgramExerciseInput')) renderSimpleProgramExerciseSuggestions(e.target);
});
document.addEventListener('pointerdown', (e) => {
  if (e.target.matches('#simpleProgramExerciseInput')) renderSimpleProgramExerciseSuggestions(e.target);
}, true);
document.addEventListener('pointerdown', startSimplePointerDrag);
document.addEventListener('pointermove', moveSimplePointerDrag, { passive: false });
document.addEventListener('pointerup', endSimplePointerDrag);
document.addEventListener('pointercancel', endSimplePointerDrag);

/* v37 — простой список сохранённых программ на главном экране «Программы».
   Не используем старую кнопку «Открыть», потому что текущий мастер создания программы отдельный. */
function renderPrograms(mode = 'my') {
  const list = $('programList');
  if (!list) return;
  ensureDb();
  const items = db.programs[currentAthlete] || [];
  if (!items.length) {
    list.innerHTML = `<section class="program-card"><h3>Пока нет сохранённых программ</h3><p>Создайте программу, и она появится здесь.</p></section>`;
    return;
  }
  list.innerHTML = items.map((program, i) => {
    normalizeProgramShape(program);
    const totals = programTotals(program);
    const status = programStatus(program);
    const disabled = status.ready ? '' : 'disabled aria-disabled="true"';
    return `<article class="program-card program-status-${status.key}">
      <div class="program-card-head"><div>
        <span class="eyebrow">СОХРАНЁННАЯ ПРОГРАММА</span>
        <h3>${escapeHtml(program.name)}</h3>
        <p>${program.trainingCount} тренировок · упражнений: ${program.exercises.length}</p>
        <div class="program-status">${escapeHtml(status.text)}</div>
      </div></div>
      <div class="plan-mini-metrics"><span>КПШ ${fmt(totals.reps)}</span><span>${totals.tonnage ? fmt(totals.tonnage) + ' кг' : 'кг —'}</span></div>
      <div class="program-actions">
        <button class="small-btn" data-edit-program="${i}" type="button">Редактировать</button>
        <button class="small-btn" data-copy-program="${i}" type="button">Копия</button>
        <button class="small-btn solid" data-activate-program="${i}" type="button" ${disabled}>В План</button>
        <button class="small-btn danger" data-delete-program="${i}" type="button">Удалить</button>
      </div>
    </article>`;
  }).join('');
}

// v38: после переопределения renderPrograms обновляем список сохранённых программ.
renderPrograms();
