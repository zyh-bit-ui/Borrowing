import request from './request'

// Login
export function login(data) {
  return request.post('/users/login', data)
}

// Get user profile
export function getUserProfile() {
  return request.get('/users/profile')
}

// Get all users (admin)
export function getAllUsers() {
  return request.get('/users/all')
}

// Search users by name or phone
export function searchUsers(data) {
  return request.post('/users/getByInfo', data)
}

// Update user info
export function updateUserInfo(data) {
  return request.post('/users/updateUserInfo', data)
}
