const app = getApp()

Page({
  data: {
    farmName: '',
    creating: false
  },

  onNameInput(e) {
    const name = e.detail.value
    this.setData({ farmName: name })
  },

  goBack() {
    wx.navigateBack()
  },

  async doCreate() {
    const name = this.data.farmName.trim()
    
    if (!name) {
      wx.showToast({ title: '请输入果园名称', icon: 'none' })
      return
    }

    if (this.data.creating) {
      return
    }

    this.setData({ creating: true })
    wx.showLoading({ title: '创建中...', mask: true })

    try {
      console.log('[createFarm] 调用云函数，参数:', name)
      
      const res = await wx.cloud.callFunction({
        name: 'createFarm',
        data: { name },
        timeout: 30000
      })

      console.log('[createFarm] 云函数返回:', res)

      wx.hideLoading()

      if (res.result && res.result.code === 0) {
        console.log('[createFarm] 创建成功:', res.result.data)
        
        await app.login()

        wx.showToast({ title: '创建成功！', icon: 'success' })
        
        setTimeout(() => {
          wx.reLaunch({ url: '/pages/index/index' })
        }, 1500)
      } else {
        const message = res.result?.message || '创建失败'
        console.error('[createFarm] 创建失败:', message)
        wx.showToast({ title: message, icon: 'none' })
        this.setData({ creating: false })
      }
    } catch (error) {
      wx.hideLoading()
      console.error('[createFarm] 调用失败:', error)
      wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      this.setData({ creating: false })
    }
  }
})