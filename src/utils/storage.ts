/**
 * 本地存储工具
 */

const PREFIX = 'cherrygo_'

export const storage = {
  set(key: string, value: any): void {
    try {
      uni.setStorageSync(PREFIX + key, JSON.stringify(value))
    } catch (e) {
      console.error('Storage set error:', e)
    }
  },
  
  get<T = any>(key: string, defaultValue?: T): T | null {
    try {
      const value = uni.getStorageSync(PREFIX + key)
      if (value) {
        return JSON.parse(value) as T
      }
      return defaultValue ?? null
    } catch (e) {
      console.error('Storage get error:', e)
      return defaultValue ?? null
    }
  },
  
  remove(key: string): void {
    try {
      uni.removeStorageSync(PREFIX + key)
    } catch (e) {
      console.error('Storage remove error:', e)
    }
  },
  
  clear(): void {
    try {
      uni.clearStorageSync()
    } catch (e) {
      console.error('Storage clear error:', e)
    }
  },
  
  has(key: string): boolean {
    return uni.getStorageInfoSync().keys.includes(PREFIX + key)
  }
}

export default storage
