function setRoundedDragImage(event: React.DragEvent) {
  const el = event.currentTarget as HTMLElement
  const clone = el.cloneNode(true) as HTMLElement
  Object.assign(clone.style, {
    position: 'absolute',
    top: '-9999px',
    borderRadius: '8px',
    overflow: 'hidden',
    width: `${el.offsetWidth}px`
  })
  document.body.appendChild(clone)
  event.dataTransfer.setDragImage(clone, el.offsetWidth / 2, 20)
  requestAnimationFrame(() => document.body.removeChild(clone))
}

export { setRoundedDragImage }
