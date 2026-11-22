import PhotoCredit from '../research/PhotoCredit'
import sources from './posterSources.json'

// Reuse the site's existing mail contact; this link opens a draft and sends nothing.
export const RIGHTS_CONTACT = 'newworldremo@gmail.com'

export function PosterCopyrightNotice() {
  return <p className="ball-poster-copyright">本站展示之作品封面、海報及相關視覺素材，其著作權與商標權歸各自權利人所有。本站僅作非營利性作品介紹與推薦，不主張擁有他人素材之權利。如權利人認為使用內容涉及侵權，請透過 <a href={`mailto:${RIGHTS_CONTACT}`}>{RIGHTS_CONTACT}</a> 通知，我們將立即移除相關素材並配合處理。此聲明不替代素材使用授權。</p>
}

export function WorkPosterCredit({ work, photoRef }) {
  const source = sources[work.id]
  if (!source) return null
  return <PhotoCredit photoRef={photoRef} credit={source} inline>
    <PosterSourceDetails source={source}/>
  </PhotoCredit>
}

export function PosterSourceDetails({ source }) {
  return <>
    <p>{source.workTitle}</p>
    <dl>
      <dt>指定圖片來源平台</dt><dd>{source.sourcePlatform}（來源平台不等於著作權人）</dd>
      <dt>指定圖片連結</dt><dd><a href={source.requestedImageUrl} target="_blank" rel="noopener noreferrer">原始指定圖片 ↗︎</a>{source.sourcePageUrl && <> · <a href={source.sourcePageUrl} target="_blank" rel="noopener noreferrer">來源作品頁 ↗︎</a></>}</dd>
      <dt>已確認的作品權利相關方</dt><dd>{source.workRightsParties.map((party, index) => <div key={`${party.name}-${index}`}><a href={party.sourceUrl} target="_blank" rel="noopener noreferrer">{party.name} ↗︎</a>：{party.role}{party.officialNotice && <div>{party.officialNotice}</div>}</div>)}</dd>
      <dt>指定海報／封面權利人</dt><dd>{source.posterRightsHolder}</dd>
      {source.bookCredits && <><dt>此版本封面設計／插畫</dt><dd>{source.bookCredits.coverDesigner}／{source.bookCredits.coverIllustrator}。{source.bookCredits.edition}</dd></>}
      <dt>本地圖片與處理紀錄</dt><dd>{source.transformations.join('')}</dd>
      <dt>來源使用規範</dt><dd>{source.policyUrls.map(url => <div key={url}><a href={url} target="_blank" rel="noopener noreferrer">{source.sourcePlatform} 使用條件 ↗︎</a></div>)}</dd>
    </dl>
    <PosterCopyrightNotice/>
  </>
}
