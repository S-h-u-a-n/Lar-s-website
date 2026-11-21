// Expansion ends at scale(1). Opacity belongs exclusively to the camera's
// zoom-derived CSS variable, so elapsed time can never dismiss this circle.
export default function ResearchCategoryCircle({ color }) {
  return <div className="nt-category-circle" aria-hidden="true" style={color ? { '--nt-category-color': color } : undefined}/>
}
