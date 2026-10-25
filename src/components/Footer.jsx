import HomeText from './main/HomePublishedText'
import Text from './main/Text'
function Footer({ textEditable = false }) {
  return (
    <footer className="site-footer" id="footer">
      <>{textEditable ? <HomeText as="p" configId="home-footer-credit" /> : <Text enabled={false} as="p" id="home-footer-credit">Made between worlds</Text>}</>
      <>{textEditable ? <HomeText className="footer-constellation" aria-hidden="true" configId="codex-home-dom-span-1syj1ps" /> : <span className="footer-constellation" aria-hidden="true">✦ ─ · ─ ✦</span>}</>
      <>{textEditable ? <HomeText as="p" configId="home-footer-copyright" /> : <Text enabled={false} as="p" id="home-footer-copyright">© 2026 The Wizard's Genesis</Text>}</>
    </footer>
  )
}

export default Footer