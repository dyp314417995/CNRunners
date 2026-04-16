<template>
  <view class="index-container">
    <!-- 顶部用户信息 -->
    <view class="header">
      <view class="user-info" @click="goToProfile">
        <image
          class="avatar"
          :src="userInfo.avatarUrl || '/static/images/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="info">
          <text class="nickname">{{ userInfo.nickName || '跑友' }}</text>
          <text class="role-tag" v-if="isAdmin">管理员</text>
        </view>
      </view>
      <view class="announcement-btn" @click="goToAnnouncement">
        <text>📢</text>
      </view>
    </view>

    <!-- 数据概览卡片 -->
    <view class="stats-section">
      <view class="stats-row">
        <view class="stat-item">
          <text class="stat-value">{{ weekDistance }}</text>
          <text class="stat-label">本周跑量(km)</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ pointBalance }}</text>
          <text class="stat-label">积分余额</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ rankText }}</text>
          <text class="stat-label">排行榜</text>
        </view>
      </view>
    </view>

    <!-- 快捷操作 -->
    <view class="quick-actions">
      <view class="action-item" @click="goToSubmitPoints">
        <view class="action-icon submit-points">
          <text>+</text>
        </view>
        <text class="action-text">提交积分</text>
      </view>
      <view class="action-item" @click="goToRunning">
        <view class="action-icon running">
          <text>🏃</text>
        </view>
        <text class="action-text">跑步打卡</text>
      </view>
      <view class="action-item" @click="goToHistory">
        <view class="action-icon history">
          <text>📊</text>
        </view>
        <text class="action-text">跑步记录</text>
      </view>
    </view>

    <!-- 近期跑步记录 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">近期跑步</text>
        <text class="section-more" @click="goToHistory">查看全部 →</text>
      </view>

      <view v-if="recentRuns.length === 0" class="empty-state">
        <text class="empty-icon">🏃</text>
        <text class="empty-text">暂无跑步记录</text>
        <text class="empty-hint">绑定设备后自动同步，或手动添加</text>
      </view>

      <view v-else class="run-list">
        <RunningCard
          v-for="run in recentRuns"
          :key="run._id"
          :startTime="run.startTime"
          :distance="run.distance"
          :duration="run.duration"
          :pace="run.pace"
          :heartRate="run.heartRate"
          :source="run.source"
          @click="goToRunDetail(run._id)"
        />
      </view>
    </view>

    <!-- 待审批积分(管理员) -->
    <view v-if="isAdmin && pendingCount > 0" class="section">
      <view class="section-header">
        <text class="section-title">待审批积分</text>
        <view class="badge" v-if="pendingCount > 0">{{ pendingCount }}</view>
        <text class="section-more" @click="goToApprove">查看全部 →</text>
      </view>

      <view class="pending-list">
        <PointsCard
          v-for="record in pendingRecords"
          :key="record._id"
          :categoryName="record.categoryName"
          :categoryColor="getCategoryColor(record.categoryName)"
          :points="record.points"
          :description="record.description"
          :images="record.images"
          :status="record.status"
          :createTime="record.createTime"
        />
      </view>
    </view>
  </view>
</template>

<script>
import RunningCard from '../../components/running-card.vue'
import PointsCard from '../../components/points-card.vue'
import { getUserInfo } from '../../common/request.js'
import { getRunningRecords } from '../../common/request.js'
import { getRunningSummary } from '../../common/request.js'

export default {
  components: {
    RunningCard,
    PointsCard
  },
  data() {
    return {
      userInfo: {},
      memberInfo: {},
      isAdmin: false,
      weekDistance: 0,
      pointBalance: 0,
      rankText: '--',
      recentRuns: [],
      pendingRecords: [],
      pendingCount: 0
    }
  },
  onShow() {
    this.loadData()
  },
  onPullDownRefresh() {
    this.loadData().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    async loadData() {
      try {
        // 获取用户信息
        const userResult = await getUserInfo()
        if (userResult.success) {
          this.userInfo = userResult.data.user || {}
          this.memberInfo = userResult.data.member || {}
          this.isAdmin = this.memberInfo.role === 'admin'
        }

        // 获取跑步摘要
        if (this.memberInfo.groupId) {
          const summaryResult = await getRunningSummary(this.memberInfo.groupId)
          if (summaryResult.success) {
            this.weekDistance = summaryResult.data.week.distance
            this.pointBalance = this.memberInfo.pointBalance || 0
          }

          // 获取近期跑步记录
          const recordsResult = await getRunningRecords(this.memberInfo.groupId, {
            pageSize: 3
          })
          if (recordsResult.success) {
            this.recentRuns = recordsResult.data.list || []
          }
        }
      } catch (err) {
        console.error('加载数据失败:', err)
      }
    },

    getCategoryColor(name) {
      const colorMap = {
        '日常打卡': '#4CAF50',
        '活动参与': '#FF9800',
        '志愿服务': '#2196F3',
        '其他': '#9C27B0'
      }
      return colorMap[name] || '#9C27B0'
    },

    goToProfile() {
      uni.switchTab({ url: '/pages/profile/index' })
    },

    goToAnnouncement() {
      uni.navigateTo({ url: '/pages/index/announcement' })
    },

    goToSubmitPoints() {
      uni.navigateTo({ url: '/pages/points/submit' })
    },

    goToRunning() {
      uni.navigateTo({ url: '/pages/running/detail' })
    },

    goToHistory() {
      uni.navigateTo({ url: '/pages/running/history' })
    },

    goToRunDetail(id) {
      uni.navigateTo({ url: `/pages/running/detail?id=${id}` })
    },

    goToApprove() {
      uni.navigateTo({ url: '/pages/points/approve' })
    }
  }
}
</script>

<style scoped>
.index-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20rpx;
}

/* 顶部用户信息 */
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx 60rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.info {
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.role-tag {
  font-size: 20rpx;
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  margin-top: 8rpx;
  display: inline-block;
}

.announcement-btn {
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}

/* 数据概览 */
.stats-section {
  background: #fff;
  margin: -40rpx 30rpx 30rpx;
  border-radius: 16rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.stats-row {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}

/* 快捷操作 */
.quick-actions {
  display: flex;
  justify-content: space-around;
  padding: 30rpx;
  background: #fff;
  margin-bottom: 20rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin-bottom: 12rpx;
}

.action-icon.submit-points {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 60rpx;
  font-weight: bold;
}

.action-icon.running {
  background: #E3F2FD;
}

.action-icon.history {
  background: #FFF3E0;
}

.action-text {
  font-size: 24rpx;
  color: #666;
}

/* 区块 */
.section {
  background: #fff;
  margin: 0 30rpx 20rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.section-more {
  font-size: 24rpx;
  color: #999;
  margin-left: auto;
}

.badge {
  background: #F44336;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  margin-left: 16rpx;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
}
</style>
