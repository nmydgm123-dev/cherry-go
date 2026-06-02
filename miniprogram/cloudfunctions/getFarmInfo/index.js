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
      const farmRes = await db.collection('orchards')
        .where({
          status: 'active',
          members: _.elemMatch({ openid })
        })
        .get()

      const farmList = (farmRes.data || []).map(f => ({
        _id: f._id,
        name: f.name,
        invite_code: f.invite_code,
        owner_openid: f.owner_openid,
        member_count: (f.members || []).length,
        role: (f.members || []).find(m => m.openid === openid)?.role || 'member',
        created_at: f.created_at
      }))

      return { code: 0, data: { farms: farmList } }
    }

    const farmRes = await db.collection('orchards').doc(farm_id).get()
    if (!farmRes.data) {
      return { code: -1, message: '果园不存在' }
    }

    const farm = farmRes.data
    const myMembership = (farm.members || []).find(m => m.openid === openid)
    if (!myMembership) {
      return { code: -1, message: '无权查看该果园' }
    }

    return {
      code: 0,
      data: {
        _id: farm._id,
        name: farm.name,
        invite_code: farm.invite_code,
        owner_openid: farm.owner_openid,
        status: farm.status,
        created_at: farm.created_at,
        role: myMembership.role,
        members: (farm.members || []).map(m => ({
          openid: m.openid,
          nickname: m.nickname,
          role: m.role,
          joined_at: m.joined_at
        }))
      }
    }
  } catch (error) {
    console.error('获取果园信息失败', error)
    return { code: -1, message: '服务器错误' }
  }
}
