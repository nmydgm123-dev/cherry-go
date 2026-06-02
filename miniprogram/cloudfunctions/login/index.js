const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    let userRes = await db.collection('users').where({ openid }).get()
    let user
    if (userRes.data.length > 0) {
      user = userRes.data[0]
      await db.collection('users').doc(user._id).update({
        data: { updated_at: new Date().toISOString() }
      })
    } else {
      const nickname = '用户' + Math.random().toString(36).substr(2, 6)
      const newUser = {
        openid,
        nickname,
        phone: '',
        active_farm_id: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      const addRes = await db.collection('users').add({ data: newUser })
      newUser._id = addRes.id
      user = newUser
    }

    let farmList = []
    try {
      const farmRes = await db.collection('orchards')
        .where({
          status: 'active',
          members: _.elemMatch({ openid })
        })
        .get()
      farmList = (farmRes.data || []).map(f => ({
        _id: f._id,
        name: f.name,
        invite_code: f.invite_code,
        role: (f.members || []).find(m => m.openid === openid)?.role || 'member'
      }))
    } catch (e) {
      console.log('[login] orchards collection may not exist yet', e)
    }

    return {
      code: 0,
      message: '登录成功',
      openid,
      userInfo: {
        _id: user._id,
        openid: user.openid,
        nickname: user.nickname,
        phone: user.phone,
        active_farm_id: user.active_farm_id || '',
        farmList
      }
    }
  } catch (error) {
    console.error('登录失败', error)
    return { code: -1, message: '服务器错误' }
  }
}
