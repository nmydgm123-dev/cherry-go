const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const { name, description, emoji, color, specifications, status, farm_id } = event
    
    if (!name || !specifications || specifications.length === 0) {
      return { code: -1, message: '缺少必要参数' }
    }
    if (!farm_id) {
      return { code: -1, message: '缺少果园信息' }
    }

    const result = await db.collection('products').add({
      data: {
        farm_id,
        name,
        description: description || '',
        emoji: emoji || '🍒',
        color: color || '#E74C3C',
        specifications: specifications.map(s => ({
          name: s.name,
          weight: s.weight || '',
          price: s.price || 0,
          stock: s.stock || 999
        })),
        status: status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })

    return {
      code: 0,
      message: '创建成功',
      data: { _id: result._id }
    }
  } catch (error) {
    console.error('创建商品失败', error)
    return {
      code: -1,
      message: '服务器错误'
    }
  }
}
