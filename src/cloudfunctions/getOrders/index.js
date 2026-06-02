'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const cloud = uniCloudCloud;
  
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const { status, page = 1, pageSize = 20 } = event;
  
  try {
    if (!openid) {
      return {
        code: -1,
        message: '用户未登录'
      };
    }
    
    // 获取用户信息
    const userResult = await db.collection('users').where({
      openid: openid
    }).get();
    
    if (!userResult.data || userResult.data.length === 0) {
      return {
        code: -1,
        message: '用户不存在'
      };
    }
    
    const user = userResult.data[0];
    
    let query = { farm_id: user.farm_id };
    
    // 根据角色筛选订单
    if (user.role === 'writer') {
      query.writer_id = user._id;
    } else if (user.role !== 'owner' && user.role !== 'shipper') {
      // 普通用户只能看自己的订单
      query.$or = [
        { writer_id: user._id },
        { receiver_phone: db.command.regexp(`^${user.phone}`) }
      ];
    }
    
    // 根据状态筛选
    if (status) {
      query.status = status;
    }
    
    const result = await db.collection('orders')
      .where(query)
      .orderBy('created_at', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get();
    
    return {
      code: 0,
      data: result.data,
      total: result.affectedDocs
    };
  } catch (error) {
    console.error('获取订单列表失败:', error);
    return {
      code: -1,
      message: '服务器错误'
    };
  }
};
