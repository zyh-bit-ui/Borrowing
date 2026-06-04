const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * 验证登录状态
 */
function authMiddleware(req, res, next) {


  try {
    // 从请求头获取token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('未提供令牌');
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 将用户信息挂载到req上
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
    }
    return res.status(401).json({ code: 401, message: '登录验证失败' });
  }
}

/**
 * 验证管理员权限
 */
function adminMiddleware(req, res, next) {
  if (req.user.user_role !== 2) {
    return res.status(403).json({ code: 403, message: '无管理员权限' });
  }
  next();
}

module.exports = {
  authMiddleware,
  adminMiddleware
};