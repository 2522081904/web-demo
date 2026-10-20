<script setup>
// 项目详情：动态路由 detail/:id 的路由组件。
// 路由表配置了 props: true，因此路由参数 id 会自动作为 props 传入，
// 同时这里用 useRoute() 读取 params，展示两种获取参数的方式。
import { computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useProjectsStore } from '../../stores/projects'

// props 方式：等价于 props: { id: 'id' }
const props = defineProps({
  id: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()

const store = useProjectsStore()
const { list } = storeToRefs(store)

// route 方式：useRoute() 返回当前路由对象，params 中保存动态片段
const rawId = computed(() => route.params.id)

// 路由参数是字符串，需要 Number() 转换后再与项目 id（数字）比较
const project = computed(() => store.findById(rawId.value))

// prev / next：上一个、下一个项目，编号在列表中循环切换
const prev = computed(() => {
  const items = list.value
  if (!items.length || !project.value) return null
  const index = items.findIndex((p) => p.id === project.value.id)
  return items[(index - 1 + items.length) % items.length]
})

const next = computed(() => {
  const items = list.value
  if (!items.length || !project.value) return null
  const index = items.findIndex((p) => p.id === project.value.id)
  return items[(index + 1) % items.length]
})

// 状态对应的标签配色，避免模板里写嵌套三元
const stateType = computed(() => {
  const state = project.value?.state
  if (state === '已完成') return 'success'
  if (state === '进行中') return 'primary'
  return 'warning'
})

let timer = null

// 无效详情地址处理：先给出提示，再用 replace 把无效地址替换为项目列表，
// 这样浏览器后退时不会重新落回这个无效地址。
watch(
  project,
  (value) => {
    clearTimeout(timer)
    if (!value) {
      ElMessage.error('未找到该项目，正在返回项目列表')
      timer = setTimeout(() => router.replace({ name: 'projects' }), 1200)
    }
  },
  { immediate: true },
)

onUnmounted(() => clearTimeout(timer))

function backToList() {
  router.push({ name: 'projects' })
}

function goPrevious() {
  // go(-1)：按历史记录回退到上一个访问过的页面
  router.go(-1)
}
</script>

<template>
  <!-- 路由参数合法时渲染项目详情 -->
  <el-card v-if="project" shadow="never" class="detail">
    <header class="d-head">
      <div>
        <h2>{{ project.name }}</h2>
        <p class="muted">
          编号 #{{ project.id }} · {{ project.duration }} · {{ project.role }}
        </p>
      </div>

      <div class="d-right">
        <el-tag size="small" effect="dark" :type="stateType">{{ project.state }}</el-tag>
        <el-progress
          type="dashboard"
          :percentage="Number(project.score)"
          :width="78"
          :stroke-width="8"
        />
      </div>
    </header>

    <el-alert class="desc" type="info" :closable="false" :title="project.description" />

    <h4>技术栈</h4>
    <div class="tech">
      <el-tag v-for="t in project.tech" :key="t" effect="plain">{{ t }}</el-tag>
    </div>

    <h4>实现要点</h4>
    <!-- el-timeline 适合展示有先后关系的要点，这里复用为要点列表 -->
    <el-timeline class="points">
      <el-timeline-item
        v-for="(h, i) in project.highlights"
        :key="i"
        :timestamp="`要点 ${i + 1}`"
        placement="top"
        :type="i === 0 ? 'primary' : 'info'"
      >
        {{ h }}
      </el-timeline-item>
    </el-timeline>

    <el-descriptions :column="3" border class="meta-table">
      <el-descriptions-item label="年份">{{ project.year }}</el-descriptions-item>
      <el-descriptions-item label="我的角色">{{ project.role }}</el-descriptions-item>
      <el-descriptions-item label="仓库">
        <a v-if="project.link" :href="project.link" target="_blank" rel="noopener">
          {{ project.link }}
        </a>
        <span v-else class="muted">未填写</span>
      </el-descriptions-item>
    </el-descriptions>

    <el-divider />

    <footer class="d-foot">
      <!-- go(-1) 返回上一页 -->
      <el-button @click="goPrevious">go(-1) 返回上一页</el-button>
      <!-- push 返回列表，会新增一条历史记录 -->
      <el-button type="primary" @click="backToList">push 返回项目列表</el-button>

      <!-- 相邻项目跳转：同一个动态路由，参数不同即渲染不同详情 -->
      <el-button
        v-if="prev"
        @click="router.push({ name: 'project-detail', params: { id: prev.id } })"
      >
        ← {{ prev.name }}
      </el-button>
      <el-button
        v-if="next"
        @click="router.push({ name: 'project-detail', params: { id: next.id } })"
      >
        {{ next.name }} →
      </el-button>
    </footer>
  </el-card>

  <!-- 编号不存在时短暂展示提示，随后由 replace 跳回列表 -->
  <el-card v-else shadow="never" class="invalid">
    <el-empty :description="`编号 ${rawId} 在项目数据中不存在`">
      <el-button type="primary" @click="router.replace({ name: 'projects' })">
        立即 replace 返回列表
      </el-button>
      <el-button @click="router.go(-1)">go(-1) 返回上一页</el-button>
    </el-empty>
    <p class="muted center">
      页面将自动使用 <strong>router.replace</strong> 返回项目列表。
    </p>
  </el-card>
</template>

<style scoped>
.d-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.d-head h2 {
  font-size: 22px;
  margin-bottom: 4px;
}

.d-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.desc {
  margin: 16px 0;
}

h4 {
  font-size: 15px;
  margin: 16px 0 10px;
}

.tech {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.points :deep(.el-timeline-item__timestamp) {
  font-size: 12px;
  color: var(--c-text-soft);
}

.meta-table {
  margin-top: 18px;
}

.d-foot {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.invalid {
  text-align: center;
}

.center {
  margin-top: 8px;
}
</style>
