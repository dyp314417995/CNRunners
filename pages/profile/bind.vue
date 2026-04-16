<template>
  <view class="bind-container">
    <!-- 设备信息 -->
    <view class="device-card" :class="platform">
      <view class="device-icon-large">
        <text>{{ platform === 'garmin' ? 'G' : 'H' }}</text>
      </view>
      <view class="device-name">{{ platformName }}</view>
      <view class="device-desc">{{ deviceDesc }}</view>
    </view>

    <!-- 绑定状态 -->
    <view class="status-section">
      <view class="status-item">
        <text class="status-label">绑定状态</text>
        <text class="status-value" :class="{ bound: bindingStatus.bound }">
          {{ bindingStatus.bound ? '已绑定' : '未绑定' }}
        </text>
      </view>

      <view class="status-item" v-if="bindingStatus.bound">
        <text class="status-label">绑定时间</text>
        <text class="status-value">{{ formatTime(bindingStatus.bindTime) }}</text>
      </view>

      <view class="status-item" v-if="bindingStatus.bound && bindingStatus.lastSyncTime">
        <text class="status-label">上次同步</text>
        <text class="status-value">{{ formatTime(bindingStatus.lastSyncTime) }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-section">
      <button
        v-if="!bindingStatus.bound"
        class="bind-btn"
        @click="startBind"
        :disabled="loading"
      >
        {{ loading ? '跳转中...' : '开始绑定' }}
      </button>

      <button
        v-else
        class="sync-btn"
        @click="syncData"
        :disabled="loading"
      >
        {{ loading ? '同步中...' : '立即同步' }}
      </button>

      <button
        v-if="bindingStatus.bound"
        class="unbind-btn"
        @click="unbind"
        :disabled="loading"
      >
        解除绑定
      </button>
    </view>

    <!-- 绑定说明 -->
    <view class="guide-section">
      <view class="guide-title">绑定说明</view>
      <view class="guide-steps">
        <view class="step">
          <text class="step-num">1</text>
          <text class="step-text">点击"开始绑定"按钮</text>
        </view>
        <view class="step">
          <text class="step-num">2</text>
          <text class="step-text">在打开的页面登录您的{{ platformName }}账号</text>
        </view>
        <view class="step">
          <text class="step-num">3</text>
          <text class="step-text">授权小程序访问您的运动数据</text>
        </view>
        <view class="step">
          <text class="step-num">4</text>
          <text class="step-text">授权成功后返回小程序完成绑定</text>
        </view>
      </view>

      <view class="privacy-note">
        <text class="note-icon">🔒</text>
        <text class="note-text">
          我们只会读取您的运动数据，不会访问您的其他个人信息。详细说明请查阅隐私政策。
        </text>
      </view>
    </view>
  </view>
</template>

<script>
import {
  getGarminAuthUrl,
  getHuaweiAuthUrl,
  syncGarmin,
  syncHuawei
} from '../../common/request.js'
import {
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  showConfirm
} from '../../common/utils.js'

export default {
  data() {
    return {
      platform: '',
      loading: false,
      bindingStatus: {
        bound: false,
        bindTime: null,
        lastSyncTime: null
      },
      groupId: ''
    }
  },
  computed: {
    platformName() {
      return this.platform === 'garmin' ? '佳明 Connect' : '华为 Health'
    },
    deviceDesc() {
      return this.platform === 'garmin'
        ? '同步佳明手表的跑步运动数据'
        : '同步华为手表的跑步运动数据'
    }
  },
  onLoad(options) {
    this.platform = options.platform || 'garmin'
    this.loadBindingStatus()
    const userInfo = uni.getStorageSync('userInfo')
    this.groupId = userInfo?.member?.groupId || 'default_group'
  },
  methods: {
    async loadBindingStatus() {
      // 模拟绑定状态，实际应该调用云函数获取
      // 这里简化处理
      this.bindingStatus = {
        bound: false,
        bindTime: null,
        lastSyncTime: null
      }
    },

    async startBind() {
      this.loading = true

      try {
        let result
        if (this.platform === 'garmin') {
          result = await getGarminAuthUrl(this.groupId)
        } else {
          result = await getHuaweiAuthUrl(this.groupId)
        }

        if (result.success && result.data.authUrl) {
          // 实际应用中，这里应该打开web-view或使用universal link
          // 简化处理：模拟授权成功
          uni.showModal({
            title: '授权提示',
            content: `请在浏览器中完成${this.platformName}授权，授权成功后返回小程序。`,
            showCancel: false
          })

          // 模拟授权成功
          this.bindingStatus = {
            bound: true,
            bindTime: Date.now(),
            lastSyncTime: null
          }

          showSuccess('绑定成功')
        } else {
          showError(result.error || '获取授权链接失败')
        }
      } catch (err) {
        console.error('绑定失败:', err)
        showError('绑定失败')
      } finally {
        this.loading = false
      }
    },

    async syncData() {
      this.loading = true

      try {
        let result
        if (this.platform === 'garmin') {
          result = await syncGarmin()
        } else {
          result = await syncHuawei()
        }

        if (result.success) {
          showSuccess('同步成功')
          this.bindingStatus.lastSyncTime = Date.now()
        } else {
          showError(result.error || '同步失败')
        }
      } catch (err) {
        console.error('同步失败:', err)
        showError('同步失败')
      } finally {
        this.loading = false
      }
    },

    async unbind() {
      const confirmed = await showConfirm({
        title: '解除绑定',
        content: `确定要解除${this.platformName}绑定吗？解除后将无法自动同步运动数据。`
      })

      if (!confirmed) return

      this.loading = true

      try {
        // 实际应该调用云函数解除绑定
        showSuccess('已解除绑定')
        this.bindingStatus = {
          bound: false,
          bindTime: null,
          lastSyncTime: null
        }
      } catch (err) {
        showError('解除绑定失败')
      } finally {
        this.loading = false
      }
    },

    formatTime(timestamp) {
      if (!timestamp) return '--'
      const date = new Date(timestamp)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${month}/${day} ${hours}:${minutes}`
    }
  }
}
</script>

<style scoped>
.bind-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 30rpx;
}

/* 设备卡片 */
.device-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24rpx;
  padding: 60rpx 30rpx;
  text-align: center;
  color: #fff;
  margin-bottom: 30rpx;
}

.device-card.garmin {
  background: linear-gradient(135deg, #007CC3 0%, #005A8D 100%);
}

.device-card.huawei {
  background: linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%);
}

.device-icon-large {
  width: 140rpx;
  height: 140rpx;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24rpx;
  font-size: 72rpx;
  font-weight: bold;
}

.device-name {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.device-desc {
  font-size: 26rpx;
  opacity: 0.8;
}

/* 状态区块 */
.status-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 28rpx;
  color: #666;
}

.status-value {
  font-size: 28rpx;
  color: #999;
}

.status-value.bound {
  color: #4CAF50;
  font-weight: bold;
}

/* 操作按钮 */
.action-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.bind-btn,
.sync-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sync-btn {
  background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
}

.device-card.garmin .bind-btn,
.device-card.garmin .sync-btn {
  background: linear-gradient(135deg, #007CC3 0%, #005A8D 100%);
}

.device-card.guawei .bind-btn,
.device-card.guawei .sync-btn {
  background: linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%);
}

.unbind-btn {
  width: 100%;
  height: 88rpx;
  background: #fff;
  color: #999;
  border-radius: 44rpx;
  font-size: 28rpx;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 绑定说明 */
.guide-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
}

.guide-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.step {
  display: flex;
  align-items: center;
}

.step-num {
  width: 44rpx;
  height: 44rpx;
  background: #667eea;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: bold;
  margin-right: 16rpx;
}

.step-text {
  font-size: 26rpx;
  color: #666;
  flex: 1;
}

.privacy-note {
  display: flex;
  align-items: flex-start;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-top: 24rpx;
}

.note-icon {
  font-size: 32rpx;
  margin-right: 12rpx;
}

.note-text {
  flex: 1;
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
}
</style>
