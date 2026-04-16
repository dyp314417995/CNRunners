<script>
export default {
  onLaunch() {
    console.log('跑团管理小程序已启动')
    this.checkLogin()
  },
  onShow() {
    console.log('App showed')
  },
  onHide() {
    console.log('App hid')
  },
  methods: {
    checkLogin() {
      // 检查登录状态
      const userInfo = uni.getStorageSync('userInfo')
      const openid = uni.getStorageSync('openid')

      // 如果没有登录信息，不做自动跳转
      // 页面会根据需要检查登录状态
    }
  }
}
</script>

<style>
/* 全局样式 */
@import "./common/utils.js";

/* 全局CSS变量 */
page {
  --primary-color: #667eea;
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --success-color: #4CAF50;
  --warning-color: #FF9800;
  --error-color: #F44336;
  --info-color: #2196F3;
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-hint: #999999;
  --bg-page: #f5f5f5;
  --bg-card: #ffffff;
  --border-color: #eeeeee;
  --shadow-light: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);

  background-color: var(--bg-page);
  font-size: 28rpx;
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 全局工具类 */
.flex {
  display: flex;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.justify-center {
  justify-content: center;
}

.justify-between {
  justify-content: space-between;
}

.align-center {
  align-items: center;
}

.text-center {
  text-align: center;
}

.text-bold {
  font-weight: bold;
}

/* 页面容器 */
.page-container {
  min-height: 100vh;
  background: var(--bg-page);
}

/* 安全区域适配 */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

/* 通用卡片样式 */
.card {
  background: var(--bg-card);
  border-radius: 16rpx;
  padding: 30rpx;
  margin: 20rpx 30rpx;
  box-shadow: var(--shadow-light);
}

/* 通用按钮样式 */
.btn-primary {
  background: var(--primary-gradient);
  color: #fff;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: bold;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-primary:active {
  opacity: 0.9;
}

/* 隐藏滚动条 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>
