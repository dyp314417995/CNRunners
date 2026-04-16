<template>
  <view class="settings-container">
    <view class="section">
      <view class="section-title">关于跑团管理</view>
      <view class="menu-list">
        <view class="menu-item">
          <text class="menu-name">版本号</text>
          <text class="menu-value">1.0.0</text>
        </view>
        <view class="menu-item" @click="goToAgreement">
          <text class="menu-name">用户协议</text>
          <text class="arrow">→</text>
        </view>
        <view class="menu-item" @click="goToPrivacy">
          <text class="menu-name">隐私政策</text>
          <text class="arrow">→</text>
        </view>
      </view>
    </view>

    <view class="section">
      <view class="section-title">数据管理</view>
      <view class="menu-list">
        <view class="menu-item" @click="clearCache">
          <text class="menu-name">清除缓存</text>
          <text class="arrow">→</text>
        </view>
      </view>
    </view>

    <view class="logout-section">
      <button class="logout-btn" @click="logout">退出登录</button>
    </view>
  </view>
</template>

<script>
import { showConfirm, showSuccess, showToast } from '../../common/utils.js'

export default {
  methods: {
    goToAgreement() {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    },
    goToPrivacy() {
      uni.showToast({ title: '功能开发中', icon: 'none' })
    },
    async clearCache() {
      const confirmed = await showConfirm({
        title: '清除缓存',
        content: '确定要清除本地缓存吗？'
      })
      if (confirmed) {
        uni.clearStorageSync()
        showSuccess('缓存已清除')
      }
    },
    async logout() {
      const confirmed = await showConfirm({
        title: '提示',
        content: '确定要退出登录吗？'
      })
      if (confirmed) {
        uni.clearStorageSync()
        uni.reLaunch({ url: '/pages/public/login' })
      }
    }
  }
}
</script>

<style scoped>
.settings-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20rpx 30rpx;
}
.section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}
.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}
.menu-list {
  display: flex;
  flex-direction: column;
}
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-name {
  font-size: 28rpx;
  color: #333;
}
.menu-value {
  font-size: 28rpx;
  color: #999;
}
.arrow {
  color: #ccc;
  font-size: 28rpx;
}
.logout-section {
  padding: 40rpx 0;
}
.logout-btn {
  width: 100%;
  height: 88rpx;
  background: #fff;
  color: #F44336;
  border-radius: 44rpx;
  font-size: 30rpx;
}
</style>
