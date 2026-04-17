import { useCallback } from 'react'

import CameraAltIcon from '@mui/icons-material/CameraAlt'
import GridOffIcon from '@mui/icons-material/GridOff'
import GridOnIcon from '@mui/icons-material/GridOn'
import NearMeIcon from '@mui/icons-material/NearMe'
import PanToolIcon from '@mui/icons-material/PanTool'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import { Tooltip } from '@mui/material'
import { ControlButton, Controls, getNodesBounds, getViewportForBounds, useReactFlow } from '@xyflow/react'
import { toPng } from 'html-to-image'

import { useGraphStore } from '@state/graphStore'
import { useUIStore } from '@state/uiStore'

import {
  IMAGE_EXPORT_HEIGHT,
  IMAGE_EXPORT_MAX_ZOOM,
  IMAGE_EXPORT_MIN_ZOOM,
  IMAGE_EXPORT_PADDING,
  IMAGE_EXPORT_WIDTH
} from './canvasConstants'

const EXPORT_BACKGROUND = '#f8f9fa'
const EXPORT_FILENAME = 'diff-forge-canvas.png'
const ICON_SIZE = 16
const ACTIVE_BUTTON_BG = 'rgba(0,0,0,0.08)'

function downloadImage(dataUrl: string) {
  const a = document.createElement('a')
  a.setAttribute('download', EXPORT_FILENAME)
  a.setAttribute('href', dataUrl)
  a.click()
}

function CanvasToolkit() {
  const { getNodes } = useReactFlow()
  const canvasMode = useUIStore((s) => s.canvasMode)
  const setCanvasMode = useUIStore((s) => s.setCanvasMode)
  const expandAll = useUIStore((s) => s.expandAll)
  const collapseAll = useUIStore((s) => s.collapseAll)
  const snapToGrid = useUIStore((s) => s.snapToGrid)
  const toggleSnapToGrid = useUIStore((s) => s.toggleSnapToGrid)

  const nodes = useGraphStore((s) => s.graph.nodes)

  const handleExpandAll = useCallback(() => expandAll(nodes.map((n) => n.id)), [expandAll, nodes])

  const handleTakeImage = useCallback(() => {
    const flowNodes = getNodes()
    if (flowNodes.length === 0) return
    const bounds = getNodesBounds(flowNodes)
    const viewport = getViewportForBounds(
      bounds,
      IMAGE_EXPORT_WIDTH,
      IMAGE_EXPORT_HEIGHT,
      IMAGE_EXPORT_MIN_ZOOM,
      IMAGE_EXPORT_MAX_ZOOM,
      IMAGE_EXPORT_PADDING
    )
    const viewportEl = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!viewportEl) return

    toPng(viewportEl, {
      backgroundColor: EXPORT_BACKGROUND,
      width: IMAGE_EXPORT_WIDTH,
      height: IMAGE_EXPORT_HEIGHT,
      style: {
        width: `${IMAGE_EXPORT_WIDTH}px`,
        height: `${IMAGE_EXPORT_HEIGHT}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`
      }
    }).then(downloadImage)
  }, [getNodes])

  return (
    <Controls position="bottom-right" orientation="horizontal" showInteractive={false}>
      <Tooltip title="Select (Space)">
        <ControlButton
          onClick={() => setCanvasMode('select')}
          style={canvasMode === 'select' ? { backgroundColor: ACTIVE_BUTTON_BG } : undefined}
        >
          <NearMeIcon sx={{ fontSize: ICON_SIZE }} />
        </ControlButton>
      </Tooltip>
      <Tooltip title="Pan (Space)">
        <ControlButton
          onClick={() => setCanvasMode('pan')}
          style={canvasMode === 'pan' ? { backgroundColor: ACTIVE_BUTTON_BG } : undefined}
        >
          <PanToolIcon sx={{ fontSize: ICON_SIZE }} />
        </ControlButton>
      </Tooltip>
      <Tooltip title="Expand all">
        <ControlButton onClick={handleExpandAll}>
          <UnfoldMoreIcon sx={{ fontSize: ICON_SIZE }} />
        </ControlButton>
      </Tooltip>
      <Tooltip title="Collapse all">
        <ControlButton onClick={collapseAll}>
          <UnfoldLessIcon sx={{ fontSize: ICON_SIZE }} />
        </ControlButton>
      </Tooltip>
      <Tooltip title={snapToGrid ? 'Snap: on' : 'Snap: off'}>
        <ControlButton
          onClick={toggleSnapToGrid}
          style={snapToGrid ? { backgroundColor: ACTIVE_BUTTON_BG } : undefined}
        >
          {snapToGrid ? <GridOnIcon sx={{ fontSize: ICON_SIZE }} /> : <GridOffIcon sx={{ fontSize: ICON_SIZE }} />}
        </ControlButton>
      </Tooltip>
      <Tooltip title="Export canvas as image">
        <ControlButton onClick={handleTakeImage}>
          <CameraAltIcon sx={{ fontSize: ICON_SIZE }} />
        </ControlButton>
      </Tooltip>
    </Controls>
  )
}

export { CanvasToolkit }
