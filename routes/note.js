const express = require('express');
const pool = require('../db/db');
const router = express.Router();

// ==============================================
// 1. 用户发表心得（所有登录用户可发，无角色限制）
// ==============================================
router.post('/publish', async (req, res) => {
  try {
    const {
      user_id,
      book_name,
      content,
    } = req.body;

    if (!user_id) {
      // ✅ 统一 HTTP 200，前端不会拦截
      return res.status(200).json({ code: 400, message: '用户未登录' });
    }
    if (!book_name || !content) {
      return res.status(200).json({ code: 400, message: '书名、内容不能为空' });
    }

    // 通过书名查询 book_id
    const [bookResult] = await pool.query(
      `SELECT book_id FROM t_book WHERE book_name = ? LIMIT 1`,
      [book_name.trim()]
    );

    if (!bookResult || bookResult.length === 0) {
      return res.status(200).json({ code: 400, message: '该图书不存在，无法发表心得' });
    }

    const book_id = bookResult[0].book_id;

    // 插入心得
    const [result] = await pool.query(
      `INSERT INTO t_book_note 
       (user_id, book_id, content)
       VALUES (?, ?, ?)`,
      [
        user_id,
        book_id,
        content.trim(),
      ]
    );

    // ✅ 成功也 HTTP 200
    return res.status(200).json({
      code: 200,
      message: '发表成功',
      data: {
        note_id: result.insertId
      }
    });

  } catch (err) {
    console.error('发表心得失败:', err);
    return res.status(200).json({ code: 500, message: '发表失败：' + err.message });
  }
});

// ==============================================
// 2. 获取所有心得（所有人可浏览，联表查用户+图书信息）
// ==============================================
router.get('/list', async (req, res) => {
  try {
    // 联表查询：获取用户信息、图书信息
    const [rows] = await pool.query(`
      SELECT 
        n.*,
        u.user_name,
        u.user_avatar,
        b.book_name,
        b.book_cover
      FROM t_book_note n
      LEFT JOIN t_user u ON n.user_id = u.user_id
      LEFT JOIN t_book b ON n.book_id = b.book_id
      WHERE n.status = 1
      ORDER BY n.create_time DESC
    `);

    // 查询总数
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM t_book_note WHERE status = 1`
    );

    return res.json({
      code: 200,
      data: rows,
      total: countRows[0].total,
    });
  } catch (err) {
    console.error('获取心得列表失败:', err);
    return res.json({ code: -1, msg: '获取失败', error: err.message });
  }
});

// ==============================================
// 3. 获取单个心得详情（所有人可浏览）
// ==============================================
router.get('/detail/:note_id', async (req, res) => {
  try {
    const { note_id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        n.*,
        u.user_name,
        u.user_avatar,
        b.book_name,
        b.book_cover
      FROM t_book_note n
      LEFT JOIN t_user u ON n.user_id = u.user_id
      LEFT JOIN t_book b ON n.book_id = b.book_id
      WHERE n.note_id = ? AND n.status = 1
    `, [note_id]);

    if (rows.length === 0) {
      return res.json({ code: -1, msg: '心得不存在或已下架' });
    }

    return res.json({ code: 200, data: rows[0] });
  } catch (err) {
    console.error('获取心得详情失败:', err);
    return res.json({ code: -1, msg: '获取失败', error: err.message });
  }
});

// ==============================================
// 4. 用户点赞心得（所有登录用户可操作）
// ==============================================
router.post('/like/:note_id', async (req, res) => {
  try {
    const { note_id } = req.params;
    const [result] = await pool.query(
      `UPDATE t_book_note SET like_count = like_count + 1 WHERE note_id = ?`,
      [note_id]
    );

    if (result.affectedRows === 0) {
      return res.json({ code: -1, msg: '心得不存在' });
    }

    return res.json({ code: 200, msg: '点赞成功' });
  } catch (err) {
    console.error('点赞失败:', err);
    return res.json({ code: -1, msg: '点赞失败', error: err.message });
  }
});

module.exports = router;