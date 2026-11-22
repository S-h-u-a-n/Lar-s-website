const pose = (x=0,y=0,rotate=0,scale=1) => `translate(${x}px, ${y}px) rotate(${rotate}deg) scale(${scale})`
export const INTRO_IDENTITY = pose()
const path = (start,middle,settle) => [
  {transform:pose(...start),offset:0},
  {transform:pose(...middle),offset:.64,easing:'cubic-bezier(.22,.75,.25,1)'},
  {transform:pose(...settle),offset:.86},
  {transform:INTRO_IDENTITY,offset:1},
]

// Only relative, additive motions: the live BallTest layout supplies every
// landing position. No final left/top/width/height values are written.
export function introChoreography(kind,index,{width:w,height:h},rect={left:0,top:0,width:0,height:0}) {
  let delay=0,duration=1000,frames
  const side=index%2 ? 1 : -1
  if(kind==='geometry') {
    delay=80+index*70;duration=1150+index*20
    frames=path([side*w*.6,(index%3-1)*h*.7,side*210,.18],[-side*30,-18,-side*12,1.12],[side*7,5,side*3,.98])
  } else if(kind==='title') {
    delay=160;duration=1150
    frames=path([-w*.8,-h*.22,-14,.66],[28,5,3,1.04],[-7,-2,-1,1])
  } else if(kind==='character') {
    const direction=rect.left+rect.width/2<w/2?-1:1
    delay=410+(direction===1?160:0);duration=1550
    frames=path([direction*w*.6,h*.7,direction*29,.52],[-direction*25,-20,-direction*6,1.035],[direction*6,5,direction*1.2,.995])
  } else if(kind==='poster') {
    delay=700+index*150;duration=1450
    const dx=w*.5-(rect.left+rect.width/2),dy=h*.48-(rect.top+rect.height/2)
    frames=[
      {transform:pose(dx,dy,side*(115+index*18),.12),offset:0},
      {transform:pose(dx+side*w*.11,dy-h*.24,-side*24,.8),offset:.34},
      {transform:pose(-side*14,-8,side*4,1.025),offset:.78},
      {transform:INTRO_IDENTITY,offset:1},
    ]
  } else if(kind==='tools' || kind==='back' || kind==='arrow') {
    delay=kind==='tools'?1820:kind==='back'?1900:1880+index*80;duration=700
    frames=path([kind==='tools'?w*.3:0,kind==='arrow'?side*70:-85,side*7,.86],[0,5,-side*2,1.02],[0,-2,0,1])
  } else if(kind==='dialogue') {
    delay=2200;duration=900
    frames=path([0,h*.4,-2,.85],[0,-12,1,1.015],[0,4,-.3,1])
  } else if(kind==='credit') {
    delay=2600;duration=500;frames=path([0,18,0,.98],[0,-2,0,1],[0,0,0,1])
  } else if(kind==='seal') {
    delay=0;duration=1150
    frames=[{transform:pose(0,0,-80,.15),offset:0},{transform:pose(0,0,15,1.25),offset:.55},{transform:pose(0,0,70,1.9),offset:1}]
  } else if(kind==='spark') {
    delay=2400+index*75;duration=650
    frames=[{transform:pose(-side*30,25,-60,.1),offset:0},{transform:pose(0,-6,18,1.3),offset:.45},{transform:pose(side*16,-22,55,.5),offset:1}]
  } else throw new Error(`Unknown Ball intro track: ${kind}`)
  const transient=kind==='seal'||kind==='spark'
  return {kind,delay,duration,frames,transient}
}

export function collectIntroTracks(host,viewport) {
  const groups=[
    ['geometry','.ball-background > i'],['title','.ball-header h1'],
    ['character','.ball-portrait-left, .ball-portrait-right'],['poster','.ball-cover-window > .ball-cover'],
    ['tools','.ball-header-tools'],['back','.ball-back'],['arrow','.ball-arrow'],
    ['dialogue','.ball-character-dialogue-slot'],['credit','.ball-credit'],['seal','.bit-seal'],['spark','.bit-spark'],
  ]
  return groups.flatMap(([kind,selector])=>[...host.querySelectorAll(selector)].map((node,index)=>{
    const track=introChoreography(kind,index,viewport,node.getBoundingClientRect())
    return {...track,node,opacity:kind==='geometry'?Number(getComputedStyle(node).opacity):1}
  }))
}
