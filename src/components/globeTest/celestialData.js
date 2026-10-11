export const BODIES = ['earth','moon','jupiter','mars','mercury','neptune','pluto','saturn','uranus','venus','sun'].map(id => ({
  id, name: id[0].toUpperCase() + id.slice(1), subtitle: id === 'earth' ? 'Six places to begin a journey' : 'An entry in our celestial notebook',
  introduction: `Our class built this ${id} model to explore the sky together. This notebook will hold our observations.`,
  research: 'Research in progress. Add measurements, comparisons and field sketches here.',
  annotation: 'Student note: Every good question deserves another look.', illustration: null,
}))
export const CONTINENTS = [ ['asia','Asia'], ['europe','Europe'], ['africa','Africa'], ['north-america','North America'], ['south-america','South America'], ['oceania','Oceania'] ].map(([id,name]) => ({ id, name, introduction: `A student field notebook for ${name}. Future geography, observations and illustrations belong here.`, marker: null }))
// marker: null is intentional. Future markers need validated model-local positions,
// surface normals and the earth mesh transform; never guessed screen coordinates.
