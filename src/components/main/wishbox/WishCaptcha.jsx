import { useEffect, useRef, useState } from 'react'

// Official Web3Forms shared hCaptcha sitekey, not a secret or a test key.
const SITEKEY = '50b2fe65-b00b-4b9e-ad62-3ba471098be2'
let sdk
function loadCaptcha() {
  if (sdk) return sdk
  sdk = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    let finished = false
    const cleanup = () => { clearTimeout(timer); delete window.genesisWishCaptchaReady }
    const fail = () => {
      if (finished) return
      finished = true; cleanup(); script.remove(); sdk = null; reject(new Error('captcha-unavailable'))
    }
    const timer = setTimeout(fail, 15000)
    window.genesisWishCaptchaReady = () => {
      if (finished) return
      finished = true; cleanup(); resolve(window.hcaptcha)
    }
    script.src = 'https://js.hcaptcha.com/1/api.js?onload=genesisWishCaptchaReady&render=explicit&recaptchacompat=off'
    script.async = true; script.defer = true; script.onerror = fail
    document.head.append(script)
  })
  return sdk
}

export default function WishCaptcha({ onToken, resetVersion }) {
  const host = useRef(null), widget = useRef(null), callbacks = useRef(onToken)
  const [state, setState] = useState('loading'), [attempt, setAttempt] = useState(0)
  callbacks.current = onToken
  useEffect(() => {
    let active = true, api
    setState('loading')
    loadCaptcha().then(hcaptcha => {
      if (!active) return
      api = hcaptcha
      widget.current = api.render(host.current, {
        sitekey: SITEKEY, size: 'compact', theme: 'light', hl: 'zh-TW',
        callback: token => { if (active) { callbacks.current(token); setState('ready') } },
        'expired-callback': () => { if (active) { callbacks.current(''); setState('expired') } },
        'error-callback': () => { if (active) { callbacks.current(''); setState('error') } },
      })
      setState('ready')
    }).catch(() => { if (active) setState('error') })
    return () => {
      active = false
      if (api && widget.current !== null) api.remove(widget.current)
      widget.current = null
    }
  }, [attempt])
  useEffect(() => {
    if (widget.current === null) return
    window.hcaptcha?.reset(widget.current); callbacks.current(''); setState('ready')
  }, [resetVersion])
  return <div className="wish-captcha"><div ref={host}/><p role="status">{state === 'loading' ? '正在準備小小的驗證⋯' : state === 'expired' ? '驗證已過期，請再完成一次。' : state === 'error' ? '驗證暫時無法載入，請稍後重試。' : '寄出前，請完成小小的驗證。'}</p>{state === 'error' && <button type="button" onClick={() => { callbacks.current(''); setAttempt(value => value + 1) }}>重新載入驗證</button>}</div>
}
