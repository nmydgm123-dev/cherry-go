App({
  globalData: {
    userInfo: null,
    openid: '',
    activeFarmId: '',
    farmList: [],
    isLoggedIn: false,
    isLoggingIn: false,
    loginPromise: null
  },

  onLaunch() {
    console.log('CherryGo 小程序启动')
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d0gkd3ovxb901b246',
        traceUser: true
      })
    }
    this.autoLogin()
  },

  async autoLogin() {
    const cached = wx.getStorageSync('loginInfo')
    if (cached && cached.openid) {
      this.globalData.openid = cached.openid
      this.globalData.userInfo = cached.userInfo || null
      this.globalData.activeFarmId = cached.activeFarmId || ''
      this.globalData.farmList = cached.farmList || []
      this.globalData.isLoggedIn = true
      console.log('[autoLogin] 使用本地缓存登录成功')
    }
  },

  async login() {
    if (this.globalData.isLoggingIn) {
      return this.globalData.loginPromise
    }
    this.globalData.isLoggingIn = true
    this.globalData.loginPromise = this._doLogin()
    try {
      await this.globalData.loginPromise
    } finally {
      this.globalData.isLoggingIn = false
      this.globalData.loginPromise = null
    }
  },

  async _doLogin() {
    try {
      wx.showLoading({ title: '登录中...', mask: true })
      const { code } = await wx.login()
      if (!code) throw new Error('wx.login 失败')

      const res = await wx.cloud.callFunction({ 
        name: 'login', 
        data: { code },
        timeout: 30000
      })
      wx.hideLoading()

      if (res.result && res.result.code === 0) {
        const { openid, userInfo } = res.result
        const farmList = userInfo.farmList || []
        let activeFarmId = userInfo.active_farm_id || ''

        if (activeFarmId && !farmList.find(f => f._id === activeFarmId)) {
          activeFarmId = ''
        }
        if (!activeFarmId && farmList.length > 0) {
          activeFarmId = farmList[0]._id
        }

        this.globalData.openid = openid
        this.globalData.userInfo = userInfo
        this.globalData.farmList = farmList
        this.globalData.activeFarmId = activeFarmId
        this.globalData.isLoggedIn = true

        wx.setStorageSync('loginInfo', {
          openid,
          userInfo,
          activeFarmId,
          farmList
        })

        console.log('[login] 登录成功')
        return { openid, userInfo, farmList, activeFarmId }
      } else {
        throw new Error(res.result?.message || '登录失败')
      }
    } catch (error) {
      wx.hideLoading()
      console.error('[login] 登录失败', error)
      
      const cached = wx.getStorageSync('loginInfo')
      if (cached && cached.openid) {
        console.log('[login] 使用本地缓存降级')
        return
      }
      
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
      throw error
    }
  },

  switchFarm(farmId) {
    const farm = this.globalData.farmList.find(f => f._id === farmId)
    if (!farm) return
    this.globalData.activeFarmId = farmId
    const cached = wx.getStorageSync('loginInfo') || {}
    cached.activeFarmId = farmId
    wx.setStorageSync('loginInfo', cached)
  },

  logout() {
    this.globalData.userInfo = null
    this.globalData.openid = ''
    this.globalData.farmList = []
    this.globalData.activeFarmId = ''
    this.globalData.isLoggedIn = false
    wx.removeStorageSync('loginInfo')
  }
})