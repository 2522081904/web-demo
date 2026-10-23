// 实验五后端服务入口：Express + CORS + JSON 解析 + 路由挂载 + 统一错误处理。
const express = require('express')
const cors = require('cors')
const { testConnection } = require('./db')
const projectsRouter = require('./routes/projects')
const articlesRouter = require('./routes/articles')

const app = express()
const PORT = Number(process.env.PORT || 3000)

// 允许前端跨域访问（前端开发服务器与后端不同端口）
app.use(cors())
// 解析 JSON 请求体
app.use(express.json())

// 统一响应格式：{ code, message, data }
function ok(res, data, message = 'ok', status = 200) {
  res.status(status).json({ code: 0, message, data })
}
function fail(res, message, status = 400) {
  res.status(status).json({ code: status, message, data: null })
}

app.get('/api/health', async (req, res) => {
  try {
    await testConnection()
    ok(res, { status: 'up', db: 'connected' })
  } catch (err) {
    fail(res, '数据库连接失败：' + err.message, 500)
  }
})

// 按资源划分路由
app.use('/api/projects', projectsRouter)
app.use('/api/articles', articlesRouter)

// 404：未匹配到接口
app.use((req, res) => {
  fail(res, `接口不存在：${req.method} ${req.originalUrl}`, 404)
})

// 统一异常处理：把未捕获异常转成规范的 JSON 错误响应
app.use((err, req, res, next) => {
  console.error('[server error]', err)
  fail(res, err.message || '服务器内部错误', 500)
})

app.listen(PORT, async () => {
  console.log(`[server] http://localhost:${PORT} 已启动`)
  try {
    await testConnection()
    console.log('[db] MySQL 连接成功')
  } catch (err) {
    console.error('[db] MySQL 连接失败：' + err.message)
  }
})

module.exports = { ok, fail }
