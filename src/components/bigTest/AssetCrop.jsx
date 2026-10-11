import { useId } from 'react'

// SVG viewBox crops existing raster pixels; the tint uses those same alpha pixels.
export default function AssetCrop({ src, crop, tint, className }) {
  const filterId = `tint-${useId().replace(/:/g, '')}`
  return <svg className={className} viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`} aria-hidden="true" focusable="false">
    <defs><filter id={filterId} colorInterpolationFilters="sRGB"><feFlood floodColor={tint || '#fff'} /><feComposite in2="SourceAlpha" operator="in" /></filter></defs>
    <image href={src} width="2048" height="1170" />
    {tint && <image className="big-test-asset-tint" href={src} width="2048" height="1170" filter={`url(#${filterId})`} />}
  </svg>
}
