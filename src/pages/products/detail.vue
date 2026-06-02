<template>
  <view class="container">
    <!-- 商品图片 -->
    <swiper class="product-swiper" indicator-dots autoplay circular>
      <swiper-item>
        <image 
          :src="product.image || '/static/images/default-product.png'" 
          mode="aspectFill"
          class="swiper-image"
        />
      </swiper-item>
    </swiper>

    <!-- 商品信息 -->
    <view class="product-info">
      <view class="product-header">
        <text class="product-name">{{ product.name }}</text>
        <view class="product-tags">
          <text class="tag tag-primary">{{ getMaturityText(product.maturity_cycle) }}</text>
        </view>
      </view>
      <text class="product-desc">{{ product.description || '新鲜水果，产地直发' }}</text>
      <view class="product-price">
        <text class="price-symbol">¥</text>
        <text class="price-value">{{ selectedSpec?.price || getMinPrice() }}</text>
        <text class="price-unit">/{{ selectedSpec?.weight || '斤' }}</text>
      </view>
    </view>

    <!-- 规格选择 -->
    <view class="spec-section">
      <view class="section-title">选择规格</view>
      <view class="spec-list">
        <view 
          v-for="spec in product.specifications" 
          :key="spec._id"
          :class="['spec-item', { active: selectedSpecId === spec._id }]"
          @click="selectSpec(spec)"
        >
          <view class="spec-content">
            <text class="spec-name">{{ spec.name }}</text>
            <text class="spec-weight">{{ spec.weight }}</text>
          </view>
          <text class="spec-price">¥{{ spec.price }}</text>
        </view>
      </view>
    </view>

    <!-- 商品详情 -->
    <view class="detail-section">
      <view class="section-title">商品详情</view>
      <rich-text :nodes="product.detail || '<p>暂无详细信息</p>'"></rich-text>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="action-buttons">
        <view class="action-btn" @click="goToOrders">
          <text class="action-icon">📋</text>
          <text class="action-text">我的订单</text>
        </view>
      </view>
      <view class="buy-btn" @click="goToCreateOrder">
        <text>立即购买</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onLoad } from '@dcloudio/uni-app'
import type { Product, Specification } from '@/types'

const product = ref<Product>({
  _id: '',
  farm_id: '',
  name: '',
  image: '',
  maturity_cycle: 1,
  description: '',
  status: 'active',
  specifications: [],
  created_at: '',
  updated_at: ''
})

const selectedSpecId = ref('')
const selectedSpec = ref<Specification | null>(null)

onLoad((options) => {
  if (options?.id) {
    loadProduct(options.id)
  }
})

async function loadProduct(productId: string) {
  try {
    const result = await uniCloud.callFunction({
      name: 'getProduct',
      data: { productId }
    })
    
    if (result.result.code === 0) {
      product.value = result.result.data
      if (product.value.specifications?.length > 0) {
        selectedSpecId.value = product.value.specifications[0]._id
        selectedSpec.value = product.value.specifications[0]
      }
    }
  } catch (error) {
    console.error('加载商品失败:', error)
  }
}

function selectSpec(spec: Specification) {
  selectedSpecId.value = spec._id
  selectedSpec.value = spec
}

function getMinPrice(): string {
  if (!product.value.specifications || product.value.specifications.length === 0) return '0'
  const minPrice = Math.min(...product.value.specifications.map(s => s.price))
  return minPrice.toFixed(2)
}

function getMaturityText(cycle: number): string {
  const textMap: Record<number, string> = {
    1: '一年一熟',
    2: '一年二熟',
    3: '一年三熟'
  }
  return textMap[cycle] || `一年${cycle}熟`
}

function goToCreateOrder() {
  if (!selectedSpec.value) {
    uni.showToast({
      title: '请选择规格',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: `/pages/orders/create?productId=${product.value._id}&specId=${selectedSpec.value._id}`
  })
}

function goToOrders() {
  uni.switchTab({
    url: '/pages/orders/create'
  })
}
</script>

<style lang="scss" scoped>
.product-swiper {
  height: 300px;
  
  .swiper-image {
    width: 100%;
    height: 100%;
  }
}

.product-info {
  background: $bg-white;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;
  
  .product-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $spacing-sm;
    
    .product-name {
      font-size: $font-size-xl;
      font-weight: 700;
      color: $text-primary;
    }
  }
  
  .product-desc {
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-bottom: $spacing-base;
  }
  
  .product-price {
    display: flex;
    align-items: baseline;
    
    .price-symbol {
      font-size: $font-size-base;
      color: $primary-color;
    }
    
    .price-value {
      font-size: 28px;
      font-weight: 700;
      color: $primary-color;
    }
    
    .price-unit {
      font-size: $font-size-sm;
      color: $text-light;
      margin-left: $spacing-xs;
    }
  }
}

.spec-section {
  background: $bg-white;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;
  
  .spec-list {
    .spec-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-base;
      border: 1px solid $border-color;
      border-radius: $border-radius-base;
      margin-bottom: $spacing-sm;
      transition: all $transition-fast;
      
      &.active {
        border-color: $primary-color;
        background: rgba($primary-color, 0.05);
      }
      
      .spec-content {
        .spec-name {
          font-size: $font-size-base;
          color: $text-primary;
          font-weight: 500;
        }
        
        .spec-weight {
          font-size: $font-size-xs;
          color: $text-light;
          margin-left: $spacing-sm;
        }
      }
      
      .spec-price {
        font-size: $font-size-base;
        color: $primary-color;
        font-weight: 600;
      }
    }
  }
}

.detail-section {
  background: $bg-white;
  padding: $spacing-lg;
  margin-bottom: 80px;
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  padding: $spacing-base $spacing-lg;
  background: $bg-white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  
  .action-buttons {
    flex: 1;
    display: flex;
    
    .action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-right: $spacing-xl;
      
      .action-icon {
        font-size: 24px;
      }
      
      .action-text {
        font-size: $font-size-xs;
        color: $text-secondary;
        margin-top: $spacing-xs;
      }
    }
  }
  
  .buy-btn {
    background: linear-gradient(135deg, $primary-color 0%, darken($primary-color, 10%) 100%);
    color: #fff;
    padding: $spacing-base $spacing-xxl;
    border-radius: $border-radius-xl;
    font-size: $font-size-base;
    font-weight: 600;
  }
}
</style>
