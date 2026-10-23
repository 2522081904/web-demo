// 项目资源路由：GET 列表/详情、POST 新增、PUT 修改、DELETE 删除。
const express = require('express')
const { query } = require('../db')

const router = express.Router()

function ok(res, data, message = 'ok', status = 200) {
  res.status(status).json({ code: 0, message, data })
}
function fail(res, message, status = 400) {
  res.status(status).json({ code: status, message, data: null })
}

// 把数据库行转换成前端需要的结构（解析 JSON 字段）
function toProject(row) {
  let tech = []
  let highlights = []
  try { tech = row.tech ? JSON.parse(row.tech) : [] } catch (e) { tech = [] }
  try { highlights = row.highlights ? JSON.parse(row.highlights) : [] } catch (e) { highlights = [] }
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    year: row.year,
    role: row.role,
    score: row.score,
    duration: row.duration,
    link: row.link,
    description: row.description,
    tech,
    highlights,
  }
}

/**
 * @api {get} /api/projects 查询项目列表
 * @apiQuery {String} [state] 按状态筛选
 * @apiQuery {String} [keyword] 按名称/技术栈搜索
 */
router.get('/', async (req, res, next) => {
  try {
    const { state, keyword } = req.query
    const where = []
    const params = []
    if (state && state !== '全部') {
      where.push('state = ?')
      params.push(state)
    }
    if (keyword) {
      where.push('(name LIKE ? OR tech LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    const sql = 'SELECT * FROM projects' + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY id ASC'
    const rows = await query(sql, params)
    ok(res, rows.map(toProject))
  } catch (err) {
    next(err)
  }
})

/** @api {get} /api/projects/:id 查询单个项目 */
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM projects WHERE id = ?', [req.params.id])
    if (!rows.length) return fail(res, '项目不存在', 404)
    ok(res, toProject(rows[0]))
  } catch (err) {
    next(err)
  }
})

/** @api {post} /api/projects 新增项目 */
router.post('/', async (req, res, next) => {
  try {
    const b = req.body || {}
    if (!b.name || !String(b.name).trim()) return fail(res, '项目名称不能为空', 400)
    if (!b.description || !String(b.description).trim()) return fail(res, '项目简介不能为空', 400)
    const tech = JSON.stringify(Array.isArray(b.tech) ? b.tech : String(b.tech || '').split(/[,，、\s]+/).filter(Boolean))
    const highlights = JSON.stringify(Array.isArray(b.highlights) ? b.highlights : String(b.highlights || '').split('\n').map((s) => s.trim()).filter(Boolean))
    const result = await query(
      `INSERT INTO projects (name, state, year, role, score, duration, link, description, tech, highlights)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.name, b.state || '计划中', Number(b.year) || new Date().getFullYear(),
        b.role || '个人项目', Number(b.score) || 80, b.duration || '', b.link || '',
        b.description, tech, highlights,
      ],
    )
    const rows = await query('SELECT * FROM projects WHERE id = ?', [result.insertId])
    ok(res, toProject(rows[0]), '创建成功', 201)
  } catch (err) {
    next(err)
  }
})

/** @api {put} /api/projects/:id 修改项目 */
router.put('/:id', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM projects WHERE id = ?', [req.params.id])
    if (!rows.length) return fail(res, '项目不存在', 404)
    const old = rows[0]
    const b = req.body || {}
    const tech = b.tech === undefined ? old.tech
      : JSON.stringify(Array.isArray(b.tech) ? b.tech : String(b.tech || '').split(/[,，、\s]+/).filter(Boolean))
    const highlights = b.highlights === undefined ? old.highlights
      : JSON.stringify(Array.isArray(b.highlights) ? b.highlights : String(b.highlights || '').split('\n').map((s) => s.trim()).filter(Boolean))
    await query(
      `UPDATE projects SET name=?, state=?, year=?, role=?, score=?, duration=?, link=?, description=?, tech=?, highlights=? WHERE id=?`,
      [
        b.name ?? old.name, b.state ?? old.state, b.year ?? old.year, b.role ?? old.role,
        b.score ?? old.score, b.duration ?? old.duration, b.link ?? old.link,
        b.description ?? old.description, tech, highlights, req.params.id,
      ],
    )
    const updated = await query('SELECT * FROM projects WHERE id = ?', [req.params.id])
    ok(res, toProject(updated[0]), '修改成功')
  } catch (err) {
    next(err)
  }
})

/** @api {delete} /api/projects/:id 删除项目 */
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM projects WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) return fail(res, '项目不存在', 404)
    ok(res, { id: Number(req.params.id) }, '删除成功')
  } catch (err) {
    next(err)
  }
})

module.exports = router
