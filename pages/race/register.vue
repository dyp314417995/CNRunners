<template>
  <view class="register-container">
    <!-- 赛事信息卡片 -->
    <view class="race-card">
      <view class="race-name">{{ raceInfo.name }}</view>
      <view class="race-meta">
        <text>📅 {{ raceInfo.dateStr }}</text>
        <text>📍 {{ raceInfo.location }}</text>
      </view>
      <view class="race-category">
        报名项目：<text class="category-name">{{ categoryName }}</text>
      </view>
    </view>

    <!-- 报名人信息 -->
    <view class="section">
      <view class="section-title">报名人信息</view>

      <view class="form-item">
        <view class="form-label">姓名 <text class="required">*</text></view>
        <input
          v-model="formData.name"
          class="form-input"
          placeholder="请输入真实姓名"
        />
      </view>

      <view class="form-item">
        <view class="form-label">性别 <text class="required">*</text></view>
        <view class="gender-select">
          <view
            class="gender-option"
            :class="{ active: formData.gender === 'male' }"
            @click="formData.gender = 'male'"
          >
            <text>👨 男</text>
          </view>
          <view
            class="gender-option"
            :class="{ active: formData.gender === 'female' }"
            @click="formData.gender = 'female'"
          >
            <text>👩 女</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">证件类型 <text class="required">*</text></view>
        <view class="picker-value" @click="showIdTypePicker = true">
          <text>{{ idTypeName }}</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">证件号码 <text class="required">*</text></view>
        <input
          v-model="formData.idNumber"
          class="form-input"
          placeholder="请输入证件号码"
        />
      </view>

      <view class="form-item">
        <view class="form-label">出生日期 <text class="required">*</text></view>
        <view class="picker-value" @click="showBirthPicker = true">
          <text>{{ formData.birthday || '请选择出生日期' }}</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">手机号码 <text class="required">*</text></view>
        <input
          v-model="formData.phone"
          class="form-input"
          type="number"
          placeholder="请输入手机号码"
        />
      </view>

      <view class="form-item">
        <view class="form-label">电子邮箱</view>
        <input
          v-model="formData.email"
          class="form-input"
          type="text"
          placeholder="用于接收电子收据"
        />
      </view>

      <view class="form-item">
        <view class="form-label">紧急联系人</view>
        <input
          v-model="formData.emergencyContact"
          class="form-input"
          placeholder="请输入紧急联系人姓名"
        />
      </view>

      <view class="form-item">
        <view class="form-label">紧急联系电话</view>
        <input
          v-model="formData.emergencyPhone"
          class="form-input"
          type="number"
          placeholder="请输入紧急联系电话"
        />
      </view>

      <view class="form-item">
        <view class="form-label">血型</view>
        <view class="blood-type-select">
          <view
            v-for="type in bloodTypes"
            :key="type"
            class="blood-option"
            :class="{ active: formData.bloodType === type }"
            @click="formData.bloodType = type"
          >
            {{ type }}
          </view>
        </view>
      </view>

      <view class="form-item">
        <view class="form-label">服装尺码 <text class="required">*</text></view>
        <view class="size-select">
          <view
            v-for="size in sizes"
            :key="size"
            class="size-option"
            :class="{ active: formData.clothingSize === size }"
            @click="formData.clothingSize = size"
          >
            {{ size }}
          </view>
        </view>
      </view>
    </view>

    <!-- 参赛声明 -->
    <view class="section">
      <view class="section-title">参赛声明</view>
      <view class="declare-content">
        <view class="declare-title">我自愿报名参加上述赛事，作出以下声明：</view>
        <view class="declare-text">
          1. 我了解参加本次赛事需要具备完全行为能力，并承诺本人身体状况符合参加本次赛事的条件。<br/><br/>
          2. 我了解本次赛事可能存在的风险，并自愿承担因参加本次赛事而产生的一切后果。<br/><br/>
          3. 我同意并授权主办方在本次赛事中进行摄影、摄像，并同意主办方使用相关照片、视频等用于赛事宣传。<br/><br/>
          4. 我承诺填写的报名信息真实有效，如有虚假愿承担相应责任。<br/><br/>
          5. 我已认真阅读并充分了解本次赛事的竞赛规程和报名须知，同意遵守相关规定。
        </view>
      </view>
      <view class="agree-row" @click="agreed = !agreed">
        <view class="checkbox" :class="{ checked: agreed }">
          <text v-if="agreed">✓</text>
        </view>
        <text class="agree-text">我已阅读并同意以上声明</text>
      </view>
    </view>

    <!-- 费用明细 -->
    <view class="section">
      <view class="section-title">费用明细</view>
      <view class="fee-list">
        <view class="fee-item">
          <text>报名费</text>
          <text>¥{{ categoryFee }}</text>
        </view>
        <view class="fee-item">
          <text>保险费（必选）</text>
          <text>¥10</text>
        </view>
        <view class="fee-item total">
          <text>合计</text>
          <text class="total-value">¥{{ totalFee }}</text>
        </view>
      </view>
    </view>

    <!-- 底部提交栏 -->
    <view class="bottom-bar">
      <view class="price-info">
        <text class="price-label">支付金额</text>
        <text class="price-value">¥{{ totalFee }}</text>
      </view>
      <button class="submit-btn" :disabled="!canSubmit" @click="submitRegistration">
        提交报名
      </button>
    </view>

    <!-- 证件类型选择器 -->
    <uni-popup v-if="showIdTypePicker" type="bottom" @close="showIdTypePicker = false">
      <view class="picker-sheet">
        <view class="picker-header">
          <text class="picker-cancel" @click="showIdTypePicker = false">取消</text>
          <text class="picker-title">选择证件类型</text>
          <text class="picker-confirm" @click="confirmIdType">确定</text>
        </view>
        <picker-view :value="idTypeIndex" @change="onIdTypeChange" class="picker-view">
          <picker-view-column>
            <view v-for="(type, index) in idTypes" :key="type.value" class="picker-item">
              {{ type.name }}
            </view>
          </picker-view-column>
        </picker-view>
      </view>
    </uni-popup>

    <!-- 出生日期选择器 -->
    <uni-popup v-if="showBirthPicker" type="bottom" @close="showBirthPicker = false">
      <view class="picker-sheet">
        <view class="picker-header">
          <text class="picker-cancel" @click="showBirthPicker = false">取消</text>
          <text class="picker-title">选择出生日期</text>
          <text class="picker-confirm" @click="confirmBirth">确定</text>
        </view>
        <picker-view :value="birthIndex" @change="onBirthChange" class="picker-view">
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
export default {
  data() {
    return {
      raceId: '',
      categoryId: '',
      raceInfo: {},
      categoryName: '',
      categoryFee: 0,
      agreed: false,
      showIdTypePicker: false,
      showBirthPicker: false,
      idTypeIndex: 0,
      birthIndex: [30, 0, 0], // 默认30岁
      idTypes: [
        { value: 'id_card', name: '身份证' },
        { value: 'passport', name: '护照' },
        { value: 'hk_pass', name: '港澳通行证' },
        { value: 'tw_pass', name: '台湾通行证' }
      ],
      bloodTypes: ['A', 'B', 'O', 'AB', '不详'],
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
      formData: {
        name: '',
        gender: '',
        idType: 'id_card',
        idNumber: '',
        birthday: '',
        phone: '',
        email: '',
        emergencyContact: '',
        emergencyPhone: '',
        bloodType: '',
        clothingSize: ''
      },
      years: [],
      months: Array.from({ length: 12 }, (_, i) => i + 1),
      days: Array.from({ length: 31 }, (_, i) => i + 1)
    }
  },
  computed: {
    idTypeName() {
      const type = this.idTypes.find(t => t.value === this.formData.idType)
      return type ? type.name : '身份证'
    },
    totalFee() {
      return this.categoryFee + 10
    },
    canSubmit() {
      return this.agreed &&
        this.formData.name &&
        this.formData.gender &&
        this.formData.idNumber &&
        this.formData.birthday &&
        this.formData.phone &&
        this.formData.clothingSize
    }
  },
  onLoad(options) {
    this.raceId = options.raceId || '1'
    this.categoryId = options.categoryId || 'full'
    this.initYears()
    this.loadRaceInfo()
    this.loadCurrentUser()
  },
  methods: {
    initYears() {
      const currentYear = new Date().getFullYear()
      this.years = Array.from({ length: 60 }, (_, i) => currentYear - 18 - i)
    },
    loadRaceInfo() {
      // 模拟数据
      this.raceInfo = {
        name: '2026北京国际马拉松',
        dateStr: '2026年4月20日',
        location: '北京市天安门广场'
      }

      const categories = {
        full: { name: '全程马拉松', fee: 200 },
        half: { name: '半程马拉松', fee: 150 },
        '10k': { name: '10公里', fee: 100 }
      }

      const cat = categories[this.categoryId] || categories.full
      this.categoryName = cat.name
      this.categoryFee = cat.fee
    },
    loadCurrentUser() {
      const userInfo = uni.getStorageSync('userInfo')
      if (userInfo) {
        this.formData.name = userInfo.user?.nickName || ''
        this.formData.phone = userInfo.user?.phone || ''
      }
    },
    onIdTypeChange(e) {
      this.idTypeIndex = e.detail.value[0]
    },
    confirmIdType() {
      this.formData.idType = this.idTypes[this.idTypeIndex].value
      this.showIdTypePicker = false
    },
    onBirthChange(e) {
      this.birthIndex = e.detail.value
    },
    confirmBirth() {
      const year = this.years[this.birthIndex[0]]
      const month = String(this.months[this.birthIndex[1]]).padStart(2, '0')
      const day = String(this.days[this.birthIndex[2]]).padStart(2, '0')
      this.formData.birthday = `${year}-${month}-${day}`
      this.showBirthPicker = false
    },
    async submitRegistration() {
      if (!this.canSubmit) return

      uni.showLoading({ title: '提交中...' })

      try {
        // 实际调用云函数
        // const result = await registerRace({
        //   raceId: this.raceId,
        //   categoryId: this.categoryId,
        //   ...this.formData
        // })

        // 模拟提交成功
        await new Promise(resolve => setTimeout(resolve, 1500))

        uni.hideLoading()
        uni.showModal({
          title: '报名成功',
          content: '您已成功报名2026北京国际马拉松，请在我的报名中查看详情。',
          showCancel: false,
          success: () => {
            uni.redirectTo({ url: '/pages/race/my' })
          }
        })
      } catch (err) {
        uni.hideLoading()
        uni.showToast({
          title: '报名失败，请重试',
          icon: 'none'
        })
      }
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 160rpx;
}

/* 赛事信息卡片 */
.race-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 30rpx;
  color: #fff;
}

.race-name {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.race-meta {
  display: flex;
  gap: 30rpx;
  font-size: 24rpx;
  opacity: 0.9;
  margin-bottom: 12rpx;
}

.race-category {
  font-size: 26rpx;
  opacity: 0.9;
}

.category-name {
  font-weight: bold;
}

/* 通用区块 */
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

/* 表单项 */
.form-item {
  margin-bottom: 30rpx;
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

/* 性别选择 */
.gender-select {
  display: flex;
  gap: 20rpx;
}

.gender-option {
  flex: 1;
  height: 80rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.gender-option.active {
  background: #667eea;
  color: #fff;
}

/* 血型选择 */
.blood-type-select {
  display: flex;
  gap: 16rpx;
}

.blood-option {
  width: 80rpx;
  height: 60rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
}

.blood-option.active {
  background: #667eea;
  color: #fff;
}

/* 尺码选择 */
.size-select {
  display: flex;
  gap: 12rpx;
}

.size-option {
  flex: 1;
  height: 70rpx;
  background: #f8f8f8;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
}

.size-option.active {
  background: #667eea;
  color: #fff;
}

/* 参赛声明 */
.declare-content {
  background: #f8f8f8;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.declare-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.declare-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
}

.agree-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.checkbox {
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #ccc;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: #fff;
}

.checkbox.checked {
  background: #667eea;
  border-color: #667eea;
}

.agree-text {
  font-size: 28rpx;
  color: #333;
}

/* 费用明细 */
.fee-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.fee-item {
  display: flex;
  justify-content: space-between;
  font-size: 28rpx;
  color: #666;
}

.fee-item.total {
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
  font-weight: bold;
  color: #333;
}

.total-value {
  font-size: 36rpx;
  color: #F44336;
}

/* 底部提交栏 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.price-info {
  display: flex;
  flex-direction: column;
}

.price-label {
  font-size: 24rpx;
  color: #999;
}

.price-value {
  font-size: 40rpx;
  color: #F44336;
  font-weight: bold;
}

.submit-btn {
  width: 280rpx;
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
