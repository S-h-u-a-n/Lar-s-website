export const WISH_ENDPOINT = 'https://api.web3forms.com/submit'
export const WISH_SUBJECT = 'The Wizard’s GENESIS｜收到一封來自地球的願望'

export class WishError extends Error {
  constructor(code) { super(code); this.name = 'WishError'; this.code = code }
}

export function validateWish(message, email = '') {
  if (!message.trim()) return { field: 'message', message: '先寫下一個願望，再把它寄出去吧。' }
  if (message.trim().length > 5000) return { field: 'message', message: '願望請保留在 5,000 字以內。' }
  if (email.trim() && (email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) return { field: 'email', message: '請確認電子郵件地址是否完整，或留白後寄出。' }
  return null
}

export async function sendWish({ message, email = '', accessKey, captchaToken, botcheck = false }, { fetchImpl = globalThis.fetch, signal, timeoutMs = 20000 } = {}) {
  if (validateWish(message, email)) throw new WishError('validation')
  if (botcheck) throw new WishError('blocked')
  if (!accessKey?.trim()) throw new WishError('configuration')
  if (!captchaToken) throw new WishError('captcha')
  const body = {
    access_key: accessKey.trim(), subject: WISH_SUBJECT,
    from_name: 'The Wizard’s GENESIS · 許願箱', message: message.trim(),
    botcheck: false, 'h-captcha-response': captchaToken,
  }
  // A blank optional email must not create an invalid Reply-To header.
  if (email.trim()) { body.email = email.trim(); body.replyto = email.trim() }
  const controller = new AbortController()
  let timedOut = false
  const cancel = () => controller.abort()
  if (signal?.aborted) cancel()
  signal?.addEventListener('abort', cancel, { once: true })
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, timeoutMs)
  try {
    const response = await fetchImpl(WISH_ENDPOINT, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body), signal: controller.signal, credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin',
    })
    // Never expose server response bodies: they may echo the visitor's content.
    if (response.status === 429) throw new WishError('rate-limit')
    const result = await response.json().catch(() => { throw new WishError('response') })
    if (!response.ok || result?.success !== true) throw new WishError('rejected')
    return true
  } catch (error) {
    if (error instanceof WishError) throw error
    if (signal?.aborted) throw new WishError('cancelled')
    throw new WishError(timedOut ? 'timeout' : 'network')
  } finally {
    clearTimeout(timer); signal?.removeEventListener('abort', cancel)
  }
}

export function wishErrorMessage(code) {
  if (code === 'rate-limit') return '願望信使現在有些忙，請稍後再試。你寫下的內容還在這裡。'
  if (code === 'configuration') return '許願箱暫時還沒準備好，請稍後再來。你寫下的內容會保留在這一頁。'
  if (code === 'captcha' || code === 'blocked') return '請先完成下方驗證，再寄出願望。'
  if (code === 'timeout' || code === 'network') return '暫時無法確認願望是否送達，內容已保留。請檢查連線，稍後再試。'
  return '這次沒能確認寄送成功，請重新完成驗證後再試。你的願望與信箱都還在。'
}
