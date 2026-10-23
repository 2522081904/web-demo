<script setup>
// 文章列表：/articles 的默认子路由，渲染在 ArticlesLayout 的 RouterView 中。
//
// 本页使用 el-table 以表格形式展示文章，配合分页、标签筛选与关键词搜索。
// 「只看我的」开关演示了 getters 与筛选条件的组合：数据依然只有一份，
// 不同的展示结果都由计算得出。
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useArticlesStore, ARTICLE_CATEGORIES } from '../../stores/articles'

const router = useRouter()
const store = useArticlesStore()
const { publishedList, allTags } = storeToRefs(store)

onMounted(() => {
  store.fetchArticles()
})

// 筛选条件：只影响本页展示，不修改 Store 中的数据
const keyword = ref('')
const category = ref('')
const tag = ref('')
const page = ref(1)
const pageSize = ref(5)

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return publishedList.value.filter((item) => {
    const matchCategory = !category.value || item.category === category.value
    const matchTag = !tag.value || (item.tags || []).includes(tag.value)
    const matchKeyword =
      !kw ||
      item.title.toLowerCase().includes(kw) ||
      item.summary.toLowerCase().includes(kw) ||
      (item.tags || []).some((t) => t.toLowerCase().includes(kw))
    return matchCategory && matchTag && matchKeyword
  })
})

// 分页后的可见数据：el-pagination 的 total 用 filtered.length
const pagedList = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

// 筛选条件变化后回到第一页，避免停留在越界的页码上
function resetPage() {
  page.value = 1
}

function clearFilters() {
  keyword.value = ''
  category.value = ''
  tag.value = ''
  resetPage()
}

function openDetail(row) {
  router.push({ name: 'article-detail', params: { id: row.id } })
}
</script>

<template>
  <el-card shadow="never">
    <!-- 筛选栏：el-input / el-select / el-button 组合 -->
    <div class="filter-bar">
      <el-input
        v-model="keyword"
        placeholder="搜索标题、摘要或标签"
        clearable
        class="search"
        @input="resetPage"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select
        v-model="category"
        placeholder="全部分类"
        clearable
        class="picker"
        @change="resetPage"
      >
        <el-option v-for="c in ARTICLE_CATEGORIES" :key="c" :label="c" :value="c" />
      </el-select>

      <el-select
        v-model="tag"
        placeholder="全部标签"
        clearable
        class="picker"
        @change="resetPage"
      >
        <el-option v-for="t in allTags" :key="t" :label="t" :value="t" />
      </el-select>

      <el-button @click="clearFilters">
        <el-icon><RefreshLeft /></el-icon>&nbsp;重置
      </el-button>

      <span class="muted">共 {{ filtered.length }} 篇</span>
    </div>

    <!-- el-table：表格展示，点击行或按钮进入详情 -->
    <el-table
      :data="pagedList"
      stripe
      border
      highlight-current-row
      class="table"
      @row-click="openDetail"
    >
      <el-table-column type="index" label="#" width="55" />

      <el-table-column prop="title" label="标题" min-width="240">
        <template #default="{ row }">
          <span class="title">{{ row.title }}</span>
          <div class="tags">
            <el-tag v-for="t in row.tags" :key="t" size="small" effect="plain">{{ t }}</el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="category" label="分类" width="110">
        <template #default="{ row }">
          <el-tag size="small">{{ row.category }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="date" label="发布日期" width="120" sortable />

      <el-table-column prop="views" label="阅读量" width="100" sortable>
        <template #default="{ row }">
          <el-icon><View /></el-icon> {{ row.views }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link @click.stop="openDetail(row)">阅读全文</el-button>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="没有符合条件的文章" :image-size="90" />
      </template>
    </el-table>

    <!-- el-pagination：每页条数可调，总数来自筛选结果 -->
    <el-pagination
      v-model:current-page="page"
      v-model:page-size="pageSize"
      class="pager"
      background
      layout="total, sizes, prev, pager, next, jumper"
      :page-sizes="[5, 10, 20]"
      :total="filtered.length"
    />
  </el-card>
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
  width: 260px;
}

.picker {
  width: 150px;
}

.table {
  width: 100%;
}

.table :deep(.el-table__row) {
  cursor: pointer;
}

.title {
  font-weight: 600;
}

.tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.pager {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>
