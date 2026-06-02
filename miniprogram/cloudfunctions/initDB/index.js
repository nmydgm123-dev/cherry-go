const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  console.log('[initDB] 开始初始化数据库...')

  try {
    const collections = ['orchards', 'products', 'orders', 'users']
    const results = []

    for (const collName of collections) {
      try {
        await db.createCollection(collName)
        results.push(`${collName}: 创建成功`)
        console.log(`[initDB] ${collName} 集合已创建`)
      } catch (e) {
        if (e.message && e.message.includes('already exists')) {
          results.push(`${collName}: 已存在`)
          console.log(`[initDB] ${collName} 集合已存在`)
        } else {
          results.push(`${collName}: ${e.message}`)
          console.error(`[initDB] ${collName} 失败:`, e)
        }
      }
    }

    return {
      code: 0,
      message: '初始化完成',
      data: results
    }
  } catch (error) {
    console.error('[initDB] 初始化失败:', error)
    return {
      code: -1,
      message: '初始化失败: ' + error.message
    }
  }
}