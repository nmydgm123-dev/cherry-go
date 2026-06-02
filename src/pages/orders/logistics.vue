<template>
  <view class="container">
    <!-- 物流信息卡片 -->
    <view class="logistics-card">
      <view class="logistics-header">
        <text class="logistics-icon">🚚</text>
        <view class="logistics-info">
          <text class="company">{{ logisticsInfo.shipping_company }}</text>
          <text class="tracking-no">{{ logisticsInfo.tracking_no }}</text>
        </view>
        <view class="logistics-status">
          <text class="status-text">{{ logisticsInfo.status }}</text>
        </view>
      </view>
    </view>

    <!-- 物流时间轴 -->
    <view class="timeline-section">
      <view class="section-title">物流轨迹</view>
      <view class="timeline">
        <view 
          v-for="(event, index) in logisticsInfo.tracking_history" 
          :key="index"
          :class="['timeline-item', { latest: index === 0 }]"
        >
          <view class="timeline-dot"></view>
          <view class="timeline-content">
            <text class="timeline-status">{{ event.status }}</text>
            <text class="timeline-desc">{{ event.description }}</text>
            <text class="timeline-time">{{ formatTime(event.time) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 无物流信息 -->
    <view v-if="!hasLogistics" class="empty-state">
      <text class="empty-icon">📭</text>
      <text class="empty-text">暂无物流信息</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const logisticsInfo = ref({
  shipping_company: '顺丰速运',
  tracking_no: 'SF1234567890',
  status: '运输中',
  tracking_history: [
    {
      time: new Date().toISOString(),
      status: '运输中',
      description: '快件已到达【上海分拨中心】'
    },
    {
      time: new Date(Date.now() - 86400000).toISOString(),
      status: '揽收',
      description: '快件已揽收，正在发往目的地'
    },
    {
      time: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: '已发出',
      description: '商家已发货'
    }
  ]
})

const hasLogistics = computed(() => {
  return logisticsInfo.value.tracking_history && logisticsInfo.value.tracking_history.length > 0
})

onLoad((options) => {
  if (options?.id) {
    loadLogistics(options.id)
  }
})

async function loadLogistics(orderId: string) {
  try {
    const result = await uniCloud.callFunction({
      name: 'queryLogistics',
      data: { orderId }
    })
    
    if (result.result.code === 0) {
      logisticsInfo.value = result.result.data
    }
  } catch (error) {
    console.error('加载物流信息失败:', error)
  }
}

function formatTime(time: string): string {
  if (!time) return ''
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<style lang="scss" scoped>
.logistics-card {
  background: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;
  
  .logistics-header {
    display: flex;
    align-items: center;
    
    .logistics-icon {
      font-size: 32px;
      margin-right: $spacing-base;
    }
    
    .logistics-info {
      flex: 1;
      
      .company {
        display: block;
        font-size: $font-size-base;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-xs;
      }
      
      .tracking-no {
        font-size: $font-size-sm;
        color: $text-secondary;
      }
    }
    
    .logistics-status {
      background: rgba($primary-color, 0.1);
      padding: $spacing-xs $spacing-base;
      border-radius: $border-radius-base;
      
      .status-text {
        font-size: $font-size-xs;
        color: $primary-color;
        font-weight: 500;
      }
    }
  }
}

.timeline-section {
  background: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  
  .timeline {
    .timeline-item {
      display: flex;
      padding-left: $spacing-lg;
      padding-bottom: $spacing-lg;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        left: 5px;
        top: 12px;
        bottom: -4px;
        width: 2px;
        background: $border-color;
      }
      
      &:last-child {
        padding-bottom: 0;
        
        &::before {
          display: none;
        }
      }
      
      &.latest {
        .timeline-dot {
          background: $primary-color;
          border-color: $primary-color;
        }
        
        .timeline-content {
          .timeline-status {
            color: $primary-color;
          }
        }
      }
      
      .timeline-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: $bg-white;
        border: 2px solid $border-color;
        margin-right: $spacing-base;
        margin-top: 4px;
        flex-shrink: 0;
        z-index: 1;
      }
      
      .timeline-content {
        flex: 1;
        
        .timeline-status {
          display: block;
          font-size: $font-size-sm;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: $spacing-xs;
        }
        
        .timeline-desc {
          display: block;
          font-size: $font-size-sm;
          color: $text-secondary;
          margin-bottom: $spacing-xs;
          line-height: 1.4;
        }
        
        .timeline-time {
          display: block;
          font-size: $font-size-xs;
          color: $text-light;
        }
      }
    }
  }
}
</style>
