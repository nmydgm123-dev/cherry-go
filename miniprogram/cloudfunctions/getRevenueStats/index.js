const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { startDate, endDate, farm_id } = event
    if (!startDate || !endDate) {
      return { code: -1, message: '请选择起止日期' }
    }
    if (!farm_id) {
      return { code: -1, message: '缺少果园信息' }
    }

    const endOfDay = endDate + 'T23:59:59.999Z'
    const query = {
      farm_id,
      status: 'shipped',
      shipped_at: _.gte(startDate).and(_.lte(endOfDay))
    }

    const res = await db.collection('orders').where(query).get()
    const orders = res.data || []

    let totalRevenue = 0
    for (const order of orders) {
      totalRevenue += order.total || 0
    }

    return {
      code: 0,
      data: {
        total_revenue: totalRevenue,
        order_count: orders.length,
        avg_revenue: orders.length > 0 ? Math.round(totalRevenue / orders.length * 100) / 100 : 0
      }
    }
  } catch (error) {
    console.error('获取营收统计失败', error)
    return { code: -1, message: '服务器错误' }
  }
}
