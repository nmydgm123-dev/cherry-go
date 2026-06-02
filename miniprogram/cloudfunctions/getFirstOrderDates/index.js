const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const { farm_id } = event
    if (!farm_id) {
      return { code: -1, message: '缺少果园信息' }
    }
    const res = await db.collection('orders')
      .where({ farm_id })
      .orderBy('created_at', 'asc')
      .get()

    const orders = res.data || []
    const firstOfYear = {}

    for (const order of orders) {
      const d = new Date(order.created_at)
      const year = d.getFullYear()
      if (!firstOfYear[year]) {
        firstOfYear[year] = {
          year,
          date: order.created_at,
          order_no: order.order_no
        }
      }
    }

    const list = Object.values(firstOfYear).sort((a, b) => b.year - a.year)

    return {
      code: 0,
      data: list
    }
  } catch (error) {
    console.error('获取首单日期失败', error)
    return { code: -1, message: '服务器错误' }
  }
}
