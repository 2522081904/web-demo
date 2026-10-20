<script setup>
// 身份认证页：登录成功后使用 replace 回到目标地址，
// 使登录页不留在历史记录中，避免用户后退时再次看到登录表单。
//
// 表单改用 Element Plus 的 el-form + rules 做校验，
// 登录动作调用 auth Store 的 login action（异步，按钮带 loading）。
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore, DEMO_ACCOUNT } from '../stores/auth'

const route = useRoute()
const router = useRouter()

const auth = useAuthStore()

const formRef = ref(null)
const form = reactive({ name: '', password: '' })

// el-form 的校验规则：与实验三手写 validate() 相比，
// 规则与表单项绑定，错误提示、触发时机都由组件管理
const rules = {
  name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 4, message: '密码至少 4 位', trigger: 'blur' },
  ],
}

// 从 query 中取出被守卫拦截时的原始目标地址
const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : ''

async function handleLogin() {
  if (!formRef.value) return

  // validate 返回 Promise，校验不通过时 reject，用 try/catch 提前退出
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  // action 是异步的，按钮上绑定 auth.pending 显示 loading
  const result = await auth.login({ name: form.name, password: form.password })

  if (!result.ok) {
    ElMessage.error(result.message)
    return
  }

  ElMessage.success(result.message)
  // replace：替换掉登录页这条历史记录，浏览器后退不会退回登录页
  router.replace(redirect || { name: 'admin' })
}

/** 一键填入演示账号，方便批改时快速进入后台 */
function fillDemo() {
  form.name = DEMO_ACCOUNT.username
  form.password = DEMO_ACCOUNT.password
}
</script>

<template>
  <el-card shadow="never" class="login">
    <h1>
      <el-icon><Lock /></el-icon> 身份认证
    </h1>
    <p class="muted">
      后台管理页面通过路由守卫限制访问，未登录时会被自动引导到本页。
    </p>

    <el-alert
      v-if="redirect"
      class="notice"
      type="warning"
      :closable="false"
      show-icon
      :title="`目标页面 ${redirect} 需要登录后才能访问`"
    />

    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="form"
      @submit.prevent="handleLogin"
    >
      <el-form-item label="用户名" prop="name">
        <el-input v-model="form.name" placeholder="例如：熊焘" clearable>
          <template #prefix>
            <el-icon><User /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="密码（至少 4 位）" prop="password">
        <el-input
          v-model="form.password"
          type="password"
          placeholder="演示环境任意输入，不少于 4 位"
          show-password
          @keyup.enter="handleLogin"
        >
          <template #prefix>
            <el-icon><Key /></el-icon>
          </template>
        </el-input>
      </el-form-item>

      <div class="actions">
        <el-button
          type="primary"
          :loading="auth.pending"
          @click="handleLogin"
        >
          登录并进入后台
        </el-button>
        <el-button @click="fillDemo">填入演示账号</el-button>
        <el-button text @click="router.push({ name: 'home' })">暂不登录</el-button>
      </div>
    </el-form>

    <el-divider />

    <el-descriptions :column="1" size="small" border>
      <el-descriptions-item label="演示账号">{{ DEMO_ACCOUNT.username }}</el-descriptions-item>
      <el-descriptions-item label="演示密码">{{ DEMO_ACCOUNT.password }}</el-descriptions-item>
    </el-descriptions>

    <p class="muted tip">
      登录态由 Pinia 的 auth Store 管理，并同步写入 localStorage：
      刷新页面后仍保持登录，可在 Vue DevTools 的 Pinia 面板中观察 user 状态。
    </p>
  </el-card>
</template>

<style scoped>
.login {
  max-width: 520px;
  margin: 0 auto;
}

h1 {
  font-size: 22px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notice {
  margin: 14px 0 4px;
}

.form {
  margin-top: 16px;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tip {
  margin-top: 14px;
  font-size: 12px;
}
</style>
