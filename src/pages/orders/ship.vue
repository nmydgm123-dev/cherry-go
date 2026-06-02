<template>
  <view class="container">
    <!-- 订单信息 -->
    <view class="order-info-card">
      <view class="info-header">
        <text class="order-no">订单号：{{ order.order_no }}</text>
      </view>
      <view class="receiver-info">
        <text class="receiver-name">{{ order.receiver_name }}</text>
        <text class="receiver-phone">{{ order.receiver_phone }}</text>
      </view>
      <text class="receiver-address">{{ order.province }} {{ order.city }} {{ order.district }} {{ order.address }}</text>
    </view>

    <!-- 商品汇总 -->
    <view class="summary-card">
      <view class="card-header">
        <text class="card-title">商品汇总</text>
      </view>
      <view class="summary-list">
        <view 
          v-for="(product, index) in order.products" 
          :key="index"
          class="summary-item"
        >
          <text class="product-name">{{ product.product_name }}</text>
          <text class="product-spec">{{ product.spec_name }}</text>
          <text class="product-qty">x{{ product.quantity }}</text>
        </view>
      </view>
    </view>

    <!-- 照片上传 -->
    <view class="photo-section">
      <view class="section-title">发货照片（必填）</view>
      
      <view class="photo-upload-card">
        <view class="photo-guide">
          <text class="guide-title">📸 水果照片</text>
          <text class="guide-desc">拍摄真实水果照片，建议包含包装和水果特写</text>
        </view>
        <view class="upload-area" @click="chooseFruitPhoto">
          <image v-if="photoFruit" :src="photoFruit" mode="aspectFill" class="uploaded-image" />
          <view v-else class="upload-placeholder">
            <text class="upload-icon">+</text>
            <text class="upload-text">点击上传</text>
          </view>
        </view>
      </view>

      <view class="photo-upload-card">
        <view class="photo-guide">
          <text class="guide-title">📋 订单截图</text>
          <text class="guide-desc">拍摄订单页面截图，包含订单号便于系统识别</text>
        </view>
        <view class="upload-area" @click="chooseOrderPhoto">
          <image v-if="photoOrder" :src="photoOrder" mode="aspectFill" class="uploaded-image" />
          <view v-else class="upload-placeholder">
            <text class="upload-icon">+</text>
            <text class="upload-text">点击上传</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 物流信息 -->
    <view class="logistics-section">
      <view class="section-title">物流信息</view>
      
      <view class="form-group">
        <text class="form-label">物流公司</text>
        <picker :value="shippingCompanyIndex" :range="shippingCompanies" @change="onCompanyChange">
          <view class="picker-value">
            {{ shippingCompanies[shippingCompanyIndex] || '请选择物流公司' }}
          </view>
        </picker>
      </view>

      <view class="form-group">
        <text class="form-label">运单号</text>
        <input 
          v-model="trackingNo"
          placeholder="请输入运单号"
          class="form-input"
        />
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button 
        class="submit-btn" 
        :disabled="!canSubmit"
        @click="submitShipment"
      >
        确认发货
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Order } from '@/types'

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

const photoFruit = ref('')
const photoOrder = ref('')
const trackingNo = ref('')
const shippingCompanyIndex = ref(0)

const shippingCompanies = [
  '顺丰速运',
  '圆通速递',
  '中通快递',
  '韵达快递',
  '申通快递',
  '邮政EMS',
  '京东物流',
  '其他'
]

const canSubmit = computed(() => {
  return photoFruit.value && photoOrder.value && trackingNo.value && shippingCompanies[shippingCompanyIndex.value]
})

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
  }
}

function onCompanyChange(e: any) {
  shippingCompanyIndex.value = e.detail.value
}

function chooseFruitPhoto() {
  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const filePath = res.tempFiles[0].tempFilePath
      addWatermarkAndUpload(filePath, 'fruit')
    }
  })
}

function chooseOrderPhoto() {
  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const filePath = res.tempFiles[0].tempFilePath
      uploadPhoto(filePath, 'order')
    }
  })
}

async function addWatermarkAndUpload(filePath: string, type: string) {
  try {
    uni.showLoading({
      title: '添加水印中...'
    })
    
    const canvas = uni.createCanvasContext('watermarkCanvas')
    const imageInfo = await getImageInfo(filePath)
    
    canvas.width = imageInfo.width
    canvas.height = imageInfo.height
    canvas.drawImage(filePath, 0, 0)
    
    const now = new Date()
    const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    canvas.setFillStyle('rgba(0, 0, 0, 0.5)')
    canvas.fillRect(0, imageInfo.height - 60, imageInfo.width, 60)
    canvas.setFillStyle('#ffffff')
    canvas.font = '24px Arial'
    canvas.fillText(timeStr, 20, imageInfo.height - 25)
    canvas.fillText(order.value.order_no, 20, imageInfo.height - 5)
    
    canvas.draw(false, () => {
      uni.canvasToTempFilePath({
        canvasId: 'watermarkCanvas',
        success: (res) => {
          uploadPhoto(res.tempFilePath, type)
        }
      })
    })
  } catch (error) {
    uni.hideLoading()
    console.error('添加水印失败:', error)
    uploadPhoto(filePath, type)
  }
}

function getImageInfo(filePath: string): Promise<{width: number, height: number}> {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src: filePath,
      success: (res) => resolve(res),
      fail: reject
    })
  })
}

async function uploadPhoto(filePath: string, type: string) {
  try {
    uni.showLoading({
      title: '上传中...'
    })
    
    const result = await uniCloud.uploadFile({
      filePath: filePath,
      cloudPath: `orders/${order.value._id}/${type}_${Date.now()}.jpg`
    })
    
    uni.hideLoading()
    
    if (result.fileID) {
      if (type === 'fruit') {
        photoFruit.value = result.fileID
      } else {
        photoOrder.value = result.fileID
      }
    }
  } catch (error) {
    uni.hideLoading()
    console.error('上传照片失败:', error)
    uni.showToast({
      title: '上传失败，请重试',
      icon: 'none'
    })
  }
}

async function submitShipment() {
  if (!canSubmit.value) {
    uni.showToast({
      title: '请完善发货信息',
      icon: 'none'
    })
    return
  }
  
  try {
    uni.showLoading({
      title: '提交中...'
    })
    
    const result = await uniCloud.callFunction({
      name: 'shipOrder',
      data: {
        orderId: order.value._id,
        photo_fruit: photoFruit.value,
        photo_order: photoOrder.value,
        shipping_company: shippingCompanies[shippingCompanyIndex.value],
        tracking_no: trackingNo.value
      }
    })
    
    uni.hideLoading()
    
    if (result.result.code === 0) {
      uni.showToast({
        title: '发货成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      uni.showToast({
        title: result.result.message || '发货失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('发货失败:', error)
    uni.showToast({
      title: '发货失败，请重试',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
canvas {
  position: fixed;
  top: -9999px;
  left: -9999px;
}

.order-info-card {
  background: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;
  
  .info-header {
    margin-bottom: $spacing-base;
    
    .order-no {
      font-size: $font-size-xs;
      color: $text-light;
    }
  }
  
  .receiver-info {
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

.summary-card {
  background: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;
  
  .card-header {
    margin-bottom: $spacing-base;
    
    .card-title {
      font-size: $font-size-base;
      font-weight: 600;
      color: $text-primary;
    }
  }
  
  .summary-list {
    .summary-item {
      display: flex;
      align-items: center;
      padding: $spacing-sm 0;
      border-bottom: 1px solid $border-color;
      
      &:last-child {
        border-bottom: none;
      }
      
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
}

.photo-section {
  margin-bottom: $spacing-base;
  
  .photo-upload-card {
    background: $bg-white;
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    margin-bottom: $spacing-base;
    
    .photo-guide {
      margin-bottom: $spacing-base;
      
      .guide-title {
        display: block;
        font-size: $font-size-base;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-xs;
      }
      
      .guide-desc {
        display: block;
        font-size: $font-size-xs;
        color: $text-light;
      }
    }
    
    .upload-area {
      width: 100%;
      height: 200px;
      border: 2px dashed $border-color;
      border-radius: $border-radius-base;
      overflow: hidden;
      
      .uploaded-image {
        width: 100%;
        height: 100%;
      }
      
      .upload-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        
        .upload-icon {
          font-size: 48px;
          color: $text-light;
          margin-bottom: $spacing-sm;
        }
        
        .upload-text {
          font-size: $font-size-sm;
          color: $text-light;
        }
      }
    }
  }
}

.logistics-section {
  background: $bg-white;
  border-radius: $border-radius-lg;
  padding: $spacing-lg;
  margin-bottom: $spacing-base;
  
  .form-group {
    margin-bottom: $spacing-base;
    
    .form-label {
      display: block;
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-bottom: $spacing-sm;
    }
    
    .picker-value, .form-input {
      padding: $spacing-base;
      border: 1px solid $border-color;
      border-radius: $border-radius-base;
      font-size: $font-size-base;
    }
  }
}

.submit-section {
  padding: $spacing-lg 0;
  
  .submit-btn {
    width: 100%;
    padding: $spacing-base;
    background: linear-gradient(135deg, $primary-color 0%, darken($primary-color, 10%) 100%);
    color: #fff;
    border-radius: $border-radius-xl;
    font-size: $font-size-base;
    font-weight: 600;
    border: none;
    
    &[disabled] {
      background: $border-color;
      color: $text-light;
    }
  }
}
</style>
