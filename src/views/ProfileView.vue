<script setup>
// 个人信息页 —— 实验四要求「在个人信息页面新增时间线」的落点。
//
// 本页集中使用多种 Element Plus 组件，是组件使用密度的主要来源：
//   el-descriptions  基本信息表格（带边框）
//   el-timeline      学习与成长时间线（实验要求新增）
//   el-progress      技能自评进度条
//   el-tag           技术标签 / 状态标签
//   el-avatar        头像
//   el-statistic     统计数字
//   el-card          卡片容器
//   el-icon          图标
//   el-divider       分隔线
//   el-button        操作按钮
//   el-empty         空状态
//   el-alert         提示
//
// 所有数据来自 profile Store，后台「修改简介」保存后本页立即同步。
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '../stores/profile'
import { useProjectsStore } from '../stores/projects'
import { useArticlesStore } from '../stores/articles'
import SectionTitle from '../components/SectionTitle.vue'

const router = useRouter()

const profileStore = useProfileStore()
const { info, timeline, skills, avgSkillLevel, timelineCount } = storeToRefs(profileStore)

const projectsStore = useProjectsStore()
const { total, finishedCount } = storeToRefs(projectsStore)

const articlesStore = useArticlesStore()
const { publishedCount } = storeToRefs(articlesStore)

// 时间线按年份倒序展示：最近的经历放在最上面
const sortedTimeline = computed(() =>
  [...timeline.value].sort((a, b) => String(b.year).localeCompare(String(a.year))),
)

// 技能按熟练度分档，用 el-progress 的不同颜色区分
function skillColor(level) {
  if (level >= 85) return '#42b883'
  if (level >= 78) return '#2980b9'
  return '#e67e22'
}

function skillStatus(level) {
  if (level >= 85) return 'success'
  if (level >= 78) return 'exception'
  return 'warning'
}

// 联系方式：el-descriptions 的数据源
const contactItems = computed(() => [
  { label: '姓名', value: info.value.name },
  { label: '学号', value: info.value.studentId },
  { label: '班级 / 专业', value: info.value.major },
  { label: '邮箱', value: info.value.email },
  { label: 'GitHub', value: info.value.github },
  { label: '座右铭', value: info.value.motto },
])
</script>

<template>
  <div class="profile-page">
    <!-- 顶部个人名片 -->
    <el-card shadow="never" class="intro-card">
      <div class="intro">
        <el-avatar :size="96" class="avatar">{{ info.name.slice(0, 1) }}</el-avatar>

        <div class="intro-text">
          <h1>{{ info.name }}</h1>
          <p class="sub">{{ profileStore.signature }}</p>
          <p class="muted">{{ info.intro }}</p>

          <div class="tags">
            <el-tag v-for="s in skills.slice(0, 4)" :key="s.name" size="small" effect="plain">
              {{ s.name }}
            </el-tag>
          </div>
        </div>

        <el-button type="primary" plain @click="router.push({ name: 'admin-profile' })">
          <el-icon><EditPen /></el-icon>&nbsp;修改资料
        </el-button>
      </div>

      <el-divider />

      <div class="stat-row">
        <el-statistic title="项目总数" :value="total" />
        <el-statistic title="已完成项目" :value="finishedCount" />
        <el-statistic title="已发布文章" :value="publishedCount" />
        <el-statistic title="时间线节点" :value="timelineCount" />
        <el-statistic title="技能均分" :value="avgSkillLevel" suffix="分" />
      </div>
    </el-card>

    <!-- 基本信息：el-descriptions 带边框展示，比手写 info-grid 更规整 -->
    <el-card shadow="never">
      <SectionTitle title="基本信息">
        数据保存在 profile Store 中，修改后首页、关于页与本页会同时更新
      </SectionTitle>

      <el-descriptions :column="2" border>
        <el-descriptions-item
          v-for="item in contactItems"
          :key="item.label"
          :label="item.label"
        >
          <a v-if="item.label === 'GitHub'" :href="item.value" target="_blank" rel="noopener">
            {{ item.value }}
          </a>
          <template v-else>{{ item.value }}</template>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 学习与成长时间线：实验要求的核心新增内容 -->
    <el-card shadow="never">
      <SectionTitle title="学习与成长时间线">
        el-timeline 按时间倒序展示关键节点，节点颜色区分事件类型
      </SectionTitle>

      <el-empty v-if="!sortedTimeline.length" description="暂无时间线数据" :image-size="80" />

      <el-timeline v-else>
        <el-timeline-item
          v-for="item in sortedTimeline"
          :key="item.year + item.title"
          :timestamp="item.year"
          :type="item.type"
          placement="top"
          size="large"
          hollow
        >
          <el-card shadow="hover" class="tl-card">
            <h4>{{ item.title }}</h4>
            <p class="muted">{{ item.desc }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 技能自评：el-progress 进度条 -->
    <el-card shadow="never">
      <SectionTitle title="技能自评">
        进度条百分比由 skill.level 决定，颜色按熟练度分档
      </SectionTitle>

      <div class="skills">
        <div v-for="skill in skills" :key="skill.name" class="skill-item">
          <div class="skill-head">
            <span>{{ skill.name }}</span>
            <el-tag size="small" :type="skillStatus(skill.level)">{{ skill.level }} 分</el-tag>
          </div>
          <el-progress
            :percentage="skill.level"
            :color="skillColor(skill.level)"
            :stroke-width="12"
            striped
            :striped-flow="skill.level >= 85"
          />
        </div>
      </div>

      <el-alert
        class="skill-tip"
        type="success"
        :closable="false"
        show-icon
        :title="`技能自评均分 ${avgSkillLevel} 分`"
        description="Pinia getters 会根据 skills 数组自动重新计算，新增技能后无需改动本页代码。"
      />
    </el-card>
  </div>
</template>

<style scoped>
.intro-card {
  margin-bottom: 18px;
}

.intro {
  display: flex;
  align-items: center;
  gap: 22px;
  flex-wrap: wrap;
}

.avatar {
  background: linear-gradient(135deg, #42b883, #6a5acd);
  color: #fff;
  font-size: 34px;
  font-weight: 700;
}

.intro-text {
  flex: 1;
  min-width: 240px;
}

.intro-text h1 {
  font-size: 24px;
  margin-bottom: 2px;
}

.sub {
  color: var(--c-primary-dark);
  font-size: 14px;
  margin-bottom: 8px;
}

.tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 14px;
}

.tl-card h4 {
  font-size: 15px;
  margin-bottom: 4px;
}

.skills {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skill-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  margin-bottom: 6px;
}

.skill-tip {
  margin-top: 18px;
}

:deep(.el-descriptions__label) {
  width: 110px;
}
</style>
