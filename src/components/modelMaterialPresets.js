const pairs = names => names.map(name => name.split(' / '))

const bigColors = {
  '#fbceb6': pairs(['crystalball_base_m_wood_0 / 材質.031']),
  '#fedad7': pairs([
    'Angles_low_Book001_0 / 材質.043', 'Circle_low_Book001_0 / 材質.047',
    'Circle_low001_Book001_0 / 材質.046', 'Palka_low_Book001_0 / 材質.051',
    'Palka_low001_Book001_0 / 材質.050', 'Pisulka_low_Book001_0 / 材質.053',
    'Pisulka_low001_Book001_0 / 材質.052',
  ]),
  '#d3b3c1': pairs(['Belt_low_Book001_0 / 材質.045', 'Belt_low001_Book001_0 / 材質.044']),
  '#ffe2d1': pairs([
    'chair1-back / 材質.037', 'chair1-leg1 / 材質.041', 'chair1-leg2 / 材質.040',
    'chair1-leg3 / 材質.038', 'chair1-leg4 / 材質.039', 'chair2-back / 材質.037',
    'chair2-leg1001 / 材質.041', 'chair2-leg2001 / 材質.040',
    'chair2-leg3001 / 材質.038', 'chair2-leg4001 / 材質.039',
  ]),
  '#ff85a0': pairs(['chair1-backk / 材質.035', 'chair1-hip / 材質.036', 'chair2-backk001 / 材質.035', 'chair2-hip001 / 材質.036', '立方體 / 材質']),
  '#60beca': pairs(['chair1-ball1 / 材質.027', 'chair1-ball2 / 材質.026', 'chair1-ball3 / 材質.025', 'chair1-ball4 / 材質.024', 'chair2-ball1001 / 材質.027', 'chair2-ball2001 / 材質.026', 'chair2-ball3001 / 材質.025', 'chair2-ball4001 / 材質.024']),
  '#fed4bd': pairs(['Oberseite_Uhr_0 / 材質.032', 'Unterseite_Uhr_0 / 材質.033']),
  '#6080ab': pairs([
    'globe-moonrope / 材質.012', 'rope-jupiter / 材質.021', 'rope-mars / 材質.013',
    'rope-mercury / 材質.020', 'rope-neptune / 材質.018', 'rope-pluto / 材質.017',
    'rope-saturn / 材質.016', 'rope-sun / 材質.014', 'rope-uranus / 材質.015', 'rope-venus / 材質.019',
  ]),
  '#ffe7cf': pairs(['ring-top1 / 材質.009', 'ring-top2 / 材質.010', 'ring-top3 / 材質.011', 'globe-ring / 材質.008', 'globe-ruler / 材質.003']),
  '#fff3e8': pairs(['Object_4001 / gold', 'Object_5 / gold']),
  '#f9b0a0': pairs(['defaultMaterial002 / 材質.060', 'defaultMaterial001 / 材質.059', 'defaultMaterial / 材質.058', 'defaultMaterial005 / 材質.061']),
  '#fffdf9': pairs(['Object_6 / paper', 'Object_2007 / 材質.071', 'Object_2009 / 材質.077', 'Object_2012 / 材質.084']),
  '#fff7f4': pairs(['Object_2004 / 材質.065', 'Object_2005 / 材質.067']),
  '#c1a198': pairs(['Object_2006 / 材質.069', 'Object_2008 / 材質.073', 'Object_2010 / 材質.079', 'Object_2011 / 材質.081', 'Object_4003 / 材質.082', 'Object_4004 / 材質.085']),
  '#43adbc': pairs(['table / 材質.006', 'table-leg1 / 材質.007', 'table-leg3 / 材質.004', 'table-leg4 / 材質.005']),
  '#ffa3b7': pairs(['立方體_2 / 材質.002']),
  '#fffefc': pairs(['Object_4002 / 材質.049']),
  '#c8c9c1': pairs(['Object_9 / SIDES']),
  '#f6b6a0': pairs(['圓形 / 材質.028']),
  '#dc9284': pairs(['liquid_phong1_0 / phong1.001']),
  '#a58555': pairs(['Object_3 / sand']),
  '#5d90b6': pairs(['Inkwell_Inkwell_0 / 材質.057']),
}

const bigWhiteMaterials = pairs([
  'crystalball_int_m_glass_0 / m_glass', 'Cover_low_Book001_0 / 材質.048',
  'Pages_low_Book001_0 / 材質.054', 'book_a_0 / 材質.055', 'Object_4 / 材質.042',
  'ink-1 / 材質.056', 'Object_3001 / 材質.034', 'ceramic_cat_0 / material.002',
  'Glas_Glas_0 / Glas', 'Minutenzeiger_Minutenzeiger_0 / Minutenzeiger',
  'Sekundenzeiger_Sekundenzeiger_0 / Sekundenzeiger', 'Stundenzeiger_Stundenzeiger_0 / Stundenzeiger',
  'Sphere_Material002_0 / Material.002', 'globe-item1 / 材質.022', 'globe-item2 / 材質.023',
  'jupiter / Jupiter', 'mars / Mars', 'mercury / Mercury', 'neptune / Neptune', 'pluto / Pluto',
  'Saturn_Saturn_0 / Saturn', 'Saturn_Saturn_0_1 / Ring', 'sun / material', 'uranus / Uranus',
  'venus / Venus', 'Object_2002 / Material.001', 'InkwellPen_InkwellPen_0 / InkwellPen',
  'defaultMaterial004 / lambert1', 'defaultMaterial003 / lambert1', 'Moon_Moon_0 / Moon',
  'Cylinder_0 / 材質.029', 'paper3 / 材質.064', '平面 / 材質.062', '平面001 / 材質.063',
  'Object_6001 / 材質.066', 'Object_6002 / 材質.068', 'Object_6003 / 材質.070',
  'Object_6004 / 材質.072', 'Object_6005 / 材質.076', 'Object_6006 / 材質.078',
  'Object_6007 / 材質.080', 'Object_6008 / 材質.083', 'Object_6009 / 材質.086',
  '立方體_1 / 材質.001', 'Cylinder_Material_0 / 材質.030',
])

const bigTextureDisabled = pairs([
  'crystalball_base_m_wood_0 / 材質.031', 'Angles_low_Book001_0 / 材質.043',
  'Belt_low_Book001_0 / 材質.045', 'Belt_low001_Book001_0 / 材質.044',
  'Circle_low_Book001_0 / 材質.047', 'Circle_low001_Book001_0 / 材質.046',
  'Palka_low_Book001_0 / 材質.051', 'Palka_low001_Book001_0 / 材質.050',
  'Pisulka_low_Book001_0 / 材質.053', 'Pisulka_low001_Book001_0 / 材質.052',
  'Object_6 / paper', 'Object_9 / SIDES', 'Object_4002 / 材質.049', '圓形 / 材質.028',
  'cosmos_core / MAT_cosmos_core',
  'liquid_phong1_0 / phong1.001', 'chair1-back / 材質.037', 'chair1-backk / 材質.035',
  'chair1-hip / 材質.036', 'chair1-leg1 / 材質.041', 'chair1-ball1 / 材質.027',
  'chair1-leg2 / 材質.040', 'chair1-ball2 / 材質.026', 'chair1-leg3 / 材質.038',
  'chair1-ball3 / 材質.025', 'chair1-leg4 / 材質.039', 'chair1-ball4 / 材質.024',
  'chair2-back / 材質.037', 'chair2-backk001 / 材質.035', 'chair2-hip001 / 材質.036',
  'chair2-leg1001 / 材質.041', 'chair2-ball1001 / 材質.027', 'chair2-leg2001 / 材質.040',
  'chair2-ball2001 / 材質.026', 'chair2-leg3001 / 材質.038', 'chair2-ball3001 / 材質.025',
  'chair2-leg4001 / 材質.039', 'chair2-ball4001 / 材質.024', 'Oberseite_Uhr_0 / 材質.032',
  'Unterseite_Uhr_0 / 材質.033', 'cosmos_spark_01 / MAT_cosmos_spark',
  'cosmos_spark_02 / MAT_cosmos_spark', 'cosmos_spark_03 / MAT_cosmos_spark',
  'cosmos_spark_04 / MAT_cosmos_spark', 'cosmos_spark_05 / MAT_cosmos_spark',
  'globe-moonrope / 材質.012', 'rope-jupiter / 材質.021', 'rope-mars / 材質.013',
  'rope-mercury / 材質.020', 'rope-neptune / 材質.018', 'rope-pluto / 材質.017',
  'rope-saturn / 材質.016', 'rope-sun / 材質.014', 'rope-uranus / 材質.015',
  'rope-venus / 材質.019', 'ring-top1 / 材質.009', 'ring-top2 / 材質.010',
  'ring-top3 / 材質.011', 'globe-ring / 材質.008', 'globe-ruler / 材質.003',
  'Object_3 / sand', 'Object_4001 / gold', 'Object_5 / gold', 'Inkwell_Inkwell_0 / 材質.057',
  'defaultMaterial002 / 材質.060', 'defaultMaterial001 / 材質.059', 'defaultMaterial / 材質.058',
  'defaultMaterial005 / 材質.061', 'Object_2004 / 材質.065', 'Object_2005 / 材質.067',
  'Object_2006 / 材質.069', 'Object_2007 / 材質.071', 'Object_2008 / 材質.073',
  'Object_2009 / 材質.077', 'Object_2010 / 材質.079', 'Object_2011 / 材質.081',
  'Object_4003 / 材質.082', 'Object_2012 / 材質.084', 'Object_4004 / 材質.085',
  'table / 材質.006', 'table-leg1 / 材質.007', 'table-leg3 / 材質.004',
  'table-leg4 / 材質.005', '立方體 / 材質', '立方體_2 / 材質.002',
])

function mergeMaterialOverrides(records) {
  const overrides = {}
  for (const [key, values] of records) overrides[key] = { ...overrides[key], ...values }
  return overrides
}

const bigOverrides = mergeMaterialOverrides([
  ...Object.entries(bigColors).flatMap(([color, entries]) => entries.map(([mesh, material]) => [`${mesh} / ${material}`, { color }])),
  ...bigWhiteMaterials.map(([mesh, material]) => [`${mesh} / ${material}`, { color: '#ffffff' }]),
  ...bigTextureDisabled.map(([mesh, material]) => [`${mesh} / ${material}`, { textureEnabled: false }]),
  ['crystalball_ex_m_glass_0 / m_glass', { color: '#ebfaff', opacity: 0.18, roughness: 0.16, metalness: 0, emissive: '#ffffff', emissiveIntensity: 1 }],
  ['crystalball_int_m_glass_0 / m_glass', { color: '#ffffff', roughness: 1, metalness: 1, emissive: '#ffffff', emissiveIntensity: 1 }],
  ['ceramic_cat_0 / material.002', { color: '#ffffff', roughness: 0.7860470414161682 }],
  ['Glas_Glas_0 / Glas', { color: '#ffffff', roughness: 1, metalness: 0.30659300088882446 }],
  ...['Minutenzeiger_Minutenzeiger_0 / Minutenzeiger', 'Sekundenzeiger_Sekundenzeiger_0 / Sekundenzeiger', 'Stundenzeiger_Stundenzeiger_0 / Stundenzeiger', 'defaultMaterial004 / lambert1', 'defaultMaterial003 / lambert1'].map(key => [key, { roughness: 1, metalness: 1 }]),
  ...['jupiter / Jupiter', 'mars / Mars', 'mercury / Mercury', 'neptune / Neptune', 'pluto / Pluto', 'Saturn_Saturn_0 / Saturn', 'sun / material', 'uranus / Uranus', 'venus / Venus', 'Moon_Moon_0 / Moon', 'Sphere_Material002_0 / Material.002'].map(key => [key, { roughness: 1, metalness: 0 }]),
  ['Saturn_Saturn_0_1 / Ring', { roughness: 0.8211145401000977, metalness: 0 }],
  ['liquid_phong1_0 / phong1.001', { color: '#dc9284', opacity: 0, roughness: 0, metalness: 0 }],
  ['cosmos_core / MAT_cosmos_core', { color: '#000000', roughness: 1, metalness: 1, emissive: '#41adce', emissiveIntensity: 1 }],
  ...['01', '02', '03', '04', '05'].map(id => [`cosmos_spark_${id} / MAT_cosmos_spark`, { color: '#000000', roughness: 1, metalness: 1, emissive: '#bfefff', emissiveIntensity: 2.5 }]),
  ['InkwellPen_InkwellPen_0 / InkwellPen', { color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 1 }],
])

const globeOverrides = mergeMaterialOverrides([
  ['cosmos_core / MAT_cosmos_core', { color: '#000000', opacity: 1, roughness: 1, metalness: 1, emissive: '#40ccce', emissiveIntensity: 7.39 }],
  ...['01', '02', '03', '04', '05'].map(id => [`cosmos_plane_${id} / MAT_cosmos_plane`, { color: '#ffffff', opacity: 1, roughness: 0.5, metalness: 0, emissive: '#000000', emissiveIntensity: 3.42 }]),
  ...['01', '02', '03', '04', '05'].map(id => [`cosmos_spark_${id} / MAT_cosmos_spark`, { color: '#000000', opacity: 1, roughness: 1, metalness: 1, emissive: '#bfefff', emissiveIntensity: 8.55 }]),
  ['Sphere_Material002_0 / Material.002', { color: '#ffffff', opacity: 1, roughness: 1, metalness: 0, emissive: '#000000', emissiveIntensity: 3.42 }],
  ...['item-1 / 材質.022', 'item-2 / 材質.023'].map(key => [key, { color: '#ffffff', opacity: 1, roughness: 0.5, metalness: 0, emissive: '#000000', emissiveIntensity: 3.42 }]),
  ...['Moon_Moon_0 / Moon', 'jupiter / Jupiter', 'mars / Mars', 'mercury / Mercury', 'neptune / Neptune', 'pluto / Pluto', 'Saturn_Saturn_0 / Saturn', 'sun / material', 'uranus / Uranus', 'venus / Venus'].map(key => [key, { color: '#ffffff', opacity: 1, roughness: 1, metalness: 0, emissive: '#000000', emissiveIntensity: 3.42 }]),
  ['Saturn_Saturn_0_1 / Ring', { color: '#ffffff', opacity: 1, roughness: 0.8211145401000977, metalness: 0, emissive: '#000000', emissiveIntensity: 3.42 }],
  ['ring / 材質.008', { color: '#fae6d1', opacity: 1, roughness: 0.5, metalness: 0, emissive: '#000000', emissiveIntensity: 3.42 }],
  ...['ring-top1 / 材質.009', 'ring-top2 / 材質.010', 'ring-top3 / 材質.011'].map(key => [key, { color: '#fae5d1', opacity: 1, roughness: 0.5, metalness: 0, emissive: '#000000', emissiveIntensity: 3.42 }]),
  ['ruler / 材質.003', { color: '#ffecd7', opacity: 1, roughness: 0.5, metalness: 0, emissive: '#000000', emissiveIntensity: 3.42 }],
  ...['rope-moon / 材質.012', 'rope-jupiter / 材質.021', 'rope-mars / 材質.013', 'rope-mercury / 材質.020', 'rope-neptune / 材質.018', 'rope-pluto / 材質.017', 'rope-saturn / 材質.016', 'rope-sun / 材質.014', 'rope-uranus / 材質.015', 'rope-venus / 材質.019'].map(key => [key, { color: '#709fbc', opacity: 1, roughness: 0.5, metalness: 0, emissive: '#000000', emissiveIntensity: 3.42 }]),
])

const globeShaderDefaults = Object.fromEntries([
  ...['01', '02', '03', '04', '05'].map(id => [`cosmos_plane_${id} / MAT_cosmos_plane`, { finalHueShift: -7, finalSaturation: 0.92, finalBrightness: 1, finalTint: '#ffffff', finalTintMix: 0 }]),
  ['Sphere_Material002_0 / Material.002', { finalHueShift: -7, finalSaturation: 1.08, finalBrightness: 1, finalTint: '#ffffff', finalTintMix: 0 }],
  ['item-1 / 材質.022', { finalHueShift: -8, finalSaturation: 0.78, finalBrightness: 1.07, finalTint: '#ffffff', finalTintMix: 0 }],
  ['item-2 / 材質.023', { finalHueShift: -8, finalSaturation: 0.78, finalBrightness: 1.07, finalTint: '#ffffff', finalTintMix: 0 }],
  ...['Moon_Moon_0 / Moon', 'jupiter / Jupiter', 'mars / Mars', 'mercury / Mercury', 'neptune / Neptune', 'pluto / Pluto', 'Saturn_Saturn_0 / Saturn', 'Saturn_Saturn_0_1 / Ring', 'sun / material', 'uranus / Uranus', 'venus / Venus'].map(key => [key, { finalHueShift: -7, finalSaturation: 0.92, finalBrightness: 1, finalTint: '#ffffff', finalTintMix: 0 }]),
])

export const MODEL_MATERIAL_PRESETS = {
  'Big.glb': {
    materialDefaults: { opacity: 1, roughness: 0.5, metalness: 0, emissive: '#000000', emissiveIntensity: 1 },
    materials: bigOverrides,
    batch: { scope: 'allMaterials', hueShift: 0, saturation: 0.94, brightness: 1, opacity: 1, roughness: 0.51, roughnessApply: false, metalness: 0, metalnessApply: false, emissiveIntensity: 1 },
  },
  'globe.glb': {
    materials: globeOverrides,
    shaderDefaults: globeShaderDefaults,
    batch: { scope: 'allMaterials', hueShift: -18, saturation: 1.49, brightness: 1.01, opacity: 2, roughness: 0.5, roughnessApply: false, metalness: 0.09, metalnessApply: false, emissiveIntensity: 3.42 },
  },
  'earth-me.glb': {
    materials: {
      'Sphere_Material002_0 / Material.002': {
        color: '#ffffff', opacity: 1, roughness: 0, metalness: 0,
        emissive: '#000000', emissiveIntensity: 3.77, textureEnabled: true,
      },
    },
    shaderDefaults: {
      finalHueShift: -10, finalSaturation: 0.74, finalBrightness: 1.03,
      finalTint: '#ffffff', finalTintMix: 0,
    },
    extensionDefaults: {
      oceanHue: 0, landHue: -11, oceanSaturation: 1.03, landSaturation: 0.6,
      oceanBrightness: 1, landBrightness: 1, greenMix: 0.04,
    },
    batch: { scope: 'allMaterials', hueShift: 1, saturation: 1, brightness: 1, opacity: 1, roughness: 0.5, roughnessApply: false, metalness: 0, metalnessApply: false, emissiveIntensity: 1 },
  },
}

export function applyModelMaterialPreset(root, preset) {
  if (!root || !preset) return
  root.traverse(mesh => {
    if (!mesh.isMesh) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach(material => {
      if (!material) return
      const key = `${mesh.name} / ${material.name}`
      if (preset.materialDefaults) applyMaterialValues(material, preset.materialDefaults)
      const values = preset.materials[key]
      if (values) applyMaterialValues(material, values)
    })
  })
}

function applyMaterialValues(material, values) {
  if (values.color !== undefined) material.color?.set(values.color)
  if (values.opacity !== undefined) {
    material.opacity = values.opacity
    if (values.opacity < 1) material.transparent = true
  }
  if (values.roughness !== undefined && 'roughness' in material) material.roughness = values.roughness
  if (values.metalness !== undefined && 'metalness' in material) material.metalness = values.metalness
  if (values.emissive !== undefined) material.emissive?.set(values.emissive)
  if (values.emissiveIntensity !== undefined && 'emissiveIntensity' in material) material.emissiveIntensity = values.emissiveIntensity
  if (values.textureEnabled === false && 'map' in material && material.map) {
    material.map = null
    material.needsUpdate = true
  }
}