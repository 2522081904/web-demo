import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { seedProjects } from '../data/projects'
import { readStorage, removeStorage, writeStorage } from './persist'

// 项目 Store：项目数据的唯一来源。
//
// 前台「项目列表 / 项目统计 / 项目详情」与后台「项目管理」读写的都是这一份 state，
// 因此在后台新增一条项目后，前台列表与统计数字会立刻同步——不需要任何父子组件传参。
// 这就是实验目的中「跨组件、跨页面数据共享」最直观的体现。

const STORAGE_NAME = 'projects'

/** 项目状态全集，供列表筛选与表单下拉共用，避免到处硬编码字符串 */
export const STATE_OPTIONS = ['已完成', '进行中', '计划中']

/** 返回值拷贝种子数据，防止业务代码改到原数组 */
function createSeed() {
  return seedProjects.map((item) => ({ ...item, tech: [...(item.tech || [])] }))
}

function loadProjects() {
  const saved = readStorage(STORAGE_NAME, null)
  if (Array.isArray(saved) && saved.length) return saved
  // 本地没有数据（或数据被清空）时使用种子数据
  return createSeed()
}

export const useProjectsStore = defineStore('projects', () => {
  // ---------- state ----------
  const list = ref(loadProjects())

  // 数据是否已经落盘，仅用于后台页面提示；真实项目中这里通常是请求状态
  const lastSavedAt = ref('')

  // ---------- getters ----------
  const total = computed(() => list.value.length)

  const finishedCount = computed(
    () => list.value.filter((p) => p.state === '已完成').length,
  )
  const runningCount = computed(
    () => list.value.filter((p) => p.state === '进行中').length,
  )
  const plannedCount = computed(
    () => list.value.filter((p) => p.state === '计划中').length,
  )

  const avgScore = computed(() => {
    if (!list.value.length) return 0
    const sum = list.value.reduce((acc, p) => acc + Number(p.score || 0), 0)
    return Math.round(sum / list.value.length)
  })

  /** 技术栈使用次数排行，项目统计页的条形图直接消费这个结果 */
  const techRanking = computed(() => {
    const counter = new Map()
    list.value.forEach((project) => {
      ;(project.tech || []).forEach((tech) =>
        counter.set(tech, (counter.get(tech) || 0) + 1),
      )
    })
    return [...counter.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
  })

  /** 项目状态分布，用于统计页与后台概览的饼图 / 进度条 */
  const stateDistribution = computed(() =>
    STATE_OPTIONS.map((state) => ({
      name: state,
      value: list.value.filter((p) => p.state === state).length,
    })),
  )

  /** 首页与后台概览复用：按评分取前 N 个高分项目 */
  const topProjects = computed(() =>
    [...list.value].sort((a, b) => Number(b.score) - Number(a.score)),
  )

  /** 按年份归组，用于时间线式展示 */
  const byYear = computed(() => {
    const map = new Map()
    list.value.forEach((project) => {
      const year = project.year || '未标注'
      if (!map.has(year)) map.set(year, [])
      map.get(year).push(project)
    })
    return [...map.entries()]
      .map(([year, items]) => ({ year, items }))
      .sort((a, b) => String(b.year).localeCompare(String(a.year)))
  })

  // ---------- actions ----------
  /** 持久化当前列表。所有会改动数据的 action 末尾都调用它 */
  function persist() {
    writeStorage(STORAGE_NAME, list.value)
    lastSavedAt.value = new Date().toLocaleTimeString('zh-CN')
  }

  /**
   * 按 id 查找项目。路由参数是字符串，这里统一 Number() 后再做数字比较，
   * 传入非法值（如 /projects/detail/abc）时返回 undefined，由详情页处理。
   */
  function findById(id) {
    const num = Number(id)
    if (!Number.isInteger(num)) return undefined
    return list.value.find((p) => p.id === num)
  }

  /** 把字符串或数组统一规整成技术栈数组 */
  function normalizeTech(tech) {
    if (Array.isArray(tech)) return tech.filter(Boolean)
    return String(tech || '')
      .split(/[,，、\s]+/)
      .filter(Boolean)
  }

  /** 新增项目：id 取当前最大值 + 1，保证动态路由参数唯一 */
  function addProject(payload) {
    const nextId = list.value.reduce((max, p) => Math.max(max, p.id), 0) + 1
    list.value.unshift({
      id: nextId,
      state: '计划中',
      score: 80,
      year: new Date().getFullYear(),
      role: '个人项目',
      link: '',
      highlights: [],
      ...payload,
      tech: normalizeTech(payload.tech),
    })
    persist()
    return nextId
  }

  /** 修改项目：只覆盖传入的字段 */
  function updateProject(id, patch) {
    const num = Number(id)
    const index = list.value.findIndex((p) => p.id === num)
    if (index === -1) return false
    const merged = { ...list.value[index], ...patch }
    if (patch.tech !== undefined) merged.tech = normalizeTech(patch.tech)
    list.value[index] = merged
    persist()
    return true
  }

  /** 删除项目：删除后它的详情地址会变成无效地址，由详情页兜底 */
  function removeProject(id) {
    const num = Number(id)
    const index = list.value.findIndex((p) => p.id === num)
    if (index === -1) return false
    list.value.splice(index, 1)
    persist()
    return true
  }

  /** 批量删除，供后台表格多选删除使用 */
  function removeProjects(ids) {
    const set = new Set(ids.map((id) => Number(id)))
    const before = list.value.length
    list.value = list.value.filter((p) => !set.has(p.id))
    persist()
    return before - list.value.length
  }

  /** 恢复初始项目数据 */
  function resetProjects() {
    list.value = createSeed()
    removeStorage(STORAGE_NAME)
    lastSavedAt.value = ''
  }

  return {
    // state
    list,
    lastSavedAt,
    // getters
    total,
    finishedCount,
    runningCount,
    plannedCount,
    avgScore,
    techRanking,
    stateDistribution,
    topProjects,
    byYear,
    // actions
    findById,
    addProject,
    updateProject,
    removeProject,
    removeProjects,
    resetProjects,
  }
})
