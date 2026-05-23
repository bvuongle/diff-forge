import { useEffect } from 'react'

import { Alert, AlertTitle, Box, Stack } from '@mui/material'

import { useNotificationsStore, type NotificationMessage, type Severity } from '@state/notificationsStore'

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
  message: NotificationMessage
  severity: Severity
  duration: number
  onDismiss: (id: number) => void
}

function AutoDismissAlert({ id, message, severity, duration, onDismiss }: AutoDismissAlertProps) {
  useEffect(() => {
    const handle = window.setTimeout(() => onDismiss(id), duration)
    return () => window.clearTimeout(handle)
  }, [id, duration, onDismiss])

  const isList = typeof message !== 'string'

  return (
    <Alert
      severity={severity}
      variant="filled"
      onClose={() => onDismiss(id)}
      sx={{ boxShadow: 3, width: 'fit-content', maxWidth: 480, pointerEvents: 'auto' }}
    >
      {isList ? (
        <>
          <AlertTitle sx={{ mb: 0.5 }}>{message.title}</AlertTitle>
          <Box
            component="ul"
            sx={{
              m: 0,
              pl: 2.5,
              maxHeight: 180,
              overflowY: 'auto',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { width: 0, height: 0 }
            }}
          >
            {message.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </Box>
        </>
      ) : (
        message
      )}
    </Alert>
  )
}

export { NotificationHost }
