'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const cloud = uniCloudCloud;
  
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  const { productId, name, description, maturity_cycle, image, specifications } = event;
  
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
        message: '没有管理商品的权限'
      };
    }
    
    // 验证必填字段
    if (!name) {
      return {
        code: -1,
        message: '商品名称不能为空'
      };
    }
    
    const productData = {
      name: name,
      description: description || '',
      maturity_cycle: maturity_cycle || 1,
      image: image || '',
      specifications: specifications || [],
      status: 'active',
      updated_at: new Date().toISOString()
    };
    
    let result;
    
    if (productId) {
      // 更新商品
      result = await db.collection('products').doc(productId).update(productData);
    } else {
      // 创建商品
      productData.farm_id = user.farm_id;
      productData.created_at = new Date().toISOString();
      result = await db.collection('products').add(productData);
      productData._id = result.id;
    }
    
    return {
      code: 0,
      message: '保存成功',
      data: productData
    };
  } catch (error) {
    console.error('保存商品失败:', error);
    return {
      code: -1,
      message: '服务器错误'
    };
  }
};
