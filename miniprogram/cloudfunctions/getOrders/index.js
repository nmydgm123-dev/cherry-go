const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    console.log('[getOrders] 收到获取订单请求:', event)

    const { status, year, farm_id } = event

    if (!farm_id) {
      return { code: -1, message: '缺少果园信息' }
    }

    let query = { farm_id }
    if (year) {
      const yearStart = new Date(year, 0, 1).toISOString()
      const yearEnd = new Date(year + 1, 0, 1).toISOString()
      query.created_at = _.gte(yearStart).and(_.lt(yearEnd))
    }

    const ordersRes = await db.collection('orders')
      .where(query)
      .orderBy('created_at', 'desc')
      .limit(100)
      .get()

    let orders = ordersRes.data

    if (status) {
      orders = orders.filter(item => item.status === status)
    }

    return {
      code: 0,
      data: orders
    }
  } catch (error) {
    console.error('[getOrders] 获取订单失败', error)
    return {
      code: -1,
      message: '服务器错误: ' + error.message
    }
  }
}