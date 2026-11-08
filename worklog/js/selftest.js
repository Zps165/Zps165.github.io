import { defaultSettings } from './storage.js'
import { calcDay, calcMonth, calcToRow, settle, spanMinutes, roundHours, resolveDayType } from './calc.js'
import { buildHolidayMap } from './holidays.js'
import { settleDuePlans } from './plans.js'

const lines = []
let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
    lines.push(`PASS  ${name}`)
  } catch (err) {
    failed++
    lines.push(`FAIL  ${name}\n      ${err.message}`)
  }
}

function eq(actual, expected, msg = '') {
  if (typeof expected === 'number') {
    if (Math.abs(actual - expected) > 1e-6) {
      throw new Error(`${msg} expected ${expected}, got ${actual}`)
    }
  } else if (actual !== expected) {
    throw new Error(`${msg} expected ${expected}, got ${actual}`)
  }
}

function ok(cond, msg) {
  if (!cond) throw new Error(msg)
}

const settings = defaultSettings()
settings.rateMode = 'hourly'
settings.hourlyRate = 30
settings.rounding = 'none'
settings.sickPayRatio = 0.6

const map = buildHolidayMap([], [])

const work = (date, start, end, brk = 60, extra = {}) => ({
  date,
  status: 'work',
  start,
  end,
  breakMinutes: brk,
  updatedAt: 0,
  ...extra,
})

const T = (o) => ({
  ot15: 0,
  ot2: 0,
  ot3: 0,
  absentDays: 0,
  personalDays: 0,
  sickDays: 0,
  annualDays: 0,
  compDays: 0,
  ...o,
})

test('班次跨度：白班 08:00–17:00 = 9h', () => eq(spanMinutes('08:00', '17:00'), 540))
test('班次跨度：夜班 20:00–05:00 跨天 = 9h', () => eq(spanMinutes('20:00', '05:00'), 540))
test('取整：8h12m 取整到 30 分钟 = 8.0h', () => eq(roundHours(8.2, '30'), 8.0))
test('取整：8h18m 取整到 30 分钟 = 8.5h', () => eq(roundHours(8.3, '30'), 8.5))
test('取整：不取整保留 2 位', () => eq(roundHours(8.216, 'none'), 8.22))

test('工作日 8h：无加点', () => {
  const c = calcDay(work('2026-11-02', '08:00', '17:00'), '2026-11-02', settings, map)
  eq(c.hours, 8)
  eq(c.ot15, 0)
  eq(c.amount, 0)
})

test('工作日 10h：加点 2h，金额 90（时薪 30）', () => {
  const c = calcDay(work('2026-11-02', '08:00', '19:00'), '2026-11-02', settings, map)
  eq(c.hours, 10)
  eq(c.ot15, 2)
  eq(c.amount, 90)
})

test('休息日 7h：2 倍，金额 420', () => {
  const c = calcDay(work('2026-11-07', '10:00', '18:00'), '2026-11-07', settings, map)
  eq(c.ot2, 7)
  eq(c.amount, 420)
})

test('法定 7h：3 倍，金额 630', () => {
  const c = calcDay(work('2026-10-01', '09:00', '17:00'), '2026-10-01', settings, map)
  eq(c.ot3, 7)
  eq(c.amount, 630)
})

test('月汇总例 1：加班 16h + 加点 2h + 三薪 8h − 缺勤 8h = 工时账 18h，加班费 1290', () => {
  const r = settle(T({ ot2: 16, ot15: 2, ot3: 8, absentDays: 1 }), settings)
  eq(r.offsetHours, 8)
  eq(r.ot2e, 8)
  eq(r.ot15e, 2)
  eq(r.ledger, 18)
  eq(r.otPay, 1290)
  eq(r.pay, 1290)
})

test('缺勤优先扣加班：100h 加班 + 30h 加点 − 3 天缺勤 → 加班 76h，工时账 106h，金额 3940', () => {
  const s20 = { ...settings, hourlyRate: 20 }
  const r = settle(T({ ot2: 100, ot15: 30, absentDays: 3 }), s20)
  eq(r.ot2e, 76)
  eq(r.ot15e, 30)
  eq(r.owed, 0)
  eq(r.ledger, 106)
  eq(r.otPay, 3940)
})

test('缺勤超过加班：先扣加点，剩余记欠班', () => {
  const r = settle(T({ ot2: 10, ot15: 30, absentDays: 3 }), settings)
  eq(r.ot2e, 0)
  eq(r.ot15e, 16)
  eq(r.owed, 0)
  eq(r.ledger, 16)
  eq(r.otPay, 720)
})

test('欠班不侵蚀三薪：三薪 8h + 缺勤 3 天，三薪仍全额 720', () => {
  const r = settle(T({ ot3: 8, absentDays: 3 }), settings)
  eq(r.ot2e, 0)
  eq(r.ot15e, 0)
  eq(r.owed, 24)
  eq(r.otPay, 720)
  eq(r.pay, 720)
  eq(r.ledger, -16)
})

test('调休 1 天：冲减 8h 休息日加班，不扣钱', () => {
  const r = settle(T({ ot2: 8, compDays: 1 }), settings)
  eq(r.ot2e, 0)
  eq(r.otPay, 0)
  eq(r.ledger, 0)
  eq(r.owed, 0)
})

test('病假：按 40% 扣款（比例 60%），8h 病假扣 96', () => {
  const r = settle(T({ ot2: 8, sickDays: 1 }), settings)
  eq(r.sickPay, 96)
  eq(r.pay, 384)
})

test('年假：不扣款、不冲减', () => {
  const r = settle(T({ ot2: 8, annualDays: 1 }), settings)
  eq(r.pay, 480)
  eq(r.ledger, 8)
})

test('节假日判定：2026 除夕 2/16 为法定', () => eq(map.get('2026-02-16').type, 'statutory'))
test('节假日判定：2026 春节 2/20 为休息日 2 倍', () => eq(resolveDayType('2026-02-20', null, map), 'restday'))
test('节假日判定：2026 春节补班 2/14 周六按工作日', () => eq(resolveDayType('2026-02-14', null, map), 'workday'))
test('节假日判定：2026 国庆 10/5 为休息日', () => eq(resolveDayType('2026-10-05', null, map), 'restday'))
test('节假日判定：2027 除夕 2/5 为法定', () => eq(resolveDayType('2027-02-05', null, map), 'statutory'))
test('节假日判定：普通周末为休息日', () => eq(resolveDayType('2026-11-07', null, map), 'restday'))
test('节假日判定：普通周一为工作日', () => eq(resolveDayType('2026-11-02', null, map), 'workday'))

test('手动改日期类型优先于内置', () => {
  const rec = work('2026-10-01', '09:00', '17:00', 60, { dayTypeOverride: 'workday' })
  const c = calcDay(rec, '2026-10-01', settings, map)
  eq(c.ot15, 1)
  eq(c.ot3, 0)
})

test('月汇总：10h 工作日 + 7h 周六 = 加点 2h、加班 7h、金额 510', () => {
  const days = {
    '2026-11-02': work('2026-11-02', '08:00', '19:00'),
    '2026-11-07': work('2026-11-07', '10:00', '18:00'),
  }
  const m = calcMonth('2026-11', days, settings, map)
  eq(m.totals.ot15, 2)
  eq(m.totals.ot2, 7)
  eq(m.otPay, 510)
  eq(m.pay, 510)
})

test('空月份：全部为 0', () => {
  const m = calcMonth('2026-12', {}, settings, map)
  eq(m.pay, 0)
  eq(m.ledger, 0)
  eq(m.totals.emptyDays, 31)
})

test('排休计划：只结算过去日期，保留备注/类型覆盖', () => {
  const days = {
    '2026-11-01': { date: '2026-11-01', status: 'planned', days: 1, note: '回家', dayTypeOverride: 'workday', updatedAt: 0 },
    '2026-11-08': { date: '2026-11-08', status: 'planned', days: 1, updatedAt: 0 },
    '2026-11-20': { date: '2026-11-20', status: 'planned', days: 1, updatedAt: 0 },
  }
  const changed = settleDuePlans(days, '2026-11-08', 123)
  eq(changed.length, 1)
  eq(changed[0], '2026-11-01')
  eq(days['2026-11-01'].status, 'rest')
  eq(days['2026-11-01'].note, '回家')
  eq(days['2026-11-01'].dayTypeOverride, 'workday')
  eq(days['2026-11-01'].updatedAt, 123)
  eq(days['2026-11-08'].status, 'planned')
  eq(days['2026-11-20'].status, 'planned')
})

test('排休单日：不计工时/金额，不算缺勤', () => {
  const c = calcDay({ date: '2026-11-20', status: 'planned', days: 1, updatedAt: 0 }, '2026-11-20', settings, map)
  eq(c.status, 'planned')
  eq(c.days, 1)
  eq(c.hours, 0)
  eq(c.amount, 0)
  eq(c.absentDays, 0)
})

test('排休进月汇总：plannedDays=1，不计缺勤/工时', () => {
  const days = { '2026-11-20': { date: '2026-11-20', status: 'planned', days: 1, updatedAt: 0 } }
  const m = calcMonth('2026-11', days, settings, map)
  eq(m.totals.plannedDays, 1)
  eq(m.totals.emptyDays, 29)
  eq(m.totals.absentDays, 0)
  eq(m.ledger, 0)
  eq(m.pay, 0)
})

test('结算暴露 otTotal，不再有 owedValue', () => {
  const r = settle(T({ ot2: 16, ot15: 2, ot3: 8, absentDays: 1 }), settings)
  eq(r.otTotal, 26)
  ok(!('owedValue' in r), 'owedValue 应已删除')
})

test('CSV：排休状态为「排休」，天数列留空', () => {
  const c = calcDay({ date: '2026-11-20', status: 'planned', days: 1, updatedAt: 0 }, '2026-11-20', settings, map)
  const row = calcToRow(c, settings)
  eq(row[2], '排休')
  eq(row[7], '')
  eq(row[10], '')
})

const out = document.getElementById('out')
const head = `结果：${failed === 0 ? 'PASS' : 'FAIL'} · 通过 ${passed} · 失败 ${failed}\n\n`
out.textContent = head + lines.join('\n')
out.className = failed === 0 ? 'pass' : 'fail'
document.title = failed === 0 ? 'PASS' : 'FAIL'
document.body.dataset.result = failed === 0 ? 'pass' : 'fail'
window.__selftest = { passed, failed, lines }
