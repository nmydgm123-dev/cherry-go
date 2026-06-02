const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

async function ensureCollectionExists(collectionName) {
  try {
    await db.createCollection(collectionName)
    console.log('[createFarm] 集合创建成功:', collectionName)
  } catch (e) {
    if (e.message && e.message.includes('already exists')) {
      console.log('[createFarm] 集合已存在:', collectionName)
    } else {
      console.warn('[createFarm] 创建集合警告:', e.message)
    }
  }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { name } = event

  console.log('[createFarm] 开始创建果园:', { openid, name })

  try {
    if (!name || !name.trim()) {
      return { code: -1, message: '请输入果园名称' }
    }

    await ensureCollectionExists('orchards')
    await ensureCollectionExists('users')

    const trimmedName = name.trim()
    const now = new Date().toISOString()
    const inviteCode = generateInviteCode()

    const farmData = {
      name: trimmedName,
      invite_code: inviteCode,
      owner_openid: openid,
      members: [{
        openid,
        role: 'owner',
        nickname: '果园主',
        joined_at: now
      }],
      status: 'active',
      created_at: now,
      updated_at: now
    }

    console.log('[createFarm] 准备添加果园数据:', farmData)

    const addRes = await db.collection('orchards').add({ data: farmData })
    const farmId = addRes.id

    console.log('[createFarm] 果园创建成功, ID:', farmId)

    let userRes = await db.collection('users').where({ openid }).get()
    if (userRes.data.length > 0) {
      await db.collection('users').doc(userRes.data[0]._id).update({
        data: { active_farm_id: farmId, updated_at: now }
      })
    } else {
      await db.collection('users').add({
        data: {
          openid,
          nickname: '果园主',
          active_farm_id: farmId,
          created_at: now,
          updated_at: now
        }
      })
    }

    console.log('[createFarm] 用户关联更新成功')

    return {
      code: 0,
      message: '创建成功',
      data: {
        _id: farmId,
        name: farmData.name,
        invite_code: inviteCode,
        role: 'owner'
      }
    }
  } catch (error) {
    console.error('[createFarm] 创建果园失败:', error)
    return { 
      code: -1, 
      message: '服务器错误: ' + error.message 
    }
  }
}