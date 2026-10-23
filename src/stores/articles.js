import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  listArticles,
  createArticle,
  updateArticle as apiUpdateArticle,
  deleteArticle,
  togglePublish as apiTogglePublish,
} from '../api/articles'

// 文章 Store：数据由后端 MySQL 提供。前台只展示已发布文章（publishedList），
// 后台读取完整 list；增删改、发布状态切换均通过接口写入数据库。

export const ARTICLE_CATEGORIES = ['学习笔记', '项目复盘', '工具分享', '生活随笔']

export const useArticlesStore = defineStore('articles', () => {
  // ---------- state ----------
  const list = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')

  // ---------- getters ----------
  const publishedList = computed(() =>
    list.value.filter((item) => item.published),
  )

  const total = computed(() => list.value.length)
  const publishedCount = computed(() => publishedList.value.length)
  const draftCount = computed(
    () => list.value.filter((item) => !item.published).length,
  )

  const totalViews = computed(() =>
    list.value.reduce((acc, item) => acc + Number(item.views || 0), 0),
  )

  const allTags = computed(() => {
    const set = new Set()
    list.value.forEach((item) => (item.tags || []).forEach((tag) => set.add(tag)))
    return [...set]
  })

  const categoryStats = computed(() =>
    ARTICLE_CATEGORIES.map((name) => ({
      name,
      count: list.value.filter((item) => item.category === name).length,
    })).sort((a, b) => b.count - a.count),
  )

  const latest = computed(() =>
    [...publishedList.value]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 4),
  )

  // ---------- actions ----------
  async function fetchArticles(force = false) {
    if (loaded.value && !force) return list.value
    loading.value = true
    error.value = ''
    try {
      list.value = await listArticles()
      loaded.value = true
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
    return list.value
  }

  async function refresh() {
    loaded.value = false
    return fetchArticles(true)
  }

  function findById(id) {
    const num = Number(id)
    if (!Number.isInteger(num)) return undefined
    return list.value.find((item) => item.id === num)
  }

  /** 新增文章：调用 POST /api/articles */
  async function addArticle(payload) {
    const created = await createArticle(payload)
    list.value.push(created)
    return created.id
  }

  /** 修改文章：调用 PUT /api/articles/:id */
  async function updateArticle(id, patch) {
    const num = Number(id)
    const updated = await apiUpdateArticle(num, patch)
    const index = list.value.findIndex((item) => item.id === num)
    if (index !== -1) list.value[index] = updated
    return true
  }

  /** 删除文章：调用 DELETE /api/articles/:id */
  async function removeArticle(id) {
    const num = Number(id)
    await deleteArticle(num)
    list.value = list.value.filter((item) => item.id !== num)
    return true
  }

  async function removeArticles(ids) {
    const nums = ids.map((id) => Number(id))
    await Promise.all(nums.map((id) => deleteArticle(id)))
    const set = new Set(nums)
    list.value = list.value.filter((item) => !set.has(item.id))
    return nums.length
  }

  /**
   * 阅读量 +1：先本地自增，再通过 PUT 写回数据库。
   * 文章详情页进入时调用，演示「action 在组件生命周期里被触发并落库」。
   */
  async function increaseViews(id) {
    const num = Number(id)
    const item = list.value.find((a) => a.id === num)
    if (!item) return
    item.views = Number(item.views || 0) + 1
    try {
      await apiUpdateArticle(num, { views: item.views })
    } catch (e) {
      /* 阅读量写入失败不影响页面展示 */
    }
  }

  /** 切换发布状态：调用 PATCH /api/articles/:id/publish */
  async function togglePublished(id) {
    const num = Number(id)
    const updated = await apiTogglePublish(num)
    const index = list.value.findIndex((item) => item.id === num)
    if (index !== -1) list.value[index] = updated
  }

  async function resetArticles() {
    await refresh()
  }

  return {
    // state
    list,
    loading,
    loaded,
    error,
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
    fetchArticles,
    refresh,
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
