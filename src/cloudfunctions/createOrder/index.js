'use strict';

exports.main = async (event, context) => {
  const db = uniCloud.database();
  const cloud = uniCloudCloud;
  
  // 获取用户信息
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  
  if (!openid) {
    return {
      code: -1,
      message: '用户未登录'
    };
  }
  
  try {
    // 验证用户权限
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
    
    // 只有果园所有者和填写人可以创建订单
    if (user.role !== 'owner' && user.role !== 'writer') {
      return {
        code: -1,
        message: '没有创建订单的权限'
      };
    }
    
    const { product_id, spec_id, quantity, receiver_name, receiver_phone, province, city, district, address, remarks, coupon_id } = event;
    
    // 验证必填字段
    if (!product_id || !spec_id || !quantity || !receiver_name || !receiver_phone || !province || !city || !district || !address) {
      return {
        code: -1,
        message: '缺少必填字段'
      };
    }
    
    // 获取商品信息
    const productResult = await db.collection('products').doc(product_id).get();
    if (!productResult.data) {
      return {
        code: -1,
        message: '商品不存在'
      };
    }
    
    const product = productResult.data;
    const specification = product.specifications.find(s => s._id === spec_id);
    if (!specification) {
      return {
        code: -1,
        message: '规格不存在'
      };
    }
    
    // 计算商品小计
    const subtotal = specification.price * quantity;
    
    // 计算运费
    let shipping_fee = 0;
    const shippingResult = await db.collection('shipping_rules').where({
      farm_id: user.farm_id,
      province: province,
      specification_id: { $in: ['', spec_id] }
    }).orderBy('priority', 'desc').limit(1).get();
    
    if (shippingResult.data && shippingResult.data.length > 0) {
      const rule = shippingResult.data[0];
      if (rule.is_free) {
        shipping_fee = 0;
      } else {
        shipping_fee = rule.base_fee;
        // 检查是否满足包邮条件
        if (rule.free_shipping_threshold > 0 && quantity >= rule.free_shipping_threshold) {
          shipping_fee = 0;
        }
      }
    } else {
      // 使用默认运费
      shipping_fee = 10;
    }
    
    // 应用优惠券
    let discount = 0;
    if (coupon_id) {
      const couponResult = await db.collection('coupons').where({
        _id: coupon_id,
        user_id: user._id,
        status: 'unused'
      }).get();
      
      if (couponResult.data && couponResult.data.length > 0) {
        const coupon = couponResult.data[0];
        if (subtotal >= coupon.min_purchase) {
          discount = coupon.amount;
        }
      }
    }
    
    // 计算总价
    const total = subtotal + shipping_fee - discount;
    
    // 生成订单号
    const order_no = generateOrderNo();
    
    // 创建订单
    const order = {
      order_no: order_no,
      farm_id: user.farm_id,
      writer_id: user._id,
      writer_name: user.nickname,
      receiver_name: receiver_name,
      receiver_phone: receiver_phone,
      province: province,
      city: city,
      district: district,
      address: address,
      products: [{
        product_id: product._id,
        product_name: product.name,
        spec_name: specification.name,
        spec_id: specification._id,
        quantity: quantity,
        unit_price: specification.price,
        subtotal: subtotal
      }],
      subtotal: subtotal,
      shipping_fee: shipping_fee,
      discount: discount,
      coupon_id: coupon_id || null,
      total: total,
      status: 'pending',
      tracking_history: [],
      remarks: remarks || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const addResult = await db.collection('orders').add(order);
    order._id = addResult.id;
    
    // 更新优惠券状态
    if (coupon_id) {
      await db.collection('coupons').doc(coupon_id).update({
        status: 'used',
        used_order_id: addResult.id,
        used_at: new Date().toISOString()
      });
    }
    
    // 处理邀请关系
    await processInviteForFirstOrder(db, openid, user.farm_id);
    
    // 发送订阅消息通知发货人
    await sendShipmentNotification(db, user.farm_id, order);
    
    return {
      code: 0,
      message: '订单创建成功',
      data: order
    };
  } catch (error) {
    console.error('创建订单失败:', error);
    return {
      code: -1,
      message: '服务器错误'
    };
  }
};

function generateOrderNo() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `CG${year}${month}${day}${random}`;
}

async function processInviteForFirstOrder(db, openid, farmId) {
  try {
    const inviteResult = await db.collection('invites').where({
      invitee_id: openid,
      farm_id: farmId,
      reward_status: 'pending'
    }).get();
    
    if (inviteResult.data && inviteResult.data.length > 0) {
      const invite = inviteResult.data[0];
      
      // 获取邀请奖励规则
      const farmResult = await db.collection('farms').where({
        _id: farmId
      }).get();
      
      let rewardAmount = 10; // 默认奖励
      if (farmResult.data && farmResult.data[0]?.settings?.invite_reward_rules) {
        const rules = farmResult.data[0].settings.invite_reward_rules;
        // 统计已发放的邀请奖励数量
        const countResult = await db.collection('invites').where({
          inviter_id: invite.inviter_id,
          reward_status: 'granted'
        }).count();
        
        const count = countResult.total || 0;
        const rule = rules.find(r => r.count === count + 1);
        rewardAmount = rule ? rule.amount : (rules[rules.length - 1]?.amount || 10);
      }
      
      // 创建奖励优惠券
      const coupon = {
        farm_id: farmId,
        type: 'invite',
        name: '邀请好友奖励',
        amount: rewardAmount,
        min_purchase: 30,
        valid_days: 30,
        user_id: invite.inviter_id,
        status: 'unused',
        created_at: new Date().toISOString(),
        expired_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const couponResult = await db.collection('coupons').add(coupon);
      
      // 更新邀请关系状态
      await db.collection('invites').doc(invite._id).update({
        invitee_order_id: 'completed',
        reward_coupon_id: couponResult.id,
        reward_status: 'granted'
      });
    }
  } catch (error) {
    console.error('处理邀请奖励失败:', error);
  }
}

async function sendShipmentNotification(db, farmId, order) {
  try {
    // 获取所有发货人
    const shippers = await db.collection('users').where({
      farm_id: farmId,
      role: 'shipper'
    }).get();
    
    // TODO: 实际发送订阅消息
    // 这里简化处理，实际应该调用微信订阅消息接口
    console.log('通知发货人有新订单:', order.order_no, shippers.data);
  } catch (error) {
    console.error('发送通知失败:', error);
  }
}
