const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    const { keyword, status, all, productId, farm_id } = event

    let query = {}
    if (farm_id) query.farm_id = farm_id
    if (!all && status) {
      query.status = status
    }
    if (keyword) {
      query.name = db.RegExp({ regexp: keyword, options: 'i' })
    }

    const products = await db.collection('products').where(query).get()

    return {
      code: 0,
      data: products.data || []
    }
  } catch (error) {
    console.error('获取商品失败', error)
    return {
      code: -1,
      message: '服务器错误'
    }
  }
}
