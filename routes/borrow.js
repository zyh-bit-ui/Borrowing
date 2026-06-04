const express = require('express');
const pool = require('../db/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// ===================== 用户端接口 =====================
// 1. 用户发起借阅申请（核心限制：已借 + 待审核 ≤5）
router.post('/apply/borrow', authMiddleware, async (req, res) => {
  const { user_id, book_id } = req.body;
  if (!user_id || !book_id) {
    // ✅ 改成 HTTP 200
    return res.status(200).json({ code: 400, message: '用户ID、图书ID不能为空' });
  }

  try {
    const [user] = await pool.execute('SELECT borrow_count FROM t_user WHERE user_id = ?', [user_id]);
    if (user.length === 0) {
      return res.status(200).json({ code: 404, message: '用户不存在' });
    }
    const currentBorrow = user[0].borrow_count || 0;

    const [pendingApplies] = await pool.execute(`
      SELECT COUNT(*) AS pending_count FROM t_borrow_apply 
      WHERE user_id = ? AND apply_status = 0
    `, [user_id]);
    const pendingCount = pendingApplies[0].pending_count || 0;

    if (currentBorrow + pendingCount >= 5) {
      return res.status(200).json({
        code: 400,
        message: `已借阅 ${currentBorrow} 本 + 待审核 ${pendingCount} 本，最多可借5本，无法再申请`
      });
    }

    // 重复申请判断
    const [repeatCheck] = await pool.execute(`
      SELECT 1 FROM t_borrow_apply 
      WHERE user_id = ? AND book_id = ? AND apply_status = 0
    `, [user_id, book_id]);

    if (repeatCheck.length > 0) {
      return res.status(200).json({
        code: 400,
        message: "你已对该图书发起过借阅申请，请勿重复提交"
      });
    }

    const [books] = await pool.execute('SELECT book_available FROM t_book WHERE book_id = ?', [book_id]);
    if (books.length === 0) {
      return res.status(200).json({ code: 404, message: '图书不存在' });
    }
    if (books[0].book_available <= 0) {
      return res.status(200).json({ code: 400, message: '图书无库存，无法发起借阅申请' });
    }

    const [applyResult] = await pool.execute(`
      INSERT INTO t_borrow_apply (user_id, book_id, apply_status)
      VALUES (?, ?, 0)
    `, [user_id, book_id]);

    // ✅ 成功也返回 200
    return res.status(200).json({
      code: 200,
      data: { apply_id: applyResult.insertId },
      message: '借阅申请已提交，请等待管理员审核'
    });

  } catch (err) {
    console.error('借阅申请错误：', err);
    return res.status(200).json({ code: 500, message: '发起借阅申请失败：' + err.message });
  }
});


// 2. 用户发起归还申请（最终版，完全适配前端）
router.post('/apply/return', authMiddleware, async (req, res) => {
  const { borrow_id, user_id } = req.body;

  if (!borrow_id || !user_id) {
    return res.status(200).json({ 
      code: 400, 
      message: '借阅记录ID和用户ID不能为空' 
    });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 校验借阅记录：必须是本人、借阅中/逾期
    const [borrows] = await connection.execute(`
      SELECT 1 FROM t_borrow_record 
      WHERE borrow_id = ? AND user_id = ? AND borrow_status IN (1, 3)
    `, [borrow_id, user_id]);

    if (borrows.length === 0) {
      await connection.rollback();
      return res.status(200).json({ 
        code: 400, 
        message: '该借阅记录不存在/已归还/非本人借阅，无法发起归还申请' 
      });
    }

    // 检查是否已有未处理的归还申请
    const [existsApply] = await connection.execute(`
      SELECT 1 FROM t_return_apply 
      WHERE borrow_id = ? AND apply_status = 0
    `, [borrow_id]);

    if (existsApply.length > 0) {
      await connection.rollback();
      return res.status(200).json({ 
        code: 400, 
        message: '已有未处理的归还申请，请等待管理员审核' 
      });
    }

    // 插入归还申请记录
    const [applyResult] = await connection.execute(`
      INSERT INTO t_return_apply (borrow_id, user_id, apply_status, apply_time)
      VALUES (?, ?, 0, NOW())
    `, [borrow_id, user_id]);

    await connection.commit();

    return res.status(200).json({ 
      code: 200, 
      data: { return_apply_id: applyResult.insertId }, 
      message: '归还申请已提交，请等待管理员审核' 
    });

  } catch (err) {
    await connection.rollback();
    console.error('归还申请错误：', err);
    return res.status(200).json({ 
      code: 500, 
      message: '发起归还申请失败：' + err.message 
    });
  } finally {
    connection.release();
  }
});

// 3、用户发起续借申请接口
router.post('/apply/renew', authMiddleware, async (req, res) => {
  const { borrow_id } = req.body;
  const user_id = req.user.user_id;

  if (!borrow_id) {
    return res.status(200).json({ code: 400, message: '借阅记录ID不能为空' });
  }

  try {
    const [borrows] = await pool.execute(`
      SELECT br.*, b.book_name 
      FROM t_borrow_record br
      LEFT JOIN t_book b ON br.book_id = b.book_id
      WHERE br.borrow_id = ? AND br.user_id = ? AND br.borrow_status != 2
    `, [borrow_id, user_id]);

    if (borrows.length === 0) {
      return res.status(200).json({ 
        code: 400, 
        message: '仅支持借阅中（未逾期）的图书续借，逾期/已归还/非本人图书无法续借' 
      });
    }

    const borrowRecord = borrows[0];
    const renewCount = borrowRecord.renew_count || 0;
    const maxRenewCount = 3;
    
    if (renewCount >= maxRenewCount) {
      return res.status(200).json({ 
        code: 400, 
        message: `该图书最多可续借${maxRenewCount}次，已达上限，无法继续续借` 
      });
    }

    const [existsRenewApply] = await pool.execute(`
      SELECT 1 FROM t_renew_apply 
      WHERE borrow_id = ? AND apply_status = 0
    `, [borrow_id]);

    if (existsRenewApply.length > 0) {
      return res.status(200).json({ 
        code: 400, 
        message: '已有未处理的续借申请，请等待管理员审核' 
      });
    }

    const [applyResult] = await pool.execute(`
      INSERT INTO t_renew_apply (borrow_id, user_id, apply_status, apply_time)
      VALUES (?, ?, 0, NOW())
    `, [borrow_id, user_id]);

    res.json({ 
      code: 200, 
      data: { 
        renew_apply_id: applyResult.insertId,
        book_name: borrowRecord.book_name,
        current_renew_count: renewCount + 1,
        max_renew_count: maxRenewCount
      }, 
      message: '续借申请已提交，请等待管理员审核' 
    });

  } catch (err) {
    console.error('续借申请错误：', err);
    res.status(200).json({ 
      code: 500, 
      message: '发起续借申请失败：' + err.message 
    });
  }
});

// 4. 用户查询所有申请审核状态
router.get('/apply/status', authMiddleware, async (req, res) => {
  const { apply_type, user_id } = req.query;
  if (!user_id) return res.status(400).json({ code: 400, message: 'user_id不能为空' });

  try {
    let sql = '';
    let queryParams = [user_id];
    
    if (apply_type === 'borrow') {
      sql = `SELECT ba.apply_id AS id, ba.apply_status, ba.apply_time, 'borrow' AS apply_type, b.book_name,b.book_cover
             FROM t_borrow_apply ba
             LEFT JOIN t_book b ON ba.book_id = b.book_id
             WHERE ba.user_id = ? 
             ORDER BY ba.apply_time DESC`;
    } else if (apply_type === 'return') {
      sql = `SELECT ra.return_apply_id AS id, ra.apply_status, ra.apply_time, 'return' AS apply_type, b.book_name,b.book_cover
             FROM t_return_apply ra
             LEFT JOIN t_borrow_record br ON ra.borrow_id = br.borrow_id
             LEFT JOIN t_book b ON br.book_id = b.book_id
             WHERE ra.user_id = ? 
             ORDER BY ra.apply_time DESC`;
    } else if (apply_type === 'renew') {
      sql = `SELECT ra.renew_apply_id AS id, ra.apply_status, ra.apply_time, 'renew' AS apply_type, b.book_name,b.book_cover
             FROM t_renew_apply ra
             LEFT JOIN t_borrow_record br ON ra.borrow_id = br.borrow_id
             LEFT JOIN t_book b ON br.book_id = b.book_id
             WHERE ra.user_id = ? 
             ORDER BY ra.apply_time DESC`;
    } else if (apply_type === 'all' || !apply_type) {
      sql = `(SELECT ba.apply_id AS id, ba.apply_status, ba.apply_time, 'borrow' AS apply_type, b.book_name,b.book_cover
              FROM t_borrow_apply ba
              LEFT JOIN t_book b ON ba.book_id = b.book_id
              WHERE ba.user_id = ?)
             UNION ALL
             (SELECT ra.return_apply_id AS id, ra.apply_status, ra.apply_time, 'return' AS apply_type, b.book_name,b.book_cover
              FROM t_return_apply ra
              LEFT JOIN t_borrow_record br ON ra.borrow_id = br.borrow_id
              LEFT JOIN t_book b ON br.book_id = b.book_id
              WHERE ra.user_id = ?)
             UNION ALL
             (SELECT rea.renew_apply_id AS id, rea.apply_status, rea.apply_time, 'renew' AS apply_type, b.book_name,b.book_cover
              FROM t_renew_apply rea
              LEFT JOIN t_borrow_record br ON rea.borrow_id = br.borrow_id
              LEFT JOIN t_book b ON br.book_id = b.book_id
              WHERE rea.user_id = ?)
             ORDER BY apply_time DESC`;
      queryParams = [user_id, user_id, user_id];
    } else {
      return res.status(400).json({ code: 400, message: '申请类型只能是borrow/return/renew/all' });
    }

    const [result] = await pool.execute(sql, queryParams);
    const statusText = { 0: '待审核', 1: '审核通过', 2: '审核拒绝' };
    const formattedResult = result.map(item => ({
      id: item.id,
      apply_type: item.apply_type,
      apply_status: item.apply_status,
      apply_status_text: statusText[item.apply_status] || '未知状态',
      apply_time: item.apply_time,
      book_name: item.book_name || '未知图书',
      book_cover: item.book_cover
    }));

    res.json({
      code: 200,
      data: formattedResult,
      message: `获取${apply_type || '所有'}申请状态成功，共${formattedResult.length}条记录`
    });
  } catch (err) {
    console.error('查询申请状态错误：', err);
    res.status(500).json({ code: 500, message: '查询申请状态失败：' + err.message });
  }
});


// 5. 管理员审核借阅申请
router.post('/audit/borrow', authMiddleware, adminMiddleware, async (req, res) => {
  const { apply_id, operator_id, audit_result } = req.body;
  if (!apply_id || !operator_id || ![1, 2].includes(audit_result)) {
    return res.status(400).json({ code: 400, message: '参数错误' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [applies] = await connection.execute(`
      SELECT user_id, book_id FROM t_borrow_apply WHERE apply_id = ?
    `, [apply_id]);
    if (applies.length === 0) throw new Error('借阅申请记录不存在');
    const { user_id, book_id } = applies[0];

    if (audit_result === 1) {
      // 最终校验：当前已借数量 >=5 → 直接拒绝审核
      const [user] = await connection.execute(`SELECT borrow_count FROM t_user WHERE user_id=?`, [user_id]);
      const current = user[0].borrow_count || 0;

      if (current >= 5) {
        throw new Error(`审核失败：用户已借满 ${current} 本`);
      }

      const [books] = await connection.execute('SELECT book_available FROM t_book WHERE book_id = ?', [book_id]);
      if (books[0].book_available <= 0) throw new Error('图书库存不足，审核失败');

      const borrow_deadline = new Date();
      borrow_deadline.setDate(borrow_deadline.getDate() + 30);

      await connection.execute(`
        INSERT INTO t_borrow_record (user_id, book_id, borrow_deadline, borrow_status, operator_id, renew_count)
        VALUES (?, ?, ?, 1, ?, 0)
      `, [user_id, book_id, borrow_deadline, operator_id]);

      await connection.execute('UPDATE t_book SET book_available = book_available - 1 WHERE book_id = ?', [book_id]);
      await connection.execute('UPDATE t_user SET borrow_count = borrow_count + 1 WHERE user_id = ?', [user_id]);
    }

    await connection.execute(`
      UPDATE t_borrow_apply 
      SET apply_status = ?, operator_id = ?, audit_time = NOW() 
      WHERE apply_id = ?
    `, [audit_result, operator_id, apply_id]);

    await connection.commit();
    res.json({ 
      code: 200, 
      message: audit_result === 1 ? '借阅申请审核通过，已完成借阅' : '借阅申请审核拒绝' 
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '审核借阅申请失败：' + err.message });
  } finally {
    connection.release();
  }
});

// 6. 管理员审核归还申请
router.post('/audit/return', authMiddleware, adminMiddleware, async (req, res) => {
  const { return_apply_id, operator_id, audit_result } = req.body;
  if (!return_apply_id || !operator_id || ![1, 2].includes(audit_result)) {
    return res.status(400).json({ code: 400, message: '参数错误' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [applies] = await connection.execute(`
      SELECT borrow_id, user_id FROM t_return_apply WHERE return_apply_id = ?
    `, [return_apply_id]);
    if (applies.length === 0) {
      throw new Error('归还申请记录不存在');
    }
    const { borrow_id, user_id } = applies[0];

    if (audit_result === 1) {
      const [borrows] = await connection.execute(`
        SELECT book_id, borrow_deadline, borrow_status 
        FROM t_borrow_record 
        WHERE borrow_id = ? AND user_id = ?
      `, [borrow_id, user_id]);
      if (borrows.length === 0) {
        throw new Error('借阅记录不存在');
      }
      if (borrows[0].borrow_status === 2) {
        throw new Error('该图书已归还，无法重复归还');
      }

      const { book_id, borrow_deadline } = borrows[0];
      const now = new Date();

      await connection.execute(`
        UPDATE t_borrow_record 
        SET return_time = NOW(), borrow_status = 2 
        WHERE borrow_id = ?
      `, [borrow_id]);

      await connection.execute('UPDATE t_book SET book_available = book_available + 1 WHERE book_id = ?', [book_id]);
      await connection.execute('UPDATE t_user SET borrow_count = borrow_count - 1 WHERE user_id = ?', [user_id]);

      if (now > new Date(borrow_deadline)) {
        const overdue_days = Math.ceil((now - new Date(borrow_deadline)) / (1000 * 60 * 60 * 24));
        const fine_amount = overdue_days * 0.5;
        await connection.execute(`
          INSERT INTO t_overdue_record (borrow_id, user_id, book_id, overdue_days, fine_amount, fine_status)
          VALUES (?, ?, ?, ?, ?, 0)
          ON DUPLICATE KEY UPDATE overdue_days = ?, fine_amount = ?
        `, [borrow_id, user_id, book_id, overdue_days, fine_amount, overdue_days, fine_amount]);
      }
    }

    await connection.execute(`
      UPDATE t_return_apply 
      SET apply_status = ?, operator_id = ?, audit_time = NOW() 
      WHERE return_apply_id = ?
    `, [audit_result, operator_id, return_apply_id]);

    await connection.commit();
    res.json({ 
      code: 200, 
      message: audit_result === 1 ? '归还申请审核通过，已完成归还' : '归还申请审核拒绝' 
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '审核归还申请失败：' + err.message });
  } finally {
    connection.release();
  }
});

// 7、管理员审核续借申请接口 
router.post('/audit/renew', authMiddleware, adminMiddleware, async (req, res) => {
  const { renew_apply_id, operator_id, audit_result } = req.body;
  if (!renew_apply_id || !operator_id || ![1, 2].includes(audit_result)) {
    return res.status(400).json({ code: 400, message: '参数错误' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [applies] = await connection.execute(`
      SELECT borrow_id, user_id FROM t_renew_apply WHERE renew_apply_id = ?
    `, [renew_apply_id]);
    if (applies.length === 0) {
      throw new Error('续借申请记录不存在');
    }
    const { borrow_id, user_id } = applies[0];

    if (audit_result === 1) {
      const [borrows] = await connection.execute(`
        SELECT borrow_deadline, renew_count 
        FROM t_borrow_record 
        WHERE borrow_id = ? AND user_id = ? AND borrow_status = 1
      `, [borrow_id, user_id]);
      
      if (borrows.length === 0) {
        throw new Error('该借阅记录不存在/已归还/逾期，无法续借');
      }

      const { borrow_deadline, renew_count } = borrows[0];
      const currentRenewCount = renew_count || 0;
      const maxRenewCount = 1;

      if (currentRenewCount >= maxRenewCount) {
        throw new Error(`该图书最多可续借${maxRenewCount}次，已达上限`);
      }

      const newDeadline = new Date(borrow_deadline);
      newDeadline.setDate(newDeadline.getDate() + 30);

      await connection.execute(`
        UPDATE t_borrow_record 
        SET borrow_deadline = ?, renew_count = ? 
        WHERE borrow_id = ?
      `, [newDeadline, currentRenewCount + 1, borrow_id]);
    }

    await connection.execute(`
      UPDATE t_renew_apply 
      SET apply_status = ?, operator_id = ?, audit_time = NOW() 
      WHERE renew_apply_id = ?
    `, [audit_result, operator_id, renew_apply_id]);

    await connection.commit();
    res.json({ 
      code: 200, 
      message: audit_result === 1 ? '续借申请审核通过，借阅时间已延长30天' : '续借申请审核拒绝' 
    });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ 
      code: 500, 
      message: '审核续借申请失败：' + err.message 
    });
  } finally {
    connection.release();
  }
});

// 8. 管理员获取待审核的申请列表
router.get('/audit/list', authMiddleware, adminMiddleware, async (req, res) => {
  const { apply_type } = req.query;
  if (!['borrow', 'return', 'renew'].includes(apply_type)) {
    return res.status(400).json({ 
      code: 400, 
      message: '申请类型只能是borrow（借阅）、return（归还）或renew（续借）' 
    });
  }

  try {
    let sql = '';
    if (apply_type === 'borrow') {
      sql = `
        SELECT ba.*, u.user_name, b.book_name 
        FROM t_borrow_apply ba
        LEFT JOIN t_user u ON ba.user_id = u.user_id
        LEFT JOIN t_book b ON ba.book_id = b.book_id
        WHERE ba.apply_status = 0
        ORDER BY ba.apply_time DESC
      `;
    } else if (apply_type === 'return') {
      sql = `
        SELECT ra.*, u.user_name, br.book_id, b.book_name 
        FROM t_return_apply ra
        LEFT JOIN t_user u ON ra.user_id = u.user_id
        LEFT JOIN t_borrow_record br ON ra.borrow_id = br.borrow_id
        LEFT JOIN t_book b ON br.book_id = b.book_id
        WHERE ra.apply_status = 0
        ORDER BY ra.apply_time DESC
      `;
    } else if (apply_type === 'renew') {
      sql = `
        SELECT rea.*, u.user_name, br.book_id, b.book_name, br.borrow_deadline, br.renew_count
        FROM t_renew_apply rea
        LEFT JOIN t_user u ON rea.user_id = u.user_id
        LEFT JOIN t_borrow_record br ON rea.borrow_id = br.borrow_id
        LEFT JOIN t_book b ON br.book_id = b.book_id
        WHERE rea.apply_status = 0
        ORDER BY rea.apply_time DESC
      `;
    }

    const [list] = await pool.execute(sql);
    
    res.json({
      code: 200,
      data: list,
      message: list.length > 0 ? '获取待审核申请列表成功' : '暂无待审核申请'
    });
  } catch (err) {
    console.error('获取审核列表错误详情：', err);
    res.status(500).json({ 
      code: 500, 
      message: '获取待审核申请列表失败：' + err.message 
    });
  }
});

// 9、借阅接口（管理员直接操作）
router.post('/borrow', authMiddleware, adminMiddleware, async (req, res) => {
  const { user_id, book_id, operator_id } = req.body;
  if (!user_id || !book_id || !operator_id) {
    return res.status(400).json({ code: 400, message: '用户ID、图书ID、操作人ID不能为空' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [user] = await connection.execute('SELECT borrow_count FROM t_user WHERE user_id = ?', [user_id]);
    if (user[0].borrow_count >= 5) {
      throw new Error('该用户已借阅满5本书，无法再借阅');
    }

    const [books] = await connection.execute('SELECT book_available FROM t_book WHERE book_id = ?', [book_id]);
    if (books.length === 0) {
      throw new Error('图书不存在');
    }
    if (books[0].book_available <= 0) {
      throw new Error('图书无库存，无法借阅');
    }

    const [users] = await connection.execute('SELECT 1 FROM t_user WHERE user_id = ?', [user_id]);
    if (users.length === 0) {
      throw new Error('用户不存在');
    }

    const borrow_deadline = new Date();
    borrow_deadline.setDate(borrow_deadline.getDate() + 30);

    const [borrowResult] = await connection.execute(`
      INSERT INTO t_borrow_record (user_id, book_id, borrow_deadline, borrow_status, operator_id, renew_count)
      VALUES (?, ?, ?, 1, ?, 0)
    `, [user_id, book_id, borrow_deadline, operator_id]);

    await connection.execute('UPDATE t_book SET book_available = book_available - 1 WHERE book_id = ?', [book_id]);
    await connection.execute('UPDATE t_user SET borrow_count = borrow_count + 1 WHERE user_id = ?', [user_id]);

    await connection.commit();
    res.json({ code: 200, data: { borrow_id: borrowResult.insertId }, message: '借阅成功' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '借阅失败：' + err.message });
  } finally {
    connection.release();
  }
});

// 10、归还接口（管理员直接操作）
router.post('/return', authMiddleware, adminMiddleware, async (req, res) => {
  const { borrow_id } = req.body;
  if (!borrow_id) {
    return res.status(400).json({ code: 400, message: '借阅记录ID不能为空' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [borrows] = await connection.execute(`
      SELECT book_id, user_id, borrow_status 
      FROM t_borrow_record 
      WHERE borrow_id = ?
    `, [borrow_id]);
    
    if (borrows.length === 0) {
      throw new Error('借阅记录不存在');
    }
    if (borrows[0].borrow_status === 2) {
      throw new Error('该图书已归还，无法重复归还');
    }

    const { book_id, user_id } = borrows[0];
    const now = new Date();

    await connection.execute(`
      UPDATE t_borrow_record 
      SET return_time = NOW(), borrow_status = 2 
      WHERE borrow_id = ?
    `, [borrow_id]);

    await connection.execute(
      'UPDATE t_book SET book_available = book_available + 1 WHERE book_id = ?', 
      [book_id]
    );

    await connection.execute('UPDATE t_user SET borrow_count = borrow_count - 1 WHERE user_id = ?', [user_id]);

    await connection.execute(`
      UPDATE t_overdue_record 
      SET fine_status = 1 
      WHERE borrow_id = ?
    `, [borrow_id]);

    await connection.commit();
    
    const isOverdue = now > new Date(borrows[0].borrow_deadline);
    res.json({ 
      code: 200, 
      message: isOverdue ? '逾期图书归还成功' : '图书归还成功' 
    });

  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '归还失败：' + err.message });
  } finally {
    connection.release();
  }
});

// 11、获取用户借阅记录接口
router.get('/user/:user_phone', authMiddleware, async (req, res) => {
  const { user_phone } = req.params;

  try {
    const [user] = await pool.execute(
      'SELECT user_id FROM t_user WHERE user_phone = ?',
      [user_phone]
    );
    if (user.length === 0) {
      return res.status(404).json({ code: 404, message: '该手机号对应的用户不存在' });
    }
    const userId = user[0].user_id;

    const [records] = await pool.execute(`
      SELECT br.*, b.book_name, b.book_isbn ,b.book_cover
      FROM t_borrow_record br
      INNER JOIN t_user u ON br.user_id = u.user_id
      LEFT JOIN t_book b ON br.book_id = b.book_id
      WHERE u.user_phone = ?
      ORDER BY br.borrow_time DESC
    `, [user_phone]);

    res.json({ 
      code: 200, 
      data: records, 
      message: records.length > 0 ? '获取借阅记录成功' : '暂无借阅记录' 
    });
  } catch (err) {
    console.error('获取借阅记录错误详情：', err);
    res.status(500).json({ code: 500, message: '获取借阅记录失败：' + err.message });
  }
});

// 12. 管理员查看借阅表所有记录
router.get('/borrow/records/all', authMiddleware, adminMiddleware, async (req, res) => {
  const { 
    borrow_status,
    user_id,
    book_id,
    start_time,
    end_time
  } = req.query;

  try {
    let sql = `
      SELECT br.*, u.user_name, u.user_phone, b.book_name, b.book_isbn
      FROM t_borrow_record br
      LEFT JOIN t_user u ON br.user_id = u.user_id
      LEFT JOIN t_book b ON br.book_id = b.book_id
      WHERE 1=1
    `;
    const queryParams = [];

    if (borrow_status && [1, 2, 3].includes(Number(borrow_status))) {
      sql += ' AND br.borrow_status = ?';
      queryParams.push(Number(borrow_status));
    }
    if (user_id) {
      sql += ' AND br.user_id = ?';
      queryParams.push(user_id);
    }
    if (book_id) {
      sql += ' AND br.book_id = ?';
      queryParams.push(book_id);
    }
    if (start_time) {
      sql += ' AND br.borrow_time >= ?';
      queryParams.push(`${start_time} 00:00:00`);
    }
    if (end_time) {
      sql += ' AND br.borrow_time <= ?';
      queryParams.push(`${end_time} 23:59:59`);
    }

    sql += ' ORDER BY br.borrow_time DESC';

    const [records] = await pool.execute(sql, queryParams);

    res.json({
      code: 200,
      data: records,
      total: records.length,
      message: records.length > 0 ? '获取借阅表所有记录成功' : '暂无借阅记录'
    });
  } catch (err) {
    console.error('获取借阅表所有记录错误：', err);
    res.status(500).json({ code: 500, message: '获取借阅表所有记录失败：' + err.message });
  }
});

module.exports = router;