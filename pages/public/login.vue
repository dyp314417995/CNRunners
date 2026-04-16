<template>
  <view class="login-container">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>

    <!-- Logo区域 -->
    <view class="logo-section">
      <view class="logo-placeholder">
        <image v-if="avatarUrl" :src="avatarUrl" class="logo-img" mode="aspectFill"></image>
        <text v-else class="logo-icon">🏃</text>
      </view>
      <view class="app-name">九州战马联盟</view>
      <view class="app-slogan">和志同道合的人一起奔跑</view>
    </view>

    <!-- 注册表单 -->
    <view class="form-section">
      <!-- 步骤1：微信授权 -->
      <view v-if="step === 1" class="step-content">
        <button class="btn-wechat" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
          <text class="btn-icon">📱</text>
          <text class="btn-text">微信一键登录</text>
        </button>
        <view class="agreement">
          登录即表示同意
          <text class="link">《用户协议》</text>
          和
          <text class="link">《隐私政策》</text>
        </view>
      </view>

      <!-- 步骤2：完善信息 -->
      <view v-if="step === 2" class="step-content">
        <view class="avatar-upload" @click="chooseAvatar">
          <image v-if="avatarUrl" :src="avatarUrl" class="avatar-img" mode="aspectFill"></image>
          <view v-else class="avatar-placeholder">
            <text class="avatar-icon">+</text>
            <text class="avatar-tip">点击上传头像</text>
          </view>
        </view>

        <view class="form-card">
          <view class="form-item">
            <text class="form-label">手机号</text>
            <input
              class="form-input"
              type="tel"
              v-model="formData.phone"
              placeholder="请输入手机号"
              maxlength="11"
            />
          </view>

          <view class="form-item">
            <text class="form-label">姓名</text>
            <input
              class="form-input"
              type="text"
              v-model="formData.name"
              placeholder="请输入姓名"
            />
          </view>

          <view class="form-item">
            <text class="form-label">微信号（选填）</text>
            <input
              class="form-input"
              type="text"
              v-model="formData.wechatId"
              placeholder="请输入微信号"
            />
          </view>

          <view class="form-item">
            <text class="form-label">所属群组</text>
            <view class="group-select">
              <view
                v-for="group in enabledGroups"
                :key="group.id"
                :class="['group-option', formData.groupId === group.id ? 'active' : '']"
                @click="formData.groupId = group.id"
              >
                {{ group.name }}
              </view>
            </view>
          </view>

          <button class="btn-primary" @click="doRegister" :disabled="loading">
            {{ loading ? '注册中...' : '完成注册' }}
          </button>
        </view>
      </view>

      <!-- 步骤3：注册成功 -->
      <view v-if="step === 3" class="step-content success-content">
        <view class="success-icon">✓</view>
        <view class="success-text">注册成功</view>
        <view class="success-sub">欢迎加入九州战马联盟</view>
        <button class="btn-primary" @click="goHome">进入首页</button>
      </view>
    </view>
  </view>
</template>

<script>
import { userRegister, getGroups } from '../../common/request.js'

export default {
  data() {
    return {
      step: 1,
      loading: false,
      avatarUrl: '',
      nickname: '',
      groups: [],
      formData: {
        phone: '',
        name: '',
        wechatId: '',
        groupId: ''
      }
    }
  },
  computed: {
    enabledGroups() {
      return this.groups.filter(g => g.isEnabled)
    }
  },
  onLoad() {
    this.loadGroups()
  },
  methods: {
    // 加载群组列表
    async loadGroups() {
      try {
        const res = await getGroups()
        if (res.success) {
          this.groups = res.data || []
          // 默认选中一群
          if (this.groups.length > 0) {
            this.formData.groupId = this.groups[0].id
          }
        }
      } catch (e) {
        console.error('加载群组失败', e)
        // 使用默认群组
        this.groups = [
          { id: 'group_1', name: '一群', isEnabled: true },
          { id: 'group_2', name: '二群', isEnabled: true },
          { id: 'group_3', name: '分舵群', isEnabled: false }
        ]
        this.formData.groupId = 'group_1'
      }
    },

    // 获取微信手机号
    async onGetPhoneNumber(e) {
      if (!e.detail.code) {
        uni.showToast({ title: '请允许获取手机号', icon: 'none' })
        return
      }

      // 获取微信登录凭证
      try {
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: (res) => resolve(res),
            fail: reject
          })
        })

        // 获取用户信息
        const userInfoRes = await new Promise((resolve, reject) => {
          uni.getUserProfile({
            desc: '获取您的昵称和头像',
            success: (res) => resolve(res),
            fail: reject
          })
        })

        this.avatarUrl = userInfoRes.userInfo.avatarUrl
        this.nickname = userInfoRes.userInfo.nickName

        // 进入下一步填写信息
        this.step = 2
      } catch (err) {
        console.error('微信授权失败', err)
        // 如果用户拒绝授权，也允许手动填写
        uni.showModal({
          title: '提示',
          content: '您可以在下一步手动填写信息',
          showCancel: false,
          success: () => {
            this.step = 2
          }
        })
      }
    },

    // 选择头像（手动上传）
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.avatarUrl = res.tempFilePaths[0]
        }
      })
    },

    // 表单验证
    validateForm() {
      if (!this.formData.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' })
        return false
      }
      if (!/^1[3-9]\d{9}$/.test(this.formData.phone)) {
        uni.showToast({ title: '手机号格式不正确', icon: 'none' })
        return false
      }
      if (!this.formData.name) {
        uni.showToast({ title: '请输入姓名', icon: 'none' })
        return false
      }
      if (!this.formData.groupId) {
        uni.showToast({ title: '请选择所属群组', icon: 'none' })
        return false
      }
      return true
    },

    // 完成注册
    async doRegister() {
      if (!this.validateForm()) return

      this.loading = true

      try {
        // 先获取openid
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: (res) => resolve(res),
            fail: reject
          })
        })

        const result = await userRegister({
          code: loginRes.code,
          nickname: this.nickname || this.formData.name,
          avatar: this.avatarUrl,
          phone: this.formData.phone,
          name: this.formData.name,
          wechatId: this.formData.wechatId,
          groupId: this.formData.groupId
        })

        if (result.success) {
          // 保存用户信息
          uni.setStorageSync('userInfo', result.data)
          uni.setStorageSync('openid', result.data.openid)

          this.step = 3
        } else {
          uni.showToast({ title: result.error || '注册失败', icon: 'none' })
        }
      } catch (err) {
        console.error('注册错误', err)
        uni.showToast({ title: '注册失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    // 进入首页
    goHome() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  padding: 100rpx 40rpx 60rpx;
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 400rpx;
  height: 400rpx;
  top: -100rpx;
  right: -100rpx;
}

.circle-2 {
  width: 300rpx;
  height: 300rpx;
  bottom: 200rpx;
  left: -150rpx;
}

.circle-3 {
  width: 200rpx;
  height: 200rpx;
  bottom: -50rpx;
  right: 50rpx;
}

.logo-section {
  text-align: center;
  margin-top: 60rpx;
}

.logo-placeholder {
  width: 160rpx;
  height: 160rpx;
  background: #fff;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30rpx;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
}

.logo-icon {
  font-size: 80rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.form-section {
  flex: 1;
  margin-top: 60rpx;
}

.step-content {
  width: 100%;
}

.btn-wechat {
  width: 100%;
  height: 96rpx;
  background: #fff;
  color: #333;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-bottom: 30rpx;
}

.btn-wechat::after {
  border: none;
}

.btn-icon {
  margin-right: 16rpx;
  font-size: 40rpx;
}

.agreement {
  text-align: center;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.link {
  color: #fff;
  text-decoration: underline;
}

.avatar-upload {
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto 40rpx;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4rpx solid #fff;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border: 4rpx dashed rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 48rpx;
  color: #fff;
}

.avatar-tip {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8rpx;
}

.form-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.form-input {
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
}

.group-select {
  display: flex;
  gap: 20rpx;
}

.group-option {
  flex: 1;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  border: 2rpx solid transparent;
}

.group-option.active {
  background: #e8f4ff;
  color: #007AFF;
  border-color: #007AFF;
}

.btn-primary {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20rpx;
}

.btn-primary::after {
  border: none;
}

.success-content {
  text-align: center;
  padding-top: 100rpx;
}

.success-icon {
  width: 120rpx;
  height: 120rpx;
  background: #07C160;
  color: #fff;
  border-radius: 50%;
  font-size: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30rpx;
}

.success-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
}

.success-sub {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 60rpx;
}
</style>
