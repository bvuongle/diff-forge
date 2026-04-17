import { useCallback, useState } from 'react'

import AddIcon from '@mui/icons-material/Add'
import BoltIcon from '@mui/icons-material/Bolt'
import CameraAltIcon from '@mui/icons-material/CameraAlt'
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong'
import GridOffIcon from '@mui/icons-material/GridOff'
import GridOnIcon from '@mui/icons-material/GridOn'
import NearMeIcon from '@mui/icons-material/NearMe'
import PanToolIcon from '@mui/icons-material/PanTool'
import RemoveIcon from '@mui/icons-material/Remove'
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import { Menu, MenuItem, Tooltip } from '@mui/material'
import { getNodesBounds, getViewportForBounds, Panel, useReactFlow, useStore as useReactFlowStore } from '@xyflow/react'
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
const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2]

function downloadImage(dataUrl: string) {
  const a = document.createElement('a')
  a.setAttribute('download', EXPORT_FILENAME)
  a.setAttribute('href', dataUrl)
  a.click()
}

function CanvasToolkit() {
  const { getNodes, zoomIn, zoomOut, zoomTo, fitView } = useReactFlow()
  const zoom = useReactFlowStore((s) => s.transform[2])
  const canvasMode = useUIStore((s) => s.canvasMode)
  const setCanvasMode = useUIStore((s) => s.setCanvasMode)
  const expandAll = useUIStore((s) => s.expandAll)
  const collapseAll = useUIStore((s) => s.collapseAll)
  const snapToGrid = useUIStore((s) => s.snapToGrid)
  const toggleSnapToGrid = useUIStore((s) => s.toggleSnapToGrid)
  const animateEdges = useUIStore((s) => s.animateEdges)
  const toggleAnimateEdges = useUIStore((s) => s.toggleAnimateEdges)
  const nodes = useGraphStore((s) => s.graph.nodes)

  const [zoomAnchor, setZoomAnchor] = useState<HTMLElement | null>(null)

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

  const handleZoomPreset = useCallback(
    (value: number) => {
      zoomTo(value, { duration: 150 })
      setZoomAnchor(null)
    },
    [zoomTo]
  )

  const handleFit = useCallback(() => {
    fitView({ duration: 200, padding: 0.2 })
    setZoomAnchor(null)
  }, [fitView])

  const cls = (base: string, active: boolean) => (active ? `${base} canvas-toolkit__btn--active` : base)

  return (
    <Panel position="top-center">
      <div className="canvas-toolkit" role="toolbar" aria-label="Canvas tools">
        <div className="canvas-toolkit__group">
          <Tooltip title="Select (Space)">
            <button
              type="button"
              className={cls('canvas-toolkit__btn', canvasMode === 'select')}
              onClick={() => setCanvasMode('select')}
              aria-label="Select mode"
              aria-pressed={canvasMode === 'select'}
            >
              <NearMeIcon sx={{ fontSize: ICON_SIZE }} />
            </button>
          </Tooltip>
          <Tooltip title="Pan (Space)">
            <button
              type="button"
              className={cls('canvas-toolkit__btn', canvasMode === 'pan')}
              onClick={() => setCanvasMode('pan')}
              aria-label="Pan mode"
              aria-pressed={canvasMode === 'pan'}
            >
              <PanToolIcon sx={{ fontSize: ICON_SIZE }} />
            </button>
          </Tooltip>
        </div>

        <div className="canvas-toolkit__divider" />

        <div className="canvas-toolkit__group">
          <Tooltip title="Zoom out">
            <button
              type="button"
              className="canvas-toolkit__btn"
              onClick={() => zoomOut({ duration: 120 })}
              aria-label="Zoom out"
            >
              <RemoveIcon sx={{ fontSize: ICON_SIZE }} />
            </button>
          </Tooltip>
          <Tooltip title="Zoom presets">
            <button
              type="button"
              className="canvas-toolkit__zoom"
              onClick={(e) => setZoomAnchor(e.currentTarget)}
              aria-label="Zoom presets"
              aria-haspopup="menu"
            >
              {Math.round(zoom * 100)}%
            </button>
          </Tooltip>
          <Tooltip title="Zoom in">
            <button
              type="button"
              className="canvas-toolkit__btn"
              onClick={() => zoomIn({ duration: 120 })}
              aria-label="Zoom in"
            >
              <AddIcon sx={{ fontSize: ICON_SIZE }} />
            </button>
          </Tooltip>
          <Tooltip title="Fit to view">
            <button type="button" className="canvas-toolkit__btn" onClick={handleFit} aria-label="Fit to view">
              <CenterFocusStrongIcon sx={{ fontSize: ICON_SIZE }} />
            </button>
          </Tooltip>
        </div>

        <div className="canvas-toolkit__divider" />

        <div className="canvas-toolkit__group">
          <Tooltip title="Expand all">
            <button
              type="button"
              className="canvas-toolkit__btn"
              onClick={handleExpandAll}
              aria-label="Expand all nodes"
            >
              <UnfoldMoreIcon sx={{ fontSize: ICON_SIZE }} />
            </button>
          </Tooltip>
          <Tooltip title="Collapse all">
            <button type="button" className="canvas-toolkit__btn" onClick={collapseAll} aria-label="Collapse all nodes">
              <UnfoldLessIcon sx={{ fontSize: ICON_SIZE }} />
            </button>
          </Tooltip>
          <Tooltip title={snapToGrid ? 'Snap: on' : 'Snap: off'}>
            <button
              type="button"
              className={cls('canvas-toolkit__btn', snapToGrid)}
              onClick={toggleSnapToGrid}
              aria-label="Toggle snap to grid"
              aria-pressed={snapToGrid}
            >
              {snapToGrid ? <GridOnIcon sx={{ fontSize: ICON_SIZE }} /> : <GridOffIcon sx={{ fontSize: ICON_SIZE }} />}
            </button>
          </Tooltip>
          <Tooltip title={animateEdges ? 'Edge animation: on' : 'Edge animation: off'}>
            <button
              type="button"
              className={cls('canvas-toolkit__btn', animateEdges)}
              onClick={toggleAnimateEdges}
              aria-label="Toggle edge animation"
              aria-pressed={animateEdges}
            >
              <BoltIcon sx={{ fontSize: ICON_SIZE }} />
            </button>
          </Tooltip>
        </div>

        <div className="canvas-toolkit__divider" />

        <Tooltip title="Export canvas as image">
          <button
            type="button"
            className="canvas-toolkit__btn"
            onClick={handleTakeImage}
            aria-label="Export canvas as image"
          >
            <CameraAltIcon sx={{ fontSize: ICON_SIZE }} />
          </button>
        </Tooltip>
      </div>

      <Menu anchorEl={zoomAnchor} open={Boolean(zoomAnchor)} onClose={() => setZoomAnchor(null)}>
        {ZOOM_PRESETS.map((p) => (
          <MenuItem key={p} onClick={() => handleZoomPreset(p)} selected={Math.abs(zoom - p) < 0.01}>
            {Math.round(p * 100)}%
          </MenuItem>
        ))}
      </Menu>
    </Panel>
  )
}

export { CanvasToolkit }
