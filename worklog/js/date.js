// 日期工具：全部按本地时区处理，日期键统一为 'YYYY-MM-DD'
export const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']

export function pad2(n) {
  return String(n).padStart(2, '0')
}

export function fmtDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayStr() {
  return fmtDate(new Date())
}

export function currentYm() {
  const d = new Date()
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

export function ymOf(dateStr) {
  return dateStr.slice(0, 7)
}

export function addMonths(ym, delta) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`
}

export function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number)
  return `${y}年${m}月`
}

export function daysInMonth(ym) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function weekdayIndex(dateStr) {
  return parseDate(dateStr).getDay()
}

export function isWeekend(dateStr) {
  const w = weekdayIndex(dateStr)
  return w === 0 || w === 6
}

export function weekdayCN(dateStr) {
  return '周' + WEEK_CN[weekdayIndex(dateStr)]
}

export function dateLabel(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${m}月${d}日 ${weekdayCN(dateStr)}`
}

export function shortDate(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number)
  return `${m}/${d}`
}

export function yearOf(dateStr) {
  return Number(dateStr.slice(0, 4))
}

/**
 * 生成月历网格（含前后补齐），固定整周数。
 * weekStart: 1 = 周一，0 = 周日
 */
export function monthGrid(ym, weekStart = 1) {
  const [y, m] = ym.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const lead = (first.getDay() - weekStart + 7) % 7
  const total = Math.ceil((lead + daysInMonth(ym)) / 7) * 7
  const start = new Date(y, m - 1, 1 - lead)
  const out = []
  for (let i = 0; i < total; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    out.push(fmtDate(d))
  }
  return out
}

/** 当前月的第几天（用于“今天”定位） */
export function dayOfMonth(dateStr) {
  return Number(dateStr.slice(8, 10))
}
