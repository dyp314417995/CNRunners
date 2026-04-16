<template>
  <view class="admin-container">
    <!-- 顶部导航 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">‹</view>
      <view class="nav-title">管理员管理</view>
      <view class="nav-placeholder"></view>
    </view>

    <!-- Tab切换 -->
    <view class="tab-bar">
      <view
        :class="['tab-item', currentTab === 'admins' ? 'active' : '']"
        @click="currentTab = 'admins'"
      >
        管理员列表
      </view>
      <view
        :class="['tab-item', currentTab === 'groups' ? 'active' : '']"
        @click="currentTab = 'groups'"
      >
        群组设置
      </view>
    </view>

    <!-- 管理员列表 -->
    <view v-if="currentTab === 'admins'" class="tab-content">
      <view class="admin-list">
        <view v-for="admin in admins" :key="admin.id" class="admin-card">
          <image :src="admin.avatar || defaultAvatar" class="admin-avatar" mode="aspectFill"></image>
          <view class="admin-info">
            <view class="admin-name">
              {{ admin.name }}
              <text v-if="admin.role === 'super_admin'" class="role-tag super">超管</text>
              <text v-else class="role-tag">管理员</text>
            </view>
            <view class="admin-meta">{{ admin.phone }}</view>
            <view class="admin-time">成为管理员：{{ admin.promotedAt }}</view>
          </view>
          <button
            v-if="admin.role !== 'super_admin'"
            class="btn-revoke"
            @click="revokeAdmin(admin)"
          >
            撤销
          </button>
          <view v-else class="revoke-disabled">不可撤销</view>
        </view>
      </view>

      <view v-if="admins.length === 0" class="empty-state">
        <text class="empty-icon">👥</text>
        <text class="empty-text">暂无管理员</text>
      </view>
    </view>

    <!-- 群组设置 -->
    <view v-if="currentTab === 'groups'" class="tab-content">
      <view class="section-title">群组开关</view>
      <view class="settings-card">
        <view v-for="group in groups" :key="group.id" class="settings-item">
          <view class="settings-label">
            <text class="settings-name">{{ group.name }}</text>
            <text class="settings-desc">{{ group.isEnabled ? '已启用' : '已禁用' }}</text>
          </view>
          <view
            :class="['toggle-switch', group.isEnabled ? 'active' : '']"
            @click="toggleGroup(group)"
          ></view>
        </view>
      </view>
    </view>

    <!-- 提升为管理员弹窗 -->
    <uni-popup v-if="showPromotePopup" type="center" @close="showPromotePopup = false">
      <view class="popup-card">
        <view class="popup-title">提升为管理员</view>
        <view class="popup-body">
          <view class="promote-user">
            <image :src="selectedUser.avatar || defaultAvatar" class="promote-avatar"></image>
            <view class="promote-name">{{ selectedUser.name }}</view>
          </view>
          <view class="popup-tip">确定将此成员提升为管理员？</view>
        </view>
        <view class="popup-footer">
          <button class="btn-cancel" @click="showPromotePopup = false">取消</button>
          <button class="btn-confirm" @click="promoteToAdmin">确定</button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { getAdmins, updateAdmin, getGroups, updateGroup } from '../../common/request.js'

export default {
  data() {
    return {
      currentTab: 'admins',
      admins: [],
      groups: [],
      showPromotePopup: false,
      selectedUser: {},
      defaultAvatar: '/static/logo.jpg'
    }
  },
  onLoad() {
    this.loadAdmins()
    this.loadGroups()
  },
  onShow() {
    // 每次显示时刷新数据
    if (this.currentTab === 'admins') {
      this.loadAdmins()
    }
  },
  methods: {
    goBack() {
      uni.navigateBack()
    },

    async loadAdmins() {
      uni.showLoading({ title: '加载中...' })
      try {
        const res = await getAdmins()
        if (res.success) {
          this.admins = res.data || []
        } else {
          uni.showToast({ title: res.error || '加载失败', icon: 'none' })
        }
      } catch (e) {
        console.error('加载管理员列表失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },

    async loadGroups() {
      try {
        const res = await getGroups()
        if (res.success) {
          this.groups = res.data || []
        }
      } catch (e) {
        console.error('加载群组失败', e)
        this.groups = [
          { id: 'group_1', name: '一群', isEnabled: true },
          { id: 'group_2', name: '二群', isEnabled: true },
          { id: 'group_3', name: '分舵群', isEnabled: false }
        ]
      }
    },

    revokeAdmin(admin) {
      uni.showModal({
        title: '撤销管理员',
        content: `确定要撤销 ${admin.name} 的管理员身份吗？`,
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              const result = await updateAdmin(admin.id, 'revoke')
              if (result.success) {
                uni.showToast({ title: '已撤销', icon: 'success' })
                this.loadAdmins()
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

    toggleGroup(group) {
      uni.showModal({
        title: group.isEnabled ? '禁用群组' : '启用群组',
        content: `确定要${group.isEnabled ? '禁用' : '启用'} ${group.name} 吗？`,
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              const result = await updateGroup(group.id, { isEnabled: !group.isEnabled })
              if (result.success) {
                group.isEnabled = !group.isEnabled
                uni.showToast({ title: '设置成功', icon: 'success' })
              } else {
                uni.showToast({ title: result.error || '设置失败', icon: 'none' })
              }
            } catch (e) {
              uni.showToast({ title: '设置失败', icon: 'none' })
            } finally {
              uni.hideLoading()
            }
          }
        }
      })
    },

    promoteToAdmin() {
      // 实现提升为管理员
    }
  }
}
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 24rpx;
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.nav-back {
  font-size: 44rpx;
  color: #333;
  width: 60rpx;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.nav-placeholder {
  width: 60rpx;
}

.tab-bar {
  display: flex;
  background: #fff;
  border-bottom: 1rpx solid #eee;
}

.tab-item {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  border-bottom: 4rpx solid transparent;
}

.tab-item.active {
  color: #007AFF;
  border-bottom-color: #007AFF;
}

.tab-content {
  padding: 24rpx;
}

.admin-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.admin-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
}

.admin-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background: #f0f0f0;
}

.admin-info {
  flex: 1;
}

.admin-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.role-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: #fff3e0;
  color: #FF9800;
  border-radius: 8rpx;
  margin-left: 12rpx;
}

.role-tag.super {
  background: #f3e5f5;
  color: #9C27B0;
}

.admin-meta {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 4rpx;
}

.admin-time {
  font-size: 22rpx;
  color: #999;
}

.btn-revoke {
  padding: 12rpx 28rpx;
  background: #ffebee;
  color: #F44336;
  border-radius: 24rpx;
  font-size: 24rpx;
  margin: 0;
}

.revoke-disabled {
  font-size: 22rpx;
  color: #ccc;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.section-title {
  font-size: 26rpx;
  color: #999;
  margin-bottom: 20rpx;
  padding-left: 8rpx;
}

.settings-card {
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.settings-item:last-child {
  border-bottom: none;
}

.settings-label {
  display: flex;
  flex-direction: column;
}

.settings-name {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.settings-desc {
  font-size: 24rpx;
  color: #999;
}

.toggle-switch {
  width: 100rpx;
  height: 56rpx;
  background: #ccc;
  border-radius: 28rpx;
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-switch.active {
  background: #07C160;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  width: 52rpx;
  height: 52rpx;
  background: #fff;
  border-radius: 50%;
  top: 2rpx;
  left: 2rpx;
  transition: transform 0.2s;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.toggle-switch.active::after {
  transform: translateX(44rpx);
}

/* 提升弹窗 */
.popup-card {
  width: 560rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  padding: 32rpx 0;
  border-bottom: 1rpx solid #eee;
}

.popup-body {
  padding: 40rpx 32rpx;
  text-align: center;
}

.promote-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24rpx;
}

.promote-avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-bottom: 16rpx;
  background: #f0f0f0;
}

.promote-name {
  font-size: 30rpx;
  color: #333;
}

.popup-tip {
  font-size: 28rpx;
  color: #666;
}

.popup-footer {
  display: flex;
  border-top: 1rpx solid #eee;
}

.popup-footer button {
  flex: 1;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  margin: 0;
  border-radius: 0;
}

.popup-footer .btn-cancel {
  background: #fff;
  color: #666;
  border-right: 1rpx solid #eee;
}

.popup-footer .btn-confirm {
  background: #fff;
  color: #007AFF;
}
</style>
