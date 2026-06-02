<template>
  <view class="container">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <input 
        v-model="searchKey" 
        placeholder="搜索商品"
        class="search-input"
        @confirm="handleSearch"
      />
    </view>

    <!-- 商品列表 -->
    <view class="product-list" v-if="products.length > 0">
      <view 
        v-for="product in products" 
        :key="product._id"
        class="product-card"
        @click="goToDetail(product._id)"
      >
        <image 
          :src="product.image || '/static/images/default-product.png'" 
          mode="aspectFill"
          class="product-image"
        />
        <view class="product-info">
          <text class="product-name">{{ product.name }}</text>
          <text class="product-desc">{{ product.description || '新鲜水果，产地直发' }}</text>
          <view class="product-footer">
            <view class="product-price">
              <text class="price-symbol">¥</text>
              <text class="price-value">{{ getMinPrice(product) }}</text>
              <text class="price-unit">起</text>
            </view>
            <text class="product-specs">{{ product.specifications.length }}种规格</text>
          </view>
        </view>
        <view class="product-tag" v-if="product.status === 'active'">
          在售
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-icon">🍒</text>
      <text class="empty-text">暂无商品</text>
    </view>

    <!-- 果园所有者配置入口 -->
    <view 
      v-if="isOwner"
      class="config-btn"
      @click="goToConfig"
    >
      <text>配置商品</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onShow } from 'vue'
import { useUserStore } from '@/stores/user'
import type { Product } from '@/types'

const userStore = useUserStore()

const searchKey = ref('')
const products = ref<Product[]>([])
const isOwner = userStore.isOwner

onShow(() => {
  loadProducts()
})

async function loadProducts() {
  try {
    const result = await uniCloud.callFunction({
      name: 'getProducts',
      data: {
        keyword: searchKey.value,
        status: 'active'
      }
    })
    
    if (result.result.code === 0) {
      products.value = result.result.data
    }
  } catch (error) {
    console.error('加载商品失败:', error)
    uni.showToast({
      title: '加载商品失败',
      icon: 'none'
    })
  }
}

function handleSearch() {
  loadProducts()
}

function getMinPrice(product: Product): string {
  if (!product.specifications || product.specifications.length === 0) return '0'
  const minPrice = Math.min(...product.specifications.map(s => s.price))
  return minPrice.toFixed(2)
}

function goToDetail(productId: string) {
  uni.navigateTo({
    url: `/pages/products/detail?id=${productId}`
  })
}

function goToConfig() {
  uni.navigateTo({
    url: '/pages/products/config'
  })
}
</script>

<style lang="scss" scoped>
.search-bar {
  margin-bottom: $spacing-lg;
  
  .search-input {
    width: 100%;
    padding: $spacing-base $spacing-lg;
    background: $bg-white;
    border-radius: $border-radius-lg;
    font-size: $font-size-sm;
  }
}

.product-list {
  .product-card {
    display: flex;
    background: $bg-white;
    border-radius: $border-radius-lg;
    padding: $spacing-base;
    margin-bottom: $spacing-base;
    box-shadow: $shadow-sm;
    position: relative;
    
    .product-image {
      width: 100px;
      height: 100px;
      border-radius: $border-radius-base;
      margin-right: $spacing-base;
    }
    
    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      
      .product-name {
        font-size: $font-size-base;
        font-weight: 600;
        color: $text-primary;
      }
      
      .product-desc {
        font-size: $font-size-xs;
        color: $text-light;
        margin-top: $spacing-xs;
      }
      
      .product-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: $spacing-sm;
        
        .product-price {
          display: flex;
          align-items: baseline;
          
          .price-symbol {
            font-size: $font-size-xs;
            color: $primary-color;
          }
          
          .price-value {
            font-size: $font-size-lg;
            font-weight: 700;
            color: $primary-color;
          }
          
          .price-unit {
            font-size: $font-size-xs;
            color: $text-light;
            margin-left: $spacing-xs;
          }
        }
        
        .product-specs {
          font-size: $font-size-xs;
          color: $text-light;
        }
      }
    }
    
    .product-tag {
      position: absolute;
      top: $spacing-base;
      right: $spacing-base;
      background: $success-color;
      color: #fff;
      padding: $spacing-xs $spacing-sm;
      border-radius: $border-radius-sm;
      font-size: $font-size-xs;
    }
  }
}

.config-btn {
  position: fixed;
  right: $spacing-lg;
  bottom: $spacing-xxl;
  background: $primary-color;
  color: #fff;
  padding: $spacing-base $spacing-xl;
  border-radius: $border-radius-xl;
  box-shadow: $shadow-base;
  font-size: $font-size-sm;
  font-weight: 500;
}
</style>
