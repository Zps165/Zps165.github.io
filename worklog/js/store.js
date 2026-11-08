import { loadDB, saveDB, defaultDB } from './storage.js'
import { currentYm, todayStr } from './date.js'
import { buildHolidayMap, BUILTIN_HOLIDAYS } from './holidays.js'
import { settleDuePlans } from './plans.js'

const db = loadDB()

export const state = {
  ...db,
  tab: 'calendar',
  ym: currentYm(),
  sheetDate: null,
  toast: null,
  updateReady: false,
}

const subs = new Set()
let toastTimer = null

export function subscribe(fn) {
  subs.add(fn)
  return () => subs.delete(fn)
}

export function notify() {
  for (const fn of subs) fn()
}

export function commit(mutator) {
  mutator(state)
  saveDB(state)
  notify()
}

export function getHolidayMap() {
  return buildHolidayMap(state.holidays, state.feed ? state.feed.holidays : [])
}

export function setTab(tab) {
  if (state.tab === tab) return
  state.tab = tab
  notify()
}

export function setYm(ym) {
  state.ym = ym
  notify()
}

export function openDay(date) {
  state.sheetDate = date
  notify()
}

export function closeDay() {
  state.sheetDate = null
  notify()
}

export function saveDay(rec) {
  commit((s) => {
    s.days[rec.date] = rec
  })
}

/** 把已到期的排休计划转为休息；返回转换数量。 */
export function applyDuePlans() {
  const changed = settleDuePlans(state.days, todayStr())
  if (!changed.length) return 0
  if (!saveDB(state)) console.warn('本地存储写入失败')
  toast(`已将 ${changed.length} 天排休转为休息`)
  return changed.length
}

export function deleteDay(date) {
  commit((s) => {
    delete s.days[date]
  })
}

export function patchSettings(patch) {
  commit((s) => {
    Object.assign(s.settings, patch)
  })
}

export function patchMultipliers(patch) {
  commit((s) => {
    Object.assign(s.settings.multipliers, patch)
  })
}

export function addShift(shift) {
  commit((s) => {
    s.settings.shifts.push(shift)
  })
}

export function updateShift(id, patch) {
  commit((s) => {
    const sh = s.settings.shifts.find((x) => x.id === id)
    if (sh) Object.assign(sh, patch)
  })
}

export function deleteShift(id) {
  commit((s) => {
    if (s.settings.shifts.length <= 1) return
    s.settings.shifts = s.settings.shifts.filter((x) => x.id !== id)
    if (s.settings.defaultShiftId === id) s.settings.defaultShiftId = s.settings.shifts[0].id
  })
}

export function addHoliday(h) {
  commit((s) => {
    s.holidays = s.holidays.filter((x) => x.date !== h.date)
    s.holidays.push({ ...h, source: 'user' })
  })
}

export function updateHoliday(oldDate, h) {
  commit((s) => {
    s.holidays = s.holidays.filter((x) => x.date !== oldDate && x.date !== h.date)
    s.holidays.push({ ...h, source: 'user' })
  })
}

export function deleteHoliday(date) {
  commit((s) => {
    s.holidays = s.holidays.filter((x) => x.date !== date)
    // 统一写一条 hidden，内置/在线/自定义都能被隐藏
    s.holidays.push({ date, name: '', type: 'statutory', source: 'user', hidden: true })
  })
}

export function restoreBuiltin() {
  const builtinDates = new Set(BUILTIN_HOLIDAYS.map((h) => h.date))
  commit((s) => {
    s.holidays = s.holidays.filter((h) => !builtinDates.has(h.date))
  })
}

export function setFeed(feed) {
  commit((s) => {
    s.feed = feed
  })
}

export function clearRecords() {
  commit((s) => {
    s.days = {}
    s.sheetDate = null
  })
}

export function replaceDB(next) {
  const safe = next || defaultDB()
  commit((s) => {
    s.settings = safe.settings
    s.days = safe.days
    s.holidays = safe.holidays
    s.feed = safe.feed
    s.meta = safe.meta
    s.ym = currentYm()
    s.tab = 'calendar'
    s.sheetDate = null
  })
}

export function setUpdateReady(value) {
  if (state.updateReady === value) return
  state.updateReady = value
  notify()
}

export function toast(message) {
  state.toast = { message, id: Date.now() }
  notify()
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    state.toast = null
    notify()
  }, 2600)
}
