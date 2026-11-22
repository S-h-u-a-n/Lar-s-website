let seenInMemory = false

export function hasSeenWeatherLetter() {
  return seenInMemory
}

export function markWeatherLetterSeen() {
  seenInMemory = true
}
