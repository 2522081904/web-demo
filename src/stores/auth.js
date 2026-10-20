import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { readStorage, removeStorage, writeStorage } from './persist'

// 用户 Store：整个应用里唯一保存「谁登录了」的地方。
//
// 实验三用模块级 reactive 对象模拟了一个仓库，这里改为标准 Pinia setup store：
//   state   -> ref(state.user)
//   getters -> computed(state.isLogged / displayName)
//   actions -> login / logout / touch
//
// 持久化的做法（实验要求 4.1 第 4 条）：
//   state 初始化时用 readStorage 从 localStorage 取回上一次的登录信息作为默认值；
//   actions 里在修改 state 之后同步调用 writeStorage 写回。
// 这样刷新页面、甚至在地址栏直接改地址，登录态都不会丢。

const STORAGE_NAME = 'user'

/** 演示账号：实验环境不做真实鉴权，密码只做长度校验 */
export const DEMO_ACCOUNT = { username: 'xiongtao', password: '1234' }

export const useAuthStore = defineStore('auth', () => {
  // ---------- state ----------
  // 初始值来自 localStorage：形如 { name, loginAt }；未登录时为 null
  const user = ref(readStorage(STORAGE_NAME, null))

  // 登录表单的提交中标记，用于给按钮加 loading，避免重复点击
  const pending = ref(false)

  // ---------- getters ----------
  // 路由守卫 beforeEach 读取这个值决定是否放行后台页面
  const isLogged = computed(() => Boolean(user.value))

  // 顶部导航显示的名字：未登录时给一个占位文案
  const displayName = computed(() => user.value?.name || '游客')

  // 登录时间：后台概览页展示，便于确认持久化确实生效
  const loginAt = computed(() => user.value?.loginAt || '')

  // ---------- actions ----------
  /**
   * 模拟异步登录。真实项目里这里是调用接口后写入 token。
   * @returns {Promise<{ok: boolean, message: string}>}
   */
  async function login({ name, password }) {
    pending.value = true
    try {
      // 用 300ms 延时模拟网络请求，让按钮的 loading 状态可见
      await new Promise((resolve) => setTimeout(resolve, 300))

      const username = String(name || '').trim()
      if (!username) return { ok: false, message: '请输入用户名' }
      if (String(password || '').trim().length < 4) {
        return { ok: false, message: '密码至少 4 位' }
      }

      // 唯一推荐的状态修改入口：在这里改 state，并立刻持久化
      user.value = {
        name: username,
        loginAt: new Date().toLocaleString('zh-CN'),
      }
      writeStorage(STORAGE_NAME, user.value)
      return { ok: true, message: `欢迎回来，${username}` }
    } finally {
      pending.value = false
    }
  }

  /** 退出登录：清空 state 与本地存储 */
  function logout() {
    user.value = null
    removeStorage(STORAGE_NAME)
  }

  /** 仅供调试使用：把登录态改到指定状态，方便在 DevTools 里观察 store 变化 */
  function reset() {
    user.value = null
    removeStorage(STORAGE_NAME)
  }

  return {
    // state
    user,
    pending,
    // getters
    isLogged,
    displayName,
    loginAt,
    // actions
    login,
    logout,
    reset,
  }
})
