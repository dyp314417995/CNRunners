<template>
  <view class="publish-container">
    <!-- 基本信息 -->
    <view class="section">
      <view class="section-title">基本信息</view>

      <view class="form-item">
        <view class="form-label">赛事名称 <text class="required">*</text></view>
        <input
          v-model="formData.name"
          class="form-input"
          placeholder="如：2026北京国际马拉松"
        />
      </view>

      <view class="form-item">
        <view class="form-label">赛事类型 <text class="required">*</text></view>
        <view class="picker-value" @click="showTypePicker = true">
          <text>{{ selectedTypeName }}</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">赛事日期 <text class="required">*</text></view>
        <view class="picker-value" @click="showDatePicker = true">
          <text>{{ formData.date || '请选择赛事日期' }}</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">赛事地点 <text class="required">*</text></view>
        <input
          v-model="formData.location"
          class="form-input"
          placeholder="如：北京市天安门广场"
        />
      </view>

      <view class="form-item">
        <view class="form-label">所属省份</view>
        <input
          v-model="formData.province"
          class="form-input"
          placeholder="如：北京市"
        />
      </view>
    </view>

    <!-- 报名信息 -->
    <view class="section">
      <view class="section-title">报名信息</view>

      <view class="form-item">
        <view class="form-label">报名时间范围</view>
        <input
          v-model="formData.registrationPeriod"
          class="form-input"
          placeholder="如：2026.02.01 - 2026.03.31"
        />
      </view>

      <view class="form-item">
        <view class="form-label">报名费（元）</view>
        <input
          v-model="formData.fee"
          class="form-input"
          type="number"
          placeholder="0 表示免费"
        />
      </view>

      <view class="form-item">
        <view class="form-label">赛事规模（人）</view>
        <input
          v-model="formData.maxCount"
          class="form-input"
          type="number"
          placeholder="最大报名人数"
        />
      </view>

      <view class="form-item">
        <view class="form-label">主办方</view>
        <input
          v-model="formData.organizer"
          class="form-input"
          placeholder="如：中国田径协会"
        />
      </view>
    </view>

    <!-- 竞赛项目 -->
    <view class="section">
      <view class="section-title">竞赛项目</view>

      <view v-for="(cat, index) in formData.categories" :key="index" class="category-item">
        <view class="category-header">
          <input
            v-model="cat.name"
            class="form-input"
            placeholder="项目名称，如：全程马拉松"
          />
          <view class="delete-btn" @click="removeCategory(index)">✕</view>
        </view>
        <view class="category-details">
          <view class="detail-item">
            <text class="detail-label">报名费</text>
            <input v-model="cat.fee" class="detail-input" type="number" placeholder="0" />
          </view>
          <view class="detail-item">
            <text class="detail-label">名额</text>
            <input v-model="cat.quota" class="detail-input" type="number" placeholder="0" />
          </view>
        </view>
      </view>

      <view class="add-category-btn" @click="addCategory">
        <text>+ 添加项目</text>
      </view>
    </view>

    <!-- 联系方式 -->
    <view class="section">
      <view class="section-title">联系方式</view>

      <view class="form-item">
        <view class="form-label">联系电话</view>
        <input
          v-model="formData.contactPhone"
          class="form-input"
          type="tel"
          placeholder="客服电话"
        />
      </view>

      <view class="form-item">
        <view class="form-label">联系邮箱</view>
        <input
          v-model="formData.contactEmail"
          class="form-input"
          type="text"
          placeholder="联系邮箱"
        />
      </view>
    </view>

    <!-- 赛事介绍 -->
    <view class="section">
      <view class="section-title">赛事介绍</view>
      <textarea
        v-model="formData.description"
        class="form-textarea"
        placeholder="请输入赛事介绍内容..."
      />
    </view>

    <!-- 赛道介绍 -->
    <view class="section">
      <view class="section-title">赛道介绍</view>
      <textarea
        v-model="formData.courseDescription"
        class="form-textarea"
        placeholder="请输入赛道介绍..."
      />
    </view>

    <!-- 报名须知 -->
    <view class="section">
      <view class="section-title">报名须知</view>

      <view v-for="(notice, index) in formData.notices" :key="index" class="notice-item">
        <text class="notice-num">{{ index + 1 }}</text>
        <input
          v-model="formData.notices[index]"
          class="form-input"
          placeholder="请输入须知内容"
        />
        <view class="delete-btn" @click="removeNotice(index)">✕</view>
      </view>

      <view class="add-category-btn" @click="addNotice">
        <text>+ 添加须知</text>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button class="submit-btn" :disabled="!canSubmit" @click="submitRace">
        发布赛事
      </button>
    </view>

    <!-- 类型选择器 -->
    <uni-popup v-if="showTypePicker" type="bottom" @close="showTypePicker = false">
      <view class="picker-sheet">
        <view class="picker-header">
          <text class="picker-cancel" @click="showTypePicker = false">取消</text>
          <text class="picker-title">选择赛事类型</text>
          <text class="picker-confirm" @click="confirmType">确定</text>
        </view>
        <picker-view :value="typeIndex" @change="onTypeChange" class="picker-view">
          <picker-view-column>
            <view v-for="(type, index) in raceTypes" :key="type.value" class="picker-item">
              {{ type.name }}
            </view>
          </picker-view-column>
        </picker-view>
      </view>
    </uni-popup>

    <!-- 日期选择器 -->
    <uni-popup v-if="showDatePicker" type="bottom" @close="showDatePicker = false">
      <view class="picker-sheet">
        <view class="picker-header">
          <text class="picker-cancel" @click="showDatePicker = false">取消</text>
          <text class="picker-title">选择赛事日期</text>
          <text class="picker-confirm" @click="confirmDate">确定</text>
        </view>
        <picker-view :value="dateIndex" @change="onDateChange" class="picker-view">
          <picker-view-column>
            <view v-for="(year, index) in years" :key="year" class="picker-item">
              {{ year }}年
            </view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="(month, index) in months" :key="month" class="picker-item">
              {{ month }}月
            </view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="(day, index) in days" :key="day" class="picker-item">
              {{ day }}日
            </view>
          </picker-view-column>
        </picker-view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { publishRace } from '../../common/request.js'

export default {
  data() {
    return {
      showTypePicker: false,
      showDatePicker: false,
      typeIndex: 0,
      dateIndex: [1, 0, 0],
      raceTypes: [
        { value: 'marathon', name: '马拉松' },
        { value: 'half_marathon', name: '半程马拉松' },
        { value: '10k', name: '10公里' },
        { value: '5k', name: '5公里' },
        { value: 'trail', name: '越野跑' },
        { value: 'ultra', name: '超级马拉松' },
        { value: 'fun_run', name: '健康跑' }
      ],
      formData: {
        name: '',
        type: 'marathon',
        date: '',
        location: '',
        province: '',
        registrationPeriod: '',
        fee: 0,
        maxCount: 0,
        organizer: '',
        contactPhone: '',
        contactEmail: '',
        description: '',
        courseDescription: '',
        categories: [],
        notices: []
      },
      years: [],
      months: Array.from({ length: 12 }, (_, i) => i + 1),
      days: Array.from({ length: 31 }, (_, i) => i + 1)
    }
  },
  computed: {
    selectedTypeName() {
      const type = this.raceTypes.find(t => t.value === this.formData.type)
      return type ? type.name : '请选择'
    },
    canSubmit() {
      return this.formData.name && this.formData.date && this.formData.location
    }
  },
  onLoad() {
    const currentYear = new Date().getFullYear()
    this.years = Array.from({ length: 5 }, (_, i) => currentYear + i)
  },
  methods: {
    onTypeChange(e) {
      this.typeIndex = e.detail.value[0]
    },
    confirmType() {
      this.formData.type = this.raceTypes[this.typeIndex].value
      this.showTypePicker = false
    },
    onDateChange(e) {
      this.dateIndex = e.detail.value
    },
    confirmDate() {
      const year = this.years[this.dateIndex[0]]
      const month = String(this.months[this.dateIndex[1]]).padStart(2, '0')
      const day = String(this.days[this.dateIndex[2]]).padStart(2, '0')
      this.formData.date = `${year}-${month}-${day}`
      this.showDatePicker = false
    },
    addCategory() {
      this.formData.categories.push({
        id: 'cat_' + Date.now(),
        name: '',
        fee: 0,
        quota: 0
      })
    },
    removeCategory(index) {
      this.formData.categories.splice(index, 1)
    },
    addNotice() {
      this.formData.notices.push('')
    },
    removeNotice(index) {
      this.formData.notices.splice(index, 1)
    },
    async submitRace() {
      if (!this.canSubmit) return

      uni.showLoading({ title: '发布中...' })

      try {
        const result = await publishRace(this.formData)

        if (result.success) {
          uni.hideLoading()
          uni.showModal({
            title: '发布成功',
            content: '赛事已成功发布',
            showCancel: false,
            success: () => {
              uni.navigateBack()
            }
          })
        } else {
          uni.hideLoading()
          uni.showToast({
            title: result.error || '发布失败',
            icon: 'none'
          })
        }
      } catch (err) {
        uni.hideLoading()
        uni.showToast({
          title: '发布失败',
          icon: 'none'
        })
      }
    }
  }
}
</script>

<style scoped>
.publish-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 40rpx;
}

.section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

.form-item {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 12rpx;
}

.required {
  color: #F44336;
}

.form-input {
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  resize: none;
}

.picker-value {
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 28rpx;
}

.arrow {
  color: #ccc;
  font-size: 32rpx;
}

/* 竞赛项目 */
.category-item {
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.category-header {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.category-header .form-input {
  flex: 1;
}

.delete-btn {
  width: 80rpx;
  height: 80rpx;
  background: #ffebee;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #F44336;
  font-size: 28rpx;
}

.category-details {
  display: flex;
  gap: 20rpx;
}

.detail-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.detail-label {
  font-size: 24rpx;
  color: #666;
}

.detail-input {
  flex: 1;
  height: 60rpx;
  background: #fff;
  border-radius: 8rpx;
  padding: 0 16rpx;
  font-size: 26rpx;
}

.add-category-btn {
  height: 80rpx;
  background: #f0f4ff;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #667eea;
}

/* 须知 */
.notice-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.notice-num {
  width: 40rpx;
  height: 40rpx;
  background: #667eea;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  flex-shrink: 0;
}

.notice-item .form-input {
  flex: 1;
}

/* 提交 */
.submit-section {
  padding: 30rpx;
}

.submit-btn {
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

.submit-btn[disabled] {
  background: #ccc;
  color: #fff;
}

/* 选择器 */
.picker-sheet {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  height: 600rpx;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-cancel {
  font-size: 28rpx;
  color: #999;
}

.picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.picker-confirm {
  font-size: 28rpx;
  color: #667eea;
}

.picker-view {
  height: 400rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #333;
}
</style>
