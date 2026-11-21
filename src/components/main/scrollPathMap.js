// Fit path height to traversal order. Loops may rise again, but scroll progress
// must remain reversible and monotone instead of jumping to a later crossing.
export function createScrollPathMap(samples) {
  const blocks=[]
  samples.forEach((point,index)=>{
    blocks.push({start:index,end:index,sum:point.y,count:1})
    while(blocks.length>1){
      const b=blocks[blocks.length-1],a=blocks[blocks.length-2]
      if(a.sum/a.count<=b.sum/b.count)break
      blocks.splice(-2,2,{start:a.start,end:b.end,sum:a.sum+b.sum,count:a.count+b.count})
    }
  })
  const fitted=[]
  for(const block of blocks)for(let i=block.start;i<=block.end;i++)fitted[i]=block.sum/block.count
  const first=fitted[0],last=fitted.at(-1),total=samples.at(-1).length
  // A small arc-length contribution spreads a backtracking loop over scroll
  // distance rather than assigning its whole length to one vertical pixel.
  const x=samples.map((p,i)=>.85*fitted[i]+.15*(first+(last-first)*p.length/total))
  const y=samples.map(p=>p.length),d=x.slice(1).map((v,i)=>(y[i+1]-y[i])/(v-x[i]))
  const slopes=x.map((v,i)=>{
    if(i===0)return d[0]
    if(i===x.length-1)return d.at(-1)
    const a=x[i]-x[i-1],b=x[i+1]-x[i]
    return 3*(a+b)/((a+2*b)/d[i-1]+(2*a+b)/d[i])
  })
  return height=>{
    if(height<=x[0])return y[0]
    if(height>=x.at(-1))return y.at(-1)
    let lo=0,hi=x.length-1
    while(hi-lo>1){const middle=(lo+hi)>>1;if(x[middle]<=height)lo=middle;else hi=middle}
    const h=x[hi]-x[lo],t=(height-x[lo])/h
    return (2*t**3-3*t*t+1)*y[lo]+(t**3-2*t*t+t)*h*slopes[lo]+(-2*t**3+3*t*t)*y[hi]+(t**3-t*t)*h*slopes[hi]
  }
}
