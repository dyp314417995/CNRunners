<template>
  <view class="profile-container">
    <!-- 用户信息头部 -->
    <view class="profile-header">
      <image
        class="avatar"
        :src="userInfo.avatar || '/static/logo.jpg'"
        mode="aspectFill"
      />
      <view class="user-info">
        <view class="name-row">
          <text class="nickname">{{ userInfo.name || userInfo.nickname || '跑友' }}</text>
          <text v-if="userInfo.role === 'super_admin'" class="role-badge super">超管</text>
          <text v-else-if="userInfo.role === 'admin'" class="role-badge">管理员</text>
        </view>
        <text class="group-name">{{ groupName }}</text>
      </view>
      <view class="settings-btn" @click="goToSettings">
        <text>⚙️</text>
      </view>
    </view>

    <!-- 数据统计 -->
    <view class="stats-section">
      <view class="stat-item">
        <text class="stat-value">{{ totalDistance }}</text>
        <text class="stat-label">累计跑量(km)</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ pointBalance }}</text>
        <text class="stat-label">积分余额</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ memberLevel }}</text>
        <text class="stat-label">成员等级</text>
      </view>
    </view>

    <!-- 管理功能(管理员+) -->
    <view class="section" v-if="isAdmin">
      <view class="section-title">管理</view>
      <view class="menu-list">
        <view class="menu-item" @click="goToMembers">
          <text class="menu-icon">👥</text>
          <text class="menu-name">成员管理</text>
          <text class="arrow">›</text>
        </view>

        <!-- 超管专属 -->
        <view class="menu-item" v-if="userInfo.role === 'super_admin'" @click="goToAdminManage">
          <text class="menu-icon">⚙️</text>
          <text class="menu-name">管理员管理</text>
          <text class="menu-badge">超管</text>
          <text class="arrow">›</text>
        </view>

        <view class="menu-item" @click="goToAnnouncements">
          <text class="menu-icon">📢</text>
          <text class="menu-name">公告管理</text>
          <text class="arrow">›</text>
        </view>

        <view class="menu-item" @click="goToCategories">
          <text class="menu-icon">🏷️</text>
          <text class="menu-name">积分分类管理</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 其他功能 -->
    <view class="section">
      <view class="section-title">其他</view>
      <view class="menu-list">
        <view class="menu-item" @click="goToMyRaces">
          <text class="menu-icon">🏆</text>
          <text class="menu-name">我的赛事</text>
          <text class="arrow">›</text>
        </view>

        <view class="menu-item" @click="goToBind('garmin')">
          <text class="menu-icon">⌚</text>
          <text class="menu-name">佳明 Connect</text>
          <text class="bind-status" :class="{ bound: garminBound }">
            {{ garminBound ? '已绑定' : '未绑定' }}
          </text>
          <text class="arrow">›</text>
        </view>

        <view class="menu-item" @click="goToBind('huawei')">
          <text class="menu-icon">💪</text>
          <text class="menu-name">华为 Health</text>
          <text class="bind-status" :class="{ bound: huaweiBound }">
            {{ huaweiBound ? '已绑定' : '未绑定' }}
          </text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section">
      <button class="logout-btn" @click="logout">退出登录</button>
    </view>
  </view>
</template>

<script>
import { getUserInfo, getGroups } from '../../common/request.js'

export default {
  data() {
    return {
      userInfo: {},
      groups: [],
      isAdmin: false,
      totalDistance: 0,
      pointBalance: 0,
      garminBound: false,
      huaweiBound: false
    }
  },
  computed: {
    groupName() {
      if (!this.userInfo.groupId) return ''
      const group = this.groups.find(g => g.id === this.userInfo.groupId)
      return group ? group.name : ''
    },
    memberLevel() {
      const distance = this.totalDistance
      if (distance >= 500) return 'Lv.5'
      if (distance >= 300) return 'Lv.4'
      if (distance >= 200) return 'Lv.3'
      if (distance >= 100) return 'Lv.2'
      if (distance >= 50) return 'Lv.1'
      return 'Lv.0'
    }
  },
  onShow() {
    this.loadData()
  },
  methods: {
    async loadData() {
      uni.showLoading({ title: '加载中...' })
      try {
        // 并行加载用户信息和群组信息
        const [userRes, groupRes] = await Promise.all([
          getUserInfo(),
          getGroups()
        ])

        if (userRes.success) {
          this.userInfo = userRes.data || {}
          this.isAdmin = this.userInfo.role === 'admin' || this.userInfo.role === 'super_admin'
          this.totalDistance = this.userInfo.totalDistance || 0
          this.pointBalance = this.userInfo.pointBalance || 0
        }

        if (groupRes.success) {
          this.groups = groupRes.data || []
        }
      } catch (err) {
        console.error('加载数据失败:', err)
        // 尝试从本地存储获取
        const stored = uni.getStorageSync('userInfo')
        if (stored) {
          this.userInfo = stored
          this.isAdmin = this.userInfo.role === 'admin' || this.userInfo.role === 'super_admin'
        }
      } finally {
        uni.hideLoading()
      }
    },

    goToSettings() {
      uni.navigateTo({ url: '/pages/profile/settings' })
    },

    goToMembers() {
      uni.navigateTo({ url: '/pages/profile/members' })
    },

    goToAdminManage() {
      uni.navigateTo({ url: '/pages/admin/adminManage' })
    },

    goToAnnouncements() {
      uni.navigateTo({ url: '/pages/index/announcement' })
    },

    goToCategories() {
      uni.showToast({
        title: '功能开发中',
        icon: 'none'
      })
    },

    goToBind(platform) {
      uni.navigateTo({ url: `/pages/profile/bind?platform=${platform}` })
    },

    goToMyRaces() {
      uni.navigateTo({ url: '/pages/race/my' })
    },

    logout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.clearStorageSync()
            uni.reLaunch({ url: '/pages/public/login' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60rpx;
}

/* 用户信息头部 */
.profile-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 60rpx 30rpx 40rpx;
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  background: #fff;
}

.user-info {
  flex: 1;
  margin-left: 24rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.role-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 8rpx;
}

.role-badge.super {
  background: rgba(156, 39, 176, 0.8);
}

.group-name {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
  display: block;
}

.settings-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

/* 数据统计 */
.stats-section {
  background: #fff;
  margin: -20rpx 30rpx 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

.stat-divider {
  width: 1rpx;
  background: #eee;
}

/* 区块 */
.section {
  background: #fff;
  margin: 0 30rpx 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

/* 菜单列表 */
.menu-list {
  display: flex;
  flex-direction: column;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 36rpx;
  margin-right: 16rpx;
}

.menu-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.menu-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: #f3e5f5;
  color: #9C27B0;
  border-radius: 8rpx;
  margin-right: 8rpx;
}

.bind-status {
  font-size: 24rpx;
  color: #999;
  margin-right: 8rpx;
}

.bind-status.bound {
  color: #4CAF50;
}

.arrow {
  color: #ccc;
  font-size: 32rpx;
}

/* 退出登录 */
.logout-section {
  padding: 40rpx 30rpx;
}

.logout-btn {
  width: 100%;
  height: 88rpx;
  background: #fff;
  color: #F44336;
  border-radius: 44rpx;
  font-size: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}
</style>
