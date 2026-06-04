const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * 密码加密
 * @param {string} password 原始密码
 * @returns {string} 加密后的密码
 */
function encryptPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

/**
 * 密码验证
 * @param {string} password 原始密码
 * @param {string} hash 加密后的密码
 * @returns {boolean} 是否匹配
 */
function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

/**
 * 生成JWT令牌
 * @param {object} payload 载荷（如{user_id, user_role}）
 * @returns {string} token
 */
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
}

module.exports = {
  encryptPassword,
  verifyPassword,
  generateToken
};