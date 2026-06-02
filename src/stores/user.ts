import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo } from '@/types/user'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<UserInfo | null>(null)
  const token = ref<string>('')
  const isLoggedIn = computed(() => !!token.value)
  
  const role = computed(() => userInfo.value?.role || 'browser')
  const isOwner = computed(() => role.value === 'owner')
  const isWriter = computed(() => role.value === 'writer')
  const isShipper = computed(() => role.value === 'shipper')
  const isBrowser = computed(() => role.value === 'browser')

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function setToken(newToken: string) {
    token.value = newToken
    uni.setStorageSync('token', newToken)
  }

  function checkLogin() {
    const savedToken = uni.getStorageSync('token')
    const savedUserInfo = uni.getStorageSync('userInfo')
    
    if (savedToken && savedUserInfo) {
      token.value = savedToken
      userInfo.value = savedUserInfo
    }
  }

  async function login() {
    try {
      const { code } = await uni.login({ provider: 'weixin' })
      
      // 调用云函数进行登录
      const result = await uniCloud.callFunction({
        name: 'login',
        data: { code }
      })
      
      if (result.result.code === 0) {
        setToken(result.result.token)
        setUserInfo(result.result.userInfo)
        return true
      } else {
        uni.showToast({
          title: result.result.message || '登录失败',
          icon: 'none'
        })
        return false
      }
    } catch (error) {
      console.error('登录失败:', error)
      uni.showToast({
        title: '登录失败，请重试',
        icon: 'none'
      })
      return false
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
  }

  function hasPermission(permission: string): boolean {
    const permissions: Record<string, string[]> = {
      owner: ['product.config', 'order.create', 'order.view', 'order.ship', 'logistics.view', 'coupon.manage', 'stats.view'],
      writer: ['order.create', 'order.view.self'],
      shipper: ['order.view', 'order.ship', 'logistics.view'],
      browser: ['product.view', 'logistics.view.simple']
    }
    
    return permissions[role.value]?.includes(permission) || false
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    role,
    isOwner,
    isWriter,
    isShipper,
    isBrowser,
    setUserInfo,
    setToken,
    checkLogin,
    login,
    logout,
    hasPermission
  }
})
