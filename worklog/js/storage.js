const KEY = 'worklog:v1'

export function defaultSettings() {
  return {
    schemaVersion: 1,
    rateMode: 'hourly',
    hourlyRate: 20,
    monthlySalary: 5000,
    rounding: '30',
    multipliers: { ot15: 1.5, ot2: 2, ot3: 3, owed: 1 },
    sickPayRatio: 0.6,
    shifts: [
      { id: 'day', name: '白班', start: '08:00', end: '17:00', breakMinutes: 60, color: 'day' },
      { id: 'night', name: '夜班', start: '20:00', end: '05:00', breakMinutes: 60, color: 'night' },
    ],
    defaultShiftId: 'day',
    weekStart: 1,
    theme: 'system',
    holidayFeedUrl: '',
    autoCheckHoliday: true,
    onboarded: false,
  }
}

export function defaultDB() {
  return {
    settings: defaultSettings(),
    days: {},
    holidays: [],
    feed: null,
    meta: { createdAt: Date.now(), lastExportAt: 0 },
  }
}

function normalize(db) {
  const d = defaultDB()
  if (!db || typeof db !== 'object') return d
  const rawSettings = db.settings && typeof db.settings === 'object' ? db.settings : {}
  const settings = { ...d.settings, ...rawSettings }
  settings.multipliers = { ...d.settings.multipliers, ...(rawSettings.multipliers || {}) }
  if (!Array.isArray(settings.shifts) || settings.shifts.length === 0) settings.shifts = d.settings.shifts
  settings.shifts = settings.shifts
    .filter((s) => s && s.id && s.name)
    .map((s) => ({
      id: String(s.id),
      name: String(s.name),
      start: s.start || '08:00',
      end: s.end || '17:00',
      breakMinutes: Number(s.breakMinutes) || 0,
      color: s.color === 'night' ? 'night' : s.color === 'day' ? 'day' : 'other',
    }))
  if (settings.shifts.length === 0) settings.shifts = d.settings.shifts
  if (!settings.shifts.some((s) => s.id === settings.defaultShiftId)) {
    settings.defaultShiftId = settings.shifts[0].id
  }
  return {
    settings,
    days: db.days && typeof db.days === 'object' && !Array.isArray(db.days) ? db.days : {},
    holidays: Array.isArray(db.holidays) ? db.holidays.filter((h) => h && h.date) : [],
    feed: db.feed && Array.isArray(db.feed.holidays) ? db.feed : null,
    meta: { ...d.meta, ...(db.meta && typeof db.meta === 'object' ? db.meta : {}) },
  }
}

export function loadDB() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultDB()
    return normalize(JSON.parse(raw))
  } catch (err) {
    console.warn('读取本地数据失败，已使用空数据', err)
    return defaultDB()
  }
}

export function saveDB(db) {
  try {
    const payload = {
      settings: db.settings,
      days: db.days,
      holidays: db.holidays,
      feed: db.feed,
      meta: db.meta,
    }
    localStorage.setItem(KEY, JSON.stringify(payload))
    return true
  } catch (err) {
    console.error('保存失败', err)
    return false
  }
}

export function clearDB() {
  try {
    localStorage.removeItem(KEY)
  } catch (err) {
    console.error(err)
  }
}

export function exportPayload(db) {
  return JSON.stringify(
    {
      app: 'worklog',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: db.settings,
      days: db.days,
      holidays: db.holidays,
      feed: db.feed,
      meta: db.meta,
    },
    null,
    2,
  )
}

export function parseImport(text) {
  const data = JSON.parse(String(text).replace(/^\uFEFF/, ''))
  if (!data || typeof data !== 'object') throw new Error('文件内容不是有效的 JSON 对象')
  if (!data.settings || !data.days) throw new Error('缺少 settings 或 days 字段，可能不是工时记备份')
  return normalize(data)
}
