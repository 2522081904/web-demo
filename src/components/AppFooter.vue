<script setup>
// 底部信息组件：作者与年份由外壳组件传入
defineProps({
  author: { type: String, required: true },
  year: { type: Number, default: () => new Date().getFullYear() },
})
</script>

<template>
  <footer class="footer">
    <el-divider class="divider" />
    <p>© {{ year }} {{ author }} · Vue 3 + Vue Router + Pinia + Element Plus 状态管理与UI组件库应用实验</p>
    <p class="sub">数据保存在浏览器 localStorage，仅供教学演示</p>
  </footer>
</template>

<style scoped>
.footer {
  text-align: center;
  color: var(--c-text-soft);
  font-size: 13px;
  padding-bottom: 18px;
}

.divider {
  margin: 8px 0 14px;
}

.sub {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.8;
}
</style>
