import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

// UI Store：把「全局提示」与「主题」这类纯界面状态集中管理。
//
// 实验三里 toast 是一个自己实现的仓库，实验四换成 Element Plus 的 ElMessage 之后，
// 这个 Store 的职责变成了「统一提示入口 + 提示历史」：
//   - 组件不再各自 import ElMessage，而是调用 store 的 notify，方便以后统一换实现；
//   - history 保存最近若干条提示，后台概览页可以展示出来，用于演示 Store 的状态变化。
//
// 主题属于纯前端偏好，不属于业务数据，因此不进 localStorage 的 exp4: 命名空间，
// 仍然沿用实验三的 exp3:theme 键，保证两个实验之间的主题选择是连续的。

const THEME_KEY = 'exp3:theme'

export const useUiStore = defineStore('ui', () => {
  // ---------- state ----------
  const theme = ref(localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light')

  // 侧边栏折叠状态：后台管理布局使用
  const sidebarCollapsed = ref(false)

  // 最近 8 条提示记录
  const history = ref([])

  // ---------- getters ----------
  const isDark = computed(() => theme.value === 'dark')

  const themeLabel = computed(() => (isDark.value ? '暗色' : '亮色'))

  // ---------- actions ----------
  /** 切换主题，并把选择写回 localStorage */
  function toggleTheme() {
    theme.value = isDark.value ? 'light' : 'dark'
    applyTheme()
  }

  /** 把当前主题同步到 body 的 class 上，CSS 变量随之切换 */
  function applyTheme() {
    document.body.classList.toggle('dark', isDark.value)
    localStorage.setItem(THEME_KEY, theme.value)
  }

  /**
   * 记录一条提示。真正的弹出由调用方通过 ElMessage 完成，
   * 这里只负责维护「最近发生了什么」这份状态，
   * 让 Store 里能看到完整的数据流，便于在 Vue DevTools 中观察。
   */
  function pushNotice({ text, type = 'success', source = '未知组件' }) {
    history.value.unshift({
      id: Date.now() + Math.random(),
      text,
      type,
      source,
      time: new Date().toLocaleTimeString('zh-CN'),
    })
    if (history.value.length > 8) history.value.length = 8
  }

  function clearHistory() {
    history.value = []
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return {
    // state
    theme,
    sidebarCollapsed,
    history,
    // getters
    isDark,
    themeLabel,
    // actions
    toggleTheme,
    applyTheme,
    pushNotice,
    clearHistory,
    toggleSidebar,
  }
})
