function ExploreCard({ index, title, subtitle, description, symbol }) {
  return (
    <a className="explore-card" href="#archive">
      <span className="card-placeholder" aria-hidden="true">
        <span className="placeholder-symbol">{symbol}</span>
      </span>
      <span className="card-index">0{index} / {subtitle}</span>
      <span className="card-title">{title}</span>
      <span className="card-description">{description}</span>
      <span className="card-arrow" aria-hidden="true">↗</span>
    </a>
  )
}

export default ExploreCard