<template>
  <view class="approve-container">
    <!-- 筛选Tab -->
    <view class="filter-bar">
      <view
        v-for="tab in tabs"
        :key="tab.key"
        :class="['filter-tab', { active: currentFilter === tab.key }]"
        @click="switchFilter(tab.key)"
      >
        {{ tab.name }}
        <view v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</view>
      </view>
    </view>

    <!-- 审批列表 -->
    <scroll-view scroll-y class="record-list" @scrolltolower="loadMore">
      <view v-if="records.length === 0" class="empty-state">
        <text class="empty-icon">📋</text>
        <text class="empty-text">暂无待审批记录</text>
      </view>

      <view v-else class="record-item" v-for="record in records" :key="record._id">
        <view class="record-header">
          <image
            class="avatar"
            :src="record.avatarUrl || '/static/images/default-avatar.png'"
            mode="aspectFill"
          />
          <view class="user-info">
            <text class="nickname">{{ record.nickName }}</text>
            <text class="time">{{ formatTime(record.createTime) }}</text>
          </view>
          <view class="points-badge" :style="{ backgroundColor: getCategoryColor(record.categoryName) }">
            +{{ record.points }}
          </view>
        </view>

        <view class="record-body">
          <view class="category-tag" :style="{ color: getCategoryColor(record.categoryName) }">
            {{ record.categoryName }}
          </view>
          <view v-if="record.description" class="description">
            {{ record.description }}
          </view>

          <view v-if="record.images && record.images.length > 0" class="images">
            <image
              v-for="(img, index) in record.images"
              :key="index"
              :src="img"
              mode="aspectFill"
              @click="previewImage(img, record.images)"
            />
          </view>
        </view>

        <view class="record-actions" v-if="record.status === 'pending'">
          <button class="reject-btn" @click="handleReject(record)">拒绝</button>
          <button class="approve-btn" @click="handleApprove(record)">批准</button>
        </view>

        <view class="record-status" v-else>
          <text v-if="record.status === 'approved'" class="status-text approved">已批准</text>
          <text v-if="record.status === 'rejected'" class="status-text rejected">
            已拒绝<text v-if="record.rejectReason"> - {{ record.rejectReason }}</text>
          </text>
        </view>
      </view>

      <view v-if="loading" class="loading-more">
        <text>加载中...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { showLoading, hideLoading, showSuccess, showError, showConfirm } from '../../common/utils.js'

export default {
  data() {
    return {
      tabs: [
        { key: 'pending', name: '待审批', count: 0 },
        { key: 'approved', name: '已批准', count: 0 },
        { key: 'rejected', name: '已拒绝', count: 0 }
      ],
      currentFilter: 'pending',
      records: [],
      loading: false,
      page: 1,
      pageSize: 20,
      groupId: ''
    }
  },
  onLoad() {
    const userInfo = uni.getStorageSync('userInfo')
    this.groupId = userInfo?.member?.groupId || 'default_group'
    this.loadRecords()
  },
  onShow() {
    this.loadRecords()
  },
  methods: {
    async loadRecords() {
      // 简化实现，实际应该调用云函数获取待审批记录
      this.records = []
    },

    switchFilter(key) {
      if (this.currentFilter === key) return
      this.currentFilter = key
      this.page = 1
      this.records = []
      this.loadRecords()
    },

    loadMore() {
      if (this.loading) return
      this.page++
      this.loadRecords()
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

    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },

    previewImage(url, images) {
      uni.previewImage({
        urls: images || [url],
        current: url
      })
    },

    async handleApprove(record) {
      try {
        const confirmed = await showConfirm({
          title: '批准积分',
          content: `确定批准 ${record.nickName} 的 ${record.points} 积分申请吗？`
        })

        if (!confirmed) return

        showLoading('处理中...')

        // 实际调用云函数批准
        setTimeout(() => {
          hideLoading()
          showSuccess('已批准')

          // 从列表移除
          const index = this.records.findIndex(r => r._id === record._id)
          if (index > -1) {
            this.records.splice(index, 1)
          }

          // 更新待审批数量
          const pendingTab = this.tabs.find(t => t.key === 'pending')
          if (pendingTab && pendingTab.count > 0) {
            pendingTab.count--
          }
        }, 500)
      } catch (err) {
        hideLoading()
        showError('操作失败')
      }
    },

    async handleReject(record) {
      uni.showModal({
        title: '拒绝申请',
        editable: true,
        placeholderText: '请输入拒绝原因（选填）',
        success: async (res) => {
          if (res.confirm) {
            try {
              showLoading('处理中...')

              // 实际调用云函数拒绝
              setTimeout(() => {
                hideLoading()
                showSuccess('已拒绝')

                const index = this.records.findIndex(r => r._id === record._id)
                if (index > -1) {
                  this.records.splice(index, 1)
                }

                const pendingTab = this.tabs.find(t => t.key === 'pending')
                if (pendingTab && pendingTab.count > 0) {
                  pendingTab.count--
                }
              }, 500)
            } catch (err) {
              hideLoading()
              showError('操作失败')
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.approve-container {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  background: #fff;
  padding: 0 30rpx;
  border-bottom: 1rpx solid #eee;
  position: sticky;
  top: 0;
  z-index: 10;
}

.filter-tab {
  flex: 1;
  text-align: center;
  padding: 30rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-tab.active {
  color: #667eea;
  font-weight: bold;
}

.filter-tab.active::after {
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

.tab-badge {
  background: #F44336;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  margin-left: 8rpx;
}

/* 记录列表 */
.record-list {
  height: calc(100vh - 100rpx);
  padding: 20rpx 30rpx;
}

.record-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.record-header {
  display: flex;
  align-items: center;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
}

.user-info {
  flex: 1;
  margin-left: 16rpx;
}

.nickname {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.time {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.points-badge {
  color: #fff;
  font-size: 28rpx;
  font-weight: bold;
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.record-body {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.category-tag {
  font-size: 26rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.description {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 12rpx;
}

.images {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.images image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
}

/* 操作按钮 */
.record-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.reject-btn,
.approve-btn {
  flex: 1;
  height: 72rpx;
  border-radius: 36rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.reject-btn {
  background: #fff;
  color: #999;
  border: 2rpx solid #ddd;
}

.approve-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

/* 状态显示 */
.record-status {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.status-text {
  font-size: 24rpx;
}

.status-text.approved {
  color: #4CAF50;
}

.status-text.rejected {
  color: #F44336;
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

/* 加载更多 */
.loading-more {
  text-align: center;
  padding: 30rpx;
  color: #999;
  font-size: 24rpx;
}
</style>
