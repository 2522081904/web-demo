import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { readObjectStorage, removeStorage, writeStorage } from './persist'

// 个人简介 Store：姓名、学号、班级等基本信息。
//
// 这些字段会被「首页 Hero 区」「关于我 / 个人信息页」「顶部导航」
// 「后台修改简介页」四个地方同时使用，正是实验要求中典型的
// 「跨组件、跨页面共享的数据」，因此放进 Store 而不是各页面各自维护副本。

const STORAGE_NAME = 'profile'

/** 默认资料。恢复默认、字段补齐都以它为基准 */
export const defaultProfile = {
  name: '熊焘',
  studentId: '249981040',
  major: '计算机科学与技术 24 级 2 班',
  email: 'xiongtao@example.com',
  github: 'https://github.com/',
  motto: '把每一个按钮都做对。',
  intro:
    '计算机科学与技术专业学生，热爱前端工程化与可视化方向，喜欢把复杂问题拆成一个个能跑起来的小模块。',
}

/** 学习与成长时间线：个人信息页用 el-timeline 展示 */
export const educationTimeline = [
  {
    year: '2024',
    title: '进入计算机科学与技术专业',
    type: 'primary',
    desc: '系统学习 C 语言、数据结构与计算机组成原理，完成实验一静态页面与实验二组件化开发。',
  },
  {
    year: '2025 上',
    title: '完成 Vue 3 组件化与路由实验',
    type: 'success',
    desc: '掌握组合式 API、组件通信、嵌套路由与路由守卫，独立完成个人主页的路由骨架。',
  },
  {
    year: '2025 下',
    title: '参与校园二手交易平台前端开发',
    type: 'success',
    desc: '负责列表页与状态管理模块，第一次把 Pinia 用在真实项目里，理解了单一数据源的价值。',
  },
  {
    year: '2026 上',
    title: '引入 Pinia 与 Element Plus 重构个人主页',
    type: 'warning',
    desc: '把局部状态统一收敛到 Store，用 Element Plus 重构界面，并通过 GitHub Actions 部署上线。',
  },
  {
    year: '2026 下',
    title: '计划：深入学习前端工程化与可视化',
    type: 'info',
    desc: '继续补充单元测试、性能优化与数据可视化方向的知识。',
  },
]

/** 技能自评：个人信息页用 el-progress 展示 */
export const skillList = [
  { name: 'Vue 3 / 组合式 API', level: 90 },
  { name: 'Vue Router / 路由设计', level: 85 },
  { name: 'Pinia / 状态管理', level: 82 },
  { name: 'Element Plus / 组件库', level: 80 },
  { name: 'Vite / 前端工程化', level: 78 },
  { name: 'C / STM32 嵌入式', level: 72 },
]

export const useProfileStore = defineStore('profile', () => {
  // ---------- state ----------
  // 用默认值补齐本地数据：以后新增字段时旧数据仍然可读
  const info = ref(readObjectStorage(STORAGE_NAME, defaultProfile))

  // 时间线与技能清单属于「只读展示数据」，同样放进 Store，
  // 方便后台以后扩展成可编辑的列表，也避免多个页面各写一份副本
  const timeline = ref(educationTimeline.map((item) => ({ ...item })))
  const skills = ref(skillList.map((item) => ({ ...item })))

  // ---------- getters ----------
  // 首页 Hero 区与关于页共用的「一句话身份」
  const signature = computed(
    () => `${info.value.major} · 学号 ${info.value.studentId}`,
  )

  // 技能平均分：后台概览页用它做整体水平参考
  const avgSkillLevel = computed(() => {
    if (!skills.value.length) return 0
    const sum = skills.value.reduce((acc, item) => acc + Number(item.level || 0), 0)
    return Math.round(sum / skills.value.length)
  })

  // 时间线条数：个人信息页的统计卡片使用
  const timelineCount = computed(() => timeline.value.length)

  // ---------- actions ----------
  /**
   * 保存资料。patch 只包含表单里改动的字段，其余字段保持原值。
   * 修改 state 后立即写回 localStorage，达到「刷新不丢失」的效果。
   */
  function saveProfile(patch) {
    info.value = { ...info.value, ...patch }
    writeStorage(STORAGE_NAME, info.value)
  }

  /** 恢复默认资料，同时清除本地存储 */
  function resetProfile() {
    info.value = { ...defaultProfile }
    removeStorage(STORAGE_NAME)
  }

  return {
    // state
    info,
    timeline,
    skills,
    // getters
    signature,
    avgSkillLevel,
    timelineCount,
    // actions
    saveProfile,
    resetProfile,
  }
})
