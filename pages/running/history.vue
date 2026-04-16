<template>
  <view class="history-container">
    <scroll-view scroll-y class="record-list" @scrolltolower="loadMore">
      <view v-if="records.length === 0" class="empty-state">
        <text class="empty-icon">🏃</text>
        <text class="empty-text">暂无跑步记录</text>
        <text class="empty-hint">绑定设备后自动同步</text>
      </view>

      <view v-else>
        <view v-for="(group, date) in groupedRecords" :key="date" class="date-group">
          <view class="date-header">{{ formatDateHeader(date) }}</view>
          <RunningCard
            v-for="record in group"
            :key="record._id"
            :startTime="record.startTime"
            :distance="record.distance"
            :duration="record.duration"
            :pace="record.pace"
            :heartRate="record.heartRate"
            :source="record.source"
            @click="goToDetail(record._id)"
          />
        </view>
      </view>

      <view v-if="loading" class="loading-more">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import RunningCard from '../../components/running-card.vue'
import { getRunningRecords } from '../../common/request.js'
import { showLoading, hideLoading } from '../../common/utils.js'

export default {
  components: {
    RunningCard
  },
  data() {
    return {
      records: [],
      groupedRecords: {},
      loading: false,
      page: 1,
      pageSize: 20,
      hasMore: true,
      groupId: ''
    }
  },
  onLoad() {
    const userInfo = uni.getStorageSync('userInfo')
    this.groupId = userInfo?.member?.groupId || 'default_group'
    this.loadRecords()
  },
  onPullDownRefresh() {
    this.page = 1
    this.records = []
    this.loadRecords().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    async loadRecords() {
      if (this.loading || !this.hasMore) return

      this.loading = true

      try {
        showLoading()
        const result = await getRunningRecords(this.groupId, {
          page: this.page,
          pageSize: this.pageSize
        })

        if (result.success) {
          const list = result.data.list || []

          if (this.page === 1) {
            this.records = list
          } else {
            this.records = [...this.records, ...list]
          }

          this.hasMore = list.length >= this.pageSize
          this.page++

          this.groupRecordsByDate()
        }
      } catch (err) {
        console.error('加载失败:', err)
      } finally {
        hideLoading()
        this.loading = false
      }
    },

    groupRecordsByDate() {
      const grouped = {}
      for (const record of this.records) {
        const date = new Date(record.startTime).toDateString()
        if (!grouped[date]) {
          grouped[date] = []
        }
        grouped[date].push(record)
      }
      this.groupedRecords = grouped
    },

    formatDateHeader(dateStr) {
      const date = new Date(dateStr)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (date.toDateString() === today.toDateString()) {
        return '今天'
      } else if (date.toDateString() === yesterday.toDateString()) {
        return '昨天'
      } else {
        const month = date.getMonth() + 1
        const day = date.getDate()
        const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
        return `${month}月${day}日 ${weekDay}`
      }
    },

    loadMore() {
      this.loadRecords()
    },

    goToDetail(id) {
      uni.navigateTo({ url: `/pages/running/detail?id=${id}` })
    }
  }
}
</script>

<style scoped>
.history-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.record-list {
  height: 100vh;
  padding: 20rpx 30rpx;
}

.date-group {
  margin-bottom: 30rpx;
}

.date-header {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 16rpx;
  padding-left: 8rpx;
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
  display: block;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
}

.loading-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 24rpx;
}
</style>
