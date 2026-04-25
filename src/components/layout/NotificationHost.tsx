import { useEffect } from 'react'

import { Alert, Stack } from '@mui/material'

import { useNotificationsStore, type Severity } from '@state/notificationsStore'

function NotificationHost() {
  const notifications = useNotificationsStore((s) => s.notifications)
  const dismiss = useNotificationsStore((s) => s.dismiss)

  if (notifications.length === 0) return null

  return (
    <Stack
      spacing={1}
      alignItems="flex-end"
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: (theme) => theme.zIndex.snackbar,
        pointerEvents: 'none'
      }}
    >
      {notifications.map((n) => (
        <AutoDismissAlert
          key={n.id}
          id={n.id}
          message={n.message}
          severity={n.severity}
          duration={n.duration}
          onDismiss={dismiss}
        />
      ))}
    </Stack>
  )
}

type AutoDismissAlertProps = {
  id: number
  message: string
  severity: Severity
  duration: number
  onDismiss: (id: number) => void
}

function AutoDismissAlert({ id, message, severity, duration, onDismiss }: AutoDismissAlertProps) {
  useEffect(() => {
    const handle = window.setTimeout(() => onDismiss(id), duration)
    return () => window.clearTimeout(handle)
  }, [id, duration, onDismiss])

  return (
    <Alert
      severity={severity}
      variant="filled"
      onClose={() => onDismiss(id)}
      sx={{ boxShadow: 3, width: 'fit-content', maxWidth: 480, pointerEvents: 'auto' }}
    >
      {message}
    </Alert>
  )
}

export { NotificationHost }
