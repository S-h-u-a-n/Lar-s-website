import { motion, useReducedMotion } from 'framer-motion'
import portrait from '../../../Art/Main-art/REMOANPU.jpg'
import invitationIllustration from '../../../Art/Main-art/REMOANPU.png'
import socialLinks from './authorLinks.json'
import './HomeAuthor.css'

const authorIntroduction = `每天都在不自覺冒出很多有趣（自認為）的想法，對很多事情感興趣，奈何本人能力有限時間也很殘酷，所以正在努力的做著力所能及的事情。
喜歡繪畫、看故事和想故事！
希望能創造出能讓大家開心的世界（WorlD）`

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
      <div className="ha-portrait-column"><figure className="ha-portrait"><span className="ha-tape" aria-hidden="true"/><img src={portrait} alt="REMOANPU 的作者頭像" width="833" height="833" loading="lazy"/><figcaption>FROM MY LITTLE WORLD <span aria-hidden="true">✦</span></figcaption></figure><span className="ha-handnote">希望你能喜歡這個WorlD</span></div>
      <div className="ha-content"><header><p className="ha-kicker">A NOTE FROM THE CREATOR</p><h2 id="home-author-name">REMOANPU<span aria-hidden="true">✧</span></h2><p className="ha-intro">{authorIntroduction}</p></header>
        <nav className="ha-socials" aria-label="REMOANPU 的社群連結">{socialLinks.map(platform => {
          const href = externalHref(platform.url)
          const content = <><span className={`ha-social-mark ha-mark-${platform.id}`} aria-hidden="true">{platform.mark}</span><span>{platform.label}</span><span className="ha-social-arrow" aria-hidden="true">{href ? '↗' : '·'}</span></>
          return href ? <a className="ha-social" key={platform.id} href={href} target="_blank" rel="noopener noreferrer" aria-label={`${platform.label}（在新分頁開啟）`}>{content}</a> : <button className="ha-social" type="button" key={platform.id} disabled title="社群網址待補充" aria-label={`${platform.label}：網址待補充`}>{content}</button>
        })}</nav>
        <a className="ha-contact" href="mailto:newworldremo@gmail.com">newworldremo@gmail.com</a>
        {socialLinks.some(platform => !externalHref(platform.url)) && <p className="ha-link-note">社群連結整理中，之後會在這裡與你見面。</p>}
      </div>
      <section className="ha-invitation" aria-labelledby="ha-invitation-title">
        <h3 id="ha-invitation-title">一起研究這個世界吧！</h3>
        <p>《The Wizard’s GENESIS》目前由個人獨立製作，但地球實在太大了，還有許多值得探索的知識與故事！</p>
        <p>未來希望能邀請更多不同領域的夥伴參與，一起完善這座小小的研究室。</p>
        <p>如果你喜歡這個故事與企劃理念，對某個領域有一定程度的認識，並且擅長查找可靠資料、將複雜的知識整理成清晰易懂的文字，非常歡迎透過電子郵件與我聯絡！一起讓大家知道地球的美好吧！</p>
        <img className="ha-invitation-illustration" src={invitationIllustration} alt="" width="918" height="929" loading="lazy" />
        <p>因為目前資金為0（倒貼中），所以我最多能回饋的⋯是畫畫TvT</p>
        <p>無論是協助撰寫科普內容、檢查現有資料、提出新的研究方向，或是有其他有趣的構想，都歡迎來信討論！</p>
        <p>期待有一天，這座研究室能聚集更多對世界充滿好奇的人！</p>
        <a className="ha-contact" href="mailto:newworldremo@gmail.com">newworldremo@gmail.com</a>
      </section>
      <span className="ha-corner-mark" aria-hidden="true">New WorlD!!<br/><em>THANKS FOR VISITING</em></span>
    </motion.div>
  </section>
}
