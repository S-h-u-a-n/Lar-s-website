const navigation = [
  { label: 'Home', href: '#top' },
  { label: 'World', href: '#explore' },
  { label: 'Characters', href: '#archive' },
  { label: 'Archive', href: '#archive' },
  { label: 'Story', href: '#explore' },
  { label: 'About', href: '#footer' },
]

function Header() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a className="wordmark" href="#top" aria-label="The Wizard's Genesis home">
          <span className="wordmark-mark" aria-hidden="true">✧</span>
          <span>The Wizard&apos;s Genesis</span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <a key={item.label} href={item.href}>{item.label}</a>
          ))}
        </nav>
        <div className="header-tools">
          <a className="search-link" href="#explore" aria-label="Search the world">⌕</a>
          <a className="menu-link" href="#explore" aria-label="Open menu"><span className="menu-bars" aria-hidden="true">☰</span></a>
        </div>
      </div>
    </header>
  )
}

export default Header