// Axios 实例：统一后端接口基地址、超时与响应拦截。
// 后端返回统一结构 { code, message, data }，这里自动解包 data，失败时抛出可读错误。
import axios from 'axios'

// 本地 Express 服务默认监听 3000 端口；部署时可通过环境变量覆盖
export const BASE_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api'

const http = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) return body.data
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return body
  },
  (error) => {
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      '网络异常，请确认后端服务已启动'
    return Promise.reject(new Error(message))
  },
)

export default http
