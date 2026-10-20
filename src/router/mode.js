// 单独抽出路由模式相关逻辑，避免组件与路由表之间形成循环依赖
const MODE_KEY = 'exp3:router-mode'

// 读取当前路由模式：默认 history，可在页面顶部切换为 hash
export function getRouterMode() {
  return localStorage.getItem(MODE_KEY) === 'hash' ? 'hash' : 'history'
}

// Vite 注入的部署基准路径。本地开发是 '/'，部署到 GitHub Pages 项目站点后是 '/仓库名/'。
// 切换模式时跳转的地址必须带上这个前缀，否则会跳到域名根目录而不是项目目录。
const BASE = import.meta.env.BASE_URL || '/'

/**
 * 切换模式：vue-router 的 history 实例在创建后不能替换，
 * 因此先把选择写入 localStorage，再让页面按新地址重新加载并重建路由实例。
 */
export function setRouterMode(mode) {
  localStorage.setItem(MODE_KEY, mode)
  // 拼出首页地址：Hash 模式为 /仓库名/#/home，History 模式为 /仓库名/home
  const home = `${BASE}${mode === 'hash' ? '#/home' : 'home'}`.replace(/\/{2,}/g, '/')
  window.location.href = home
  window.location.reload()
}
