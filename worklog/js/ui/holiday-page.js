import {
  state,
  getHolidayMap,
  setTab,
  addHoliday,
  updateHoliday,
  deleteHoliday,
  restoreBuiltin,
  toast,
} from '../store.js'
import { HOLIDAY_YEARS, HOLIDAY_TYPE_LABEL, holidayListForYear } from '../holidays.js'
import { todayStr, yearOf } from '../date.js'
import { esc } from './dom.js'
import { openSheet, closeSheet } from './sheet.js'

let selectedYear = new Date().getFullYear()

export function renderHolidays(root) {
  const map = getHolidayMap()
  const years = new Set(HOLIDAY_YEARS)
  for (const h of map.values()) years.add(yearOf(h.date))
  years.add(new Date().getFullYear())
  const yearList = [...years].filter((y) => y >= 2020 && y <= 2100).sort()
  if (!yearList.includes(selectedYear)) selectedYear = yearList[yearList.length - 1]
  const list = holidayListForYear(map, selectedYear)

  root.innerHTML = `
    <div class="page-head">
      <button class="icon-btn plain" data-back aria-label="返回设置">‹</button>
      <div style="text-align:center">
        <div class="page-title">节假日</div>
        <div class="page-sub">${selectedYear} 年 · ${list.length} 条</div>
      </div>
      <button class="icon-btn" data-add aria-label="新增">＋</button>
    </div>

    <div class="year-tabs">
      ${yearList.map((y) => `<button class="${y === selectedYear ? 'on' : ''}" data-year="${y}">${y}</button>`).join('')}
    </div>

    <div class="card" style="padding:2px 14px">
      ${
        list.length === 0
          ? '<div class="empty">这一年还没有节假日数据<br/>点右上角「＋」添加</div>'
          : list
              .map(
                (h) => `<button class="hol-row" data-edit="${h.date}">
                  <span class="hol-date">${h.date.slice(5)}</span>
                  <span class="hol-name">${esc(h.name)}<span class="src">${h.source === 'builtin' ? '内置' : h.source === 'remote' ? '在线' : '自定义'}</span></span>
                  <span class="tag ${h.type}">${HOLIDAY_TYPE_LABEL[h.type] || h.type}</span>
                  <span style="color:var(--muted)">›</span>
                </button>`,
              )
              .join('')
      }
    </div>

    <div class="hint" style="margin:12px 4px 0;line-height:1.9">
      <b>法定 3×</b>：只有国家法定当天按 3 倍。<br/>
      <b>休息 2×</b>：长假里调休出来的非周末工作日，按 2 倍。<br/>
      <b>补班</b>：调休上班的周末，按工作日 1 倍 / 超 8h 1.5 倍。
    </div>

    <div class="section" style="margin-top:16px">
      <div class="card">
        <div class="setting-row">
          <div>
            <div class="lbl">数据版本</div>
            <div class="sub">${state.feed ? `在线 ${esc(state.feed.version)} · ${new Date(state.feed.fetchedAt).toLocaleString('zh-CN')}` : '内置 2025–2027'}</div>
          </div>
          <button class="btn sm" data-restore>恢复内置</button>
        </div>
      </div>
      <div class="hint" style="margin:8px 4px 0">自定义会覆盖同一天的内置数据；删除内置条目等于隐藏，可随时「恢复内置」。2027 年安排已按国务院通知内置。</div>
    </div>
  `

  root.querySelector('[data-back]').addEventListener('click', () => setTab('settings'))
  root.querySelector('[data-add]').addEventListener('click', () => openEditor(null))
  root.querySelectorAll('[data-year]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedYear = Number(btn.dataset.year)
      renderHolidays(root)
    })
  })
  root.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const h = map.get(btn.dataset.edit)
      if (h) openEditor(h)
    })
  })
  root.querySelector('[data-restore]').addEventListener('click', () => {
    if (!confirm('清除所有自定义和隐藏，恢复内置节假日？')) return
    restoreBuiltin()
    toast('已恢复内置数据')
  })
}

function openEditor(existing) {
  const isEdit = !!existing
  const draft = {
    date: existing ? existing.date : todayStr(),
    name: existing ? existing.name : '',
    type: existing ? existing.type : 'statutory',
  }

  const html = `<div class="sheet">
    <div class="sheet-head">
      <div>
        <div class="sheet-title">${isEdit ? '编辑节假日' : '新增节假日'}</div>
        <div class="sheet-sub">${isEdit ? '保存后覆盖同一天的内置数据' : '补录公司假期或自定义休息日'}</div>
      </div>
      <button class="icon-btn plain" data-act="close">✕</button>
    </div>
    <div class="sheet-body">
      <div class="sheet-section">
        <div class="sheet-label">日期</div>
        <input type="date" data-field="date" value="${draft.date}" style="width:100%" />
      </div>
      <div class="sheet-section">
        <div class="sheet-label">名称</div>
        <input class="input" data-field="name" maxlength="20" placeholder="例如：公司年假 / 调休" value="${esc(draft.name)}" style="width:100%" />
      </div>
      <div class="sheet-section">
        <div class="sheet-label">类型</div>
        <div class="chips">
          ${['statutory', 'rest', 'makeup']
            .map(
              (t) =>
                `<button class="chip ${draft.type === t ? 'on' : ''}" data-htype="${t}">${HOLIDAY_TYPE_LABEL[t]}</button>`,
            )
            .join('')}
        </div>
        <div class="hint" style="margin-top:8px">法定 = 3 倍；休息 = 2 倍；补班 = 按工作日。</div>
      </div>
    </div>
    <div class="sheet-foot">
      ${isEdit ? '<button class="btn danger" data-act="del">删除</button>' : ''}
      <button class="btn primary" data-act="save">保存</button>
    </div>
  </div>`

  openSheet(html)
  const overlay = document.getElementById('overlay')
  overlay.onclick = (e) => {
    const chip = e.target.closest('[data-htype]')
    if (chip) {
      overlay.querySelectorAll('[data-htype]').forEach((b) => b.classList.toggle('on', b === chip))
      draft.type = chip.dataset.htype
      return
    }
    const act = e.target.closest('[data-act]')
    if (!act) return
    if (act.dataset.act === 'close') {
      closeSheet()
      return
    }
    if (act.dataset.act === 'del') {
      if (!confirm('删除这条节假日？内置条目会被隐藏。')) return
      deleteHoliday(draft.date)
      toast('已删除')
      closeSheet()
      return
    }
    if (act.dataset.act === 'save') {
      const dateEl = overlay.querySelector('[data-field="date"]')
      const nameEl = overlay.querySelector('[data-field="name"]')
      const date = dateEl.value
      const name = nameEl.value.trim()
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return toast('日期格式不正确')
      if (!name) return toast('请填写名称')
      const payload = { date, name: name.slice(0, 20), type: draft.type }
      if (isEdit) updateHoliday(existing.date, payload)
      else addHoliday(payload)
      toast('已保存')
      closeSheet()
    }
  }
  overlay.onchange = null
  overlay.oninput = null
}
