export function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      default: return '&#39;'
    }
  })
}

export function fmtH(n) {
  const v = Number(n) || 0
  return (Math.round(v * 10) / 10).toFixed(1)
}

export function fmtNum(n, digits = 2) {
  return (Number(n) || 0).toFixed(digits)
}

export function fmtMoney(n) {
  const v = Number(n) || 0
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function fmtDays(n) {
  const v = Number(n) || 0
  return Number.isInteger(v) ? String(v) : v.toFixed(1)
}

export function signedH(n) {
  const v = Number(n) || 0
  const s = fmtH(Math.abs(v))
  if (v > 0.0001) return '+' + s
  if (v < -0.0001) return '-' + s
  return '0.0'
}

export function download(filename, content, mime = 'application/json') {
  const blob = new Blob([content], { type: mime + ';charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error || new Error('读取文件失败'))
    reader.readAsText(file, 'utf-8')
  })
}

export function $(root, sel) {
  return root.querySelector(sel)
}

export function $$(root, sel) {
  return [...root.querySelectorAll(sel)]
}

export function debounce(fn, wait = 120) {
  let t = null
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), wait)
  }
}
