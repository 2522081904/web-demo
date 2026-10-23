// 录入示例数据：读取 data/seed.json（由实验四前端种子数据导出），写入 MySQL。
// 可重复执行：先清空三张表，再按外键顺序插入分类 → 项目 → 文章。
const fs = require('fs')
const path = require('path')
const { query, pool } = require('./db')

const CATEGORIES = ['学习笔记', '项目复盘', '工具分享', '生活随笔']

async function main() {
  const seed = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'seed.json'), 'utf-8'))

  // 清空（临时关闭外键检查，避免受 articles 外键约束影响）
  await query('SET FOREIGN_KEY_CHECKS = 0')
  await query('TRUNCATE TABLE articles')
  await query('TRUNCATE TABLE projects')
  await query('TRUNCATE TABLE article_categories')
  await query('SET FOREIGN_KEY_CHECKS = 1')

  // 分类
  for (const name of CATEGORIES) {
    await query('INSERT INTO article_categories (name) VALUES (?)', [name])
  }
  const catRows = await query('SELECT id, name FROM article_categories')
  const catMap = Object.fromEntries(catRows.map((r) => [r.name, r.id]))

  // 项目
  for (const p of seed.projects) {
    await query(
      `INSERT INTO projects (name, state, year, role, score, duration, link, description, tech, highlights)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.name, p.state, p.year, p.role, p.score, p.duration, p.link, p.description,
        JSON.stringify(p.tech || []), JSON.stringify(p.highlights || []),
      ],
    )
  }

  // 文章
  for (const a of seed.articles) {
    const cid = catMap[a.category] || catMap['学习笔记']
    await query(
      `INSERT INTO articles (title, category_id, date, tags, views, published, summary, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.title, cid, a.date, JSON.stringify(a.tags || []), a.views || 0, a.published ? 1 : 0, a.summary, a.content],
    )
  }

  console.log(`[seed] 完成：${seed.projects.length} 个项目，${seed.articles.length} 篇文章`)
  await pool.end()
}

main().catch((err) => {
  console.error('[seed] 失败：', err.message)
  process.exit(1)
})
