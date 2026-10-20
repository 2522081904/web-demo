import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages仓库web‑demo，固定 base，前后斜杠必须保留
  base: '/web-demo/',
  plugins: [vue(), vueDevTools()],
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
