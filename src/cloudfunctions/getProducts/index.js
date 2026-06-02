'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const { keyword, status, all } = event;
  
  try {
    let query = {};
    
    if (!all) {
      query.status = status || 'active';
    }
    
    if (keyword) {
      query.name = new RegExp(keyword, 'i');
    }
    
    const result = await db.collection('products')
      .where(query)
      .orderBy('created_at', 'desc')
      .get();
    
    return {
      code: 0,
      data: result.data
    };
  } catch (error) {
    console.error('获取商品列表失败:', error);
    return {
      code: -1,
      message: '服务器错误'
    };
  }
};
