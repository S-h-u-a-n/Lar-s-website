const INTERACTION_DEFINITIONS = [
  { id: 'ball', type: 'portal', match: { kind: 'exact', value: 'ball' } },
  { id: 'globe', type: 'portal', match: { kind: 'prefix', value: 'globe-' }, destination: 'globe' },
  { id: 'telescope', type: 'portal', match: { kind: 'exact', value: 'telescope' } },
  { id: 'book-close1', type: 'portal', match: { kind: 'exact', value: 'book-close1' } },
  { id: 'book-open1', type: 'portal', match: { kind: 'exact', value: 'book-open1' } },
  { id: 'bookink', type: 'portal', match: { kind: 'exact', value: 'bookink' } },
  { id: 'catcup', type: 'object', match: { kind: 'exact', value: 'catcup' } },
  { id: 'chair1', type: 'object', match: { kind: 'prefix', value: 'chair1-' } },
  { id: 'chair2', type: 'object', match: { kind: 'prefix', value: 'chair2-' } },
  { id: 'clock', type: 'object', match: { kind: 'exact', value: 'clock' } },
  { id: 'hourglass', type: 'object', match: { kind: 'exact', value: 'hourglass' } },
  { id: 'magglass', type: 'object', match: { kind: 'exact', value: 'magglass' } },
  { id: 'mug', type: 'object', match: { kind: 'exact', value: 'mug' } },
  { id: 'potion', type: 'object', match: { kind: 'prefix', value: 'potion-' } },
]

function matchesDefinition(object, definition) {
  return definition.match.kind === 'exact'
    ? object.name === definition.match.value
    : object.name.startsWith(definition.match.value)
}

function collectMeshes(root) {
  const meshes = []
  root.traverse(object => {
    if (object.isMesh) meshes.push(object)
  })
  return meshes
}

export function createBigInteractionRegistry(modelRoot) {
  const objectToInteraction = new WeakMap()
  const registry = INTERACTION_DEFINITIONS.map(definition => {
    const matchedRoots = []
    modelRoot.traverse(object => {
      if (matchesDefinition(object, definition)) matchedRoots.push(object)
    })
    const meshTargets = matchedRoots.flatMap(collectMeshes)
    const uniqueMeshTargets = [...new Set(meshTargets)]
    const entry = {
      ...definition,
      matchedRoots,
      meshTargets: uniqueMeshTargets,
    }
    matchedRoots.forEach(root => root.traverse(object => objectToInteraction.set(object, entry)))
    return entry
  })

  return {
    entries: registry,
    resolve(object) {
      let current = object
      while (current) {
        const entry = objectToInteraction.get(current)
        if (entry) return entry
        current = current.parent
      }
      return null
    },
  }
}

export { INTERACTION_DEFINITIONS }
