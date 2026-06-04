const express = require('express');
const pool = require('../db/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// 工具函数1：计算逾期天数
function calculateOverdueDays(borrowDeadline) {
  const deadline = new Date(borrowDeadline);
  const now = new Date();
  const diffTime = now - deadline;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 0);
}

// 工具函数2：自动计算罚款金额（可自定义规则）
function calculateFineAmount(overdueDays) {
  const FINE_PER_DAY = 0.5; // 每逾期1天0.5元
  const MAX_FINE = 50.00;   // 最高罚款50元
  let fine = overdueDays * FINE_PER_DAY;
  return Math.min(Math.max(fine, 0), MAX_FINE);// 保证0≤罚款≤最高限额
}
// 核心函数：发送逾期提醒消息（供定时任务/手动调用）
// 核心函数：发送逾期提醒消息（供定时任务/手动调用）
async function sendOverdueReminders() {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction(); // 开启事务保证数据一致性

    // 1. 查询所有逾期未归还的借阅记录（状态为3=逾期未还 或 应还时间已过且未归还）
    const [overdueBorrows] = await connection.execute(`
      SELECT br.borrow_id, br.user_id, br.borrow_deadline, b.book_name, u.user_name
      FROM t_borrow_record br
      LEFT JOIN t_book b ON br.book_id = b.book_id
      LEFT JOIN t_user u ON br.user_id = u.user_id
      WHERE br.borrow_status = 3  -- 逾期未还状态
      OR (br.borrow_status = 1 AND br.borrow_deadline < CURDATE())  -- 已借阅但超期未还
    `);

    if (overdueBorrows.length === 0) {
      await connection.commit();
      return { success: true, count: 0, message: '无逾期记录，无需发送提醒' };
    }

    let sendCount = 0;
    // 2. 为每条逾期记录发送提醒消息
    for (const borrow of overdueBorrows) {
      // ✅ 确保从当前 borrow 对象中解构出正确的 user_id
      const { borrow_id, user_id, book_name, borrow_deadline, user_name } = borrow;
      const overdueDays = calculateOverdueDays(borrow_deadline);

      // 构造提醒消息内容（直接使用解构的 user_name，避免 borrow.user_name 引用错误）
      const messageContent = `【图书逾期提醒】尊敬的${user_name}，您借阅的《${book_name}》已逾期${overdueDays}天，请尽快归还图书，感谢配合！`;

      // ✅ 插入消息到 t_message 表，严格使用当前循环 borrow 的 user_id
      await connection.execute(`
        INSERT INTO t_message (
          user_id, message_content, message_type, related_borrow_id, related_apply_id, is_read
        ) VALUES (?, ?, 'overdue_reminder', ?, NULL, 0)
      `, [user_id, messageContent, borrow_id]); // 这里的 user_id 是当前 borrow 的，不是固定值

      sendCount++;
    }

    await connection.commit(); // 提交事务
    return { success: true, count: sendCount, message: `成功发送${sendCount}条逾期提醒消息` };

  } catch (err) {
    if (connection) await connection.rollback(); // 出错回滚事务
    console.error('发送逾期提醒失败：', err);
    return { success: false, count: 0, message: '发送提醒失败：' + err.message };
  } finally {
    if (connection) connection.release(); // 释放数据库连接
  }
}
// 1. 获取所有逾期记录（仅管理员）
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [overdues] = await pool.execute(`
      SELECT o.*, br.user_id, br.book_id, b.book_name, u.user_name, br.borrow_deadline
      FROM t_overdue_record o
      LEFT JOIN t_borrow_record br ON o.borrow_id = br.borrow_id
      LEFT JOIN t_book b ON br.book_id = b.book_id
      LEFT JOIN t_user u ON br.user_id = u.user_id
      WHERE o.fine_status = 0
    `);

    // 实时计算逾期天数和最新罚款金额
    const result = overdues.map(item => {
      const overdueDays = calculateOverdueDays(item.borrow_deadline);
      return {
        ...item,
        overdue_days: overdueDays,
        fine_amount: calculateFineAmount(overdueDays) // 实时更新罚款金额
      };
    });

    res.json({ code: 200, data: result, message: '获取逾期记录成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取逾期记录失败：' + err.message });
  }
});

// 2. 新增逾期记录（自动计算逾期天数+罚款，无需手动传）
router.post('/', authMiddleware, async (req, res) => {
  const { borrow_id } = req.body; // 仅需传借阅记录ID，其他自动计算

  try {
    // 第一步：校验借阅记录是否存在，并获取应还日期、用户ID、图书ID
    const [borrows] = await pool.execute(
      `SELECT br.borrow_id, br.user_id, br.book_id, br.borrow_deadline 
       FROM t_borrow_record br WHERE br.borrow_id = ?`,
      [borrow_id]
    );

    if (borrows.length === 0) {
      return res.status(404).json({ code: 404, message: '借阅记录不存在' });
    }
    const borrow = borrows[0];

    // 第二步：计算逾期天数和罚款金额
    const overdueDays = calculateOverdueDays(borrow.borrow_deadline);
    const fineAmount = calculateFineAmount(overdueDays);

    // 第三步：未逾期时不生成记录（可选，根据业务调整）
    if (overdueDays === 0) {
      return res.status(400).json({ code: 400, message: '该借阅未逾期，无需生成逾期记录' });
    }

    // 第四步：检查该借阅是否已生成逾期记录（避免重复）
    const [existOverdue] = await pool.execute(
      `SELECT 1 FROM t_overdue_record WHERE borrow_id = ?`,
      [borrow_id]
    );
    if (existOverdue.length > 0) {
      return res.status(400).json({ code: 400, message: '该借阅已生成逾期记录' });
    }

    // 第五步：插入逾期记录
    const [result] = await pool.execute(
      `INSERT INTO t_overdue_record (borrow_id, user_id, book_id, overdue_days, fine_amount, fine_status)
       VALUES (?, ?, ?, ?, ?, 0)`,
      [borrow_id, borrow.user_id, borrow.book_id, overdueDays, fineAmount]
    );

    res.json({ 
      code: 200, 
      data: { 
        overdue_id: result.insertId,
        overdue_days: overdueDays,
        fine_amount: fineAmount // 返回计算结果
      }, 
      message: '新增逾期记录成功' 
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '新增逾期记录失败：' + err.message });
  }
});

// 3. 缴纳罚款（更新状态+可选：锁定最终罚款金额）
router.put('/pay/:overdue_id', authMiddleware, async (req, res) => {
  const { overdue_id } = req.params;
  try {
    // 可选：缴纳时锁定罚款金额（避免后续逾期天数增加导致金额变化）
    await pool.execute(
      `UPDATE t_overdue_record 
       SET fine_status = 1, fine_amount = fine_amount WHERE overdue_id = ?`,
      [overdue_id]
    );
    res.json({ code: 200, message: '罚款缴纳成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '缴纳罚款失败：' + err.message });
  }
});

// 4. 获取用户个人逾期记录（需登录，实时计算罚款）
// 4. 获取用户个人逾期统计（给UI用：逾期书籍数、总逾期天数、总罚款）
router.get('/my', authMiddleware, async (req, res) => {
  const user_id = req.user.user_id;
  try {
    // 1. 查询用户所有未结清的逾期记录
    const [overdues] = await pool.execute(`
      SELECT o.*, br.borrow_deadline
      FROM t_overdue_record o
      LEFT JOIN t_borrow_record br ON o.borrow_id = br.borrow_id
      WHERE o.user_id = ? AND o.fine_status = 0
    `, [user_id]);

    // 2. 实时计算统计数据
    let totalOverdueBooks = overdues.length; // 逾期书籍数量
    let totalOverdueDays = 0;
    let totalFine = 0;

    overdues.forEach(item => {
      const days = calculateOverdueDays(item.borrow_deadline);
      totalOverdueDays += days;
      totalFine += calculateFineAmount(days);
    });

    res.json({
      code: 200,
      data: {
        overdue_book_count: totalOverdueBooks, // 逾期书籍数（对应UI：2本）
        total_overdue_days: totalOverdueDays,  // 总逾期天数（对应UI：12天）
        total_fine: Number(totalFine.toFixed(2)) // 总罚款（对应UI：12元，保留2位小数）
      },
      message: '获取逾期统计成功'
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取逾期统计失败：' + err.message });
  }
});


// 3. 管理员手动触发发送逾期提醒（测试/紧急提醒）
router.post('/send-reminders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await sendOverdueReminders();
    if (result.success) {
      res.json({ code: 200, data: { count: result.count }, message: result.message });
    } else {
      res.status(500).json({ code: 500, message: result.message });
    }
  } catch (err) {
    res.status(500).json({ code: 500, message: '触发提醒失败：' + err.message });
  }
});

// ====================== 用户消息接口 ======================
// 1. 用户获取自己的所有逾期相关消息
router.get('/my_messages', authMiddleware, async (req, res) => {
  const { user_id } = req.user; // 当前登录用户
  try {
    const [messages] = await pool.execute(`
      SELECT m.*, b.book_name 
      FROM t_message m
      LEFT JOIN t_borrow_record br ON m.related_borrow_id = br.borrow_id
      LEFT JOIN t_book b ON br.book_id = b.book_id
      WHERE 
        m.user_id = ?  -- ✅ 只查当前用户的消息（这就够了！）
        AND m.message_type IN ('overdue_reminder', 'overdue_fine')
      ORDER BY m.create_time DESC
    `, [user_id]);

    res.json({
      code: 200,
      data: messages,
      message: '获取个人消息成功'
    });
  } catch (err) {
    console.error('获取消息失败：', err);
    res.status(500).json({ code: 500, message: '获取消息失败' });
  }
});

// 2. 用户标记单条消息为已读
router.put('/read/:message_id', authMiddleware, async (req, res) => {
  const { message_id } = req.params; // 消息ID从路径获取
  const { user_id } = req.user;

  try {
    // 先验证消息归属（只能改自己的消息）
    const [check] = await pool.execute(`
      SELECT 1 FROM t_message WHERE message_id = ? AND user_id = ?
    `, [message_id, user_id]);

    if (check.length === 0) {
      return res.status(404).json({ code: 404, message: '消息不存在或无权操作' });
    }

    // 标记为已读
    await pool.execute(`
      UPDATE t_message SET is_read = 1 WHERE message_id = ?
    `, [message_id]);

    res.json({ code: 200, message: '消息已标记为已读' });
  } catch (err) {
    console.error('标记已读失败：', err);
    res.status(500).json({ code: 500, message: '标记已读失败：' + err.message });
  }
});

// 3. （可选）用户一键标记所有消息为已读
router.put('/read_all', authMiddleware, async (req, res) => {
  const { user_id } = req.user;
  try {
    await pool.execute(`
      UPDATE t_message SET is_read = 1 
      WHERE user_id = ? AND is_read = 0
      AND message_type IN ('overdue_reminder', 'overdue_fine')
    `, [user_id]);

    res.json({ code: 200, message: '所有未读消息已标记为已读' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '一键已读失败：' + err.message });
  }
});

// 导出核心函数供定时任务调用
module.exports = {
  router,
  sendOverdueReminders // 暴露给定时任务
};