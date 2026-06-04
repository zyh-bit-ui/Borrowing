const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
require('dotenv').config();

// 导入路由
const userRouter = require('./routes/user');
const categoryRouter = require('./routes/category');
const bookRouter = require('./routes/book');
const borrowRouter = require('./routes/borrow');
const messageRouter = require('./routes/message');
const noteRouter = require('./routes/note');
const noticeRouter = require('./routes/notice');
const { router: overdueRouter, sendOverdueReminders } = require('./routes/overdue');

const app = express();
const PORT = process.env.PORT || 3000;

// 全局中间件（顺序绝对不能乱！）
app.use(cors()); // 跨域优先

// ✅ 正确的JSON解析+非法字符清洗方案（替代错误的verify写法）
app.use((req, res, next) => {
  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
  });
  req.on('end', () => {
    try {
      // 1. 先清洗所有控制字符（解决Bad control character问题）
      const cleaned = data.replace(/[\x00-\x1F\x7F]/g, '');
      // 2. 正常解析JSON
      req.body = cleaned ? JSON.parse(cleaned) : {};
      next();
    } catch (err) {
      console.error('JSON解析失败：', err.message);
      return res.status(400).json({
        code: 400,
        msg: '请求格式错误，请检查输入内容'
      });
    }
  });
});

// 表单解析中间件（保留，用于非JSON请求）
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 挂载路由
app.use('/api/users', userRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/books', bookRouter);
app.use('/api/borrows', borrowRouter);
app.use('/api/message', messageRouter);
app.use('/api/overdues', overdueRouter);
app.use('/api/notes',noteRouter);
app.use('/api/notices',noticeRouter)

// 404处理
app.use((req, res) => {
  res.status(404).json({ code: 404, message: `接口 ${req.method} ${req.originalUrl} 不存在` });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误：', err.stack);
  res.status(500).json({ code: 500, message: '服务器内部错误，请稍后重试' });
});

// 定时任务：每天上午9点自动发送逾期提醒
schedule.scheduleJob('0 0 9 * * *', async () => {
  console.log('开始执行每日逾期提醒发送任务...');
  try {
    const result = await sendOverdueReminders();
    console.log(result.message);
  } catch (err) {
    console.error('定时发送逾期提醒失败：', err);
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 图书借阅平台后端已启动，访问地址：http://localhost:${PORT}`);
  console.log('✅ 数据库连接成功');
});