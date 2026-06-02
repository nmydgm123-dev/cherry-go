const app = getApp()

Page({
  data: {
    steps: ['选择商品', '填写信息', '确认订单'],
    currentStep: 0,
    showProductList: false,
    products: [],
    selectedProducts: [],
    courierOptions: ['京东', '邮政', '顺丰', '自定义'],
    selectedCourier: '京东',
    customCourier: '',
    shippingFee: 10,
    address: '',
    remarks: '',
    discount: 0,
    boxCount: 1,
    totalProductsPrice: 0,
    orderTotal: 0,
    creator: '',
    addressHistory: []
  },

  onLoad(options) {
    const defaultCreator = app.globalData.userInfo?.nickname || ''
    const saved = wx.getStorageSync('orderFormDefaults') || {}
    
    this.setData({
      creator: saved.creator || defaultCreator,
      selectedCourier: saved.selectedCourier || '京东',
      shippingFee: saved.shippingFee || 10,
      addressHistory: saved.addressHistory || []
    })
    
    this.loadProducts()
    this.recalculateTotals()
  },

  // 加载商品列表
  async loadProducts() {
    try {
      wx.showLoading({ title: '加载中...' })
      const res = await wx.cloud.callFunction({
        name: 'getProducts',
        data: { status: 'active', farm_id: app.globalData.activeFarmId },
        timeout: 20000
      })
      wx.hideLoading()
      
      if (res.result && res.result.code === 0) {
        this.setData({ 
          products: res.result.data || []
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('[createOrder] 加载商品失败', error)
    }
  },

  // 打开商品选择
  openProductList() {
    this.setData({ showProductList: true })
  },

  // 关闭商品选择
  closeProductList() {
    this.setData({ showProductList: false })
  },

  // 添加商品
  addProduct(e) {
    const product = e.currentTarget.dataset.product
    console.log('[createOrder] 选择商品:', product)
    
    // 默认选择第一个规格
    const defaultSpec = product.specifications && product.specifications.length > 0 
      ? product.specifications[0] 
      : null
    
    if (!defaultSpec) {
      wx.showToast({ title: '该商品没有规格', icon: 'none' })
      return
    }
    
    const newItem = {
      id: Date.now(), // 唯一标识
      product: product,
      spec: defaultSpec,
      weight: 2 // 默认2斤
    }
    
    const selectedProducts = [...this.data.selectedProducts, newItem]
    
    this.setData({ 
      selectedProducts,
      showProductList: false
    })
    this.recalculateTotals()
  },

  // 删除商品
  removeProduct(e) {
    const index = e.currentTarget.dataset.index
    const selectedProducts = [...this.data.selectedProducts]
    selectedProducts.splice(index, 1)
    this.setData({ selectedProducts })
    this.recalculateTotals()
  },

  // 选择规格
  selectSpec(e) {
    const { index, spec } = e.currentTarget.dataset
    const selectedProducts = [...this.data.selectedProducts]
    selectedProducts[index].spec = spec
    this.setData({ selectedProducts })
    this.recalculateTotals()
  },

  // 减少斤数
  decreaseWeight(e) {
    const index = e.currentTarget.dataset.index
    const selectedProducts = [...this.data.selectedProducts]
    if (selectedProducts[index].weight > 1) {
      selectedProducts[index].weight -= 1
      this.setData({ selectedProducts })
      this.recalculateTotals()
    }
  },

  // 增加斤数
  increaseWeight(e) {
    const index = e.currentTarget.dataset.index
    const selectedProducts = [...this.data.selectedProducts]
    selectedProducts[index].weight += 1
    this.setData({ selectedProducts })
    this.recalculateTotals()
  },

  // 手动输入斤数
  onWeightInput(e) {
    const { index } = e.currentTarget.dataset
    const weight = parseInt(e.detail.value) || 1
    const selectedProducts = [...this.data.selectedProducts]
    selectedProducts[index].weight = weight
    this.setData({ selectedProducts })
    this.recalculateTotals()
  },

  stopPropagation() {},

  // 选择快递
  selectCourier(e) {
    const index = e.currentTarget.dataset.index
    const selectedCourier = this.data.courierOptions[index]
    this.setData({ selectedCourier })
  },

  // 自定义快递
  onCustomCourierInput(e) {
    this.setData({ customCourier: e.detail.value })
  },

  // 快递费输入
  onShippingFeeInput(e) {
    const shippingFee = parseFloat(e.detail.value) || 0
    this.setData({ shippingFee })
    this.recalculateTotals()
  },

  // 地址输入
  onAddressInput(e) {
    this.setData({ address: e.detail.value })
  },

  // 选择历史地址
  selectHistoryAddress(e) {
    const address = e.currentTarget.dataset.address
    this.setData({ address })
  },

  // 保存表单默认值
  saveFormDefaults() {
    const { creator, selectedCourier, shippingFee, address, addressHistory } = this.data
    
    let newHistory = [...addressHistory]
    if (address && address.trim()) {
      newHistory.unshift(address.trim())
      newHistory = [...new Set(newHistory)].slice(0, 5) // 去重，保留最近5个
    }
    
    wx.setStorageSync('orderFormDefaults', {
      creator,
      selectedCourier,
      shippingFee,
      addressHistory: newHistory
    })
  },

  onRemarksInput(e) {
    this.setData({ remarks: e.detail.value })
  },

  onDiscountInput(e) {
    const discount = parseFloat(e.detail.value) || 0
    this.setData({ discount })
    this.recalculateTotals()
  },

  onBoxCountInput(e) {
    const boxCount = parseInt(e.detail.value) || 1
    this.setData({ boxCount })
    this.recalculateTotals()
  },

  onCreatorInput(e) {
    this.setData({ creator: e.detail.value })
  },

  // 计算商品小计
  calculateProductSubtotal(item) {
    if (!item.spec) return 0
    return item.spec.price * item.weight
  },

  // 计算所有商品总计
  calculateTotalProducts() {
    return this.data.selectedProducts.reduce((total, item) => {
      return total + this.calculateProductSubtotal(item)
    }, 0)
  },

  // 计算订单总额
  calculateTotal() {
    const baseTotal = this.calculateTotalProducts() + this.data.shippingFee
    return baseTotal * this.data.boxCount - this.data.discount
  },

  recalculateTotals() {
    const totalProductsPrice = this.calculateTotalProducts()
    this.setData({
      totalProductsPrice,
      orderTotal: this.calculateTotal()
    })
  },

  // 上一步
  prevStep() {
    if (this.data.currentStep > 0) {
      this.setData({ currentStep: this.data.currentStep - 1 })
    }
  },

  // 下一步
  nextStep() {
    if (this.data.currentStep === 0) {
      if (this.data.selectedProducts.length === 0) {
        wx.showToast({ title: '请至少添加一个商品', icon: 'none' })
        return
      }
    }
    
    if (this.data.currentStep === 1) {
      if (!this.data.address.trim()) {
        wx.showToast({ title: '请填写收货地址', icon: 'none' })
        return
      }
    }
    
    this.setData({ currentStep: this.data.currentStep + 1 })
  },

  // 提交订单
  async submitOrder() {
    try {
      this.saveFormDefaults()
      wx.showLoading({ title: '提交中...' })
      
      const courier = this.data.selectedCourier === '自定义' 
        ? this.data.customCourier 
        : this.data.selectedCourier
      
      // 构建商品数据
      const products = this.data.selectedProducts.map(item => ({
        product_id: item.product._id,
        product_name: item.product.name,
        product_emoji: item.product.emoji,
        product_color: item.product.color,
        spec_name: item.spec.name,
        quantity: item.weight,
        weight: item.weight + '斤',
        unit_price: item.spec.price,
        subtotal: this.calculateProductSubtotal(item)
      }))
      
      const submitData = {
        products: products,
        total_products: this.calculateTotalProducts(),
        shipping_fee: this.data.shippingFee,
        discount: this.data.discount || 0,
        box_count: this.data.boxCount || 1,
        total: this.calculateTotal(),
        courier: courier,
        address: this.data.address,
        remarks: this.data.remarks,
        writer_name: this.data.creator,
        farm_id: app.globalData.activeFarmId
      }
      
      console.log('[createOrder] 提交订单:', submitData)
      
      const res = await wx.cloud.callFunction({
        name: 'createOrder',
        data: submitData,
        timeout: 20000
      })
      
      wx.hideLoading()
      
      if (res.result && res.result.code === 0) {
        wx.showToast({
          title: '订单提交成功',
          icon: 'success'
        })
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: res.result?.message || '提交失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('[createOrder] 提交失败', error)
      wx.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    }
  }
})
