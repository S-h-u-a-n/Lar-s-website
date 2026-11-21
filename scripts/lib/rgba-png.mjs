import { deflateSync, inflateSync } from 'node:zlib'

const signature = Buffer.from([137,80,78,71,13,10,26,10])
const crcTable = Uint32Array.from({ length:256 }, (_, value) => {
  for (let bit=0; bit<8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  return value >>> 0
})
function crc32(bytes) {
  let crc=0xffffffff
  for (const byte of bytes) crc=crcTable[(crc ^ byte) & 255] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}
function paeth(a,b,c) {
  const p=a+b-c, pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c)
  return pa<=pb && pa<=pc ? a : pb<=pc ? b : c
}

// Deliberately restricted to the actual source format. Never silently convert pixels.
export function decodeRgbaPng(png) {
  if (!png.subarray(0,8).equals(signature)) throw Error('Invalid PNG signature')
  let at=8, width, height, ended=false
  const idat=[], colorChunks=[]
  while (at<png.length) {
    const length=png.readUInt32BE(at), end=at+12+length
    if (end>png.length) throw Error('Truncated PNG chunk')
    const type=png.toString('ascii',at+4,at+8), data=png.subarray(at+8,end-4)
    if (crc32(png.subarray(at+4,end-4))!==png.readUInt32BE(end-4)) throw Error(`Invalid ${type} CRC`)
    if (type==='IHDR') {
      width=data.readUInt32BE(0); height=data.readUInt32BE(4)
      if (data[8]!==8 || data[9]!==6 || data[10]!==0 || data[11]!==0 || data[12]!==0) throw Error('Expected noninterlaced RGBA8 PNG')
    } else if (type==='IDAT') idat.push(data)
    else if (['sRGB','iCCP','gAMA','cHRM'].includes(type)) colorChunks.push({type,data:Buffer.from(data)})
    else if (type==='IEND') { ended=true; at=end; break }
    at=end
  }
  if (!ended || at!==png.length || !width || !height) throw Error('Incomplete PNG')
  const raw=inflateSync(Buffer.concat(idat)), stride=width*4, data=Buffer.allocUnsafe(stride*height)
  if (raw.length!==(stride+1)*height) throw Error('Unexpected decompressed length')
  for (let y=0; y<height; y++) {
    const filter=raw[y*(stride+1)], start=y*stride, input=y*(stride+1)+1
    if (filter>4) throw Error('Invalid PNG row filter')
    for (let x=0; x<stride; x++) {
      const a=x>=4?data[start+x-4]:0, b=y?data[start-stride+x]:0, c=y&&x>=4?data[start-stride+x-4]:0
      const prediction=filter===0?0:filter===1?a:filter===2?b:filter===3?(a+b)>>1:paeth(a,b,c)
      data[start+x]=(raw[input+x]+prediction)&255
    }
  }
  return {width,height,data,colorChunks}
}
function chunk(type, data) {
  const result=Buffer.alloc(data.length+12)
  result.writeUInt32BE(data.length,0); result.write(type,4,4,'ascii'); data.copy(result,8)
  result.writeUInt32BE(crc32(result.subarray(4,-4)),result.length-4)
  return result
}
export function encodeRgbaPng(image) {
  const {width,height,data,colorChunks=[]}=image, stride=width*4
  if (data.length!==width*height*4) throw Error('Invalid RGBA data size')
  const filtered=Buffer.allocUnsafe((stride+1)*height), options=Array.from({length:5},()=>Buffer.allocUnsafe(stride))
  for (let y=0; y<height; y++) {
    let best=Infinity, chosen=0
    for (let type=0; type<5; type++) {
      let score=0
      for (let x=0; x<stride; x++) {
        const pos=y*stride+x, a=x>=4?data[pos-4]:0, b=y?data[pos-stride]:0, c=y&&x>=4?data[pos-stride-4]:0
        const prediction=type===0?0:type===1?a:type===2?b:type===3?(a+b)>>1:paeth(a,b,c)
        const value=(data[pos]-prediction)&255
        options[type][x]=value; score+=Math.min(value,256-value)
      }
      if (score<best) { best=score; chosen=type }
    }
    const at=y*(stride+1); filtered[at]=chosen; options[chosen].copy(filtered,at+1)
  }
  const header=Buffer.alloc(13)
  header.writeUInt32BE(width,0); header.writeUInt32BE(height,4); header[8]=8; header[9]=6
  return Buffer.concat([signature,chunk('IHDR',header),...colorChunks.map(({type,data})=>chunk(type,data)),chunk('IDAT',deflateSync(filtered,{level:9})),chunk('IEND',Buffer.alloc(0))])
}
export function cropRgba(image, {x,y,width,height}) {
  if (x<0 || y<0 || x+width>image.width || y+height>image.height) throw Error('Crop outside source')
  const data=Buffer.allocUnsafe(width*height*4)
  for (let row=0; row<height; row++) image.data.copy(data,row*width*4,((y+row)*image.width+x)*4,((y+row)*image.width+x+width)*4)
  return {width,height,data,colorChunks:image.colorChunks}
}
