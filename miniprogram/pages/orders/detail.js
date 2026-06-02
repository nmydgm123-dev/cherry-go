const app = getApp()

Page({
  data: {
    orderId: '',
    order: {}
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ orderId: options.id })
      this.loadOrderDetail()
    }
  },

  async loadOrderDetail() {
    try {
      wx.showLoading({ title: '加载中...' })
      const result = await wx.cloud.callFunction({
        name: 'getOrder',
        data: { orderId: this.data.orderId, farm_id: app.globalData.activeFarmId },
        timeout: 20000
      })
      wx.hideLoading()
      
      if (result.result && result.result.code === 0) {
        this.setData({ order: result.result.data })
      } else {
        wx.showToast({
          title: '加载失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('加载订单详情失败', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  getStatusIcon(status) {
    const icons = {
      pending: '⏳',
      shipped: '🚚',
      delivered: '✅',
      completed: '🎉'
    }
    return icons[status] || '📦'
  },

  getStatusText(status) {
    const texts = {
      pending: '待发货',
      shipped: '已发货',
      delivered: '已收货',
      completed: '已完成'
    }
    return texts[status] || '未知状态'
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: [url],
      current: url
    })
  }
})
