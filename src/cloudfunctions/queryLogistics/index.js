'use strict';

exports.main = async (event, context) => {
  const { orderId } = event;
  
  try {
    // 获取订单信息
    const db = uniCloud.database();
    const orderResult = await db.collection('orders').doc(orderId).get();
    
    if (!orderResult.data) {
      return {
        code: -1,
        message: '订单不存在'
      };
    }
    
    const order = orderResult.data;
    
    if (!order.tracking_no || !order.shipping_company) {
      return {
        code: 0,
        data: {
          shipping_company: order.shipping_company || '',
          tracking_no: order.tracking_no || '',
          status: '待发货',
          tracking_history: []
        }
      };
    }
    
    // 调用快递100 API查询物流
    // 注意：实际使用时需要配置快递100的API密钥
    const kuaidi100Result = await queryKuaidi100(order.shipping_company, order.tracking_no);
    
    return {
      code: 0,
      data: kuaidi100Result
    };
  } catch (error) {
    console.error('查询物流失败:', error);
    return {
      code: -1,
      message: '查询失败'
    };
  }
};

async function queryKuaidi100(company, trackingNo) {
  // 这里需要配置快递100的API
  // 实际使用时需要向快递100申请API密钥
  
  // 临时返回模拟数据
  const mockData = {
    shipping_company: company,
    tracking_no: trackingNo,
    status: '运输中',
    tracking_history: [
      {
        time: new Date().toISOString(),
        status: '运输中',
        description: '快件已到达【目的地】'
      },
      {
        time: new Date(Date.now() - 86400000).toISOString(),
        status: '运输中',
        description: '快件正在运输中'
      },
      {
        time: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: '揽收',
        description: '快件已揽收'
      },
      {
        time: new Date(Date.now() - 86400000 * 3).toISOString(),
        status: '已发货',
        description: '商家已发货'
      }
    ]
  };
  
  return mockData;
}
