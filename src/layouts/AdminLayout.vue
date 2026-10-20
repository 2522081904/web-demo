<script setup>
// 后台管理布局：作为带 requiresAuth 元信息的父路由，提供侧边导航与子路由出口。
// 未登录时无法进入：由 router.beforeEach 统一拦截并跳转到登录页。
//
// 实验四用 Element Plus 的容器与导航组件重写：
//   el-container + el-aside + el-main 搭出侧边栏布局
//   el-menu（vertical + collapse）做侧边导航，可折叠
//   el-breadcrumb 由 route.matched 自动生成
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { adminNavItems } from '../router/nav'
import { useAuthStore } from '../stores/auth'
import { useUiStore } from '../stores/ui'

const route = useRoute()
const router = useRouter()

const auth = useAuthStore()
const { user } = storeToRefs(auth)

const ui = useUiStore()
const { sidebarCollapsed } = storeToRefs(ui)

// 侧边菜单高亮：直接使用当前路由 name
const activeMenu = computed(() => String(route.name || 'admin'))

const breadcrumb = computed(() =>
  route.matched.filter((item) => item.meta?.title).map((item) => item.meta.title),
)

function handleSelect(name) {
  if (name === route.name) return
  router.push({ name })
}

// 返回上一级：用 go(-1) 沿历史记录回退，方便从后台直接回到前台页面
function goBack() {
  if (window.history.state?.back) router.go(-1)
  else router.replace({ name: 'home' })
  ElMessage.info('已返回上一页')
}
</script>

<template>
  <section class="admin-layout">
    <el-card shadow="never" class="head-card">
      <div class="al-head">
        <div>
          <h1>
            <el-icon><Setting /></el-icon> 后台管理
          </h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ name: 'home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumb" :key="item">{{ item }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="head-actions">
          <el-tag type="success" effect="dark">
            <el-icon><CircleCheckFilled /></el-icon>
            路由守卫已通过
          </el-tag>
          <span class="muted">当前操作者：{{ user?.name || '未登录' }}</span>
          <el-button size="small" @click="goBack">
            <el-icon><Back /></el-icon>&nbsp;返回上一页
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 侧边栏 + 内容区：el-container 横向排布 -->
    <el-container class="al-body">
      <el-aside :width="sidebarCollapsed ? '64px' : '190px'" class="al-aside">
        <el-menu
          :default-active="activeMenu"
          :collapse="sidebarCollapsed"
          :collapse-transition="false"
          class="side-menu"
          @select="handleSelect"
        >
          <el-menu-item
            v-for="item in adminNavItems"
            :key="item.name"
            :index="item.name"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.label }}</template>
          </el-menu-item>
        </el-menu>

        <el-button
          class="collapse-btn"
          size="small"
          text
          @click="ui.toggleSidebar()"
        >
          <el-icon><component :is="sidebarCollapsed ? 'Expand' : 'Fold'" /></el-icon>
          <span v-if="!sidebarCollapsed">&nbsp;收起菜单</span>
        </el-button>
      </el-aside>

      <el-main class="al-main">
        <!-- 子路由出口：概览 / 修改简介 / 项目管理 / 文章管理 -->
        <RouterView v-slot="{ Component, route: child }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" :key="child.fullPath" />
          </Transition>
        </RouterView>
      </el-main>
    </el-container>
  </section>
</template>

<style scoped>
.head-card {
  margin-bottom: 16px;
}

.al-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.al-head h1 {
  font-size: 22px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.al-body {
  align-items: flex-start;
  gap: 16px;
}

.al-aside {
  transition: width 0.2s;
  background: var(--c-panel);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 8px 6px 12px;
  overflow: hidden;
}

.side-menu {
  border-right: none;
  background: transparent;
}

.collapse-btn {
  width: 100%;
  margin-top: 6px;
  color: var(--c-text-soft);
}

.al-main {
  padding: 0;
  overflow: visible;
}

@media (max-width: 720px) {
  .al-body {
    flex-direction: column;
  }

  .al-aside {
    width: 100% !important;
  }
}
</style>
