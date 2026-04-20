import { useEffect } from 'react'

import { Alert, Snackbar, Stack } from '@mui/material'

import { useNotificationsStore, type Severity } from '@state/notificationsStore'

function NotificationHost() {
  const notifications = useNotificationsStore((s) => s.notifications)
  const dismiss = useNotificationsStore((s) => s.dismiss)

  return (
    <Snackbar open={notifications.length > 0} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Stack spacing={1} sx={{ width: '100%', maxWidth: 420 }}>
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
    </Snackbar>
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
    <Alert severity={severity} variant="filled" onClose={() => onDismiss(id)} sx={{ boxShadow: 3 }}>
      {message}
    </Alert>
  )
}

export { NotificationHost }
