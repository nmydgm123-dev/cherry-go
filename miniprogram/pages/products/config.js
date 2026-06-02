const app = getApp()

Page({
  data: {
    products: [],
    loading: false,
    showModal: false,
    editingProduct: null,
    form: {
      name: '',
      description: '',
      emoji: '🍒',
      color: '#E74C3C',
      sizes: ['大果', '中果', '小果'],
      prices: {
        '大果': 88,
        '中果': 68,
        '小果': 48
      }
    },
    emojiOptions: ['🍒', '🍊', '🍎', '🍓', '🍑', '🍋', '🍌', '🍉', '🥝', '🍇'],
    emojiIndex: 0,
    colorOptions: ['#E74C3C', '#3498DB', '#27AE60', '#F39C12', '#9B59B6', '#1ABC9C', '#E91E63', '#607D8B'],
    colorIndex: 0
  },

  onLoad(options) {
    const farmList = app.globalData.farmList || []
    const activeId = app.globalData.activeFarmId
    const farm = farmList.find(f => f._id === activeId)
    if (!farm || farm.role !== 'owner') {
      wx.showToast({ title: '仅果园主可配置商品', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 1500)
      return
    }
    if (options.editId) {
      this.editProductById(options.editId)
    }
    this.loadProducts()
  },

  onShow() {
    this.loadProducts()
  },

  async loadProducts() {
    try {
      this.setData({ loading: true })
      const result = await wx.cloud.callFunction({
        name: 'getProducts',
        data: { all: true, farm_id: app.globalData.activeFarmId },
        timeout: 20000
      })

      if (result.result && result.result.code === 0) {
        this.setData({ products: result.result.data || [] })
      }
    } catch (error) {
      console.error('加载商品失败', error)
    } finally {
      this.setData({ loading: false })
    }
  },

  showAddModal() {
    const randomEmojiIndex = Math.floor(Math.random() * this.data.emojiOptions.length)
    const randomColorIndex = Math.floor(Math.random() * this.data.colorOptions.length)
    
    // 更友好的默认规格
    const defaultSizes = ['大果', '小果']
    const defaultPrices = {
      '大果': 68,
      '小果': 48
    }
    
    this.setData({
      showModal: true,
      editingProduct: null,
      form: {
        name: '',
        description: '',
        emoji: this.data.emojiOptions[randomEmojiIndex],
        color: this.data.colorOptions[randomColorIndex],
        sizes: defaultSizes,
        prices: defaultPrices
      },
      emojiIndex: randomEmojiIndex,
      colorIndex: randomColorIndex
    })
  },

  async editProduct(e) {
    const id = e.currentTarget.dataset.id
    this.editProductById(id)
  },

  async editProductById(id) {
    // 先确保商品列表已加载
    if (this.data.products.length === 0) {
      await this.loadProducts()
    }
    
    const product = this.data.products.find(p => p._id === id)
    if (!product) {
      wx.showToast({
        title: '商品不存在',
        icon: 'none'
      })
      return
    }

    const sizes = product.specifications?.map(s => s.name) || ['大果', '中果', '小果']
    const prices = {}
    product.specifications?.forEach(s => {
      prices[s.name] = s.price
    })

    const emojiIndex = this.data.emojiOptions.indexOf(product.emoji)
    const colorIndex = this.data.colorOptions.indexOf(product.color)

    this.setData({
      showModal: true,
      editingProduct: product,
      form: {
        name: product.name,
        description: product.description || '',
        emoji: product.emoji || '🍒',
        color: product.color || '#E74C3C',
        sizes: sizes,
        prices: prices
      },
      emojiIndex: emojiIndex >= 0 ? emojiIndex : 0,
      colorIndex: colorIndex >= 0 ? colorIndex : 0
    })
  },

  hideModal() {
    this.setData({ showModal: false })
  },

  stopPropagation() {
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({ [`form.${field}`]: value })
  },

  onEmojiChange(e) {
    const index = e.detail.value
    this.setData({
      emojiIndex: index,
      'form.emoji': this.data.emojiOptions[index]
    })
  },

  onColorChange(e) {
    const index = e.detail.value
    this.setData({
      colorIndex: index,
      'form.color': this.data.colorOptions[index]
    })
  },

  onSizeChange(e) {
    const index = e.currentTarget.dataset.index
    const value = e.detail.value
    const sizes = [...this.data.form.sizes]
    sizes[index] = value
    this.setData({ 'form.sizes': sizes })
  },

  onPriceChange(e) {
    const size = e.currentTarget.dataset.size
    const value = parseFloat(e.detail.value) || 0
    const prices = { ...this.data.form.prices }
    prices[size] = value
    this.setData({ 'form.prices': prices })
  },

  addSize() {
    const sizes = [...this.data.form.sizes, '新规格']
    const prices = { ...this.data.form.prices }
    prices['新规格'] = 50
    this.setData({ 'form.sizes': sizes, 'form.prices': prices })
  },

  removeSize(e) {
    const index = e.currentTarget.dataset.index
    if (this.data.form.sizes.length <= 1) {
      wx.showToast({
        title: '至少保留一个规格',
        icon: 'none'
      })
      return
    }
    const sizes = this.data.form.sizes.filter((_, i) => i !== index)
    const removedSize = this.data.form.sizes[index]
    const prices = { ...this.data.form.prices }
    delete prices[removedSize]
    this.setData({ 'form.sizes': sizes, 'form.prices': prices })
  },

  async saveProduct() {
    if (!this.data.form.name.trim()) {
      wx.showToast({
        title: '请输入商品名称',
        icon: 'none'
      })
      return
    }

    const validSizes = this.data.form.sizes.filter(s => s.trim())
    if (validSizes.length === 0) {
      wx.showToast({
        title: '请至少添加一个规格',
        icon: 'none'
      })
      return
    }

    try {
      wx.showLoading({ title: '保存中...' })
      
      const specifications = validSizes.map(size => ({
        name: size,
        weight: '',
        price: this.data.form.prices[size] || 50,
        stock: 999
      }))

      const data = {
        name: this.data.form.name,
        description: this.data.form.description,
        emoji: this.data.form.emoji,
        color: this.data.form.color,
        specifications: specifications,
        status: 'active'
      }

      let result
      if (this.data.editingProduct) {
        result = await wx.cloud.callFunction({
          name: 'updateProduct',
          data: {
            productId: this.data.editingProduct._id,
            ...data,
            farm_id: app.globalData.activeFarmId
          },
          timeout: 20000
        })
      } else {
        result = await wx.cloud.callFunction({
          name: 'createProduct',
          data: { ...data, farm_id: app.globalData.activeFarmId },
          timeout: 20000
        })
      }

      wx.hideLoading()

      if (result.result && result.result.code === 0) {
        wx.showToast({
          title: this.data.editingProduct ? '修改成功' : '添加成功',
          icon: 'success'
        })
        this.hideModal()
        this.loadProducts()
      } else {
        wx.showToast({
          title: result.result?.message || '保存失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('保存商品失败', error)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  async toggleStatus(e) {
    const id = e.currentTarget.dataset.id
    const status = e.currentTarget.dataset.status
    const newStatus = status === 'active' ? 'inactive' : 'active'

    try {
      wx.showLoading({ title: '操作中...' })
      const result = await wx.cloud.callFunction({
        name: 'updateProduct',
        data: {
          productId: id,
          status: newStatus,
          farm_id: app.globalData.activeFarmId
        },
        timeout: 20000
      })

      wx.hideLoading()

      if (result.result && result.result.code === 0) {
        this.loadProducts()
        wx.showToast({
          title: newStatus === 'active' ? '已上架' : '已下架',
          icon: 'success'
        })
      } else {
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('操作失败', error)
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    }
  },

  async deleteProduct(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定删除吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' })
            const result = await wx.cloud.callFunction({
              name: 'deleteProduct',
              data: { productId: id, farm_id: app.globalData.activeFarmId },
              timeout: 20000
            })

            wx.hideLoading()

            if (result.result && result.result.code === 0) {
              this.loadProducts()
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
            } else {
              wx.showToast({
                title: '删除失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('删除失败', error)
            wx.showToast({
              title: '删除失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})
