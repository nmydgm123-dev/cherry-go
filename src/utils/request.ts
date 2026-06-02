/**
 * API 请求封装
 */

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
}

interface ResponseData {
  code: number
  message?: string
  data?: any
}

export const request = async (options: RequestOptions): Promise<ResponseData> => {
  const { url, method = 'GET', data = {}, header = {} } = options
  
  try {
    const token = uni.getStorageSync('token')
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    }
    
    const result = await uniCloud.callFunction({
      name: url,
      data: data
    })
    
    return result.result as ResponseData
  } catch (error) {
    console.error('Request error:', error)
    return {
      code: -1,
      message: '网络请求失败'
    }
  }
}

export const get = (url: string, data?: any) => {
  return request({ url, method: 'GET', data })
}

export const post = (url: string, data?: any) => {
  return request({ url, method: 'POST', data })
}

export const put = (url: string, data?: any) => {
  return request({ url, method: 'PUT', data })
}

export const del = (url: string, data?: any) => {
  return request({ url, method: 'DELETE', data })
}
