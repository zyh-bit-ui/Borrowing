const express = require('express');
const pool = require('../db/db');
const router = express.Router();

// ==============================================
// 1. 用户提交反馈（直接存中文：借书、还书、押金、其它）
// ==============================================
router.post('/submit', async (req, res) => {
  try {
    const {
      user_id,
      feedback_content,
      feedback_type,
      cabinet_address
    } = req.body;

    if (!feedback_content || feedback_content.trim() === '') {
      return res.json({ code: -1, msg: '反馈内容不能为空' });
    }

    // 直接校验中文类型
    const validTypes = ['借书', '还书', '押金', '其它'];
    if (!feedback_type || !validTypes.includes(feedback_type)) {
      return res.json({ code: -1, msg: '请选择合法的反馈类型' });
    }

    const [result] = await pool.query(
      `INSERT INTO t_feedback 
       (user_id, feedback_content, feedback_type, cabinet_address, status)
       VALUES (?, ?, ?, ?, 0)`,
      [
        user_id || null,
        feedback_content.trim(),
        feedback_type,       // 直接存中文
        cabinet_address?.trim() || null
      ]
    );

    return res.json({
      code: 200,
      msg: '反馈提交成功',
      feedback_id: result.insertId
    });
  } catch (err) {
    console.error('提交反馈失败:', err);
    return res.json({ code: -1, msg: '提交失败', error: err.message });
  }
});

// ==============================================
// 2. 用户查看自己的反馈（直接返回中文，无任何映射）
// ==============================================
router.get('/user/list', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) {
      return res.json({ code: -1, msg: "缺少user_id" });
    }

    const [rows] = await pool.query(`
      SELECT 
        feedback_id,
        feedback_content,
        feedback_type,
        cabinet_address,
        reply_content,
        status,
        create_time,
        reply_time
      FROM t_feedback
      WHERE user_id = ?
      ORDER BY create_time DESC
    `, [user_id]);

    return res.json({
      code: 200,
      data: rows,
      total: rows.length
    });

  } catch (err) {
    console.error('获取用户反馈失败:', err);
    return res.json({ code: -1, msg: '获取失败', error: err.message });
  }
});

// ==============================================
// 3. 管理员查看所有反馈
// ==============================================
router.get('/admin/list', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        f.*,
        u.user_name,
        u.user_avatar
      FROM t_feedback f
      LEFT JOIN t_user u ON f.user_id = u.user_id
      ORDER BY f.create_time DESC
    `);

    return res.json({
      code: 200,
      data: rows,
      total: rows.length
    });

  } catch (err) {
    console.error('管理员获取反馈失败:', err);
    return res.json({
      code: -1,
      msg: '获取失败',
      error: err.message
    });
  }
});

// ==============================================
// 4. 管理员查看未处理反馈
// ==============================================
router.get('/admin/unhandled', async (req, res) => {
  try {
    const { admin_id } = req.query;
    if (!admin_id) {
      return res.json({ code: -1, msg: "缺少管理员ID" });
    }

    const [admin] = await pool.query(
      `SELECT user_role FROM t_user WHERE user_id = ?`,
      [Number(admin_id)]
    );

    if (!admin || admin.length === 0 || admin[0].user_role !== 2) {
      return res.json({ code: -1, msg: '无管理员权限' });
    }

    const [rows] = await pool.query(`
      SELECT 
        f.*,
        u.user_name,
        u.user_avatar
      FROM t_feedback f
      LEFT JOIN t_user u ON f.user_id = u.user_id
      WHERE f.status = 0
      ORDER BY f.create_time DESC
    `);

    return res.json({ code: 200, data: rows, total: rows.length });
  } catch (err) {
    console.error('获取未处理反馈失败:', err);
    return res.json({ code: -1, msg: '获取失败', error: err.message });
  }
});

// ==============================================
// 5. 管理员回复反馈
// ==============================================
router.post('/admin/reply', async (req, res) => {
  try {
    const { feedback_id, admin_id, reply_content } = req.body;

    if (!feedback_id || !admin_id || !reply_content?.trim()) {
      return res.json({ code: -1, msg: '反馈ID、管理员ID、回复内容不能为空' });
    }

    const [admin] = await pool.query(
      `SELECT user_role FROM t_user WHERE user_id = ?`,
      [Number(admin_id)]
    );
    if (!admin || admin.length === 0 || admin[0].user_role !== 2) {
      return res.json({ code: -1, msg: '无管理员权限' });
    }

    const [feedback] = await pool.query(
      `SELECT status FROM t_feedback WHERE feedback_id = ?`,
      [feedback_id]
    );
    if (!feedback || feedback.length === 0) {
      return res.json({ code: -1, msg: '该反馈不存在' });
    }

    const [result] = await pool.query(
      `UPDATE t_feedback
       SET 
         reply_content = ?,
         reply_admin_id = ?,
         status = 1,
         reply_time = NOW()
       WHERE feedback_id = ?`,
      [reply_content.trim(), admin_id, feedback_id]
    );

    if (result.affectedRows === 0) {
      return res.json({ code: -1, msg: '更新失败' });
    }

    return res.json({ code: 200, msg: '回复成功' });
  } catch (err) {
    console.error('回复反馈失败:', err);
    return res.json({ code: -1, msg: '操作失败', error: err.message });
  }
});

// ==============================================
// 6. 管理员关闭反馈
// ==============================================
router.post('/admin/close', async (req, res) => {
  try {
    const { feedback_id, admin_id } = req.body;

    if (!feedback_id || !admin_id) {
      return res.json({ code: -1, msg: '反馈ID、管理员ID不能为空' });
    }

    const [admin] = await pool.query(
      `SELECT user_role FROM t_user WHERE user_id = ?`,
      [Number(admin_id)]
    );
    if (!admin || admin.length === 0 || admin[0].user_role !== 2) {
      return res.json({ code: -1, msg: '无管理员权限' });
    }

    const [result] = await pool.query(
      `UPDATE t_feedback SET status = 2 WHERE feedback_id = ?`,
      [feedback_id]
    );

    if (result.affectedRows === 0) {
      return res.json({ code: -1, msg: '该反馈不存在' });
    }

    return res.json({ code: 200, msg: '已关闭' });
  } catch (err) {
    console.error('关闭反馈失败:', err);
    return res.json({ code: -1, msg: '操作失败', error: err.message });
  }
});

module.exports = router;