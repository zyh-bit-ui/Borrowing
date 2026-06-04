import request from './request'

// --- Audit list APIs ---
export function getAuditList(apply_type) {
  return request.get('/borrows/audit/list', { params: { apply_type } })
}

// --- Audit actions ---
export function auditBorrow(data) {
  return request.post('/borrows/audit/borrow', data)
}

export function auditReturn(data) {
  return request.post('/borrows/audit/return', data)
}

export function auditRenew(data) {
  return request.post('/borrows/audit/renew', data)
}

// --- Direct borrow/return (admin) ---
export function directBorrow(data) {
  return request.post('/borrows/borrow', data)
}

export function directReturn(data) {
  return request.post('/borrows/return', data)
}

// --- Records ---
export function getAllBorrowRecords(params) {
  return request.get('/borrows/borrow/records/all', { params })
}

export function getUserBorrowRecords(phone) {
  return request.get(`/borrows/user/${phone}`)
}
