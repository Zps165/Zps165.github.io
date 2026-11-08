import { daysInMonth, isWeekend, pad2 } from './date.js'

export function effectiveRate(settings) {
  if (settings.rateMode === 'monthly') {
    return (Number(settings.monthlySalary) || 0) / 21.75 / 8
  }
  return Number(settings.hourlyRate) || 0
}

export function toMinutes(t) {
  if (!t || typeof t !== 'string') return NaN
  const [h, m] = t.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN
  return h * 60 + m
}

/** 班次跨度（分钟），结束 <= 开始 视为跨天；相等视为 24 小时 */
export function spanMinutes(start, end) {
  const a = toMinutes(start)
  const b = toMinutes(end)
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0
  return b > a ? b - a : b + 1440 - a
}

export function roundHours(h, mode) {
  if (mode === 'none') return Math.round(h * 100) / 100
  const step = Number(mode) / 60
  if (!step) return h
  return Math.round(h / step) * step
}

export function resolveDayType(date, rec, holidayMap) {
  if (rec && rec.dayTypeOverride) return rec.dayTypeOverride
  const h = holidayMap && holidayMap.get(date)
  if (h) {
    if (h.type === 'makeup') return 'workday'
    if (h.type === 'rest') return 'restday'
    if (h.type === 'statutory') return 'statutory'
  }
  return isWeekend(date) ? 'restday' : 'workday'
}

export function dayTypeLabel(type) {
  return type === 'workday' ? '工作日' : type === 'restday' ? '休息日' : '法定节假日'
}

export const LEAVE_LABEL = {
  annual: '年假',
  sick: '病假',
  personal: '事假',
  comp: '调休',
}

export const LEAVE_FIELD = {
  annual: 'annualDays',
  sick: 'sickDays',
  personal: 'personalDays',
  comp: 'compDays',
}

export const DAY_TYPE_LABEL = {
  workday: '工作日',
  restday: '休息日',
  statutory: '法定节假日',
}

function hoursForRecord(rec, settings) {
  const shift =
    settings.shifts.find((s) => s.id === rec.shiftId) ||
    settings.shifts.find((s) => s.id === settings.defaultShiftId) ||
    settings.shifts[0]
  const start = rec.start || (shift ? shift.start : '08:00')
  const end = rec.end || (shift ? shift.end : '17:00')
  const brk = rec.breakMinutes != null ? Number(rec.breakMinutes) : shift ? Number(shift.breakMinutes) : 0
  const span = spanMinutes(start, end)
  const raw = Math.max(0, span - Math.max(0, brk)) / 60
  return { span, raw, hours: roundHours(raw, settings.rounding), start, end, brk, shift }
}

/**
 * 单日计算，只产出桶（不含缺勤抵扣）。
 */
export function calcDay(rec, date, settings, holidayMap) {
  const dayType = resolveDayType(date, rec, holidayMap)
  const status = rec ? rec.status : 'empty'
  const base = {
    date,
    dayType,
    status,
    leaveType: rec ? rec.leaveType : undefined,
    shiftName: '',
    start: '',
    end: '',
    breakMinutes: 0,
    spanMinutes: 0,
    rawHours: 0,
    hours: 0,
    ot15: 0,
    ot2: 0,
    ot3: 0,
    days: 0,
    absentDays: 0,
    personalDays: 0,
    sickDays: 0,
    annualDays: 0,
    compDays: 0,
    amount: 0,
    note: rec ? rec.note || '' : '',
  }

  if (!rec || status === 'empty') return base

  if (status === 'planned') {
    return { ...base, status: 'planned', days: Number(rec.days) || 1 }
  }

  if (status === 'rest') {
    // 工作日休息 = 缺勤；休息日 / 法定节假日休息 = 正常休息
    if (dayType === 'workday') {
      const d = Number(rec.days) || 1
      return { ...base, days: d, absentDays: d }
    }
    return base
  }

  if (status === 'absent') {
    const d = Number(rec.days) || 1
    return { ...base, days: d, absentDays: d }
  }

  if (status === 'leave') {
    const d = Number(rec.days) || 1
    const t = rec.leaveType || 'personal'
    const field = LEAVE_FIELD[t] || 'personalDays'
    return { ...base, leaveType: t, days: d, [field]: d }
  }

  // status === 'work'
  const { span, raw, hours, start, end, brk, shift } = hoursForRecord(rec, settings)
  let ot15 = 0
  let ot2 = 0
  let ot3 = 0
  if (dayType === 'workday') ot15 = Math.max(0, hours - 8)
  else if (dayType === 'restday') ot2 = hours
  else ot3 = hours

  const amount = dayAmount({ dayType, status: 'work', hours, ot15, ot2, ot3 }, settings)

  return {
    ...base,
    status: 'work',
    shiftName: shift ? shift.name : '',
    start,
    end,
    breakMinutes: brk,
    spanMinutes: span,
    rawHours: raw,
    hours,
    ot15,
    ot2,
    ot3,
    amount,
  }
}

export function dayAmount(calc, settings) {
  if (!calc || calc.status !== 'work') return 0
  const r = effectiveRate(settings)
  const m = settings.multipliers
  return r * (m.ot15 * calc.ot15 + m.ot2 * calc.ot2 + m.ot3 * calc.ot3)
}

/**
 * 月度汇总。
 * 缺勤/事假/调休的小时数按顺序冲减：休息日加班(2×) → 加点(1.5×) → 欠班；
 * 法定加班(3×) 永不参与抵扣。
 */
export function calcMonth(ym, dayRecords, settings, holidayMap) {
  const n = daysInMonth(ym)
  const list = []
  const totals = {
    workDays: 0,
    restDays: 0,
    plannedDays: 0,
    emptyDays: 0,
    leaveDays: 0,
    absentDays: 0,
    personalDays: 0,
    sickDays: 0,
    annualDays: 0,
    compDays: 0,
    hours: 0,
    ot15: 0,
    ot2: 0,
    ot3: 0,
    workdayCount: 0,
    restdayCount: 0,
    statutoryCount: 0,
    statutoryWorkDays: 0,
  }

  for (let i = 1; i <= n; i++) {
    const date = `${ym}-${pad2(i)}`
    const c = calcDay(dayRecords[date], date, settings, holidayMap)
    list.push(c)

    if (c.dayType === 'workday') totals.workdayCount++
    else if (c.dayType === 'restday') totals.restdayCount++
    else totals.statutoryCount++

    if (c.status === 'work') {
      totals.workDays++
      totals.hours += c.hours
      totals.ot15 += c.ot15
      totals.ot2 += c.ot2
      totals.ot3 += c.ot3
      if (c.dayType === 'statutory') totals.statutoryWorkDays++
    } else if (c.status === 'rest') {
      if (c.absentDays > 0) totals.absentDays += c.absentDays
      else totals.restDays++
    } else if (c.status === 'planned') {
      totals.plannedDays += c.days
    } else if (c.status === 'empty') {
      totals.emptyDays++
    } else if (c.status === 'absent') {
      totals.absentDays += c.absentDays
    } else if (c.status === 'leave') {
      totals.leaveDays += c.days
      totals.personalDays += c.personalDays
      totals.sickDays += c.sickDays
      totals.annualDays += c.annualDays
      totals.compDays += c.compDays
    }
  }

  const settled = settle(totals, settings)

  return {
    ym,
    list,
    totals,
    ...settled,
  }
}

/**
 * 月度结算：把桶汇总成抵缺勤后工时与加班费。
 * 欠班只作为结算内部结果，不从 3× 加班费里扣，保证三薪不被缺勤侵蚀。
 */
export function settle(totals, settings) {
  const rate = effectiveRate(settings)
  const m = settings.multipliers
  const offsetDays = totals.absentDays + totals.personalDays + totals.compDays
  const offsetHours = 8 * offsetDays

  const ot2e = Math.max(0, totals.ot2 - offsetHours)
  const rem = Math.max(0, offsetHours - totals.ot2)
  const ot15e = Math.max(0, totals.ot15 - rem)
  const owed = Math.max(0, rem - totals.ot15)

  const otTotal = totals.ot15 + totals.ot2 + totals.ot3
  const ledger = otTotal - offsetHours
  const otPay = rate * (m.ot2 * ot2e + m.ot15 * ot15e + m.ot3 * totals.ot3)
  const sickPay = rate * 8 * totals.sickDays * (1 - (Number(settings.sickPayRatio) || 0))

  return {
    rate,
    offsetDays,
    offsetHours,
    ot2e,
    ot15e,
    owed,
    otTotal,
    ledger,
    otPay,
    sickPay,
    pay: otPay - sickPay,
  }
}

/** 导出 CSV 用：把单日结果转成一行 */
export function calcToRow(c, settings) {
  const leave = c.status === 'leave' ? LEAVE_LABEL[c.leaveType] || '请假' : ''
  const statusText =
    c.status === 'work'
      ? '上班'
      : c.status === 'rest'
        ? c.absentDays > 0
          ? '缺勤'
          : '休息'
        : c.status === 'absent'
          ? '缺勤'
          : c.status === 'leave'
            ? leave
            : c.status === 'planned'
              ? '排休'
              : '未填'
  return [
    c.date,
    c.dayType === 'workday' ? '工作日' : c.dayType === 'restday' ? '休息日' : '法定节假日',
    statusText,
    c.shiftName || '',
    c.start || '',
    c.end || '',
    c.status === 'work' ? c.breakMinutes : '',
    c.status === 'work' ? c.hours.toFixed(2) : '',
    c.ot15 ? c.ot15.toFixed(2) : '',
    c.ot2 + c.ot3 ? (c.ot2 + c.ot3).toFixed(2) : '',
    c.status === 'absent' || c.status === 'leave' || (c.status === 'rest' && c.absentDays > 0) ? c.days : '',
    c.amount ? c.amount.toFixed(2) : '',
    (c.note || '').replace(/[\r\n,]/g, ' '),
  ]
}
