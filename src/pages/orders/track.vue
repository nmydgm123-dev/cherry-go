<template>
  <view class="container">
    <!-- 搜索框 -->
    <view class="search-section">
      <view class="search-tabs">
        <view 
          v-for="tab in searchTabs" 
          :key="tab.key"
          :class="['tab-item', { active: currentTab === tab.key }]"
          @click="switchTab(tab.key)"
        >
          {{ tab.label }}
        </view>
      </view>
      
      <view class="search-bar">
        <input 
          v-model="searchKey"
          :placeholder="currentTab === 'order' ? '输入订单号' : '输入手机号后四位'"
          class="search-input"
          @confirm="handleSearch"
        />
        <view class="search-btn" @click="handleSearch">
          <text>查询</text>
        </view>
      </view>
    </view>

    <!-- 查询结果 -->
    <view v-if="searchResult" class="result-section">
      <view class="result-card">
        <view class="result-header">
          <text class="result-title">查询结果</text>
          <text class="result-status">{{ getStatusText(searchResult.status) }}</text>
        </view>
        
        <view class="result-info">
          <view class="info-row">
            <text class="info-label">订单号</text>
            <text class="info-value">{{ searchResult.order_no }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">收货人</text>
            <text class="info-value">{{ searchResult.receiver_name }}</text>
          </view>
          <view class="info-row" v-if="searchResult.shipping_company">
            <text class="info-label">物流公司</text>
            <text class="info-value">{{ searchResult.shipping_company }}</text>
          </view>
          <view class="info-row" v-if="searchResult.tracking_no">
            <text class="info-label">运单号</text>
            <text class="info-value">{{ searchResult.tracking_no }}</text>
          </view>
        </view>
        
        <view class="result-action" @click="goToLogistics(searchResult._id)">
          <text>查看物流详情</text>
          <text class="action-arrow">></text>
        </view>
      </view>
    </view>

    <!-- 无结果提示 -->
    <view v-else-if="hasSearched" class="empty-state">
      <text class="empty-icon">🔍</text>
      <text class="empty-text">未找到相关订单</text>
    </view>

    <!-- 使用说明 -->
    <view class="tips-section">
      <view class="tips-header">
        <text class="tips-title">使用说明</text>
      </view>
      <view class="tips-content">
        <view class="tip-item">
          <text class="tip-icon">1</text>
          <text class="tip-text">输入订单号可查询任意订单</text>
        </view>
        <view class="tip-item">
          <text class="tip-icon">2</text>
          <text class="tip-text">输入手机号后四位快速查询</text>
        </view>
        <view class="tip-item">
          <text class="tip-icon">3</text>
          <text class="tip-text">关注后可收到物流状态推送通知</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Order } from '@/types'

const searchTabs = [
  { key: 'order', label: '按订单号' },
  { key: 'phone', label: '按手机号' }
]

const currentTab = ref('order')
const searchKey = ref('')
const searchResult = ref<Order | null>(null)
const hasSearched = ref(false)

function switchTab(key: string) {
  currentTab.value = key
  searchKey.value = ''
  searchResult.value = null
  hasSearched.value = false
}

async function handleSearch() {
  if (!searchKey.value.trim()) {
    uni.showToast({
      title: '请输入查询信息',
      icon: 'none'
    })
    return
  }
  
  try {
    uni.showLoading({
      title: '查询中...'
    })
    
    const result = await uniCloud.callFunction({
      name: 'searchOrder',
      data: {
        type: currentTab.value,
        keyword: searchKey.value.trim()
      }
    })
    
    uni.hideLoading()
    
    if (result.result.code === 0) {
      searchResult.value = result.result.data
      hasSearched.value = true
    } else {
      searchResult.value = null
      hasSearched.value = true
    }
  } catch (error) {
    uni.hideLoading()
    console.error('查询失败:', error)
    uni.showToast({
      title: '查询失败，请重试',
      icon: 'none'
    })
  }
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

function goToLogistics(orderId: string) {
  uni.navigateTo({
    url: `/pages/orders/logistics?id=${orderId}`
  })
}
</script>

<style lang="scss" scoped>
.search-section {
  background: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;
  
  .search-tabs {
    display: flex;
    gap: $spacing-base;
    margin-bottom: $spacing-base;
    
    .tab-item {
      flex: 1;
      padding: $spacing-sm;
      text-align: center;
      border-radius: $border-radius-base;
      font-size: $font-size-sm;
      color: $text-secondary;
      background: $bg-light;
      
      &.active {
        background: $primary-color;
        color: #fff;
      }
    }
  }
  
  .search-bar {
    display: flex;
    gap: $spacing-base;
    
    .search-input {
      flex: 1;
      padding: $spacing-base;
      border: 1px solid $border-color;
      border-radius: $border-radius-base;
      font-size: $font-size-sm;
    }
    
    .search-btn {
      padding: $spacing-base $spacing-xl;
      background: $primary-color;
      color: #fff;
      border-radius: $border-radius-base;
      font-size: $font-size-sm;
    }
  }
}

.result-section {
  .result-card {
    background: $bg-white;
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: $spacing-base;
      padding-bottom: $spacing-base;
      border-bottom: 1px solid $border-color;
      
      .result-title {
        font-size: $font-size-base;
        font-weight: 600;
        color: $text-primary;
      }
      
      .result-status {
        font-size: $font-size-xs;
        padding: $spacing-xs $spacing-sm;
        background: rgba($primary-color, 0.1);
        color: $primary-color;
        border-radius: $border-radius-sm;
      }
    }
    
    .result-info {
      margin-bottom: $spacing-base;
      
      .info-row {
        display: flex;
        justify-content: space-between;
        padding: $spacing-sm 0;
        
        .info-label {
          font-size: $font-size-sm;
          color: $text-secondary;
        }
        
        .info-value {
          font-size: $font-size-sm;
          color: $text-primary;
        }
      }
    }
    
    .result-action {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-base 0;
      border-top: 1px solid $border-color;
      color: $primary-color;
      font-size: $font-size-sm;
      
      .action-arrow {
        color: $text-light;
      }
    }
  }
}

.tips-section {
  background: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-top: $spacing-base;
  
  .tips-header {
    margin-bottom: $spacing-base;
    
    .tips-title {
      font-size: $font-size-base;
      font-weight: 600;
      color: $text-primary;
    }
  }
  
  .tips-content {
    .tip-item {
      display: flex;
      align-items: center;
      padding: $spacing-sm 0;
      
      .tip-icon {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: $primary-color;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: $font-size-xs;
        margin-right: $spacing-base;
      }
      
      .tip-text {
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }
  }
}
</style>
