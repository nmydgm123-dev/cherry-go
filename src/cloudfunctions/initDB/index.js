'use strict'

/**
 * 数据库初始化云函数
 * 一键初始化所有必要的测试数据
 */

exports.main = async (event, context) => {
  const db = uniCloud.database()
  
  try {
    const result = {
      success: true,
      message: '数据库初始化成功',
      data: {}
    }
    
    // 1. 初始化农场配置
    console.log('正在初始化农场配置...')
    const farmResult = await db.collection('farms').add({
      name: '我的果园',
      owner_id: 'admin',
      contact_phone: '13800138000',
      address: '示例果园地址',
      settings: {
        free_shipping_enabled: true,
        free_shipping_threshold: 5,
        max_coupons_per_order: 1,
        invite_reward_rules: [
          { count: 1, amount: 5 },
          { count: 2, amount: 8 },
          { count: 3, amount: 10 },
          { count: 4, amount: 12 }
        ]
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    result.data.farmId = farmResult.id
    console.log('农场配置创建成功:', farmResult.id)
    
    // 2. 初始化测试商品
    console.log('正在初始化测试商品...')
    const product1Result = await db.collection('products').add({
      farm_id: 'default',
      name: '新鲜车厘子',
      image: 'https://via.placeholder.com/300/e74c3c/ffffff?text=Cherry',
      maturity_cycle: 1,
      description: '产地直供，新鲜采摘，甜脆可口，色泽红润',
      status: 'active',
      specifications: [
        {
          _id: 'cherry_spec1',
          name: '大果',
          weight: '2斤装',
          price: 88,
          stock: 100
        },
        {
          _id: 'cherry_spec2',
          name: '大果',
          weight: '5斤装',
          price: 198,
          stock: 50
        },
        {
          _id: 'cherry_spec3',
          name: '中果',
          weight: '2斤装',
          price: 68,
          stock: 80
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    result.data.product1Id = product1Result.id
    
    const product2Result = await db.collection('products').add({
      farm_id: 'default',
      name: '白枇杷',
      image: 'https://via.placeholder.com/300/f39c12/ffffff?text=Loquat',
      maturity_cycle: 2,
      description: '当季新鲜枇杷，肉质细嫩，香甜多汁',
      status: 'active',
      specifications: [
        {
          _id: 'loquat_spec1',
          name: '精品装',
          weight: '3斤装',
          price: 58,
          stock: 60
        },
        {
          _id: 'loquat_spec2',
          name: '精品装',
          weight: '5斤装',
          price: 88,
          stock: 40
        }
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    result.data.product2Id = product2Result.id
    console.log('测试商品创建成功')
    
    // 3. 初始化邮费规则
    console.log('正在初始化邮费规则...')
    const shippingRuleResult = await db.collection('shipping_rules').add({
      farm_id: 'default',
      province: '',
      city: '',
      specification_id: '',
      base_fee: 10,
      extra_fee_per_kg: 0,
      free_shipping_threshold: 5,
      is_free: false,
      priority: 1,
      created_at: new Date().toISOString()
    })
    result.data.shippingRuleId = shippingRuleResult.id
    console.log('邮费规则创建成功')
    
    // 4. 初始化一些优惠券
    console.log('正在初始化优惠券...')
    const couponResult = await db.collection('coupons').add({
      farm_id: 'default',
      type: 'new_user',
      name: '新用户专享券',
      amount: 10,
      min_purchase: 50,
      valid_days: 30,
      user_id: '',
      status: 'unused',
      created_at: new Date().toISOString(),
      expired_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    result.data.couponId = couponResult.id
    console.log('优惠券创建成功')
    
    console.log('✅ 数据库初始化全部完成！')
    
    return result
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error)
    return {
      success: false,
      message: '初始化失败: ' + error.message,
      error: error
    }
  }
}
