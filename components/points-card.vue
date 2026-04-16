<template>
  <view class="points-card" @tap="handleClick">
    <view class="card-header">
      <view class="category-tag" :style="{ backgroundColor: categoryColor }">
        {{ categoryName }}
      </view>
      <view class="points-value" :class="{ positive: points > 0, negative: points < 0 }">
        {{ points > 0 ? '+' : '' }}{{ points }}
      </view>
    </view>

    <view v-if="description" class="card-body">
      {{ description }}
    </view>

    <view class="card-footer">
      <view class="time">{{ formatTime(createTime) }}</view>
      <view class="status" :class="statusClass">
        {{ statusText }}
      </view>
    </view>

    <view v-if="images && images.length > 0" class="images">
      <image
        v-for="(img, index) in images"
        :key="index"
        :src="img"
        mode="aspectFill"
        class="image-item"
        @tap.stop="previewImage(img)"
      />
    </view>
  </view>
</template>

<script>
import { formatDate } from '../common/utils.js'

export default {
  name: 'PointsCard',
  props: {
    categoryName: {
      type: String,
      default: ''
    },
    categoryColor: {
      type: String,
      default: '#4CAF50'
    },
    points: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      default: ''
    },
    images: {
      type: Array,
      default: () => []
    },
    status: {
      type: String,
      default: 'approved' // pending, approved, rejected
    },
    createTime: {
      type: [Date, String, Number],
      default: null
    }
  },
  computed: {
    statusClass() {
      return {
        pending: this.status === 'pending',
        approved: this.status === 'approved',
        rejected: this.status === 'rejected'
      }
    },
    statusText() {
      const map = {
        pending: '待审批',
        approved: '已通过',
        rejected: '已拒绝'
      }
      return map[this.status] || this.status
    }
  },
  methods: {
    formatTime(time) {
      return formatDate(time, 'MM-DD HH:mm')
    },
    handleClick() {
      this.$emit('click')
    },
    previewImage(url) {
      uni.previewImage({
        urls: [url],
        current: url
      })
    }
  }
}
</script>

<style scoped>
.points-card {
  background: #fff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-tag {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
  color: #fff;
}

.points-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.points-value.positive {
  color: #4CAF50;
}

.points-value.negative {
  color: #F44336;
}

.card-body {
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.status {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.status.pending {
  background: #FFF3E0;
  color: #FF9800;
}

.status.approved {
  background: #E8F5E9;
  color: #4CAF50;
}

.status.rejected {
  background: #FFEBEE;
  color: #F44336;
}

.images {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16rpx;
  gap: 12rpx;
}

.image-item {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
}
</style>
