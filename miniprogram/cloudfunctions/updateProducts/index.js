const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  try {
    const productsRes = await db.collection('products').get()
    const products = productsRes.data
    
    for (const product of products) {
      await db.collection('products').doc(product._id).update({
        data: {
          image: '',
          color: product.name.includes('车厘子') ? '#e74c3c' : '#f39c12',
          emoji: product.name.includes('车厘子') ? '🍒' : '🍊',
          updated_at: new Date().toISOString()
        }
      })
    }
    
    return {
      code: 0,
      message: '更新成功',
      count: products.length
    }
  } catch (error) {
    console.error('更新失败', error)
    return {
      code: -1,
      message: '服务器错误'
    }
  }
}
