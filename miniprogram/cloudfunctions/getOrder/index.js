const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { orderId, searchKey, farm_id } = event
    
    let orderRes
    
    if (searchKey) {
      orderRes = await db.collection('orders').where(_.or([
        { order_no: db.RegExp({ regexp: searchKey, options: 'i' }) },
        { receiver_phone: db.RegExp({ regexp: searchKey, options: 'i' }) }
      ])).get()
      
      const order = (orderRes.data || []).find(o => !farm_id || o.farm_id === farm_id)
      if (order) {
        return { code: 0, data: order }
      }
    } else if (orderId) {
      orderRes = await db.collection('orders').doc(orderId).get()
      if (orderRes.data && (!farm_id || orderRes.data.farm_id === farm_id)) {
        return { code: 0, data: orderRes.data }
      }
    }
    
    return { code: -1, message: '订单不存在' }
  } catch (error) {
    console.error('获取订单失败', error)
    return {
      code: -1,
      message: '服务器错误'
    }
  }
}
