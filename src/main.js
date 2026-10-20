import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import 'element-plus/dist/index.css'
// 自定义样式放在组件库样式之后，保证变量覆盖与自定义类能生效
import './style.css'

import App from './App.vue'
import router from './router'

// main.js：创建应用 → 注册 Pinia → 注册路由 → 注册 Element Plus → 挂载
//
// 顺序很重要：Pinia 必须在 router 之前安装。
// 因为路由的全局前置守卫里会调用 useAuthStore()，
// 而首次导航在 app.mount() 时就会触发，那时 Pinia 必须已经是激活状态。
const app = createApp(App)

app.use(createPinia())
app.use(router)

// Element Plus 全局注册（实验要求：实验阶段使用全局注册即可）
// 好处是所有组件与指令随取随用，代价是打包体积较大；
// 生产项目可以改用 unplugin-vue-components 做按需引入，见 README 的说明。
app.use(ElementPlus, { locale: zhCn })

// 图标也要全局注册，模板里才能直接写 <el-icon><HomeFilled /></el-icon>。
// @element-plus/icons-vue 导出的是一组组件，这里批量注册并统一加 El 前缀以外的原名。
for (const [name, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(name, component)
}

app.mount('#app')
