const app = getApp()

Page({
  data: {
    activeFarm: null,
    tabs: [
      { key: 'pending', label: '待发货' },
      { key: 'shipped', label: '已发货' },
      { key: 'all', label: '全部' }
    ],
    currentTab: 'pending',
    orders: [],
    pendingCount: 0,
    todayShipped: 0,
    totalOrders: 0,
    specSummary: [],
    isLoading: false,
    showShipModal: false,
    selectedOrder: null,
    editingCourier: '',
    editingShippingFee: 0,
    photoFruit: '',
    photoOrder: '',
    isShipping: false,
    selectedYear: new Date().getFullYear(),
    statsView: 'day',
    yearRange: []
  },

  onLoad() {
    this.initYearRange()
    this.checkFarmAccess()
    this.safeLoadData()
  },

  onShow() {
    this.checkFarmAccess()
    this.safeLoadData()
  },

  checkFarmAccess() {
    const farmList = app.globalData.farmList || []
    const activeId = app.globalData.activeFarmId
    const activeFarm = farmList.find(f => f._id === activeId) || null
    this.setData({ activeFarm })
    if (!activeFarm && app.globalData.isLoggedIn) {
      wx.navigateTo({ url: '/pages/farm/entry' })
    }
  },

  goToFarmInfo() {
    wx.navigateTo({ url: '/pages/farm/info/info' })
  },

  onPullDownRefresh() {
    this.safeLoadData()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 2000)
  },

  initYearRange() {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let y = currentYear; y >= 2022; y--) {
      years.push(y)
    }
    this.setData({ yearRange: years })
  },

  onYearChange(e) {
    const year = this.data.yearRange[e.detail.value]
    this.setData({ selectedYear: year })
    this.safeLoadData()
  },

  switchStatsView(e) {
    const view = e.currentTarget.dataset.view
    this.setData({ statsView: view })
    this.loadStatistics()
  },

  async safeLoadData() {
    if (this.data.isLoading) return
    this.setData({ isLoading: true })
    wx.showLoading({ title: '加载中...', mask: true })
    try {
      await this.loadOrders()
      await this.loadStatistics()
      this.updatePendingBadge()
    } catch (error) {
      console.error('[index] 加载数据失败', error)
      this.setData({ orders: [] })
    }
    wx.hideLoading()
    this.setData({ isLoading: false })
  },

  updatePendingBadge() {
    const count = this.data.orders.filter(o => o.status === 'pending').length
    this.setData({ pendingCount: count })
  },

  async loadOrders() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getOrders',
        data: {
          status: this.data.currentTab === 'all' ? undefined : this.data.currentTab,
          year: this.data.selectedYear,
          farm_id: app.globalData.activeFarmId
        },
        timeout: 20000
      })
      if (res.result && res.result.code === 0) {
        this.setData({ orders: res.result.data || [] })
      } else {
        this.setData({ orders: [] })
      }
    } catch (error) {
      console.error('[index] 加载订单失败', error)
      this.setData({ orders: [] })
    }
  },

  async loadStatistics() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getStatistics',
        data: {
          year: this.data.selectedYear,
          period: this.data.statsView,
          farm_id: app.globalData.activeFarmId
        },
        timeout: 20000
      })
      if (res.result && res.result.code === 0) {
        const d = res.result.data || {}
        this.setData({
          pendingCount: d.pending_orders || 0,
          todayShipped: d.today_shipped || 0,
          totalOrders: d.total_orders || 0,
          specSummary: d.spec_summary || []
        })
      } else {
        console.error('[index] 统计接口异常', res.result)
        wx.showToast({ title: '统计数据加载失败', icon: 'none' })
      }
    } catch (error) {
      console.error('[index] 加载统计失败', error)
      wx.showToast({ title: '统计数据加载失败', icon: 'none' })
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.loadOrders()
  },

  getStatusText(status) {
    const map = { pending: '待发货', shipped: '已发货', delivered: '已收货', completed: '已完成' }
    return map[status] || status
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    return `${m}-${d} ${h}:${min}`
  },

  getProductSummary(products) {
    if (!products || products.length === 0) return '无商品'
    return products.map(p => {
      const e = p.product_emoji || '🍒'
      const n = p.product_name || ''
      const s = p.spec_name || ''
      return `${e}${n}(${s})`
    }).join('、')
  },

  copyAddress(e) {
    e.stopPropagation()
    const address = e.currentTarget.dataset.address
    wx.setClipboardData({
      data: address,
      success: () => {
        wx.showToast({ title: '地址已复制', icon: 'success' })
      }
    })
  },

  goToCreateOrder() {
    wx.switchTab({ url: '/pages/orders/create' })
  },

  stopPropagation() {},

  showShipDetail(e) {
    const order = e.currentTarget.dataset.order
    this.setData({
      showShipModal: true,
      selectedOrder: order,
      editingCourier: order.courier || '',
      editingShippingFee: order.shipping_fee || 0,
      photoFruit: '',
      photoOrder: ''
    })
  },

  hideShipDetail() {
    this.setData({ showShipModal: false, selectedOrder: null })
  },

  onCourierInput(e) {
    this.setData({ editingCourier: e.detail.value })
  },

  onShippingFeeInput(e) {
    this.setData({ editingShippingFee: parseFloat(e.detail.value) || 0 })
  },

  choosePhoto(e) {
    const type = e.currentTarget.dataset.type
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album']
        wx.chooseMedia({
          count: 1, mediaType: ['image'], sourceType,
          success: (res) => {
            this.uploadPhoto(res.tempFiles[0].tempFilePath, type)
          }
        })
      }
    })
  },

  async uploadPhoto(filePath, type) {
    try {
      wx.showLoading({ title: '上传中...', mask: true })
      const orderId = this.data.selectedOrder._id
      const cloudPath = `orders/${orderId}/${type}_${Date.now()}.jpg`
      const r = await wx.cloud.uploadFile({ cloudPath, filePath })
      wx.hideLoading()
      if (type === 'fruit') {
        this.setData({ photoFruit: r.fileID })
      } else {
        this.setData({ photoOrder: r.fileID })
      }
      wx.showToast({ title: '上传成功', icon: 'success' })
    } catch (error) {
      wx.hideLoading()
      console.error('[index] 上传照片失败', error)
      wx.showToast({ title: '上传失败', icon: 'none' })
    }
  },

  deletePhoto(e) {
    const type = e.currentTarget.dataset.type
    if (type === 'fruit') this.setData({ photoFruit: '' })
    else this.setData({ photoOrder: '' })
  },

  previewPhoto(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.previewImage({ current: url, urls: [url] })
  },

  async submitShip() {
    const order = this.data.selectedOrder
    if (!order) return
    this.setData({ isShipping: true })
    try {
      const result = await wx.cloud.callFunction({
        name: 'shipOrder',
        data: {
          order_id: order._id,
          courier: this.data.editingCourier,
          shipping_fee: this.data.editingShippingFee,
          shipping_company: this.data.editingCourier,
          tracking_number: '',
          photo_fruit: this.data.photoFruit,
          photo_order: this.data.photoOrder,
          farm_id: app.globalData.activeFarmId
        },
        timeout: 20000
      })
      if (result.result && result.result.code === 0) {
        wx.showToast({ title: '发货成功', icon: 'success' })
        this.setData({ showShipModal: false, selectedOrder: null, isShipping: false })
        this.safeLoadData()
      } else {
        wx.showToast({ title: result.result?.message || '发货失败', icon: 'none' })
        this.setData({ isShipping: false })
      }
    } catch (error) {
      console.error('[index] 发货失败', error)
      wx.showToast({ title: '发货失败，请重试', icon: 'none' })
      this.setData({ isShipping: false })
    }
  }
})