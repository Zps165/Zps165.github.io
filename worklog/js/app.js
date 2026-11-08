import { state, subscribe, setTab, setFeed, setUpdateReady, applyDuePlans, toast } from './store.js'
import { todayStr } from './date.js'
import { renderCalendar } from './ui/calendar.js'
import { renderStats } from './ui/stats.js'
import { renderSettings } from './ui/settings.js'
import { renderHolidays } from './ui/holiday-page.js'
import { openDaySheet } from './ui/day-sheet.js'
import { initPWA } from './pwa.js'
import { fetchHolidayFeed } from './feed.js'

const pages = {
  calendar: renderCalendar,
  stats: renderStats,
  settings: renderSettings,
  holidays: renderHolidays,
}

const NAV = [
  {
    id: 'calendar',
    label: '日历',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"/><path d="M7.5 13h2M11 13h2M14.5 13h2M7.5 16.5h2M11 16.5h2"/></svg>',
  },
  {
    id: 'stats',
    label: '统计',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V10M12 20V4M19 20v-7"/><path d="M3 20h18"/></svg>',
  },
  {
    id: 'settings',
    label: '设置',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/></svg>',
  },
]

let lastTab = null
let lastViewKey = ''
let lastToday = todayStr()

function applyTheme() {
  const theme = state.settings.theme || 'system'
  document.documentElement.dataset.theme = theme
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', dark ? '#080B11' : '#F4F6FA')
}

function renderNav() {
  const nav = document.getElementById('nav')
  const active = state.tab === 'holidays' ? 'settings' : state.tab
  nav.innerHTML = NAV.map(
    (t) => `<button class="${t.id === active ? 'on' : ''}" data-tab="${t.id}">
      <span class="ico">${t.icon}</span><span>${t.label}</span>
    </button>`,
  ).join('')
  nav.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab))
  })
}

function renderFab() {
  const fab = document.getElementById('fab')
  if (!fab) return
  fab.classList.toggle('hidden', state.tab !== 'calendar')
}

function renderView() {
  const view = document.getElementById('view')
  const top = view.scrollTop
  view.onclick = null
  view.onchange = null
  view.oninput = null
  view.innerHTML = ''
  const fn = pages[state.tab] || renderCalendar
  fn(view)
  if (lastTab === state.tab) view.scrollTop = top
  else {
    view.scrollTop = 0
    lastTab = state.tab
  }
  // 只在切换页面/月份时播放一次进入动画；数据刷新不重播。
  const key = `${state.tab}|${state.ym}`
  if (key !== lastViewKey) {
    lastViewKey = key
    view.classList.remove('view-enter')
    // 强制读一次布局，让动画可以从头开始；QuickJS stub 下 undefined 也无妨。
    void view.offsetWidth
    view.classList.add('view-enter')
  }
}

function renderToast() {
  const el = document.getElementById('toast')
  if (!el) return
  if (!state.toast) {
    el.classList.add('hidden')
    el.textContent = ''
    return
  }
  el.textContent = state.toast.message
  el.classList.remove('hidden')
}

function renderUpdate() {
  let banner = document.getElementById('updateBanner')
  if (!state.updateReady) {
    if (banner) banner.remove()
    return
  }
  if (banner) return
  banner = document.createElement('div')
  banner.id = 'updateBanner'
  banner.className = 'update-banner'
  banner.innerHTML = '<span>新版本已就绪</span><button type="button">刷新</button>'
  banner.querySelector('button').addEventListener('click', () => location.reload())
  document.getElementById('app').appendChild(banner)
}

function render() {
  applyTheme()
  renderNav()
  renderView()
  renderFab()
  renderToast()
  renderUpdate()
}

async function autoCheckFeed() {
  const s = state.settings
  if (!s.holidayFeedUrl || !s.autoCheckHoliday) return
  const key = 'worklog:feed-at'
  let last = 0
  try {
    last = Number(localStorage.getItem(key) || 0)
  } catch {
    last = 0
  }
  if (Date.now() - last < 24 * 3600 * 1000) return
  try {
    const feed = await fetchHolidayFeed(s.holidayFeedUrl)
    try {
      localStorage.setItem(key, String(Date.now()))
    } catch {
      /* ignore */
    }
    setFeed(feed)
    toast(`节假日数据已更新 ${feed.version}`)
  } catch (err) {
    console.info('[工时记] 节假日自动检查失败：', err.message)
  }
}

function checkDayChange() {
  const now = todayStr()
  if (now === lastToday) return
  lastToday = now
  // 有排休转换时 applyDuePlans 会 toast 并触发一次渲染；
  // 没有转换时仍需重绘，更新“今天”高亮。
  if (!applyDuePlans()) render()
}

function boot() {
  const params = new URLSearchParams(location.search)
  const tab = params.get('tab')
  if (tab && pages[tab]) state.tab = tab

  initPWA()
  applyDuePlans()
  lastToday = todayStr()
  subscribe(render)
  render()

  const fab = document.getElementById('fab')
  if (fab) fab.addEventListener('click', () => openDaySheet(todayStr()))

  if (params.get('action') === 'today') {
    setTimeout(() => openDaySheet(todayStr()), 60)
  }

  window.addEventListener('worklog:update', () => setUpdateReady(true))
  window.addEventListener('worklog:installable', render)
  window.addEventListener('worklog:installed', render)

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  if (mq.addEventListener) mq.addEventListener('change', applyTheme)

  window.addEventListener('focus', checkDayChange)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkDayChange()
  })
  setInterval(checkDayChange, 60 * 1000)

  autoCheckFeed()
}

boot()
