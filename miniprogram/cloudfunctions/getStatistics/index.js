const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { year, period, farm_id } = event
    if (!farm_id) {
      return { code: -1, message: '缺少果园信息' }
    }

    const now = new Date()
    const targetYear = year || now.getFullYear()

    const yearStart = new Date(targetYear, 0, 1).toISOString()
    const yearEnd = new Date(targetYear + 1, 0, 1).toISOString()

    const yearQuery = { farm_id, created_at: _.gte(yearStart).and(_.lt(yearEnd)) }

    const [allRes, pendingRes] = await Promise.all([
      db.collection('orders').where(yearQuery).count(),
      db.collection('orders').where({ ...yearQuery, status: 'pending' }).count()
    ])

    let periodStart
    if (period === 'week') {
      periodStart = new Date(now)
      periodStart.setDate(periodStart.getDate() - periodStart.getDay())
      periodStart.setHours(0, 0, 0, 0)
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    }
    const periodStartISO = periodStart.toISOString()
    const shippedPeriodQuery = _.and([
      { status: 'shipped' },
      _.or([
        { updated_at: _.gte(periodStartISO) },
        { shipped_at: _.gte(periodStartISO) }
      ])
    ])

    const shippedRes = await db.collection('orders').where(shippedPeriodQuery).count()

    return {
      code: 0,
      data: {
        total_orders: allRes.total,
        pending_orders: pendingRes.total,
        today_shipped: shippedRes.total,
        total_revenue: 0,
        spec_summary: []
      }
    }
  } catch (error) {
    console.error('获取统计失败', error)
    return {
      code: -1,
      message: '服务器错误'
    }
  }
}