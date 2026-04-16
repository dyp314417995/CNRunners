<template>
  <view class="stat-card" :style="{ backgroundColor: bgColor }">
    <view class="stat-value">{{ displayValue }}</view>
    <view class="stat-label">{{ label }}</view>
    <view v-if="suffix" class="stat-suffix">{{ suffix }}</view>
  </view>
</template>

<script>
export default {
  name: 'StatCard',
  props: {
    value: {
      type: [Number, String],
      default: 0
    },
    label: {
      type: String,
      default: ''
    },
    suffix: {
      type: String,
      default: ''
    },
    bgColor: {
      type: String,
      default: '#FFFFFF'
    },
    decimals: {
      type: Number,
      default: 0
    }
  },
  computed: {
    displayValue() {
      if (typeof this.value === 'number') {
        return this.value.toFixed(this.decimals)
      }
      return this.value
    }
  }
}
</script>

<style scoped>
.stat-card {
  padding: 20rpx;
  border-radius: 12rpx;
  text-align: center;
  min-width: 180rpx;
}

.stat-value {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.stat-suffix {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}
</style>
