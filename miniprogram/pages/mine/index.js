const app = getApp()

Page({
  data: {
    userInfo: {},
    isLoggedIn: false,
    farmList: [],
    activeFarm: null
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  loadData() {
    const isLoggedIn = app.globalData.isLoggedIn
    const userInfo = app.globalData.userInfo || {}
    const farmList = app.globalData.farmList || []
    const activeId = app.globalData.activeFarmId
    const activeFarm = farmList.find(f => f._id === activeId) || null
    this.setData({ userInfo, isLoggedIn, farmList, activeFarm })
  },

  getRoleText(role) {
    return role === 'owner' ? '果园主' : '成员'
  },

  async handleLogin() {
    try {
      await app.login()
      this.loadData()
    } catch (e) {
      console.error('[mine] 登录失败', e)
    }
  },

  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          this.loadData()
          wx.showToast({ title: '已退出', icon: 'success' })
        }
      }
    })
  },

  goToOrders() {
    wx.switchTab({ url: '/pages/index/index' })
  },

  goToTrack() {
    wx.navigateTo({ url: '/pages/orders/track' })
  },

  goToRevenue() {
    wx.navigateTo({ url: '/pages/revenue/revenue' })
  },

  goToCalendar() {
    wx.navigateTo({ url: '/pages/calendar/calendar' })
  },

  goToProductConfig() {
    wx.navigateTo({ url: '/pages/products/config' })
  },

  goToFarmInfo() {
    wx.navigateTo({ url: '/pages/farm/info/info' })
  },

  goToShare() {
    if (!this.data.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      return
    }
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  goToAbout() {
    wx.showModal({
      title: '关于 CherryGo',
      content: '农产品销售管理小程序 v1.0',
      showCancel: false
    })
  }
})
