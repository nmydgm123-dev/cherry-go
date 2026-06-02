const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { role } = event

  try {
    console.log('更新角色', openid, role)
    
    // 查找用户
    const userRes = await db.collection('users').where({ openid }).get()
    
    if (!userRes.data || userRes.data.length === 0) {
      console.log('用户不存在，创建新用户')
      // 如果用户不存在，创建新用户
      await db.collection('users').add({
        data: {
        openid: openid,
        role: role,
        nickname: '测试用户',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
    } else {
      console.log('更新现有用户角色')
      // 如果用户存在，更新角色
      await db.collection('users').doc(userRes.data[0]._id).update({
        data: {
          role: role,
          updated_at: new Date().toISOString()
        }
      })
    }

    return {
      code: 0,
      message: '角色更新成功'
    }
  } catch (error) {
    console.error('更新角色失败', error)
    return {
      code: -1,
      message: '服务器错误'
    }
  }
}
