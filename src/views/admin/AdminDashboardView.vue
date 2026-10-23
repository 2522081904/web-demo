<script setup>
// 后台概览：/admin 的默认子路由。
// 汇总项目、文章、用户三个 Store 的数据，并展示 UI Store 记录的提示历史——
// 这一页是「多个 Store 协同工作」最直观的体现。
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import { useProjectsStore } from '../../stores/projects'
import { useArticlesStore } from '../../stores/articles'
import { useProfileStore } from '../../stores/profile'
import { useUiStore } from '../../stores/ui'

const router = useRouter()

const auth = useAuthStore()
const { user } = storeToRefs(auth)

const projectsStore = useProjectsStore()
const { total: projectTotal, finishedCount, runningCount, avgScore, stateDistribution } =
  storeToRefs(projectsStore)

const articlesStore = useArticlesStore()
const { total: articleTotal, publishedCount, draftCount, totalViews, categoryStats } =
  storeToRefs(articlesStore)

const profileStore = useProfileStore()
const { info: profile, avgSkillLevel, timelineCount } = storeToRefs(profileStore)

const ui = useUiStore()
const { history, isDark } = storeToRefs(ui)

onMounted(() => {
  projectsStore.fetchProjects()
  articlesStore.fetchArticles()
})

// 管理入口
const entries = [
  { name: 'admin-profile', label: '修改个人简介', desc: '姓名、班级、邮箱、座右铭', icon: 'EditPen' },
  { name: 'admin-projects', label: '项目管理', desc: '项目的增删改查与恢复初始数据', icon: 'Files' },
  { name: 'admin-articles', label: '文章管理', desc: '文章的增删改查与发布状态切换', icon: 'Notebook' },
  { name: 'projects', label: '前台项目列表', desc: '返回公开页面查看修改结果', icon: 'Folder' },
  { name: 'articles', label: '前台文章列表', desc: '确认草稿不会出现在前台', icon: 'Document' },
  { name: 'profile', label: '个人信息页', desc: '查看时间线与技能自评效果', icon: 'User' },
]

// 各 Store 的规模概览，用 el-descriptions 汇总
const storeSummary = computed(() => [
  { name: 'auth', fields: 'user / pending', getters: 'isLogged / displayName / loginAt', value: user.value ? 1 : 0 },
  { name: 'profile', fields: 'info / timeline / skills', getters: 'signature / avgSkillLevel / timelineCount', value: timelineCount.value },
  { name: 'projects', fields: 'list / lastSavedAt', getters: 'total / avgScore / techRanking', value: projectTotal.value },
  { name: 'articles', fields: 'list', getters: 'publishedList / totalViews / categoryStats', value: articleTotal.value },
  { name: 'ui', fields: 'theme / sidebarCollapsed / history', getters: 'isDark / themeLabel', value: history.value.length },
])

async function clearNoticeHistory() {
  try {
    await ElMessageBox.confirm('将清空本次会话中记录的提示历史。', '确认清空？', {
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }
  ui.clearHistory()
  ElMessage.success('提示历史已清空')
}

function noticeTagType(type) {
  if (type === 'success') return 'success'
  if (type === 'warning') return 'warning'
  if (type === 'error') return 'danger'
  return 'info'
}
</script>

<template>
  <div class="dash">
    <el-card shadow="never" class="welcome">
      <div class="welcome-row">
        <el-avatar :size="52">{{ (user?.name || '游').slice(0, 1) }}</el-avatar>
        <div>
          <h2>欢迎回来，{{ user?.name }}</h2>
          <p class="muted">登录时间：{{ user?.loginAt }} · 登录态已持久化到 localStorage</p>
        </div>
        <el-tag :type="isDark ? 'info' : 'success'" class="theme-tag">
          当前主题：{{ isDark ? '暗色' : '亮色' }}
        </el-tag>
      </div>
    </el-card>

    <!-- 全局统计 -->
    <div class="grid-4">
      <el-card shadow="never" class="num-card">
        <el-statistic title="项目总数" :value="projectTotal" />
      </el-card>
      <el-card shadow="never" class="num-card">
        <el-statistic title="已完成项目" :value="finishedCount" />
      </el-card>
      <el-card shadow="never" class="num-card">
        <el-statistic title="文章总数" :value="articleTotal" />
      </el-card>
      <el-card shadow="never" class="num-card">
        <el-statistic title="草稿数" :value="draftCount" />
      </el-card>
      <el-card shadow="never" class="num-card">
        <el-statistic title="累计阅读" :value="totalViews" />
      </el-card>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :md="14">
        <el-card shadow="never">
          <h4>快捷操作</h4>
          <div class="entries">
            <el-card
              v-for="item in entries"
              :key="item.name"
              shadow="hover"
              class="entry"
              @click="router.push({ name: item.name })"
            >
              <el-icon class="entry-icon"><component :is="item.icon" /></el-icon>
              <strong>{{ item.label }}</strong>
              <span class="muted">{{ item.desc }}</span>
            </el-card>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="10">
        <el-card shadow="never">
          <h4>当前简介摘要</h4>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="姓名">{{ profile.name }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{ profile.studentId }}</el-descriptions-item>
            <el-descriptions-item label="班级">{{ profile.major }}</el-descriptions-item>
            <el-descriptions-item label="座右铭">{{ profile.motto }}</el-descriptions-item>
            <el-descriptions-item label="技能均分">{{ avgSkillLevel }} 分</el-descriptions-item>
          </el-descriptions>

          <el-divider />

          <h4>项目状态分布</h4>
          <div v-for="item in stateDistribution" :key="item.name" class="mini-row">
            <span>{{ item.name }}</span>
            <el-progress
              :percentage="projectTotal ? Math.round((item.value / projectTotal) * 100) : 0"
              :stroke-width="10"
              :format="() => `${item.value} 个`"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" class="row-gap">
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <h4>文章分类统计</h4>
          <div v-for="item in categoryStats" :key="item.name" class="mini-row">
            <span>{{ item.name }}</span>
            <el-progress
              :percentage="articleTotal ? Math.round((item.count / articleTotal) * 100) : 0"
              color="#6a5acd"
              :stroke-width="10"
              :format="() => `${item.count} 篇`"
            />
          </div>
          <el-button text type="primary" @click="router.push({ name: 'admin-articles' })">
            前往文章管理 →
          </el-button>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <div class="card-head">
            <h4>Store 结构一览</h4>
            <el-button size="small" text @click="router.push({ name: 'profile' })">
              查看个人信息页
            </el-button>
          </div>

          <el-table :data="storeSummary" size="small" border>
            <el-table-column prop="name" label="Store" width="90">
              <template #default="{ row }">
                <el-tag size="small">{{ row.name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="fields" label="state" min-width="150" />
            <el-table-column prop="getters" label="getters" min-width="180" />
          </el-table>

          <p class="muted tip">
            在 Vue DevTools 的 Pinia 面板中可以实时观察这些 state 与 getters 的变化。
          </p>
        </el-card>
      </el-col>
    </el-row>

    <!-- UI Store 记录的提示历史：演示 Store 同样可以承载纯界面状态 -->
    <el-card shadow="never" class="row-gap">
      <div class="card-head">
        <h4>本次会话的提示记录（ui Store）</h4>
        <el-button size="small" :disabled="!history.length" @click="clearNoticeHistory">
          清空记录
        </el-button>
      </div>

      <el-empty v-if="!history.length" description="本次会话还没有产生提示" :image-size="70" />

      <el-timeline v-else>
        <el-timeline-item
          v-for="item in history"
          :key="item.id"
          :timestamp="item.time"
          placement="top"
        >
          <el-tag size="small" :type="noticeTagType(item.type)">{{ item.source }}</el-tag>
          <span class="notice-text">{{ item.text }}</span>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<style scoped>
.welcome {
  margin-bottom: 16px;
}

.welcome-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.welcome-row h2 {
  font-size: 20px;
}

.theme-tag {
  margin-left: auto;
}

.num-card {
  text-align: center;
}

h4 {
  font-size: 15px;
  margin-bottom: 12px;
}

.entries {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 10px;
}

.entry {
  cursor: pointer;
}

.entry :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
}

.entry-icon {
  font-size: 20px;
  color: var(--c-primary);
  margin-bottom: 4px;
}

.entry strong {
  font-size: 14px;
}

.mini-row {
  display: grid;
  grid-template-columns: 76px 1fr;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 13px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.card-head h4 {
  margin-bottom: 0;
}

.row-gap {
  margin-top: 16px;
}

.tip {
  margin-top: 10px;
  font-size: 12px;
}

.notice-text {
  margin-left: 8px;
  font-size: 14px;
}

:deep(.el-statistic__content) {
  font-size: 22px;
}

:deep(.el-statistic__head) {
  font-size: 12px;
  color: var(--c-text-soft);
}

:deep(.el-col) {
  margin-bottom: 0;
}
</style>
