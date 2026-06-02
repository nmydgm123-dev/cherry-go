<template>
  <view class="container">
    <view class="section-title">商品配置</view>
    
    <!-- 商品列表 -->
    <view class="product-list">
      <view 
        v-for="product in products" 
        :key="product._id"
        class="product-card"
      >
        <view class="product-header">
          <image 
            :src="product.image || '/static/images/default-product.png'"
            class="product-image"
            mode="aspectFill"
          />
          <view class="product-info">
            <text class="product-name">{{ product.name }}</text>
            <text class="product-desc">{{ product.description || '暂无描述' }}</text>
            <view class="product-tags">
              <text class="tag" :class="product.status === 'active' ? 'tag-success' : 'tag-warning'">
                {{ product.status === 'active' ? '在售' : '下架' }}
              </text>
              <text class="tag tag-primary">{{ getMaturityText(product.maturity_cycle) }}</text>
            </view>
          </view>
        </view>
        
        <view class="spec-list">
          <view 
            v-for="spec in product.specifications" 
            :key="spec._id"
            class="spec-item"
          >
            <view class="spec-info">
              <text class="spec-name">{{ spec.name }}</text>
              <text class="spec-weight">{{ spec.weight }}</text>
            </view>
            <view class="spec-price">¥{{ spec.price }}</view>
          </view>
        </view>
        
        <view class="product-actions">
          <view class="action-btn" @click="editProduct(product)">
            <text>编辑</text>
          </view>
          <view class="action-btn delete" @click="deleteProduct(product)">
            <text>删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 添加商品按钮 -->
    <view class="add-btn" @click="showAddProduct">
      <text>添加商品</text>
    </view>

    <!-- 添加/编辑商品弹窗 -->
    <view v-if="showModal" class="modal-overlay" @click="closeModal">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">{{ editingProduct ? '编辑商品' : '添加商品' }}</text>
          <text class="modal-close" @click="closeModal">X</text>
        </view>
        
        <view class="modal-body">
          <view class="form-group">
            <text class="form-label">商品名称</text>
            <input v-model="productForm.name" placeholder="如：车厘子" class="form-input" />
          </view>
          
          <view class="form-group">
            <text class="form-label">商品描述</text>
            <textarea v-model="productForm.description" placeholder="商品描述" class="form-textarea" />
          </view>
          
          <view class="form-group">
            <text class="form-label">熟制周期</text>
            <picker :value="productForm.maturity_cycle - 1" :range="maturityOptions" @change="onMaturityChange">
              <view class="picker-value">{{ maturityOptions[productForm.maturity_cycle - 1] }}</view>
            </picker>
          </view>
          
          <view class="form-group">
            <text class="form-label">商品图片</text>
            <view class="image-upload" @click="chooseImage">
              <image v-if="productForm.image" :src="productForm.image" mode="aspectFill" />
              <text v-else class="upload-placeholder">点击上传图片</text>
            </view>
          </view>
          
          <view class="form-group">
            <text class="form-label">规格设置</text>
            <view class="spec-editor">
              <view 
                v-for="(spec, index) in productForm.specifications" 
                :key="index"
                class="spec-row"
              >
                <input v-model="spec.name" placeholder="规格名" class="spec-input" />
                <input v-model="spec.weight" placeholder="重量" class="spec-input small" />
                <input v-model.number="spec.price" type="digit" placeholder="价格" class="spec-input small" />
                <text class="delete-spec" @click="removeSpec(index)">X</text>
              </view>
              <view class="add-spec" @click="addSpec">
                <text>+ 添加规格</text>
              </view>
            </view>
          </view>
        </view>
        
        <view class="modal-footer">
          <view class="cancel-btn" @click="closeModal">
            <text>取消</text>
          </view>
          <view class="confirm-btn" @click="saveProduct">
            <text>保存</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/stores/user'
import type { Product } from '@/types'

const userStore = useUserStore()

const products = ref<Product[]>([])
const showModal = ref(false)
const editingProduct = ref<Product | null>(null)

const productForm = ref({
  name: '',
  description: '',
  maturity_cycle: 1,
  image: '',
  specifications: [
    { name: '', weight: '', price: 0, stock: 100 }
  ]
})

const maturityOptions = ['一年一熟', '一年二熟', '一年三熟']

onShow(() => {
  loadProducts()
})

async function loadProducts() {
  try {
    const result = await uniCloud.callFunction({
      name: 'getProducts',
      data: { all: true }
    })
    
    if (result.result.code === 0) {
      products.value = result.result.data
    }
  } catch (error) {
    console.error('加载商品失败:', error)
  }
}

function getMaturityText(cycle: number): string {
  return maturityOptions[cycle - 1] || '一年一熟'
}

function showAddProduct() {
  editingProduct.value = null
  productForm.value = {
    name: '',
    description: '',
    maturity_cycle: 1,
    image: '',
    specifications: [
      { name: '', weight: '', price: 0, stock: 100 }
    ]
  }
  showModal.value = true
}

function editProduct(product: Product) {
  editingProduct.value = product
  productForm.value = {
    name: product.name,
    description: product.description,
    maturity_cycle: product.maturity_cycle,
    image: product.image,
    specifications: product.specifications.map(s => ({
      name: s.name,
      weight: s.weight,
      price: s.price,
      stock: s.stock
    }))
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingProduct.value = null
}

function onMaturityChange(e: any) {
  productForm.value.maturity_cycle = e.detail.value + 1
}

function chooseImage() {
  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const filePath = res.tempFiles[0].tempFilePath
      uploadImage(filePath)
    }
  })
}

async function uploadImage(filePath: string) {
  try {
    const result = await uniCloud.uploadFile({
      filePath: filePath,
      cloudPath: `products/${Date.now()}.jpg`
    })
    
    if (result.fileID) {
      productForm.value.image = result.fileID
    }
  } catch (error) {
    console.error('上传图片失败:', error)
    uni.showToast({
      title: '上传图片失败',
      icon: 'none'
    })
  }
}

function addSpec() {
  productForm.value.specifications.push({
    name: '',
    weight: '',
    price: 0,
    stock: 100
  })
}

function removeSpec(index: number) {
  productForm.value.specifications.splice(index, 1)
}

async function saveProduct() {
  if (!productForm.value.name) {
    uni.showToast({
      title: '请输入商品名称',
      icon: 'none'
    })
    return
  }
  
  try {
    uni.showLoading({
      title: '保存中...'
    })
    
    const result = await uniCloud.callFunction({
      name: 'saveProduct',
      data: {
        productId: editingProduct.value?._id,
        ...productForm.value
      }
    })
    
    uni.hideLoading()
    
    if (result.result.code === 0) {
      uni.showToast({
        title: '保存成功',
        icon: 'success'
      })
      closeModal()
      loadProducts()
    } else {
      uni.showToast({
        title: result.result.message || '保存失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('保存商品失败:', error)
    uni.showToast({
      title: '保存失败',
      icon: 'none'
    })
  }
}

function deleteProduct(product: Product) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除商品"${product.name}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await uniCloud.callFunction({
            name: 'deleteProduct',
            data: { productId: product._id }
          })
          
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
          loadProducts()
        } catch (error) {
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.product-list {
  .product-card {
    background: $bg-white;
    border-radius: $border-radius-lg;
    padding: $spacing-lg;
    margin-bottom: $spacing-base;
    
    .product-header {
      display: flex;
      margin-bottom: $spacing-base;
      
      .product-image {
        width: 80px;
        height: 80px;
        border-radius: $border-radius-base;
        margin-right: $spacing-base;
      }
      
      .product-info {
        flex: 1;
        
        .product-name {
          display: block;
          font-size: $font-size-base;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: $spacing-xs;
        }
        
        .product-desc {
          display: block;
          font-size: $font-size-xs;
          color: $text-light;
          margin-bottom: $spacing-sm;
        }
        
        .product-tags {
          display: flex;
          gap: $spacing-sm;
        }
      }
    }
    
    .spec-list {
      border-top: 1px solid $border-color;
      padding-top: $spacing-base;
      margin-bottom: $spacing-base;
      
      .spec-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: $spacing-xs 0;
        
        .spec-info {
          .spec-name {
            font-size: $font-size-sm;
            color: $text-primary;
            margin-right: $spacing-sm;
          }
          
          .spec-weight {
            font-size: $font-size-xs;
            color: $text-light;
          }
        }
        
        .spec-price {
          font-size: $font-size-sm;
          color: $primary-color;
          font-weight: 600;
        }
      }
    }
    
    .product-actions {
      display: flex;
      gap: $spacing-base;
      
      .action-btn {
        flex: 1;
        padding: $spacing-sm;
        border-radius: $border-radius-base;
        text-align: center;
        font-size: $font-size-sm;
        background: $bg-light;
        color: $text-primary;
        
        &.delete {
          background: rgba($primary-color, 0.1);
          color: $primary-color;
        }
      }
    }
  }
}

.add-btn {
  background: $primary-color;
  color: #fff;
  padding: $spacing-base;
  border-radius: $border-radius-xl;
  text-align: center;
  font-size: $font-size-base;
  font-weight: 600;
  margin-top: $spacing-lg;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 999;
}

.modal-content {
  width: 100%;
  max-height: 90vh;
  background: $bg-white;
  border-radius: $border-radius-xl $border-radius-xl 0 0;
  overflow: hidden;
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: $spacing-lg;
    border-bottom: 1px solid $border-color;
    
    .modal-title {
      font-size: $font-size-lg;
      font-weight: 600;
    }
    
    .modal-close {
      color: $text-light;
      font-size: $font-size-xl;
    }
  }
  
  .modal-body {
    padding: $spacing-lg;
    max-height: 60vh;
    overflow-y: auto;
    
    .form-group {
      margin-bottom: $spacing-lg;
      
      .form-label {
        display: block;
        font-size: $font-size-sm;
        color: $text-secondary;
        margin-bottom: $spacing-sm;
      }
      
      .form-input {
        width: 100%;
        padding: $spacing-base;
        border: 1px solid $border-color;
        border-radius: $border-radius-base;
        font-size: $font-size-base;
      }
      
      .form-textarea {
        width: 100%;
        padding: $spacing-base;
        border: 1px solid $border-color;
        border-radius: $border-radius-base;
        font-size: $font-size-base;
        min-height: 80px;
      }
      
      .picker-value {
        padding: $spacing-base;
        border: 1px solid $border-color;
        border-radius: $border-radius-base;
      }
      
      .image-upload {
        width: 100%;
        height: 150px;
        border: 1px dashed $border-color;
        border-radius: $border-radius-base;
        display: flex;
        align-items: center;
        justify-content: center;
        
        image {
          width: 100%;
          height: 100%;
        }
        
        .upload-placeholder {
          font-size: $font-size-sm;
          color: $text-light;
        }
      }
      
      .spec-editor {
        .spec-row {
          display: flex;
          gap: $spacing-sm;
          margin-bottom: $spacing-sm;
          
          .spec-input {
            flex: 1;
            padding: $spacing-sm;
            border: 1px solid $border-color;
            border-radius: $border-radius-sm;
            font-size: $font-size-sm;
            
            &.small {
              flex: 0.5;
            }
          }
          
          .delete-spec {
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: $primary-color;
          }
        }
        
        .add-spec {
          padding: $spacing-sm;
          border: 1px dashed $border-color;
          border-radius: $border-radius-base;
          text-align: center;
          color: $primary-color;
          font-size: $font-size-sm;
        }
      }
    }
  }
  
  .modal-footer {
    display: flex;
    gap: $spacing-base;
    padding: $spacing-lg;
    border-top: 1px solid $border-color;
    
    .cancel-btn, .confirm-btn {
      flex: 1;
      padding: $spacing-base;
      border-radius: $border-radius-xl;
      text-align: center;
      font-size: $font-size-base;
      font-weight: 600;
    }
    
    .cancel-btn {
      background: $bg-light;
      color: $text-secondary;
    }
    
    .confirm-btn {
      background: $primary-color;
      color: #fff;
    }
  }
}
</style>
