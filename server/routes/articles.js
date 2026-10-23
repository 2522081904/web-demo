// 文章资源路由：GET 列表/详情、POST 新增、PUT 修改、DELETE 删除、PATCH 切换发布状态。
// 文章与分类之间通过 article_categories 表的外键 category_id 关联。
const express = require('express')
const { query } = require('../db')

const router = express.Router()

function ok(res, data, message = 'ok', status = 200) {
  res.status(status).json({ code: 0, message, data })
}
function fail(res, message, status = 400) {
  res.status(status).json({ code: status, message, data: null })
}

const SELECT_ARTICLE = `SELECT a.id, a.title, a.category_id, c.name AS category, a.date,
       a.tags, a.views, a.published, a.summary, a.content
FROM articles a LEFT JOIN article_categories c ON a.category_id = c.id`

function toArticle(row) {
  let tags = []
  try { tags = row.tags ? JSON.parse(row.tags) : [] } catch (e) { tags = [] }
  return {
    id: row.id,
    title: row.title,
    category: row.category || '',
    categoryId: row.category_id,
    date: row.date,
    tags,
    views: row.views,
    published: Boolean(row.published),
    summary: row.summary,
    content: row.content,
  }
}

// 根据分类名取 id；不存在则新建（保证外键有效）
async function resolveCategoryId(name) {
  const cat = String(name || '学习笔记').trim() || '学习笔记'
  const rows = await query('SELECT id FROM article_categories WHERE name = ?', [cat])
  if (rows.length) return rows[0].id
  const result = await query('INSERT INTO article_categories (name) VALUES (?)', [cat])
  return result.insertId
}

/** @api {get} /api/articles 查询文章列表 */
router.get('/', async (req, res, next) => {
  try {
    const { category, published, keyword } = req.query
    const where = []
    const params = []
    if (category) { where.push('c.name = ?'); params.push(category) }
    if (published !== undefined) { where.push('a.published = ?'); params.push(published === 'true' || published === '1' ? 1 : 0) }
    if (keyword) { where.push('(a.title LIKE ? OR a.summary LIKE ?)'); params.push(`%${keyword}%`, `%${keyword}%`) }
    const sql = SELECT_ARTICLE + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY a.id ASC'
    const rows = await query(sql, params)
    ok(res, rows.map(toArticle))
  } catch (err) {
    next(err)
  }
})

/** @api {get} /api/articles/:id 查询单篇文章 */
router.get('/:id', async (req, res, next) => {
  try {
    const rows = await query(SELECT_ARTICLE + ' WHERE a.id = ?', [req.params.id])
    if (!rows.length) return fail(res, '文章不存在', 404)
    ok(res, toArticle(rows[0]))
  } catch (err) {
    next(err)
  }
})

/** @api {post} /api/articles 新增文章 */
router.post('/', async (req, res, next) => {
  try {
    const b = req.body || {}
    if (!b.title || !String(b.title).trim()) return fail(res, '文章标题不能为空', 400)
    if (!b.summary || !String(b.summary).trim()) return fail(res, '文章摘要不能为空', 400)
    if (!b.content || !String(b.content).trim()) return fail(res, '文章正文不能为空', 400)
    const categoryId = await resolveCategoryId(b.category)
    const tags = JSON.stringify(Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(/[,，、\s]+/).filter(Boolean))
    const result = await query(
      `INSERT INTO articles (title, category_id, date, tags, views, published, summary, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        b.title, categoryId, b.date || new Date().toISOString().slice(0, 10),
        tags, Number(b.views) || 0, b.published === false ? 0 : 1,
        b.summary, b.content,
      ],
    )
    const rows = await query(SELECT_ARTICLE + ' WHERE a.id = ?', [result.insertId])
    ok(res, toArticle(rows[0]), '创建成功', 201)
  } catch (err) {
    next(err)
  }
})

/** @api {put} /api/articles/:id 修改文章 */
router.put('/:id', async (req, res, next) => {
  try {
    const rows = await query('SELECT * FROM articles WHERE id = ?', [req.params.id])
    if (!rows.length) return fail(res, '文章不存在', 404)
    const old = rows[0]
    const b = req.body || {}
    const categoryId = b.category === undefined ? old.category_id : await resolveCategoryId(b.category)
    const tags = b.tags === undefined ? old.tags
      : JSON.stringify(Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(/[,，、\s]+/).filter(Boolean))
    await query(
      `UPDATE articles SET title=?, category_id=?, date=?, tags=?, views=?, published=?, summary=?, content=? WHERE id=?`,
      [
        b.title ?? old.title, categoryId, b.date ?? old.date, tags,
        b.views ?? old.views, b.published === undefined ? old.published : (b.published ? 1 : 0),
        b.summary ?? old.summary, b.content ?? old.content, req.params.id,
      ],
    )
    const updated = await query(SELECT_ARTICLE + ' WHERE a.id = ?', [req.params.id])
    ok(res, toArticle(updated[0]), '修改成功')
  } catch (err) {
    next(err)
  }
})

/** @api {patch} /api/articles/:id/publish 切换发布状态 */
router.patch('/:id/publish', async (req, res, next) => {
  try {
    const rows = await query('SELECT id, published FROM articles WHERE id = ?', [req.params.id])
    if (!rows.length) return fail(res, '文章不存在', 404)
    const nextState = rows[0].published ? 0 : 1
    await query('UPDATE articles SET published = ? WHERE id = ?', [nextState, req.params.id])
    const updated = await query(SELECT_ARTICLE + ' WHERE a.id = ?', [req.params.id])
    ok(res, toArticle(updated[0]), nextState ? '已发布' : '已下架')
  } catch (err) {
    next(err)
  }
})

/** @api {delete} /api/articles/:id 删除文章 */
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await query('DELETE FROM articles WHERE id = ?', [req.params.id])
    if (result.affectedRows === 0) return fail(res, '文章不存在', 404)
    ok(res, { id: Number(req.params.id) }, '删除成功')
  } catch (err) {
    next(err)
  }
})

module.exports = router
