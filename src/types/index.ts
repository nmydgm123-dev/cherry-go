// 用户类型定义
export interface UserInfo {
  _id: string
  openid: string
  role: 'owner' | 'writer' | 'shipper' | 'browser'
  nickname: string
  phone: string
  farm_id: string
  invite_code: string
  created_at: string
  updated_at: string
}

// 产品类型定义
export interface Specification {
  _id: string
  name: string // 规格名称（大果、中果、小果）
  weight: string // 重量（2斤、5斤）
  price: number
  stock: number
}

export interface Product {
  _id: string
  farm_id: string
  name: string
  image: string
  maturity_cycle: number // 熟制周期
  description: string
  status: 'active' | 'inactive'
  specifications: Specification[]
  created_at: string
  updated_at: string
}

// 订单类型定义
export interface OrderProduct {
  product_id: string
  product_name: string
  spec_name: string
  spec_id: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface TrackingEvent {
  time: string
  status: string
  description: string
}

export interface Order {
  _id: string
  order_no: string
  farm_id: string
  writer_id: string
  writer_name: string
  
  // 收货信息
  receiver_name: string
  receiver_phone: string
  province: string
  city: string
  district: string
  address: string
  
  // 商品信息
  products: OrderProduct[]
  
  // 费用信息
  subtotal: number
  shipping_fee: number
  discount: number
  coupon_id?: string
  total: number
  
  // 状态和物流
  status: 'pending' | 'shipped' | 'delivered' | 'completed'
  shipping_company?: string
  tracking_no?: string
  
  // 发货信息
  photo_fruit?: string
  photo_order?: string
  shipped_at?: string
  delivered_at?: string
  
  // 物流轨迹
  tracking_history: TrackingEvent[]
  
  remarks: string
  created_at: string
  updated_at: string
}

// 邮费规则类型定义
export interface ShippingRule {
  _id: string
  farm_id: string
  province: string
  city: string
  specification_id: string
  base_fee: number
  extra_fee_per_kg: number
  free_shipping_threshold: number
  is_free: boolean
  priority: number
  created_at: string
}

// 优惠券类型定义
export interface Coupon {
  _id: string
  farm_id: string
  type: 'new_user' | 'review' | 'invite'
  name: string
  amount: number
  min_purchase: number
  valid_days: number
  user_id: string
  status: 'unused' | 'used' | 'expired'
  used_order_id?: string
  created_at: string
  used_at?: string
  expired_at: string
}

// 统计数据类型定义
export interface Statistics {
  total_orders: number
  total_revenue: number
  pending_orders: number
  shipped_orders: number
  delivered_orders: number
  products_sales: Record<string, number>
  specifications_sales: Record<string, number>
}
