import {
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'
import ProfileView from '../views/ProfileView.vue'
import LoginView from '../views/LoginView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import ProjectsLayout from '../layouts/ProjectsLayout.vue'
import ProjectListView from '../views/projects/ProjectListView.vue'
import ProjectDetailView from '../views/projects/ProjectDetailView.vue'
import ProjectStatsView from '../views/projects/ProjectStatsView.vue'
import ArticlesLayout from '../layouts/ArticlesLayout.vue'
import ArticleListView from '../views/articles/ArticleListView.vue'
import ArticleDetailView from '../views/articles/ArticleDetailView.vue'
import AdminLayout from '../layouts/AdminLayout.vue'
import AdminDashboardView from '../views/admin/AdminDashboardView.vue'
import ProfileEditView from '../views/admin/ProfileEditView.vue'
import ProjectManageView from '../views/admin/ProjectManageView.vue'
import ArticleManageView from '../views/admin/ArticleManageView.vue'
import { useAuthStore } from '../stores/auth'
import { getRouterMode } from './mode'

const SITE_NAME = '熊焘的个人主页'

// 路由表：基础路由 + 重定向 + 嵌套路由 + 动态路由 + 通配符 404
//
// 实验四在实验三的路由骨架上新增了「文章中心」这一组嵌套路由
// （列表 / 详情 / 后台管理），其余结构保持不变。
const routes = [
  // 根路径使用 redirect 重定向到首页命名路由，属于"默认页面跳转"
  { path: '/', redirect: { name: 'home' } },

  // 旧地址迁移：历史遗留的 /index.html 依旧可以访问，重定向到 /home
  { path: '/index.html', redirect: { name: 'home' } },

  {
    path: '/home',
    name: 'home',
    component: HomeView,
    meta: { title: '首页', icon: 'HomeFilled' },
  },

  {
    // 实验四要求：个人信息页面新增时间线，因此独立成页
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { title: '个人信息', icon: 'User' },
  },

  {
    path: '/about',
    name: 'about',
    component: AboutView,
    meta: { title: '关于我', icon: 'InfoFilled' },
  },

  // 嵌套路由：项目中心共享同一套标题与子导航，具体内容由子路由决定
  {
    path: '/projects',
    component: ProjectsLayout,
    meta: { title: '项目中心' },
    children: [
      {
        path: '',
        name: 'projects',
        component: ProjectListView,
        meta: { title: '项目列表', icon: 'Folder' },
      },
      {
        path: 'stats',
        name: 'project-stats',
        component: ProjectStatsView,
        meta: { title: '项目统计', icon: 'DataAnalysis' },
      },
      {
        // 动态路由：一条规则匹配 /projects/detail/1 ~ /projects/detail/N
        // props: true 把路由参数作为 props 传给路由组件
        path: 'detail/:id',
        name: 'project-detail',
        component: ProjectDetailView,
        props: true,
        meta: { title: '项目详情' },
      },
    ],
  },

  // 嵌套路由：文章中心，结构与项目中心一致，用于演示同一套模式可以复用
  {
    path: '/articles',
    component: ArticlesLayout,
    meta: { title: '文章中心' },
    children: [
      {
        path: '',
        name: 'articles',
        component: ArticleListView,
        meta: { title: '文章列表', icon: 'Document' },
      },
      {
        path: 'detail/:id',
        name: 'article-detail',
        component: ArticleDetailView,
        props: true,
        meta: { title: '文章详情' },
      },
    ],
  },

  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '身份认证' },
  },

  // 嵌套路由：后台管理共用侧边布局，meta.requiresAuth 由路由守卫统一校验
  {
    path: '/admin',
    component: AdminLayout,
    meta: { title: '后台管理', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'admin',
        component: AdminDashboardView,
        meta: { title: '管理概览', icon: 'Odometer' },
      },
      {
        path: 'profile',
        name: 'admin-profile',
        component: ProfileEditView,
        meta: { title: '修改简介', icon: 'EditPen' },
      },
      {
        path: 'projects',
        name: 'admin-projects',
        component: ProjectManageView,
        meta: { title: '项目管理', icon: 'Files' },
      },
      {
        path: 'articles',
        name: 'admin-articles',
        component: ArticleManageView,
        meta: { title: '文章管理', icon: 'Notebook' },
      },
    ],
  },

  // 404 通配符必须放在最后一条，否则会拦截所有正常路由
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  // createWebHistory 生成 /home 形式地址；createWebHashHistory 生成 /#/home 形式地址
  //
  // base 使用 Vite 注入的 BASE_URL：部署到 GitHub Pages 的项目站点时，
  // 地址会带上 /仓库名/ 前缀，这里同步设置才能保证路由匹配正确。
  history:
    getRouterMode() === 'hash'
      ? createWebHashHistory(import.meta.env.BASE_URL)
      : createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 有历史位置就回到原位置（go(-1) 时不会跳到页首），否则新页面回到顶部
    return savedPosition || { top: 0 }
  },
})

// 全局前置守卫：每次跳转前更新浏览器标题，并完成登录校验
router.beforeEach((to) => {
  // meta.title 逐级向上合并：子路由未配置时自动使用父路由的标题
  document.title = to.meta.title ? `${to.meta.title} · ${SITE_NAME}` : SITE_NAME

  // 关键点（实验原理 3.1）：useAuthStore 必须写在守卫函数内部，
  // 不能提到模块顶层。模块顶层执行时 createApp() 还没运行，
  // app.use(pinia) 尚未安装，会抛出 "no active Pinia"。
  const auth = useAuthStore()

  // 访问控制：需要登录的路由，未登录时携带原始地址跳转到登录页
  if (to.meta.requiresAuth && !auth.isLogged) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  // 已登录用户再访问登录页时直接送回后台，避免重复登录
  if (to.name === 'login' && auth.isLogged) {
    return { name: 'admin' }
  }

  return true
})

export default router
