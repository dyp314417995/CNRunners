<template>
  <view class="calendar-container">
    <!-- 顶部月份导航 -->
    <view class="month-nav">
      <view class="nav-btn" @click="prevMonth">
        <text>‹</text>
      </view>
      <view class="month-title">
        <text class="year">{{ currentYear }}</text>
        <text class="month">{{ currentMonth }}月</text>
      </view>
      <view class="nav-btn" @click="nextMonth">
        <text>›</text>
      </view>
    </view>

    <!-- 星期标题 -->
    <view class="weekday-header">
      <text v-for="day in weekDays" :key="day" class="weekday">{{ day }}</text>
    </view>

    <!-- 日历网格 -->
    <view class="calendar-grid">
      <view
        v-for="(day, index) in calendarDays"
        :key="index"
        class="day-cell"
        :class="{
          'empty': !day.date,
          'has-race': day.hasRace,
          'today': day.isToday,
          'selected': selectedDate === day.date
        }"
        @click="selectDate(day)"
      >
        <text class="day-number">{{ day.day }}</text>
        <view v-if="day.hasRace" class="race-dot">
          <text v-if="day.raceCount > 1">{{ day.raceCount }}</text>
        </view>
      </view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view class="filter-item" :class="{ active: filterType === 'all' }" @click="setFilter('all')">
        <text>全部</text>
      </view>
      <view class="filter-item" :class="{ active: filterType === 'nearby' }" @click="setFilter('nearby')">
        <text>附近</text>
      </view>
      <view class="filter-item" :class="{ active: filterType === 'province' }" @click="setFilter('province')">
        <text>{{ selectedProvince || '全国' }}</text>
      </view>
      <view class="filter-item" :class="{ active: filterType === 'type' }" @click="showTypePicker = true">
        <text>{{ selectedTypeName || '类型' }}</text>
      </view>
    </view>

    <!-- 赛事列表 -->
    <view class="race-list-section">
      <view class="section-header">
        <text class="section-title">
          {{ selectedDate ? formatSelectedDate : '即将开始' }}
        </text>
        <text class="race-count">{{ races.length }}场赛事</text>
      </view>

      <view v-if="races.length === 0" class="empty-state">
        <text class="empty-icon">🏃</text>
        <text class="empty-text">暂无赛事</text>
      </view>

      <view v-else class="race-list">
        <view
          v-for="race in races"
          :key="race._id"
          class="race-card"
          @click="goToDetail(race._id)"
        >
          <!-- 赛事封面 -->
          <view class="race-cover" :style="{ background: race.coverGradient }">
            <view class="race-type-tag">{{ race.typeName }}</view>
            <view v-if="race.status === 'registration_open'" class="status-tag open">
              报名中
            </view>
            <view v-else-if="race.status === 'registration_closed'" class="status-tag closed">
              报名截止
            </view>
            <view v-else class="status-tag ended">
              已结束
            </view>
          </view>

          <!-- 赛事信息 -->
          <view class="race-info">
            <view class="race-name">{{ race.name }}</view>
            <view class="race-meta">
              <view class="meta-item">
                <text class="meta-icon">📅</text>
                <text>{{ race.dateStr }}</text>
              </view>
              <view class="meta-item">
                <text class="meta-icon">📍</text>
                <text>{{ race.location }}</text>
              </view>
            </view>
            <view class="race-tags">
              <view v-for="distance in race.distances" :key="distance" class="distance-tag">
                {{ distance }}
              </view>
            </view>
            <view class="race-footer">
              <view class="organizer">
                <text class="organizer-icon">🏁</text>
                <text>{{ race.organizer }}</text>
              </view>
              <view v-if="race.fee > 0" class="fee">
                <text class="fee-value">¥{{ race.fee }}</text>
                <text class="fee-unit">/人</text>
              </view>
              <view v-else class="fee free">
                <text>免费</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 发布赛事按钮（管理员） -->
    <view v-if="isAdmin" class="publish-btn" @click="goToPublish">
      <text>+</text>
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
  </view>
</template>

<script>
export default {
  data() {
    return {
      weekDays: ['日', '一', '二', '三', '四', '五', '六'],
      currentYear: 2026,
      currentMonth: 4,
      selectedDate: null,
      filterType: 'all',
      selectedProvince: '',
      selectedType: '',
      showTypePicker: false,
      typeIndex: 0,
      raceTypes: [
        { value: '', name: '全部类型' },
        { value: 'marathon', name: '马拉松' },
        { value: 'half_marathon', name: '半程马拉松' },
        { value: '10k', name: '10公里' },
        { value: '5k', name: '5公里' },
        { value: 'trail', name: '越野跑' },
        { value: 'ultra', name: '超级马拉松' },
        { value: 'fun_run', name: '健康跑' }
      ],
      races: []
    }
  },
  computed: {
    calendarDays() {
      const days = []
      const firstDay = new Date(this.currentYear, this.currentMonth - 1, 1)
      const lastDay = new Date(this.currentYear, this.currentMonth, 0)
      const startWeekday = firstDay.getDay()
      const totalDays = lastDay.getDate()
      const today = new Date()

      // 填充空单元格
      for (let i = 0; i < startWeekday; i++) {
        days.push({ date: '', day: '', hasRace: false })
      }

      // 填充日期
      for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const isToday = today.getFullYear() === this.currentYear &&
                       today.getMonth() + 1 === this.currentMonth &&
                       today.getDate() === d

        days.push({
          date: dateStr,
          day: d,
          hasRace: Math.random() > 0.7, // 模拟数据
          raceCount: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
          isToday
        })
      }

      return days
    },
    formatSelectedDate() {
      if (!this.selectedDate) return ''
      const [year, month, day] = this.selectedDate.split('-')
      return `${parseInt(month)}月${parseInt(day)}日`
    },
    selectedTypeName() {
      const type = this.raceTypes.find(t => t.value === this.selectedType)
      return type ? type.name : ''
    },
    isAdmin() {
      const userInfo = uni.getStorageSync('userInfo') || {}
      return userInfo.role === 'admin' || userInfo.role === 'super_admin'
    }
  },
  onLoad() {
    const now = new Date()
    this.currentYear = now.getFullYear()
    this.currentMonth = now.getMonth() + 1
    this.loadRaces()
  },
  methods: {
    prevMonth() {
      if (this.currentMonth === 1) {
        this.currentMonth = 12
        this.currentYear--
      } else {
        this.currentMonth--
      }
    },
    nextMonth() {
      if (this.currentMonth === 12) {
        this.currentMonth = 1
        this.currentYear++
      } else {
        this.currentMonth++
      }
    },
    selectDate(day) {
      if (!day.date) return
      this.selectedDate = day.date
      this.loadRaces()
    },
    setFilter(type) {
      this.filterType = type
      if (type !== 'province') {
        this.selectedProvince = ''
      }
      this.loadRaces()
    },
    onTypeChange(e) {
      this.typeIndex = e.detail.value[0]
    },
    confirmType() {
      this.selectedType = this.raceTypes[this.typeIndex].value
      this.showTypePicker = false
      this.loadRaces()
    },
    loadRaces() {
      // 模拟数据
      this.races = this.getMockRaces()
    },
    getMockRaces() {
      const mockRaces = [
        {
          _id: '1',
          name: '2026北京国际马拉松',
          dateStr: '2026-04-20',
          date: new Date(2026, 3, 20),
          location: '北京市',
          province: '北京',
          typeName: '马拉松',
          type: 'marathon',
          distances: ['全程', '半程', '10公里'],
          fee: 200,
          organizer: '中国田径协会',
          status: 'registration_open',
          coverGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          registeredCount: 15000,
          maxCount: 30000
        },
        {
          _id: '2',
          name: '上海国际半程马拉松',
          dateStr: '2026-04-26',
          date: new Date(2026, 3, 26),
          location: '上海市',
          province: '上海',
          typeName: '半程马拉松',
          type: 'half_marathon',
          distances: ['半程', '10公里'],
          fee: 150,
          organizer: '上海市体育局',
          status: 'registration_open',
          coverGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          registeredCount: 8000,
          maxCount: 15000
        },
        {
          _id: '3',
          name: '杭州西湖跑山赛',
          dateStr: '2026-05-03',
          date: new Date(2026, 4, 3),
          location: '杭州市',
          province: '浙江',
          typeName: '越野跑',
          type: 'trail',
          distances: ['50K', '30K', '10K'],
          fee: 380,
          organizer: '杭州越野跑协会',
          status: 'registration_open',
          coverGradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          registeredCount: 2000,
          maxCount: 3000
        },
        {
          _id: '4',
          name: '成都双遗马拉松',
          dateStr: '2026-05-10',
          date: new Date(2026, 4, 10),
          location: '成都市',
          province: '四川',
          typeName: '马拉松',
          type: 'marathon',
          distances: ['全程', '半程'],
          fee: 180,
          organizer: '成都市体育局',
          status: 'registration_open',
          coverGradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          registeredCount: 25000,
          maxCount: 30000
        }
      ]

      // 根据选中日期过滤
      if (this.selectedDate) {
        return mockRaces.filter(r => r.dateStr === this.selectedDate)
      }

      // 根据类型过滤
      if (this.selectedType) {
        return mockRaces.filter(r => r.type === this.selectedType)
      }

      return mockRaces
    },
    goToDetail(id) {
      uni.navigateTo({ url: `/pages/race/detail?id=${id}` })
    },
    goToPublish() {
      uni.navigateTo({ url: '/pages/race/publish' })
    }
  }
}
</script>

<style scoped>
.calendar-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 30rpx;
}

/* 月份导航 */
.month-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: #fff;
}

.nav-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  color: #667eea;
}

.month-title {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.year {
  font-size: 24rpx;
  color: #999;
}

.month {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

/* 星期标题 */
.weekday-header {
  display: flex;
  background: #fff;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.weekday {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #999;
}

/* 日历网格 */
.calendar-grid {
  display: flex;
  flex-wrap: wrap;
  background: #fff;
  padding: 20rpx 10rpx;
}

.day-cell {
  width: 14.28%;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.day-cell.empty {
  opacity: 0;
}

.day-cell.today .day-number {
  background: #667eea;
  color: #fff;
  border-radius: 50%;
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-cell.selected {
  background: #f0f4ff;
}

.day-cell.selected .day-number {
  color: #667eea;
  font-weight: bold;
}

.day-number {
  font-size: 28rpx;
  color: #333;
}

.race-dot {
  position: absolute;
  bottom: 8rpx;
  background: #F44336;
  color: #fff;
  font-size: 18rpx;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}

/* 筛选栏 */
.filter-bar {
  display: flex;
  background: #fff;
  padding: 20rpx 30rpx;
  gap: 20rpx;
  margin-top: 20rpx;
}

.filter-item {
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 30rpx;
  font-size: 24rpx;
  color: #666;
}

.filter-item.active {
  background: #667eea;
  color: #fff;
}

/* 赛事列表 */
.race-list-section {
  margin-top: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.race-count {
  font-size: 24rpx;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.race-list {
  padding: 0 30rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.race-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.race-cover {
  height: 200rpx;
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20rpx;
}

.race-type-tag {
  background: rgba(255, 255, 255, 0.9);
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  color: #333;
}

.status-tag {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
}

.status-tag.open {
  background: #4CAF50;
  color: #fff;
}

.status-tag.closed {
  background: #999;
  color: #fff;
}

.status-tag.ended {
  background: #ddd;
  color: #666;
}

.race-info {
  padding: 24rpx;
}

.race-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.race-meta {
  display: flex;
  gap: 30rpx;
  margin-bottom: 16rpx;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #666;
}

.meta-icon {
  font-size: 24rpx;
}

.race-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.distance-tag {
  padding: 6rpx 16rpx;
  background: #f0f4ff;
  color: #667eea;
  border-radius: 6rpx;
  font-size: 22rpx;
}

.race-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16rpx;
  border-top: 1rpx solid #f0f0f0;
}

.organizer {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #999;
}

.organizer-icon {
  font-size: 24rpx;
}

.fee {
  display: flex;
  align-items: baseline;
}

.fee-value {
  font-size: 36rpx;
  color: #F44336;
  font-weight: bold;
}

.fee-unit {
  font-size: 24rpx;
  color: #999;
}

.fee.free .fee-value {
  color: #4CAF50;
  font-size: 28rpx;
}

/* 发布按钮 */
.publish-btn {
  position: fixed;
  right: 30rpx;
  bottom: 60rpx;
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  color: #fff;
  box-shadow: 0 8rpx 30rpx rgba(102, 126, 234, 0.4);
}

/* 类型选择器 */
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
