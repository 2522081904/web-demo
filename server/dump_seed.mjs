// 从实验四的前端种子数据文件导出 JSON，供数据库初始化使用。
import { seedProjects } from '../src/data/projects.js'
import { seedArticles } from '../src/data/articles.js'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(dir, 'data')
fs.mkdirSync(dataDir, { recursive: true })
fs.writeFileSync(
  path.join(dataDir, 'seed.json'),
  JSON.stringify({ projects: seedProjects, articles: seedArticles }, null, 2),
  'utf-8',
)
console.log('seed.json written:', seedProjects.length, 'projects,', seedArticles.length, 'articles')
