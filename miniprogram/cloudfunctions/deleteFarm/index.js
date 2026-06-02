const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { farm_id } = event

  try {
    if (!farm_id) {
      return { code: -1, message: '参数错误' }
    }

    const farmRes = await db.collection('orchards').doc(farm_id).get()
    if (!farmRes.data) {
      return { code: -1, message: '果园不存在' }
    }

    const farm = farmRes.data
    if (farm.owner_openid !== openid) {
      return { code: -1, message: '仅果园主可删除果园' }
    }

    await db.collection('orchards').doc(farm_id).update({
      data: { status: 'deleted', updated_at: new Date().toISOString() }
    })

    return { code: 0, message: '删除成功' }
  } catch (error) {
    console.error('删除果园失败', error)
    return { code: -1, message: '服务器错误' }
  }
}
