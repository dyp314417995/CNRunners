<template>
  <view class="running-card" @tap="handleClick">
    <view class="card-left">
      <view class="date">{{ formatDate(startTime) }}</view>
      <view class="source-tag" :class="source">
        {{ sourceText }}
      </view>
    </view>

    <view class="card-middle">
      <view class="main-info">
        <text class="distance">{{ distance }}</text>
        <text class="unit">km</text>
      </view>
    </view>

    <view class="card-right">
      <view class="info-row">
        <text class="label">时长</text>
        <text class="value">{{ durationText }}</text>
      </view>
      <view class="info-row">
        <text class="label">配速</text>
        <text class="value">{{ pace }}</text>
      </view>
      <view v-if="heartRate && heartRate.avg > 0" class="info-row">
        <text class="label">心率</text>
        <text class="value">{{ heartRate.avg }}bpm</text>
      </view>
    </view>
  </view>
</template>

<script>
import { formatDate, formatDuration } from '../common/utils.js'

export default {
  name: 'RunningCard',
  props: {
    startTime: {
      type: [Date, String, Number],
      default: null
    },
    distance: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0 // 秒
    },
    pace: {
      type: String,
      default: '--\'--"'
    },
    heartRate: {
      type: Object,
      default: null
    },
    source: {
      type: String,
      default: 'manual' // garmin, huawei, manual
    }
  },
  computed: {
    sourceText() {
      const map = {
        garmin: '佳明',
        huawei: '华为',
        manual: '手动'
      }
      return map[this.source] || this.source
    },
    durationText() {
      return formatDuration(this.duration)
    }
  },
  methods: {
    formatDate(time) {
      if (!time) return '--'
      const date = new Date(time)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${month}/${day} ${hours}:${minutes}`
    },
    handleClick() {
      this.$emit('click')
    }
  }
}
</script>

<style scoped>
.running-card {
  display: flex;
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  align-items: center;
}

.card-left {
  width: 140rpx;
}

.date {
  font-size: 26rpx;
  color: #333;
  font-weight: 500;
}

.source-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-top: 8rpx;
  display: inline-block;
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

.card-middle {
  flex: 1;
  padding-left: 24rpx;
}

.main-info {
  display: flex;
  align-items: baseline;
}

.distance {
  font-size: 48rpx;
  font-weight: bold;
  color: #007AFF;
}

.unit {
  font-size: 24rpx;
  color: #999;
  margin-left: 8rpx;
}

.card-right {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  align-items: flex-end;
}

.info-row {
  display: flex;
  gap: 8rpx;
  font-size: 22rpx;
}

.info-row .label {
  color: #999;
}

.info-row .value {
  color: #666;
  font-weight: 500;
}
</style>
