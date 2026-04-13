type EdgeSourceMap = Record<string, string[]>

function getSlotTooltip(edgeSourceMap: EdgeSourceMap, slotName: string): string {
  const sources = edgeSourceMap[slotName]
  return sources?.length ? sources.join(', ') : ''
}

export { getSlotTooltip }
export type { EdgeSourceMap }
