const express = require('express');
const pool = require('../db/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// 1. 获取所有图书（无需登录）
router.get('/', async (req, res) => {
  try {
    const [books] = await pool.execute(`
      SELECT b.*, c.category_name 
      FROM t_book b 
      LEFT JOIN t_book_category c ON b.category_id = c.category_id
    `);
    res.json({ code: 200, data: books, message: '获取图书列表成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取图书失败：' + err.message });
  }
});

// 2. 根据ID获取单本图书（无需登录）
// 根据ID获取单本图书（无需登录）
router.get('/:book_id', async (req, res) => {
  // 1. 解构路由参数（变量名统一为book_id）
  const { book_id } = req.params;
  
  // 2. 前置校验：排除非数字ID和空ID
  if (!book_id || isNaN(Number(book_id))) {
    return res.status(400).json({ 
      code: 400, 
      message: '图书ID格式错误，必须为有效数字' 
    });
  }

  try {
    // 3. SQL语句中使用正确的变量名book_id，而非id
    const [books] = await pool.execute(
      `SELECT * FROM t_book WHERE book_id = ?`,
      [book_id] // 匹配解构的变量名
    );

    // 4. 正确判断查询结果：数组长度为0则无数据
    if (books.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: '图书不存在' 
      });
    }

    // 5. 返回查询到的单本图书数据
    res.status(200).json({
      code: 200,
      data: books[0],
      message: '获取图书成功'
    });
  } catch (err) {
    // 6. 错误日志与友好返回
    console.error('获取图书详情失败：', err);
    res.status(500).json({
      code: 500,
      message: '获取图书失败：' + err.message
    });
  }
});

// 3. 添加图书（仅管理员）
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { book_isbn, book_name, book_author, book_publisher, category_id, book_position, book_desc, book_stock } = req.body;
  // 必填项校验
  const required = [book_isbn, book_name, book_author, book_publisher, category_id, book_position];
  if (required.some(item => !item)) {
    return res.status(400).json({ code: 400, message: 'ISBN、书名、作者、出版社、分类、馆藏位置不能为空' });
  }

  try {
    const book_available = book_stock || 0;
    const [result] = await pool.execute(`
      INSERT INTO t_book (book_isbn, book_name, book_author, book_publisher, category_id, book_position, book_desc, book_stock, book_available)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [book_isbn, book_name, book_author, book_publisher, category_id, book_position, book_desc || null, book_stock, book_available]);
    res.json({ code: 200, data: { book_id: result.insertId }, message: '添加图书成功' });
  } catch (err) {
    if (err.message.includes('uk_book_isbn')) {
      return res.status(400).json({ code: 400, message: 'ISBN编号已存在' });
    }
    res.status(500).json({ code: 500, message: '添加图书失败：' + err.message });
  }
});

// 4. 更新图书（仅管理员）
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { book_name, book_author, book_publisher, category_id, book_position, book_desc, book_stock } = req.body;

  try {
    // 1. 先检查图书是否存在
    const [books] = await pool.execute('SELECT 1 FROM t_book WHERE book_id= ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({ code: 404, message: '图书不存在' });
    }

    // 2. 校验库存参数（新增：防止非数字/负数）
    if (book_stock !== undefined) {
      const stockNum = Number(book_stock);
      if (isNaN(stockNum) || stockNum < 0) {
        return res.status(400).json({ code: 400, message: '库存必须为非负数字' });
      }
    }

    // 3. 构建更新语句（核心修复：拆分字段更新和可借阅数计算）
    const updateFields = [];
    const params = [];
    
    // 基础字段更新
    if (book_name) {
      updateFields.push('book_name = ?');
      params.push(book_name);
    }
    if (book_author) {
      updateFields.push('book_author = ?');
      params.push(book_author);
    }
    if (book_publisher) {
      updateFields.push('book_publisher = ?');
      params.push(book_publisher);
    }
    if (category_id) {
      updateFields.push('category_id = ?');
      params.push(category_id);
    }
    if (book_position) {
      updateFields.push('book_position = ?');
      params.push(book_position);
    }
    if (book_desc !== undefined) {
      updateFields.push('book_desc = ?');
      params.push(book_desc);
    }

    // 库存更新 + 可借阅数计算（核心修复：正确逻辑）
    if (book_stock !== undefined) {
      // 第一步：先更新库存
      updateFields.push('book_stock = ?');
      params.push(book_stock);
      // 第二步：单独计算可借阅数（先查已借出数量，再计算）
      // 注意：这里不能直接在UPDATE里嵌套复杂计算，需先查询再更新
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ code: 400, message: '请提供要更新的字段' });
    }

    // 4. 执行基础字段更新
    params.push(id);
    await pool.execute(`UPDATE t_book SET ${updateFields.join(', ')} WHERE book_id = ?`, params);

    // 5. 单独更新可借阅数（仅当库存更新时）
    if (book_stock !== undefined) {
      // 查询该图书已借出的数量（假设t_borrow表有borrow_status=0表示未归还）
      const [borrowedRes] = await pool.execute(
        'SELECT COUNT(*) AS borrowed_num FROM t_borrow_record WHERE book_id = ? AND borrow_status = 0',
        [id]
      );
      const borrowedNum = borrowedRes[0].borrowed_num || 0;
      // 可借阅数 = 库存 - 已借出，最小为0
      const availableNum = Math.max(book_stock - borrowedNum, 0);
      // 更新可借阅数
      await pool.execute(
        'UPDATE t_book SET book_available = ? WHERE book_id = ?',
        [availableNum, id]
      );
    }

    res.json({ code: 200, message: '更新图书成功' });
  } catch (err) {
    console.error('更新图书错误详情：', err); // 新增：打印完整错误日志
    res.status(500).json({ code: 500, message: '更新图书失败：' + err.message });
  }
});




/**
 * 根据书名获取图书信息（无需登录）
 * 请求路径：GET /api/book/:book_name
 * 优化点：参数校验 + 模糊查询 + 命名规范 + 字段过滤
 */
router.get('/name/:book_name', async (req, res) => {
  // 1. 解构路由参数（命名与功能一致）
  const { book_name } = req.params;

  // 2. 严格的参数校验（新增）
  if (!book_name || book_name.trim() === '') {
    return res.status(400).json({ 
      code: 400, 
      message: '书名不能为空，请输入有效书名' 
    });
  }

  try {
    // 3. 优化SQL：模糊查询（更符合实际使用场景）+ 只返回必要字段（隐藏冗余信息）
    const [books] = await pool.execute(
      `SELECT book_id, book_name, book_author, book_publisher, book_available 
       FROM t_book 
       WHERE book_name LIKE ?`, // 模糊查询：支持输入部分书名匹配
      [`%${book_name.trim()}%`] // 去除首尾空格，提升匹配准确性
    );

    // 4. 完善结果判断逻辑
    if (books.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: `未找到包含「${book_name}」的图书，请检查书名` 
      });
    }

    // 5. 友好返回（支持多本匹配结果，更实用）
    res.status(200).json({
      code: 200,
      data: books.length === 1 ? books[0] : books, // 单本返回对象，多本返回数组
      message: `成功找到 ${books.length} 本匹配的图书`,
      total: books.length // 新增总数，方便前端处理
    });
  } catch (err) {
    // 6. 优化错误处理：分类返回（新增）
    console.error('查询图书失败：', err);
    // 区分数据库错误/其他错误
    if (err.code && err.code.startsWith('ER_')) {
      res.status(500).json({
        code: 500,
        message: '数据库查询失败，请联系管理员'
      });
    } else {
      res.status(500).json({
        code: 500,
        message: '查询图书失败：' + err.message
      });
    }
  }
});

module.exports = router;