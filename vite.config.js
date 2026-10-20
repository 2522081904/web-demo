import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages 的项目站点地址形如 https://<username>.github.io/<repo-name>/，
  // 资源必须带上仓库名前缀才能被正确加载，否则会出现白屏 + 一堆 404。
  //
  // 这里用环境变量控制，避免把仓库名写死在代码里：
  //   本地开发 / 预览      -> base 为 '/'
  //   GitHub Actions 构建  -> 由工作流注入 VITE_BASE_PATH=/<repo-name>/
  //
  // 注意 Vite 的 base 必须以斜杠开头和结尾。
  base: process.env.VITE_BASE_PATH || '/',

  plugins: [vue(), vueDevTools()],
  base: '/web-demo/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  server: {
    // 开发服务器可访问局域网地址，便于在手机浏览器上验证 Hash / History 两种模式
    host: true,
    port: 5173,
  },

  build: {
    // Element Plus 全局注册后体积较大，这里做基础的手工分包：
    // 把组件库、Vue 运行时与业务代码拆开，利用浏览器缓存，
    // 业务代码更新时用户不需要重新下载整个组件库。
    //
    // 注意：Vite 8 底层使用 Rolldown，manualChunks 必须是函数形式，
    // 写成对象（Rollup 的旧写法）会报 "manualChunks is not a function"。
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('element-plus') || id.includes('@element-plus')) {
            return 'element-plus'
          }
          if (id.includes('/vue/') || id.includes('vue-router') || id.includes('pinia')) {
            return 'vue'
          }
          return 'vendor'
        },
      },
    },
    // 分包后单个 chunk 仍可能接近 500KB，这里放宽告警阈值避免噪音
    chunkSizeWarningLimit: 800,
  },
}))
