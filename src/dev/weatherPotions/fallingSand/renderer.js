import { MATERIAL as M, PALETTE as P, POTIONS, RULES as R, WORLD } from './config.js'
import { brushSettings } from './brushSettings.js'
import { paintPlantFlowers } from './flowers.js'

export function createRenderer() {
  const layer=document.createElement('canvas'),context=layer.getContext('2d',{alpha:false})
  let pixels=null,lastWorld=null,lastTick=-1,lastPaint=-1
  return (ctx,world,reduced=false)=>{
    const w=world.columns,h=world.rows
    if(layer.width!==w || layer.height!==h){layer.width=w;layer.height=h;pixels=context.createImageData(w,h);lastTick=-1}
    if(world!==lastWorld || world.tick!==lastTick || world.paintRevision!==lastPaint) {
      const data=pixels.data,mat=world.material
      const gloom=world.cloudiness*.11+world.storm*.06, warmth=Math.max(0,world.light-55)/45
      for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
        const i=y*w+x,offset=i*4,kind=mat[i],noise=(world.tint[i]/255-.5)*10
        const gradient=y/h
        let r=P.skyTop[0]*(1-gradient)+P.skyBottom[0]*gradient+warmth*7-gloom*50
        let g=P.skyTop[1]*(1-gradient)+P.skyBottom[1]*gradient-warmth*2-gloom*45
        let b=P.skyTop[2]*(1-gradient)+P.skyBottom[2]*gradient-warmth*12-gloom*30
        if(kind===M.SOIL) {
          const moisture=world.moisture[i],base=moisture<.6?P.drySoil:P.wetSoil
          const mix=moisture<.6?1-moisture/.6:(moisture-.6)/.4
          r=P.soil[0]*(1-mix)+base[0]*mix+noise;g=P.soil[1]*(1-mix)+base[1]*mix+noise;b=P.soil[2]*(1-mix)+base[2]*mix+noise
          if(y>0 && [M.AIR,M.SNOW].includes(mat[i-w]) && moisture>.25){r-=10;g+=6;b+=2}
        } else if(kind===M.GROWTH) {
          r=P.growth[0]+noise;g=P.growth[1]+noise;b=P.growth[2]+noise
        } else if(kind===M.SAND) {
          const shade=noise*.8-world.moisture[i]*24
          r=P.sand[0]+shade;g=P.sand[1]+shade;b=P.sand[2]+shade
        } else if(kind===M.PLANT) {
          const stress=Math.min(1,world.plantStress[i]/R.plantStressLimit),base=P.plant,dry=P.wilted
          r=base[0]*(1-stress)+dry[0]*stress+noise
          g=base[1]*(1-stress)+dry[1]*stress+noise
          b=base[2]*(1-stress)+dry[2]*stress+noise
        } else if(kind===M.ROCK) {
          const shade=noise*.65+(Math.floor(y/8)%3===0?-5:2)+(world.origin[i]===0?-14:0)
          r=P.rock[0]+shade;g=P.rock[1]+shade;b=P.rock[2]+shade
        } else if(kind===M.WATER) {
          const depth=Math.max(0,y/h-(1-world.seaLevel/100))*22
          r=P.water[0]+noise*.3-depth;g=P.water[1]+noise*.3-depth*.55;b=P.water[2]+noise*.3-depth*.3
          if(y>0 && mat[i-w]===M.AIR){r+=21;g+=22;b+=14}
        } else if(kind===M.ICE || kind===M.SNOW) {
          const base=kind===M.ICE?P.ice:P.snow,edge=y>0&&mat[i-w]===M.AIR?7:-3
          r=base[0]+noise*.4+edge;g=base[1]+noise*.4+edge;b=base[2]+noise*.4+edge
        } else if(kind===M.LAVA) {
          const glow=reduced?7:(Math.sin(world.tick*.2+world.tint[i])*.5+.5)*15
          r=P.lava[0]+glow+noise*.5;g=P.lava[1]+glow;b=P.lava[2]+glow*.2
        } else if(kind===M.STEAM || kind===M.CLOUD) {
          const base=kind===M.STEAM?P.steam:P.cloud,opacity=kind===M.STEAM?.70:.92
          const shade=kind===M.CLOUD && y+1<h && mat[i+w]!==M.CLOUD?-10:0
          r=r*(1-opacity)+(base[0]+noise*.4+shade)*opacity;g=g*(1-opacity)+(base[1]+noise*.4+shade)*opacity;b=b*(1-opacity)+(base[2]+noise*.4+shade)*opacity
        }
        data[offset]=r;data[offset+1]=g;data[offset+2]=b;data[offset+3]=255
      }
      paintPlantFlowers(world,data)
      context.putImageData(pixels,0,0);lastWorld=world;lastTick=world.tick;lastPaint=world.paintRevision
    }
    ctx.clearRect(0,0,WORLD.width,WORLD.height);ctx.imageSmoothingEnabled=false
    ctx.drawImage(layer,0,0,WORLD.width,WORLD.height)
    if(world.light>55) {
      ctx.globalAlpha=Math.min(.65,(world.light-55)/45)*(1-world.cloudiness)
      ctx.fillStyle=P.sunshine;ctx.beginPath();ctx.arc(WORLD.width*.85,WORLD.height*.15,23,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1
    }
    if(world.rainbow>.01) {
      const colours=P.rainbow
      ctx.globalAlpha=world.rainbow*.65
      for(let band=0;band<7;band++) {
        ctx.strokeStyle=colours[band];ctx.lineWidth=5
        ctx.beginPath();ctx.arc(WORLD.width*.62,WORLD.height*.33,120-band*5,Math.PI,2*Math.PI);ctx.stroke()
      }
      ctx.globalAlpha=1
    }
    if(world.input) {
      const p=world.input,colour=POTIONS.find(bottle=>bottle.id===p.type)?.color || '#7fb9ec'
      ctx.strokeStyle=colour;ctx.lineWidth=1.5;ctx.setLineDash([3,5])
      const radius=p.brushSize?brushSettings(p.type,p.strength,p.brushSize).radius/w*WORLD.width:16
      ctx.beginPath();ctx.arc((p.x+.5)/w*WORLD.width,(p.y+.5)/h*WORLD.height,radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])
    }
    // Sunshine/rainbow are light; all terrain, liquids, snow and clouds above
    // are the current grid, never sprites or an animated background.
  }
}
