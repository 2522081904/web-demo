<script setup>
// 项目中心布局：作为父路由组件，提供共享标题、面包屑与统计条，
// 内部放置 RouterView 作为子路由出口（项目列表 / 项目统计 / 项目详情）。
//
// 实验四用 Element Plus 重写了这里的导航与面包屑：
//   el-breadcrumb 由 route.matched 自动生成，不再手写拼接
//   el-menu（mode="horizontal"）作为二级导航，选中项跟随当前路由 name
import { computed } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore } from '../stores/projects'

const route = useRoute()
const router = useRouter()

const store = useProjectsStore()
const { total, finishedCount, runningCount, plannedCount, avgScore } = storeToRefs(store)

// 面包屑：读取当前匹配到的路由记录，父级在前、子级在后
const breadcrumb = computed(() =>
  route.matched
    .filter((item) => item.meta?.title)
    .map((item) => ({ title: item.meta.title, name: item.name })),
)

// 二级导航项：列表与统计是同一父路由下的两条子路由
const subNav = [
  { name: 'projects', label: '项目列表', icon: 'Folder' },
  { name: 'project-stats', label: '项目统计', icon: 'DataAnalysis' },
  { name: 'project-detail', label: '无效详情演示', icon: 'WarningFilled', params: { id: '9999' }, warn: true },
]

const activeSub = computed(() => String(route.name || 'projects'))

function handleSelect(name) {
  const target = subNav.find((item) => item.name === name)
  if (!target) return
  router.push({ name: target.name, params: target.params })
}
</script>

<template>
  <section class="projects-layout">
    <el-card shadow="never" class="head-card">
      <div class="pl-head">
        <div>
          <h1>
            <el-icon><Folder /></el-icon> 项目中心
          </h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ name: 'home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item
              v-for="item in breadcrumb"
              :key="item.title"
            >
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <!-- 一组统计数字，数据全部来自 Pinia Store 的 getters -->
        <div class="head-stats">
          <el-statistic title="项目总数" :value="total" />
          <el-statistic title="平均评分" :value="avgScore" />
        </div>
      </div>

      <!-- 二级导航：横向 el-menu，index 用路由 name -->
      <el-menu
        class="sub-nav"
        mode="horizontal"
        :ellipsis="false"
        :default-active="activeSub"
        @select="handleSelect"
      >
        <el-menu-item v-for="item in subNav" :key="item.name" :index="item.name">
          <el-icon><component :is="item.icon" /></el-icon>
          <span :class="{ warn: item.warn }">{{ item.label }}</span>
        </el-menu-item>
      </el-menu>

      <!-- el-progress 展示各状态占比，条形颜色与徽章保持一致 -->
      <div class="progress-row">
        <div class="progress-item">
          <span class="label">已完成 {{ finishedCount }}</span>
          <el-progress
            :percentage="total ? Math.round((finishedCount / total) * 100) : 0"
            color="#2e7d32"
            :stroke-width="10"
          />
        </div>
        <div class="progress-item">
          <span class="label">进行中 {{ runningCount }}</span>
          <el-progress
            :percentage="total ? Math.round((runningCount / total) * 100) : 0"
            color="#2980b9"
            :stroke-width="10"
          />
        </div>
        <div class="progress-item">
          <span class="label">计划中 {{ plannedCount }}</span>
          <el-progress
            :percentage="total ? Math.round((plannedCount / total) * 100) : 0"
            color="#e67e22"
            :stroke-width="10"
          />
        </div>
      </div>
    </el-card>

    <!-- 子路由出口：父级只负责布局，具体页面由子路由决定 -->
    <RouterView v-slot="{ Component, route: child }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" :key="child.fullPath" />
      </Transition>
    </RouterView>
  </section>
</template>

<style scoped>
.head-card {
  margin-bottom: 18px;
}

.pl-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.pl-head h1 {
  font-size: 22px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.head-stats {
  display: flex;
  gap: 28px;
}

.sub-nav {
  margin-top: 14px;
  border-bottom: 1px solid var(--c-border);
}

.progress-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.progress-item .label {
  font-size: 13px;
  color: var(--c-text-soft);
  display: block;
  margin-bottom: 2px;
}

.warn {
  color: var(--c-danger);
}
</style>
