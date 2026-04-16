<template>
  <view class="submit-container">
    <!-- 积分分类选择 -->
    <view class="section">
      <view class="section-title">选择积分类型</view>
      <view class="category-list">
        <view
          v-for="category in categories"
          :key="category._id"
          :class="['category-item', { selected: selectedCategory?._id === category._id }]"
          @click="selectCategory(category)"
        >
          <view class="category-icon" :style="{ backgroundColor: category.color }">
            <text>{{ category.icon || '📌' }}</text>
          </view>
          <view class="category-info">
            <text class="category-name">{{ category.name }}</text>
            <text class="category-points">{{ category.defaultPoints }}积分</text>
          </view>
          <view class="check-icon" v-if="selectedCategory?._id === category._id">✓</view>
        </view>
      </view>
    </view>

    <!-- 积分数量 -->
    <view class="section" v-if="selectedCategory">
      <view class="section-title">积分数量</view>
      <view class="points-input">
        <view class="points-btn minus" @click="decreasePoints">−</view>
        <input
          type="number"
          v-model="points"
          class="points-value"
          @blur="validatePoints"
        />
        <view class="points-btn add" @click="increasePoints">+</view>
      </view>
      <view class="points-hint">
        默认：{{ selectedCategory.defaultPoints }}积分
        <text v-if="selectedCategory.requiresApproval" class="approval-tag">需审批</text>
      </view>
    </view>

    <!-- 描述说明 -->
    <view class="section" v-if="selectedCategory">
      <view class="section-title">描述说明</view>
      <textarea
        v-model="description"
        class="description-input"
        placeholder="请输入积分说明..."
        maxlength="200"
      />
    </view>

    <!-- 上传凭证 -->
    <view class="section" v-if="selectedCategory && selectedCategory.requiresImages">
      <UploadImages
        title="上传凭证"
        :required="selectedCategory.requiresImages"
        v-model="images"
        :maxCount="3"
        addText="上传图片"
        tip="上传相关凭证图片以便审核"
      />
    </view>

    <!-- 提交按钮 -->
    <view class="submit-bar">
      <button
        class="submit-btn"
        @click="submitPoints"
        :disabled="!canSubmit || submitting"
      >
        {{ submitting ? '提交中...' : '提交审核' }}
      </button>
    </view>
  </view>
</template>

<script>
import UploadImages from '../../components/upload-images.vue'
import { getPointCategories, submitPoints } from '../../common/request.js'
import { showLoading, hideLoading, showSuccess, showError } from '../../common/utils.js'

export default {
  components: {
    UploadImages
  },
  data() {
    return {
      categories: [],
      selectedCategory: null,
      points: 0,
      description: '',
      images: [],
      submitting: false,
      groupId: ''
    }
  },
  computed: {
    canSubmit() {
      if (!this.selectedCategory) return false
      if (this.points <= 0) return false
      if (this.selectedCategory.requiresImages && this.images.length === 0) return false
      return true
    }
  },
  onLoad() {
    this.loadCategories()
    const userInfo = uni.getStorageSync('userInfo')
    this.groupId = userInfo?.member?.groupId || 'default_group'
  },
  methods: {
    async loadCategories() {
      try {
        showLoading('加载中...')
        const result = await getPointCategories(this.groupId)
        if (result.success) {
          this.categories = result.data || []
        }
      } catch (err) {
        console.error('加载分类失败:', err)
        showError('加载分类失败')
      } finally {
        hideLoading()
      }
    },

    selectCategory(category) {
      this.selectedCategory = category
      this.points = category.defaultPoints || 0
      this.description = ''
      this.images = []
    },

    decreasePoints() {
      if (this.points > 1) {
        this.points--
      }
    },

    increasePoints() {
      this.points++
    },

    validatePoints() {
      if (this.points < 0) this.points = 0
      if (!this.points) this.points = this.selectedCategory?.defaultPoints || 0
    },

    async submitPoints() {
      if (!this.canSubmit) return

      this.submitting = true

      try {
        const result = await submitPoints({
          groupId: this.groupId,
          categoryId: this.selectedCategory._id,
          points: this.points,
          description: this.description,
          images: this.images
        })

        if (result.success) {
          showSuccess('提交成功')
          setTimeout(() => {
            uni.navigateBack()
          }, 1500)
        } else {
          showError(result.error || '提交失败')
        }
      } catch (err) {
        console.error('提交积分失败:', err)
        showError('提交失败')
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped>
.submit-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

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

/* 分类列表 */
.category-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border: 2rpx solid #eee;
  border-radius: 12rpx;
  transition: all 0.2s;
}

.category-item.selected {
  border-color: #667eea;
  background: #F5F7FF;
}

.category-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.category-info {
  flex: 1;
  margin-left: 20rpx;
}

.category-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
}

.category-points {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.check-icon {
  width: 40rpx;
  height: 40rpx;
  background: #667eea;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

/* 积分输入 */
.points-input {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30rpx;
}

.points-btn {
  width: 80rpx;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #667eea;
  font-weight: bold;
}

.points-value {
  width: 200rpx;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  text-align: center;
  font-size: 40rpx;
  font-weight: bold;
}

.points-hint {
  text-align: center;
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #999;
}

.approval-tag {
  background: #FFF3E0;
  color: #FF9800;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-left: 12rpx;
  font-size: 20rpx;
}

/* 描述输入 */
.description-input {
  width: 100%;
  min-height: 160rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

/* 提交按钮 */
.submit-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.submit-btn[disabled] {
  background: #ccc;
  color: #fff;
}
</style>
