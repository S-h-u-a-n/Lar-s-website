import Text from './main/Text'
function ExploreCard({ index, title, subtitle, description, symbol, textEditable = false }) {
  return (
    <a className="explore-card" href="#archive">
      <span className="card-placeholder" aria-hidden="true">
        <span className="placeholder-symbol">{symbol}</span>
      </span>
      <Text enabled={textEditable} id={`home-card-${index}-index`} className="card-index">{`0${index} / ${subtitle}`}</Text>
      <Text enabled={textEditable} id={`home-card-${index}-title`} className="card-title">{title}</Text>
      <Text enabled={textEditable} id={`home-card-${index}-description`} className="card-description">{description}</Text>
      <span className="card-arrow" aria-hidden="true">↗︎</span>
    </a>
  )
}

export default ExploreCard