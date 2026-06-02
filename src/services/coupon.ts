/**
 * 优惠券服务层
 */
import { get, post } from '@/utils/request'

export const couponService = {
  /**
   * 获取优惠券列表
   */
  async getCoupons(status?: string) {
    return get('getCoupons', { status })
  },
  
  /**
   * 领取优惠券
   */
  async claimCoupon(couponId: string) {
    return post('claimCoupon', { couponId })
  },
  
  /**
   * 使用优惠券
   */
  async useCoupon(couponId: string, orderId: string) {
    return post('useCoupon', { couponId, orderId })
  }
}

export default couponService
