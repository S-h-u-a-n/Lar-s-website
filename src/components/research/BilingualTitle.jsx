// Keep source names separate; only their presentation is paired here.
export default function BilingualTitle({ chinese, english }) {
  return <><span className="nt-title-zh" lang="zh-Hant">{chinese}</span><span className="nt-title-en" lang="en">{english}</span></>
}
