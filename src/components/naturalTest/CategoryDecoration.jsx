export default function CategoryDecoration({ category, overview = false }) {
  return <span className={`nt-title-decoration${overview ? ' nt-title-decoration--overview' : ''}`} aria-hidden="true" style={{ '--nt-category-color': category.color }}>
    <span className="nt-title-decoration-art"><span className={`nt-decoration nt-decoration-${category.decoration}`}/></span>
  </span>
}
