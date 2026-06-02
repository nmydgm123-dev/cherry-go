const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    console.log('收到创建订单请求:', event)
    
    const { products, total_products, shipping_fee, total, courier, address, remarks, discount, box_count, writer_name, farm_id } = event
    
    if (!products || products.length === 0) {
      return { code: -1, message: '请选择商品' }
    }
    
    if (!address) {
      return { code: -1, message: '请填写地址' }
    }
    if (!farm_id) {
      return { code: -1, message: '缺少果园信息' }
    }
    
    const order_no = generateOrderNo()
    
    const orderData = {
      order_no,
      products: products,
      total_products: total_products || 0,
      shipping_fee: shipping_fee || 0,
      discount: discount || 0,
      box_count: box_count || 1,
      total: total || 0,
      courier: courier || '',
      address: address || '',
      remarks: remarks || '',
      writer_name: writer_name || '',
      status: 'pending',
      farm_id: farm_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('准备保存订单:', orderData)
    
    const addRes = await db.collection('orders').add({ data: orderData })
    orderData._id = addRes._id
    
    console.log('订单创建成功:', orderData)
    
    return {
      code: 0,
      message: '订单创建成功',
      data: orderData
    }
  } catch (error) {
    console.error('创建订单失败:', error)
    return {
      code: -1,
      message: '服务器错误: ' + error.message
    }
  }
}

function generateOrderNo() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.random().toString(36).substr(2, 6).toUpperCase()
  return `CG${year}${month}${day}${random}`
}
