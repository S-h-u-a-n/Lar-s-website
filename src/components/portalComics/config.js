import { PIGMENTS } from '../../edition/palette'
import globe from '../../../Art/Big/Big-icon/icon-globe.PNG'
import telescope from '../../../Art/Big/Big-icon/icon-telescope.PNG'
import natural from '../../../Art/Big/Big-icon/icon-book1.PNG'
import human from '../../../Art/Big/Big-icon/icon-book2.PNG'
import ball from '../../../Art/Big/Big-icon/icon-ball.PNG'
import potion from '../../../Art/Big/Big-icon/icon-potion.PNG'
import { FIELD_COMIC_STORIES } from './fieldComicStories'

// Shared light pigment family for each observation instrument.
// Each entry owns its future comic data and its complete transition preset.
export const PORTAL_COMICS = {
  potion: { screen: 'weather-comic', destination: 'bottled-weather', title: 'BOTTLED WEATHER', background: PIGMENTS.lavender, squareColor: PIGMENTS.butter, icon: potion, panels: [], replayableStory: false },
  globe: { screen: 'globe-comic', destination: 'globe', title: '天體觀測', background: PIGMENTS.mint, squareColor: PIGMENTS.butter, icon: globe, panels: [], replayableStory: false },
  telescope: { screen: 't-comic', destination: 'telescope', title: 'TELESCOPE', background: PIGMENTS.sky, squareColor: PIGMENTS.mint, icon: telescope, replayableStory: true },
  'book-open1': { screen: 'natural-comic', destination: 'natural-test', title: 'NATURAL WORLD', background: PIGMENTS.butter, squareColor: PIGMENTS.peach, icon: natural, panels: [], story: FIELD_COMIC_STORIES['book-open1'], replayableStory: true },
  'book-close1': { screen: 'human-comic', destination: 'human-test', title: 'HUMAN WORLD', background: PIGMENTS.peach, squareColor: PIGMENTS.strawberry, icon: human, panels: [], story: FIELD_COMIC_STORIES['book-close1'], replayableStory: true },
  ball: { screen: 'ball-comic', destination: 'ball-test', title: 'OUR FAVORITES!', background: PIGMENTS.strawberry, squareColor: PIGMENTS.lavender, icon: ball, panels: [], replayableStory: true },
}
export const PORTAL_TRANSITION_LAYOUT = { minSize: 140, maxSize: 240, viewportRatio: 0.24, iconRatio: 0.7, radius: 12 }

// Randomize one color pair once; the icon always belongs to the departing page.
export function pickReturnTransition(portalId) { return PORTAL_COMICS[portalId] || PORTAL_COMICS.globe }
