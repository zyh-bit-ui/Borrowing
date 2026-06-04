const express = require('express');
const pool = require('../db/db');
const { encryptPassword, verifyPassword, generateToken } = require('../utils');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const moment = require('moment');
const router = express.Router();

// ------------------- 短信验证码核心逻辑 -------------------
const generateSmsCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendSmsCode = async (phone, code) => {
  console.log(`【图书管理系统】你的验证码是：${code}，5分钟内有效，请勿泄露！`);
  return { success: true };
};

router.post('/getSmsCode', async (req, res) => {
  const { user_phone } = req.body;
  if (!user_phone) {
    return res.status(200).json({ code: 400, message: '手机号不能为空' });
  }
  if (!/^1[3-9]\d{9}$/.test(user_phone)) {
    return res.status(200).json({ code: 400, message: '手机号格式错误' });
  }

  try {
    const [history] = await pool.execute(
      'SELECT * FROM t_sms_code WHERE user_phone = ? AND create_time > DATE_SUB(NOW(), INTERVAL 60 SECOND)',
      [user_phone]
    );
    if (history.length > 0) {
      return res.status(200).json({ code: 400, message: '验证码发送过于频繁，请60秒后重试' });
    }

    const smsCode = generateSmsCode();
    const expireTime = moment().add(5, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    await pool.execute('DELETE FROM t_sms_code WHERE user_phone = ?', [user_phone]);
    await pool.execute(
      'INSERT INTO t_sms_code (user_phone, sms_code, expire_time, create_time) VALUES (?, ?, ?, NOW())',
      [user_phone, smsCode, expireTime]
    );

    const sendResult = await sendSmsCode(user_phone, smsCode);
    if (!sendResult.success) {
      return res.status(200).json({ code: 500, message: '验证码发送失败，请重试' });
    }

    res.status(200).json({ code: 200, message: '验证码发送成功，请注意查收', smsCode: smsCode });
  } catch (err) {
    console.error('发送验证码失败：', err);
    res.status(200).json({ code: 500, message: '服务器错误，验证码发送失败：' + err.message });
  }
});

const verifySmsCode = async (phone, code) => {
  const [records] = await pool.execute(
    'SELECT * FROM t_sms_code WHERE user_phone = ? AND sms_code = ? AND expire_time > NOW()',
    [phone, code]
  );
  if (records.length > 0) {
    await pool.execute('DELETE FROM t_sms_code WHERE user_phone = ? AND sms_code = ?', [phone, code]);
    return true;
  }
  return false;
};

// ------------------- 用户注册 -------------------
router.post('/register', async (req, res) => {
  const { user_name, user_pwd, user_phone, sms_code } = req.body;
  if (!user_name || !user_pwd || !user_phone || !sms_code) {
    return res.status(200).json({ code: 400, message: '用户名、密码、手机号、验证码不能为空' });
  }
  if (!/^1[3-9]\d{9}$/.test(user_phone)) {
    return res.status(200).json({ code: 400, message: '手机号格式错误' });
  }

  try {
    const isCodeValid = await verifySmsCode(user_phone, sms_code);
    if (!isCodeValid) {
      return res.status(200).json({ code: 400, message: '验证码错误或已过期' });
    }

    const encryptedPwd = encryptPassword(user_pwd);
    const [result] = await pool.execute(
      'INSERT INTO t_user (user_name, user_pwd, user_phone) VALUES (?, ?, ?)',
      [user_name, encryptedPwd, user_phone]
    );
    res.status(200).json({ code: 200, data: { user_id: result.insertId }, message: '注册成功' });
  } catch (err) {
    if (err.message.includes('uk_user_name')) {
      return res.status(200).json({ code: 400, message: '用户名已存在' });
    }
    if (err.message.includes('uk_user_phone')) {
      return res.status(200).json({ code: 400, message: '手机号已存在' });
    }
    res.status(200).json({ code: 500, message: '注册失败：' + err.message });
  }
});

// ------------------- 用户登录 -------------------
router.post('/login', async (req, res) => {
  const { user_phone, user_pwd } = req.body;
  if (!user_phone || !user_pwd) {
    return res.status(200).json({ code: 400, message: '电话或密码不能为空' });
  }
  try {
    const [users] = await pool.execute(
      'SELECT user_id, user_name, user_pwd, user_role FROM t_user WHERE user_phone = ?',
      [user_phone]
    );
    if (users.length === 0) {
      return res.status(200).json({ code: 401, message: '电话或密码错误' });
    }
    const isMatch = verifyPassword(user_pwd, users[0].user_pwd);
    if (!isMatch) {
      return res.status(200).json({ code: 401, message: '电话或密码错误' });
    }
    const token = generateToken({
      user_id: users[0].user_id,
      user_phone: users[0].user_phone,
      user_role: users[0].user_role
    });
    res.status(200).json({
      code: 200,
      data: {
        user_id: users[0].user_id,
        user_role: users[0].user_role,
        user_name: users[0].user_name,
        token
      },
      message: '登录成功'
    });
  } catch (err) {
    res.status(200).json({ code: 500, message: '登录失败：' + err.message });
  }
});

// ------------------- 获取用户信息 -------------------
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT * FROM t_user WHERE user_id = ?',
      [req.user.user_id]
    );

    if (!users || users.length === 0) {
      return res.status(200).json({ code: 404, message: '用户不存在' });
    }

    const userData = users[0];
    res.status(200).json({
      code: 200,
      data: {
        user_id: userData.user_id,
        user_name: userData.user_name,
        user_phone: userData.user_phone,
        user_role: userData.user_role,
        create_time: userData.create_time,
        user_avatar: userData.user_avatar,
        user_gender: userData.user_gender,
        user_region: userData.user_region,
        user_pwd: userData.user_pwd
      },
      message: '获取用户信息成功'
    });
  } catch (err) {
    console.error('获取用户信息失败：', err);
    res.status(200).json({ code: 500, message: '获取用户信息失败，请联系管理员' });
  }
});

// ------------------- 获取所有用户（管理员） -------------------
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT user_id, user_name, user_phone, user_role, borrow_count, user_avatar, user_gender, user_region, create_time, update_time FROM t_user ORDER BY user_id ASC'
    );
    res.status(200).json({
      code: 200,
      message: `查询成功，共 ${users.length} 条用户记录`,
      data: users
    });
  } catch (err) {
    console.error('获取所有用户失败：', err);
    res.status(200).json({
      code: 500,
      message: '服务器错误，获取用户列表失败：' + err.message
    });
  }
});

// ------------------- 管理员查询用户 -------------------
router.post('/getByInfo', authMiddleware, adminMiddleware, async (req, res) => {
  const { user_name, user_phone } = req.body;

  if (!user_name && !user_phone) {
    return res.status(200).json({
      code: 400,
      message: '用户名和手机号不能同时为空，请至少填写一项'
    });
  }

  try {
    let querySql = `
      SELECT user_id, user_name, user_phone, user_role, create_time 
      FROM t_user 
      WHERE 1=1
    `;
    const queryParams = [];

    if (user_name) {
      querySql += ' AND user_name LIKE ?';
      queryParams.push(`%${user_name}%`);
    }

    if (user_phone) {
      if (!/^1[3-9]\d{9}$/.test(user_phone)) {
        return res.status(200).json({
          code: 400,
          message: '手机号格式错误，请输入11位有效手机号'
        });
      }
      querySql += ' AND user_phone = ?';
      queryParams.push(user_phone);
    }

    const [users] = await pool.execute(querySql, queryParams);

    if (users.length === 0) {
      return res.status(200).json({
        code: 404,
        message: '未找到匹配的用户信息'
      });
    }

    res.status(200).json({
      code: 200,
      message: `查询成功，共找到 ${users.length} 条用户记录`,
      data: users
    });

  } catch (err) {
    console.error('查找用户失败：', err);
    res.status(200).json({
      code: 500,
      message: '服务器错误，查找用户失败：' + err.message
    });
  }
});

// ------------------- 修改用户信息 -------------------
router.post('/updateUserInfo', authMiddleware, async (req, res) => {
  const { user_name, user_avatar, user_gender, user_region } = req.body;
  const userId = req.user.user_id;

  try {
    if (user_name !== undefined) {
      if (user_name.length < 2 || user_name.length > 20) {
        return res.status(200).json({ code: 400, message: '昵称长度需在2-20个字符之间' });
      }
      if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]{2,20}$/.test(user_name)) {
        return res.status(200).json({ code: 400, message: '昵称仅允许包含中文、字母、数字和下划线' });
      }
      const [nameCheck] = await pool.execute(
        'SELECT user_id FROM t_user WHERE user_name = ? AND user_id != ?',
        [user_name, userId]
      );
      if (nameCheck.length > 0) {
        return res.status(200).json({ code: 400, message: '该昵称已被占用，请更换其他昵称' });
      }
    }

    if (user_gender !== undefined) {
      if (![0, 1].includes(Number(user_gender))) {
        return res.status(200).json({ code: 400, message: '性别参数错误，仅支持0(女)/1(男)' });
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (user_name !== undefined) {
      updateFields.push('user_name = ?');
      updateValues.push(user_name);
    }
    if (user_avatar !== undefined) {
      updateFields.push('user_avatar = ?');
      updateValues.push(user_avatar);
    }
    if (user_gender !== undefined) {
      updateFields.push('user_gender = ?');
      updateValues.push(Number(user_gender));
    }
    if (user_region !== undefined) {
      updateFields.push('user_region = ?');
      updateValues.push(user_region);
    }

    if (updateFields.length === 0) {
      return res.status(200).json({ code: 400, message: '没有可更新的信息' });
    }

    updateFields.push('update_time = NOW()');
    updateValues.push(userId);

    const [updateResult] = await pool.execute(
      `UPDATE t_user SET ${updateFields.join(', ')} WHERE user_id = ?`,
      updateValues
    );

    if (updateResult.affectedRows === 0) {
      return res.status(200).json({ code: 404, message: '用户不存在或信息未修改' });
    }

    const [updatedUser] = await pool.execute(
      'SELECT user_id, user_name, user_avatar, user_gender, user_region FROM t_user WHERE user_id = ?',
      [userId]
    );

    res.status(200).json({
      code: 200,
      data: updatedUser[0],
      message: '个人信息修改成功'
    });

  } catch (err) {
    console.error('修改个人信息失败：', err);
    res.status(200).json({
      code: 500,
      message: '服务器错误，修改信息失败：' + err.message
    });
  }
});


// ------------------- 忘记密码 - 重置密码 -------------------
router.post('/forgetPassword', async (req, res) => {
  const { user_phone, sms_code, new_pwd } = req.body;

  // 1. 校验参数
  if (!user_phone || !sms_code || !new_pwd) {
    return res.status(200).json({ code: 400, message: '手机号、验证码、新密码不能为空' });
  }

  try {
    // 2. 直接使用你现有的 verifySmsCode 校验验证码
    const isCodeValid = await verifySmsCode(user_phone, sms_code);
    if (!isCodeValid) {
      return res.status(200).json({ code: 400, message: '验证码错误或已过期' });
    }

    // 3. 检查用户是否存在
    const [user] = await pool.execute(
      'SELECT user_id FROM t_user WHERE user_phone = ?',
      [user_phone]
    );
    if (user.length === 0) {
      return res.status(200).json({ code: 400, message: '该用户不存在' });
    }

    // 4. 加密新密码
    const encryptedPwd = encryptPassword(new_pwd);

    // 5. 更新密码
    await pool.execute(
      'UPDATE t_user SET user_pwd = ?, update_time = NOW() WHERE user_phone = ?',
      [encryptedPwd, user_phone]
    );

    // 6. 返回成功
    res.status(200).json({
      code: 200,
      message: '密码重置成功，请登录'
    });

  } catch (err) {
    console.error('重置密码失败：', err);
    res.status(200).json({ code: 500, message: '重置密码失败' });
  }
});

module.exports = router;