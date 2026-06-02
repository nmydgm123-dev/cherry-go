const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { year, month, farm_id } = event
    if (year === undefined || month === undefined) {
      return { code: -1, message: '参数错误' }
    }
    if (!farm_id) {
      return { code: -1, message: '缺少果园信息' }
    }

    const monthStart = new Date(year, month, 1).toISOString()
    const monthEnd = new Date(year, month + 1, 1).toISOString()

    const res = await db.collection('orders')
      .where({
        farm_id,
        shipped_at: _.gte(monthStart).and(_.lt(monthEnd))
      })
      .get()

    const dates = new Set()
    for (const order of res.data || []) {
      if (order.shipped_at) {
        const d = new Date(order.shipped_at)
        dates.add(d.getDate())
      }
    }

    return {
      code: 0,
      data: {
        dates: Array.from(dates).sort((a, b) => a - b),
        count: dates.size
      }
    }
  } catch (error) {
    console.error('获取发货日期失败', error)
    return { code: -1, message: '服务器错误' }
  }
}
