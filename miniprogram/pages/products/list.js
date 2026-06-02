const app = getApp()

Page({
  data: {
    products: [],
    isOwner: false,
    isLoading: false,
    selectMode: false
  },

  onLoad(options) {
    if (options?.from === 'createOrder') {
      this.setData({ selectMode: true })
    }
    this.initPage()
  },

  onShow() {
    this.safeLoadProducts()
  },

  async initPage() {
    console.log('[products] 初始化页面')
    if (!app.globalData.userInfo) {
      console.log('[products] 等待登录...')
      try {
        await app.login()
      } catch (e) {
        console.log('[products] 登录异常，继续尝试加载', e)
      }
    }
    this.checkUserRole()
    this.safeLoadProducts()
  },

  checkUserRole() {
    const activeFarmId = app.globalData.activeFarmId
    const farmList = app.globalData.farmList || []
    const farm = farmList.find(f => f._id === activeFarmId)
    const isOwner = !!(farm && farm.role === 'owner')
    this.setData({ isOwner: isOwner })
  },

  async safeLoadProducts() {
    if (this.data.isLoading) {
      console.log('[products] 正在加载中，跳过重复请求')
      return
    }
    
    this.setData({ isLoading: true })
    wx.showLoading({ title: '加载中...', mask: true })
    
    try {
      console.log('[products] 开始安全加载商品')
      const res = await wx.cloud.callFunction({
        name: 'getProducts',
        data: { status: 'active', farm_id: app.globalData.activeFarmId },
        timeout: 20000
      })
      console.log('[products] 云函数返回', res)
      if (res.result && res.result.code === 0) {
        this.setData({ products: res.result.data || [] })
        console.log('[products] 商品加载成功，数量:', res.result.data?.length)
      } else {
        this.setData({ products: [] })
      }
    } catch (error) {
      console.error('[products] 加载商品失败', error)
      this.setData({ products: [] })
      wx.showToast({
        title: '加载失败，请稍后重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      wx.hideLoading()
      this.setData({ isLoading: false })
    }
  },

  getMinPrice(product) {
    if (!product.specifications || product.specifications.length === 0) return '0'
    const minPrice = Math.min(...product.specifications.map(s => s.price))
    return minPrice.toFixed(2)
  },

  selectProduct(e) {
    const id = e.currentTarget.dataset.id
    console.log('[products] 选择商品，selectMode:', this.data.selectMode, 'id:', id)
    
    if (this.data.selectMode) {
      // 选择模式：返回创建订单页面
      console.log('[products] 选择模式，返回订单页面')
      wx.navigateTo({
        url: `/pages/orders/create?productId=${id}`
      })
    } else if (this.data.isOwner) {
      // 果园所有者点击直接跳转到编辑页面
      wx.navigateTo({
        url: `/pages/products/config?editId=${id}`
      })
    } else {
      wx.navigateTo({
        url: `/pages/products/detail?id=${id}`
      })
    }
  },

  cancelSelect() {
    wx.navigateBack()
  },

  goToConfig() {
    wx.navigateTo({
      url: '/pages/products/config'
    })
  }
})
