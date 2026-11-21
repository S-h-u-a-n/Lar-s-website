// Reuse the existing alpha-hit mask. Inspect only the top 18% of the visible
// silhouette, so a spear, skirt or outstretched arm cannot move the head anchor.
export function personContour(geometry, bits) {
  const {maskWidth:w,maskHeight:h}=geometry
  const opaque=(x,y)=>{const n=y*w+x;return Boolean(bits[n>>3]&(128>>(n&7)))}
  let top=h,bottom=-1
  for(let y=0;y<h;y++) for(let x=0;x<w;x++) if(opaque(x,y)){top=Math.min(top,y);bottom=Math.max(bottom,y)}
  if(bottom<top)return null
  const end=Math.min(h-1,top+Math.max(1,Math.round((bottom-top)*.18)))
  let left=null,right=null
  for(let y=top;y<=end;y++) for(let x=0;x<w;x++) if(opaque(x,y)){
    if(!left||x<left.x)left={x,y}
    if(!right||x>right.x)right={x,y}
  }
  return {left:{x:left.x/w,y:(left.y+.5)/h},right:{x:(right.x+1)/w,y:(right.y+.5)/h}}
}
// Use the steady hover scale around the unchanged foot pivot. Ignore transient
// rotation/scale, so the paper itself stays stable throughout the existing sway.
export function personAnchor(contour, pose, hoverScale) {
  const ox=pose.width*pose.origin[0]/100,oy=pose.height*pose.origin[1]/100
  const point=p=>({x:pose.x+ox+(p.x*pose.width-ox)*hoverScale,y:pose.y+oy+(p.y*pose.height-oy)*hoverScale})
  return {right:point(contour.right),left:point(contour.left)}
}
export function labelPosition(anchor, size, viewport, settings) {
  const {edge,gap}=settings,w=size.width,h=size.height
  // Euclidean distance from the paper's lower-left corner to the right contour.
  const offset=gap/Math.SQRT2
  const right={x:anchor.right.x+offset,y:anchor.right.y-offset-h,side:'upper-right'}
  const left={x:anchor.left.x-offset-w,y:anchor.left.y-offset-h,side:'upper-left'}
  const fitsX=p=>p.x>=edge&&p.x+w<=viewport.width-edge
  // Only the viewport can change sides. No other character/title avoidance.
  const p=fitsX(right)?right:fitsX(left)?left:right
  return {...p,x:Math.max(edge,Math.min(viewport.width-w-edge,p.x)),y:Math.max(edge,Math.min(viewport.height-h-edge,p.y)),width:w,height:h}
}
