// Chronological stops derive from the existing foot anchors, not array order
// (the exported assets are lexically ordered). Keep the original end points.
export function eraStops(assets, labels) {
  const people = assets.filter(asset => labels[asset.id]).map(asset => ({ id:asset.id, x:asset.x + asset.width * asset.origin[0] / 100 })).sort((a,b)=>b.x-a.x)
  if (people.length < 2) return people.map(person=>({...person,camera:1}))
  const first = people[0].x, span = first - people.at(-1).x
  return people.map(person=>({...person,camera:(person.x-people.at(-1).x)/span}))
}
export function nextEra(stops, camera, forward) {
  let closest = 0
  for(let i=1;i<stops.length;i++) if(Math.abs(stops[i].camera-camera)<Math.abs(stops[closest].camera-camera)) closest=i
  return stops[Math.max(0,Math.min(stops.length-1,closest+(forward?1:-1)))]?.camera ?? camera
}

export function createHistoryTouch({ tap, swipe, now=()=>performance.now() }) {
  let active=null, suppressUntil=0
  function releaseCapture(event,id) {
    if(event.currentTarget.hasPointerCapture?.(id)) event.currentTarget.releasePointerCapture(id)
  }
  function cancel(event) {
    const old=active;active=null
    if(old) { suppressUntil=now()+400;releaseCapture(event,old.id) }
  }
  return {
    start(event) {
      if(event.pointerType==='mouse')return
      if(!event.isPrimary){cancel(event);return}
      if(event.button!==0)return
      suppressUntil=0
      active={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false}
      event.currentTarget.setPointerCapture?.(event.pointerId)
    },
    move(event) {
      if(!active||active.id!==event.pointerId)return false
      if(Math.hypot(event.clientX-active.x,event.clientY-active.y)>8) active.moved=true
      return active.moved
    },
    end(event) {
      if(!active||active.id!==event.pointerId)return
      const old=active;active=null
      const dx=event.clientX-old.x,dy=event.clientY-old.y
      suppressUntil=now()+400
      releaseCapture(event,old.id)
      if(!old.moved&&Math.hypot(dx,dy)<=8)tap(event.clientX,event.clientY)
      else if(Math.abs(dx)>=48 && Math.abs(dx)>Math.abs(dy)*1.15)swipe(dx>0,Math.abs(dx))
    },
    cancel,
    click(event) { if(event.detail!==0&&now()<suppressUntil){event.preventDefault();event.stopPropagation()} },
    clearClickSuppression() { suppressUntil=0 },
  }
}
