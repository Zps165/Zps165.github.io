let deferredPrompt = null

export function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

export function isSecureContextOk() {
  return (
    window.isSecureContext ||
    location.protocol === 'https:' ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '[::1]'
  )
}

export function canInstall() {
  return !!deferredPrompt
}

export async function promptInstall() {
  if (!deferredPrompt) return false
  const evt = deferredPrompt
  deferredPrompt = null
  evt.prompt()
  try {
    const choice = await evt.userChoice
    return choice && choice.outcome === 'accepted'
  } catch {
    return false
  }
}

export function initPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    window.dispatchEvent(new Event('worklog:installable'))
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    window.dispatchEvent(new Event('worklog:installed'))
  })

  if (!('serviceWorker' in navigator)) return
  if (!isSecureContextOk()) {
    console.info('[工时记] 当前不是安全上下文，Service Worker 不注册；局域网 HTTP 下无法离线/安装。')
    return
  }

  const hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker
    .register('./sw.js')
    .then((reg) => {
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing
        if (!sw) return
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new Event('worklog:update'))
          }
        })
      })
    })
    .catch((err) => console.warn('[工时记] Service Worker 注册失败', err))

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return
    window.dispatchEvent(new Event('worklog:update'))
  })
}
