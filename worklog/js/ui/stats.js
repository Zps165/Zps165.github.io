import { state, setYm, getHolidayMap } from '../store.js'
import { addMonths, monthLabel, todayStr, weekdayCN } from '../date.js'
import { calcMonth, calcToRow } from '../calc.js'
import { esc, fmtDays, fmtH, fmtMoney, signedH, download } from './dom.js'

function csvOf(summary, settings) {
  const header = ['日期', '星期', '日期类型', '状态', '班次', '开始', '结束', '休息(分)', '计薪(h)', '加点(h)', '加班(h)', '缺勤/请假(天)', '金额(元)', '备注']
  const rows = summary.list
    .filter((c) => c.status !== 'empty')
    .map((c) => {
      const r = calcToRow(c, settings)
      return [r[0], weekdayCN(c.date), ...r.slice(1)]
    })
  const body = [header, ...rows]
    .map((r) => r.map((cell) => `"${String(cell == null ? '' : cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  return '\ufeff' + body
}

export function renderStats(root) {
  const ym = state.ym
  const settings = state.settings
  const map = getHolidayMap()
  const s = calcMonth(ym, state.days, settings, map)
  const t = s.totals
  const today = todayStr()

  const byType = {
    restday: { days: 0, hours: 0 },
    statutory: { days: 0, hours: 0 },
  }
  for (const c of s.list) {
    if (c.status === 'work' && c.dayType !== 'workday') {
      byType[c.dayType].days++
      byType[c.dayType].hours += c.hours
    }
  }
  const ot15Days = s.list.filter((c) => c.status === 'work' && c.ot15 > 0).length

  const maxH = Math.max(8, ...s.list.map((c) => (c.status === 'work' ? c.hours : 0)))
  const bars = s.list
    .map((c) => {
      const h = c.status === 'work' ? c.hours : 0
      const pct = h > 0 ? Math.max(6, Math.min(100, (h / maxH) * 100)) : 2
      const cls = c.dayType === 'restday' ? 'rest' : c.dayType === 'statutory' ? 'statutory' : ''
      return `<div class="bar ${cls} ${h > 0 ? '' : 'zero'}" style="height:${pct}%" title="${esc(c.date)} ${h > 0 ? fmtH(h) + 'h' : ''}"></div>`
    })
    .join('')

  const leaveParts = []
  if (t.annualDays) leaveParts.push(`年假 ${fmtDays(t.annualDays)} 天`)
  if (t.sickDays) leaveParts.push(`病假 ${fmtDays(t.sickDays)} 天`)
  if (t.personalDays) leaveParts.push(`事假 ${fmtDays(t.personalDays)} 天`)
  if (t.compDays) leaveParts.push(`调休 ${fmtDays(t.compDays)} 天`)

  const m = settings.multipliers
  const ringParts = [
    { cls: 'statutory', label: '3× 法定', hours: t.ot3, pay: s.rate * m.ot3 * t.ot3, days: byType.statutory.days },
    { cls: 'rest', label: '2× 休息日', hours: s.ot2e, pay: s.rate * m.ot2 * s.ot2e, days: byType.restday.days },
    { cls: 'day', label: '1.5× 加点', hours: s.ot15e, pay: s.rate * m.ot15 * s.ot15e, days: ot15Days },
  ]
  const ringTotal = ringParts.reduce((sum, p) => sum + p.hours, 0)
  const p3 = ringTotal > 0 ? (t.ot3 / ringTotal) * 100 : 0
  const p2 = ringTotal > 0 ? (s.ot2e / ringTotal) * 100 : 0
  const ringA = p3
  const ringB = p3 + p2
  const ringEmpty = ringTotal <= 0

  root.innerHTML = `
    <div class="page-head">
      <button class="icon-btn plain" data-nav="-1" aria-label="上个月">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <div style="text-align:center">
        <div class="page-title">${monthLabel(ym)}</div>
        <div class="page-sub">加班费与工时</div>
      </div>
      <div style="display:flex;gap:4px">
        <button class="icon-btn plain" data-today style="font-size:13px">今天</button>
        <button class="icon-btn plain" data-nav="1" aria-label="下个月">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>

    <div class="hero">
      <div class="label">本月加班费（净）</div>
      <div class="big">¥${fmtMoney(s.pay)}</div>
      <div class="sub">时薪 ¥${fmtMoney(s.rate)} · 出勤 ${t.workDays} 天 · 加班加点 ${fmtH(s.otTotal)} h</div>
    </div>

    <div class="card ring-card">
      <div class="ring-head">
        <span class="t">计薪加班构成</span>
        <span class="s">${fmtH(ringTotal)} h · ¥${fmtMoney(s.otPay)}</span>
      </div>
      <div class="ring-wrap">
        <div class="ring ${ringEmpty ? 'empty' : ''}" style="--a:${ringA}%;--b:${ringB}%">
          <div class="ring-hole">
            <b>${fmtH(ringTotal)}</b>
            <span>小时</span>
          </div>
        </div>
        <div class="ring-legend">
          ${ringParts.map((p) => `<div class="rl-row ${p.hours > 0 ? '' : 'zero'}">
            <i class="rl-dot ${p.cls}"></i>
            <span class="rl-label">${p.label}</span>
            <span class="rl-h">${fmtH(p.hours)}h</span>
            <span class="rl-pay">¥${fmtMoney(p.pay)}</span>
          </div>`).join('')}
        </div>
      </div>
      <div class="hint ring-hint">2× 与 1.5× 已按缺勤/事假/调休抵扣后的计薪工时计算；3× 不参与抵扣。</div>
    </div>

    <div class="card formula-card">
      <div class="formula-line">
        <span>抵缺勤后工时 =</span>
        <b>${fmtH(s.otTotal)}</b><span>加班+加点</span>
        <span class="op">−</span>
        <b>${fmtH(s.offsetHours)}</b><span>缺勤/事假/调休</span>
      </div>
      <div class="formula-total">= <b>${signedH(s.ledger)} h</b></div>
      <div class="hint">缺勤按 8h/天，先冲减休息日加班（2×），再冲减加点（1.5×）；法定 3× 工时不参与抵扣。</div>
    </div>

    <div class="card">
      <div class="rows">
        <div class="row"><span class="l">出勤</span><span class="r">${t.workDays} 天</span></div>
        <div class="row"><span class="l">缺勤</span><span class="r">${fmtDays(t.absentDays)} 天 · 冲减 ${fmtH(8 * t.absentDays)} h</span></div>
        <div class="row"><span class="l">加班（2×）</span><span class="r">${byType.restday.days} 天 · ${fmtH(t.ot2)} h</span></div>
        <div class="row"><span class="l">加班（3×）</span><span class="r">${byType.statutory.days} 天 · ${fmtH(t.ot3)} h</span></div>
        <div class="row"><span class="l">加点（1.5×）</span><span class="r">${ot15Days} 天 · ${fmtH(t.ot15)} h</span></div>
        <div class="row"><span class="l">总工时（不含正常 8h）</span><span class="r">${fmtH(s.otTotal)} h</span></div>
        <div class="row"><span class="l">抵缺勤后工时</span><span class="r">${signedH(s.ledger)} h</span></div>
        <div class="row"><span class="l">请假</span><span class="r">${fmtDays(t.leaveDays)} 天${leaveParts.length ? ' · ' + leaveParts.join(' / ') : ''}</span></div>
        ${s.sickPay > 0 ? `<div class="row"><span class="l">病假扣款</span><span class="r" style="color:var(--absent)">-¥${fmtMoney(s.sickPay)}</span></div>` : ''}
        <div class="row"><span class="l">未填</span><span class="r">${t.emptyDays} 天</span></div>
      </div>
    </div>

    <div class="card">
      <div class="summary-top" style="margin-bottom:6px">
        <span class="t" style="font-size:12px;color:var(--muted)">每日工时（含正常 8h）</span>
        <span class="s">最高 ${fmtH(maxH)}h</span>
      </div>
      <div class="chart">${bars}</div>
      <div class="chart-legend">
        <span><i class="lg-dot day"></i>工作日</span>
        <span><i class="lg-dot rest"></i>休息日</span>
        <span><i class="lg-dot statutory"></i>法定</span>
      </div>
    </div>

    <div class="export-wrap">
      <button class="btn block" data-export>导出本月 CSV</button>
    </div>
  `

  root.querySelectorAll('[data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => setYm(addMonths(state.ym, Number(btn.dataset.nav))))
  })
  const todayBtn = root.querySelector('[data-today]')
  if (todayBtn) todayBtn.addEventListener('click', () => setYm(today.slice(0, 7)))

  const exportBtn = root.querySelector('[data-export]')
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      download(`工时记-${ym}.csv`, csvOf(s, settings), 'text/csv')
    })
  }
}
