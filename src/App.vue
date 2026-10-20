<script setup>
// 实验四 状态管理与UI组件库应用 · 熊焘 249981040 · 24计科2班
//
// App.vue 是整站外壳，用 Element Plus 的布局组件搭出「顶部导航 + 主体 + 页脚」结构：
//   el-container / el-header / el-main / el-footer
// 路由出口放在 el-main 内部，页面切换时只有主体区域变化，外壳不重新渲染。
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterView } from 'vue-router'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import { useUiStore } from './stores/ui'

// 主题状态来自 UI Store：任何组件都能读取和修改，
// 不需要再像实验三那样通过 props / emit 在外壳与顶部导航之间来回传递。
const ui = useUiStore()
const { isDark } = storeToRefs(ui)

// 应用启动时把持久化的主题同步到 body 上
onMounted(() => ui.applyTheme())
</script>

<template>
  <!-- el-container 提供整站纵向布局，direction 默认即为 vertical -->
  <el-container class="app-shell">
    <el-header height="auto" class="app-header">
      <AppHeader :is-dark="isDark" @toggle-theme="ui.toggleTheme()" />
    </el-header>

    <el-main class="app-main">
      <!-- key 使用路由全路径：路径变化时 transition 才会重新播放淡入动画 -->
      <RouterView v-slot="{ Component, route }">
        <Transition name="fade" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </el-main>

    <el-footer height="auto">
      <AppFooter author="熊焘 · 249981040 · 24计科2班" />
    </el-footer>
  </el-container>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.app-header {
  padding: 0;
  height: auto;
}

/* el-main 默认有 20px 内边距，这里改为自适应宽度并保留上下间距 */
.app-main {
  padding: 20px 16px 8px;
  display: flex;
  flex-direction: column;
}

.app-main > :deep(*) {
  width: min(1120px, 100%);
  margin-left: auto;
  margin-right: auto;
}
</style>
