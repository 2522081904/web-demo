<script setup>
// 文章详情：动态路由 /articles/detail/:id 的路由组件。
//
// 路由表配置了 props: true，因此路由参数 id 会自动作为 props 传入；
// 这里同时用 useRoute() 读取 params，展示两种获取参数的方式（与实验三一致）。
//
// action 调用时机的典型示例：进入本页时调用 store.increaseViews(id)，
// 阅读量 +1 并落盘，回到列表页可以看到数字变化。
import { computed, onMounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useArticlesStore } from '../../stores/articles'

// props 方式：等价于 props: { id: 'id' }
const props = defineProps({
  id: { type: String, required: true },
})

const route = useRoute()
const router = useRouter()

const store = useArticlesStore()
const { publishedList } = storeToRefs(store)

// route 方式：useRoute() 返回当前路由对象，params 中保存动态片段
const rawId = computed(() => route.params.id)

// 路由参数在地址栏里是字符串，findById 内部统一做了 Number() 转换
const article = computed(() => store.findById(rawId.value))

// 上一篇 / 下一篇：按发布时间排序后在列表中循环切换，只在已发布文章之间导航
const siblings = computed(() =>
  [...publishedList.value].sort((a, b) => String(b.date).localeCompare(String(a.date))),
)

const prev = computed(() => {
  const list = siblings.value
  if (!list.length || !article.value) return null
  const index = list.findIndex((item) => item.id === article.value.id)
  if (index === -1) return null
  return list[(index - 1 + list.length) % list.length]
})

const next = computed(() => {
  const list = siblings.value
  if (!list.length || !article.value) return null
  const index = list.findIndex((item) => item.id === article.value.id)
  if (index === -1) return null
  return list[(index + 1) % list.length]
})

// 正文按空行拆成段落渲染，避免直接 v-html 引入 XSS 风险
const paragraphs = computed(() =>
  article.value ? article.value.content.split('\n').filter((line) => line.trim()) : [],
)

// 相关文章：同分类且不是当前这篇，最多 3 篇
const related = computed(() => {
  if (!article.value) return []
  return publishedList.value
    .filter((item) => item.category === article.value.category && item.id !== article.value.id)
    .slice(0, 3)
})

// 进入页面时阅读量 +1。用 immediate 保证首次渲染也执行；
// 因为路由组件按 fullPath 做了 key，切换文章会重新创建组件，所以这里不会重复累加。
watch(
  () => article.value?.id,
  (id) => {
    if (!id) return
    store.increaseViews(id)
  },
  { immediate: true },
)

// 无效地址处理：给出提示后回到文章列表
onMounted(async () => {
  await store.fetchArticles()
  if (!article.value) {
    ElMessage.warning('未找到该文章，正在返回文章列表')
    router.replace({ name: 'articles' })
  }
})

function backToList() {
  router.push({ name: 'articles' })
}
</script>

<template>
  <el-card v-if="article" shadow="never" class="detail">
    <!-- 面包屑：手动构造，第二级指向文章列表 -->
    <el-breadcrumb separator="/" class="crumbs">
      <el-breadcrumb-item :to="{ name: 'home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item :to="{ name: 'articles' }">文章列表</el-breadcrumb-item>
      <el-breadcrumb-item>{{ article.title }}</el-breadcrumb-item>
    </el-breadcrumb>

    <h1 class="title">{{ article.title }}</h1>

    <!-- 文章元信息：用 el-descriptions 或标签行展示 -->
    <div class="meta">
      <span><el-icon><Calendar /></el-icon> {{ article.date }}</span>
      <span><el-icon><View /></el-icon> {{ article.views }} 次阅读</span>
      <el-tag size="small">{{ article.category }}</el-tag>
      <el-tag v-for="t in article.tags" :key="t" size="small" type="info" effect="plain">
        {{ t }}
      </el-tag>
    </div>

    <el-alert
      class="summary"
      type="info"
      :closable="false"
      show-icon
      title="摘要"
      :description="article.summary"
    />

    <!-- 正文 -->
    <article class="content">
      <p v-for="(p, index) in paragraphs" :key="index">{{ p }}</p>
    </article>

    <el-divider />

    <!-- 相关文章 -->
    <template v-if="related.length">
      <h4>相关文章</h4>
      <ul class="related">
        <li v-for="item in related" :key="item.id">
          <RouterLink :to="{ name: 'article-detail', params: { id: item.id } }">
            {{ item.title }}
          </RouterLink>
          <span class="muted">{{ item.date }}</span>
        </li>
      </ul>
    </template>

    <!-- 底部导航：上一篇 / 下一篇 / 返回列表 -->
    <div class="foot">
      <el-button @click="backToList">
        <el-icon><Back /></el-icon>&nbsp;返回文章列表
      </el-button>

      <el-button
        v-if="prev"
        @click="router.push({ name: 'article-detail', params: { id: prev.id } })"
      >
        ← 上一篇
      </el-button>

      <el-button
        v-if="next"
        type="primary"
        @click="router.push({ name: 'article-detail', params: { id: next.id } })"
      >
        下一篇 →
      </el-button>
    </div>
  </el-card>

  <!-- 编号不存在时短暂展示提示，随后由 replace 跳回列表 -->
  <el-card v-else shadow="never" class="invalid">
    <el-empty description="未找到该文章">
      <el-button type="primary" @click="router.replace({ name: 'articles' })">
        立即返回文章列表
      </el-button>
    </el-empty>
    <p class="muted">
      地址中的文章编号 <code>{{ rawId }}</code> 在文章数据中不存在。
    </p>
  </el-card>
</template>

<style scoped>
.crumbs {
  margin-bottom: 14px;
}

.title {
  font-size: 24px;
  line-height: 1.4;
  margin-bottom: 10px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 13px;
  color: var(--c-text-soft);
  margin-bottom: 16px;
}

.meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.summary {
  margin-bottom: 20px;
}

.content p {
  font-size: 15px;
  line-height: 1.9;
  margin-bottom: 14px;
  text-indent: 2em;
}

h4 {
  font-size: 15px;
  margin-bottom: 10px;
}

.related {
  list-style: none;
  margin-bottom: 8px;
}

.related li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px dashed var(--c-border);
  font-size: 14px;
}

.foot {
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px dashed var(--c-border);
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.invalid {
  text-align: center;
}

code {
  font-family: Consolas, monospace;
  background: rgba(229, 83, 75, 0.14);
  padding: 1px 6px;
  border-radius: 4px;
}
</style>
