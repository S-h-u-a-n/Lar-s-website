import test from 'node:test'
import assert from 'node:assert/strict'
import { alignBookAnimation, BOOK_ANIMATION_ORIGIN } from './storybookBookLayout.js'

// Match actual corresponding first-frame silhouette corners after rendering,
// including a moved/resized/rotated editor layout and non-default stage sizes.
test('registered APNG silhouette coincides with openbook through scale and rotation', () => {
  for (const stage of [{width:1920,height:1080},{width:1280,height:800}]) {
    for(const rotation of [0,23,-40]) {
      const book={x:33.878,y:61.87,width:62.82,rotation}
      const a=alignBookAnimation({id:'book-anime',height:9,zIndex:2},book,stage)
      const s=book.width/100*stage.width/3815
      const origin=BOOK_ANIMATION_ORIGIN.split(' ').map(n=>Number(n.replace('%',''))/100)
      const project=(left,top,x,y,cx,cy)=>{
        const rad=rotation*Math.PI/180, dx=x-cx,dy=y-cy
        return [left+cx+dx*Math.cos(rad)-dy*Math.sin(rad),top+cy+dx*Math.sin(rad)+dy*Math.cos(rad)]
      }
      for(const [ox,oy,ax,ay] of [[83,107,73,755],[3751,1057,3741,1705],[1907.5,561,1897.5,1209]]) {
        const p=project(book.x/100*stage.width,book.y/100*stage.height,ox*s,oy*s,3815*s/2,1122*s/2)
        const q=project(a.x/100*stage.width,a.y/100*stage.height,ax*s,ay*s,origin[0]*3798*s,origin[1]*1795*s)
        assert.ok(Math.hypot(p[0]-q[0],p[1]-q[1])<1e-9)
      }
      assert.equal(a.rotation,rotation)
      assert.equal(a.height,undefined)
      assert.equal(a.zIndex,2)
    }
  }
})
