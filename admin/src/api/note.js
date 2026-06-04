import request from './request'

export function getNotes() {
  return request.get('/notes/list')
}

export function getNoteDetail(id) {
  return request.get(`/notes/detail/${id}`)
}
