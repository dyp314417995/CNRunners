<template>
  <view class="points-container">
    <!-- Tab切换 -->
    <view class="tab-bar">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: currentTab === tab.key }]"
        @click="switchTab(tab.key)"
      >
        {{ tab.name }}
      </view>
    </view>

    <!-- 排行榜 -->
    <scroll-view scroll-y class="ranking-list" @scrolltolower="loadMore">
      <view class="ranking-item" v-for="(item, index) in rankingList" :key="item.userId">
        <view class="rank-number" :class="{ top: index < 3 }">
          <text v-if="index < 3">{{ ['🥇', '🥈', '🥉'][index] }}</text>
          <text v-else>{{ index + 1 }}</text>
        </view>

        <image class="avatar" :src="item.avatarUrl || '/static/images/default-avatar.png'" mode="aspectFill" />

        <view class="user-info">
          <text class="nickname">{{ item.nickName }}</text>
          <text class="week-distance">{{ item.weeklyDistance }}km/周</text>
        </view>

        <view class="points-info">
          <text class="points">{{ item.totalPoints }}</text>
          <text class="points-label">积分</text>
        </view>

        <view v-if="item.isCurrentUser" class="current-user-tag">我</view>
      </view>

      <view v-if="loading" class="loading-more">
        <text>加载中...</text>
      </view>

      <view v-if="!loading && rankingList.length === 0" class="empty-state">
        <text class="empty-icon">📊</text>
        <text class="empty-text">暂无排行数据</text>
      </view>
    </scroll-view>

    <!-- 我的积分底部栏 -->
    <view class="my-points-bar">
      <view class="my-info">
        <text class="my-label">我的积分</text>
        <text class="my-points">{{ myPoints }}</text>
      </view>
      <button class="my-detail-btn" @click="goToMyDetail">积分明细</button>
    </view>
  </view>
</template>

<script>
import { getPointsList } from '../../common/request.js'

export default {
  data() {
    return {
      tabs: [
        { key: 'week', name: '周榜' },
        { key: 'month', name: '月榜' },
        { key: 'all', name: '总榜' }
      ],
      currentTab: 'week',
      rankingList: [],
      myPoints: 0,
      currentRank: null,
      page: 1,
      pageSize: 20,
      loading: false,
      hasMore: true,
      groupId: ''
    }
  },
  onShow() {
    this.loadRanking()
  },
  onPullDownRefresh() {
    this.page = 1
    this.rankingList = []
    this.loadRanking().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    async loadRanking() {
      if (this.loading) return

      this.loading = true

      try {
        // 从本地存储获取groupId
        const userInfo = uni.getStorageSync('userInfo')
        this.groupId = userInfo?.member?.groupId || 'default_group'
        this.myPoints = userInfo?.member?.pointBalance || 0

        const result = await getPointsList(this.groupId, this.currentTab)

        if (result.success) {
          this.rankingList = result.data.list || []
          this.currentRank = result.data.currentUserRank
        }
      } catch (err) {
        console.error('加载排行榜失败:', err)
      } finally {
        this.loading = false
      }
    },

    switchTab(key) {
      if (this.currentTab === key) return
      this.currentTab = key
      this.page = 1
      this.rankingList = []
      this.loadRanking()
    },

    loadMore() {
      if (!this.hasMore || this.loading) return
      this.page++
      this.loadRanking()
    },

    goToMyDetail() {
      uni.navigateTo({ url: '/pages/points/detail' })
    }
  }
}
</script>

<style scoped>
.points-container {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* Tab切换 */
.tab-bar {
  display: flex;
  background: #fff;
  padding: 0 30rpx;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.tab-item.active {
  color: #667eea;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60rpx;
  height: 6rpx;
  background: #667eea;
  border-radius: 3rpx;
}

/* 排行榜 */
.ranking-list {
  flex: 1;
  padding: 20rpx 30rpx;
  padding-bottom: 140rpx;
}

.ranking-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  position: relative;
}

.rank-number {
  width: 60rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #999;
  text-align: center;
}

.rank-number.top {
  font-size: 36rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  margin-left: 16rpx;
}

.user-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
}

.week-distance {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

.points-info {
  text-align: right;
}

.points {
  font-size: 36rpx;
  font-weight: bold;
  color: #667eea;
  display: block;
}

.points-label {
  font-size: 22rpx;
  color: #999;
}

.current-user-tag {
  position: absolute;
  right: -10rpx;
  top: -10rpx;
  background: #667eea;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.loading-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 24rpx;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #666;
}

/* 底部栏 */
.my-points-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.my-info {
  display: flex;
  flex-direction: column;
}

.my-label {
  font-size: 24rpx;
  color: #999;
}

.my-points {
  font-size: 40rpx;
  font-weight: bold;
  color: #667eea;
}

.my-detail-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 28rpx;
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
}
</style>
