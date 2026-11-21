import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { decodeRgbaPng, encodeRgbaPng, cropRgba } from './lib/rgba-png.mjs'

const root=fileURLToPath(new URL('../',import.meta.url)), web='Art/ball/web'
const verifyOnly=process.argv.includes('--verify-only')
const specifications=[
  {id:'lar',count:63,bodySize:[2505,4060],originalFaceSize:[933,846],originalFacePosition:[907,495],crop:{x:203,y:290,width:443,height:402},bodyPosition:{x:1110,y:785},maskedPixels:189},
  {id:'tivbo',count:62,bodySize:[2305,4306],originalFaceSize:[1257,966],originalFacePosition:[523,453],crop:{x:472,y:415,width:436,height:435},bodyPosition:{x:995,y:868},maskedPixels:0},
]
const read=p=>fs.readFileSync(path.join(root,p)), hash=b=>createHash('sha256').update(b).digest('hex')
const pngNames=dir=>fs.readdirSync(path.join(root,dir)).filter(name=>name.endsWith('.PNG')).sort((a,b)=>a.localeCompare(b,'en',{numeric:true}))
const sameColors=(a,b)=>assert.deepEqual(a.colorChunks,b.colorChunks,'Color metadata must match')
const manifest={schemaVersion:1,coordinateSystem:'source pixels, top-left origin; no scaling',format:'lossless RGBA8 PNG',characters:{}}
const audit={schemaVersion:1,verification:'exact integer premultiplied RGBA source-over, zero tolerance',originals:{},outputs:{},characters:{},totalCombinations:0}
const pending=[]

for (const spec of specifications) {
  const baseDir=`Art/ball/${spec.id}`, sourceDir=`${baseDir}/face`, outputDir=`${web}/${spec.id}/face`
  const names=pngNames(sourceDir), poses=pngNames(`${baseDir}/body`)
  assert.deepEqual(names,Array.from({length:spec.count},(_,i)=>`${i+1}.PNG`))
  assert.equal(poses.length,8)
  const basePath=`${baseDir}/body/常規.PNG`, baseBytes=read(basePath), base=decodeRgbaPng(baseBytes)
  assert.deepEqual([base.width,base.height],spec.bodySize)
  const referenceFace=cropRgba(base,{x:spec.originalFacePosition[0],y:spec.originalFacePosition[1],width:spec.originalFaceSize[0],height:spec.originalFaceSize[1]})
  const firstBytes=read(`${sourceDir}/1.PNG`), first=decodeRgbaPng(firstBytes), firstCrop=cropRgba(first,spec.crop), safetyPixels=[]
  for(let pixel=0;pixel<firstCrop.width*firstCrop.height;pixel++) {
    const alpha=firstCrop.data[pixel*4+3]
    if(alpha>0 && alpha<255) safetyPixels.push([pixel%firstCrop.width,Math.floor(pixel/firstCrop.width),alpha])
  }
  assert.equal(safetyPixels.length,spec.maskedPixels,'Previously approved mask changed')
  if(spec.id==='tivbo') for(let i=3;i<firstCrop.data.length;i+=4) assert.equal(firstCrop.data[i],255)
  const maskOffsets=new Set(safetyPixels.map(([x,y])=>(y*spec.crop.width+x)*4+3))
  const faceAlpha=Buffer.from(first.data.filter((_,i)=>i%4===3))
  const poseRegions=[]
  for(const name of poses) {
    const sourcePath=`${baseDir}/body/${name}`, bytes=read(sourcePath), image=decodeRgbaPng(bytes)
    audit.originals[sourcePath]=hash(bytes)
    assert.deepEqual([image.width,image.height],spec.bodySize); sameColors(image,base)
    const region=cropRgba(image,{...spec.bodyPosition,width:spec.crop.width,height:spec.crop.height})
    const baseRegion=cropRgba(base,{...spec.bodyPosition,width:spec.crop.width,height:spec.crop.height})
    assert.ok(region.data.equals(baseRegion.data),`${name}: pose pixels differ in approved region`)
    const head=cropRgba(image,{x:spec.originalFacePosition[0],y:spec.originalFacePosition[1],width:spec.originalFaceSize[0],height:spec.originalFaceSize[1]})
    // Outside the patch, all visible original face pixels must also fit this pose.
    for(let y=0;y<head.height;y++) for(let x=0;x<head.width;x++) {
      if(x>=spec.crop.x && x<spec.crop.x+spec.crop.width && y>=spec.crop.y && y<spec.crop.y+spec.crop.height) continue
      const i=(y*head.width+x)*4
      if(first.data[i+3]) assert.ok(head.data.subarray(i,i+4).equals(referenceFace.data.subarray(i,i+4)),`${name}: incompatible head outside crop`)
    }
    poseRegions.push({name,region})
  }
  let sourceBytes=0,outputBytes=0,modifiedAlpha=0
  const checks=[]
  for(const name of names) {
    const sourcePath=`${sourceDir}/${name}`, bytes=read(sourcePath), image=decodeRgbaPng(bytes)
    sourceBytes+=bytes.length; audit.originals[sourcePath]=hash(bytes)
    assert.deepEqual([image.width,image.height],spec.originalFaceSize); sameColors(image,base)
    const alpha=Buffer.from(image.data.filter((_,i)=>i%4===3))
    assert.ok(alpha.equals(faceAlpha),'Expression silhouette changed')
    // An independent full-face replacement target, built before applying any safety mask.
    // All changes must be inside the crop and fully opaque. Unchanged alpha edges belong to body.
    for(let y=0;y<image.height;y++) for(let x=0;x<image.width;x++) {
      const i=(y*image.width+x)*4, a=image.data[i+3], ba=referenceFace.data[i+3]
      assert.equal(a,ba,`${sourcePath}: source alpha differs from body`)
      if(!a) continue
      const differs=!image.data.subarray(i,i+4).equals(referenceFace.data.subarray(i,i+4))
      const inside=x>=spec.crop.x && x<spec.crop.x+spec.crop.width && y>=spec.crop.y && y<spec.crop.y+spec.crop.height
      if(differs) { assert.ok(inside,`${sourcePath}: drawing change outside crop`); assert.equal(a,255,'Changed antialias detail cannot be suppressed') }
      if(inside && (x<spec.crop.x+8 || x>=spec.crop.x+spec.crop.width-8 || y<spec.crop.y+8 || y>=spec.crop.y+spec.crop.height-8)) assert.ok(!differs,'Safety margin is no longer unchanged')
    }
    const rawCrop=cropRgba(image,spec.crop), optimized={...rawCrop,data:Buffer.from(rawCrop.data)}
    for(const [x,y,alpha] of safetyPixels) {
      const i=(y*rawCrop.width+x)*4, b=((spec.crop.y+y)*referenceFace.width+spec.crop.x+x)*4
      assert.equal(rawCrop.data[i+3],alpha)
      assert.ok(rawCrop.data.subarray(i,i+4).equals(referenceFace.data.subarray(b,b+4)),'Mask would remove changed drawing')
      optimized.data[i+3]=0; modifiedAlpha++
    }
    const encoded=encodeRgbaPng(optimized), outputPath=`${outputDir}/${name}`
    if(verifyOnly) assert.ok(read(outputPath).equals(encoded),`${outputPath}: output differs from deterministic export`)
    const decoded=decodeRgbaPng(verifyOnly?read(outputPath):encoded)
    assert.equal(decoded.width,spec.crop.width); assert.equal(decoded.height,spec.crop.height); sameColors(decoded,image)
    assert.ok(decoded.data.equals(optimized.data),'PNG lossless round-trip failed')
    for(let i=0;i<decoded.data.length;i++) {
      const expected=maskOffsets.has(i)?0:rawCrop.data[i]
      assert.equal(decoded.data[i],expected,`${outputPath}: unexpected channel edit`)
    }
    // Verify standard source-over against the unmodified original-face replacement target.
    // Integer numerators avoid rounding tolerances and floating point allowances.
    for(const {name:pose,region} of poseRegions) {
      for(let y=0;y<decoded.height;y++) for(let x=0;x<decoded.width;x++) {
        const i=(y*decoded.width+x)*4, f=((spec.crop.y+y)*image.width+spec.crop.x+x)*4
        const a=decoded.data[i+3], ba=region.data[i+3], originalAlpha=image.data[f+3]
        const expectedAlpha=originalAlpha?originalAlpha:ba
        assert.equal(a*255+ba*(255-a),expectedAlpha*255,`${outputPath}/${pose}: alpha mismatch`)
        for(let k=0;k<3;k++) {
          const expectedColor=originalAlpha?image.data[f+k]:region.data[i+k]
          assert.equal(decoded.data[i+k]*a*255+region.data[i+k]*ba*(255-a),expectedColor*expectedAlpha*255,`${outputPath}/${pose}: color mismatch`)
        }
      }
      checks.push({face:name,body:pose,mismatchedPixels:0}); audit.totalCombinations++
    }
    outputBytes+=encoded.length; audit.outputs[outputPath]=hash(encoded); pending.push([outputPath,encoded])
  }
  manifest.characters[spec.id]={
    body:{directory:`${baseDir}/body/`,width:base.width,height:base.height,poses},
    face:{sourceDirectory:`${sourceDir}/`,directory:`${outputDir}/`,count:spec.count,files:names,originalWidth:spec.originalFaceSize[0],originalHeight:spec.originalFaceSize[1],originalBodyPosition:{x:spec.originalFacePosition[0],y:spec.originalFacePosition[1]},crop:spec.crop,width:spec.crop.width,height:spec.crop.height,bodyPosition:spec.bodyPosition,safetyMargin:8,
      mask:{mode:spec.maskedPixels?'embedded-alpha':'none',changedChannels:'alpha only; RGB preserved',removedSemitransparentPixels:spec.maskedPixels,coordinates:'cropped face top-left origin',pixels:safetyPixels}},
  }
  audit.characters[spec.id]={faces:spec.count,bodies:poses.length,combinations:checks.length,sourceBytes,outputBytes,width:spec.crop.width,height:spec.crop.height,alphaChangesPerFace:spec.maskedPixels,totalAlphaChanges:modifiedAlpha,rgbaBytesPerFaceBefore:spec.originalFaceSize[0]*spec.originalFaceSize[1]*4,rgbaBytesPerFaceAfter:spec.crop.width*spec.crop.height*4,mismatchedPixels:0,checks}
  console.log(`${spec.id}: ${spec.count} faces / ${checks.length} combinations, zero mismatches, ${sourceBytes} -> ${outputBytes} bytes`)
}
assert.equal(audit.totalCombinations,1000)
// Do not create any assets until both characters pass every assertion.
for(const [p,expected] of Object.entries(audit.originals)) assert.equal(hash(read(p)),expected,`Original changed during run: ${p}`)
if(verifyOnly) {
  const saved=JSON.parse(read(`${web}/verification.json`))
  assert.deepEqual(saved,audit,'Saved verification report differs')
  assert.deepEqual(JSON.parse(read(`${web}/characters.json`)),manifest,'Saved positioning manifest differs')
  for(const spec of specifications) assert.deepEqual(pngNames(`${web}/${spec.id}/face`),manifest.characters[spec.id].face.files)
} else {
  for(const [p,bytes] of pending) {
    const target=path.join(root,p)
    if(fs.existsSync(target) && !fs.readFileSync(target).equals(bytes)) throw Error(`Refusing to overwrite different existing output: ${p}`)
  }
  for(const [p,bytes] of pending) { fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true}); fs.writeFileSync(path.join(root,p),bytes) }
  fs.writeFileSync(path.join(root,web,'characters.json'),JSON.stringify(manifest,null,2)+'\n')
  fs.writeFileSync(path.join(root,web,'verification.json'),JSON.stringify(audit,null,2)+'\n')
  for(const [p,bytes] of pending) assert.ok(read(p).equals(bytes),'Written PNG differs from validated bytes')
}
console.log(verifyOnly?'Verified existing exports, original hashes and all 1000 combinations.':'Wrote 125 lossless PNGs, positioning manifest and verification report. Original hashes unchanged.')
