<template>
  <view class="detail-container">
    <scroll-view scroll-y class="record-list" @scrolltolower="loadMore">
      <view v-if="records.length === 0" class="empty-state">
        <text class="empty-icon">📊</text>
        <text class="empty-text">暂无积分记录</text>
      </view>

      <view v-else class="record-item" v-for="record in records" :key="record._id">
        <view class="record-info">
          <view class="category-tag" :style="{ backgroundColor: getCategoryColor(record.categoryName) }">
            {{ record.categoryName }}
          </view>
          <text class="description">{{ record.description || '无描述' }}</text>
          <text class="time">{{ formatTime(record.createTime) }}</text>
        </view>
        <view class="points-value" :class="{ positive: record.points > 0 }">
          {{ record.points > 0 ? '+' : '' }}{{ record.points }}
        </view>
      </view>

      <view v-if="loading" class="loading-more">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      records: [],
      loading: false,
      page: 1,
      pageSize: 20
    }
  },
  onLoad() {
    this.loadRecords()
  },
  methods: {
    async loadRecords() {
      this.loading = true
      // 简化实现
      this.records = []
      this.loading = false
    },
    loadMore() {},
    getCategoryColor(name) {
      const colorMap = {
        '日常打卡': '#4CAF50',
        '活动参与': '#FF9800',
        '志愿服务': '#2196F3',
        '其他': '#9C27B0'
      }
      return colorMap[name] || '#9C27B0'
    },
    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background: #f5f5f5;
}
.record-list {
  height: 100vh;
  padding: 20rpx 30rpx;
}
.record-item {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.record-info {
  flex: 1;
}
.category-tag {
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  display: inline-block;
  margin-bottom: 8rpx;
}
.description {
  font-size: 26rpx;
  color: #333;
  display: block;
  margin-bottom: 4rpx;
}
.time {
  font-size: 22rpx;
  color: #999;
}
.points-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}
.points-value.positive {
  color: #4CAF50;
}
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
.loading-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 24rpx;
}
</style>
