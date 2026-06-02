const app = getApp()

Page({
  data: {
    productId: '',
    product: null,
    selectedSpec: null,
    quantity: 1
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ productId: options.id })
      this.loadProduct()
    }
  },

  async loadProduct() {
    try {
      wx.showLoading({ title: '加载中...' })
      const result = await wx.cloud.callFunction({
        name: 'getProducts',
        data: { productId: this.data.productId, farm_id: app.globalData.activeFarmId },
        timeout: 20000
      })
      wx.hideLoading()

      if (result.result && result.result.code === 0 && result.result.data.length > 0) {
        this.setData({ product: result.result.data[0] })
      } else {
        wx.showToast({
          title: '商品不存在',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('加载商品失败', error)
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    }
  },

  selectSpec(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ selectedSpec: index })
    this.calculatePrice()
  },

  calculatePrice() {
    if (!this.data.product || this.data.selectedSpec === null) {
      this.setData({ totalPrice: 0 })
      return
    }
    const spec = this.data.product.specifications[this.data.selectedSpec]
    const total = spec.price * this.data.quantity
    this.setData({ totalPrice: total.toFixed(2) })
  },

  createOrder() {
    if (this.data.selectedSpec === null) {
      wx.showToast({
        title: '请选择规格',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: `/pages/orders/create?productId=${this.data.productId}`
    })
  }
})
