import ExploreCard from './ExploreCard'

const destinations = [
  { title: 'World', subtitle: 'places & planets', description: '從地球的誕生到無數的奇蹟。', symbol: '◌' },
  { title: 'Characters', subtitle: 'souls in the story', description: '認識那些與世界相遇的人。', symbol: '♢' },
  { title: 'Archive', subtitle: 'fragments & notes', description: '典藏散落在世界裡的記錄。', symbol: '⌁' },
  { title: 'Story', subtitle: 'a tale unfolding', description: '一段關於創造的旅程。', symbol: '✧' },
]

function ExploreSection() {
  return (
    <section className="explore" id="explore" aria-labelledby="explore-title">
      <div className="section-heading">
        <p className="eyebrow">A catalogue of wonders</p>
        <h2 id="explore-title">Explore<br /><em>our world.</em></h2>
      </div>
      <div className="section-description">
        <p>
          從地球的誕生到無數的奇蹟，在這裡，你可以探索關於這個世界的所有故事。
        </p>
        <a className="more-link" href="#archive">了解更多 <span aria-hidden="true">→</span></a>
      </div>
      <div className="explore-grid" id="archive">
        {destinations.map((destination, index) => (
          <ExploreCard key={destination.title} index={index + 1} {...destination} />
        ))}
      </div>
    </section>
  )
}

export default ExploreSection