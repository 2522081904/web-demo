<script setup>
// 项目卡片：可复用于项目列表页与后台项目管理页。
// props 传入项目数据，操作区通过具名作用域插槽由父组件定制，
// 这样「前台只放查看详情、后台放编辑删除」的差异不需要在组件内部判断。
defineProps({
  project: { type: Object, required: true },
})
</script>

<template>
  <el-card shadow="hover" class="project-card">
    <header class="pc-head">
      <h3>{{ project.name }}</h3>
      <!-- 具名插槽：默认渲染状态徽章，父组件可覆盖 -->
      <slot name="badge" :project="project">
        <el-tag
          size="small"
          effect="dark"
          :type="project.state === '已完成' ? 'success' : project.state === '进行中' ? 'primary' : 'warning'"
        >
          {{ project.state }}
        </el-tag>
      </slot>
    </header>

    <p class="pc-desc">{{ project.description }}</p>

    <div v-if="project.tech?.length" class="pc-tech">
      <el-tag v-for="tech in project.tech" :key="tech" size="small" effect="plain">
        {{ tech }}
      </el-tag>
    </div>

    <footer class="pc-foot">
      <span class="muted">{{ project.duration }} · {{ project.role }}</span>
      <!-- 具名插槽：操作区 -->
      <span class="pc-actions">
        <slot name="actions" :project="project" />
      </span>
    </footer>
  </el-card>
</template>

<style scoped>
.project-card {
  border-left: 4px solid var(--c-primary);
  transition: transform 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
}

.pc-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.pc-head h3 {
  font-size: 16px;
}

.pc-desc {
  margin: 8px 0;
  font-size: 14px;
  color: var(--c-text-soft);
}

.pc-tech {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pc-foot {
  margin-top: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.pc-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
