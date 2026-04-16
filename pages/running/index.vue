<template>
  <view class="running-container">
    <!-- 月度目标 -->
    <view class="month-goal">
      <view class="goal-header">
        <text class="goal-title">本月累计</text>
        <text class="goal-target">目标: {{ monthGoal }}km</text>
      </view>
      <view class="goal-progress">
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: monthProgress + '%' }"></view>
        </view>
        <text class="progress-text">{{ monthDistance }}km</text>
      </view>
      <view class="goal-percent">{{ monthProgress }}%</view>
    </view>

    <!-- 周趋势图 -->
    <view class="section week-trend">
      <view class="section-title">本周趋势</view>
      <view class="trend-chart">
        <view
          v-for="(day, index) in weekTrend"
          :key="index"
          class="trend-item"
        >
          <view class="trend-bar-container">
            <view
              class="trend-bar"
              :style="{ height: getTrendHeight(day.distance) + 'rpx' }"
            ></view>
          </view>
          <text class="trend-label">{{ day.dayName }}</text>
        </view>
      </view>
    </view>

    <!-- 设备绑定状态 -->
    <view class="section device-status">
      <view class="section-title">数据同步</view>
      <view class="device-list">
        <view class="device-item" @click="syncGarmin">
          <view class="device-icon garmin">G</view>
          <view class="device-info">
            <text class="device-name">佳明 Connect</text>
            <text class="device-hint">{{ garminStatus }}</text>
          </view>
          <view class="sync-btn" v-if="garminBound">
            <text>同步</text>
          </view>
          <view class="bind-btn" v-else @click.stop="goToBind('garmin')">
            <text>去绑定</text>
          </view>
        </view>

        <view class="device-item" @click="syncHuawei">
          <view class="device-icon huawei">H</view>
          <view class="device-info">
            <text class="device-name">华为 Health</text>
            <text class="device-hint">{{ huaweiStatus }}</text>
          </view>
          <view class="sync-btn" v-if="huaweiBound">
            <text>同步</text>
          </view>
          <view class="bind-btn" v-else @click.stop="goToBind('huawei')">
            <text>去绑定</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 最近跑步 -->
    <view class="section recent-runs">
      <view class="section-header">
        <text class="section-title">最近跑步</text>
        <text class="section-more" @click="goToHistory">查看全部 →</text>
      </view>

      <view v-if="recentRuns.length === 0" class="empty-state">
        <text class="empty-icon">🏃</text>
        <text class="empty-text">暂无跑步记录</text>
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
  </view>
</template>

<script>
import RunningCard from '../../components/running-card.vue'
import { getRunningSummary, getRunningRecords, syncGarmin, syncHuawei } from '../../common/request.js'
import { showLoading, hideLoading, showSuccess, showError } from '../../common/utils.js'

export default {
  components: {
    RunningCard
  },
  data() {
    return {
      monthDistance: 0,
      monthGoal: 80,
      monthProgress: 0,
      weekTrend: [],
      recentRuns: [],
      garminBound: false,
      huaweiBound: false,
      garminLastSync: null,
      huaweiLastSync: null,
      groupId: ''
    }
  },
  computed: {
    garminStatus() {
      if (!this.garminBound) return '未绑定'
      if (this.garminLastSync) {
        return `上次同步: ${this.formatTime(this.garminLastSync)}`
      }
      return '已绑定'
    },
    huaweiStatus() {
      if (!this.huaweiBound) return '未绑定'
      if (this.huaweiLastSync) {
        return `上次同步: ${this.formatTime(this.huaweiLastSync)}`
      }
      return '已绑定'
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
      showLoading('加载中...')

      try {
        const userInfo = uni.getStorageSync('userInfo')
        this.groupId = userInfo?.member?.groupId || 'default_group'

        // 获取跑步摘要
        const summaryResult = await getRunningSummary(this.groupId)
        if (summaryResult.success) {
          const { month, weekTrend } = summaryResult.data
          this.monthDistance = month.distance
          this.monthProgress = Math.min(100, Math.round((this.monthDistance / this.monthGoal) * 100))
          this.weekTrend = weekTrend || []
        }

        // 获取近期记录
        const recordsResult = await getRunningRecords(this.groupId, { pageSize: 5 })
        if (recordsResult.success) {
          this.recentRuns = recordsResult.data.list || []
        }
      } catch (err) {
        console.error('加载数据失败:', err)
      } finally {
        hideLoading()
      }
    },

    getTrendHeight(distance) {
      const max = Math.max(...this.weekTrend.map(d => d.distance), 1)
      return Math.max(10, (distance / max) * 100)
    },

    formatTime(timestamp) {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${month}/${day} ${hours}:${minutes}`
    },

    goToBind(platform) {
      uni.navigateTo({ url: `/pages/profile/bind?platform=${platform}` })
    },

    async syncGarmin() {
      if (!this.garminBound) return
      try {
        showLoading('同步中...')
        const result = await syncGarmin()
        if (result.success) {
          showSuccess('同步成功')
          this.loadData()
        } else {
          showError(result.error || '同步失败')
        }
      } catch (err) {
        showError('同步失败')
      } finally {
        hideLoading()
      }
    },

    async syncHuawei() {
      if (!this.huaweiBound) return
      try {
        showLoading('同步中...')
        const result = await syncHuawei()
        if (result.success) {
          showSuccess('同步成功')
          this.loadData()
        } else {
          showError(result.error || '同步失败')
        }
      } catch (err) {
        showError('同步失败')
      } finally {
        hideLoading()
      }
    },

    goToHistory() {
      uni.navigateTo({ url: '/pages/running/history' })
    },

    goToRunDetail(id) {
      uni.navigateTo({ url: `/pages/running/detail?id=${id}` })
    }
  }
}
</script>

<style scoped>
.running-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20rpx;
}

/* 月度目标 */
.month-goal {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  color: #fff;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.goal-title {
  font-size: 28rpx;
  opacity: 0.9;
}

.goal-target {
  font-size: 24rpx;
  opacity: 0.7;
}

.goal-progress {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.progress-bar {
  flex: 1;
  height: 16rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #fff;
  border-radius: 8rpx;
  transition: width 0.3s;
}

.progress-text {
  font-size: 32rpx;
  font-weight: bold;
}

.goal-percent {
  text-align: right;
  font-size: 48rpx;
  font-weight: bold;
  margin-top: 10rpx;
}

/* 区块 */
.section {
  background: #fff;
  margin: 20rpx 30rpx;
  border-radius: 16rpx;
  padding: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-more {
  font-size: 24rpx;
  color: #999;
}

/* 周趋势图 */
.week-trend {
  padding-bottom: 10rpx;
}

.trend-chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 200rpx;
}

.trend-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.trend-bar-container {
  height: 150rpx;
  display: flex;
  align-items: flex-end;
}

.trend-bar {
  width: 40rpx;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 8rpx 8rpx 0 0;
  min-height: 10rpx;
}

.trend-label {
  font-size: 20rpx;
  color: #999;
  margin-top: 12rpx;
}

/* 设备列表 */
.device-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.device-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
}

.device-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
}

.device-icon.garmin {
  background: #007CC3;
}

.device-icon.huawei {
  background: #D32F2F;
}

.device-info {
  flex: 1;
  margin-left: 20rpx;
}

.device-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.device-hint {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.sync-btn {
  background: #667eea;
  color: #fff;
  font-size: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
}

.bind-btn {
  background: #fff;
  color: #667eea;
  font-size: 24rpx;
  padding: 12rpx 24rpx;
  border-radius: 24rpx;
  border: 2rpx solid #667eea;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #666;
}
</style>
