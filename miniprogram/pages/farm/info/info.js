const app = getApp()

Page({
  data: {
    farmList: [],
    currentFarm: null,
    farmDetail: null,
    loading: false,
    activeTab: 'list'
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    const farmList = app.globalData.farmList || []
    const activeId = app.globalData.activeFarmId
    const currentFarm = farmList.find(f => f._id === activeId) || null
    this.setData({ farmList, currentFarm })
  },

  goBack() {
    wx.navigateBack()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    if (tab === 'detail' && this.data.currentFarm) {
      this.loadFarmDetail(this.data.currentFarm._id)
    }
  },

  async loadFarmDetail(farmId) {
    if (typeof farmId === 'object') farmId = farmId.currentTarget.dataset.id
    this.setData({ loading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getFarmInfo',
        data: { farm_id: farmId },
        timeout: 15000
      })
      if (res.result && res.result.code === 0) {
        this.setData({ farmDetail: res.result.data })
      }
    } catch (error) {
      console.error('[farm/info] 加载详情失败', error)
    }
    this.setData({ loading: false })
  },

  selectFarm(e) {
    const farmId = e.currentTarget.dataset.id
    app.switchFarm(farmId)
    this.loadData()
    wx.showToast({ title: '已切换', icon: 'success' })
  },

  goToCreate() {
    wx.navigateTo({ url: '/pages/farm/create/create' })
  },

  goToEntry() {
    wx.navigateTo({ url: '/pages/farm/entry/entry' })
  },

  async deleteFarm(e) {
    const farmId = e.currentTarget.dataset.id
    const farm = this.data.farmList.find(f => f._id === farmId)
    if (!farm) return
    wx.showModal({
      title: '删除果园',
      content: `确定要删除「${farm.name}」吗？订单和商品数据将保留但不可见。`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'deleteFarm',
              data: { farm_id: farmId },
              timeout: 15000
            })
            if (result.result && result.result.code === 0) {
              wx.showToast({ title: '已删除', icon: 'success' })
              await app.login()
              this.loadData()
            } else {
              wx.showToast({ title: result.result?.message || '删除失败', icon: 'none' })
            }
          } catch (error) {
            wx.showToast({ title: '请先部署云函数 deleteFarm', icon: 'none' })
          }
        }
      }
    })
  },

  copyInviteCode() {
    const code = this.data.farmDetail?.invite_code
    if (!code) return
    wx.setClipboardData({ data: code })
    wx.showToast({ title: '邀请码已复制', icon: 'success' })
  }
})
