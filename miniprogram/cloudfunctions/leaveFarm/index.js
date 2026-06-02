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
      return { code: -1, message: '缺少果园信息' }
    }

    const farmRes = await db.collection('orchards').doc(farm_id).get()
    if (!farmRes.data) {
      return { code: -1, message: '果园不存在' }
    }

    const farm = farmRes.data
    const myMembership = (farm.members || []).find(m => m.openid === openid)
    
    if (!myMembership) {
      return { code: -1, message: '你不是该果园成员' }
    }

    if (myMembership.role === 'owner') {
      return { code: -1, message: '果园主不能退出，请先转让或删除果园' }
    }

    const now = new Date().toISOString()
    
    const newMembers = (farm.members || []).filter(m => m.openid !== openid)
    
    await db.collection('orchards').doc(farm_id).update({
      data: {
        members: newMembers,
        updated_at: now
      }
    })

    return {
      code: 0,
      message: '已退出果园'
    }
  } catch (error) {
    console.error('退出果园失败', error)
    return { code: -1, message: '服务器错误: ' + error.message }
  }
}