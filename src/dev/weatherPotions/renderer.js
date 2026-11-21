import { COLORS as C, WORLD } from './config.js'
import { grain, project } from './terrain.js'
import { tileState } from './tileState.js'

function polygon(ctx, points, color) {
  ctx.fillStyle = color
  ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
  ctx.closePath(); ctx.fill()
}
function makeSideTexture(image, right) {
  const source = document.createElement('canvas')
  source.width = source.height = 64
  const ctx = source.getContext('2d', { willReadFrequently: true })
  ctx.imageSmoothingEnabled = false; ctx.drawImage(image, 0, 0, 64, 64)
  const pixels = ctx.getImageData(0, 0, 64, 64)
  const strip = document.createElement('canvas'); strip.width = 32; strip.height = 16
  const output = strip.getContext('2d').createImageData(32, 16)
  for (let y = 0; y < 16; y++) for (let x = 0; x < 32; x++) {
    const sx = right ? x + 32 : x
    const sy = Math.floor((right ? 32 - x / 2 : 16 + x / 2) + y)
    const from = (sy * 64 + sx) * 4, to = (y * 32 + x) * 4
    output.data.set(pixels.data.subarray(from, from + 4), to)
  }
  strip.getContext('2d').putImageData(output, 0, 0)
  return strip
}
function tile(ctx, image, p, opacity = 1, flipX = 1, flipY = 1) {
  if (!image || opacity <= 0) return
  ctx.save(); ctx.translate(p.x, p.y); ctx.scale(flipX, flipY)
  ctx.globalAlpha *= opacity
  ctx.drawImage(image, -(WORLD.tileWidth + .32) / 2, -(WORLD.tileDepth + .16) / 2, WORLD.tileWidth + .32, WORLD.tileDepth + .16)
  ctx.restore()
}
function drawTerrain(ctx, model, order, tiles, patterns) {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height)
  ctx.imageSmoothingEnabled = false
  const w = WORLD.tileWidth / 2 + .2, d = WORLD.tileDepth / 2 + .2
  for (const at of order) {
    const c = model.cells[at], state = tileState(c, model), water = state.submerged
    const wave = water && c.ice < .8 ? Math.sin(c.x * .45 + c.y * .36 + model.time * (1 + model.wind * 3)) * (.08 + model.wind * .65 + model.storm * .4) : 0
    const height = water ? model.seaLevel + wave : c.height + Math.min(4, c.pool * .025)
    const p = project(c.x, c.y, height)
    const right = c.x < WORLD.size - 1 ? model.cells[at + 1] : null
    const left = c.y < WORLD.size - 1 ? model.cells[at + WORLD.size] : null
    const lower = neighbor => neighbor ? Math.max(neighbor.height, model.seaLevel) : WORLD.floor
    const face = (neighbor, side) => {
      const difference = Math.max(0, height - lower(neighbor)) * WORLD.heightScale
      if (difference < .5) return
      const a = [p.x + side * w, p.y], b = [p.x, p.y + d]
      ctx.save()
      polygon(ctx, [a, b, [b[0], b[1] + difference], [a[0], a[1] + difference]], side > 0 ? '#617f87' : '#8d9c8d')
      ctx.clip()
      const pattern = patterns[side > 0 ? 'sideRight' : 'sideLeft']
      if (pattern) {
        ctx.transform(w / 32, side > 0 ? -d / 32 : d / 32, 0, WORLD.tileDepth / 32, side > 0 ? p.x : p.x - w, side > 0 ? p.y + d : p.y)
        ctx.fillStyle = pattern
        ctx.fillRect(0, 0, 32, difference / (WORLD.tileDepth / 32) + 32)
      }
      ctx.restore()
    }
    face(left, -1); face(right, 1)
    if (tiles.images[state.base]) tile(ctx, tiles.images[state.base], p)
    else polygon(ctx, [[p.x, p.y-d],[p.x+w,p.y],[p.x,p.y+d],[p.x-w,p.y]], water ? '#76b4cf' : '#92b299')
    // The same art can be subtly shaded or layered without affecting cell state.
    ctx.globalAlpha = state.shade
    polygon(ctx, [[p.x,p.y-d],[p.x+w,p.y],[p.x,p.y+d],[p.x-w,p.y]], '#34465a')
    ctx.globalAlpha = 1
    tile(ctx, tiles.images.snow, p, state.snow)
    tile(ctx, tiles.images.wet, p, state.wet)
    if (water && c.basalt > .15) tile(ctx, tiles.images.basalt, p, Math.min(.7,c.basalt*.15)/(1+(model.seaLevel-c.height)*.1))
    if (water && c.ice < .5) {
      for (const [dx,dy,fx,fy] of [[-1,0,1,1],[0,-1,-1,1],[1,0,-1,-1],[0,1,1,-1]]) {
        const x=c.x+dx,y=c.y+dy
        const neighbor=x>=0&&y>=0&&x<WORLD.size&&y<WORLD.size?model.cells[y*WORLD.size+x]:null
        if (neighbor && neighbor.height > model.seaLevel) tile(ctx,tiles.images.foam,p,.5+model.wind*.5,fx,fy)
      }
      if ((c.x*3+c.y+Math.floor(model.time*(1+model.wind*3)))%Math.max(4,Math.round(17-model.wind*10))===0) {
        ctx.fillStyle='#deefea';ctx.globalAlpha=.45+model.wind*.35;ctx.fillRect(p.x-2,p.y,4+model.wind*3,1.1+model.storm);ctx.globalAlpha=1
      }
    }
    if (!water && c.height<32 && c.desert<.3 && state.snow<.2 && c.damage<.2 && c.basalt<.2 && grain(c.x+11,c.y-3)>.87) {
      ctx.fillStyle='#557c6b';ctx.fillRect(p.x-1,p.y-4,2.5,4)
      ctx.fillStyle='#80a58a';ctx.fillRect(p.x-2,p.y-7,4.5,3.5)
    }
  }
}
function pixelCloud(ctx, x, y, seed, opacity) {
  ctx.globalAlpha = opacity
  for (let j = -4; j <= 4; j++) for (let i = -10; i <= 10; i++) {
    const radius = i * i / 100 + j * j / 18
    if (radius > 1 + grain(i + seed, j) * .35) continue
    ctx.fillStyle = j > 1 ? '#8da8b6' : grain(i, j + seed) > .4 ? '#d8e5e7' : '#b9cdd4'
    ctx.fillRect(x + i * 4, y + j * 4, 4, 4)
  }
  ctx.globalAlpha = 1
}
function endingDetail(ctx, model) {
  if (model.ending !== 'noah' && model.ending !== 'atlantis') return
  const p = project(WORLD.size * .7, WORLD.size * .65, model.seaLevel + 1)
  ctx.save(); ctx.translate(p.x, p.y)
  if (model.ending === 'noah') {
    ctx.fillStyle = '#806958'; ctx.fillRect(-22, -7, 44, 8); ctx.fillRect(-18, 1, 36, 5); ctx.fillRect(-12, 6, 24, 3)
    ctx.fillStyle = '#ddc7a0'; ctx.fillRect(-11, -19, 22, 12); ctx.fillStyle = '#6c5b51'; ctx.fillRect(-14, -23, 28, 4)
    ctx.fillStyle = '#34465a'; ctx.fillRect(-1, -14, 4, 7)
  } else {
    ctx.globalAlpha = .5; ctx.fillStyle = '#e5ddf5'
    for (const x of [-12, -3, 6]) ctx.fillRect(x, -15, 5, 20)
    ctx.fillRect(-16, -18, 30, 4); ctx.fillRect(-17, 5, 32, 4)
  }
  ctx.restore()
}
export function createRenderer(tiles) {
  const terrainCanvas = document.createElement('canvas')
  terrainCanvas.width = WORLD.width * 1.5; terrainCanvas.height = WORLD.height * 1.5
  const layer = terrainCanvas.getContext('2d')
  layer.scale(1.5, 1.5)
  let lastModel = null, lastTick = -10, lastEnding = null, lastRevision = -1
  const patterns = {}
  const order = Array.from({ length: WORLD.size ** 2 }, (_, i) => i).sort((a, b) => Math.floor(a / WORLD.size) + a % WORLD.size - Math.floor(b / WORLD.size) - b % WORLD.size || a - b)
  return (ctx, model, reduced = false) => {
    ctx.clearRect(0, 0, WORLD.width, WORLD.height)
    ctx.imageSmoothingEnabled = false
    if (lastRevision !== tiles.revision) {
      for (const id of ['sideLeft','sideRight']) if (tiles.images[id]) patterns[id] = layer.createPattern(makeSideTexture(tiles.images[id],id==='sideRight'),'repeat')
    }
    if (model !== lastModel || model.tick - lastTick >= 3 || model.ending !== lastEnding || lastRevision !== tiles.revision) {
      drawTerrain(layer, model, order, tiles, patterns)
      lastModel = model; lastTick = model.tick; lastEnding = model.ending; lastRevision = tiles.revision
    }
    // Even the sky objects are assembled from small pixels.
    const drift = reduced ? 0 : model.cloudOffset
    const clouds = [[254,118,2],[601,147,9],[430,100,15],[355,159,21]]
    for (const [x,y,seed] of clouds) {
      const stormX = 430+Math.cos(model.time*.65+seed)*100
      const stormY = 155+Math.sin(model.time*.65+seed)*35
      const px=((x+drift+50)%740)-10
      pixelCloud(ctx,px*(1-model.storm)+stormX*model.storm,y*(1-model.storm)+stormY*model.storm,seed,model.cloudiness*(.5+seed%3*.1))
    }
    if (model.rainbow > .01) {
      const colors=['#e6a0a9','#e8bd9e','#e6d68c','#a2bda1','#91bfd3','#a4b1d3','#bfadcf']
      ctx.globalAlpha=model.rainbow*.8
      for (let band=0;band<7;band++) for (let step=0;step<=65;step++) {
        const angle=Math.PI+step/65*Math.PI,radius=112-band*4
        ctx.fillStyle=colors[band];ctx.fillRect(Math.round(430+Math.cos(angle)*radius),Math.round(207+Math.sin(angle)*radius*.72),4,4)
      }
      ctx.globalAlpha=1
    }
    if (model.light > 55) {
      for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (x * x + y * y < 24) {
        ctx.fillStyle = grain(x, y) > .5 ? '#f6f0a9' : '#e7cc81'; ctx.globalAlpha = (model.light - 55) / 45 * .7
        ctx.fillRect(643 + x * 4, 88 + y * 4, 4, 4)
      }
      ctx.globalAlpha = 1
    }
    const corners = [[0, 0], [WORLD.size - 1, 0], [WORLD.size - 1, WORLD.size - 1], [0, WORLD.size - 1]].map(([x, y]) => project(x, y, WORLD.floor - 3))
    ctx.globalAlpha = .12; polygon(ctx, corners.map(p => [p.x, p.y + 12]), '#34465a'); ctx.globalAlpha = 1
    ctx.drawImage(terrainCanvas, 0, 0, WORLD.width, WORLD.height)
    for (const p of model.vapor) {
      const point = project(p.x, p.y, p.z)
      const steam=p.type==='steam'
      ctx.globalAlpha = Math.max(0, 1 - p.age / (steam ? 5 : 4)) * (steam ? .8 : .38); ctx.fillStyle = steam ? '#d7e0dc' : C.vapor
      const size=steam?4+p.age:2.5
      ctx.fillRect(point.x, point.y, size, size+1)
    }
    ctx.globalAlpha = 1
    for (const p of [...model.particles].sort((a, b) => a.x + a.y - b.x - b.y)) {
      const point = project(p.x, p.y, p.z)
      ctx.fillStyle = p.type === 'snow' ? '#fffef8' : p.type==='lava'?'#ecac75':C.rain
      ctx.globalAlpha = p.type === 'snow' ? .9 : .8
      ctx.fillRect(point.x, point.y, p.type==='lava'?4:p.type === 'snow' ? 3 : 1.5, p.type==='lava'?4:p.type === 'snow' ? 3 : 7)
      if (p.type==='rain'&&model.wind>.3) ctx.fillRect(point.x+2,point.y-3,1.5,3)
    }
    ctx.globalAlpha = 1
    endingDetail(ctx, model)
    if (model.input) {
      const c = model.cells[Math.floor(model.input.y) * WORLD.size + Math.floor(model.input.x)]
      const p = project(model.input.x, model.input.y, Math.max(c.height, model.seaLevel) + 2)
      ctx.strokeStyle = model.input.type === 'sun' ? '#d6af54' : model.input.type === 'rain' ? '#7fb9ec' : '#a2d8de'
      ctx.lineWidth = 1; ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.ellipse(p.x, p.y, 37, 18, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([])
    }
  }
}
