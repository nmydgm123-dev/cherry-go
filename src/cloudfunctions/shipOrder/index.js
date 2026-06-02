'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const cloud = uniCloudCloud;
  
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const { orderId, photo_fruit, photo_order, shipping_company, tracking_no } = event;
  
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
    
    // 验证权限
    if (user.role !== 'owner' && user.role !== 'shipper') {
      return {
        code: -1,
        message: '没有发货权限'
      };
    }
    
    // 获取订单
    const orderResult = await db.collection('orders').doc(orderId).get();
    
    if (!orderResult.data) {
      return {
        code: -1,
        message: '订单不存在'
      };
    }
    
    const order = orderResult.data;
    
    if (order.status !== 'pending') {
      return {
        code: -1,
        message: '订单状态不允许发货'
      };
    }
    
    // 验证必填字段
    if (!photo_fruit || !photo_order || !shipping_company || !tracking_no) {
      return {
        code: -1,
        message: '缺少必填字段'
      };
    }
    
    // 更新订单
    const updateData = {
      photo_fruit: photo_fruit,
      photo_order: photo_order,
      shipping_company: shipping_company,
      tracking_no: tracking_no,
      status: 'shipped',
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tracking_history: [{
        time: new Date().toISOString(),
        status: '已发货',
        description: `商家已发货，由${shipping_company}承运，单号：${tracking_no}`
      }]
    };
    
    await db.collection('orders').doc(orderId).update(updateData);
    
    // 发送订阅消息通知买家
    await sendDeliveryNotification(order);
    
    return {
      code: 0,
      message: '发货成功'
    };
  } catch (error) {
    console.error('发货失败:', error);
    return {
      code: -1,
      message: '服务器错误'
    };
  }
};

async function sendDeliveryNotification(order) {
  try {
    // TODO: 调用微信订阅消息接口发送发货通知
    console.log('发送发货通知:', order.order_no);
  } catch (error) {
    console.error('发送通知失败:', error);
  }
}
