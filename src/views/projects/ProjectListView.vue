<script setup>
// 项目列表：父路由 /projects 的子路由之一，渲染在 ProjectsLayout 的 RouterView 中。
//
// 筛选条件（状态、关键词）是「只有本页关心」的局部状态，因此用 ref 保存在组件内，
// 而项目数据本身放在 Store 中共享——这是实验要求里「合理划分状态」的具体体现。
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useProjectsStore, STATE_OPTIONS } from '../../stores/projects'
import ProjectCard from '../../components/ProjectCard.vue'

const router = useRouter()
const store = useProjectsStore()
const { list } = storeToRefs(store)

onMounted(() => {
  store.fetchProjects()
})

const filter = ref('全部')
const keyword = ref('')
const sortBy = ref('default')

// 可选状态在 Store 中统一定义，避免这里再硬编码一份
const stateOptions = ['全部', ...STATE_OPTIONS]

const visibleProjects = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const result = list.value.filter((p) => {
    const matchState = filter.value === '全部' || p.state === filter.value
    const matchKw =
      !kw ||
      p.name.toLowerCase().includes(kw) ||
      (p.tech || []).some((t) => t.toLowerCase().includes(kw))
    return matchState && matchKw
  })

  if (sortBy.value === 'score') return [...result].sort((a, b) => b.score - a.score)
  if (sortBy.value === 'year') return [...result].sort((a, b) => b.year - a.year)
  return result
})

// el-table 的状态列颜色：与徽章配色保持一致
function stateTagType(state) {
  if (state === '已完成') return 'success'
  if (state === '进行中') return 'primary'
  return 'warning'
}
</script>

<template>
  <div>
    <!-- 筛选栏：el-radio-group 做状态切换，比手写 chip 按钮更紧凑 -->
    <div class="filter-bar">
      <el-radio-group v-model="filter" size="default">
        <el-radio-button v-for="s in stateOptions" :key="s" :value="s">{{ s }}</el-radio-button>
      </el-radio-group>

      <el-input
        v-model="keyword"
        placeholder="按项目名或技术栈搜索"
        clearable
        class="search"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select v-model="sortBy" class="sort" title="排序方式">
        <el-option label="默认顺序" value="default" />
        <el-option label="按评分降序" value="score" />
        <el-option label="按年份降序" value="year" />
      </el-select>

      <el-tag type="info">共 {{ visibleProjects.length }} 个项目</el-tag>
    </div>

    <el-empty v-if="!visibleProjects.length" description="没有符合条件的项目，换个筛选条件试试" />

    <div v-else class="list">
      <ProjectCard v-for="project in visibleProjects" :key="project.id" :project="project">
        <!-- 具名插槽：状态徽章 -->
        <template #badge="{ project }">
          <el-tag :type="stateTagType(project.state)" size="small" effect="dark">
            {{ project.state }}
          </el-tag>
        </template>

        <!-- 具名插槽：操作区 -->
        <template #actions="{ project }">
          <span class="muted">评分 {{ project.score }} / 100</span>
          <!-- 动态路由跳转：按命名路由 + params 传入项目编号 -->
          <el-button
            type="primary"
            size="small"
            @click="router.push({ name: 'project-detail', params: { id: project.id } })"
          >
            查看详情
          </el-button>
          <el-button
            v-if="project.link"
            size="small"
            tag="a"
            :href="project.link"
            target="_blank"
            rel="noopener"
          >
            仓库 ↗
          </el-button>
        </template>
      </ProjectCard>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.search {
  width: 220px;
}

.sort {
  width: 150px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
