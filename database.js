const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

// 创建数据库连接池
async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'accounting',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 初始化数据库表
    await initDatabase(pool);
  }
  return pool;
}

// 初始化数据库表
async function initDatabase(pool) {
  const [tables] = await pool.query("SHOW TABLES");

  if (tables.length === 0) {
    console.log('正在初始化数据库表...');

    // 创建用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建分类表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        icon VARCHAR(10) DEFAULT '',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建账目表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        type ENUM('income', 'expense') NOT NULL,
        description VARCHAR(255) DEFAULT '',
        record_date DATE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
        INDEX idx_user_id (user_id),
        INDEX idx_record_date (record_date),
        INDEX idx_category_id (category_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('数据库表初始化完成');
  }
}

// 初始化默认分类
async function initDefaultCategories(userId) {
  const pool = await getPool();

  const [existing] = await pool.query(
    'SELECT COUNT(*) as count FROM categories WHERE user_id = ?',
    [userId]
  );

  if (existing[0].count > 0) return;

  // 默认支出分类
  const expenses = [
    { name: '餐饮', icon: '🍜' },
    { name: '交通', icon: '🚗' },
    { name: '购物', icon: '🛒' },
    { name: '娱乐', icon: '🎮' },
    { name: '医疗', icon: '💊' },
    { name: '住房', icon: '🏠' },
    { name: '水电', icon: '💡' },
    { name: '其他', icon: '📦' }
  ];

  // 默认收入分类
  const incomes = [
    { name: '工资', icon: '💰' },
    { name: '奖金', icon: '🎁' },
    { name: '兼职', icon: '💼' },
    { name: '投资', icon: '📈' },
    { name: '其他', icon: '📦' }
  ];

  const insertSQL = 'INSERT INTO categories (user_id, name, type, icon) VALUES (?, ?, ?, ?)';

  for (const cat of expenses) {
    await pool.query(insertSQL, [userId, cat.name, 'expense', cat.icon]);
  }

  for (const cat of incomes) {
    await pool.query(insertSQL, [userId, cat.name, 'income', cat.icon]);
  }
}

// 关闭连接池
async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, initDefaultCategories, closePool };
