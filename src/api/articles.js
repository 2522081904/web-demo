// 文章接口：对应后端 /api/articles 的增删改查与发布状态切换
import http from './http'

export const listArticles = (params) => http.get('/articles', { params })
export const getArticle = (id) => http.get(`/articles/${id}`)
export const createArticle = (data) => http.post('/articles', data)
export const updateArticle = (id, data) => http.put(`/articles/${id}`, data)
export const deleteArticle = (id) => http.delete(`/articles/${id}`)
export const togglePublish = (id) => http.patch(`/articles/${id}/publish`)
