import { state, openDay, closeDay, saveDay, deleteDay, getHolidayMap, toast } from '../store.js'
import { calcDay, dayAmount, resolveDayType, spanMinutes, effectiveRate, LEAVE_LABEL } from '../calc.js'
import { dateLabel, isWeekend, todayStr } from '../date.js'
import { esc, fmtDays, fmtH, fmtMoney } from './dom.js'
import { openSheet, updateSheet, closeSheet } from './sheet.js'

const TYPE_LABEL = { workday: '工作日', restday: '休息日', statutory: '法定节假日' }
const LEAVE_ORDER = ['annual', 'sick', 'personal', 'comp']
const LEAVE_HINT = {
  annual: '带薪年假：不扣款、不计缺勤',
  sick: '病假：按病假工资比例扣减，不冲减加班',
  personal: '事假：无薪，按缺勤处理（优先冲减加班）',
  comp: '调休：从加班余额中扣减，不扣钱',
}

export function openDaySheet(date) {
  const rec = state.days[date]
  const settings = state.settings
  const defShift =
    settings.shifts.find((s) => s.id === settings.defaultShiftId) || settings.shifts[0]
  const draft = rec
    ? { ...rec }
    : {
        date,
        status: 'work',
        shiftId: defShift.id,
        start: defShift.start,
        end: defShift.end,
        breakMinutes: defShift.breakMinutes,
        days: 1,
        leaveType: 'personal',
        note: '',
        updatedAt: Date.now(),
      }

  openDay(date)
  mount(date, draft, rec)
}

function mount(date, draft, existed) {
  const overlay = document.getElementById('overlay')
  const settings = state.settings
  let preview = null

  const refreshPreview = () => {
    if (!preview) return
    preview.innerHTML = previewHtml(draft, date, settings)
  }

  openSheet(sheetHtml(date, draft, existed, settings), closeDay)
  preview = overlay.querySelector('[data-preview]')
  refreshPreview()

  const paint = () => {
    updateSheet(sheetHtml(date, draft, existed, settings))
    preview = overlay.querySelector('[data-preview]')
    refreshPreview()
  }

  overlay.onclick = (e) => {
    const target = e.target.closest('[data-act]')
    if (!target) return
    const act = target.dataset.act
    if (act === 'close') {
      closeSheet()
      return
    }
    if (act === 'type') {
      const v = target.dataset.value
      draft.dayTypeOverride = v === 'auto' ? undefined : v
      paint()
      return
    }
    if (act === 'status') {
      draft.status = target.dataset.value
      if (draft.status === 'leave') {
        draft.leaveType = draft.leaveType || 'personal'
        draft.days = draft.days || 1
      }
      if (draft.status === 'absent') {
        draft.days = draft.days || 1
      }
      if (draft.status === 'rest') {
        draft.days = draft.days || 1
      }
      if (draft.status === 'planned') {
        draft.days = 1
      }
      if (draft.status === 'work') {
        const shift =
          settings.shifts.find((s) => s.id === draft.shiftId) || settings.shifts[0]
        draft.shiftId = shift.id
        draft.start = draft.start || shift.start
        draft.end = draft.end || shift.end
        draft.breakMinutes = draft.breakMinutes != null ? draft.breakMinutes : shift.breakMinutes
      }
      paint()
      return
    }
    if (act === 'shift') {
      const shift = settings.shifts.find((s) => s.id === target.dataset.id)
      if (!shift) return
      draft.shiftId = shift.id
      draft.start = shift.start
      draft.end = shift.end
      draft.breakMinutes = shift.breakMinutes
      paint()
      return
    }
    if (act === 'leave') {
      draft.leaveType = target.dataset.value
      paint()
      return
    }
    if (act === 'days') {
      draft.days = Number(target.dataset.value)
      paint()
      return
    }
    if (act === 'brk') {
      const span = spanMinutes(draft.start, draft.end)
      const delta = Number(target.dataset.delta)
      const max = Math.max(0, span - 15)
      draft.breakMinutes = Math.max(0, Math.min(max, (Number(draft.breakMinutes) || 0) + delta))
      paint()
      return
    }
    if (act === 'save') {
      save()
      return
    }
    if (act === 'delete') {
      deleteDay(date)
      toast('已删除该日记录')
      closeSheet()
    }
  }

  overlay.onchange = (e) => {
    const field = e.target.dataset.field
    if (!field) return
    if (field === 'start' || field === 'end') {
      draft[field] = e.target.value
      refreshPreview()
    } else if (field === 'breakMinutes') {
      draft.breakMinutes = Math.max(0, Number(e.target.value) || 0)
      refreshPreview()
    }
  }

  overlay.oninput = (e) => {
    if (e.target.dataset.field === 'note') {
      draft.note = e.target.value
    }
  }

  const save = () => {
    if (draft.status === 'planned' && date <= todayStr() && !(existed && existed.status === 'planned')) {
      toast('只能排未来日期')
      return
    }
    if (draft.status === 'planned' && existed && existed.status !== 'planned') {
      if (!confirm('该日已有记录，改为排休会清除，继续？')) return
    }
    if (draft.status === 'work') {
      const span = spanMinutes(draft.start, draft.end)
      const brk = Number(draft.breakMinutes) || 0
      if (span <= 0) {
        toast('班次时间无效')
        return
      }
      if (brk >= span) {
        toast('休息时长不能大于等于班次时长')
        return
      }
    }
    const rec = {
      date,
      status: draft.status,
      updatedAt: Date.now(),
    }
    if (draft.dayTypeOverride) rec.dayTypeOverride = draft.dayTypeOverride
    if (draft.note && draft.note.trim()) rec.note = draft.note.trim().slice(0, 80)
    if (draft.status === 'planned') {
      rec.days = 1
      saveDay(rec)
      toast('已设为排休')
      closeSheet()
      return
    }
    if (draft.status === 'work') {
      rec.shiftId = draft.shiftId
      rec.start = draft.start
      rec.end = draft.end
      rec.breakMinutes = Number(draft.breakMinutes) || 0
    }
    if (draft.status === 'absent') rec.days = Number(draft.days) || 1
    if (draft.status === 'rest') rec.days = Number(draft.days) || 1
    if (draft.status === 'leave') {
      rec.leaveType = draft.leaveType || 'personal'
      rec.days = Number(draft.days) || 1
    }
    saveDay(rec)
    toast('已保存')
    closeSheet()
  }

  overlay.dataset.sheet = 'day'
}

function sheetHtml(date, draft, existed, settings) {
  const map = getHolidayMap()
  const autoType = resolveDayType(date, { dayTypeOverride: undefined }, map)
  const h = map.get(date)
  const source = draft.dayTypeOverride
    ? '手动指定'
    : h
      ? h.name || '节假日'
      : isWeekend(date)
        ? '按周末'
        : '按日历'
  const effectiveType = resolveDayType(date, draft, map)
  const typeLabel = TYPE_LABEL[effectiveType]
  const plannedAllowed = date > todayStr() || draft.status === 'planned'
  const statuses = [
    ['work', '上班'],
    ['rest', '休息'],
    ['leave', '请假'],
  ]
  if (plannedAllowed) statuses.push(['planned', '排休'])
  if (draft.status === 'absent') statuses.push(['absent', '缺勤'])
  const statusIcon = { work: '班', rest: '休', leave: '假', planned: '排', absent: '缺' }
  const typeCls =
    effectiveType === 'restday' ? 'rest' : effectiveType === 'statutory' ? 'sun' : ''

  return `<div class="sheet">
    <div class="grabber" aria-hidden="true"></div>
    <div class="sheet-head">
      <div class="sheet-title-wrap">
        <div class="sheet-title">${esc(dateLabel(date))}</div>
        <div class="sheet-sub"><span class="tag ${typeCls}">${typeLabel}</span><span>${esc(source)}</span></div>
      </div>
      <button class="icon-btn plain" data-act="close" aria-label="关闭">✕</button>
    </div>
    <div class="sheet-body">
      <div class="sheet-section">
        <div class="sheet-label">日期类型</div>
        <div class="chips type-chips">
          <button class="chip ${!draft.dayTypeOverride ? 'on' : ''}" data-act="type" data-value="auto">自动（${TYPE_LABEL[autoType]}）</button>
          ${['workday', 'restday', 'statutory'].map((t) => `<button class="chip ${draft.dayTypeOverride === t ? 'on' : ''}" data-act="type" data-value="${t}">${TYPE_LABEL[t]}</button>`).join('')}
        </div>
      </div>

      <div class="sheet-section">
        <div class="sheet-label">状态</div>
        <div class="status-grid">
          ${statuses
            .map(
              ([v, l]) => `<button class="status-btn ${draft.status === v ? 'on' : ''}" data-act="status" data-value="${v}">
                <span class="status-ico">${statusIcon[v] || '·'}</span>
                <span class="status-txt">${l}</span>
              </button>`,
            )
            .join('')}
        </div>
      </div>

      ${draft.status === 'work' ? workHtml(draft, settings) : ''}
      ${draft.status === 'leave' ? leaveHtml(draft) : ''}
      ${draft.status === 'absent' ? absentHtml(draft) : ''}
      ${draft.status === 'rest' ? restHtml(draft, effectiveType) : ''}
      ${draft.status === 'planned' ? plannedHtml(effectiveType) : ''}

      <div class="sheet-section preview-section" data-preview></div>

      <div class="sheet-section">
        <div class="sheet-label">备注</div>
        <input class="input" style="width:100%" maxlength="80" placeholder="选填，例如：换班 / 补卡" data-field="note" value="${esc(draft.note || '')}" />
      </div>
    </div>
    <div class="sheet-foot">
      ${existed ? '<button class="btn danger" data-act="delete">删除</button>' : ''}
      <button class="btn primary" data-act="save">保存</button>
    </div>
  </div>`
}

function workHtml(draft, settings) {
  const span = spanMinutes(draft.start, draft.end)
  const cross = span > 1440 || draft.end <= draft.start
  return `<div class="sheet-section">
    <div class="sheet-label">班次</div>
    <div class="shift-cards">
      ${settings.shifts
        .map(
          (s) => `<button class="shift-card ${draft.shiftId === s.id ? 'on' : ''}" data-act="shift" data-id="${esc(s.id)}">
            <i class="shift-dot ${esc(s.color)}"></i>
            <span class="shift-name">${esc(s.name)}</span>
            <span class="shift-time">${esc(s.start)}–${esc(s.end)}</span>
          </button>`,
        )
        .join('')}
    </div>
    <div class="field" style="margin-top:10px">
      <label>开始</label>
      <input type="time" data-field="start" value="${esc(draft.start || '08:00')}" />
      <label>结束</label>
      <input type="time" data-field="end" value="${esc(draft.end || '17:00')}" />
    </div>
    <div class="field">
      <label>休息</label>
      <div class="stepper">
        <button data-act="brk" data-delta="-15" aria-label="减少 15 分钟">−</button>
        <span class="val">${Number(draft.breakMinutes) || 0} 分钟</span>
        <button data-act="brk" data-delta="15" aria-label="增加 15 分钟">＋</button>
      </div>
    </div>
    ${cross ? '<div class="hint" style="padding-top:8px">结束时间不晚于开始时间，按跨天班次计算，整班计入开始日。</div>' : ''}
  </div>`
}

function leaveHtml(draft) {
  return `<div class="sheet-section">
    <div class="sheet-label">请假类型</div>
    <div class="chips">
      ${LEAVE_ORDER.map((t) => `<button class="chip ${draft.leaveType === t ? 'on' : ''}" data-act="leave" data-value="${t}">${LEAVE_LABEL[t]}</button>`).join('')}
    </div>
    <div class="hint" style="padding-top:8px">${LEAVE_HINT[draft.leaveType] || ''}</div>
    <div class="field" style="margin-top:6px">
      <label>天数</label>
      ${daysSeg(draft)}
    </div>
  </div>`
}

function absentHtml(draft) {
  return `<div class="sheet-section">
    <div class="hint">缺勤：无薪，1 天按 8 小时计，优先冲减休息日加班。</div>
    <div class="field" style="margin-top:6px">
      <label>天数</label>
      ${daysSeg(draft)}
    </div>
  </div>`
}

function plannedHtml(dayType) {
  const hint =
    dayType === 'workday'
      ? '这天是工作日，结束后转休息会按缺勤 8h/天计。'
      : '这天是休息日/法定节假日，结束后转休息不扣缺勤。'
  return `<div class="sheet-section">
    <div class="hint">${hint}</div>
    <div class="hint" style="padding-top:6px">排休当天显示「排」，日期过后自动转为「休息」；一次只排一天。</div>
  </div>`
}

function restHtml(draft, dayType) {
  if (dayType === 'workday') {
    return `<div class="sheet-section">
      <div class="hint">工作日休息 = 缺勤：按 8 小时/天扣减，并优先冲减休息日加班。若当天是公司放假，请把上面的日期类型改成「休息日」。</div>
      <div class="field" style="margin-top:6px">
        <label>缺勤天数</label>
        ${daysSeg(draft)}
      </div>
    </div>`
  }
  return `<div class="sheet-section"><div class="hint">正常休息：不计工时、不扣款、不算缺勤。</div></div>`
}

function daysSeg(draft) {
  const v = Number(draft.days) || 1
  return `<div class="seg" style="width:160px">
    ${[0.5, 1].map((d) => `<button class="${v === d ? 'on' : ''}" data-act="days" data-value="${d}">${d} 天</button>`).join('')}
  </div>`
}

function previewHtml(draft, date, settings) {
  const map = getHolidayMap()
  const c = calcDay(draft, date, settings, map)
  const rate = effectiveRate(settings)

  if (c.status === 'planned') {
    return `<div class="preview">
      <div><div class="pv">0</div><div class="pl">计薪 h</div></div>
      <div><div class="pv">0</div><div class="pl">加班 h</div></div>
      <div><div class="pv money">¥0.00</div><div class="pl">当日</div></div>
    </div>
    <div class="hint" style="text-align:center">计划中，未计入本月</div>`
  }

  if (c.status === 'work') {
    const pay = dayAmount(c, settings)
    const otLabel = c.ot15 > 0 ? '加点' : c.ot2 > 0 || c.ot3 > 0 ? '加班' : '加班'
    return `<div class="preview">
      <div><div class="pv">${fmtH(c.hours)}</div><div class="pl">计薪 h</div></div>
      <div><div class="pv">${fmtH(c.ot15 + c.ot2 + c.ot3)}</div><div class="pl">${otLabel} h</div></div>
      <div><div class="pv money">¥${fmtMoney(pay)}</div><div class="pl">当日</div></div>
    </div>
    <div class="hint" style="text-align:center">本班 ${fmtH(c.spanMinutes / 60)}h − 休息 ${c.breakMinutes} 分钟${Math.abs(c.rawHours - c.hours) > 0.001 ? ` · 取整前 ${fmtH(c.rawHours)}h` : ''}</div>`
  }

  let deduct = 0
  let note = ''
  if (c.status === 'absent') {
    deduct = rate * 8 * c.days
    note = '无薪缺勤'
  } else if (c.status === 'leave') {
    if (c.leaveType === 'sick') {
      deduct = rate * 8 * c.days * (1 - (Number(settings.sickPayRatio) || 0))
      note = `病假工资 ${Math.round((Number(settings.sickPayRatio) || 0) * 100)}%`
    } else if (c.leaveType === 'personal') {
      deduct = rate * 8 * c.days
      note = '无薪事假'
    } else if (c.leaveType === 'comp') {
      deduct = 0
      note = `冲减加班 ${fmtH(8 * c.days)}h`
    } else {
      deduct = 0
      note = '带薪年假'
    }
  } else if (c.status === 'rest') {
    if (c.absentDays > 0) {
      deduct = rate * 8 * c.days
      note = '工作日休息，按缺勤计'
    } else {
      note = '正常休息，不计薪'
    }
  }

  return `<div class="preview">
    <div><div class="pv">${fmtDays(c.days || 0)}</div><div class="pl">天</div></div>
    <div><div class="pv">${fmtH(c.days ? 8 * c.days : 0)}</div><div class="pl">标准 h</div></div>
    <div><div class="pv money">${deduct ? '-¥' + fmtMoney(deduct) : '¥0.00'}</div><div class="pl">扣款</div></div>
  </div>
  <div class="hint" style="text-align:center">${esc(note)}</div>`
}
