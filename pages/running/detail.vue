<template>
  <view class="detail-container">
    <!-- 地图区域占位 -->
    <view class="map-placeholder">
      <text class="map-icon">🗺️</text>
      <text class="map-text">地图加载中...</text>
    </view>

    <!-- 运动数据 -->
    <view class="data-section">
      <view class="main-data">
        <view class="distance-block">
          <text class="distance-value">{{ record.distance }}</text>
          <text class="distance-unit">公里</text>
        </view>
        <view class="duration-block">
          <text class="duration-value">{{ durationText }}</text>
          <text class="duration-label">时长</text>
        </view>
      </view>

      <view class="sub-data">
        <view class="data-item">
          <text class="data-value">{{ record.pace || '--'--" }}</text>
          <text class="data-label">配速</text>
        </view>
        <view class="data-item">
          <text class="data-value">{{ record.calories || 0 }}</text>
          <text class="data-label">卡路里</text>
        </view>
        <view class="data-item">
          <text class="data-value">{{ heartRateAvg }}</text>
          <text class="data-label">平均心率</text>
        </view>
      </view>
    </view>

    <!-- 详细信息 -->
    <view class="info-section">
      <view class="info-row">
        <text class="info-label">开始时间</text>
        <text class="info-value">{{ formatDateTime(record.startTime) }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">结束时间</text>
        <text class="info-value">{{ formatDateTime(record.endTime) }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">数据来源</text>
        <text class="info-value source-tag" :class="record.source">
          {{ sourceText }}
        </text>
      </view>
    </view>

    <!-- 心率数据 -->
    <view class="heartrate-section" v-if="record.heartRate">
      <view class="section-title">心率数据</view>
      <view class="heartrate-chart">
        <view class="hr-item">
          <text class="hr-value">{{ record.heartRate.avg || 0 }}</text>
          <text class="hr-label">平均</text>
        </view>
        <view class="hr-item">
          <text class="hr-value">{{ record.heartRate.max || 0 }}</text>
          <text class="hr-label">最大</text>
        </view>
        <view class="hr-item">
          <text class="hr-value">{{ record.heartRate.min || 0 }}</text>
          <text class="hr-label">最小</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { formatDate, formatDuration } from '../../common/utils.js'

export default {
  data() {
    return {
      record: {
        distance: 0,
        duration: 0,
        pace: '--\'--"',
        calories: 0,
        heartRate: { avg: 0, max: 0, min: 0 },
        startTime: null,
        endTime: null,
        source: 'manual'
      }
    }
  },
  onLoad(options) {
    if (options.id) {
      // 实际应该根据ID加载记录详情
      // 这里使用模拟数据
      this.record = {
        _id: options.id,
        distance: 5.2,
        duration: 1800,
        pace: "5'45\"",
        calories: 320,
        heartRate: { avg: 145, max: 175, min: 120 },
        startTime: new Date(),
        endTime: new Date(Date.now() + 1800000),
        source: 'garmin'
      }
    }
  },
  computed: {
    durationText() {
      return formatDuration(this.record.duration)
    },
    heartRateAvg() {
      return this.record.heartRate?.avg ? `${this.record.heartRate.avg} bpm` : '--'
    },
    sourceText() {
      const map = {
        garmin: '佳明 Connect',
        huawei: '华为 Health',
        manual: '手动录入'
      }
      return map[this.record.source] || this.record.source
    }
  },
  methods: {
    formatDateTime(date) {
      if (!date) return '--'
      return formatDate(date, 'YYYY-MM-DD HH:mm')
    }
  }
}
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 地图占位 */
.map-placeholder {
  height: 400rpx;
  background: linear-gradient(180deg, #E8E8E8 0%, #F5F5F5 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.map-icon {
  font-size: 80rpx;
  margin-bottom: 16rpx;
}

.map-text {
  font-size: 26rpx;
  color: #999;
}

/* 运动数据 */
.data-section {
  background: #fff;
  padding: 40rpx 30rpx;
  margin-bottom: 20rpx;
}

.main-data {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-bottom: 30rpx;
  border-bottom: 1rpx solid #eee;
}

.distance-block {
  text-align: center;
}

.distance-value {
  font-size: 80rpx;
  font-weight: bold;
  color: #667eea;
}

.distance-unit {
  font-size: 28rpx;
  color: #999;
  margin-left: 8rpx;
}

.duration-block {
  text-align: center;
}

.duration-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.duration-label {
  font-size: 24rpx;
  color: #999;
}

.sub-data {
  display: flex;
  justify-content: space-around;
  margin-top: 30rpx;
}

.data-item {
  text-align: center;
}

.data-value {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.data-label {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

/* 详细信息 */
.info-section {
  background: #fff;
  padding: 20rpx 30rpx;
  margin-bottom: 20rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
}

.source-tag {
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 24rpx;
}

.source-tag.garmin {
  background: #E3F2FD;
  color: #1976D2;
}

.source-tag.huawei {
  background: #FFEBEE;
  color: #D32F2F;
}

.source-tag.manual {
  background: #F5F5F5;
  color: #757575;
}

/* 心率数据 */
.heartrate-section {
  background: #fff;
  padding: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.heartrate-chart {
  display: flex;
  justify-content: space-around;
}

.hr-item {
  text-align: center;
}

.hr-value {
  font-size: 48rpx;
  font-weight: bold;
  color: #F44336;
  display: block;
}

.hr-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
  display: block;
}
</style>
