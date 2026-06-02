/**
 * 商品服务层
 */
import { get, post } from '@/utils/request'

export const productService = {
  /**
   * 获取商品列表
   */
  async getProducts(keyword?: string, status?: string) {
    return get('getProducts', { keyword, status })
  },
  
  /**
   * 获取商品详情
   */
  async getProduct(productId: string) {
    return get('getProduct', { productId })
  },
  
  /**
   * 保存商品（创建或更新）
   */
  async saveProduct(productData: any) {
    return post('saveProduct', productData)
  },
  
  /**
   * 删除商品
   */
  async deleteProduct(productId: string) {
    return post('deleteProduct', { productId })
  }
}

export default productService
