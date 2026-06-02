<template>
  <view class="container">
    <!-- 顶部统计卡片 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-number">{{ pendingCount }}</text>
        <text class="stat-label">待发货</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{ todayShipped }}</text>
        <text class="stat-label">今日发货</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-number">{{ totalOrders }}</text>
        <text class="stat-label">总订单</text>
      </view>
    </view>

    <!-- 规格汇总 -->
    <view class="section" v-if="specSummary.length > 0">
      <view class="section-title">规格汇总</view>
      <view class="summary-list">
        <view 
          v-for="(item, index) in specSummary" 
          :key="index"
          class="summary-item"
        >
          <text class="summary-name">{{ item.name }}</text>
          <text class="summary-count">{{ item.totalQuantity }}件</text>
        </view>
      </view>
    </view>

    <!-- 状态筛选 -->
    <view class="filter-tabs">
      <view 
        v-for="tab in tabs" 
        :key="tab.key"
        :class="['tab-item', { active: currentTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- 订单列表 -->
    <view class="orders-list" v-if="orders.length > 0">
      <view 
        v-for="order in orders" 
        :key="order._id"
        class="order-card"
        @click="goToOrderDetail(order._id)"
      >
        <view class="order-header">
          <text class="order-no">订单号：{{ order.order_no }}</text>
          <text :class="['order-status', `status-${order.status}`]">
            {{ getStatusText(order.status) }}
          </text>
        </view>
        
        <view class="order-products">
          <view 
            v-for="(product, pIndex) in order.products" 
            :key="pIndex"
            class="product-item"
          >
            <text class="product-name">{{ product.product_name }}</text>
            <text class="product-spec">{{ product.spec_name }}</text>
            <text class="product-qty">x{{ product.quantity }}</text>
          </view>
        </view>
        
        <view class="order-footer">
          <view class="order-info">
            <text class="receiver">{{ order.receiver_name }}</text>
            <text class="phone">{{ formatPhone(order.receiver_phone) }}</text>
          </view>
          <text class="order-time">{{ formatTime(order.created_at) }}</text>
        </view>
        
        <!-- 发货操作按钮 -->
        <view 
          v-if="order.status === 'pending' && canShip"
          class="ship-action"
          @click.stop="handleShip(order)"
        >
          <text>去发货</text>
        </view>
      </view>
    </view>
    
    <view v-else class="empty-state">
      <text class="empty-icon">📦</text>
      <text class="empty-text">暂无订单</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onShow } from 'vue'
import { useUserStore } from '@/stores/user'
import type { Order } from '@/types'

const userStore = useUserStore()

const tabs = [
  { key: 'pending', label: '待发货' },
  { key: 'shipped', label: '已发货' },
  { key: 'all', label: '全部' }
]

const currentTab = ref('pending')
const orders = ref<Order[]>([])
const pendingCount = ref(0)
const todayShipped = ref(0)
const totalOrders = ref(0)
const specSummary = ref<Array<{name: string, totalQuantity: number}>>([])

const canShip = computed(() => userStore.isOwner || userStore.isShipper)

onShow(() => {
  loadOrders()
  loadStatistics()
})

function switchTab(key: string) {
  currentTab.value = key
  loadOrders()
}

async function loadOrders() {
  try {
    const result = await uniCloud.callFunction({
      name: 'getOrders',
      data: {
        status: currentTab.value === 'all' ? undefined : currentTab.value,
        page: 1,
        pageSize: 20
      }
    })
    
    if (result.result.code === 0) {
      orders.value = result.result.data
    }
  } catch (error) {
    console.error('加载订单失败:', error)
    uni.showToast({
      title: '加载订单失败',
      icon: 'none'
    })
  }
}

async function loadStatistics() {
  try {
    const result = await uniCloud.callFunction({
      name: 'getStatistics',
      data: {}
    })
    
    if (result.result.code === 0) {
      const data = result.result.data
      pendingCount.value = data.pending_orders || 0
      todayShipped.value = data.today_shipped || 0
      totalOrders.value = data.total_orders || 0
      specSummary.value = data.spec_summary || []
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '待发货',
    shipped: '已发货',
    delivered: '已收货',
    completed: '已完成'
  }
  return statusMap[status] || status
}

function formatPhone(phone: string): string {
  if (!phone) return ''
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

function formatTime(time: string): string {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

function goToOrderDetail(orderId: string) {
  uni.navigateTo({
    url: `/pages/orders/detail?id=${orderId}`
  })
}

function handleShip(order: Order) {
  uni.navigateTo({
    url: `/pages/orders/ship?id=${order._id}`
  })
}
</script>

<style lang="scss" scoped>
.stats-card {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: linear-gradient(135deg, $primary-color 0%, darken($primary-color, 10%) 100%);
  border-radius: $border-radius-xl;
  padding: $spacing-xl;
  margin-bottom: $spacing-lg;
  box-shadow: $shadow-base;
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .stat-number {
      font-size: 32px;
      font-weight: 700;
      color: #fff;
      line-height: 1.2;
    }
    
    .stat-label {
      font-size: $font-size-xs;
      color: rgba(255, 255, 255, 0.9);
      margin-top: $spacing-xs;
    }
  }
  
  .stat-divider {
    width: 1px;
    height: 40px;
    background: rgba(255, 255, 255, 0.3);
  }
}

.summary-list {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-sm;
  
  .summary-item {
    display: flex;
    align-items: center;
    background: $bg-white;
    padding: $spacing-sm $spacing-base;
    border-radius: $border-radius-base;
    box-shadow: $shadow-sm;
    
    .summary-name {
      font-size: $font-size-sm;
      color: $text-primary;
      margin-right: $spacing-sm;
    }
    
    .summary-count {
      font-size: $font-size-sm;
      font-weight: 600;
      color: $primary-color;
    }
  }
}

.filter-tabs {
  display: flex;
  background: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-xs;
  margin-bottom: $spacing-lg;
  box-shadow: $shadow-sm;
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: $spacing-sm $spacing-base;
    border-radius: $border-radius-base;
    font-size: $font-size-sm;
    color: $text-secondary;
    transition: all $transition-fast;
    
    &.active {
      background: $primary-color;
      color: #fff;
      font-weight: 500;
    }
  }
}

.orders-list {
  .order-card {
    background: $bg-white;
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    margin-bottom: $spacing-base;
    box-shadow: $shadow-sm;
    position: relative;
    
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-base;
      padding-bottom: $spacing-base;
      border-bottom: 1px solid $border-color;
      
      .order-no {
        font-size: $font-size-xs;
        color: $text-light;
      }
      
      .order-status {
        font-size: $font-size-xs;
        padding: $spacing-xs $spacing-sm;
        border-radius: $border-radius-sm;
        
        &.status-pending {
          background: rgba($secondary-color, 0.1);
          color: $secondary-color;
        }
        
        &.status-shipped {
          background: rgba($primary-color, 0.1);
          color: $primary-color;
        }
        
        &.status-delivered, &.status-completed {
          background: rgba($success-color, 0.1);
          color: $success-color;
        }
      }
    }
    
    .order-products {
      .product-item {
        display: flex;
        align-items: center;
        padding: $spacing-xs 0;
        
        .product-name {
          flex: 1;
          font-size: $font-size-sm;
          color: $text-primary;
        }
        
        .product-spec {
          font-size: $font-size-xs;
          color: $text-light;
          margin: 0 $spacing-base;
        }
        
        .product-qty {
          font-size: $font-size-sm;
          color: $text-secondary;
        }
      }
    }
    
    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: $spacing-base;
      padding-top: $spacing-base;
      border-top: 1px solid $border-color;
      
      .order-info {
        .receiver {
          font-size: $font-size-sm;
          color: $text-primary;
          margin-right: $spacing-sm;
        }
        
        .phone {
          font-size: $font-size-xs;
          color: $text-light;
        }
      }
      
      .order-time {
        font-size: $font-size-xs;
        color: $text-light;
      }
    }
    
    .ship-action {
      position: absolute;
      right: $spacing-lg;
      bottom: $spacing-lg;
      background: $primary-color;
      color: #fff;
      padding: $spacing-sm $spacing-base;
      border-radius: $border-radius-base;
      font-size: $font-size-sm;
    }
  }
}
</style>
