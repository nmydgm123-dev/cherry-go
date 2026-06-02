const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { productId, farm_id } = event

  try {
    if (!productId) {
      return { code: -1, message: '缺少商品ID' }
    }

    const product = await db.collection('products').doc(productId).get()
    if (!product.data || (farm_id && product.data.farm_id !== farm_id)) {
      return { code: -1, message: '无权操作该商品' }
    }

    await db.collection('products').doc(productId).remove()

    return {
      code: 0,
      message: '删除成功'
    }
  } catch (error) {
    console.error('删除商品失败', error)
    return {
      code: -1,
      message: '服务器错误'
    }
  }
}
