const express = require('express');
const pool = require('../db/db');
const router = express.Router();

// ==============================================
// 1. 管理员发表通知（仅管理员可操作，权限校验）
// ==============================================
router.post('/publish', async (req, res) => {
  try {
    const { 
      admin_id, 
      title, 
      content, 
      is_top = 0 
    } = req.body;

    // 校验管理员权限（假设role=2为管理员）
    const [admin] = await pool.query(
      `SELECT user_role FROM t_user WHERE user_id = ?`,
      [admin_id]
    );
    if (!admin || admin.length === 0 || admin[0].user_role !== 2) {
      return res.json({ code: -1, msg: '无管理员权限' });
    }

    // 校验必填项
    if (!title || !content) {
      return res.json({ code: -1, msg: '标题、内容不能为空' });
    }

    const [result] = await pool.query(
      `INSERT INTO t_notice 
       (admin_id, title, content,  is_top)
       VALUES (?, ?, ?, ?)`,
      [
        admin_id,
        title.trim(),
        content.trim(),
        is_top
      ]
    );

    return res.json({
      code: 200,
      msg: '发表通知成功',
      notice_id: result.insertId
    });
  } catch (err) {
    console.error('发表通知失败:', err);
    return res.json({ code: -1, msg: '发表失败', error: err.message });
  }
});

// ==============================================
// 2. 用户获取通知列表（所有人可浏览，置顶优先，联表查管理员信息）
// ==============================================
router.get('/list', async (req, res) => {
  try {
    // 联表查询：获取管理员信息
    const [rows] = await pool.query(`
      SELECT 
        n.*,
        u.user_name AS admin_name,
        u.user_avatar AS admin_avatar
      FROM t_notice n
      LEFT JOIN t_user u ON n.admin_id = u.user_id
      WHERE n.status = 1
      ORDER BY n.is_top DESC, n.create_time DESC
    `);

    // 查询总数
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM t_notice WHERE status = 1`
    );

    return res.json({
      code: 200,
      data: rows,
      total: countRows[0].total,
    });
  } catch (err) {
    console.error('获取通知列表失败:', err);
    return res.json({ code: -1, msg: '获取失败', error: err.message });
  }
});

// ==============================================
// 3. 获取通知详情（所有人可浏览）
// ==============================================
router.get('/detail/:notice_id', async (req, res) => {
  try {
    const { notice_id } = req.params;
    const [rows] = await pool.query(`
      SELECT 
        n.*,
        u.user_name AS admin_name,
        u.user_avatar AS admin_avatar
      FROM t_notice n
      LEFT JOIN t_user u ON n.admin_id = u.user_id
      WHERE n.notice_id = ? AND n.status = 1
    `, [notice_id]);

    if (rows.length === 0) {
      return res.json({ code: -1, msg: '通知不存在或已下架' });
    }

    return res.json({ code: 200, data: rows[0] });
  } catch (err) {
    console.error('获取通知详情失败:', err);
    return res.json({ code: -1, msg: '获取失败', error: err.message });
  }
});

module.exports = router;