const app = getApp()

Page({
  data: {
    hasFarms: false,
    farmCount: 0
  },

  onLoad() {
    this.checkFarmStatus()
  },

  onShow() {
    this.checkFarmStatus()
  },

  checkFarmStatus() {
    const farmList = app.globalData.farmList || []
    this.setData({
      hasFarms: farmList.length > 0,
      farmCount: farmList.length
    })
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/farm/create/create' })
  },

  goToJoin() {
    wx.navigateTo({ url: '/pages/farm/join/join' })
  },

  skipToHome() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})
