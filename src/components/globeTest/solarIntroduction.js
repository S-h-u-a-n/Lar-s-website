// Module memory survives view remounts; a full reload creates a fresh module.
let introduced = false
export function claimSolarIntroduction() {
  if (introduced) return false
  introduced = true
  return true
}
