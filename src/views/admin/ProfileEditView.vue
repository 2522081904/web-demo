<script setup>
// 修改个人简介：草稿与已保存数据分离，支持保存、取消修改与还原默认。
//
// 表单改用 el-form + rules 做校验：规则写在数据里，
// 错误提示由组件渲染，不再需要像实验三那样自己维护 errors 对象。
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProfileStore } from '../../stores/profile'
import { useUiStore } from '../../stores/ui'

const router = useRouter()

const store = useProfileStore()
const { info, skills, avgSkillLevel } = storeToRefs(store)

const ui = useUiStore()

const formRef = ref(null)

// 草稿：只修改副本，点「保存」后才通过 action 写入 Store 并持久化
const draft = reactive({ ...info.value })

// Store 中的资料被其它入口改动时（例如点了「恢复默认」），同步刷新草稿
watch(
  info,
  (value) => Object.assign(draft, value),
  { deep: true },
)

const rules = {
  name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
  studentId: [
    { required: true, message: '学号不能为空', trigger: 'blur' },
    { pattern: /^\d{6,12}$/, message: '学号应为 6 ~ 12 位数字', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  github: [{ type: 'url', message: '请输入合法的 URL', trigger: 'blur' }],
  motto: [{ max: 40, message: '座右铭不要超过 40 个字', trigger: 'blur' }],
}

async function handleSave() {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch {
    ElMessage.error('表单校验未通过，请检查标红字段')
    return
  }

  // 调用 action：Store 内部完成 state 修改 + localStorage 写入
  store.saveProfile({ ...draft })
  ui.pushNotice({ text: '个人简介已保存并持久化', type: 'success', source: '修改简介页' })
  ElMessage.success('简介已保存，刷新页面后仍然生效')
}

/** 取消修改：放弃草稿，恢复为当前已保存的内容 */
function handleCancel() {
  Object.assign(draft, info.value)
  formRef.value?.clearValidate()
  ui.pushNotice({ text: '已取消本次修改，草稿已丢弃', type: 'info', source: '修改简介页' })
  ElMessage.info('已取消本次修改')
}

/** 恢复默认：调用 action 重置 Store 与本地存储 */
async function handleReset() {
  try {
    await ElMessageBox.confirm(
      '将把姓名、学号、班级等字段恢复为初始值，并清除本地保存的资料。',
      '确认恢复默认？',
      { confirmButtonText: '恢复默认', cancelButtonText: '取消', type: 'warning' },
    )
  } catch {
    return
  }

  store.resetProfile()
  formRef.value?.clearValidate()
  ui.pushNotice({ text: '个人资料已恢复默认', type: 'warning', source: '修改简介页' })
  ElMessage.info('已恢复默认简介')
}
</script>

<template>
  <el-card shadow="never" class="profile-edit">
    <el-alert
      class="tip"
      type="info"
      :closable="false"
      show-icon
      title="草稿与已保存数据分离"
      description="修改只在本地草稿上进行，点「保存修改」后才通过 profile Store 的 saveProfile action 写入状态与 localStorage。取消修改不会影响已保存内容。"
    />

    <el-form
      ref="formRef"
      :model="draft"
      :rules="rules"
      label-width="100px"
      class="form"
    >
      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-form-item label="姓名" prop="name">
            <el-input v-model="draft.name" placeholder="真实姓名" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="学号" prop="studentId">
            <el-input v-model="draft.studentId" placeholder="6 ~ 12 位数字" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <el-form-item label="班级 / 专业" prop="major">
            <el-input v-model="draft.major" placeholder="例如：计算机科学与技术 24 级 2 班" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :md="12">
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="draft.email" placeholder="name@example.com" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="GitHub" prop="github">
        <el-input v-model="draft.github" placeholder="https://github.com/用户名" />
      </el-form-item>

      <el-form-item label="个人介绍" prop="intro">
        <el-input
          v-model="draft.intro"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="一句话介绍自己的方向与兴趣"
        />
      </el-form-item>

      <el-form-item label="座右铭" prop="motto">
        <el-input v-model="draft.motto" placeholder="例如：把每一个按钮都做对。" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSave">
          <el-icon><Check /></el-icon>&nbsp;保存修改
        </el-button>
        <el-button @click="handleCancel">取消修改</el-button>
        <el-button type="danger" plain @click="handleReset">恢复默认</el-button>
        <el-button text type="primary" @click="router.push({ name: 'profile' })">
          到个人信息页查看 →
        </el-button>
      </el-form-item>
    </el-form>

    <el-divider />

    <!-- 技能自评只读预览：值来自 getters，说明保存后各页面同步 -->
    <h4>技能自评（只读预览）</h4>
    <p class="muted">
      skills 数组保存在 profile Store 中，个人信息页与这里是同一份数据，均分
      {{ avgSkillLevel }} 分。
    </p>

    <el-table :data="skills" size="small" border>
      <el-table-column prop="name" label="技能" min-width="180" />
      <el-table-column prop="level" label="熟练度" width="220">
        <template #default="{ row }">
          <el-progress :percentage="row.level" :stroke-width="10" />
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<style scoped>
.tip {
  margin-bottom: 18px;
}

.form {
  max-width: 760px;
}

h4 {
  font-size: 15px;
  margin-bottom: 6px;
}

.tip + .form {
  margin-top: 4px;
}
</style>
