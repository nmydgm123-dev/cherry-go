<template>
  <view class="container">
    <!-- 订单状态 -->
    <view class="order-status-card">
      <text class="status-icon">{{ getStatusIcon(order.status) }}</text>
      <text class="status-text">{{ getStatusText(order.status) }}</text>
    </view>

    <!-- 收货信息 -->
    <view class="info-card">
      <view class="info-header">
        <text class="info-title">收货信息</text>
      </view>
      <view class="receiver-info">
        <view class="receiver-row">
          <text class="receiver-name">{{ order.receiver_name }}</text>
          <text class="receiver-phone">{{ order.receiver_phone }}</text>
        </view>
        <text class="receiver-address">{{ order.province }} {{ order.city }} {{ order.district }} {{ order.address }}</text>
      </view>
    </view>

    <!-- 商品信息 -->
    <view class="info-card">
      <view class="info-header">
        <text class="info-title">商品信息</text>
        <text class="order-no">订单号：{{ order.order_no }}</text>
      </view>
      <view 
        v-for="(product, index) in order.products" 
        :key="index"
        class="product-item"
      >
        <view class="product-info">
          <text class="product-name">{{ product.product_name }}</text>
          <text class="product-spec">{{ product.spec_name }}</text>
        </view>
        <view class="product-price">
          <text class="price">¥{{ product.unit_price }}</text>
          <text class="qty">x{{ product.quantity }}</text>
        </view>
      </view>
    </view>

    <!-- 费用明细 -->
    <view class="info-card">
      <view class="info-header">
        <text class="info-title">费用明细</text>
      </view>
      <view class="fee-row">
        <text class="fee-label">商品小计</text>
        <text class="fee-value">¥{{ order.subtotal.toFixed(2) }}</text>
      </view>
      <view class="fee-row">
        <text class="fee-label">运费</text>
        <text class="fee-value">{{ order.shipping_fee > 0 ? '¥' + order.shipping_fee.toFixed(2) : '包邮' }}</text>
      </view>
      <view class="fee-row" v-if="order.discount > 0">
        <text class="fee-label">优惠</text>
        <text class="fee-value text-primary">-¥{{ order.discount.toFixed(2) }}</text>
      </view>
      <view class="fee-total">
        <text>实付款</text>
        <text class="total-price">¥{{ order.total.toFixed(2) }}</text>
      </view>
    </view>

    <!-- 物流信息 -->
    <view class="info-card" v-if="order.status !== 'pending'">
      <view class="info-header">
        <text class="info-title">物流信息</text>
      </view>
      <view class="logistics-info">
        <view class="logistics-row">
          <text class="logistics-label">物流公司</text>
          <text class="logistics-value">{{ order.shipping_company || '待填写' }}</text>
        </view>
        <view class="logistics-row">
          <text class="logistics-label">运单号</text>
          <text class="logistics-value">{{ order.tracking_no || '待填写' }}</text>
        </view>
        <view class="logistics-row" v-if="order.shipped_at">
          <text class="logistics-label">发货时间</text>
          <text class="logistics-value">{{ formatTime(order.shipped_at) }}</text>
        </view>
      </view>
      <view class="logistics-track" @click="goToLogistics">
        <text>查看物流详情</text>
        <text class="track-arrow">></text>
      </view>
    </view>

    <!-- 发货照片 -->
    <view class="info-card" v-if="order.photo_fruit || order.photo_order">
      <view class="info-header">
        <text class="info-title">发货照片</text>
      </view>
      <view class="photo-grid">
        <view v-if="order.photo_fruit" class="photo-item">
          <image :src="order.photo_fruit" mode="aspectFill" @click="previewImage(order.photo_fruit)" />
          <text class="photo-label">水果照片</text>
        </view>
        <view v-if="order.photo_order" class="photo-item">
          <image :src="order.photo_order" mode="aspectFill" @click="previewImage(order.photo_order)" />
          <text class="photo-label">订单截图</text>
        </view>
      </view>
    </view>

    <!-- 其他信息 -->
    <view class="info-card">
      <view class="info-header">
        <text class="info-title">其他信息</text>
      </view>
      <view class="other-info">
        <view class="other-row">
          <text class="other-label">填写人</text>
          <text class="other-value">{{ order.writer_name }}</text>
        </view>
        <view class="other-row">
          <text class="other-label">下单时间</text>
          <text class="other-value">{{ formatTime(order.created_at) }}</text>
        </view>
        <view class="other-row" v-if="order.remarks">
          <text class="other-label">备注</text>
          <text class="other-value">{{ order.remarks }}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar" v-if="canShip && order.status === 'pending'">
      <view class="action-btn" @click="goToShip">
        <text>去发货</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { Order } from '@/types'

const userStore = useUserStore()

const order = ref<Order>({
  _id: '',
  order_no: '',
  farm_id: '',
  writer_id: '',
  writer_name: '',
  receiver_name: '',
  receiver_phone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  products: [],
  subtotal: 0,
  shipping_fee: 0,
  discount: 0,
  total: 0,
  status: 'pending',
  tracking_history: [],
  remarks: '',
  created_at: '',
  updated_at: ''
})

const canShip = computed(() => userStore.isOwner || userStore.isShipper)

onLoad((options) => {
  if (options?.id) {
    loadOrder(options.id)
  }
})

async function loadOrder(orderId: string) {
  try {
    const result = await uniCloud.callFunction({
      name: 'getOrder',
      data: { orderId }
    })
    
    if (result.result.code === 0) {
      order.value = result.result.data
    }
  } catch (error) {
    console.error('加载订单失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

function getStatusIcon(status: string): string {
  const iconMap: Record<string, string> = {
    pending: '📦',
    shipped: '🚚',
    delivered: '📬',
    completed: '✅'
  }
  return iconMap[status] || '📦'
}

function getStatusText(status: string): string {
  const textMap: Record<string, string> = {
    pending: '待发货',
    shipped: '已发货',
    delivered: '已收货',
    completed: '已完成'
  }
  return textMap[status] || status
}

function formatTime(time: string): string {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function previewImage(url: string) {
  uni.previewImage({
    urls: [url]
  })
}

function goToLogistics() {
  uni.navigateTo({
    url: `/pages/orders/logistics?id=${order.value._id}`
  })
}

function goToShip() {
  uni.navigateTo({
    url: `/pages/orders/ship?id=${order.value._id}`
  })
}
</script>

<style lang="scss" scoped>
.order-status-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, $primary-color 0%, darken($primary-color, 10%) 100%);
  padding: $spacing-xl;
  border-radius: $border-radius-lg;
  margin-bottom: $spacing-base;
  
  .status-icon {
    font-size: 32px;
    margin-right: $spacing-base;
  }
  
  .status-text {
    font-size: $font-size-xl;
    font-weight: 600;
    color: #fff;
  }
}

.info-card {
  background: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;
  
  .info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-base;
    padding-bottom: $spacing-base;
    border-bottom: 1px solid $border-color;
    
    .info-title {
      font-size: $font-size-base;
      font-weight: 600;
      color: $text-primary;
    }
    
    .order-no {
      font-size: $font-size-xs;
      color: $text-light;
    }
  }
}

.receiver-info {
  .receiver-row {
    display: flex;
    align-items: center;
    margin-bottom: $spacing-sm;
    
    .receiver-name {
      font-size: $font-size-base;
      font-weight: 600;
      color: $text-primary;
      margin-right: $spacing-base;
    }
    
    .receiver-phone {
      font-size: $font-size-sm;
      color: $text-secondary;
    }
  }
  
  .receiver-address {
    font-size: $font-size-sm;
    color: $text-secondary;
    line-height: 1.5;
  }
}

.product-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-base 0;
  
  &:not(:last-child) {
    border-bottom: 1px solid $border-color;
  }
  
  .product-info {
    flex: 1;
    
    .product-name {
      display: block;
      font-size: $font-size-sm;
      color: $text-primary;
      margin-bottom: $spacing-xs;
    }
    
    .product-spec {
      font-size: $font-size-xs;
      color: $text-light;
    }
  }
  
  .product-price {
    text-align: right;
    
    .price {
      display: block;
      font-size: $font-size-sm;
      color: $text-primary;
      margin-bottom: $spacing-xs;
    }
    
    .qty {
      font-size: $font-size-xs;
      color: $text-light;
    }
  }
}

.fee-row {
  display: flex;
  justify-content: space-between;
  padding: $spacing-sm 0;
  
  .fee-label {
    font-size: $font-size-sm;
    color: $text-secondary;
  }
  
  .fee-value {
    font-size: $font-size-sm;
    color: $text-primary;
  }
}

.fee-total {
  display: flex;
  justify-content: space-between;
  padding-top: $spacing-base;
  border-top: 1px solid $border-color;
  margin-top: $spacing-base;
  font-size: $font-size-base;
  font-weight: 600;
  
  .total-price {
    color: $primary-color;
    font-size: $font-size-lg;
  }
}

.logistics-info {
  .logistics-row {
    display: flex;
    justify-content: space-between;
    padding: $spacing-sm 0;
    
    .logistics-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }
    
    .logistics-value {
      font-size: $font-size-sm;
      color: $text-primary;
    }
  }
}

.logistics-track {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-base 0;
  margin-top: $spacing-base;
  border-top: 1px solid $border-color;
  font-size: $font-size-sm;
  color: $primary-color;
  
  .track-arrow {
    color: $text-light;
  }
}

.photo-grid {
  display: flex;
  gap: $spacing-base;
  
  .photo-item {
    flex: 1;
    
    image {
      width: 100%;
      height: 150px;
      border-radius: $border-radius-base;
    }
    
    .photo-label {
      display: block;
      text-align: center;
      font-size: $font-size-xs;
      color: $text-light;
      margin-top: $spacing-sm;
    }
  }
}

.other-info {
  .other-row {
    display: flex;
    justify-content: space-between;
    padding: $spacing-sm 0;
    
    &:not(:last-child) {
      border-bottom: 1px solid $border-color;
    }
    
    .other-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }
    
    .other-value {
      font-size: $font-size-sm;
      color: $text-primary;
      max-width: 60%;
      text-align: right;
    }
  }
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: flex-end;
  padding: $spacing-base $spacing-lg;
  background: $bg-white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  
  .action-btn {
    background: linear-gradient(135deg, $primary-color 0%, darken($primary-color, 10%) 100%);
    color: #fff;
    padding: $spacing-base $spacing-xxl;
    border-radius: $border-radius-xl;
    font-size: $font-size-base;
    font-weight: 600;
  }
}
</style>
