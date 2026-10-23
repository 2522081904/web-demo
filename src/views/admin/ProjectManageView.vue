<script setup>
// 项目管理：项目的增删改查。
//
// 所有写操作都通过 projects Store 的 actions 完成，本页不直接修改 state：
//   addProject / updateProject / removeProject / removeProjects / resetProjects
// 新增与编辑共用同一个 el-dialog + el-form，通过 editing 状态区分模式。
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectsStore, STATE_OPTIONS } from '../../stores/projects'
import { useUiStore } from '../../stores/ui'

const router = useRouter()

const store = useProjectsStore()
const { list, total, lastSavedAt } = storeToRefs(store)

onMounted(() => {
  store.fetchProjects()
})

const ui = useUiStore()

const formRef = ref(null)

// 弹窗与表单状态
const dialogVisible = ref(false)
const editingId = ref(null)
const saving = ref(false)

const emptyForm = {
  name: '',
  description: '',
  tech: '',
  state: '计划中',
  role: '个人项目',
  score: 80,
  year: new Date().getFullYear(),
  link: '',
  duration: '',
  highlights: '',
}

const form = reactive({ ...emptyForm })

// 表格多选
const selectedRows = ref([])

const dialogTitle = computed(() => (editingId.value ? '编辑项目' : '新增项目'))

const rules = {
  name: [{ required: true, message: '请填写项目名称', trigger: 'blur' }],
  description: [{ required: true, message: '请填写项目简介', trigger: 'blur' }],
  tech: [{ required: true, message: '请至少填写一项技术栈', trigger: 'blur' }],
  score: [
    { required: true, message: '请填写评分', trigger: 'blur' },
    { type: 'number', min: 0, max: 100, message: '评分需为 0 ~ 100 的数字', trigger: 'blur' },
  ],
}

/** 打开新增弹窗：清空表单 */
function openCreate() {
  editingId.value = null
  Object.assign(form, { ...emptyForm, year: new Date().getFullYear() })
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

/** 打开编辑弹窗：把行数据回填到表单 */
function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name || '',
    description: row.description || '',
    tech: (row.tech || []).join('、'),
    state: row.state || '计划中',
    role: row.role || '个人项目',
    score: Number(row.score ?? 80),
    year: Number(row.year ?? new Date().getFullYear()),
    link: row.link || '',
    duration: row.duration || '',
    highlights: (row.highlights || []).join('\n'),
  })
  formRef.value?.clearValidate()
  dialogVisible.value = true
}

/** 提交表单：根据 editingId 决定新增还是更新 */
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
    // 把文本域的多行内容拆成要点数组
    const payload = {
      ...form,
      score: Number(form.score),
      year: Number(form.year),
      highlights: String(form.highlights || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    }

    if (editingId.value) {
      await store.updateProject(editingId.value, payload)
      ui.pushNotice({
        text: `项目「${payload.name}」已更新`,
        type: 'success',
        source: '项目管理页',
      })
      ElMessage.success(`项目「${payload.name}」已更新`)
    } else {
      const id = await store.addProject(payload)
      ui.pushNotice({
        text: `项目「${payload.name}」已新增，编号 #${id}`,
        type: 'success',
        source: '项目管理页',
      })
      ElMessage.success(`项目「${payload.name}」已新增，编号 #${id}`)
    }

    dialogVisible.value = false
  } finally {
    saving.value = false
  }
}

/** 删除单条：二次确认后调用 action */
async function handleRemove(row) {
  try {
    await ElMessageBox.confirm(
      `确定删除项目「${row.name}」吗？删除后它的详情地址将变为无效地址。`,
      '确认删除？',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  await store.removeProject(row.id)
  ui.pushNotice({
    text: `已删除项目「${row.name}」`,
    type: 'warning',
    source: '项目管理页',
  })
  ElMessage.success(`已删除「${row.name}」`)
}

/** 批量删除：演示 action 接收多个参数 */
async function handleBatchRemove() {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先在表格中勾选要删除的项目')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedRows.value.length} 个项目吗？`,
      '批量删除确认',
      { confirmButtonText: '全部删除', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  const count = await store.removeProjects(selectedRows.value.map((row) => row.id))
  selectedRows.value = []
  ui.pushNotice({ text: `批量删除了 ${count} 个项目`, type: 'warning', source: '项目管理页' })
  ElMessage.success(`已删除 ${count} 个项目`)
}

/** 恢复初始数据 */
async function handleReset() {
  try {
    await ElMessageBox.confirm(
      '将从服务器重新加载项目数据（不会删除数据库记录）。',
      '确认刷新数据？',
      { confirmButtonText: '恢复', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  await store.resetProjects()
  selectedRows.value = []
  ui.pushNotice({ text: '项目数据已从服务器刷新', type: 'info', source: '项目管理页' })
  ElMessage.info('项目数据已刷新')
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function stateTagType(state) {
  if (state === '已完成') return 'success'
  if (state === '进行中') return 'primary'
  return 'warning'
}
</script>

<template>
  <el-card shadow="never">
    <!-- 工具栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="openCreate">
        <el-icon><Plus /></el-icon>&nbsp;新增项目
      </el-button>

      <el-button
        type="danger"
        plain
        :disabled="!selectedRows.length"
        @click="handleBatchRemove"
      >
        <el-icon><Delete /></el-icon>&nbsp;批量删除
        <template v-if="selectedRows.length">（{{ selectedRows.length }}）</template>
      </el-button>

      <el-button @click="handleReset">
        <el-icon><RefreshLeft /></el-icon>&nbsp;刷新数据
      </el-button>

      <div class="spacer" />

      <el-tag type="info">共 {{ total }} 条记录</el-tag>
      <span v-if="lastSavedAt" class="muted">上次保存：{{ lastSavedAt }}</span>
    </div>

    <!-- 数据表格：支持多选、排序与行内操作 -->
    <el-table
      :data="list"
      border
      stripe
      row-key="id"
      class="table"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="46" />

      <el-table-column prop="id" label="编号" width="70" sortable />

      <el-table-column prop="name" label="项目名称" min-width="170">
        <template #default="{ row }">
          <strong>{{ row.name }}</strong>
          <div class="tech-line">
            <el-tag v-for="t in row.tech" :key="t" size="small" effect="plain">{{ t }}</el-tag>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="state" label="状态" width="100" sortable>
        <template #default="{ row }">
          <el-tag size="small" :type="stateTagType(row.state)">{{ row.state }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="score" label="评分" width="90" sortable />
      <el-table-column prop="year" label="年份" width="80" sortable />
      <el-table-column prop="role" label="角色" width="110" />

      <el-table-column label="操作" width="210" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button
            size="small"
            type="primary"
            link
            @click="router.push({ name: 'project-detail', params: { id: row.id } })"
          >
            详情
          </el-button>
          <el-button size="small" type="danger" link @click="handleRemove(row)">删除</el-button>
        </template>
      </el-table-column>

      <template #empty>
        <el-empty description="暂无项目数据，点击「新增项目」添加" :image-size="90" />
      </template>
    </el-table>

    <p class="muted tip">
      提示：删除某条项目后，可以直接访问它的详情地址（形如 /projects/detail/编号）
      观察无效地址的兜底处理。
    </p>
  </el-card>

  <!-- 新增 / 编辑弹窗：两种模式共用同一个 el-dialog + el-form -->
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="640px" top="6vh">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-row :gutter="16">
        <el-col :xs="24" :md="14">
          <el-form-item label="项目名称" prop="name">
            <el-input v-model="form.name" placeholder="例如：校园二手交易平台" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="10">
          <el-form-item label="状态" prop="state">
            <el-select v-model="form.state">
              <el-option v-for="s in STATE_OPTIONS" :key="s" :label="s" :value="s" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="项目简介" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="一句话说明项目解决了什么问题"
        />
      </el-form-item>

      <el-form-item label="技术栈" prop="tech">
        <el-input v-model="form.tech" placeholder="多个技术用顿号、逗号或空格分隔" />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-form-item label="我的角色" prop="role">
            <el-input v-model="form.role" placeholder="例如：前端负责人" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="时间跨度" prop="duration">
            <el-input v-model="form.duration" placeholder="例如：2025.03 - 2025.06" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-form-item label="评分" prop="score">
            <el-input-number v-model="form.score" :min="0" :max="100" :step="1" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="年份" prop="year">
            <el-input-number v-model="form.year" :min="2020" :max="2100" :step="1" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="仓库链接" prop="link">
        <el-input v-model="form.link" placeholder="https://github.com/... （可留空）" />
      </el-form-item>

      <el-form-item label="实现要点" prop="highlights">
        <el-input
          v-model="form.highlights"
          type="textarea"
          :rows="3"
          placeholder="每行一条，例如：&#10;使用 Pinia 管理登录态与购物车&#10;列表页做 300ms 防抖搜索"
        />
      </el-form-item>
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

.table {
  width: 100%;
}

.tech-line {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.tip {
  margin-top: 14px;
  font-size: 12px;
}

:deep(.el-dialog__body) {
  max-height: 68vh;
  overflow-y: auto;
}
</style>
