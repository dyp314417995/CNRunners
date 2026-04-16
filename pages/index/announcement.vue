<template>
  <view class="announcement-container">
    <scroll-view scroll-y class="announcement-list" @scrolltolower="loadMore">
      <view v-if="announcements.length === 0" class="empty-state">
        <text class="empty-icon">📢</text>
        <text class="empty-text">暂无公告</text>
      </view>

      <view v-else class="announcement-item" v-for="item in announcements" :key="item._id" @click="viewDetail(item)">
        <view class="announcement-header">
          <view v-if="item.isTop" class="top-tag">置顶</view>
          <text class="title">{{ item.title }}</text>
        </view>
        <text class="content">{{ item.content }}</text>
        <view class="footer">
          <text class="author">{{ item.authorName }}</text>
          <text class="time">{{ formatTime(item.publishTime) }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 发布按钮(管理员) -->
    <view class="publish-bar" v-if="isAdmin">
      <button class="publish-btn" @click="showPublishModal">发布公告</button>
    </view>

    <!-- 发布弹窗 -->
    <uni-popup v-if="showPublish" type="bottom" @close="showPublish = false">
      <view class="publish-popup">
        <view class="popup-header">
          <text>发布公告</text>
          <text class="close-btn" @click="showPublish = false">×</text>
        </view>
        <view class="popup-body">
          <input v-model="publishForm.title" placeholder="请输入公告标题" class="title-input" />
          <textarea v-model="publishForm.content" placeholder="请输入公告内容" class="content-input" />
          <view class="top-checkbox">
            <checkbox-group @change="onTopChange">
              <label>
                <checkbox value="1" :checked="publishForm.isTop" />设为置顶
              </label>
            </checkbox-group>
          </view>
          <button class="submit-btn" @click="submitAnnouncement">发布</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { getAnnouncements, publishAnnouncement } from '../../common/request.js'
import { showLoading, hideLoading, showSuccess, showError } from '../../common/utils.js'

export default {
  data() {
    return {
      announcements: [],
      isAdmin: false,
      loading: false,
      page: 1,
      pageSize: 20,
      showPublish: false,
      publishForm: {
        title: '',
        content: '',
        isTop: false
      },
      groupId: ''
    }
  },
  onLoad() {
    const userInfo = uni.getStorageSync('userInfo')
    this.groupId = userInfo?.member?.groupId || 'default_group'
    this.isAdmin = userInfo?.member?.role === 'admin'
    this.loadAnnouncements()
  },
  onPullDownRefresh() {
    this.page = 1
    this.announcements = []
    this.loadAnnouncements().finally(() => {
      uni.stopPullDownRefresh()
    })
  },
  methods: {
    async loadAnnouncements() {
      if (this.loading) return

      this.loading = true

      try {
        const result = await getAnnouncements(this.groupId)
        if (result.success) {
          this.announcements = result.data.list || []
        }
      } catch (err) {
        console.error('加载公告失败:', err)
      } finally {
        this.loading = false
      }
    },

    loadMore() {
      if (this.loading) return
      this.page++
      this.loadAnnouncements()
    },

    viewDetail(item) {
      uni.showModal({
        title: item.title,
        content: item.content,
        showCancel: false
      })
    },

    onTopChange(e) {
      this.publishForm.isTop = e.detail.value.includes('1')
    },

    async submitAnnouncement() {
      if (!this.publishForm.title.trim()) {
        showError('请输入公告标题')
        return
      }

      if (!this.publishForm.content.trim()) {
        showError('请输入公告内容')
        return
      }

      showLoading('发布中...')

      try {
        const result = await publishAnnouncement({
          groupId: this.groupId,
          title: this.publishForm.title,
          content: this.publishForm.content,
          isTop: this.publishForm.isTop
        })

        if (result.success) {
          showSuccess('发布成功')
          this.showPublish = false
          this.publishForm = { title: '', content: '', isTop: false }
          this.loadAnnouncements()
        } else {
          showError(result.error || '发布失败')
        }
      } catch (err) {
        showError('发布失败')
      } finally {
        hideLoading()
      }
    },

    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}/${day}`
    }
  }
}
</script>

<style scoped>
.announcement-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.announcement-list {
  height: 100vh;
  padding: 20rpx 30rpx;
}

.announcement-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.announcement-header {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.top-tag {
  background: #F44336;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-right: 12rpx;
}

.title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: block;
  margin-bottom: 16rpx;

  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author {
  font-size: 24rpx;
  color: #999;
}

.time {
  font-size: 24rpx;
  color: #999;
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

/* 发布按钮 */
.publish-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.publish-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
}

/* 发布弹窗 */
.publish-popup {
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx;
  border-bottom: 1rpx solid #eee;
  font-size: 32rpx;
  font-weight: bold;
}

.close-btn {
  font-size: 48rpx;
  color: #999;
}

.popup-body {
  padding: 40rpx;
}

.title-input {
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 30rpx;
  font-size: 30rpx;
  margin-bottom: 20rpx;
}

.content-input {
  width: 100%;
  min-height: 240rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx 30rpx;
  font-size: 28rpx;
  box-sizing: border-box;
  margin-bottom: 20rpx;
}

.top-checkbox {
  margin-bottom: 30rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
}
</style>
