<template>
  <view class="settings-container">
    <!-- 群组设置 -->
    <view class="section">
      <view class="section-title">我的群组</view>
      <view class="group-list">
        <view
          v-for="group in availableGroups"
          :key="group._id"
          class="group-item"
          :class="{ selected: selectedGroupIds.includes(group._id) }"
          @click="toggleGroup(group._id)"
        >
          <view class="checkbox">
            <text v-if="selectedGroupIds.includes(group._id)">✓</text>
          </view>
          <text class="group-name">{{ group.name }}</text>
        </view>
      </view>
      <button class="save-btn" @click="saveGroups" :disabled="saving">
        {{ saving ? '保存中...' : '保存群组' }}
      </button>
    </view>

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
import { getUserInfo, getGroups, updateMyGroup } from '../../common/request.js'

export default {
  data() {
    return {
      availableGroups: [],
      selectedGroupIds: [],
      saving: false
    }
  },
  onShow() {
    this.loadData()
  },
  methods: {
    async loadData() {
      uni.showLoading({ title: '加载中...' })
      try {
        const [userRes, groupRes] = await Promise.all([
          getUserInfo(),
          getGroups()
        ])

        if (userRes.success && userRes.data) {
          this.selectedGroupIds = userRes.data.groupIds || []
        }

        if (groupRes.success) {
          this.availableGroups = groupRes.data || []
        }
      } catch (err) {
        console.error('加载数据失败:', err)
        showToast({ title: '加载失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },

    toggleGroup(groupId) {
      const index = this.selectedGroupIds.indexOf(groupId)
      if (index > -1) {
        this.selectedGroupIds.splice(index, 1)
      } else {
        this.selectedGroupIds.push(groupId)
      }
    },

    async saveGroups() {
      if (this.saving) return

      this.saving = true
      uni.showLoading({ title: '保存中...' })
      try {
        const res = await updateMyGroup(this.selectedGroupIds)
        if (res.success) {
          showSuccess('群组已更新')
        } else {
          showToast({ title: res.error || '保存失败', icon: 'none' })
        }
      } catch (err) {
        console.error('保存群组失败:', err)
        showToast({ title: '保存失败', icon: 'none' })
      } finally {
        this.saving = false
        uni.hideLoading()
      }
    },

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

/* 群组选择 */
.group-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-bottom: 30rpx;
}
.group-item {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
}
.group-item.selected {
  background: #e8f4ff;
  border-color: #4a90e2;
}
.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ccc;
  border-radius: 8rpx;
  margin-right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #4a90e2;
}
.group-item.selected .checkbox {
  background: #4a90e2;
  border-color: #4a90e2;
  color: #fff;
}
.group-name {
  font-size: 28rpx;
  color: #333;
}
.save-btn {
  width: 100%;
  height: 80rpx;
  background: #4a90e2;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.save-btn[disabled] {
  background: #ccc;
}
</style>
