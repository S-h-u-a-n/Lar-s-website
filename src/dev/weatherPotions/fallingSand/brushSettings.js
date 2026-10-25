import { BRUSH_SIZES, RULES as R } from './config.js'

// The footprint determines flow, sampling distance and local effects together.
// A material's own density/flow remains independent of its optical/thermal role.
export function brushSettings(type, strength=R.defaultStrength, size=R.defaultBrush) {
  const preset=BRUSH_SIZES.find(p=>p.id===size) || BRUSH_SIZES[1]
  const dose=Math.min(1,Math.max(.1,Number.isFinite(strength)?strength:R.defaultStrength))
  const radius=Math.max(.65,(R.brushRadius[type] || 5)*preset.scale*Math.sqrt(dose))
  const area=Math.PI*radius*radius
  return {
    size:preset.id,radius,area,
    spacing:Math.min(1,radius*.65),
    dabs:Math.max(1,Math.ceil(area*(R.brushDensity[type] || .1))),
    flow:area*(R.brushFlowPerCell[type] || 0)*dose,
    power:.65*preset.scale/.60,
  }
}
