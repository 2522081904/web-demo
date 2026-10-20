<script setup>
// 复用组件：标题走 props，补充说明走默认插槽，避免重复编写标题样式
defineProps({
  title: { type: String, required: true },
})
</script>

<template>
  <div class="section-title">
    <h2>{{ title }}</h2>
    <div class="desc"><slot /></div>
  </div>
</template>

<style scoped>
.section-title h2 {
  font-size: 18px;
  margin-bottom: 4px;
}

.desc {
  color: var(--c-text-soft);
  font-size: 14px;
  margin-bottom: 14px;
}
</style>