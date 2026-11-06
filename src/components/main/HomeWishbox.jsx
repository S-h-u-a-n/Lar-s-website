import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import WishCaptcha from './wishbox/WishCaptcha'
import { sendWish, validateWish, wishErrorMessage } from './wishbox/service'
import './HomeWishbox.css'

export default function HomeWishbox() {
  const [message, setMessage] = useState(''), [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle'), [error, setError] = useState(null)
  const [started, setStarted] = useState(false), [token, setToken] = useState(''), [resetVersion, setResetVersion] = useState(0)
  const busy = useRef(false), controller = useRef(null), alive = useRef(true)
  const messageInput = useRef(null), emailInput = useRef(null), success = useRef(null), reduced = useReducedMotion()
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false; controller.current?.abort() }
  }, [])
  useEffect(() => { if (status === 'success') success.current?.focus({ preventScroll: true }) }, [status])
  const submit = async event => {
    event.preventDefault()
    if (busy.current) return
    const validation = validateWish(message, email)
    if (validation) {
      setError(validation); (validation.field === 'message' ? messageInput : emailInput).current?.focus({ preventScroll: true }); return
    }
    setStarted(true)
    if (!token) { setError({ message: '請先完成下方驗證，再把願望交給信使。' }); return }
    busy.current = true; setStatus('sending'); setError(null)
    controller.current = new AbortController()
    try {
      await sendWish({ message, email, captchaToken: token, accessKey: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY,
        botcheck: event.currentTarget.elements.botcheck.checked }, { signal: controller.current.signal })
      if (alive.current) { setStatus('success'); setMessage(''); setEmail(''); setToken('') }
    } catch (failure) {
      if (alive.current && failure.code !== 'cancelled') {
        setStatus('error'); setError({ message: wishErrorMessage(failure.code) }); setToken(''); setResetVersion(value => value + 1)
      }
    } finally { busy.current = false }
  }
  const rewrite = () => {
    setStatus('idle'); setError(null); setStarted(false); setToken('')
    requestAnimationFrame(() => messageInput.current?.focus({ preventScroll: true }))
  }
  const update = (setter, field) => event => {
    setter(event.target.value)
    if (error?.field === field) setError(null)
  }
  return <section className="home-wishbox" id="wishbox" aria-labelledby="wishbox-title">
    <span className="wish-distance-mark" aria-hidden="true">·</span>
    <motion.div className="wish-letter" initial={reduced ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .8, ease: [.22,.75,.25,1] }}>
      <span className="wish-emblem" aria-hidden="true">✧</span><p className="wish-kicker">A LETTER TO THE SKY</p>
      <h2 id="wishbox-title">許個願望吧！</h2>
      <p className="wish-intro">說不定魔法師們能接收到並實現你的願望喔！</p>
      <div className="wish-sheet"><AnimatePresence mode="wait" initial={false}>
        {status === 'success' ? <motion.div key="sent" className="wish-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .65 }}>
          <motion.span aria-hidden="true" className="wish-sent-star" initial={{ opacity: 0, y: 25, scale: .65 }} animate={{ opacity: [0,1,1], y: reduced ? 0 : -16, scale: 1 }} transition={{ duration: reduced ? 0 : 1.6, ease: 'easeOut' }}>✧</motion.span>
          <p ref={element => { success.current = element; element?.focus({ preventScroll: true }) }} tabIndex={-1} role="status">你的願望，已經送往天球了。</p><button type="button" onClick={rewrite}>再寫下一個願望 <span aria-hidden="true">↗</span></button>
        </motion.div> : <motion.form key="letter" className="wish-form" noValidate onSubmit={submit} aria-busy={status === 'sending'} exit={{ opacity: 0, y: reduced ? 0 : -8 }} transition={{ duration: reduced ? 0 : .4 }}>
          <label className="wish-visually-hidden" htmlFor="wish-message">願望內容（必填）</label>
          <textarea ref={messageInput} id="wish-message" name="message" onFocus={() => setStarted(true)} required maxLength={5000} value={message} onChange={update(setMessage, 'message')} placeholder="寫下你的願望……" readOnly={status === 'sending'} aria-invalid={error?.field === 'message' || undefined} aria-describedby={error?.field === 'message' ? 'wish-error' : undefined}/>
          <div className="wish-email"><label htmlFor="wish-email">電子郵件 <span>（選填）</span></label><input ref={emailInput} id="wish-email" name="email" onFocus={() => setStarted(true)} type="email" autoComplete="email" inputMode="email" maxLength={254} placeholder="you@example.com" value={email} onChange={update(setEmail, 'email')} readOnly={status === 'sending'} aria-invalid={error?.field === 'email' || undefined} aria-describedby={`wish-email-hint wish-privacy${error?.field === 'email' ? ' wish-error' : ''}`}/></div>
          <p className="wish-email-hint" id="wish-email-hint">留下信箱，魔法師們說不定會寫信給你喔～</p>
          <input type="checkbox" name="botcheck" className="wish-honeypot" tabIndex={-1} aria-hidden="true" autoComplete="off"/>
          {started && <WishCaptcha onToken={setToken} resetVersion={resetVersion}/>}
          {error && <p id="wish-error" className="wish-error" role="alert">{error.message}</p>}
          <button type="submit" className="wish-submit" disabled={status === 'sending'}>{status === 'sending' ? <><span className="wish-wait" aria-hidden="true">✧</span> 願望寄送中⋯</> : <>寄出願望 <span aria-hidden="true">✧</span></>}</button>
          <p className="wish-privacy" id="wish-privacy">電子郵件僅供可能的人工回覆使用，不保證一定回信。<span>願望與選填信箱將透過 Web3Forms 寄送。</span></p>
          <span className="wish-visually-hidden" role="status">{status === 'sending' ? '正在寄出願望，請稍候。' : ''}</span>
        </motion.form>}
      </AnimatePresence></div>
      <p className="wish-postmark">FROM EARTH, WITH A LITTLE HOPE.</p>
    </motion.div>
    <span className="wish-end-mark" aria-hidden="true">✦</span>
  </section>
}
