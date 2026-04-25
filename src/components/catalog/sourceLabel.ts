function sourceLabel(url: string): string {
  const trimmed = url.replace(/\/+$/, '')
  const last = trimmed.split('/').pop()
  return last && last.length > 0 ? last : trimmed
}

export { sourceLabel }
