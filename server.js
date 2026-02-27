const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const { getPool, initDefaultCategories, closePool } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'accounting-system-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 天
}));

// 登录验证中间件
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: '请先登录' });
  }
  next();
}

// ============ 用户认证 ============

// 注册
app.post('/api/register', async (req, res) => {
  const pool = await getPool();

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '密码长度至少 6 位' });
    }

    // 检查用户名是否存在
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length > 0) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    const userId = result.insertId;

    // 初始化默认分类
    await initDefaultCategories(userId);

    res.json({ success: true, message: '注册成功' });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: '注册失败：' + error.message });
  }
});

// 登录
app.post('/api/login', async (req, res) => {
  const pool = await getPool();

  try {
    const { username, password } = req.body;

    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: '登录失败：' + error.message });
  }
});

// 登出
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// 获取当前用户
app.get('/api/user', (req, res) => {
  if (req.session.userId) {
    res.json({
      logged: true,
      user: { id: req.session.userId, username: req.session.username }
    });
  } else {
    res.json({ logged: false });
  }
});

// ============ 分类管理 ============

// 获取所有分类
app.get('/api/categories', requireAuth, async (req, res) => {
  const pool = await getPool();

  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE user_id = ? ORDER BY type, id',
      [req.session.userId]
    );
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('获取分类错误:', error);
    res.status(500).json({ error: '获取失败：' + error.message });
  }
});

// 添加分类
app.post('/api/categories', requireAuth, async (req, res) => {
  const pool = await getPool();

  try {
    const { name, type, icon } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: '分类名称和类型不能为空' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (user_id, name, type, icon) VALUES (?, ?, ?, ?)',
      [req.session.userId, name, type, icon || '']
    );

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('添加分类错误:', error);
    res.status(500).json({ error: '添加失败：' + error.message });
  }
});

// 删除分类
app.delete('/api/categories/:id', requireAuth, async (req, res) => {
  const pool = await getPool();

  try {
    const { id } = req.params;

    // 检查是否有账目使用该分类
    const [records] = await pool.query(
      'SELECT COUNT(*) as count FROM records WHERE category_id = ?',
      [id]
    );

    if (records[0].count > 0) {
      return res.status(400).json({ error: '该分类下有账目，无法删除' });
    }

    await pool.query(
      'DELETE FROM categories WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('删除分类错误:', error);
    res.status(500).json({ error: '删除失败：' + error.message });
  }
});

// ============ 账目管理 ============

// 获取账目列表
app.get('/api/records', requireAuth, async (req, res) => {
  const pool = await getPool();

  try {
    const { month, type, date } = req.query;

    let sql = `
      SELECT r.*, c.name as category_name, c.icon
      FROM records r
      JOIN categories c ON r.category_id = c.id
      WHERE r.user_id = ?
    `;
    const params = [req.session.userId];

    if (date) {
      sql += ` AND r.record_date = ?`;
      params.push(date);
    } else if (month) {
      sql += ` AND DATE_FORMAT(r.record_date, '%Y-%m') = ?`;
      params.push(month);
    }

    if (type) {
      sql += ` AND r.type = ?`;
      params.push(type);
    }

    sql += ` ORDER BY r.record_date DESC, r.id DESC`;

    const [records] = await pool.query(sql, params);

    // 格式化数据
    const formattedRecords = records.map(r => ({
      ...r,
      record_date: r.record_date instanceof Date
        ? r.record_date.toISOString().split('T')[0]
        : String(r.record_date).split('T')[0],
      amount: parseFloat(r.amount) // 转换为数字
    }));

    res.json({ success: true, data: formattedRecords });
  } catch (error) {
    console.error('获取账目错误:', error);
    res.status(500).json({ error: '获取失败：' + error.message });
  }
});

// 添加账目
app.post('/api/records', requireAuth, async (req, res) => {
  const pool = await getPool();

  try {
    const { category_id, amount, type, description, record_date } = req.body;

    if (!category_id || !amount || !type || !record_date) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    // 验证分类属于当前用户
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE id = ? AND user_id = ?',
      [category_id, req.session.userId]
    );

    if (categories.length === 0) {
      return res.status(400).json({ error: '无效的分类' });
    }

    const [result] = await pool.query(
      `INSERT INTO records (user_id, category_id, amount, type, description, record_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.session.userId, category_id, parseFloat(amount), type, description || '', record_date]
    );

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('添加账目错误:', error);
    res.status(500).json({ error: '添加失败：' + error.message });
  }
});

// 删除账目
app.delete('/api/records/:id', requireAuth, async (req, res) => {
  const pool = await getPool();

  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM records WHERE id = ? AND user_id = ?',
      [id, req.session.userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('删除账目错误:', error);
    res.status(500).json({ error: '删除失败：' + error.message });
  }
});

// ============ 统计汇总 ============

// 获取统计数据
app.get('/api/statistics', requireAuth, async (req, res) => {
  const pool = await getPool();

  try {
    const { month } = req.query;

    let dateCondition = '';
    let params = [req.session.userId];

    if (month) {
      dateCondition = `AND DATE_FORMAT(record_date, '%Y-%m') = ?`;
      params.push(month);
    }

    // 总收入
    const [incomeRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM records
      WHERE user_id = ? AND type = 'income' ${dateCondition}
    `, params);

    // 总支出
    const [expenseRows] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total FROM records
      WHERE user_id = ? AND type = 'expense' ${dateCondition}
    `, params);

    // 按分类统计
    const [categoryRows] = await pool.query(`
      SELECT c.name, c.icon, c.type,
             SUM(r.amount) as total,
             COUNT(r.id) as count
      FROM records r
      JOIN categories c ON r.category_id = c.id
      WHERE r.user_id = ? ${dateCondition}
      GROUP BY r.category_id, c.name, c.icon, c.type
      ORDER BY total DESC
    `, params);

    res.json({
      success: true,
      data: {
        totalIncome: parseFloat(incomeRows[0].total),
        totalExpense: parseFloat(expenseRows[0].total),
        balance: parseFloat(incomeRows[0].total) - parseFloat(expenseRows[0].total),
        byCategory: categoryRows.map(row => ({
          ...row,
          total: parseFloat(row.total)
        }))
      }
    });
  } catch (error) {
    console.error('统计数据错误:', error);
    res.status(500).json({ error: '统计失败：' + error.message });
  }
});

// 获取月度对比数据
app.get('/api/monthly-stats', requireAuth, async (req, res) => {
  const pool = await getPool();

  try {
    // 获取最近 6 个月的数据
    const [months] = await pool.query(`
      SELECT DISTINCT DATE_FORMAT(record_date, '%Y-%m') as month
      FROM records
      WHERE user_id = ?
      ORDER BY month DESC
      LIMIT 6
    `, [req.session.userId]);

    const monthlyData = [];
    for (const m of months) {
      const [stats] = await pool.query(`
        SELECT
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
        FROM records
        WHERE user_id = ? AND DATE_FORMAT(record_date, '%Y-%m') = ?
      `, [req.session.userId, m.month]);

      monthlyData.push({
        month: m.month,
        income: parseFloat(stats[0].income) || 0,
        expense: parseFloat(stats[0].expense) || 0
      });
    }

    res.json({ success: true, data: monthlyData.reverse() });
  } catch (error) {
    console.error('获取月度数据错误:', error);
    res.status(500).json({ error: '获取失败：' + error.message });
  }
});

// 优雅关闭
process.on('SIGINT', async () => {
  console.log('\n正在关闭数据库连接...');
  await closePool();
  process.exit(0);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`记账系统已启动：http://localhost:${PORT}`);
  console.log(`数据库：${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME || 'accounting'}`);
});
