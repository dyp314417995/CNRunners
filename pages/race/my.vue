<template>
  <view class="my-races-container">
    <!-- 顶部统计 -->
    <view class="stats-header">
      <view class="stat-item">
        <text class="stat-value">{{ myRaces.length }}</text>
        <text class="stat-label">关注的赛事</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ upcomingCount }}</text>
        <text class="stat-label">即将开始</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ withReminderCount }}</text>
        <text class="stat-label">已设提醒</text>
      </view>
    </view>

    <!-- 视图切换 -->
    <view class="view-tabs">
      <view
        class="tab-item"
        :class="{ active: viewMode === 'calendar' }"
        @click="viewMode = 'calendar'"
      >
        <text>📅 日历视图</text>
      </view>
      <view
        class="tab-item"
        :class="{ active: viewMode === 'list' }"
        @click="viewMode = 'list'"
      >
        <text>📋 列表视图</text>
      </view>
    </view>

    <!-- 日历视图 -->
    <view v-if="viewMode === 'calendar'" class="calendar-view">
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

      <view class="weekday-header">
        <text v-for="day in weekDays" :key="day" class="weekday">{{ day }}</text>
      </view>

      <view class="calendar-grid">
        <view
          v-for="(day, index) in calendarDays"
          :key="index"
          class="day-cell"
          :class="{
            'empty': !day.date,
            'has-race': day.hasRace,
            'today': day.isToday
          }"
          @click="selectDate(day)"
        >
          <text class="day-number">{{ day.day }}</text>
          <view v-if="day.hasRace" class="race-indicator"></view>
        </view>
      </view>
    </view>

    <!-- 列表视图 -->
    <view v-else class="list-view">
      <view
        v-for="race in myRaces"
        :key="race._id"
        class="race-item"
        :class="{ passed: isPassed(race.date) }"
        @click="goToDetail(race._id)"
      >
        <!-- 日期标签 -->
        <view class="date-badge">
          <text class="month">{{ formatMonth(race.date) }}</text>
          <text class="day">{{ formatDay(race.date) }}</text>
          <text class="weekday">{{ formatWeekday(race.date) }}</text>
        </view>

        <!-- 赛事信息 -->
        <view class="race-content">
          <view class="race-name">{{ race.name }}</view>
          <view class="race-meta">
            <text>📍 {{ race.location }}</text>
          </view>
          <view v-if="race.reminderTime" class="reminder-tag">
            <text>🔔 {{ formatReminderTime(race.reminderTime) }}</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="race-actions">
          <view
            class="action-btn"
            :class="{ active: race.reminderTime }"
            @click.stop="showReminderPicker(race)"
          >
            <text>🔔</text>
          </view>
          <view
            class="action-btn unfollow"
            @click.stop="unfollowRace(race._id)"
          >
            <text>✕</text>
          </view>
        </view>
      </view>

      <view v-if="myRaces.length === 0" class="empty-state">
        <text class="empty-icon">🏃</text>
        <text class="empty-text">暂无关注的赛事</text>
        <text class="empty-hint">去赛事日历中添加你感兴趣的赛事</text>
      </view>
    </view>

    <!-- 提醒设置弹窗 -->
    <uni-popup v-if="showReminder" type="bottom" @close="showReminder = false">
      <view class="reminder-sheet">
        <view class="sheet-header">
          <text class="sheet-cancel" @click="showReminder = false">取消</text>
          <text class="sheet-title">设置提醒</text>
          <text class="sheet-confirm" @click="confirmReminder">确定</text>
        </view>
        <view class="reminder-options">
          <view
            v-for="option in reminderOptions"
            :key="option.value"
            class="reminder-option"
            :class="{ selected: selectedReminder === option.value }"
            @click="selectedReminder = option.value"
          >
            <text class="option-icon">{{ option.icon }}</text>
            <text class="option-text">{{ option.text }}</text>
            <text v-if="selectedReminder === option.value" class="check">✓</text>
          </view>
        </view>
        <view class="no-reminder" @click="selectedReminder = 0">
          <text>不提醒</text>
          <text v-if="selectedReminder === 0" class="check">✓</text>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { getMyRaceRegistrations, followRace } from '../../common/request.js'

export default {
  data() {
    return {
      weekDays: ['日', '一', '二', '三', '四', '五', '六'],
      currentYear: 2026,
      currentMonth: 4,
      viewMode: 'list',
      myRaces: [],
      showReminder: false,
      selectedRace: null,
      selectedReminder: 0,
      reminderOptions: [
        { value: 86400000, icon: '📆', text: '比赛前一天' },
        { value: 259200000, icon: '📆', text: '比赛前三天' },
        { value: 604800000, icon: '📆', text: '比赛前一周' },
        { value: 0, icon: '🏃', text: '比赛当天早上' }
      ]
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

      for (let i = 0; i < startWeekday; i++) {
        days.push({ date: '', day: '', hasRace: false })
      }

      for (let d = 1; d <= totalDays; d++) {
        const dateStr = `${this.currentYear}-${String(this.currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const isToday = today.getFullYear() === this.currentYear &&
                       today.getMonth() + 1 === this.currentMonth &&
                       today.getDate() === d
        const hasRace = this.myRaces.some(r => {
          const raceDate = this.formatDateShort(r.date)
          return raceDate === dateStr
        })

        days.push({
          date: dateStr,
          day: d,
          hasRace,
          isToday
        })
      }

      return days
    },
    upcomingCount() {
      const now = new Date()
      return this.myRaces.filter(r => new Date(r.date) > now).length
    },
    withReminderCount() {
      return this.myRaces.filter(r => r.reminderTime && r.reminderTime > 0).length
    }
  },
  onLoad() {
    const now = new Date()
    this.currentYear = now.getFullYear()
    this.currentMonth = now.getMonth() + 1
  },
  onShow() {
    this.loadMyRaces()
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
      // 可以跳转查看当天赛事的详情
    },
    async loadMyRaces() {
      // 模拟数据
      this.myRaces = [
        {
          _id: '1',
          name: '2026北京国际马拉松',
          date: new Date(2026, 3, 20),
          location: '北京市天安门广场',
          reminderTime: 86400000
        },
        {
          _id: '2',
          name: '上海国际半程马拉松',
          date: new Date(2026, 3, 26),
          location: '上海市',
          reminderTime: 0
        },
        {
          _id: '3',
          name: '杭州西湖跑山赛',
          date: new Date(2026, 4, 3),
          location: '杭州市',
          reminderTime: 259200000
        }
      ]
    },
    formatDateShort(date) {
      const d = new Date(date)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },
    formatMonth(date) {
      return new Date(date).getMonth() + 1 + '月'
    },
    formatDay(date) {
      return new Date(date).getDate()
    },
    formatWeekday(date) {
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      return weekdays[new Date(date).getDay()]
    },
    formatReminderTime(ms) {
      if (ms === 0) return '比赛当天'
      if (ms === 86400000) return '前一天'
      if (ms === 259200000) return '前三天'
      if (ms === 604800000) return '前一周'
      return ''
    },
    isPassed(date) {
      return new Date(date) < new Date()
    },
    goToDetail(id) {
      uni.navigateTo({ url: `/pages/race/detail?id=${id}` })
    },
    showReminderPicker(race) {
      this.selectedRace = race
      this.selectedReminder = race.reminderTime || 0
      this.showReminder = true
    },
    confirmReminder() {
      if (this.selectedRace) {
        this.selectedRace.reminderTime = this.selectedReminder
        // 调用云函数更新提醒
        uni.showToast({
          title: '提醒已设置',
          icon: 'success'
        })
      }
      this.showReminder = false
    },
    async unfollowRace(raceId) {
      const confirmed = await uni.showModal({
        title: '取消关注',
        content: '确定要取消关注该赛事吗？',
        confirmColor: '#F44336'
      })

      if (confirmed.confirm) {
        // 调用云函数取消关注
        this.myRaces = this.myRaces.filter(r => r._id !== raceId)
        uni.showToast({
          title: '已取消关注',
          icon: 'success'
        })
      }
    }
  }
}
</script>

<style scoped>
.my-races-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 30rpx;
}

/* 顶部统计 */
.stats-header {
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40rpx 30rpx;
  color: #fff;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 48rpx;
  font-weight: bold;
  display: block;
}

.stat-label {
  font-size: 24rpx;
  opacity: 0.8;
}

/* 视图切换 */
.view-tabs {
  display: flex;
  background: #fff;
  padding: 20rpx 30rpx;
  gap: 20rpx;
}

.tab-item {
  flex: 1;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 12rpx;
  font-size: 26rpx;
  color: #666;
}

.tab-item.active {
  background: #667eea;
  color: #fff;
}

/* 日历视图 */
.calendar-view {
  background: #fff;
  margin-top: 20rpx;
}

.month-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
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

.weekday-header {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.weekday {
  flex: 1;
  text-align: center;
  font-size: 24rpx;
  color: #999;
}

.calendar-grid {
  display: flex;
  flex-wrap: wrap;
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

.day-number {
  font-size: 28rpx;
  color: #333;
}

.race-indicator {
  position: absolute;
  bottom: 8rpx;
  width: 12rpx;
  height: 12rpx;
  background: #F44336;
  border-radius: 50%;
}

/* 列表视图 */
.list-view {
  padding: 20rpx 30rpx;
}

.race-item {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
}

.race-item.passed {
  opacity: 0.6;
}

.date-badge {
  width: 100rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12rpx;
  color: #fff;
  margin-right: 20rpx;
}

.date-badge .month {
  font-size: 22rpx;
  opacity: 0.9;
}

.date-badge .day {
  font-size: 36rpx;
  font-weight: bold;
}

.date-badge .weekday {
  font-size: 20rpx;
  opacity: 0.8;
}

.race-content {
  flex: 1;
}

.race-name {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.race-meta {
  font-size: 24rpx;
  color: #666;
}

.reminder-tag {
  display: inline-block;
  margin-top: 12rpx;
  padding: 6rpx 12rpx;
  background: #fff3e0;
  border-radius: 6rpx;
  font-size: 22rpx;
  color: #FF9800;
}

.race-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.action-btn {
  width: 56rpx;
  height: 56rpx;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.action-btn.active {
  background: #fff3e0;
}

.action-btn.unfollow {
  background: #ffebee;
}

/* 空状态 */
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
  color: #666;
  display: block;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
}

/* 提醒设置弹窗 */
.reminder-sheet {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.sheet-cancel {
  font-size: 28rpx;
  color: #999;
}

.sheet-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.sheet-confirm {
  font-size: 28rpx;
  color: #667eea;
}

.reminder-options {
  padding: 20rpx 30rpx;
}

.reminder-option {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.reminder-option:last-child {
  border-bottom: none;
}

.option-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.option-text {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.check {
  font-size: 28rpx;
  color: #667eea;
}

.no-reminder {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  margin: 0 20rpx 20rpx;
  background: #f8f8f8;
  border-radius: 12rpx;
  font-size: 28rpx;
  color: #666;
}
</style>
