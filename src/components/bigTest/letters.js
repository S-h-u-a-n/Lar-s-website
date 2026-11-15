import { PIGMENTS } from '../../edition/palette'
import { LETTERS, NOTES, RESEARCH_LOGS } from './bigContent'

export { LETTERS, NOTES, RESEARCH_LOGS }

// Theme choices reuse the six maintenance-dot colors; these are not empty letters.
export const LETTER_THEMES = {
  butterMint: { paper: PIGMENTS.white, cover: PIGMENTS.butter, dots: PIGMENTS.mint, ink: PIGMENTS.ink },
  strawberryMint: { paper: PIGMENTS.white, cover: PIGMENTS.strawberry, dots: PIGMENTS.mint, ink: PIGMENTS.ink },
  peachSky: { paper: PIGMENTS.white, cover: PIGMENTS.peach, dots: PIGMENTS.sky, ink: PIGMENTS.ink },
  skyButter: { paper: PIGMENTS.white, cover: PIGMENTS.sky, dots: PIGMENTS.butter, ink: PIGMENTS.ink },
  mintPeach: { paper: PIGMENTS.white, cover: PIGMENTS.mint, dots: PIGMENTS.peach, ink: PIGMENTS.ink },
  lavenderSky: { paper: PIGMENTS.white, cover: '#e1d0f2', dots: PIGMENTS.sky, ink: PIGMENTS.ink },
}
