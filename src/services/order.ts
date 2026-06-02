/**
 * 订单服务层
 */
import { get, post } from '@/utils/request'

export const orderService = {
  /**
   * 创建订单
   */
  async createOrder(orderData: any) {
    return post('createOrder', orderData)
  },
  
  /**
   * 获取订单列表
   */
  async getOrders(status?: string, page?: number, pageSize?: number) {
    return get('getOrders', { status, page, pageSize })
  },
  
  /**
   * 获取订单详情
   */
  async getOrder(orderId: string) {
    return get('getOrder', { orderId })
  },
  
  /**
   * 发货
   */
  async shipOrder(shipData: any) {
    return post('shipOrder', shipData)
  },
  
  /**
   * 搜索订单
   */
  async searchOrder(type: string, keyword: string) {
    return get('searchOrder', { type, keyword })
  },
  
  /**
   * 查询物流
   */
  async queryLogistics(orderId: string) {
    return get('queryLogistics', { orderId })
  },
  
  /**
   * 获取统计数据
   */
  async getStatistics() {
    return get('getStatistics')
  }
}

export default orderService
