'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const cloud = uniCloudCloud;
  
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const { orderId } = event;
  
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
    
    // 获取订单
    const orderResult = await db.collection('orders').doc(orderId).get();
    
    if (!orderResult.data) {
      return {
        code: -1,
        message: '订单不存在'
      };
    }
    
    const order = orderResult.data;
    
    // 验证权限
    if (user.role !== 'owner' && user.role !== 'shipper') {
      if (order.writer_id !== user._id) {
        // 检查是否是通过手机号查询的
        if (!order.receiver_phone.startsWith(user.phone.substring(0, 4))) {
          return {
            code: -1,
            message: '没有查看此订单的权限'
          };
        }
      }
    }
    
    return {
      code: 0,
      data: order
    };
  } catch (error) {
    console.error('获取订单详情失败:', error);
    return {
      code: -1,
      message: '服务器错误'
    };
  }
};
