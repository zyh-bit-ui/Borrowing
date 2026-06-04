import request from './request'

export function getOverdues() {
  return request.get('/overdues')
}

export function sendReminders() {
  return request.post('/overdues/send-reminders')
}
