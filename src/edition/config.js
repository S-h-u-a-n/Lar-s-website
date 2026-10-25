import { PIGMENTS } from './palette'
import globe from '../../Art/Big/Big-icon/icon-globe.PNG'
import telescope from '../../Art/Big/Big-icon/icon-telescope.PNG'
import natural from '../../Art/Big/Big-icon/icon-book1.PNG'
import human from '../../Art/Big/Big-icon/icon-book2.PNG'
import ball from '../../Art/Big/Big-icon/icon-ball.PNG'
import potion from '../../Art/Big/Big-icon/icon-potion.PNG'
export const TOOLS = [
  { id: 'globe', route: 'globe', number: '01', name: '天體觀測', english: 'Celestial notes', question: '把世界放在手心裡。', icon: globe, color: PIGMENTS.mint },
  { id: 'telescope', route: 'telescope', number: '02', name: '遠方的地球', english: 'The observation window', question: '看看沒有魔法的遠方。', icon: telescope, color: PIGMENTS.sky },
  { id: 'book-open1', route: 'natural-test', number: '03', name: '自然研究', english: 'An atlas of curious things', question: '從地面、海洋，到天空。', icon: natural, color: PIGMENTS.butter },
  { id: 'book-close1', route: 'human-test', number: '04', name: '人文研究', english: 'Life without a spell', question: '不用魔法，也能創造什麼？', icon: human, color: PIGMENTS.peach },
  { id: 'ball', route: 'ball-test', number: '05', name: '喜愛的作品', english: 'Our shared shelf', question: '留一個午後，交換喜歡的故事。', icon: ball, color: PIGMENTS.strawberry },
  { id: 'potion', route: 'bottled-weather', number: '06', name: '魔法天氣藥水', english: 'Bottled Weather', question: '把一場天氣，倒進世界裡。', icon: potion, color: PIGMENTS.lavender },
]
export const MOTION = { travel: .68, travelRevealDelay: .16, paper: .42, storyLayerMs: 420, parallax: 12, tilt: 3 }
export function pageName(screen) {
  return ({intro:'序章',transitioning:'序章',comic:'創世故事',home:'世界的封面',scene:'魔法師們的研究室','big-test':'魔法師們的研究室','t-comic':'望遠鏡的故事'})[screen] || TOOLS.find(tool=>tool.route===screen)?.name || '研究手冊'
}

export const DESK_OBJECTS = [['catcup','貓咪杯'],['mug','杯子'],['clock','時鐘'],['hourglass','沙漏'],['magglass','放大鏡'],['chair1','研究椅 / 01'],['chair2','研究椅 / 02']]

export const TOOL_REACTION = {ids:['ball','telescope','book-open1','book-close1'],liftRatio:.045,tiltRadians:.009,damping:14}
