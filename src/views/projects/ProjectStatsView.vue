<script setup>
// 项目统计：父路由 /projects 下的子路由。
// 所有统计结果都来自 Pinia getters，本页只负责展示——不重复计算任何指标。
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useProjectsStore, STATE_OPTIONS } from '../../stores/projects'

const store = useProjectsStore()
const {
  list,
  total,
  finishedCount,
  runningCount,
  plannedCount,
  avgScore,
  techRanking,
  stateDistribution,
  topProjects,
} = storeToRefs(store)

onMounted(() => {
  store.fetchProjects()
})

// 状态占比表格：el-progress 的百分比以总数为基础
const stateRows = computed(() =>
  stateDistribution.value.map((item) => ({
    ...item,
    percent: total.value ? Math.round((item.value / total.value) * 100) : 0,
  })),
)

// 技术栈使用次数：以最大值为 100% 基准绘制条形
const maxTech = computed(() => Math.max(1, ...techRanking.value.map((t) => t.count)))

// 按年份的分组概览
const yearRows = computed(() => store.byYear)

// 状态 → 组件配色
function stateColor(state) {
  if (state === '已完成') return '#2e7d32'
  if (state === '进行中') return '#2980b9'
  return '#e67e22'
}
</script>

<template>
  <div class="stats">
    <!-- 顶部数字：全部来自 getters -->
    <div class="grid-4">
      <el-card shadow="never" class="num-card">
        <el-statistic title="项目总数" :value="total" />
      </el-card>
      <el-card shadow="never" class="num-card">
        <el-statistic title="已完成" :value="finishedCount" />
      </el-card>
      <el-card shadow="never" class="num-card">
        <el-statistic title="进行中" :value="runningCount" />
      </el-card>
      <el-card shadow="never" class="num-card">
        <el-statistic title="计划中" :value="plannedCount" />
      </el-card>
      <el-card shadow="never" class="num-card">
        <el-statistic title="平均评分" :value="avgScore" suffix="分" />
      </el-card>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <h4>项目状态分布</h4>
          <p class="muted">
            getters 过滤出各状态数量，再换算成百分比交给 el-progress 渲染
          </p>

          <div v-for="row in stateRows" :key="row.name" class="bar-row">
            <span class="label">{{ row.name }}</span>
            <el-progress
              :percentage="row.percent"
              :color="stateColor(row.name)"
              :stroke-width="12"
              :format="() => `${row.value} 个`"
            />
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="12">
        <el-card shadow="never">
          <h4>技术栈使用排行</h4>
          <p class="muted">
            遍历每个项目的 tech 数组累计次数，再用 computed 排序
          </p>

          <div v-for="tech in techRanking" :key="tech.name" class="bar-row">
            <span class="label">{{ tech.name }}</span>
            <el-progress
              :percentage="Math.round((tech.count / maxTech) * 100)"
              color="#6a5acd"
              :stroke-width="12"
              :format="() => `${tech.count} 次`"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="block">
      <h4>高分项目排行</h4>
      <p class="muted">getters 中已按评分降序排序，本页直接切片展示</p>

      <el-table :data="topProjects.slice(0, 5)" border stripe>
        <el-table-column type="index" label="排名" width="80" />
        <el-table-column prop="name" label="项目名称" min-width="180" />
        <el-table-column prop="state" label="状态" width="110">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="row.state === '已完成' ? 'success' : row.state === '进行中' ? 'primary' : 'warning'"
            >
              {{ row.state }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="year" label="年份" width="90" />
        <el-table-column prop="score" label="评分" width="180" sortable>
          <template #default="{ row }">
            <el-progress :percentage="Number(row.score)" :stroke-width="10" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-card shadow="never" class="block">
      <h4>按年份归组</h4>
      <p class="muted">getters 把列表按 year 字段聚合后返回分组结果</p>

      <el-collapse>
        <el-collapse-item
          v-for="group in yearRows"
          :key="group.year"
          :title="`${group.year} 年（${group.items.length} 个项目）`"
          :name="String(group.year)"
        >
          <el-tag
            v-for="item in group.items"
            :key="item.id"
            class="year-tag"
            effect="plain"
          >
            {{ item.name }} · {{ item.score }} 分
          </el-tag>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 状态字段的取值来源，方便对照 -->
    <el-alert
      class="block"
      type="info"
      :closable="false"
      show-icon
      title="状态取值说明"
      :description="`项目状态只能是：${STATE_OPTIONS.join(' / ')}，该常量定义在 stores/projects.js 中，列表筛选与表单下拉共用同一份。`"
    />
  </div>
</template>

<style scoped>
.num-card {
  text-align: center;
}

h4 {
  font-size: 15px;
  margin-bottom: 4px;
}

.bar-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  align-items: center;
  gap: 12px;
  margin-top: 14px;
}

.label {
  font-size: 13px;
  text-align: right;
  color: var(--c-text-soft);
}

.block {
  margin-top: 16px;
}

.year-tag {
  margin: 0 6px 6px 0;
}

:deep(.el-statistic__content) {
  font-size: 22px;
}

:deep(.el-statistic__head) {
  font-size: 12px;
  color: var(--c-text-soft);
}
</style>
