<template>
  <view class="container">
    <!-- 步骤指示器 -->
    <view class="step-indicator">
      <view 
        v-for="(step, index) in steps" 
        :key="index"
        :class="['step-item', { active: currentStep >= index, current: currentStep === index }]"
      >
        <view class="step-number">{{ index + 1 }}</view>
        <text class="step-label">{{ step }}</text>
      </view>
    </view>

    <!-- Step 1: 选择商品 -->
    <view v-if="currentStep === 0" class="step-content">
      <view class="section-title">选择商品</view>
      
      <!-- 商品卡片 -->
      <view class="product-select-card" @click="selectProduct">
        <image 
          v-if="selectedProduct"
          :src="selectedProduct.image || '/static/images/default-product.png'"
          class="product-thumb"
        />
        <view v-if="selectedProduct" class="product-select-info">
          <text class="product-select-name">{{ selectedProduct.name }}</text>
          <text class="product-select-price">¥{{ selectedSpec?.price }}/{{ selectedSpec?.weight }}</text>
        </view>
        <text v-else class="select-placeholder">点击选择商品</text>
        <text class="select-arrow">></text>
      </view>

      <!-- 规格选择 -->
      <view v-if="selectedProduct" class="spec-select">
        <view class="section-title">选择规格</view>
        <view class="spec-grid">
          <view 
            v-for="spec in selectedProduct.specifications"
            :key="spec._id"
            :class="['spec-card', { active: selectedSpec?._id === spec._id }]"
            @click="selectSpec(spec)"
          >
            <text class="spec-card-name">{{ spec.name }}</text>
            <text class="spec-card-weight">{{ spec.weight }}</text>
            <text class="spec-card-price">¥{{ spec.price }}</text>
          </view>
        </view>
      </view>

      <!-- 数量选择 -->
      <view v-if="selectedSpec" class="quantity-select">
        <view class="section-title">购买数量</view>
        <view class="quantity-control">
          <view class="qty-btn" @click="decreaseQty">-</view>
          <input 
            v-model.number="quantity" 
            type="number"
            class="qty-input"
            @change="validateQuantity"
          />
          <view class="qty-btn" @click="increaseQty">+</view>
        </view>
      </view>
    </view>

    <!-- Step 2: 填写地址 -->
    <view v-if="currentStep === 1" class="step-content">
      <view class="section-title">收货信息</view>
      
      <view class="form-group">
        <text class="form-label">收货人</text>
        <input 
          v-model="form.receiver_name"
          placeholder="请输入收货人姓名"
          class="form-input"
        />
      </view>

      <view class="form-group">
        <text class="form-label">联系电话</text>
        <input 
          v-model="form.receiver_phone"
          type="number"
          maxlength="11"
          placeholder="请输入手机号码"
          class="form-input"
        />
      </view>

      <view class="form-group">
        <text class="form-label">收货地址</text>
        <view class="address-picker" @click="pickAddress">
          <text v-if="form.province">{{ form.province }} {{ form.city }} {{ form.district }}</text>
          <text v-else class="placeholder">请选择省市区</text>
          <text class="picker-arrow">></text>
        </view>
      </view>

      <view class="form-group">
        <text class="form-label">详细地址</text>
        <textarea 
          v-model="form.address"
          placeholder="请输入详细地址（街道、门牌号等）"
          class="form-textarea"
          :auto-height="true"
        />
      </view>

      <view class="form-group">
        <text class="form-label">备注</text>
        <textarea 
          v-model="form.remarks"
          placeholder="可填写特殊要求（选填）"
          class="form-textarea"
          :auto-height="true"
        />
      </view>
    </view>

    <!-- Step 3: 确认订单 -->
    <view v-if="currentStep === 2" class="step-content">
      <view class="section-title">订单确认</view>
      
      <!-- 收货信息 -->
      <view class="confirm-card">
        <view class="confirm-header">
          <text class="confirm-label">收货人</text>
          <text class="confirm-value">{{ form.receiver_name }} {{ form.receiver_phone }}</text>
        </view>
        <view class="confirm-row">
          <text class="confirm-label">收货地址</text>
          <text class="confirm-value">{{ form.province }} {{ form.city }} {{ form.district }} {{ form.address }}</text>
        </view>
      </view>

      <!-- 商品信息 -->
      <view class="confirm-card">
        <view class="product-confirm">
          <image 
            :src="selectedProduct?.image || '/static/images/default-product.png'"
            class="confirm-product-img"
          />
          <view class="confirm-product-info">
            <text class="confirm-product-name">{{ selectedProduct?.name }}</text>
            <text class="confirm-product-spec">{{ selectedSpec?.name }} - {{ selectedSpec?.weight }}</text>
            <view class="confirm-product-price">
              <text>¥{{ selectedSpec?.price }}</text>
              <text class="qty">x{{ quantity }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="confirm-card">
        <view class="fee-row">
          <text class="fee-label">商品小计</text>
          <text class="fee-value">¥{{ subtotal.toFixed(2) }}</text>
        </view>
        <view class="fee-row">
          <text class="fee-label">运费</text>
          <text class="fee-value">{{ shippingFee > 0 ? '¥' + shippingFee.toFixed(2) : '包邮' }}</text>
        </view>
        <view class="fee-row" v-if="discount > 0">
          <text class="fee-label">优惠</text>
          <text class="fee-value text-primary">-¥{{ discount.toFixed(2) }}</text>
        </view>
        <view class="fee-total">
          <text>合计</text>
          <text class="total-price">¥{{ total.toFixed(2) }}</text>
        </view>
      </view>

      <!-- 优惠券 -->
      <view class="coupon-section" @click="showCouponPicker">
        <view class="coupon-info">
          <text class="coupon-label">优惠券</text>
          <text v-if="selectedCoupon" class="coupon-name">{{ selectedCoupon.name }}</text>
          <text v-else class="coupon-empty">暂无可用优惠券</text>
        </view>
        <text class="coupon-arrow">></text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view v-if="currentStep > 0" class="prev-btn" @click="prevStep">
        <text>上一步</text>
      </view>
      <view 
        v-if="currentStep < 2" 
        class="next-btn"
        @click="nextStep"
      >
        <text>下一步</text>
      </view>
      <view 
        v-if="currentStep === 2" 
        class="submit-btn"
        @click="submitOrder"
      >
        <text>提交订单</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { Product, Specification, Coupon } from '@/types'

const userStore = useUserStore()

const steps = ['选择商品', '填写地址', '确认订单']
const currentStep = ref(0)

const selectedProduct = ref<Product | null>(null)
const selectedSpec = ref<Specification | null>(null)
const quantity = ref(1)
const selectedCoupon = ref<Coupon | null>(null)

const form = ref({
  receiver_name: '',
  receiver_phone: '',
  province: '',
  city: '',
  district: '',
  address: '',
  remarks: ''
})

onLoad((options) => {
  if (options?.productId) {
    loadProduct(options.productId)
    if (options.specId) {
      setTimeout(() => {
        selectSpecById(options.specId)
      }, 100)
    }
  }
})

const subtotal = computed(() => {
  return (selectedSpec.value?.price || 0) * quantity.value
})

const shippingFee = computed(() => {
  if (!selectedSpec.value) return 0
  return calculateShippingFee()
})

const discount = computed(() => {
  return selectedCoupon.value?.amount || 0
})

const total = computed(() => {
  const fee = Math.max(0, subtotal.value + shippingFee.value - discount.value)
  return fee
})

function selectProduct() {
  uni.navigateTo({
    url: '/pages/products/list'
  })
}

function selectSpec(spec: Specification) {
  selectedSpec.value = spec
}

function selectSpecById(specId: string) {
  if (selectedProduct.value) {
    const spec = selectedProduct.value.specifications.find(s => s._id === specId)
    if (spec) {
      selectedSpec.value = spec
    }
  }
}

function increaseQty() {
  quantity.value++
}

function decreaseQty() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function validateQuantity() {
  if (quantity.value < 1) {
    quantity.value = 1
  }
}

function pickAddress() {
  uni.chooseAddress({
    success: (res) => {
      form.value.province = res.provinceName
      form.value.city = res.cityName
      form.value.district = res.countyName
      form.value.address = res.detailInfo
    }
  })
}

async function loadProduct(productId: string) {
  try {
    const result = await uniCloud.callFunction({
      name: 'getProduct',
      data: { productId }
    })
    
    if (result.result.code === 0) {
      selectedProduct.value = result.result.data
      if (selectedProduct.value.specifications?.length > 0) {
        selectedSpec.value = selectedProduct.value.specifications[0]
      }
    }
  } catch (error) {
    console.error('加载商品失败:', error)
  }
}

function calculateShippingFee(): number {
  return 10
}

function showCouponPicker() {
  uni.showToast({
    title: '优惠券功能开发中',
    icon: 'none'
  })
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

function nextStep() {
  if (!validateStep()) return
  
  if (currentStep.value < 2) {
    currentStep.value++
  }
}

function validateStep(): boolean {
  if (currentStep.value === 0) {
    if (!selectedProduct.value || !selectedSpec.value) {
      uni.showToast({
        title: '请选择商品和规格',
        icon: 'none'
      })
      return false
    }
  }
  
  if (currentStep.value === 1) {
    if (!form.value.receiver_name) {
      uni.showToast({
        title: '请输入收货人',
        icon: 'none'
      })
      return false
    }
    if (!form.value.receiver_phone || !/^1[3-9]\d{9}$/.test(form.value.receiver_phone)) {
      uni.showToast({
        title: '请输入正确的手机号',
        icon: 'none'
      })
      return false
    }
    if (!form.value.province || !form.value.address) {
      uni.showToast({
        title: '请完善收货地址',
        icon: 'none'
      })
      return false
    }
  }
  
  return true
}

async function submitOrder() {
  try {
    uni.showLoading({
      title: '提交中...'
    })
    
    const result = await uniCloud.callFunction({
      name: 'createOrder',
      data: {
        product_id: selectedProduct.value?._id,
        spec_id: selectedSpec.value?._id,
        quantity: quantity.value,
        receiver_name: form.value.receiver_name,
        receiver_phone: form.value.receiver_phone,
        province: form.value.province,
        city: form.value.city,
        district: form.value.district,
        address: form.value.address,
        remarks: form.value.remarks,
        coupon_id: selectedCoupon.value?._id
      }
    })
    
    uni.hideLoading()
    
    if (result.result.code === 0) {
      uni.showToast({
        title: '订单提交成功',
        icon: 'success'
      })
      
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index'
        })
      }, 1500)
    } else {
      uni.showToast({
        title: result.result.message || '提交失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('提交订单失败:', error)
    uni.showToast({
      title: '提交失败，请重试',
      icon: 'none'
    })
  }
}
</script>

<style lang="scss" scoped>
.step-indicator {
  display: flex;
  justify-content: space-between;
  padding: $spacing-xl $spacing-lg;
  background: $bg-white;
  margin-bottom: $spacing-base;
  
  .step-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    
    &:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 12px;
      left: 55%;
      width: 100%;
      height: 2px;
      background: $border-color;
    }
    
    &.active:not(:last-child)::after {
      background: $primary-color;
    }
    
    .step-number {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: $border-color;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: $font-size-sm;
      font-weight: 600;
      z-index: 1;
    }
    
    &.active .step-number {
      background: $primary-color;
    }
    
    .step-label {
      margin-top: $spacing-sm;
      font-size: $font-size-xs;
      color: $text-light;
    }
    
    &.active .step-label {
      color: $primary-color;
    }
  }
}

.step-content {
  padding-bottom: 80px;
}

.product-select-card {
  display: flex;
  align-items: center;
  background: $bg-white;
  padding: $spacing-lg;
  border-radius: $border-radius-lg;
  margin-bottom: $spacing-lg;
  
  .product-thumb {
    width: 80px;
    height: 80px;
    border-radius: $border-radius-base;
    margin-right: $spacing-base;
  }
  
  .product-select-info {
    flex: 1;
    
    .product-select-name {
      display: block;
      font-size: $font-size-base;
      font-weight: 600;
      color: $text-primary;
      margin-bottom: $spacing-xs;
    }
    
    .product-select-price {
      font-size: $font-size-sm;
      color: $primary-color;
    }
  }
  
  .select-placeholder {
    flex: 1;
    font-size: $font-size-sm;
    color: $text-light;
  }
  
  .select-arrow {
    color: $text-light;
  }
}

.spec-select {
  margin-bottom: $spacing-lg;
  
  .spec-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $spacing-base;
    
    .spec-card {
      background: $bg-white;
      padding: $spacing-lg;
      border-radius: $border-radius-base;
      border: 2px solid transparent;
      transition: all $transition-fast;
      
      &.active {
        border-color: $primary-color;
        background: rgba($primary-color, 0.05);
      }
      
      .spec-card-name {
        display: block;
        font-size: $font-size-base;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-xs;
      }
      
      .spec-card-weight {
        display: block;
        font-size: $font-size-xs;
        color: $text-light;
        margin-bottom: $spacing-sm;
      }
      
      .spec-card-price {
        font-size: $font-size-base;
        color: $primary-color;
        font-weight: 600;
      }
    }
  }
}

.quantity-select {
  .quantity-control {
    display: flex;
    align-items: center;
    background: $bg-white;
    border-radius: $border-radius-base;
    padding: $spacing-sm;
    
    .qty-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: $bg-light;
      border-radius: $border-radius-sm;
      font-size: 20px;
      color: $text-primary;
    }
    
    .qty-input {
      flex: 1;
      text-align: center;
      font-size: $font-size-lg;
      font-weight: 600;
      padding: $spacing-sm;
    }
  }
}

.form-group {
  background: $bg-white;
  padding: $spacing-lg;
  border-radius: $border-radius-lg;
  margin-bottom: $spacing-base;
  
  .form-label {
    display: block;
    font-size: $font-size-sm;
    color: $text-secondary;
    margin-bottom: $spacing-sm;
  }
  
  .form-input {
    width: 100%;
    font-size: $font-size-base;
    padding: $spacing-sm 0;
  }
  
  .form-textarea {
    width: 100%;
    font-size: $font-size-base;
    padding: $spacing-sm 0;
    min-height: 80px;
  }
  
  .address-picker {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-sm 0;
    
    .placeholder {
      color: $text-light;
    }
    
    .picker-arrow {
      color: $text-light;
    }
  }
}

.confirm-card {
  background: $bg-white;
  padding: $spacing-lg;
  border-radius: $border-radius-lg;
  margin-bottom: $spacing-base;
  
  .confirm-header {
    display: flex;
    justify-content: space-between;
    padding-bottom: $spacing-base;
    border-bottom: 1px solid $border-color;
    margin-bottom: $spacing-base;
    
    .confirm-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }
    
    .confirm-value {
      font-size: $font-size-sm;
      color: $text-primary;
    }
  }
  
  .confirm-row {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    
    .confirm-label {
      font-size: $font-size-sm;
      color: $text-secondary;
    }
    
    .confirm-value {
      font-size: $font-size-sm;
      color: $text-primary;
    }
  }
  
  .product-confirm {
    display: flex;
    
    .confirm-product-img {
      width: 80px;
      height: 80px;
      border-radius: $border-radius-base;
      margin-right: $spacing-base;
    }
    
    .confirm-product-info {
      flex: 1;
      
      .confirm-product-name {
        display: block;
        font-size: $font-size-base;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-xs;
      }
      
      .confirm-product-spec {
        display: block;
        font-size: $font-size-xs;
        color: $text-light;
        margin-bottom: $spacing-sm;
      }
      
      .confirm-product-price {
        display: flex;
        justify-content: space-between;
        font-size: $font-size-base;
        color: $primary-color;
        font-weight: 600;
        
        .qty {
          color: $text-secondary;
          font-weight: normal;
        }
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
}

.coupon-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: $bg-white;
  padding: $spacing-lg;
  border-radius: $border-radius-lg;
  
  .coupon-info {
    display: flex;
    align-items: center;
    
    .coupon-label {
      font-size: $font-size-sm;
      color: $text-secondary;
      margin-right: $spacing-base;
    }
    
    .coupon-name {
      font-size: $font-size-sm;
      color: $primary-color;
    }
    
    .coupon-empty {
      font-size: $font-size-sm;
      color: $text-light;
    }
  }
  
  .coupon-arrow {
    color: $text-light;
  }
}

.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  padding: $spacing-base $spacing-lg;
  background: $bg-white;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  
  .prev-btn, .next-btn, .submit-btn {
    flex: 1;
    padding: $spacing-base;
    border-radius: $border-radius-xl;
    text-align: center;
    font-size: $font-size-base;
    font-weight: 600;
  }
  
  .prev-btn {
    background: $bg-light;
    color: $text-secondary;
    margin-right: $spacing-sm;
  }
  
  .next-btn, .submit-btn {
    background: linear-gradient(135deg, $primary-color 0%, darken($primary-color, 10%) 100%);
    color: #fff;
  }
}
</style>
