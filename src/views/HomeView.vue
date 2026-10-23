<script setup>
// 首页：路由 name 为 home，页面标题由 meta.title 提供。
//
// 本页同时消费三个 Store，展示「跨组件、跨页面数据共享」：
//   profile  —— 姓名 / 班级 / 座右铭
//   projects —— 项目数量与高分项目
//   articles —— 最新文章与总阅读量
// 所有数据都通过 storeToRefs 解构，保持响应式。
import { computed, onMounted } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '../stores/profile'
import { useProjectsStore } from '../stores/projects'
import { useArticlesStore } from '../stores/articles'
import { useAuthStore } from '../stores/auth'
import SectionTitle from '../components/SectionTitle.vue'

const router = useRouter()

const profileStore = useProfileStore()
const { info: profile } = storeToRefs(profileStore)

const projectsStore = useProjectsStore()
const { total, finishedCount, runningCount, topProjects } = storeToRefs(projectsStore)

const articlesStore = useArticlesStore()
const { latest, totalViews, publishedCount } = storeToRefs(articlesStore)

const auth = useAuthStore()
const { isLogged, displayName } = storeToRefs(auth)

// 首次进入时从后端接口加载项目与文章数据（数据来源：MySQL）
onMounted(() => {
  projectsStore.fetchProjects()
  articlesStore.fetchArticles()
})

// 首页展示评分最高的 3 个项目
const featured = computed(() => topProjects.value.slice(0, 3))

// 快速入口：全部使用命名路由，链接地址由路由表统一决定
const shortcuts = [
  { name: 'profile', title: '个人信息', desc: '时间线 + 技能自评', icon: 'User' },
  { name: 'projects', title: '项目列表', desc: '筛选、搜索与详情', icon: 'Folder' },
  { name: 'project-stats', title: '项目统计', desc: '状态分布与技术栈排行', icon: 'DataAnalysis' },
  { name: 'articles', title: '文章列表', desc: '学习笔记与项目复盘', icon: 'Document' },
  { name: 'about', title: '关于我', desc: '基本资料与联系方式', icon: 'InfoFilled' },
  { name: 'admin', title: '后台管理', desc: '需登录，路由守卫拦截', icon: 'Setting' },
]
</script>

<template>
  <div class="home">
    <!-- Hero 区：需要精细排版，保留自定义样式，内部混用原子组件 -->
    <el-card shadow="never" class="hero-card">
      <div class="hero">
        <div class="hero-text">
          <h1>
            你好，我是 {{ profile.name }}
            <el-tag v-if="isLogged" type="success" size="small">
              {{ displayName }} 已登录
            </el-tag>
          </h1>
          <p class="sub">{{ profileStore.signature }}</p>
          <p class="intro">{{ profile.intro }}</p>

          <el-alert
            class="motto"
            type="warning"
            :closable="false"
            :title="`座右铭：${profile.motto}`"
          />

          <div class="hero-actions">
            <el-button type="primary" @click="router.push({ name: 'projects' })">
              <el-icon><Folder /></el-icon>&nbsp;浏览我的项目
            </el-button>
            <el-button @click="router.push({ name: 'profile' })">
              <el-icon><User /></el-icon>&nbsp;查看个人信息
            </el-button>
            <el-button text type="primary" @click="router.push({ name: 'about' })">
              了解更多信息 →
            </el-button>
          </div>
        </div>

        <el-avatar :size="112" class="hero-avatar">{{ profile.name.slice(0, 1) }}</el-avatar>
      </div>

      <!-- 统计数字：el-statistic，数据来自两个不同的 Store -->
      <el-divider />
      <div class="hero-stats">
        <el-statistic title="项目总数" :value="total" />
        <el-statistic title="已完成项目" :value="finishedCount" />
        <el-statistic title="进行中项目" :value="runningCount" />
        <el-statistic title="文章篇数" :value="publishedCount" />
        <el-statistic title="累计阅读" :value="totalViews" />
      </div>
    </el-card>

    <div class="grid-2">
      <!-- 高分项目：数据来自 projects Store 的 getters -->
      <el-card shadow="never">
        <SectionTitle title="高分项目">
          Pinia getters 排序后取前三，数据与项目列表页完全同源
        </SectionTitle>

        <el-empty v-if="!featured.length" description="暂无项目数据" :image-size="80" />

        <ul v-else class="mini-list">
          <li v-for="item in featured" :key="item.id">
            <RouterLink :to="{ name: 'project-detail', params: { id: item.id } }">
              {{ item.name }}
            </RouterLink>
            <span class="muted">
              <el-tag size="small" :type="item.state === '已完成' ? 'success' : 'warning'">
                {{ item.state }}
              </el-tag>
              {{ item.score }} 分
            </span>
          </li>
        </ul>

        <el-button text type="primary" @click="router.push({ name: 'projects' })">
          查看全部项目 →
        </el-button>
      </el-card>

      <!-- 最新文章：数据来自 articles Store 的 getters -->
      <el-card shadow="never">
        <SectionTitle title="最新文章">
          文章数据同样放在 Store 中，后台编辑后此列表立即更新
        </SectionTitle>

        <el-empty v-if="!latest.length" description="暂无已发布文章" :image-size="80" />

        <ul v-else class="mini-list">
          <li v-for="item in latest" :key="item.id">
            <RouterLink :to="{ name: 'article-detail', params: { id: item.id } }">
              {{ item.title }}
            </RouterLink>
            <span class="muted">{{ item.date }} · {{ item.views }} 阅读</span>
          </li>
        </ul>

        <el-button text type="primary" @click="router.push({ name: 'articles' })">
          查看全部文章 →
        </el-button>
      </el-card>
    </div>

    <!-- 导航速览：用 el-card 网格 + el-icon 展示各页面入口 -->
    <el-card shadow="never" class="shortcut-card">
      <SectionTitle title="页面导航速览">
        点击下列卡片，观察地址栏变化与页面内容切换——全程由 Vue Router 完成，浏览器不会整页刷新。
      </SectionTitle>

      <div class="shortcut-grid">
        <el-card
          v-for="s in shortcuts"
          :key="s.name"
          shadow="hover"
          class="shortcut"
          @click="router.push({ name: s.name })"
        >
          <el-icon class="icon"><component :is="s.icon" /></el-icon>
          <strong>{{ s.title }}</strong>
          <span class="muted">{{ s.desc }}</span>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.hero-card {
  margin-bottom: 18px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.hero-text {
  flex: 1;
  min-width: 280px;
}

.hero-text h1 {
  font-size: 26px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.sub {
  color: var(--c-primary-dark);
  font-size: 14px;
  margin-bottom: 10px;
}

.intro {
  color: var(--c-text-soft);
  font-size: 14px;
}

.motto {
  margin-top: 12px;
  width: fit-content;
}

.hero-actions {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hero-avatar {
  background: linear-gradient(135deg, #42b883, #6a5acd);
  color: #fff;
  font-size: 40px;
  font-weight: 700;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 14px;
}

.mini-list {
  list-style: none;
}

.mini-list li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px dashed var(--c-border);
  font-size: 14px;
}

.mini-list li:last-child {
  border-bottom: none;
}

.shortcut-card {
  margin-top: 18px;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
}

.shortcut {
  cursor: pointer;
  transition: transform 0.2s;
}

.shortcut:hover {
  transform: translateY(-2px);
}

.shortcut :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;
}

.shortcut .icon {
  font-size: 22px;
  color: var(--c-primary);
}
</style>
