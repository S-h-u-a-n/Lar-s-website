const UNIFORM_KEYS = {
  oceanHue: ['earthOceanHueShift', value => value / 360],
  landHue: ['earthLandHueShift', value => value / 360],
  oceanSaturation: ['earthOceanSaturation', value => value],
  landSaturation: ['earthLandSaturation', value => value],
  oceanBrightness: ['earthOceanBrightness', value => value],
  landBrightness: ['earthLandBrightness', value => value],
  greenMix: ['earthGreenHueShift', value => value],
}

export function createEarthShaderEditorState(defaultValues = {}) {
  const values = {
    oceanHue: 0,
    landHue: 0,
    oceanSaturation: 1,
    landSaturation: 1,
    oceanBrightness: 1,
    landBrightness: 1,
    greenMix: 0,
    ...defaultValues,
  }
  const uniformSets = new Set()

  return {
    values,
    bindUniforms(shaderUniforms) {
      const uniforms = {}
      for (const [key, [name, convert]] of Object.entries(UNIFORM_KEYS)) {
        uniforms[name] = { value: convert(values[key]) }
      }
      Object.assign(shaderUniforms, uniforms)
      uniformSets.add(uniforms)
      return uniforms
    },
    setValue(key, value) {
      values[key] = value
      const [name, convert] = UNIFORM_KEYS[key]
      for (const uniforms of uniformSets) {
        if (uniforms[name]) uniforms[name].value = convert(value)
      }
    },
  }
}

export function createEarthMaterialEditorExtension(shaderState) {
  return {
    id: 'earth-color',
    label: 'Earth Color Controls',
    controls: () => [
      range('oceanHue', 'Ocean Hue', -180, 180, 1),
      range('landHue', 'Land Hue', -180, 180, 1),
      range('oceanSaturation', 'Ocean Saturation', 0, 2, 0.01),
      range('landSaturation', 'Land Saturation', 0, 2, 0.01),
      range('oceanBrightness', 'Ocean Brightness', 0, 2, 0.01),
      range('landBrightness', 'Land Brightness', 0, 2, 0.01),
      range('greenMix', 'Green Mix', 0, 0.25, 0.005),
    ],
  }

  function range(id, label, min, max, step) {
    return {
      id,
      label,
      type: 'range',
      min,
      max,
      step,
      getValue: () => shaderState.values[id],
      setValue: value => shaderState.setValue(id, value),
    }
  }
}