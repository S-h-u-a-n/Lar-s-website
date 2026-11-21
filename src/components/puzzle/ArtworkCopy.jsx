export default function ArtworkCopy({art,title=art.officialTitle||art.title,subtitle=art.subtitle,className=''}) {
  const profile=art.profile||art
  const hasInfo=profile.artist||profile.canvasSize||profile.year
  return <div className={`pg-art-copy ${className}`}>
    <div className="pg-art-title">
      <span className="pg-corner-mark" aria-hidden="true"/>
      <h2>{title}</h2>
      {subtitle&&<p className="pg-art-subtitle">{subtitle}</p>}
      {art.theme&&<p>{art.theme}</p>}
      {hasInfo&&<section className="pg-art-info"><h3>作品資訊</h3><dl>
        {profile.artist&&<div><dt>作者</dt><dd>{profile.artist}</dd></div>}
        {profile.canvasSize&&<div><dt>畫布尺寸</dt><dd>{profile.canvasSize}</dd></div>}
        {profile.year&&<div><dt>創作年份</dt><dd>{profile.year}</dd></div>}
      </dl></section>}
    </div>
    <div className="pg-art-prose">
      {profile.description&&<section>{profile.description.split(/\n\s*\n/).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</section>}
      {profile.aside&&<p className="pg-art-aside">{profile.aside}</p>}
      {profile.artistStatement&&<section><h3>創作心得</h3>{profile.artistStatement.split(/\n\s*\n/).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</section>}
    </div>
  </div>
}
