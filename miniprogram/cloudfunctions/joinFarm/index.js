const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { invite_code } = event

  try {
    if (!invite_code || !invite_code.trim()) {
      return { code: -1, message: '请输入邀请码' }
    }

    const code = invite_code.trim().toUpperCase()

    const farmRes = await db.collection('orchards').where({
      invite_code: code,
      status: 'active'
    }).get()

    if (farmRes.data.length === 0) {
      return { code: -1, message: '邀请码无效' }
    }

    const farm = farmRes.data[0]
    const isMember = farm.members && farm.members.some(m => m.openid === openid)
    if (isMember) {
      return { code: 0, message: '你已是该果园成员', data: { _id: farm._id, name: farm.name, role: 'member' } }
    }

    const userRes = await db.collection('users').where({ openid }).get()
    const user = userRes.data[0]
    const nickname = user ? user.nickname : '成员'
    const now = new Date().toISOString()

    await db.collection('orchards').doc(farm._id).update({
      data: {
        members: _.push({ openid, role: 'member', nickname, joined_at: now }),
        updated_at: now
      }
    })

    // 更新用户的果园关联
    try {
      if (user) {
        await db.collection('users').doc(user._id).update({
          data: { active_farm_id: farm._id, updated_at: now }
        })
      }
    } catch (e) {
      console.log('[joinFarm] 更新用户果园关联失败，忽略')
    }

    return {
      code: 0,
      message: '加入成功',
      data: {
        _id: farm._id,
        name: farm.name,
        invite_code: farm.invite_code,
        role: 'member'
      }
    }
  } catch (error) {
    console.error('加入果园失败', error)
    return { code: -1, message: '服务器错误' }
  }
}
