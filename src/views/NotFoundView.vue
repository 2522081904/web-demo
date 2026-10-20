<script setup>
// 404 页面：使用 useRoute() 取出用户访问的原始地址，并演示三种程序化导航。
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()

function goBack() {
  // go(-1)：沿历史记录返回上一页；没有历史时退回首页
  if (window.history.length > 1) router.go(-1)
  else router.replace({ name: 'home' })
  ElMessage.info('已尝试返回上一页')
}
</script>

<template>
  <el-card shadow="never" class="nf">
    <!-- el-result 是 404 这类「结果页」的专用组件 -->
    <el-result icon="warning" title="404" :sub-title="`没有找到地址 ${route.fullPath} 对应的页面`">
      <template #extra>
        <p class="muted">
          该地址会被路由表末尾的通配符规则 <code>/:pathMatch(.*)*</code> 捕获。
        </p>

        <div class="actions">
          <!-- push 会新增一条历史记录，返回后仍能再次进入 404 -->
          <el-button type="primary" @click="router.push({ name: 'home' })">push 回首页</el-button>
          <!-- replace 替换当前记录，适合从无效地址"离开"到有效页面 -->
          <el-button @click="router.replace({ name: 'home' })">replace 回首页</el-button>
          <el-button text @click="goBack">go(-1) 返回上一页</el-button>
        </div>
      </template>
    </el-result>
  </el-card>
</template>

<style scoped>
.nf {
  max-width: 680px;
  margin: 30px auto;
}

.actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

code {
  font-family: Consolas, monospace;
  background: rgba(66, 184, 131, 0.16);
  padding: 1px 6px;
  border-radius: 4px;
}
</style>
