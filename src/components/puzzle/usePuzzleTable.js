import {useEffect,useRef,useState} from 'react'
import {piecePath,groupMembers,moveGroup,isLocked,bringToFront,snapRadius,findSnap,settleGroup,isSolved,scatterLoose} from './engine'
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n))
const ease=t=>1-(1-t)**3
export default function usePuzzleTable({model,image,reduced,onCommit,onMessage,onSolved}) {
  const canvas=useRef(null),api=useRef({}),[zoomLabel,setZoomLabel]=useState(100)
  const callbacks=useRef({onCommit,onMessage,onSolved});callbacks.current={onCommit,onMessage,onSolved}
  const fade=useRef(0)
  useEffect(()=>{
    const el=canvas.current,ctx=el.getContext('2d'),paths=model.pieces.map(p=>new Path2D(piecePath(p)))
    let raf=0,disposed=false,zoom=1,pan={x:0,y:0},mode='board',selected=null,hover=null,drag=null,candidate=null,transition=null,pulse=null,view={scale:1,x:0,y:0},pointers=new Map(),intro=performance.now(),finished=isSolved(model),completionStart=0,cameraTween=null
    fade.current=finished?1:0
    const say=text=>callbacks.current.onMessage(text)
    function bounds(){const xs=[0,model.w],ys=[0,model.h];model.positions.forEach(p=>{xs.push(p.x-model.cw*.25,p.x+model.cw*1.25);ys.push(p.y-model.ch*.25,p.y+model.ch*1.25)});return {left:Math.min(...xs),right:Math.max(...xs),top:Math.min(...ys),bottom:Math.max(...ys)}}
    function camera(w,h){const compact=w<700
      if(mode==='all'){const b=bounds(),s=Math.min((w-40)/(b.right-b.left),(h-40)/(b.bottom-b.top))*zoom;return {scale:s,x:w/2-(b.left+b.right)/2*s+pan.x,y:h/2-(b.top+b.bottom)/2*s+pan.y}}
      const side=compact?20:clamp(w*.065,70,105),s=Math.min((w-side*2)/model.w,(h-(compact?150:80))/model.h)*zoom
      return {scale:s,x:(w-model.w*s)/2+pan.x,y:(compact?h*.30:h/2)-model.h*s/2+pan.y}
    }
    function render(now=performance.now()) {
      raf=0;if(disposed)return
      const rect=el.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=Math.min(devicePixelRatio||1,2)
      if(!w||!h)return
      if(el.width!==Math.round(w*dpr)||el.height!==Math.round(h*dpr)){el.width=Math.round(w*dpr);el.height=Math.round(h*dpr)}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);view=camera(w,h)
      if(cameraTween){const t=clamp((now-cameraTween.start)/850,0,1),a=ease(t);view={scale:cameraTween.from.scale+(view.scale-cameraTween.from.scale)*a,x:cameraTween.from.x+(view.x-cameraTween.from.x)*a,y:cameraTween.from.y+(view.y-cameraTween.from.y)*a};if(t===1)cameraTween=null}
      ctx.translate(view.x,view.y);ctx.scale(view.scale,view.scale)
      const s=view.scale,c=model,corner=22/s
      ctx.fillStyle='#fffef8';ctx.fillRect(0,0,c.w,c.h)
      ctx.strokeStyle='#c7bab1';ctx.lineWidth=1/s;ctx.strokeRect(0,0,c.w,c.h)
      ctx.strokeStyle=candidate?.anchor?'#4a9f9a':getComputedStyle(el).getPropertyValue('--edition-nav-banner').trim()||'#c8e9e7';ctx.lineWidth=3/s
      for(const [x,y,sx,sy] of [[0,0,1,1],[c.w,0,-1,1],[0,c.h,1,-1],[c.w,c.h,-1,-1]]){ctx.beginPath();ctx.moveTo(x,y+sy*corner);ctx.lineTo(x,y);ctx.lineTo(x+sx*corner,y);ctx.stroke()}
      const solved=isSolved(model)
      if(solved){if(!finished){finished=true;completionStart=now;fade.current=reduced?1:0}fade.current=reduced||!completionStart?1:clamp((now-completionStart-250)/650,0,1)}
      const elapsed=now-intro,enter=reduced||model.hasSaved?1:clamp(elapsed/460,0,1)
      const t=transition?clamp((now-transition.start)/(transition.duration||170),0,1):1
      const counts=new Map();for(const p of c.positions)counts.set(p.group,(counts.get(p.group)||0)+1)
      const moving=drag?.kind==='piece'?new Set(groupMembers(model,drag.id)):new Set()
      for(const id of model.order){const piece=c.pieces[id],pos=c.positions[id];let x=pos.x,y=pos.y
        if(transition?.from[id]&&t<1){x=transition.from[id].x+(x-transition.from[id].x)*ease(t);y=transition.from[id].y+(y-transition.from[id].y)*ease(t)}
        if(enter<1&&!pos.locked){x+=(pos.x<0?-18:18)*(1-ease(enter))/s}
        ctx.save();ctx.globalAlpha=enter;ctx.translate(x,y)
        ctx.shadowColor=pos.locked?'transparent':'#34465a30';ctx.shadowBlur=(moving.has(id)?16:3)/s;ctx.shadowOffsetY=(moving.has(id)?7:2)/s;ctx.fillStyle='#fffef8';ctx.fill(paths[id]);ctx.shadowColor='transparent'
        if(image){ctx.save();ctx.clip(paths[id]);ctx.drawImage(image,-piece.x,-piece.y,c.w,c.h);ctx.restore()}
        ctx.globalAlpha=enter*(1-fade.current)
        const joined=counts.get(pos.group)>1
        ctx.strokeStyle=moving.has(id)?(candidate?'#55978b':'#487e8c'):selected===id||hover===id?'#548b89':joined?'#34465a35':'#34465a70';ctx.lineWidth=(selected===id?1.6:.7)/s;ctx.stroke(paths[id]);ctx.restore()
      }
      if(pulse){const pt=clamp((now-pulse.start)/380,0,1);ctx.globalAlpha=1-pt;ctx.strokeStyle=pulse.locked?'#55978b':'#73aaa7';ctx.lineWidth=2/s
        for(const id of pulse.ids){const p=c.positions[id];ctx.save();ctx.translate(p.x,p.y);ctx.stroke(paths[id]);ctx.restore()}ctx.globalAlpha=1;if(pt===1)pulse=null}
      if(transition&&t===1)transition=null
      if(enter<1||transition||cameraTween||pulse||(solved&&fade.current<1))wake()
    }
    function wake(){if(!raf&&!disposed)raf=requestAnimationFrame(render)}
    function world(clientX,clientY){const r=el.getBoundingClientRect();return {x:(clientX-r.left-view.x)/view.scale,y:(clientY-r.top-view.y)/view.scale}}
    function hit(p){ctx.save();ctx.resetTransform();let found=null;for(const id of [...model.order].reverse()){const q=model.positions[id];if(ctx.isPointInPath(paths[id],p.x-q.x,p.y-q.y)){found=id;break}}ctx.restore();return found}
    function commit(){
      if(isSolved(model)&&!finished){
        finished=true;completionStart=performance.now();selected=null;hover=null;pulse=null
        if(!reduced)cameraTween={from:{...view},start:completionStart}
        const from=Object.fromEntries(model.positions.map((p,i)=>[i,{x:p.x,y:p.y}]))
        for(const p of model.pieces){Object.assign(model.positions[p.id],{x:model.gx+p.x,y:model.gy+p.y,locked:true})}
        if(!reduced)transition={from:transition?.from||from,start:performance.now(),duration:650}
        mode='board';zoom=1;pan={x:0,y:0};setZoomLabel(100)
        callbacks.current.onCommit();callbacks.current.onSolved()
      }else callbacks.current.onCommit()
      wake()
    }
    function drop(event,cancel=false){if(!drag)return;if(event&&drag.pointer!==event.pointerId&&drag.kind!=='pinch')return
      const d=drag;drag=null;candidate=null
      if(d.kind==='piece'){
        if(cancel){for(const [id,p] of Object.entries(d.original))Object.assign(model.positions[id],p);wake();return}
        const before=Object.fromEntries(model.positions.map((p,i)=>[i,{x:p.x,y:p.y}]))
        const result=settleGroup(model,d.id,snapRadius(model,view.scale,d.touch))
        if(result.ids.length){transition=reduced?null:{from:before,start:performance.now()};pulse=reduced?null:{ids:result.ids,start:performance.now(),locked:result.locked};say(isSolved(model)?'拼圖完成！':result.locked?'已放入正確位置':`已接合，${groupMembers(model,d.id).length} 片一起移動`)}
        commit()
      }
      el.style.cursor='grab';wake()
    }
    function down(e){if(e.button!==0||!image)return;e.preventDefault();el.focus({preventScroll:true});el.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY})
      if(pointers.size===2){drop(null);const [a,b]=[...pointers.values()];drag={kind:'pinch',distance:Math.hypot(a.x-b.x,a.y-b.y),zoom,center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};return}
      const p=world(e.clientX,e.clientY),id=hit(p)
      if(id!==null&&isLocked(model,id)){pulse={ids:groupMembers(model,id),start:performance.now(),locked:true};say('這一組已定位');wake();return}
      if(id!==null&&!isSolved(model)){selected=id;bringToFront(model,id);const ids=groupMembers(model,id);drag={kind:'piece',pointer:e.pointerId,id,last:p,touch:e.pointerType==='touch',original:Object.fromEntries(ids.map(i=>[i,{...model.positions[i]}]))};say(`已拿起${ids.length>1?ids.length+' 片拼片':'第 '+(id+1)+' 片'}`)}
      else drag={kind:'pan',pointer:e.pointerId,x:e.clientX,y:e.clientY}
      el.style.cursor='grabbing';wake()
    }
    function changeZoom(value){zoom=clamp(value,.45,3);setZoomLabel(Math.round(zoom*100));wake()}
    function move(e){if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY})
      if(drag?.kind==='pinch'){if(pointers.size<2)return;const[a,b]=[...pointers.values()],center={x:(a.x+b.x)/2,y:(a.y+b.y)/2};pan.x+=center.x-drag.center.x;pan.y+=center.y-drag.center.y;drag.center=center;changeZoom(drag.zoom*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(8,drag.distance));return}
      if(drag?.pointer===e.pointerId){if(drag.kind==='pan'){pan.x+=e.clientX-drag.x;pan.y+=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY}else {const p=world(e.clientX,e.clientY);moveGroup(model,drag.id,p.x-drag.last.x,p.y-drag.last.y);drag.last=p;candidate=findSnap(model,drag.id,snapRadius(model,view.scale,drag.touch))}wake();return}
      const id=hit(world(e.clientX,e.clientY));if(id!==hover){hover=id;el.style.cursor=id!==null&&isLocked(model,id)?'default':'grab';wake()}
    }
    function up(e){pointers.delete(e.pointerId);drop(e,e.type==='pointercancel');if(drag?.kind==='pinch'&&pointers.size<2)drag=null}
    function focusPiece(id){const p=model.positions[id],r=el.getBoundingClientRect(),x=view.x+(p.x+model.cw/2)*view.scale,y=view.y+(p.y+model.ch/2)*view.scale;if(x<30||x>r.width-30||y<30||y>r.height-30){pan.x+=r.width/2-x;pan.y+=r.height/2-y}}
    function nextPiece(){const free=model.order.filter(id=>!isLocked(model,id)),at=free.indexOf(selected);if(!free.length)return;selected=free[(at+1)%free.length];bringToFront(model,selected);focusPiece(selected);say(`已選取第 ${selected+1} 片`);wake()}
    function key(e){const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key]
      if(e.key==='Escape'){drop(null,true);selected=null;wake()}
      if(e.key===' '){e.preventDefault();nextPiece()}
      if(delta){e.preventDefault();if(selected!==null&&!isLocked(model,selected)&&!isSolved(model)){moveGroup(model,selected,delta[0]*(e.shiftKey?2:10)/view.scale,delta[1]*(e.shiftKey?2:10)/view.scale);focusPiece(selected);commit()}else{pan.x-=delta[0]*30;pan.y-=delta[1]*30;wake()}}
      if(e.key==='Enter'&&selected!==null&&!isSolved(model)){e.preventDefault();const result=settleGroup(model,selected,snapRadius(model,view.scale));say(result.locked?'已定位':result.joined?'已接合':'附近沒有正確接合位置');pulse={ids:result.ids,start:performance.now(),locked:result.locked};commit()}
    }
    const wheel=e=>{e.preventDefault();if(e.ctrlKey||e.metaKey)changeZoom(zoom*Math.exp(-e.deltaY*.005));else{pan.x-=e.deltaX;pan.y-=e.deltaY;wake()}}
    const cancel=()=>{drop(null);pointers.clear()}
    el.addEventListener('pointerdown',down);el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);el.addEventListener('keydown',key);el.addEventListener('wheel',wheel,{passive:false});window.addEventListener('blur',cancel)
    const resize=new ResizeObserver(()=>{cancel();wake()});resize.observe(el)
    api.current={zoom:delta=>changeZoom(zoom+delta),fit:(all=false)=>{mode=all?'all':'board';zoom=1;pan={x:0,y:0};setZoomLabel(100);wake()},next:nextPiece,arrange:()=>{drop(null);const rect=el.getBoundingClientRect(),count=scatterLoose(model,{width:rect.width,height:rect.height});mode='all';zoom=1;pan={x:0,y:0};setZoomLabel(100);say(count?`已展開 ${count} 片散片，已接合群組保持原位`:'沒有可展開的單片');commit()},finish:()=>drop(null)}
    setZoomLabel(100);wake()
    return()=>{disposed=true;cancelAnimationFrame(raf);resize.disconnect();el.removeEventListener('pointerdown',down);el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);el.removeEventListener('lostpointercapture',up);el.removeEventListener('keydown',key);el.removeEventListener('wheel',wheel);window.removeEventListener('blur',cancel)}
  },[model,image,reduced])
  return {canvas,api,zoomLabel}
}
