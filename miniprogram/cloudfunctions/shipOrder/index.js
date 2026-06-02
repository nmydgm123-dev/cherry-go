const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    console.log('[shipOrder] 收到发货请求:', event)
    
    const { order_id, tracking_number, shipping_company, photos, courier, shipping_fee, photo_fruit, photo_order, farm_id } = event
    
    if (!order_id) {
      return { code: -1, message: '缺少订单ID' }
    }
    
    const orderRes = await db.collection('orders').doc(order_id).get()
    if (!orderRes.data) {
      return { code: -1, message: '订单不存在' }
    }
    if (farm_id && orderRes.data.farm_id !== farm_id) {
      return { code: -1, message: '无权操作该订单' }
    }
    
    console.log('[shipOrder] 找到订单:', orderRes.data)
    
    const updateData = {
      status: 'shipped',
      tracking_number: tracking_number || '',
      shipping_company: shipping_company || '',
      photos: photos || [],
      photo_fruit: photo_fruit || '',
      photo_order: photo_order || '',
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    if (courier !== undefined) updateData.courier = courier
    if (shipping_fee !== undefined) updateData.shipping_fee = shipping_fee
    
    console.log('[shipOrder] 准备更新:', updateData)
    
    await db.collection('orders').doc(order_id).update({
      data: updateData
    })
    
    console.log('[shipOrder] 更新成功')
    
    return {
      code: 0,
      message: '发货成功'
    }
  } catch (error) {
    console.error('[shipOrder] 发货失败', error)
    return {
      code: -1,
      message: '服务器错误: ' + error.message
    }
  }
}
