<template>
  <view class="members-container">
    <!-- 顶部搜索和筛选 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          type="text"
          v-model="keyword"
          placeholder="搜索姓名或手机号"
          @input="onSearch"
        />
      </view>
      <button class="filter-btn" @click="showFilter = !showFilter">
        {{ currentGroupName }} ▾
      </button>
    </view>

    <!-- 群组筛选下拉 -->
    <view v-if="showFilter" class="filter-dropdown">
      <view
        :class="['filter-item', currentGroupId === '' ? 'active' : '']"
        @click="selectGroup('')"
      >
        全部群组
      </view>
      <view
        v-for="group in groups"
        :key="group.id"
        :class="['filter-item', currentGroupId === group.id ? 'active' : '']"
        @click="selectGroup(group.id)"
      >
        {{ group.name }}
      </view>
    </view>

    <!-- 成员列表 -->
    <scroll-view scroll-y class="member-list" @scrolltolower="loadMore">
      <view v-if="filteredMembers.length === 0" class="empty-state">
        <text class="empty-icon">👥</text>
        <text class="empty-text">暂无成员</text>
      </view>

      <view v-else class="member-item" v-for="member in filteredMembers" :key="member.id" @click="showMemberDetail(member)">
        <view class="member-main">
          <image
            class="avatar"
            :src="member.avatar || '/static/logo.jpg'"
            mode="aspectFill"
          />
          <view class="member-info">
            <view class="name-row">
              <text class="nickname">{{ member.name }}</text>
              <text v-if="member.role === 'super_admin'" class="role-tag super">超管</text>
              <text v-else-if="member.role === 'admin'" class="role-tag">管理员</text>
              <text v-else class="group-tag">{{ getGroupName(member.groupId) }}</text>
              <text v-if="member.id === currentUserId" class="current-tag">我</text>
            </view>
            <text class="phone">{{ formatPhone(member.phone) }}</text>
          </view>
        </view>

        <text class="arrow">›</text>
      </view>
    </scroll-view>

    <!-- 成员详情弹窗 -->
    <uni-popup v-if="showDetail" type="center" @close="showDetail = false">
      <view class="detail-popup">
        <view class="popup-header">
          <text class="popup-title">成员信息</text>
          <text class="popup-close" @click="showDetail = false">×</text>
        </view>

        <view class="popup-body">
          <view class="detail-avatar">
            <image :src="selectedMember.avatar || '/static/logo.jpg'" mode="aspectFill"></image>
          </view>
          <view class="detail-name">{{ selectedMember.name }}</view>
          <view class="detail-group">{{ getGroupName(selectedMember.groupId) }}</view>

          <view class="detail-info">
            <view class="info-item">
              <text class="info-label">手机号</text>
              <text class="info-value">{{ selectedMember.phone }}</text>
            </view>
            <view class="info-item" v-if="selectedMember.wechatId">
              <text class="info-label">微信号</text>
              <text class="info-value">{{ selectedMember.wechatId }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">角色</text>
              <text class="info-value">
                {{ selectedMember.role === 'super_admin' ? '超管' : selectedMember.role === 'admin' ? '管理员' : '成员' }}
              </text>
            </view>
            <view class="info-item">
              <text class="info-label">注册时间</text>
              <text class="info-value">{{ selectedMember.createAt }}</text>
            </view>
          </view>
        </view>

        <view class="popup-footer" v-if="isAdmin && selectedMember.id !== currentUserId">
          <button v-if="selectedMember.role === 'member'" class="btn-action" @click="promoteToAdmin">
            提升为管理员
          </button>
          <button class="btn-action danger" @click="removeMember">
            移除成员
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { getMembers, updateMember, getGroups, updateAdmin } from '../../common/request.js'

export default {
  data() {
    return {
      members: [],
      groups: [],
      keyword: '',
      currentGroupId: '',
      showFilter: false,
      showDetail: false,
      selectedMember: {},
      loading: false,
      currentUserId: '',
      isAdmin: false
    }
  },
  computed: {
    currentGroupName() {
      if (!this.currentGroupId) return '全部'
      const group = this.groups.find(g => g.id === this.currentGroupId)
      return group ? group.name : '全部'
    },
    filteredMembers() {
      let result = this.members

      // 群组筛选
      if (this.currentGroupId) {
        result = result.filter(m => m.groupId === this.currentGroupId)
      }

      // 关键词搜索
      if (this.keyword) {
        const kw = this.keyword.toLowerCase()
        result = result.filter(m =>
          (m.name && m.name.toLowerCase().includes(kw)) ||
          (m.phone && m.phone.includes(kw))
        )
      }

      return result
    }
  },
  onLoad() {
    const userInfo = uni.getStorageSync('userInfo')
    this.currentUserId = userInfo?.openid || ''
    this.isAdmin = userInfo?.role === 'admin' || userInfo?.role === 'super_admin'
    this.loadGroups()
    this.loadMembers()
  },
  onShow() {
    this.loadMembers()
  },
  methods: {
    async loadGroups() {
      try {
        const res = await getGroups()
        if (res.success) {
          this.groups = res.data || []
        }
      } catch (e) {
        console.error('加载群组失败', e)
      }
    },

    async loadMembers() {
      if (this.loading) return
      this.loading = true

      uni.showLoading({ title: '加载中...' })
      try {
        const res = await getMembers()
        if (res.success) {
          this.members = res.data || []
        } else {
          uni.showToast({ title: res.error || '加载失败', icon: 'none' })
        }
      } catch (e) {
        console.error('加载成员失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
        uni.hideLoading()
      }
    },

    onSearch() {
      // 搜索会自动通过computed属性filteredMembers实现
    },

    selectGroup(groupId) {
      this.currentGroupId = groupId
      this.showFilter = false
    },

    getGroupName(groupId) {
      if (!groupId) return ''
      const group = this.groups.find(g => g.id === groupId)
      return group ? group.name : ''
    },

    formatPhone(phone) {
      if (!phone) return '未绑定'
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    },

    showMemberDetail(member) {
      this.selectedMember = member
      this.showDetail = true
    },

    async promoteToAdmin() {
      uni.showModal({
        title: '提升为管理员',
        content: `确定将 ${this.selectedMember.name} 提升为管理员吗？`,
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              const result = await updateAdmin(this.selectedMember.id, 'promote')
              if (result.success) {
                uni.showToast({ title: '已提升', icon: 'success' })
                this.showDetail = false
                this.loadMembers()
              } else {
                uni.showToast({ title: result.error || '操作失败', icon: 'none' })
              }
            } catch (e) {
              uni.showToast({ title: '操作失败', icon: 'none' })
            } finally {
              uni.hideLoading()
            }
          }
        }
      })
    },

    async removeMember() {
      uni.showModal({
        title: '移除成员',
        content: `确定将 ${this.selectedMember.name} 从跑团移除吗？`,
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              const result = await updateMember(this.selectedMember.id, { status: 'removed' })
              if (result.success) {
                uni.showToast({ title: '已移除', icon: 'success' })
                this.showDetail = false
                this.loadMembers()
              } else {
                uni.showToast({ title: result.error || '操作失败', icon: 'none' })
              }
            } catch (e) {
              uni.showToast({ title: '操作失败', icon: 'none' })
            } finally {
              uni.hideLoading()
            }
          }
        }
      })
    },

    loadMore() {
      // 分页加载，暂时不实现
    }
  }
}
</script>

<style scoped>
.members-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-bar {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  background: #fff;
}

.search-input-wrap {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  padding: 0 24rpx 0 64rpx;
  font-size: 28rpx;
}

.search-icon {
  position: absolute;
  left: 24rpx;
  top: 50%;
  transform: translateY(-50%);
}

.filter-btn {
  height: 72rpx;
  padding: 0 28rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  font-size: 28rpx;
  color: #333;
  margin: 0;
}

.filter-dropdown {
  background: #fff;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #eee;
}

.filter-item {
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-item:last-child {
  border-bottom: none;
}

.filter-item.active {
  color: #007AFF;
}

.member-list {
  height: calc(100vh - 120rpx);
  padding: 24rpx;
}

.member-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.member-main {
  flex: 1;
  display: flex;
  align-items: center;
}

.avatar {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  background: #f0f0f0;
}

.member-info {
  flex: 1;
  margin-left: 20rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.nickname {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.role-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: #fff3e0;
  color: #FF9800;
  border-radius: 8rpx;
}

.role-tag.super {
  background: #f3e5f5;
  color: #9C27B0;
}

.group-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: #e8f4ff;
  color: #007AFF;
  border-radius: 8rpx;
}

.current-tag {
  background: #667eea;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.phone {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}

.arrow {
  font-size: 36rpx;
  color: #ccc;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #666;
}

/* 详情弹窗 */
.detail-popup {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.popup-close {
  font-size: 48rpx;
  color: #999;
}

.popup-body {
  padding: 40rpx 32rpx;
  text-align: center;
}

.detail-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  margin: 0 auto 20rpx;
  overflow: hidden;
  background: #f0f0f0;
}

.detail-avatar image {
  width: 100%;
  height: 100%;
}

.detail-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.detail-group {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 32rpx;
}

.detail-info {
  text-align: left;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 24rpx;
}

.info-item {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  width: 140rpx;
  font-size: 26rpx;
  color: #999;
}

.info-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}

.popup-footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #eee;
}

.btn-action {
  flex: 1;
  height: 80rpx;
  background: #007AFF;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.btn-action.danger {
  background: #fff;
  color: #F44336;
  border: 2rpx solid #F44336;
}
</style>
