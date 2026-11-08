let closeCallback = null

export function openSheet(html, onClose) {
  const overlay = document.getElementById('overlay')
  overlay.innerHTML = `<div class="backdrop" data-sheet-close></div>${html}`
  overlay.classList.remove('hidden')
  closeCallback = onClose || null
  bindBackdrop()
  return overlay
}

export function updateSheet(html) {
  const overlay = document.getElementById('overlay')
  if (!overlay || overlay.classList.contains('hidden')) return
  overlay.innerHTML = `<div class="backdrop" data-sheet-close></div>${html}`
  bindBackdrop()
}

function bindBackdrop() {
  const overlay = document.getElementById('overlay')
  const backdrop = overlay.querySelector('[data-sheet-close]')
  if (backdrop) backdrop.addEventListener('click', closeSheet)
}

export function closeSheet() {
  const overlay = document.getElementById('overlay')
  if (!overlay) return
  overlay.classList.add('hidden')
  overlay.innerHTML = ''
  const cb = closeCallback
  closeCallback = null
  if (cb) cb()
}

export function isSheetOpen() {
  const overlay = document.getElementById('overlay')
  return !!overlay && !overlay.classList.contains('hidden')
}
