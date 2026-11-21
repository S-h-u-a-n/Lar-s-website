// Independent jigsaw implementation. Coordinates stay in puzzle space on resize.
export const VERSION = 1
export function gridFor(target, ratio) {
  const cols=Math.max(2,Math.round(Math.sqrt(target*ratio)))
  return {cols,rows:Math.max(2,Math.round(target/cols))}
}
export function createPuzzle(width,height,target=24) {
  const {cols,rows}=gridFor(target,width/height),w=900,h=w*height/width
  const cw=w/cols,ch=h/rows,boardW=1500,boardH=Math.max(1000,h*2+400)
  const gx=0,gy=0
  const pieces=[]
  // A shared edge is reversed by the adjacent piece, so contours match exactly.
  const edge=(r,c,axis)=>((Math.imul(r+13,73856093)^Math.imul(c+7,19349663)^axis)&1)?1:-1
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++) {
    const id=r*cols+c
    pieces.push({id,r,c,x:c*cw,y:r*ch,w:cw,h:ch,
      edges:[r? -edge(r-1,c,0):0,c<cols-1?edge(r,c,1):0,r<rows-1?edge(r,c,0):0,c?-edge(r,c-1,1):0]})
  }
  const model={version:VERSION,cols,rows,w,h,cw,ch,boardW,boardH,gx,gy,pieces,positions:pieces.map(p=>({x:0,y:0,group:p.id,locked:false})),order:pieces.map(p=>p.id),layout:'gallery-table-v2'}
  scatterLoose(model)
  return model
}
// Scatter only loose single pieces into bounded trays on both sides of the board.
export function scatterLoose(model,viewport={}) {
  let seed=(Math.random()*4294967296)>>>0
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
  const singles=model.pieces.filter(p=>!model.positions[p.id].locked && groupMembers(model,p.id).length===1)
  const ids=singles.map(p=>p.id)
  for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
  const width=Math.max(1,viewport.width||1200),height=Math.max(1,viewport.height||700),compact=width<700
  const sideMargin=compact?20:Math.min(105,Math.max(70,width*.065))
  const scale=Math.max(.01,Math.min((width-sideMargin*2)/model.w,(height-(compact?150:80))/model.h))
  const visibleHeight=height/scale
  const bandHeight=Math.max(model.h*.78,Math.min(visibleHeight*.86,model.h*1.32))
  const top=model.h/2-bandHeight/2,baseStepY=model.ch*.72
  const baseRows=Math.max(1,Math.floor((bandHeight-model.ch)/baseStepY)+1)
  const baseColumns=Math.ceil(Math.ceil(ids.length/2)/baseRows)
  const spacing=Math.max(.52,.72-Math.max(0,baseColumns-3)*.035)
  const stepX=model.cw*spacing,stepY=model.ch*spacing
  const rows=Math.max(1,Math.floor((bandHeight-model.ch)/stepY)+1)
  const padding=model.cw*.3
  ids.forEach((id,n)=>{
    const position=model.positions[id],side=n%2,rank=Math.floor(n/2),row=rank%rows,column=Math.floor(rank/rows)
    const maxY=top+bandHeight-model.ch
    const jitterX=(random()-.5)*stepX*.3,jitterY=(random()-.5)*stepY*.3
    position.x=side
      ? model.w+padding+column*stepX+jitterX
      : -padding-model.cw-column*stepX+jitterX
    position.y=Math.min(maxY,Math.max(top,top+row*stepY+jitterY))
  })
  model.order=[...model.order.filter(id=>!ids.includes(id)),...ids]
  return ids.length
}

export function piecePath(p) {
  let path='M 0 0'
  const sides=[[0,0,p.w,0,0,-1],[p.w,0,p.w,p.h,1,0],[p.w,p.h,0,p.h,0,1],[0,p.h,0,0,-1,0]]
  sides.forEach(([x,y,ex,ey,nx,ny],i)=>{
    const dx=ex-x,dy=ey-y,a=Math.min(p.w,p.h)*.23*p.edges[i]
    const at=(t,k=0)=>`${x+dx*t+nx*a*k} ${y+dy*t+ny*a*k}`
    path+=` L ${at(.34)}`
    if(a)path+=` C ${at(.44,-.12)} ${at(.35,1)} ${at(.5,1)} C ${at(.65,1)} ${at(.56,-.12)} ${at(.66)}`
    path+=` L ${ex} ${ey}`
  })
  return path+' Z'
}
export function groupMembers(model,id) {const g=model.positions[id].group;return model.positions.map((p,i)=>p.group===g?i:-1).filter(i=>i>=0)}
export function moveGroup(model,id,dx,dy) {for(const i of groupMembers(model,id)){model.positions[i].x+=dx;model.positions[i].y+=dy}}
export function isLocked(model,id){return groupMembers(model,id).some(i=>model.positions[i].locked)}
export function bringToFront(model,id){const ids=groupMembers(model,id);model.order=[...model.order.filter(i=>!ids.includes(i)),...ids]}
export function snapRadius(model,scale,touch=false){return Math.min(touch?15:11,Math.min(model.cw,model.ch)*scale*.25)/scale}
export function findSnap(model,id,radius,board=true) {
  if(isLocked(model,id))return null
  const members=groupMembers(model,id);let best=null
  const consider=c=>{const d=Math.hypot(c.dx,c.dy);if(d<=radius&&(!best||d<best.distance-.001))best={...c,distance:d}}
  for(const i of members){const a=model.pieces[i],pos=model.positions[i]
    if(board)consider({dx:model.gx+a.x-pos.x,dy:model.gy+a.y-pos.y,anchor:true})
    for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){const r=a.r+dr,c=a.c+dc;if(r<0||r>=model.rows||c<0||c>=model.cols)continue
      const j=r*model.cols+c,b=model.pieces[j],q=model.positions[j]
      if(q.group!==pos.group)consider({dx:q.x-(b.x-a.x)-pos.x,dy:q.y-(b.y-a.y)-pos.y,group:q.group,anchor:!!q.locked})
    }
  }
  return best
}
export function settleGroup(model,id,radius=22,board=true) {
  const candidate=findSnap(model,id,radius,board)
  if(!candidate)return {joined:0,locked:false,ids:[]}
  const moving=groupMembers(model,id);moveGroup(model,id,candidate.dx,candidate.dy)
  let group=model.positions[id].group,joined=0
  if(candidate.group!==undefined){for(const i of moving)model.positions[i].group=candidate.group;group=candidate.group;joined++}
  // Subsequent merges must already be exact, preventing chained long-distance pulls.
  let again=true
  while(again){again=false
    for(const i of groupMembers(model,id)){const a=model.pieces[i],pos=model.positions[i]
      for(const [dr,dc] of [[-1,0],[1,0],[0,-1],[0,1]]){const r=a.r+dr,c=a.c+dc;if(r<0||r>=model.rows||c<0||c>=model.cols)continue
        const j=r*model.cols+c,b=model.pieces[j],q=model.positions[j]
        if(q.group!==group&&Math.hypot(q.x-pos.x-(b.x-a.x),q.y-pos.y-(b.y-a.y))<.05){const other=groupMembers(model,j);for(const k of other)model.positions[k].group=group;joined++;again=true}
      }
    }
  }
  const ids=groupMembers(model,id),locked=candidate.anchor||ids.some(i=>model.positions[i].locked)
  if(locked)for(const i of ids){model.positions[i].locked=true;model.positions[i].x=model.gx+model.pieces[i].x;model.positions[i].y=model.gy+model.pieces[i].y}
  return {joined,locked,ids,moving}
}
export function snapGroup(model,id,radius=22){return settleGroup(model,id,radius,false).joined}
export const isSolved=model=>model.positions.every(p=>p.locked)||new Set(model.positions.map(p=>p.group)).size===1
export function restore(model,saved) {
  if(!saved||saved.version!==VERSION||saved.cols!==model.cols||saved.rows!==model.rows||!Array.isArray(saved.positions)||saved.positions.length!==model.pieces.length)return false
  if(saved.positions.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>model.boardW*3||Math.abs(p.y)>model.boardH*3||!Number.isInteger(p.group)||p.group<0||p.group>=model.pieces.length))return false
  // Validate every persisted group is connected and has the correct offsets.
  const groups=new Map()
  saved.positions.forEach((p,i)=>groups.set(p.group,[...(groups.get(p.group)||[]),i]))
  for(const members of groups.values()) {
    const first=members[0],base=saved.positions[first],shape=model.pieces[first],seen=new Set([first]),queue=[first]
    for(const i of members)if(Math.abs(saved.positions[i].x-base.x-(model.pieces[i].x-shape.x))>.05||Math.abs(saved.positions[i].y-base.y-(model.pieces[i].y-shape.y))>.05)return false
    for(let n=0;n<queue.length;n++)for(const i of members)if(!seen.has(i)&&Math.abs(model.pieces[i].r-model.pieces[queue[n]].r)+Math.abs(model.pieces[i].c-model.pieces[queue[n]].c)===1){seen.add(i);queue.push(i)}
    if(seen.size!==members.length)return false
  }
  const legacy=saved.layout!=='gallery-table-v2'
  const positions=saved.positions.map(p=>({...p,x:p.x-(legacy?300:0),y:p.y-(legacy?120:0),locked:!legacy&&p.locked===true}))
  // Locked data is only trusted when it matches the actual board coordinates.
  if(positions.some((p,i)=>p.locked&&Math.hypot(p.x-model.gx-model.pieces[i].x,p.y-model.gy-model.pieces[i].y)>.05))return false
  for(const members of groups.values())if(members.some(i=>positions[i].locked)&&!members.every(i=>positions[i].locked))return false
  model.positions=positions
  model.order=Array.isArray(saved.order)&&saved.order.length===positions.length&&new Set(saved.order).size===positions.length&&saved.order.every(i=>Number.isInteger(i)&&i>=0&&i<positions.length)?[...saved.order]:model.pieces.map(p=>p.id)
  model.hasSaved=true;return true
}
