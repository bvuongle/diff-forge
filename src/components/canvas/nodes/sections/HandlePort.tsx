import { Handle, Position } from '@xyflow/react'

type HandlePortProps = {
  nodeId: string
  type: 'source' | 'target'
  handleId: string
  isConnected: boolean
  isConnectable: boolean
  isValid: boolean
  isDimmed: boolean
  side: 'left' | 'right'
}

function HandlePort({ type, handleId, isConnected, isConnectable, isValid, isDimmed, side }: HandlePortProps) {
  const active = isValid || isConnected
  const color = active ? 'var(--port-connected)' : '#fff'
  const borderColor = active ? 'var(--port-connected)' : 'var(--panel-border)'

  const className = [
    'handle-port',
    side === 'left' ? 'handle-port--left' : 'handle-port--right',
    isConnectable && 'handle-port--connectable',
    isDimmed && 'handle-port--dimmed'
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <Handle
      type={type}
      position={side === 'left' ? Position.Left : Position.Right}
      id={handleId}
      isConnectable={isConnectable}
      className={className}
      style={{
        width: 16,
        height: 16,
        background: color,
        border: `2px solid ${borderColor}`
      }}
    />
  )
}

export { HandlePort }
export type { HandlePortProps }
