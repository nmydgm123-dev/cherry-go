const app = getApp()

Page({
  data: {
    searchKey: '',
    order: null,
    hasSearched: false
  },

  onLoad(options) {
    if (options.orderId) {
      this.setData({ searchKey: options.orderId })
      this.searchOrder()
    }
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value.trim() })
  },

  async searchOrder() {
    if (!this.data.searchKey) {
      wx.showToast({
        title: '请输入查询条件',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '查询中...' })
      const result = await wx.cloud.callFunction({
        name: 'getOrder',
        data: { searchKey: this.data.searchKey, farm_id: app.globalData.activeFarmId },
        timeout: 20000
      })
      wx.hideLoading()

      this.setData({ hasSearched: true })

      if (result.result && result.result.code === 0) {
        this.setData({ order: result.result.data })
      } else {
        this.setData({ order: null })
        wx.showToast({
          title: '未找到订单',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      this.setData({ hasSearched: true, order: null })
      console.error('查询订单失败', error)
      wx.showToast({
        title: '查询失败',
        icon: 'none'
      })
    }
  },

  getStatusText(status) {
    const texts = {
      pending: '待发货',
      shipped: '已发货',
      delivered: '已收货',
      completed: '已完成'
    }
    return texts[status] || '未知'
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
  }
})
