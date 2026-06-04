import request from './request'

export function getBooks() {
  return request.get('/books')
}

export function getBookById(id) {
  return request.get(`/books/${id}`)
}

export function searchBooksByName(name) {
  return request.get(`/books/name/${encodeURIComponent(name)}`)
}

export function addBook(data) {
  return request.post('/books', data)
}

export function updateBook(id, data) {
  return request.put(`/books/${id}`, data)
}
