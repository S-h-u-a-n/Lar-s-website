// Public assets must respect Vite's base when hosted below a repository path.
export function photoUrl(source, base = import.meta.env?.BASE_URL ?? '/') {
  if (!source?.startsWith('/images/')) return source
  return `${base.replace(/\/?$/, '/')}${source.slice(1)}`
}
