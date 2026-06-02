const app = getApp()

Page({
  data: {
    calYear: 2026,
    calMonth: 4,
    calendarDays: [],
    dayNames: ['日', '一', '二', '三', '四', '五', '六']
  },

  onLoad() {
    const now = new Date()
    this.setData({ calYear: now.getFullYear(), calMonth: now.getMonth() })
    this.buildCalendar()
    this.loadShipments()
  },

  goBack() {
    wx.navigateBack()
  },

  buildCalendar() {
    const { calYear, calMonth } = this.data
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const dim = new Date(calYear, calMonth + 1, 0).getDate()
    const days = []
    for (let i = 0; i < firstDay; i++) days.push({ day: 0, isEmpty: true, hasShip: false })
    for (let d = 1; d <= dim; d++) days.push({ day: d, isEmpty: false, hasShip: false })
    this.setData({ calendarDays: days })
  },

  async loadShipments() {
    const { calYear, calMonth } = this.data
    try {
      const res = await wx.cloud.callFunction({
        name: 'getShipmentDates',
        data: { year: calYear, month: calMonth, farm_id: app.globalData.activeFarmId },
        timeout: 10000
      })
      if (res.result && res.result.code === 0) {
        const dates = res.result.data.dates || []
        const days = this.data.calendarDays.map(d => ({
          ...d,
          hasShip: !d.isEmpty && dates.includes(d.day)
        }))
        this.setData({ calendarDays: days })
      }
    } catch (error) {
      console.error('[calendar] 加载发货日期失败', error)
    }
  },

  prevMonth() {
    let y = this.data.calYear, m = this.data.calMonth
    m--; if (m < 0) { m = 11; y-- }
    this.setData({ calYear: y, calMonth: m })
    this.buildCalendar()
    this.loadShipments()
  },

  nextMonth() {
    let y = this.data.calYear, m = this.data.calMonth
    m++; if (m > 11) { m = 0; y++ }
    this.setData({ calYear: y, calMonth: m })
    this.buildCalendar()
    this.loadShipments()
  },

  prevYear() {
    this.setData({ calYear: this.data.calYear - 1 })
    this.buildCalendar()
    this.loadShipments()
  },

  nextYear() {
    this.setData({ calYear: this.data.calYear + 1 })
    this.buildCalendar()
    this.loadShipments()
  },

  monthName(m) {
    return ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'][m] || ''
  }
})
