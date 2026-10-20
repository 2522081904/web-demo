<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { navItems } from '../router/nav'
import { useAuthStore } from '../stores/auth'
import { useProfileStore } from '../stores/profile'
import { useUiStore } from '../stores/ui'
import { getRouterMode, setRouterMode } from '../router/mode'

// defineProps：主题状态由外壳传入（外壳自己从 UI Store 读取），
// 这里保留 props 是为了展示「父传子」与「Store 直读」两种方式并存
defineProps({
  isDark: { type: Boolean, default: false },
})

// defineEmits：子组件不直接调用父组件的方法，改用事件通知
const emit = defineEmits(['toggle-theme'])

const route = useRoute()
const router = useRouter()

// storeToRefs：解构 Store 的 state 与 getters，保持响应式
// （actions 是普通函数，直接从 store 实例上解构即可）
const auth = useAuthStore()
const { user, isLogged } = storeToRefs(auth)
const { logout } = auth

const profileStore = useProfileStore()
const { info: profile } = storeToRefs(profileStore)

const ui = useUiStore()

// el-menu 的 :default-active 需要当前高亮的菜单项 key。
// 说明：el-menu 在 router 模式下用 index 作为路径跳转，
// 但「项目统计」与「项目列表」这类同前缀地址用路径做 key 容易误判，
// 因此这里改用路由 name 做 key，跳转由 handleSelect 手动完成。
const activeName = computed(() => {
  // 详情页 / 子路由高亮到它的父级导航项
  if (route.name === 'project-detail') return 'projects'
  if (route.name === 'article-detail') return 'articles'
  if (route.name === 'admin-profile' || route.name === 'admin-projects' || route.name === 'admin-articles') {
    return 'admin'
  }
  return String(route.name || 'home')
})

/** el-menu 选中回调：用命名路由跳转，避免拼接字符串 */
function handleSelect(name) {
  if (name === route.name) return
  router.push({ name })
}

/** 退出登录：二次确认后清空登录态，并回到首页 */
async function handleLogout() {
  try {
    await ElMessageBox.confirm('退出后需要重新登录才能进入后台管理。', '确认退出登录？', {
      confirmButtonText: '退出登录',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    // 用户点击取消，ElMessageBox 会 reject，这里直接结束
    return
  }
  logout()
  ElMessage.success('已退出登录')
  router.replace({ name: 'home' })
}

function handleModeChange(mode) {
  setRouterMode(mode)
}
</script>

<template>
  <header class="site-header">
    <div class="bar">
      <!-- 品牌区点击回到首页，使用命名路由而不是写死路径 -->
      <RouterLink :to="{ name: 'home' }" class="brand">
        <el-avatar :size="36" class="logo">XT</el-avatar>
        <span class="name">
          {{ profile.name }} · 个人主页
          <small>学号 {{ profile.studentId }}</small>
        </span>
      </RouterLink>

      <!-- 主导航：el-menu 横向模式，选中项跟随当前路由 name -->
      <el-menu
        class="nav"
        mode="horizontal"
        :ellipsis="false"
        :default-active="activeName"
        @select="handleSelect"
      >
        <el-menu-item v-for="item in navItems" :key="item.name" :index="item.name">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>

      <div class="actions">
        <!-- Hash / History 两种路由模式切换，便于对比两种地址形式 -->
        <el-select
          :model-value="getRouterMode()"
          class="mode-select"
          size="small"
          title="切换路由模式"
          @change="handleModeChange"
        >
          <el-option label="History 模式" value="history" />
          <el-option label="Hash 模式" value="hash" />
        </el-select>

        <!-- el-tooltip 包住按钮，悬停时给出说明 -->
        <el-tooltip :content="isDark ? '切换到亮色主题' : '切换到暗色主题'" placement="bottom">
          <el-button circle @click="emit('toggle-theme')">
            <el-icon><component :is="isDark ? 'Sunny' : 'Moon'" /></el-icon>
          </el-button>
        </el-tooltip>

        <!-- 已登录显示下拉菜单（含个人信息与退出），未登录显示登录按钮 -->
        <el-dropdown v-if="isLogged" trigger="click">
          <span class="user-chip">
            <el-avatar :size="26">{{ user.name.slice(0, 1) }}</el-avatar>
            {{ user.name }}
            <el-icon><ArrowDown /></el-icon>
          </span>

          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                登录时间：{{ user.loginAt }}
              </el-dropdown-item>
              <el-dropdown-item divided @click="router.push({ name: 'admin' })">
                <el-icon><Odometer /></el-icon> 进入后台管理
              </el-dropdown-item>
              <el-dropdown-item @click="router.push({ name: 'admin-profile' })">
                <el-icon><EditPen /></el-icon> 修改个人简介
              </el-dropdown-item>
              <el-dropdown-item divided @click="handleLogout">
                <el-icon><SwitchButton /></el-icon> 退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button v-else type="primary" @click="router.push({ name: 'login' })">
          <el-icon><UserFilled /></el-icon>&nbsp;登录 / 管理
        </el-button>
      </div>
    </div>

    <p class="mode-hint muted">
      当前路由模式：<el-tag size="small" :type="getRouterMode() === 'hash' ? 'warning' : 'success'">
        {{ getRouterMode() === 'hash' ? 'Hash（地址含 #）' : 'History（地址不含 #）' }}
      </el-tag>
      <span class="hint-text">部署到 GitHub Pages 后可在这里对比两种模式的刷新表现</span>
    </p>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--c-panel);
  border-bottom: 1px solid var(--c-border);
}

.bar {
  width: min(1120px, 100% - 32px);
  margin: 0 auto;
  padding: 8px 0;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--c-text);
}

.brand:hover {
  text-decoration: none;
}

.logo {
  background: var(--c-primary);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
}

.name {
  font-weight: 700;
  font-size: 15px;
  line-height: 1.3;
}

.name small {
  display: block;
  font-weight: 400;
  font-size: 11px;
  color: var(--c-text-soft);
}

/* 横向菜单去掉默认下边框，让它融入顶部栏 */
.nav {
  flex: 1;
  min-width: 320px;
  border-bottom: none;
  background: transparent;
}

.nav :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  font-size: 14px;
}

.actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.mode-select {
  width: 132px;
}

.user-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
  outline: none;
}

.mode-hint {
  width: min(1120px, 100% - 32px);
  margin: 0 auto;
  padding-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.hint-text {
  font-size: 12px;
  color: var(--c-text-soft);
}
</style>
