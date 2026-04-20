import { beforeEach, describe, expect, it } from 'vitest'

import { notify, useNotificationsStore } from '@state/notificationsStore'

describe('notificationsStore', () => {
  beforeEach(() => {
    useNotificationsStore.setState({ notifications: [] })
  })

  it('push adds a notification with default success duration', () => {
    const id = notify.success('saved!')
    const list = useNotificationsStore.getState().notifications
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ id, message: 'saved!', severity: 'success', duration: 4000 })
  })

  it('push uses 8000ms default for warning and error', () => {
    notify.warning('careful')
    notify.error('boom')
    const list = useNotificationsStore.getState().notifications
    expect(list[0].duration).toBe(8000)
    expect(list[1].duration).toBe(8000)
  })

  it('push respects an explicit duration override', () => {
    notify.info('ping', 1500)
    expect(useNotificationsStore.getState().notifications[0].duration).toBe(1500)
  })

  it('dismiss removes a notification by id', () => {
    const id = notify.success('first')
    notify.success('second')
    useNotificationsStore.getState().dismiss(id)
    const list = useNotificationsStore.getState().notifications
    expect(list).toHaveLength(1)
    expect(list[0].message).toBe('second')
  })

  it('assigns monotonically increasing ids', () => {
    const a = notify.info('a')
    const b = notify.info('b')
    expect(b).toBeGreaterThan(a)
  })
})
