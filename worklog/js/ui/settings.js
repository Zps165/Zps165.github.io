import {
  state,
  patchSettings,
  patchMultipliers,
  addShift,
  updateShift,
  deleteShift,
  clearRecords,
  replaceDB,
  setFeed,
  setTab,
  toast,
} from '../store.js'
import { exportPayload, parseImport } from '../storage.js'
import { HOLIDAY_VERSION } from '../holidays.js'
import { effectiveRate } from '../calc.js'
import { fmtMoney, download, readTextFile } from './dom.js'
import { openSheet, closeSheet } from './sheet.js'
import { canInstall, promptInstall, isStandalone, isSecureContextOk } from '../pwa.js'
import { fetchHolidayFeed } from '../feed.js'

const APP_VERSION = '1.2.0'

export function renderSettings(root) {
  const s = state.settings
  const rate = effectiveRate(s)
  const standalone = isStandalone()
  const secure = isSecureContextOk()
  const installable = canInstall()

  let installText
  if (standalone) installText = '已安装，独立窗口运行'
  else if (!secure) installText = '局域网 HTTP：浏览器不开放安装与离线缓存'
  else if (installable) installText = '可一键安装到主屏'
  else installText = '用浏览器菜单「添加到主屏幕」'

  root.innerHTML = `
    <div class="page-head">
      <div>
        <h1 class="page-title">设置</h1>
        <div class="page-sub">当前时薪 ¥${fmtMoney(rate)} / 小时</div>
      </div>
    </div>

    <section class="section">
      <h3>薪资</h3>
      <div class="card">
        <div class="setting-row">
          <span class="lbl">计薪方式</span>
          <div class="seg" style="width:150px">
            <button class="${s.rateMode === 'hourly' ? 'on' : ''}" data-act="rateMode" data-value="hourly">时薪</button>
            <button class="${s.rateMode === 'monthly' ? 'on' : ''}" data-act="rateMode" data-value="monthly">月薪</button>
          </div>
        </div>
        ${
          s.rateMode === 'hourly'
            ? `<div class="setting-row"><span class="lbl">时薪（元）</span><input type="number" min="0" step="0.01" data-num="hourlyRate" value="${Number(s.hourlyRate) || 0}" /></div>`
            : `<div class="setting-row"><span class="lbl">月薪（元）</span><input type="number" min="0" step="100" data-num="monthlySalary" value="${Number(s.monthlySalary) || 0}" /></div>
               <div class="setting-row"><span class="lbl">折算时薪</span><span class="tnum">¥${fmtMoney(rate)}</span></div>`
        }
        <div class="setting-row">
          <span class="lbl" style="color:var(--muted);font-size:12px">换算口径</span>
          <span class="hint" style="margin:0">月薪 ÷ 21.75 ÷ 8</span>
        </div>
      </div>
    </section>

    <section class="section">
      <h3>班次</h3>
      <div class="card">
        ${s.shifts.map((sh) => shiftRow(sh, s)).join('')}
        <div class="setting-row" style="justify-content:center">
          <button class="btn sm" data-act="addShift">＋ 新增班次</button>
        </div>
      </div>
      <div class="hint" style="margin:8px 4px 0">结束时间早于开始时间会自动按跨天计算，例如 20:00 → 05:00。</div>
    </section>

    <section class="section">
      <h3>计费规则</h3>
      <div class="card">
        <div class="setting-row">
          <span class="lbl">工时取整</span>
          <select data-select="rounding">
            ${[
              ['none', '不取整'],
              ['15', '15 分钟'],
              ['30', '30 分钟'],
              ['60', '1 小时'],
            ]
              .map(([v, l]) => `<option value="${v}" ${s.rounding === v ? 'selected' : ''}>${l}</option>`)
              .join('')}
          </select>
        </div>
        <div class="setting-row"><span class="lbl">加点倍率（工作日超 8h）</span><input type="number" min="0" step="0.1" data-mult="ot15" value="${s.multipliers.ot15}" /></div>
        <div class="setting-row"><span class="lbl">休息日倍率</span><input type="number" min="0" step="0.1" data-mult="ot2" value="${s.multipliers.ot2}" /></div>
        <div class="setting-row"><span class="lbl">法定节假日倍率</span><input type="number" min="0" step="0.1" data-mult="ot3" value="${s.multipliers.ot3}" /></div>
        <div class="setting-row"><span class="lbl">病假工资比例（%）</span><input type="number" min="0" max="100" step="5" data-num="sickPct" value="${Math.round((Number(s.sickPayRatio) || 0) * 100)}" /></div>
      </div>
      <div class="hint" style="margin:8px 4px 0">缺勤/事假/调休先冲减休息日加班，再冲减加点；法定节假日 3× 工时不参与抵扣。</div>
    </section>

    <section class="section">
      <h3>节假日</h3>
      <div class="card">
        <button class="setting-row" style="width:100%;background:transparent;border-left:0;border-right:0;border-top:0;text-align:left;color:var(--text)" data-act="holidays">
          <span class="lbl">节假日管理</span>
          <span class="right"><span class="hint" style="margin:0">内置 ${HOLIDAY_VERSION}${state.feed ? ' · 在线 ' + state.feed.version : ''}</span><span class="chev" style="color:var(--muted)">›</span></span>
        </button>
        <div class="setting-row" style="display:block">
          <div class="lbl" style="margin-bottom:6px">在线更新地址（JSON，选填）</div>
          <input class="input" style="width:100%" data-text="holidayFeedUrl" placeholder="https://…/holidays.json" value="${escapeAttr(s.holidayFeedUrl || '')}" />
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:8px">
            <label style="display:flex;align-items:center;gap:7px;font-size:12px;color:var(--muted)">
              <input type="checkbox" data-check="autoCheckHoliday" ${s.autoCheckHoliday ? 'checked' : ''} /> 启动时自动检查
            </label>
            <button class="btn sm" data-act="checkFeed">检查更新</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <h3>显示</h3>
      <div class="card">
        <div class="setting-row">
          <span class="lbl">主题</span>
          <select data-select="theme">
            <option value="system" ${s.theme === 'system' ? 'selected' : ''}>跟随系统</option>
            <option value="light" ${s.theme === 'light' ? 'selected' : ''}>浅色</option>
            <option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>深色</option>
          </select>
        </div>
        <div class="setting-row">
          <span class="lbl">每周起始</span>
          <select data-select="weekStart">
            <option value="1" ${s.weekStart === 1 ? 'selected' : ''}>周一</option>
            <option value="0" ${s.weekStart === 0 ? 'selected' : ''}>周日</option>
          </select>
        </div>
      </div>
    </section>

    <section class="section">
      <h3>数据</h3>
      <div class="card">
        <div class="setting-row"><span class="lbl">导出备份（JSON）</span><button class="btn sm" data-act="exportJson">导出</button></div>
        <div class="setting-row"><span class="lbl">导入备份</span><button class="btn sm" data-act="importJson">选择文件</button></div>
        <div class="setting-row"><span class="lbl" style="color:var(--absent)">清空所有记录</span><button class="btn sm danger" data-act="clearAll">清空</button></div>
        <input type="file" id="importFile" accept="application/json,.json" class="hidden" />
      </div>
      <div class="hint" style="margin:8px 4px 0">数据只保存在本机浏览器。换手机、清缓存前请先导出备份。</div>
    </section>

    <section class="section">
      <h3>安装</h3>
      <div class="card">
        <div class="setting-row">
          <div>
            <div class="lbl">${installText}</div>
            <div class="sub">${standalone ? '可离线使用' : secure ? '需 HTTPS 或 localhost' : '同一个 Wi-Fi 可直接访问，但安装需 HTTPS'}</div>
          </div>
          <button class="btn sm ${secure && !standalone ? 'primary' : ''}" data-act="install">${standalone ? '已安装' : '安装'}</button>
        </div>
      </div>
      <div class="hint" style="margin:8px 4px 0">局域网 http:// 访问时页面可以正常用，但浏览器不允许注册离线缓存；把同一份文件放到任意 HTTPS 静态站点即可安装。</div>
    </section>

    <section class="section">
      <h3>关于</h3>
      <div class="card">
        <div class="setting-row"><span class="lbl">版本</span><span class="tnum">${APP_VERSION}</span></div>
        <div class="setting-row"><span class="lbl">抵缺勤后工时</span><span class="hint" style="margin:0">加班 + 加点 − 缺勤×8</span></div>
        <div class="setting-row"><span class="lbl">加班费</span><span class="hint" style="margin:0">1.5×加点 + 2×休息日 + 3×法定</span></div>
      </div>
    </section>
  `

  root.onclick = (e) => {
    const t = e.target.closest('[data-act]')
    if (!t) return
    const act = t.dataset.act
    if (act === 'rateMode') {
      patchSettings({ rateMode: t.dataset.value })
    } else if (act === 'addShift') {
      addShift({
        id: 's' + Date.now().toString(36),
        name: '自定义',
        start: '09:00',
        end: '18:00',
        breakMinutes: 60,
        color: 'other',
      })
    } else if (act === 'delShift') {
      const id = t.dataset.id
      if (state.settings.shifts.length <= 1) return toast('至少保留一个班次')
      if (!confirm('删除这个班次？已记录的日期不受影响。')) return
      deleteShift(id)
    } else if (act === 'defaultShift') {
      patchSettings({ defaultShiftId: t.dataset.id })
      toast('已设为默认班次')
    } else if (act === 'holidays') {
      setTab('holidays')
    } else if (act === 'exportJson') {
      state.meta.lastExportAt = Date.now()
      download(`工时记备份-${new Date().toISOString().slice(0, 10)}.json`, exportPayload(state), 'application/json')
      toast('已导出备份')
    } else if (act === 'importJson') {
      const input = root.querySelector('#importFile')
      if (input) input.click()
    } else if (act === 'clearAll') {
      if (!confirm('确定清空所有工时记录？设置会保留，此操作不可恢复。')) return
      clearRecords()
      toast('已清空记录')
    } else if (act === 'install') {
      handleInstall()
    } else if (act === 'checkFeed') {
      const input = root.querySelector('[data-text="holidayFeedUrl"]')
      const url = String((input && input.value) || state.settings.holidayFeedUrl || '').trim()
      if (!url) return toast('先填一个 JSON 地址')
      if (url !== state.settings.holidayFeedUrl) patchSettings({ holidayFeedUrl: url })
      fetchHolidayFeed(url)
        .then((feed) => {
          setFeed(feed)
          toast(`节假日已更新到 ${feed.version}`)
        })
        .catch((err) => toast('检查失败：' + err.message))
    }
  }

  root.onchange = (e) => {
    const el = e.target
    if (el.id === 'importFile') {
      const file = el.files && el.files[0]
      if (!file) return
      readTextFile(file)
        .then((text) => {
          const db = parseImport(text)
          if (!confirm('导入会覆盖当前全部数据，确定继续？')) return
          replaceDB(db)
          toast('导入成功')
        })
        .catch((err) => toast('导入失败：' + err.message))
      el.value = ''
      return
    }
    if (el.dataset.num) {
      const key = el.dataset.num
      let v = Number(el.value)
      if (!Number.isFinite(v)) v = 0
      if (key === 'sickPct') {
        patchSettings({ sickPayRatio: Math.max(0, Math.min(100, v)) / 100 })
      } else if (key === 'hourlyRate') {
        patchSettings({ hourlyRate: Math.max(0, v) })
      } else if (key === 'monthlySalary') {
        patchSettings({ monthlySalary: Math.max(0, v) })
      }
      return
    }
    if (el.dataset.mult) {
      let v = Number(el.value)
      if (!Number.isFinite(v) || v < 0) v = 0
      patchMultipliers({ [el.dataset.mult]: v })
      return
    }
    if (el.dataset.select) {
      const key = el.dataset.select
      if (key === 'weekStart') patchSettings({ weekStart: Number(el.value) === 0 ? 0 : 1 })
      else patchSettings({ [key]: el.value })
      return
    }
    if (el.dataset.check) {
      patchSettings({ [el.dataset.check]: el.checked })
      return
    }
    if (el.dataset.text) {
      patchSettings({ [el.dataset.text]: el.value.trim() })
      return
    }
    if (el.dataset.shift) {
      const id = el.dataset.shift
      const field = el.dataset.sfield
      const patch = {}
      if (field === 'breakMinutes') patch[field] = Math.max(0, Math.min(1440, Number(el.value) || 0))
      else if (field === 'name') patch[field] = String(el.value || '').trim().slice(0, 6) || '班次'
      else patch[field] = el.value
      updateShift(id, patch)
    }
  }
}

function shiftRow(sh, s) {
  const isDefault = s.defaultShiftId === sh.id
  return `<div class="shift-row">
    <div class="shift-top">
      <div class="nm"><input class="input" maxlength="6" data-shift="${escapeAttr(sh.id)}" data-sfield="name" value="${escapeAttr(sh.name)}" /></div>
      <button class="icon-btn ${isDefault ? '' : 'plain'}" data-act="defaultShift" data-id="${escapeAttr(sh.id)}" title="${isDefault ? '默认班次' : '设为默认'}">${isDefault ? '★' : '☆'}</button>
      <button class="icon-btn plain" data-act="delShift" data-id="${escapeAttr(sh.id)}" title="删除">✕</button>
    </div>
    <div class="shift-times">
      <input type="time" data-shift="${escapeAttr(sh.id)}" data-sfield="start" value="${escapeAttr(sh.start)}" />
      <span class="sep">→</span>
      <input type="time" data-shift="${escapeAttr(sh.id)}" data-sfield="end" value="${escapeAttr(sh.end)}" />
      <input class="input brk" type="number" min="0" max="1440" step="15" data-shift="${escapeAttr(sh.id)}" data-sfield="breakMinutes" value="${Number(sh.breakMinutes) || 0}" />
      <span class="hint" style="margin:0">分钟</span>
    </div>
  </div>`
}

function escapeAttr(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
}

function handleInstall() {
  if (isStandalone()) return toast('已经安装到主屏了')
  if (!isSecureContextOk()) {
    openInstallHelp()
    return
  }
  promptInstall().then((ok) => {
    if (ok) toast('已添加到主屏')
    else openInstallHelp()
  })
}

function openInstallHelp() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const secure = isSecureContextOk()
  const html = `<div class="sheet">
    <div class="sheet-head">
      <div><div class="sheet-title">安装到手机主屏</div><div class="sheet-sub">像 App 一样打开，支持离线</div></div>
      <button class="icon-btn plain" data-act="close">✕</button>
    </div>
    <div class="sheet-body">
      ${
        !secure
          ? `<div class="card" style="border-color:color-mix(in srgb, var(--statutory) 40%, var(--line))">
              <b>当前是局域网 HTTP</b>
              <div class="hint" style="margin-top:6px">浏览器只在 HTTPS 或 localhost 下允许安装与离线缓存。你仍然可以直接用手机浏览器打开本页记录工时；要安装，把同一份文件放到任意 HTTPS 静态站点即可。</div>
            </div>`
          : ''
      }
      <div class="sheet-section">
        <div class="sheet-label">iPhone / iPad（Safari）</div>
        <div class="hint">1. 用 Safari 打开本页<br/>2. 点底部「分享」<br/>3. 选「添加到主屏幕」<br/>4. 确认「添加」</div>
      </div>
      <div class="sheet-section">
        <div class="sheet-label">Android（Chrome / Edge）</div>
        <div class="hint">1. 用 Chrome 打开本页<br/>2. 点右上角「⋮」<br/>3. 选「安装应用」或「添加到主屏幕」</div>
      </div>
      <div class="sheet-section">
        <div class="sheet-label">电脑</div>
        <div class="hint">地址栏右侧出现安装图标时，点一下即可安装。</div>
      </div>
    </div>
    <div class="sheet-foot"><button class="btn primary" data-act="close">知道了</button></div>
  </div>`
  openSheet(html)
  const overlay = document.getElementById('overlay')
  overlay.onclick = (e) => {
    if (e.target.closest('[data-act="close"]')) closeSheet()
  }
  overlay.onchange = null
  overlay.oninput = null
}
