const app = getApp()

Page({
  data: {
    orderId: '',
    order: {},
    photoFruit: '',
    photoOrder: '',
    shippingCompanies: ['顺丰快递', '京东物流', '圆通速递', '中通快递', '韵达快递', '申通快递', '邮政EMS', '极兔速递'],
    companyIndex: 0,
    trackingNo: ''
  },

  computed: {
    canSubmit() {
      return this.data.photoFruit && this.data.photoOrder && this.data.trackingNo && this.data.companyIndex >= 0
    }
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
        data: { orderId: this.data.orderId },
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

  choosePhoto(e) {
    const type = e.currentTarget.dataset.type
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择'],
      success: (res) => {
        const sourceType = res.tapIndex === 0 ? ['camera'] : ['album']
        wx.chooseMedia({
          count: 1,
          mediaType: ['image'],
          sourceType: sourceType,
          success: (res) => {
            const tempFilePath = res.tempFiles[0].tempFilePath
            this.uploadPhoto(tempFilePath, type)
          }
        })
      }
    })
  },

  async uploadPhoto(filePath, type) {
    try {
      wx.showLoading({ title: '上传中...' })
      
      const timestamp = Date.now()
      const cloudPath = `orders/${this.data.orderId}/${type}_${timestamp}.jpg`
      
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      })
      
      wx.hideLoading()
      
      if (type === 'fruit') {
        this.setData({ photoFruit: uploadResult.fileID })
      } else {
        this.setData({ photoOrder: uploadResult.fileID })
      }
      
      wx.showToast({
        title: '上传成功',
        icon: 'success'
      })
    } catch (error) {
      wx.hideLoading()
      console.error('上传照片失败', error)
      wx.showToast({
        title: '上传失败',
        icon: 'none'
      })
    }
  },

  deletePhoto(e) {
    const type = e.currentTarget.dataset.type
    if (type === 'fruit') {
      this.setData({ photoFruit: '' })
    } else {
      this.setData({ photoOrder: '' })
    }
  },

  previewPhoto(e) {
    const url = e.currentTarget.dataset.url
    wx.previewImage({
      urls: [url],
      current: url
    })
  },

  onCompanyChange(e) {
    this.setData({ companyIndex: e.detail.value })
  },

  onTrackingNoInput(e) {
    this.setData({ trackingNo: e.detail.value.trim() })
  },

  async submitShip() {
    if (!this.data.photoFruit || !this.data.photoOrder) {
      wx.showToast({
        title: '请上传所有照片',
        icon: 'none'
      })
      return
    }
    
    if (!this.data.trackingNo) {
      wx.showToast({
        title: '请输入快递单号',
        icon: 'none'
      })
      return
    }

    wx.showModal({
      title: '确认发货',
      content: '确认已填写正确的物流信息并上传照片？',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '提交中...' })
            const result = await wx.cloud.callFunction({
              name: 'shipOrder',
              data: {
                order_id: this.data.orderId,
                photo_fruit: this.data.photoFruit,
                photo_order: this.data.photoOrder,
                shipping_company: this.data.shippingCompanies[this.data.companyIndex],
                tracking_number: this.data.trackingNo
              },
              timeout: 20000
            })
            wx.hideLoading()
            
            if (result.result && result.result.code === 0) {
              wx.showToast({
                title: '发货成功',
                icon: 'success'
              })
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            } else {
              wx.showToast({
                title: result.result?.message || '发货失败',
                icon: 'none'
              })
            }
          } catch (error) {
            wx.hideLoading()
            console.error('发货失败', error)
            wx.showToast({
              title: '发货失败',
              icon: 'none'
            })
          }
        }
      }
    })
  }
})
