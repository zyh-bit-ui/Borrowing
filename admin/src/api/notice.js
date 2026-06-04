import request from './request'

export function getNotices() {
  return request.get('/notices/list')
}

export function getNoticeDetail(id) {
  return request.get(`/notices/detail/${id}`)
}

export function publishNotice(data) {
  return request.post('/notices/publish', data)
}
