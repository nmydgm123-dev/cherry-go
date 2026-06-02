const app = getApp()

Page({
  data: {
    startDate: '',
    endDate: '',
    revenueData: null,
    loading: false
  },

  onLoad() {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const d = String(now.getDate()).padStart(2, '0')
    this.setData({
      startDate: `${y}-${m}-01`,
      endDate: `${y}-${m}-${d}`
    })
  },

  onStartChange(e) {
    this.setData({ startDate: e.detail.value })
  },

  onEndChange(e) {
    this.setData({ endDate: e.detail.value })
  },

  goBack() {
    wx.navigateBack()
  },

  async doQuery() {
    const { startDate, endDate } = this.data
    if (!startDate || !endDate) {
      wx.showToast({ title: '请选择起止日期', icon: 'none' })
      return
    }
    if (startDate > endDate) {
      wx.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getRevenueStats',
        data: { startDate, endDate, farm_id: app.globalData.activeFarmId },
        timeout: 20000
      })
      if (res.result && res.result.code === 0) {
        this.setData({ revenueData: res.result.data })
      } else {
        wx.showToast({ title: '查询失败', icon: 'none' })
      }
    } catch (error) {
      console.error('[revenue] 查询失败', error)
      wx.showToast({ title: '请先部署云函数 getRevenueStats', icon: 'none' })
    }
    this.setData({ loading: false })
  }
})
