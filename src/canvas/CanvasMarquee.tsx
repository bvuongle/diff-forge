import { Box } from '@mui/material'

export type MarqueeRect = { startX: number; startY: number; endX: number; endY: number }

interface CanvasMarqueeProps {
  marquee: MarqueeRect
}

export function CanvasMarquee({ marquee }: CanvasMarqueeProps) {
  const style = {
    left: Math.min(marquee.startX, marquee.endX),
    top: Math.min(marquee.startY, marquee.endY),
    width: Math.abs(marquee.endX - marquee.startX),
    height: Math.abs(marquee.endY - marquee.startY)
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        ...style,
        border: '1px solid var(--accent-blue)',
        bgcolor: 'rgba(59, 130, 246, 0.08)',
        pointerEvents: 'none'
      }}
    />
  )
}
