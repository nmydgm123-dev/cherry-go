'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const cloud = uniCloudCloud;
  
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const { type, keyword } = event;
  
  try {
    if (!keyword || keyword.length < 4) {
      return {
        code: -1,
        message: '查询信息太短'
      };
    }
    
    let query = {};
    
    if (type === 'order') {
      query.order_no = keyword;
    } else if (type === 'phone') {
      query.receiver_phone = db.command.regexp(keyword + '$');
    }
    
    const result = await db.collection('orders').where(query).get();
    
    if (result.data && result.data.length > 0) {
      return {
        code: 0,
        data: result.data[0]
      };
    }
    
    return {
      code: -1,
      message: '未找到订单'
    };
  } catch (error) {
    console.error('搜索订单失败:', error);
    return {
      code: -1,
      message: '服务器错误'
    };
  }
};
