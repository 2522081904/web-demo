// 顶部导航数据：用命名路由的 name 组织，避免在模板里到处硬编码地址路径，
// 路径一旦调整只需改路由表，导航无需同步修改。
//
// icon 字段保存的是已全局注册的 Element Plus 图标组件名，
// 布局组件用 <component :is="item.icon" /> 动态渲染。

export const navItems = [
  { name: 'home', label: '首页', icon: 'HomeFilled' },
  { name: 'profile', label: '个人信息', icon: 'User' },
  { name: 'projects', label: '项目列表', icon: 'Folder' },
  { name: 'project-stats', label: '项目统计', icon: 'DataAnalysis' },
  { name: 'articles', label: '文章列表', icon: 'Document' },
  { name: 'about', label: '关于我', icon: 'InfoFilled' },
]

// 后台管理区域的二级导航，对应 AdminLayout 下的嵌套子路由
export const adminNavItems = [
  { name: 'admin', label: '管理概览', icon: 'Odometer' },
  { name: 'admin-profile', label: '修改简介', icon: 'EditPen' },
  { name: 'admin-projects', label: '项目管理', icon: 'Files' },
  { name: 'admin-articles', label: '文章管理', icon: 'Notebook' },
]
