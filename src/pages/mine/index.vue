<template>
  <view class="container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <image 
          :src="userInfo.avatar || '/static/images/default-avatar.png'"
          class="avatar"
        />
        <view class="user-detail">
          <text class="nickname">{{ userInfo.nickname || '未登录' }}</text>
          <text class="role-tag" :class="`role-${userInfo.role}`">{{ getRoleText(userInfo.role) }}</text>
        </view>
      </view>
      <view v-if="!isLoggedIn" class="login-btn" @click="handleLogin">
        <text>点击登录</text>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-section">
      <!-- 订单相关 -->
      <view class="menu-group">
        <view class="menu-item" @click="goToOrders">
          <text class="menu-icon">📋</text>
          <text class="menu-text">我的订单</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="goToTrack">
          <text class="menu-icon">🚚</text>
          <text class="menu-text">物流查询</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <!-- 果园所有者功能 -->
      <view v-if="isOwner" class="menu-group">
        <view class="menu-header">
          <text class="menu-title">管理功能</text>
        </view>
        <view class="menu-item" @click="goToProductConfig">
          <text class="menu-icon">📦</text>
          <text class="menu-text">商品配置</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="goToCouponConfig">
          <text class="menu-icon">🎫</text>
          <text class="menu-text">优惠券管理</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="goToStats">
          <text class="menu-icon">📊</text>
          <text class="menu-text">数据统计</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="goToShippingRules">
          <text class="menu-icon">💰</text>
          <text class="menu-text">邮费规则</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <!-- 填写人/发货人功能 -->
      <view v-if="isWriter || isShipper" class="menu-group">
        <view class="menu-header">
          <text class="menu-title">工作台</text>
        </view>
        <view class="menu-item" @click="goToWorkbench">
          <text class="menu-icon">💼</text>
          <text class="menu-text">发货工作台</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <!-- 通用功能 -->
      <view class="menu-group">
        <view class="menu-item" @click="goToShare">
          <text class="menu-icon">🔗</text>
          <text class="menu-text">邀请好友</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="goToHelp">
          <text class="menu-icon">❓</text>
          <text class="menu-text">帮助与反馈</text>
          <text class="menu-arrow">></text>
        </view>
        <view class="menu-item" @click="goToAbout">
          <text class="menu-icon">ℹ️</text>
          <text class="menu-text">关于我们</text>
          <text class="menu-arrow">></text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view v-if="isLoggedIn" class="logout-section">
        <view class="logout-btn" @click="handleLogout">
          <text>退出登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onShow } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const userInfo = ref({
  avatar: '',
  nickname: '',
  role: 'browser'
})

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isOwner = computed(() => userStore.isOwner)
const isWriter = computed(() => userStore.isWriter)
const isShipper = computed(() => userStore.isShipper)

onShow(() => {
  loadUserInfo()
})

function loadUserInfo() {
  if (userStore.isLoggedIn && userStore.userInfo) {
    userInfo.value = {
      avatar: userStore.userInfo.avatar || '',
      nickname: userStore.userInfo.nickname || '',
      role: userStore.userInfo.role || 'browser'
    }
  }
}

function getRoleText(role: string): string {
  const roleMap: Record<string, string> = {
    owner: '果园所有者',
    writer: '填写人',
    shipper: '发货人',
    browser: '访客'
  }
  return roleMap[role] || '访客'
}

async function handleLogin() {
  const success = await userStore.login()
  if (success) {
    loadUserInfo()
    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })
  }
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        userInfo.value = {
          avatar: '',
          nickname: '',
          role: 'browser'
        }
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        })
      }
    }
  })
}

function goToOrders() {
  uni.navigateTo({
    url: '/pages/orders/list'
  })
}

function goToTrack() {
  uni.navigateTo({
    url: '/pages/orders/track'
  })
}

function goToWorkbench() {
  uni.switchTab({
    url: '/pages/index/index'
  })
}

function goToProductConfig() {
  uni.navigateTo({
    url: '/pages/products/config'
  })
}

function goToCouponConfig() {
  uni.navigateTo({
    url: '/pages/coupons/config'
  })
}

function goToStats() {
  uni.navigateTo({
    url: '/pages/stats/dashboard'
  })
}

function goToShippingRules() {
  uni.navigateTo({
    url: '/pages/settings/shipping-rules'
  })
}

function goToShare() {
  if (!isLoggedIn.value) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    return
  }
  
  uni.navigateTo({
    url: '/pages/share/index'
  })
}

function goToHelp() {
  uni.navigateTo({
    url: '/pages/help/index'
  })
}

function goToAbout() {
  uni.navigateTo({
    url: '/pages/about/index'
  })
}
</script>

<style lang="scss" scoped>
.user-card {
  background: linear-gradient(135deg, $primary-color 0%, darken($primary-color, 10%) 100%);
  border-radius: $border-radius-xl;
  padding: $spacing-xl;
  margin-bottom: $spacing-base;
  
  .user-info {
    display: flex;
    align-items: center;
    
    .avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      margin-right: $spacing-base;
    }
    
    .user-detail {
      flex: 1;
      
      .nickname {
        display: block;
        font-size: $font-size-xl;
        font-weight: 600;
        color: #fff;
        margin-bottom: $spacing-xs;
      }
      
      .role-tag {
        display: inline-block;
        padding: $spacing-xs $spacing-sm;
        border-radius: $border-radius-sm;
        font-size: $font-size-xs;
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
      }
    }
  }
  
  .login-btn {
    margin-top: $spacing-base;
    padding: $spacing-sm $spacing-base;
    background: rgba(255, 255, 255, 0.2);
    border-radius: $border-radius-base;
    text-align: center;
    color: #fff;
    font-size: $font-size-sm;
  }
}

.menu-section {
  .menu-group {
    background: $bg-white;
    border-radius: $border-radius-lg;
    margin-bottom: $spacing-base;
    overflow: hidden;
    
    .menu-header {
      padding: $spacing-base $spacing-lg;
      background: $bg-light;
      
      .menu-title {
        font-size: $font-size-xs;
        color: $text-light;
        font-weight: 600;
      }
    }
    
    .menu-item {
      display: flex;
      align-items: center;
      padding: $spacing-lg;
      border-bottom: 1px solid $border-color;
      
      &:last-child {
        border-bottom: none;
      }
      
      .menu-icon {
        font-size: 20px;
        margin-right: $spacing-base;
      }
      
      .menu-text {
        flex: 1;
        font-size: $font-size-base;
        color: $text-primary;
      }
      
      .menu-arrow {
        color: $text-light;
        font-size: $font-size-sm;
      }
    }
  }
  
  .logout-section {
    padding: $spacing-lg;
    
    .logout-btn {
      width: 100%;
      padding: $spacing-base;
      background: $bg-white;
      border-radius: $border-radius-lg;
      text-align: center;
      font-size: $font-size-base;
      color: $primary-color;
    }
  }
}
</style>
