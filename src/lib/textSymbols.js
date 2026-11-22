// Audited UI ornaments with standardized Unicode text variation sequences.
// Call only for UI labels; never normalize article prose or character dialogue.
export function textSymbolLabel(value) {
  return value.replace(/([↔↗↙◀▶☑✉✳])(?![\uFE0E\uFE0F])/gu, '$1\uFE0E')
}
