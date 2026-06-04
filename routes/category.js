const express = require('express');
const pool = require('../db/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// 1. 获取所有分类（无需登录）
router.get('/', async (req, res) => {
  try {
    const [categories] = await pool.execute('SELECT * FROM t_book_category');
    res.json({ code: 200, data: categories, message: '获取分类列表成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取分类失败：' + err.message });
  }
});

// 2. 添加分类（仅管理员）
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { category_name, category_desc } = req.body;
  if (!category_name) {
    return res.status(400).json({ code: 400, message: '分类名称不能为空' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO t_book_category (category_name, category_desc) VALUES (?, ?)',
      [category_name, category_desc || null]
    );
    res.json({ code: 200, data: { category_id: result.insertId }, message: '添加分类成功' });
  } catch (err) {
    if (err.message.includes('uk_category_name')) {
      return res.status(400).json({ code: 400, message: '分类名称已存在' });
    }
    res.status(500).json({ code: 500, message: '添加分类失败：' + err.message });
  }
});

module.exports = router;