import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { seedArticles } from '../data/articles'
import { readStorage, removeStorage, writeStorage } from './persist'

// 文章 Store：实验四新增的「文章列表 / 文章管理」所需的数据来源。
//
// 与项目 Store 结构一致，但多了几个文章特有的字段与派生逻辑：
//   - tags 标签数组，用于列表页按标签筛选
//   - published 是否发布，前台列表只展示已发布文章，后台能看到全部
//   - views 阅读量，文章详情页进入时 +1，用于验证 action 的调用时机
// 前台与后台看到的是同一份 state，不同视角只是不同的 getters。

const STORAGE_NAME = 'articles'

export const ARTICLE_CATEGORIES = ['学习笔记', '项目复盘', '工具分享', '生活随笔']

function createSeed() {
  return seedArticles.map((item) => ({ ...item, tags: [...(item.tags || [])] }))
}

function loadArticles() {
  const saved = readStorage(STORAGE_NAME, null)
  if (Array.isArray(saved) && saved.length) return saved
  return createSeed()
}

export const useArticlesStore = defineStore('articles', () => {
  // ---------- state ----------
  const list = ref(loadArticles())

  // ---------- getters ----------
  /** 前台只展示已发布文章 */
  const publishedList = computed(() =>
    list.value.filter((item) => item.published),
  )

  const total = computed(() => list.value.length)
  const publishedCount = computed(() => publishedList.value.length)
  const draftCount = computed(
    () => list.value.filter((item) => !item.published).length,
  )

  /** 总阅读量：首页统计卡片使用 */
  const totalViews = computed(() =>
    list.value.reduce((acc, item) => acc + Number(item.views || 0), 0),
  )

  /** 全部标签去重，用于筛选下拉框 */
  const allTags = computed(() => {
    const set = new Set()
    list.value.forEach((item) => (item.tags || []).forEach((tag) => set.add(tag)))
    return [...set]
  })

  /** 按分类统计篇数，后台概览用 el-progress 展示 */
  const categoryStats = computed(() =>
    ARTICLE_CATEGORIES.map((name) => ({
      name,
      count: list.value.filter((item) => item.category === name).length,
    })).sort((a, b) => b.count - a.count),
  )

  /** 最新发布的几篇，供首页侧栏展示 */
  const latest = computed(() =>
    [...publishedList.value]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 4),
  )

  // ---------- actions ----------
  function persist() {
    writeStorage(STORAGE_NAME, list.value)
  }

  function findById(id) {
    const num = Number(id)
    if (!Number.isInteger(num)) return undefined
    return list.value.find((item) => item.id === num)
  }

  function addArticle(payload) {
    const nextId = list.value.reduce((max, item) => Math.max(max, item.id), 0) + 1
    list.value.unshift({
      id: nextId,
      date: new Date().toISOString().slice(0, 10),
      published: true,
      views: 0,
      tags: [],
      category: ARTICLE_CATEGORIES[0],
      ...payload,
      tags: Array.isArray(payload.tags)
        ? payload.tags
        : String(payload.tags || '')
            .split(/[,，、\s]+/)
            .filter(Boolean),
    })
    persist()
    return nextId
  }

  function updateArticle(id, patch) {
    const num = Number(id)
    const index = list.value.findIndex((item) => item.id === num)
    if (index === -1) return false
    const merged = { ...list.value[index], ...patch }
    if (patch.tags !== undefined) {
      merged.tags = Array.isArray(patch.tags)
        ? patch.tags
        : String(patch.tags || '')
            .split(/[,，、\s]+/)
            .filter(Boolean)
    }
    list.value[index] = merged
    persist()
    return true
  }

  function removeArticle(id) {
    const num = Number(id)
    const index = list.value.findIndex((item) => item.id === num)
    if (index === -1) return false
    list.value.splice(index, 1)
    persist()
    return true
  }

  function removeArticles(ids) {
    const set = new Set(ids.map((id) => Number(id)))
    const before = list.value.length
    list.value = list.value.filter((item) => !set.has(item.id))
    persist()
    return before - list.value.length
  }

  /**
   * 阅读量 +1。文章详情页进入时调用，
   * 用来演示「action 是修改 state 的唯一入口，且在组件生命周期里被触发」。
   */
  function increaseViews(id) {
    const article = findById(id)
    if (!article) return
    article.views = Number(article.views || 0) + 1
    persist()
  }

  /** 切换发布状态：后台表格里的一键上架 / 下架 */
  function togglePublished(id) {
    const article = findById(id)
    if (!article) return
    article.published = !article.published
    persist()
  }

  function resetArticles() {
    list.value = createSeed()
    removeStorage(STORAGE_NAME)
  }

  return {
    // state
    list,
    // getters
    publishedList,
    total,
    publishedCount,
    draftCount,
    totalViews,
    allTags,
    categoryStats,
    latest,
    // actions
    findById,
    addArticle,
    updateArticle,
    removeArticle,
    removeArticles,
    increaseViews,
    togglePublished,
    resetArticles,
  }
})
