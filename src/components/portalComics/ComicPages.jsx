import { useEffect, useLayoutEffect } from 'react'
import Text from '../main/Text'
import { enablePageTextPersistence } from '../../dev/textEditorStore'
import { PORTAL_COMICS } from './config'
import './ComicPages.css'

function ComicPage({ portalId, onContinue, onBack }) {
  const data = PORTAL_COMICS[portalId]
  const prefix = `${data.screen}-`
  useEffect(() => enablePageTextPersistence(data.screen, prefix), [data.screen, prefix])
  return <main className="portal-comic" aria-label={`${data.title} comic introduction`}>
    <header><button onClick={onBack}><Text id={`${prefix}back`}>BACK</Text></button><Text as="h1" id={`${prefix}title`}>{data.title}</Text></header>
    <section className="portal-comic__panels" aria-label="Comic content">
      {data.panels.length ? data.panels.map(panel => <img key={panel.id} src={panel.src} alt={panel.alt || ''} />) : <Text id={`${prefix}placeholder`}>COMIC COMING SOON</Text>}
    </section>
    <button className="portal-comic__continue" onClick={onContinue}><Text id={`${prefix}continue`}>CONTINUE</Text></button>
  </main>
}
export function GlobeComicPage(props) { return <ComicPage portalId="globe" {...props} /> }
export function NaturalComicPage(props) { return <ComicPage portalId="book-open1" {...props} /> }
export function HumanComicPage(props) { return <ComicPage portalId="book-close1" {...props} /> }
export function BallComicPage(props) { return <ComicPage portalId="ball" {...props} /> }
export const COMIC_PAGES = { 'globe-comic': GlobeComicPage, 'natural-comic': NaturalComicPage, 'human-comic': HumanComicPage, 'ball-comic': BallComicPage }

// Commit only after the lazy destination resolves. Match Main's existing arrival stage.
export function PortalPageArrival({ children, onReady, onMounted, animate }) {
  useLayoutEffect(() => { onMounted?.() }, [onMounted])
  useEffect(() => {
    if (!animate || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const frame = requestAnimationFrame(() => onReady?.())
    return () => cancelAnimationFrame(frame)
  }, [animate, onReady])
  return <div className={animate ? "portal-page-arrival" : undefined} onAnimationEnd={event => {
    if (event.target === event.currentTarget && event.animationName === 'home-page-arrive') onReady()
  }}>{children}</div>
}
