import './style.css'

// All copy is visible by default. Animation decorates it; scrolling never gates it.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      entry.target.animate([
        { opacity: 0.55, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 850, easing: 'cubic-bezier(.22,.75,.25,1)' })
      observer.unobserve(entry.target)
    }
  }, { threshold: 0.12 })
  document.querySelectorAll('.wi-copy, .wi-so p').forEach(node => observer.observe(node))
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      observer.disconnect()
      document.getAnimations().forEach(animation => animation.finish())
    }
  })
}
