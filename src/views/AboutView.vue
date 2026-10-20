<script setup>
// 关于页：展示个人简介摘要、联系方式、能力雷达与站点技术栈。
//
// 与「个人信息」页的分工：
//   个人信息页（/profile）—— 完整资料 + 学习时间线 + 技能自评
//   关于页（/about）      —— 站点说明、联系方式与所用技术
// 两页读取的是同一个 profile Store，因此数据永远一致。
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useProfileStore } from '../stores/profile'
import { useProjectsStore } from '../stores/projects'
import { useArticlesStore } from '../stores/articles'
import SectionTitle from '../components/SectionTitle.vue'

const profileStore = useProfileStore()
const { info } = storeToRefs(profileStore)

const projectsStore = useProjectsStore()
const { total: projectTotal, techRanking } = storeToRefs(projectsStore)

const articlesStore = useArticlesStore()
const { total: articleTotal, totalViews } = storeToRefs(articlesStore)

// 站点使用的技术栈：作为 el-tag 列表展示，用于说明各实验阶段的成果
const stack = [
  { name: 'Vue 3', desc: '组合式 API、组件通信' },
  { name: 'Vue Router', desc: '命名路由、嵌套路由、动态路由、守卫' },
  { name: 'Pinia', desc: 'state / getters / actions、storeToRefs' },
  { name: 'Element Plus', desc: '布局、表格、表单、时间线等组件' },
  { name: 'Vite', desc: '开发服务器与生产构建' },
  { name: 'GitHub Actions', desc: '自动构建并发布到 GitHub Pages' },
]

const contact = computed(() => [
  { label: '姓名', value: info.value.name, icon: 'User' },
  { label: '学号', value: info.value.studentId, icon: 'Postcard' },
  { label: '班级', value: info.value.major, icon: 'School' },
  { label: '邮箱', value: info.value.email, icon: 'Message' },
  { label: 'GitHub', value: info.value.github, icon: 'Link' },
])
</script>

<template>
  <div class="about">
    <el-card shadow="never">
      <SectionTitle title="关于我">
        本页与「个人信息」页共用同一个 profile Store，修改资料后两页同步更新。
      </SectionTitle>

      <el-descriptions :column="1" border>
        <el-descriptions-item v-for="item in contact" :key="item.label" :label="item.label">
          <el-icon><component :is="item.icon" /></el-icon>&nbsp;
          <a v-if="item.label === 'GitHub'" :href="item.value" target="_blank" rel="noopener">
            {{ item.value }}
          </a>
          <template v-else>{{ item.value }}</template>
        </el-descriptions-item>
      </el-descriptions>

      <el-alert
        class="motto"
        type="warning"
        :closable="false"
        show-icon
        :title="`座右铭：${info.motto}`"
      />
    </el-card>

    <el-card shadow="never">
      <SectionTitle title="这个站点包含什么">
        数字全部来自 Pinia Store 的 getters，未在本页维护任何副本。
      </SectionTitle>

      <div class="stat-row">
        <el-statistic title="项目条目" :value="projectTotal" />
        <el-statistic title="文章条目" :value="articleTotal" />
        <el-statistic title="累计阅读" :value="totalViews" />
        <el-statistic title="技术标签种类" :value="techRanking.length" />
      </div>

      <el-divider />

      <h4>技术栈</h4>
      <el-table :data="stack" size="small" border>
        <el-table-column prop="name" label="技术" width="150">
          <template #default="{ row }">
            <el-tag size="small">{{ row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="desc" label="在本项目中的作用" />
      </el-table>
    </el-card>

    <el-card shadow="never">
      <SectionTitle title="实验阶段回顾">
        从静态页面到状态管理，再到组件库与自动部署。
      </SectionTitle>

      <el-steps :active="4" align-center finish-status="success">
        <el-step title="实验一" description="HTML / CSS 静态页面" />
        <el-step title="实验二" description="Vue 3 组件化开发" />
        <el-step title="实验三" description="Vue Router 路由与导航" />
        <el-step title="实验四" description="Pinia + Element Plus + 部署" />
      </el-steps>
    </el-card>
  </div>
</template>

<style scoped>
.about > * {
  margin-bottom: 18px;
}

.motto {
  margin-top: 16px;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 14px;
}

h4 {
  font-size: 15px;
  margin-bottom: 10px;
}
</style>
