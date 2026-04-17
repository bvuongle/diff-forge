const OFFSCREEN_TOP_PX = -9999
const DRAG_IMAGE_BORDER_RADIUS_PX = 8
const DRAG_IMAGE_ANCHOR_Y_PX = 20

function setRoundedDragImage(event: React.DragEvent) {
  const el = event.currentTarget as HTMLElement
  const clone = el.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    position: 'absolute',
    top: `${OFFSCREEN_TOP_PX}px`,
    borderRadius: `${DRAG_IMAGE_BORDER_RADIUS_PX}px`,
    overflow: 'hidden',
    width: `${el.offsetWidth}px`
  })
  document.body.appendChild(clone)
  event.dataTransfer.setDragImage(clone, el.offsetWidth / 2, DRAG_IMAGE_ANCHOR_Y_PX)
  requestAnimationFrame(() => document.body.removeChild(clone))
}

export { setRoundedDragImage }
