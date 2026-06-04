import request from './request'

export function getAdminMessages() {
  return request.get('/message/admin/list')
}

export function getUnhandledMessages(admin_id) {
  return request.get('/message/admin/unhandled', { params: { admin_id } })
}

export function replyMessage(data) {
  return request.post('/message/admin/reply', data)
}

export function closeMessage(data) {
  return request.post('/message/admin/close', data)
}
