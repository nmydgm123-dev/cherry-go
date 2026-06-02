/**
 * 物流服务层
 */
import { get } from '@/utils/request'

export const logisticsService = {
  /**
   * 查询物流
   */
  async queryLogistics(orderId: string) {
    return get('queryLogistics', { orderId })
  },
  
  /**
   * 订阅物流通知
   */
  async subscribeLogistics(orderId: string) {
    return get('subscribeLogistics', { orderId })
  }
}

export default logisticsService
