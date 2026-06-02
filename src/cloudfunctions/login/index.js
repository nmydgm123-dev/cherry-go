'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { code } = event;
  
  try {
    // 通过微信code获取openid
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    if (!openid) {
      return {
        code: -1,
        message: '获取用户信息失败'
      };
    }
    
    // 查询用户是否已存在
    const userResult = await db.collection('users').where({
      openid: openid
    }).get();
    
    let userInfo;
    
    if (userResult.data && userResult.data.length > 0) {
      // 用户已存在，更新登录时间
      userInfo = userResult.data[0];
      await db.collection('users').doc(userInfo._id).update({
        updated_at: new Date().toISOString()
      });
    } else {
      // 新用户创建记录
      const inviteCode = generateInviteCode();
      const newUser = {
        openid: openid,
        role: 'browser',
        nickname: '用户' + Math.random().toString(36).substr(2, 6),
        phone: '',
        farm_id: 'default',
        invite_code: inviteCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const addResult = await db.collection('users').add(newUser);
      newUser._id = addResult.id;
      userInfo = newUser;
      
      // 检查是否有邀请人，如果有则发放邀请奖励
      if (event.invite_code) {
        await processInvite(db, event.invite_code, openid);
      }
      
      // 为新用户发放新用户券
      await发放新用户优惠券(db, userInfo._id, userInfo.farm_id);
    }
    
    // 生成token
    const token = generateToken(openid);
    
    return {
      code: 0,
      message: '登录成功',
      token: token,
      userInfo: {
        _id: userInfo._id,
        openid: userInfo.openid,
        role: userInfo.role,
        nickname: userInfo.nickname,
        phone: userInfo.phone,
        farm_id: userInfo.farm_id,
        invite_code: userInfo.invite_code
      }
    };
  } catch (error) {
    console.error('登录失败:', error);
    return {
      code: -1,
      message: '服务器错误'
    };
  }
};

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateToken(openid) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2);
  return `${openid}_${timestamp}_${random}`;
}

async function processInvite(db, inviteCode, inviteeOpenid) {
  try {
    const inviterResult = await db.collection('users').where({
      invite_code: inviteCode
    }).get();
    
    if (inviterResult.data && inviterResult.data.length > 0) {
      const inviter = inviterResult.data[0];
      
      // 创建邀请关系记录
      await db.collection('invites').add({
        farm_id: inviter.farm_id,
        inviter_id: inviter._id,
        inviter_name: inviter.nickname,
        invitee_id: inviteeOpenid,
        invitee_name: '新用户',
        reward_status: 'pending',
        created_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('处理邀请关系失败:', error);
  }
}

async function 发放新用户优惠券(db, userId, farmId) {
  try {
    await db.collection('coupons').add({
      farm_id: farmId,
      type: 'new_user',
      name: '新用户专享券',
      amount: 10,
      min_purchase: 50,
      valid_days: 30,
      user_id: userId,
      status: 'unused',
      created_at: new Date().toISOString(),
      expired_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('发放新用户券失败:', error);
  }
}
