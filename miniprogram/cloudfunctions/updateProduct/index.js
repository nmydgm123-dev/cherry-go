const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { productId, name, description, emoji, color, specifications, status, farm_id } = event

  try {
    if (!productId) {
      return { code: -1, message: '缺少商品ID' }
    }

    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (emoji !== undefined) updateData.emoji = emoji
    if (color !== undefined) updateData.color = color
    if (status !== undefined) updateData.status = status
    if (specifications !== undefined && specifications.length > 0) {
      updateData.specifications = specifications.map(s => ({
        name: s.name,
        weight: s.weight || '',
        price: s.price || 0,
        stock: s.stock || 999
      }))
    }

    const product = await db.collection('products').doc(productId).get()
    if (!product.data || (farm_id && product.data.farm_id !== farm_id)) {
      return { code: -1, message: '无权操作该商品' }
    }

    await db.collection('products').doc(productId).update({
      data: updateData
    })

    return {
      code: 0,
      message: '更新成功'
    }
  } catch (error) {
    console.error('更新商品失败', error)
    return {
      code: -1,
      message: '服务器错误'
    }
  }
}
