<template>
  <view class="detail-container">
    <!-- 赛事封面 -->
    <view class="race-header" :style="{ background: race.coverGradient }">
      <view class="back-btn" @click="goBack">
        <text>‹</text>
      </view>
      <view class="header-content">
        <view class="race-type">{{ race.typeName }}</view>
        <view class="race-name">{{ race.name }}</view>
        <view class="race-date-location">
          <text>📅 {{ race.dateStr }}</text>
          <text>📍 {{ race.location }}</text>
        </view>
      </view>
    </view>

    <!-- 赛事信息 -->
    <view class="info-section">
      <view class="info-row">
        <view class="info-item">
          <text class="info-label">报名时间</text>
          <text class="info-value">{{ race.registrationPeriod }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">赛事规模</text>
          <text class="info-value">{{ race.maxCount }}人</text>
        </view>
      </view>
      <view class="info-row">
        <view class="info-item">
          <text class="info-label">已报名</text>
          <text class="info-value highlight">{{ race.registeredCount }}人</text>
        </view>
        <view class="info-item">
          <text class="info-label">报名费</text>
          <text class="info-value highlight">¥{{ race.fee }}</text>
        </view>
      </view>
    </view>

    <!-- 竞赛项目 -->
    <view class="section">
      <view class="section-title">竞赛项目</view>
      <view class="race-categories">
        <view
          v-for="cat in race.categories"
          :key="cat.id"
          class="category-card"
          :class="{ selected: selectedCategory === cat.id }"
          @click="selectCategory(cat)"
        >
          <view class="category-name">{{ cat.name }}</view>
          <view class="category-info">
            <text>¥{{ cat.fee }}</text>
            <text class="sep">|</text>
            <text>{{ cat.registered }}/{{ cat.quota }}</text>
          </view>
          <view v-if="cat.quota - cat.registered < 50" class="quota-warning">
            剩余 {{ cat.quota - cat.registered }} 名
          </view>
        </view>
      </view>
    </view>

    <!-- 赛事详情 -->
    <view class="section">
      <view class="section-title">赛事介绍</view>
      <view class="race-description">
        <rich-text :nodes="race.description"></rich-text>
      </view>
    </view>

    <!-- 赛道信息 -->
    <view class="section">
      <view class="section-title">赛道介绍</view>
      <view class="course-info">
        <image
          v-if="race.courseImage"
          :src="race.courseImage"
          class="course-map"
          mode="widthFix"
        />
        <view class="course-desc">{{ race.courseDescription }}</view>
      </view>
    </view>

    <!-- 报名须知 -->
    <view class="section">
      <view class="section-title">报名须知</view>
      <view class="notice-list">
        <view v-for="(notice, index) in race.notices" :key="index" class="notice-item">
          <view class="notice-num">{{ index + 1 }}</view>
          <view class="notice-content">{{ notice }}</view>
        </view>
      </view>
    </view>

    <!-- 联系主办方 -->
    <view class="section">
      <view class="section-title">联系方式</view>
      <view class="contact-item">
        <text class="contact-icon">📞</text>
        <text class="contact-text">{{ race.contactPhone }}</text>
      </view>
      <view v-if="race.contactEmail" class="contact-item">
        <text class="contact-icon">📧</text>
        <text class="contact-text">{{ race.contactEmail }}</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <view class="action-icons">
        <view class="action-icon-item" @click="toggleFollow">
          <text class="icon">{{ isFollowed ? '❤️' : '🤍' }}</text>
          <text class="icon-text">{{ isFollowed ? '已关注' : '关注' }}</text>
        </view>
        <view class="action-icon-item" @click="shareRace">
          <text class="icon">📤</text>
          <text class="icon-text">分享</text>
        </view>
      </view>
      <view class="register-area">
        <view v-if="race.fee > 0" class="price-info">
          <text class="price-value">¥{{ selectedCatFee }}</text>
        </view>
        <button
          class="register-btn"
          :class="{ disabled: !canRegister }"
          @click="goToRegister"
        >
          {{ registerBtnText }}
        </button>
      </view>
    </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      raceId: '',
      race: {},
      selectedCategory: '',
      selectedCatFee: 0,
      isFollowed: false
    }
  },
  computed: {
    canRegister() {
      return this.race.status === 'registration_open' && this.selectedCategory
    },
    registerBtnText() {
      if (this.race.status === 'registration_closed') return '报名已截止'
      if (this.race.status === 'ended') return '赛事已结束'
      if (!this.selectedCategory) return '请选择项目'
      return '立即报名'
    }
  },
  onLoad(options) {
    this.raceId = options.id || '1'
    this.loadRaceDetail()
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },
    loadRaceDetail() {
      // 模拟数据
      this.race = {
        _id: '1',
        name: '2026北京国际马拉松',
        typeName: '马拉松',
        type: 'marathon',
        dateStr: '2026年4月20日',
        location: '北京市天安门广场',
        province: '北京',
        status: 'registration_open',
        coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        registrationPeriod: '2026.02.01 - 2026.03.31',
        maxCount: 30000,
        registeredCount: 15000,
        fee: 200,
        contactPhone: '400-888-8888',
        contactEmail: 'info@beijingmarathon.cn',
        categories: [
          { id: 'full', name: '全程马拉松', fee: 200, quota: 15000, registered: 8000 },
          { id: 'half', name: '半程马拉松', fee: 150, quota: 10000, registered: 5000 },
          { id: '10k', name: '10公里', fee: 100, quota: 5000, registered: 2000 }
        ],
        description: `
          <p>北京国际马拉松创办于1981年，是中国最负盛名的马拉松赛事之一。</p>
          <p>2026年北马将继续以"双奥之城"的独特魅力，为全球跑者呈现一场精彩的赛事。</p>
          <p><strong>赛事亮点：</strong></p>
          <ul>
            <li>起点：天安门广场</li>
            <li>终点：奥林匹克公园中心区庆典广场</li>
            <li>路线经过长安街、故宫、鸟巢等北京标志性景观</li>
            <li>完赛奖牌设计独特，极具收藏价值</li>
          </ul>
        `,
        courseDescription: '比赛路线途经长安街、天安门广场、崇文路、东二环、北二环、学院路、奥体中心等北京标志性地点，全程42.195公里。',
        notices: [
          '报名前请仔细阅读竞赛规程；',
          '参赛者须年满20周岁（2006年12月31日前出生）；',
          '身体健康，无高血压、心脏病等不适宜剧烈运动的疾病；',
          '马拉松、半程马拉松须提交近两年内半程及以上完赛证明或体检报告；',
          '报名成功后不可更改参赛项目，且不予退费；',
          '领物时须本人携带有效身份证件原件'
        ]
      }

      if (this.race.categories && this.race.categories.length > 0) {
        this.selectedCategory = this.race.categories[0].id
        this.selectedCatFee = this.race.categories[0].fee
      }
    },
    selectCategory(cat) {
      this.selectedCategory = cat.id
      this.selectedCatFee = cat.fee
    },
    goToRegister() {
      if (!this.canRegister) return
      uni.navigateTo({
        url: `/pages/race/register?raceId=${this.raceId}&categoryId=${this.selectedCategory}`
      })
    },
    toggleFollow() {
      this.isFollowed = !this.isFollowed
      if (this.isFollowed) {
        uni.showToast({
          title: '已添加到我的赛事',
          icon: 'success'
        })
      } else {
        uni.showToast({
          title: '已取消关注',
          icon: 'none'
        })
      }
      // TODO: 调用云函数 followRace
    },
    shareRace() {
      uni.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    }
  }
}
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 140rpx;
}

/* 赛事封面 */
.race-header {
  height: 400rpx;
  position: relative;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  color: #fff;
}

.back-btn {
  position: absolute;
  top: 60rpx;
  left: 30rpx;
  width: 64rpx;
  height: 64rpx;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}

.header-content {
  z-index: 1;
}

.race-type {
  font-size: 24rpx;
  background: rgba(255, 255, 255, 0.2);
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  display: inline-block;
  margin-bottom: 12rpx;
}

.race-name {
  font-size: 40rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.race-date-location {
  display: flex;
  gap: 30rpx;
  font-size: 24rpx;
  opacity: 0.9;
}

/* 赛事信息 */
.info-section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.info-row {
  display: flex;
  margin-bottom: 20rpx;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-item {
  flex: 1;
}

.info-label {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.info-value {
  font-size: 28rpx;
  color: #333;
}

.info-value.highlight {
  color: #F44336;
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

/* 竞赛项目 */
.race-categories {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.category-card {
  padding: 24rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  border: 2rpx solid transparent;
  position: relative;
}

.category-card.selected {
  background: #f0f4ff;
  border-color: #667eea;
}

.category-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 12rpx;
  font-size: 26rpx;
  color: #666;
}

.sep {
  color: #ddd;
}

.quota-warning {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  font-size: 22rpx;
  color: #F44336;
  background: #ffebee;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
}

/* 赛事介绍 */
.race-description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.8;
}

.race-description p {
  margin-bottom: 16rpx;
}

.race-description ul {
  padding-left: 32rpx;
}

.race-description li {
  margin-bottom: 8rpx;
}

/* 赛道信息 */
.course-info {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.course-map {
  width: 100%;
  border-radius: 12rpx;
}

.course-desc {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

/* 报名须知 */
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
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

.notice-content {
  flex: 1;
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

/* 联系方式 */
.contact-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 0;
}

.contact-icon {
  font-size: 32rpx;
}

.contact-text {
  font-size: 28rpx;
  color: #333;
}

/* 底部操作栏 */
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

.action-icons {
  display: flex;
  gap: 30rpx;
}

.action-icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon {
  font-size: 40rpx;
}

.icon-text {
  font-size: 20rpx;
  color: #666;
  margin-top: 4rpx;
}

.register-area {
  display: flex;
  align-items: center;
  gap: 20rpx;
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
  font-size: 36rpx;
  color: #F44336;
  font-weight: bold;
}

.register-btn {
  width: 200rpx;
  height: 80rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-btn.disabled {
  background: #ccc;
  color: #fff;
}
</style>
