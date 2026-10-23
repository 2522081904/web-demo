// 数据库模块：使用 mysql2/promise 连接池，统一封装查询方法。
// 连接端口 3306；用户名 root；密码取环境变量 DB_PASSWORD，默认空（本地开发库）。
const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'personal_home',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  dateStrings: true,
})

/**
 * 统一查询方法：执行 SQL 并返回结果行（或受影响行数/insertId）。
 * 所有 SQL 一律使用 ? 占位符 + 参数数组，由驱动转义，避免 SQL 注入。
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

// 应用启动时打印一次连接信息，便于确认数据库已连通
async function testConnection() {
  const rows = await query('SELECT 1 AS ok')
  return rows[0].ok === 1
}

module.exports = { pool, query, testConnection }
