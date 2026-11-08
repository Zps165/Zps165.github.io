import { state, setYm, getHolidayMap, setTab } from '../store.js'
import { addMonths, monthGrid, monthLabel, todayStr, WEEK_CN } from '../date.js'
import { calcMonth } from '../calc.js'
import { esc, fmtDays, fmtH, fmtMoney, signedH } from './dom.js'
import { openDaySheet } from './day-sheet.js'

function badgeFor(calc, settings) {
  if (!calc) return { text: '', cls: '' }
  if (calc.status === 'work') {
    const shift = settings.shifts.find((s) => s.id === (state.days[calc.date] || {}).shiftId)
    const color = shift ? shift.color : 'other'
    const cls = color === 'day' ? 'b-day' : color === 'night' ? 'b-night' : 'b-leave'
    const text = shift ? shift.name.slice(0, 1) : '班'
    return { text, cls }
  }
  if (calc.status === 'planned') return { text: '排', cls: 'b-planned' }
  // 日历里的休息统一显示「休」；工作日休息仍由 calcDay 计入 absentDays。
  // 旧数据的 absent 也按「休」展示，缺勤只在汇总/统计页体现。
  if (calc.status === 'rest' || calc.status === 'absent') {
    return { text: '休', cls: 'b-rest' }
  }
  if (calc.status === 'leave') {
    const map = { annual: '年', sick: '病', personal: '事', comp: '调' }
    return { text: map[calc.leaveType] || '假', cls: 'b-leave' }
  }
  return { text: '', cls: '' }
}

function cellHtml(date, inMonth, summary, map, today, settings) {
  const dayNum = Number(date.slice(8))
  const calc = inMonth ? summary.list[dayNum - 1] : null
  const h = map.get(date)
  const cls = ['cell']
  if (!inMonth) cls.push('out')
  if (date === today) cls.push('today')
  if (h && h.type === 'statutory') cls.push('has-statutory')
  if (h && h.type === 'rest') cls.push('has-rest')

  let badge = { text: '', cls: '' }
  let dh = ''
  if (calc) {
    badge = badgeFor(calc, settings)
    if (!badge.text && h && h.type === 'statutory') badge = { text: '法', cls: 'b-day' }
    if (calc.status === 'work') {
      dh = `${fmtH(calc.hours)}h`
    } else if (calc.status === 'leave') {
      dh = `${fmtDays(calc.days)}天`
    } else if (calc.status === 'rest' || calc.status === 'absent') {
      // 只有半天休息才显示天数；整天休息保持干净，缺勤在汇总里看。
      if (Number(calc.days) % 1 !== 0) dh = `${fmtDays(calc.days)}天`
    }
  }

  const dotType = h ? (h.type === 'rest' ? 'restday' : h.type === 'makeup' ? 'makeup' : 'statutory') : ''
  return `<button class="${cls.join(' ')}" data-date="${date}" ${inMonth ? '' : 'tabindex="-1"'} aria-label="${date}">
    <span class="dnum">${dayNum}</span>
    ${badge.text ? `<span class="badge ${badge.cls}">${esc(badge.text)}</span>` : '<span class="badge" style="visibility:hidden">·</span>'}
    ${dh ? `<span class="dh">${dh}</span>` : ''}
    ${dotType ? `<span class="tdot ${dotType}"></span>` : ''}
  </button>`
}

function legendHtml() {
  const items = [
    ['day', '白'],
    ['night', '夜'],
    ['rest', '休'],
    ['leave', '假'],
    ['statutory', '法'],
    ['planned', '排'],
  ]
  return `<div class="legend" aria-hidden="true">
    ${items.map(([cls, label]) => `<span><i class="lg-dot ${cls}"></i>${label}</span>`).join('')}
  </div>`
}

export function renderCalendar(root) {
  const ym = state.ym
  const settings = state.settings
  const map = getHolidayMap()
  const summary = calcMonth(ym, state.days, settings, map)
  const today = todayStr()
  const grid = monthGrid(ym, settings.weekStart)
  const prefix = ym + '-'
  const weekStart = settings.weekStart
  const heads = Array.from({ length: 7 }, (_, i) => WEEK_CN[(i + weekStart) % 7])
  const hasAny = Object.keys(state.days).some((d) => d.startsWith(prefix))
  const t = summary.totals

  root.innerHTML = `
    <div class="home-head">
      <div class="brand">工时记</div>
      <div class="month-nav">
        <button class="icon-btn plain" data-nav="-1" aria-label="上个月">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <h1 class="month-title">${monthLabel(ym)}</h1>
        <button class="icon-btn plain" data-nav="1" aria-label="下个月">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
        </button>
        <button class="today-chip" data-today>今天</button>
      </div>
    </div>

    <div class="month-glance">
      <div class="glance-left">
        <span class="glance-label">本月加班费</span>
        <span class="pay-amount">¥${fmtMoney(summary.pay)}</span>
      </div>
      <button class="glance-link" data-stats>统计 <span aria-hidden="true">›</span></button>
    </div>
    <div class="month-meta">出勤 ${t.workDays} 天 · 加班加点 ${fmtH(summary.otTotal)}h</div>

    <div class="cal-card">
      <div class="cal-head">
        ${heads.map((h, i) => `<span class="${(i + weekStart) % 7 === 0 || (i + weekStart) % 7 === 6 ? 'we' : ''}">${h}</span>`).join('')}
      </div>
      <div class="cal-grid">
        ${grid.map((d) => cellHtml(d, d.startsWith(prefix), summary, map, today, settings)).join('')}
      </div>
      ${hasAny ? '' : '<div class="hint cal-empty">本月还没有记录，点任意日期开始</div>'}
      ${legendHtml()}
    </div>

    <div class="summary">
      <div class="summary-top">
        <div>
          <div class="t">本月汇总</div>
          <div class="s">${monthLabel(ym)}</div>
        </div>
      </div>
      <div class="summary-grid">
        <div class="si"><span class="k">出勤</span><span class="v">${t.workDays} 天</span></div>
        <div class="si"><span class="k">缺勤</span><span class="v">${fmtDays(t.absentDays)} 天</span></div>
        <div class="si"><span class="k">加班</span><span class="v">${fmtH(t.ot2 + t.ot3)} h</span></div>
        <div class="si"><span class="k">加点</span><span class="v">${fmtH(t.ot15)} h</span></div>
        <div class="si"><span class="k">总工时</span><span class="v">${fmtH(summary.otTotal)} h</span></div>
        <div class="si"><span class="k">抵缺勤后工时</span><span class="v">${signedH(summary.ledger)} h</span></div>
        <div class="si wide"><span class="k">请假</span><span class="v">${fmtDays(t.leaveDays)} 天</span></div>
      </div>
      <div class="hint summary-note">工作日休息在日历显示「休」，仍按缺勤 8h/天计入汇总。</div>
      <div class="hint" style="padding-top:6px">总工时只算加班+加点，不含正常 8 小时；抵缺勤后工时已冲减缺勤/事假/调休。</div>
      ${t.plannedDays > 0 ? `<div class="hint" style="padding-top:6px">本月排休计划 ${fmtDays(t.plannedDays)} 天（未计入汇总）</div>` : ''}
    </div>
  `

  root.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => setYm(addMonths(state.ym, Number(btn.dataset.nav))))
  })
  const todayBtn = root.querySelector('[data-today]')
  if (todayBtn) todayBtn.addEventListener('click', () => setYm(today.slice(0, 7)))
  root.querySelectorAll('[data-stats]').forEach((btn) => {
    btn.addEventListener('click', () => setTab('stats'))
  })

  root.querySelectorAll('.cell[data-date]').forEach((btn) => {
    const date = btn.dataset.date
    if (!date.startsWith(prefix)) return
    btn.addEventListener('click', () => openDaySheet(date))
  })
}
