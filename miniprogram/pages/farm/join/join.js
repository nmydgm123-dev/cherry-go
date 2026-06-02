const app = getApp()

Page({
  data: {
    inviteCode: '',
    joining: false
  },

  onCodeInput(e) {
    this.setData({ inviteCode: e.detail.value })
  },

  goBack() {
    wx.navigateBack()
  },

  async doJoin() {
    const code = this.data.inviteCode.trim().toUpperCase()
    if (!code) {
      wx.showToast({ title: '请输入邀请码', icon: 'none' })
      return
    }
    if (code.length !== 6) {
      wx.showToast({ title: '邀请码为6位', icon: 'none' })
      return
    }
    this.setData({ joining: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'joinFarm',
        data: { invite_code: code },
        timeout: 20000
      })
      if (res.result && res.result.code === 0) {
        app.switchFarm(res.result.data._id)
        await app.login()
        wx.showToast({ title: '加入成功！', icon: 'success' })
        wx.reLaunch({ url: '/pages/index/index' })
      } else {
        wx.showToast({ title: res.result?.message || '加入失败', icon: 'none' })
      }
    } catch (error) {
      console.error('[farm/join] 加入失败', error)
      wx.showToast({ title: '请先部署云函数 joinFarm', icon: 'none' })
    }
    this.setData({ joining: false })
  }
})
