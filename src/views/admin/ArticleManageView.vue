<script setup>
// 文章管理：文章的增删改查，以及发布 / 下架状态切换。
//
// 与前台的差异集中体现在 published 字段上：
//   前台文章列表只读取 publishedList（getter 过滤后的结果），
//   后台读取完整的 list，因此草稿只在这里可见。
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useArticlesStore, ARTICLE_CATEGORIES } from '../../stores/articles'
import { useUiStore } from '../../stores/ui'

const router = useRouter()

const store = useArticlesStore()
const { list, total, publishedCount, draftCount, allTags } = storeToRefs(store)

const ui = useUiStore()

const formRef = ref(null)

const dialogVisible = ref(false)
const editingId = ref(null)
const saving = ref(false)

// 筛选
const keyword = ref('')
const onlyDraft = ref(false)

const emptyForm = {
  title: '',
  summary: '',
  content: '',
  category: ARTICLE_CATEGORIES[0],
  tags: '',
  date: new Date().toISOString().slice(0, 10),
  published: true,
  views: 0,
}

const form = reactive({ ...emptyForm })

// 标签输入：el-select 的 multiple + allow-create 让用户直接敲新标签
const selectedTags = ref([])

const selectedRows = ref([])

const dialogTitle = computed(() => (editingId.value ? '编辑文章' : '新增文章'))

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return list.value.filter((item) => {
    const matchDraft = !onlyDraft.value || !item.published
    const matchKw = !kw || item.title.toLowerCase().includes(kw)
    return matchDraft && matchKw
  })
})

const rules = {
  title: [{ required: true, message: '请填写文章标题', trigger: 'blur' }],
  summary: [
    { required: true, message: '请填写文章摘要', trigger: 'blur' },
    { max: 120, message: '摘要不要超过 120 个字', trigger: 'blur' },
  ],
  content: [{ required: true, message: '请填写正文内容', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  date: [{ required: true, message: '请选择发布日期', trigger: 'change' }],
}

function openCreate() {
  editingId.value = null
  Object.assign(form, { ...emptyForm, date: new Date().toISOString().slice(0, 10) })
  selectedTags.value = []
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    title: row.title || '',
    summary: row.summary || '',
    content: row.content || '',
    category: row.category || ARTICLE_CATEGORIES[0],
    tags: '',
    date: row.date || new Date().toISOString().slice(0, 10),
    published: Boolean(row.published),
    views: Number(row.views || 0),
  })
  selectedTags.value = [...(row.tags || [])]
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    ElMessage.error('表单校验未通过，请检查标红字段')
    return
  }

  saving.value = true
  try {
    const payload = {
      title: form.title,
      summary: form.summary,
      content: form.content,
      category: form.category,
      date: form.date,
      published: form.published,
      views: Number(form.views || 0),
      tags: selectedTags.value,
    }

    if (editingId.value) {
      store.updateArticle(editingId.value, payload)
      ui.pushNotice({
        text: `文章「${payload.title}」已更新`,
        type: 'success',
        source: '文章管理页',
      })
      ElMessage.success('文章已更新')
    } else {
      const id = store.addArticle(payload)
      ui.pushNotice({
        text: `文章「${payload.title}」已新增，编号 #${id}`,
        type: 'success',
        source: '文章管理页',
      })
      ElMessage.success(`文章已新增，编号 #${id}`)
    }

    dialogVisible.value = false
  } finally {
    saving.value = false
  }
}

async function handleRemove(row) {
  try {
    await ElMessageBox.confirm(`确定删除文章「${row.title}」吗？`, '确认删除？', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  store.removeArticle(row.id)
  ui.pushNotice({ text: `已删除文章「${row.title}」`, type: 'warning', source: '文章管理页' })
  ElMessage.success('文章已删除')
}

async function handleBatchRemove() {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先勾选要删除的文章')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 篇文章吗？`,
      '批量删除确认',
      { confirmButtonText: '全部删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  const count = store.removeArticles(selectedRows.value.map((row) => row.id))
  selectedRows.value = []
  ui.pushNotice({ text: `批量删除了 ${count} 篇文章`, type: 'warning', source: '文章管理页' })
  ElMessage.success(`已删除 ${count} 篇文章`)
}

/** 一键切换发布状态：action 内部改 state 并持久化 */
function handleTogglePublish(row) {
  store.togglePublished(row.id)
  const text = row.published
    ? `文章「${row.title}」已重新发布到前台`
    : `文章「${row.title}」已下架为草稿`
  ui.pushNotice({ text, type: 'info', source: '文章管理页' })
  ElMessage.info(text)
}

async function handleReset() {
  try {
    await ElMessageBox.confirm('将清除本地保存的文章数据，恢复为初始记录。', '确认恢复？', {
      confirmButtonText: '恢复',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  store.resetArticles()
  selectedRows.value = []
  ui.pushNotice({ text: '文章数据已恢复初始值', type: 'info', source: '文章管理页' })
  ElMessage.info('已恢复初始文章数据')
}
</script>

<template>
  <el-card shadow="never">
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>&nbsp;新增文章
      </el-button>

      <el-button type="danger" plain :disabled="!selectedRows.length" @click="handleBatchRemove">
        <el-icon><Delete /></el-icon>&nbsp;批量删除
        <template v-if="selectedRows.length">（{{ selectedRows.length }}）</template>
      </el-button>

      <el-button @click="handleReset">
        <el-icon><RefreshLeft /></el-icon>&nbsp;恢复初始数据
      </el-button>

      <el-input v-model="keyword" placeholder="按标题搜索" clearable class="search">
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-switch
        v-model="onlyDraft"
        active-text="只看草稿"
        inline-prompt
      />

      <div class="spacer" />

      <el-tag type="success">已发布 {{ publishedCount }}</el-tag>
      <el-tag type="warning">草稿 {{ draftCount }}</el-tag>
      <el-tag type="info">合计 {{ total }}</el-tag>
    </div>

    <el-table
      :data="filteredList"
      border
      stripe
      row-key="id"
      class="table"
      @selection-change="(rows) => (selectedRows = rows)"
    >
      <el-table-column type="selection" width="46" />
      <el-table-column prop="id" label="编号" width="70" sortable />

      <el-table-column prop="title" label="标题" min-width="240">
        <template #default="{ row }">
          <strong>{{ row.title }}</strong>
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

      <el-table-column prop="date" label="日期" width="115" sortable />
      <el-table-column prop="views" label="阅读" width="80" sortable />

      <el-table-column label="状态" width="150">
        <template #default="{ row }">
          <el-switch
            :model-value="row.published"
            active-text="已发布"
            inactive-text="草稿"
            inline-prompt
            @change="handleTogglePublish(row)"
          />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button
            size="small"
            type="primary"
            link
            @click="router.push({ name: 'article-detail', params: { id: row.id } })"
          >
            预览
          </el-button>
          <el-button size="small" type="danger" link @click="handleRemove(row)">删除</el-button>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="没有符合条件的文章" :image-size="90" />
      </template>
    </el-table>

    <el-alert
      class="tip"
      type="info"
      :closable="false"
      show-icon
      title="草稿只在这里可见"
      description="把文章切换为「草稿」后，前台文章列表与首页最新文章都会立即过滤掉它，但本页仍然可以看到并重新发布。这体现了同一份 Store 数据在不同页面通过不同 getters 呈现的差异。"
    />
  </el-card>

  <!-- 新增 / 编辑弹窗 -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="720px" top="5vh">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="文章标题" />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-form-item label="分类" prop="category">
            <el-select v-model="form.category">
              <el-option v-for="c in ARTICLE_CATEGORIES" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="发布日期" prop="date">
            <el-date-picker
              v-model="form.date"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="标签">
        <el-select
          v-model="selectedTags"
          multiple
          filterable
          allow-create
          default-first-option
          placeholder="可从已有标签中选择，也可直接输入新标签后回车"
        >
          <el-option v-for="t in allTags" :key="t" :label="t" :value="t" />
        </el-select>
      </el-form-item>

      <el-form-item label="摘要" prop="summary">
        <el-input
          v-model="form.summary"
          type="textarea"
          :rows="2"
          maxlength="120"
          show-word-limit
          placeholder="一两句话概括文章内容，会显示在列表与详情页顶部"
        />
      </el-form-item>

      <el-form-item label="正文" prop="content">
        <el-input
          v-model="form.content"
          type="textarea"
          :rows="8"
          placeholder="直接粘贴正文，段落之间用空行分隔"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-form-item label="发布状态">
            <el-switch
              v-model="form.published"
              active-text="立即发布"
              inactive-text="存为草稿"
              inline-prompt
            />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="阅读量">
            <el-input-number v-model="form.views" :min="0" :step="1" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">
        {{ editingId ? '保存修改' : '确认新增' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.spacer {
  flex: 1;
}

.search {
  width: 190px;
}

.table {
  width: 100%;
}

.tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.tip {
  margin-top: 16px;
}

:deep(.el-dialog__body) {
  max-height: 70vh;
  overflow-y: auto;
}
</style>
