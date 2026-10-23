import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  listProjects,
  createProject,
  updateProject as apiUpdateProject,
  deleteProject,
} from '../api/projects'

// 项目 Store：数据不再来自 localStorage，而是由后端 Express + MySQL 提供。
// 页面首次进入时调用 fetchProjects() 拉取数据；增删改通过 action 调用接口，
// 接口成功后再同步更新本地 list，保证「刷新页面后数据仍一致」。

/** 项目状态全集，供列表筛选与表单下拉共用，避免到处硬编码字符串 */
export const STATE_OPTIONS = ['已完成', '进行中', '计划中']

export const useProjectsStore = defineStore('projects', () => {
  // ---------- state ----------
  const list = ref([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
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

  const stateDistribution = computed(() =>
    STATE_OPTIONS.map((state) => ({
      name: state,
      value: list.value.filter((p) => p.state === state).length,
    })),
  )

  const topProjects = computed(() =>
    [...list.value].sort((a, b) => Number(b.score) - Number(a.score)),
  )

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
  /** 从接口加载项目列表；loaded 为 true 时不重复请求（force 可强制刷新） */
  async function fetchProjects(force = false) {
    if (loaded.value && !force) return list.value
    loading.value = true
    error.value = ''
    try {
      list.value = await listProjects()
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
    return fetchProjects(true)
  }

  function findById(id) {
    const num = Number(id)
    if (!Number.isInteger(num)) return undefined
    return list.value.find((p) => p.id === num)
  }

  function normalizeTech(tech) {
    if (Array.isArray(tech)) return tech.filter(Boolean)
    return String(tech || '')
      .split(/[,，、\s]+/)
      .filter(Boolean)
  }

  /** 新增项目：调用 POST /api/projects，成功后插入本地列表 */
  async function addProject(payload) {
    const created = await createProject({
      ...payload,
      tech: normalizeTech(payload.tech),
    })
    list.value.push(created)
    lastSavedAt.value = new Date().toLocaleTimeString('zh-CN')
    return created.id
  }

  /** 修改项目：调用 PUT /api/projects/:id */
  async function updateProject(id, patch) {
    const num = Number(id)
    const body = { ...patch }
    if (patch.tech !== undefined) body.tech = normalizeTech(patch.tech)
    const updated = await apiUpdateProject(num, body)
    const index = list.value.findIndex((p) => p.id === num)
    if (index !== -1) list.value[index] = updated
    lastSavedAt.value = new Date().toLocaleTimeString('zh-CN')
    return true
  }

  /** 删除项目：调用 DELETE /api/projects/:id */
  async function removeProject(id) {
    const num = Number(id)
    await deleteProject(num)
    list.value = list.value.filter((p) => p.id !== num)
    lastSavedAt.value = new Date().toLocaleTimeString('zh-CN')
    return true
  }

  /** 批量删除 */
  async function removeProjects(ids) {
    const nums = ids.map((id) => Number(id))
    await Promise.all(nums.map((id) => deleteProject(id)))
    const set = new Set(nums)
    list.value = list.value.filter((p) => !set.has(p.id))
    lastSavedAt.value = new Date().toLocaleTimeString('zh-CN')
    return nums.length
  }

  /** 刷新（后台「刷新数据」按钮） */
  async function resetProjects() {
    await refresh()
    lastSavedAt.value = ''
  }

  return {
    // state
    list,
    loading,
    loaded,
    error,
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
    fetchProjects,
    refresh,
    findById,
    addProject,
    updateProject,
    removeProject,
    removeProjects,
    resetProjects,
  }
})
