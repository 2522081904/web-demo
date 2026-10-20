<script setup>
// 文章中心布局：与 ProjectsLayout 结构一致，演示同一套「父布局 + 子路由出口」模式
// 可以直接复用到不同业务模块上。这里额外用 el-alert 提示草稿的可见性规则。
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useArticlesStore } from '../stores/articles'

const route = useRoute()
const store = useArticlesStore()
const { total, publishedCount, draftCount, totalViews } = storeToRefs(store)

const breadcrumb = computed(() =>
  route.matched.filter((item) => item.meta?.title).map((item) => item.meta.title),
)
</script>

<template>
  <section class="articles-layout">
    <el-card shadow="never" class="head-card">
      <div class="al-head">
        <div>
          <h1>
            <el-icon><Document /></el-icon> 文章中心
          </h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ name: 'home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-for="item in breadcrumb" :key="item">{{ item }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="head-stats">
          <el-statistic title="文章总数" :value="total" />
          <el-statistic title="积累阅读" :value="totalViews" />
        </div>
      </div>

      <el-alert
        class="tip"
        type="info"
        :closable="false"
        show-icon
        title="前台只展示已发布的文章"
        :description="`当前共 ${total} 篇，其中已发布 ${publishedCount} 篇、草稿 ${draftCount} 篇。草稿可在「后台管理 → 文章管理」中查看与发布。`"
      />
    </el-card>

    <RouterView v-slot="{ Component, route: child }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" :key="child.fullPath" />
      </Transition>
    </RouterView>
  </section>
</template>

<style scoped>
.head-card {
  margin-bottom: 18px;
}

.al-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.al-head h1 {
  font-size: 22px;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.head-stats {
  display: flex;
  gap: 28px;
}

.tip {
  margin-top: 14px;
}
</style>
