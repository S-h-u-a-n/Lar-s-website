import Text from './main/Text'
function Footer({ textEditable = false }) {
  return (
    <footer className="site-footer" id="footer">
      <Text enabled={textEditable} as="p" id="home-footer-credit">Made between worlds</Text>
      <span className="footer-constellation" aria-hidden="true">✦ ─ · ─ ✦</span>
      <Text enabled={textEditable} as="p" id="home-footer-copyright">© 2026 The Wizard's Genesis</Text>
    </footer>
  )
}

export default Footer