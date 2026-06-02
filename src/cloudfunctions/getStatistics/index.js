'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const cloud = uniCloudCloud;
  
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
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
    
    if (user.role !== 'owner') {
      return {
        code: -1,
        message: '没有查看统计的权限'
      };
    }
    
    // 获取统计数据
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    // 统计订单数量
    const ordersResult = await db.collection('orders').where({
      farm_id: user.farm_id
    }).count();
    
    // 待发货订单
    const pendingResult = await db.collection('orders').where({
      farm_id: user.farm_id,
      status: 'pending'
    }).count();
    
    // 已发货订单
    const shippedResult = await db.collection('orders').where({
      farm_id: user.farm_id,
      status: 'shipped'
    }).count();
    
    // 今日发货
    const todayShippedResult = await db.collection('orders').where({
      farm_id: user.farm_id,
      status: 'shipped',
      shipped_at: db.command.gte(todayStart)
    }).count();
    
    // 汇总各规格销量
    const allOrders = await db.collection('orders').where({
      farm_id: user.farm_id
    }).field({
      products: true,
      status: true
    }).get();
    
    const specSummary = {};
    let totalRevenue = 0;
    
    allOrders.data.forEach(order => {
      if (order.status === 'shipped' || order.status === 'delivered' || order.status === 'completed') {
        totalRevenue += order.total || 0;
      }
      
      order.products.forEach(product => {
        const key = `${product.product_name}-${product.spec_name}`;
        if (!specSummary[key]) {
          specSummary[key] = {
            name: key,
            totalQuantity: 0,
            totalAmount: 0
          };
        }
        specSummary[key].totalQuantity += product.quantity;
        specSummary[key].totalAmount += product.subtotal;
      });
    });
    
    // 转换为数组并排序
    const specSummaryList = Object.values(specSummary).sort((a, b) => b.totalQuantity - a.totalQuantity);
    
    return {
      code: 0,
      data: {
        total_orders: ordersResult.total,
        pending_orders: pendingResult.total,
        shipped_orders: shippedResult.total,
        today_shipped: todayShippedResult.total,
        total_revenue: totalRevenue,
        spec_summary: specSummaryList.slice(0, 10)
      }
    };
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return {
      code: -1,
      message: '服务器错误'
    };
  }
};
