import { motion, useReducedMotion } from 'framer-motion'
import portrait from '../../../Art/Main-art/REMOANPU.jpg'
import socialLinks from './authorLinks.json'
import './HomeAuthor.css'

function externalHref(value) {
  try {
    const url = new URL(value.trim())
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}

export default function HomeAuthor() {
  const reduced = useReducedMotion()
  return <section className="home-author" id="home-author" aria-labelledby="home-author-name">
    <motion.div className="ha-card" initial={reduced ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: .2 }} transition={{ duration: .7 }}>
      <span className="ha-thread-end" aria-hidden="true">✧</span>
      <div className="ha-portrait-column"><figure className="ha-portrait"><span className="ha-tape" aria-hidden="true"/><img src={portrait} alt="REMOANPU 的作者頭像" width="833" height="833" loading="lazy"/><figcaption>FROM MY LITTLE WORLD <span aria-hidden="true">✦</span></figcaption></figure><span className="ha-handnote">很高興在這裡遇見你。</span></div>
      <div className="ha-content"><header><p className="ha-kicker">A NOTE FROM THE CREATOR</p><h2 id="home-author-name">REMOANPU<span aria-hidden="true">✧</span></h2><p className="ha-intro">喜歡畫畫、編故事，以及創造各種奇妙世界。</p></header>
        <nav className="ha-socials" aria-label="REMOANPU 的社群連結">{socialLinks.map(platform => {
          const href = externalHref(platform.url)
          const content = <><span className={`ha-social-mark ha-mark-${platform.id}`} aria-hidden="true">{platform.mark}</span><span>{platform.label}</span><span className="ha-social-arrow" aria-hidden="true">{href ? '↗' : '·'}</span></>
          return href ? <a className="ha-social" key={platform.id} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${platform.label}（在新分頁開啟）`}>{content}</a> : <button className="ha-social" type="button" key={platform.id} disabled title="社群網址待補充" aria-label={`${platform.label}：網址待補充`}>{content}</button>
        })}</nav>
        {socialLinks.some(platform => !externalHref(platform.url)) && <p className="ha-link-note">社群連結整理中，之後會在這裡與你見面。</p>}
      </div>
      <span className="ha-corner-mark" aria-hidden="true">a little world,<br/><em>made with care.</em></span>
    </motion.div>
  </section>
}
