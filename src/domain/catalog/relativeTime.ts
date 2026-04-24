function relativeTime(fetchedAt: string, now: Date): string {
  const then = Date.parse(fetchedAt)
  if (Number.isNaN(then)) return 'unknown'
  const diffMs = now.getTime() - then
  if (diffMs < 0) return 'just now'
  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export { relativeTime }
