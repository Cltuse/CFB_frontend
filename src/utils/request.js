import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'
import { clearAuth, getToken } from './auth'
import { apiBaseUrl } from '../config/env'
import { normalizeUserMessage } from './messageText'

const MEDIA_URL_KEYS = new Set(['imageUrl', 'avatar', 'userAvatar'])

const normalizeMediaUrl = value => {
  if (typeof value !== 'string') {
    return value
  }

  const normalizedValue = value.trim().replace(/\\/g, '/')
  const filesIndex = normalizedValue.indexOf('/files/')
  if (filesIndex >= 0) {
    return normalizedValue.slice(filesIndex)
  }

  if (normalizedValue.startsWith('files/')) {
    return `/${normalizedValue}`
  }

  return normalizedValue
}

const normalizeResponseMediaUrls = payload => {
  if (Array.isArray(payload)) {
    payload.forEach(item => normalizeResponseMediaUrls(item))
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return payload
  }

  Object.keys(payload).forEach(key => {
    const value = payload[key]

    if (MEDIA_URL_KEYS.has(key) && typeof value === 'string') {
      payload[key] = normalizeMediaUrl(value)
      return
    }

    normalizeResponseMediaUrls(value)
  })

  return payload
}

const request = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    const res = response.data
    normalizeResponseMediaUrls(res?.data)

    if (res.code === 200) {
      return res
    }

    const normalizedMessage = normalizeUserMessage(res.message, '请求失败，请稍后重试。')
    ElMessage.error(normalizedMessage)
    return Promise.reject(new Error(normalizedMessage))
  },
  error => {
    const status = error.response?.status

    if (status === 401) {
      clearAuth()
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
      ElMessage.error(normalizeUserMessage('登录已失效，请重新登录'))
    } else if (status === 403) {
      ElMessage.error(normalizeUserMessage(error.response?.data?.message || '无权限访问该资源'))
    } else {
      ElMessage.error(normalizeUserMessage(error.response?.data?.message || error.message, '网络连接异常，请稍后重试。'))
    }

    return Promise.reject(error)
  }
)

export default request
