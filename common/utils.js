// 跑团管理小程序 - 工具函数

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期
 * @param {string} format - 格式模板
 * @returns {string}
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return ''

  const d = new Date(date)
  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化时长（秒 -> 分:秒）
 * @param {number} seconds - 秒数
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0\'00"'

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}'${String(secs).padStart(2, '0')}"`
}

/**
 * 格式化时长（秒 -> x小时x分x秒）
 * @param {number} seconds - 秒数
 * @returns {string}
 */
export function formatDurationLong(seconds) {
  if (!seconds || seconds < 0) return '0秒'

  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts = []
  if (hours > 0) parts.push(`${hours}小时`)
  if (mins > 0) parts.push(`${mins}分`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}秒`)

  return parts.join('')
}

/**
 * 格式化距离（米 -> 公里）
 * @param {number} meters - 米
 * @param {number} decimals - 小数位数
 * @returns {string}
 */
export function formatDistance(meters, decimals = 2) {
  if (!meters && meters !== 0) return '0'
  const km = meters / 1000
  return km.toFixed(decimals)
}

/**
 * 计算配速 (分钟/公里)
 * @param {number} distanceMeters - 距离（米）
 * @param {number} durationSeconds - 时长（秒）
 * @returns {string}
 */
export function calculatePace(distanceMeters, durationSeconds) {
  if (!distanceMeters || !durationSeconds) return '--\'--"'

  const distanceKm = distanceMeters / 1000
  const paceSecondsPerKm = durationSeconds / distanceKm
  const paceMins = Math.floor(paceSecondsPerKm / 60)
  const paceSecs = Math.floor(paceSecondsPerKm % 60)

  return `${paceMins}'${String(paceSecs).padStart(2, '0')}"`
}

/**
 * 格式化配速字符串
 * @param {string} pace - 配速字符串 如 5'45"
 * @returns {string}
 */
export function formatPace(pace) {
  if (!pace) return '--\'--"'
  return pace
}

/**
 * 相对时间显示
 * @param {Date|string|number} date - 日期
 * @returns {string}
 */
export function relativeTime(date) {
  if (!date) return ''

  const d = new Date(date)
  const now = new Date()
  const diff = now - d

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) {
    return formatDate(date, 'MM-DD HH:mm')
  } else if (days > 0) {
    return `${days}天前`
  } else if (hours > 0) {
    return `${hours}小时前`
  } else if (minutes > 0) {
    return `${minutes}分钟前`
  } else {
    return '刚刚'
  }
}

/**
 * 获取本周开始和结束日期
 * @returns {object}
 */
export function getWeekRange() {
  const now = new Date()
  const dayOfWeek = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek + 1)
  monday.setHours(0, 0, 0, 0)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)

  return {
    start: monday,
    end: sunday
  }
}

/**
 * 获取本月开始和结束日期
 * @returns {object}
 */
export function getMonthRange() {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  lastDay.setHours(23, 59, 59, 999)

  return {
    start: firstDay,
    end: lastDay
  }
}

/**
 * 生成唯一ID
 * @returns {string}
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

/**
 * 深拷贝
 * @param {any} obj - 对象
 * @returns {any}
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item))
  }

  const cloned = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  return cloned
}

/**
 * 节流函数
 * @param {function} func - 函数
 * @param {number} wait - 等待时间(ms)
 * @returns {function}
 */
export function throttle(func, wait = 300) {
  let timeout = null
  let previous = 0

  return function (...args) {
    const now = Date.now()
    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * 防抖函数
 * @param {function} func - 函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {function}
 */
export function debounce(func, delay = 300) {
  let timeout = null

  return function (...args) {
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

/**
 * 验证手机号
 * @param {string} phone - 手机号
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone) return false
  return /^1[3-9]\d{9}$/.test(phone)
}

/**
 * 显示加载提示
 * @param {string} title - 提示文字
 */
export function showLoading(title = '加载中...') {
  uni.showLoading({
    title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
export function hideLoading() {
  uni.hideLoading()
}

/**
 * 显示成功提示
 * @param {string} title - 提示文字
 * @param {function} callback - 回调
 */
export function showSuccess(title = '成功', callback) {
  uni.showToast({
    title,
    icon: 'success',
    duration: 2000,
    success: () => {
      if (callback) setTimeout(callback, 2000)
    }
  })
}

/**
 * 显示错误提示
 * @param {string} title - 提示文字
 */
export function showError(title = '出错了') {
  uni.showToast({
    title,
    icon: 'none',
    duration: 2000
  })
}

/**
 * 确认对话框
 * @param {object} options - 选项
 * @returns {Promise<boolean>}
 */
export function showConfirm(options) {
  return new Promise((resolve) => {
    const { title = '提示', content = '', confirmText = '确定', cancelText = '取消' } = options

    uni.showModal({
      title,
      content,
      confirmText,
      cancelText,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

/**
 * 获取用户当前位置
 * @returns {Promise<object>}
 */
export function getLocation() {
  return new Promise((resolve, reject) => {
    uni.getLocation({
      type: 'gcj02',
      success: (res) => {
        resolve({
          latitude: res.latitude,
          longitude: res.longitude,
          speed: res.speed,
          accuracy: res.accuracy
        })
      },
      fail: (err) => {
        reject(err)
      }
    })
  })
}

/**
 * 跳转到页面（带登录检查）
 * @param {string} url - 页面路径
 * @param {object} params - 参数
 */
export function navigateTo(url, params = {}) {
  const query = Object.keys(params)
    .map(key => `${key}=${encodeURIComponent(params[key])}`)
    .join('&')

  if (query) {
    url = `${url}?${query}`
  }

  uni.navigateTo({ url })
}

/**
 * 跳转到tabBar页面
 * @param {string} url - 页面路径
 */
export function switchTab(url) {
  uni.switchTab({ url })
}

/**
 * 返回上一页
 * @param {number} delta - 返回页数
 */
export function navigateBack(delta = 1) {
  uni.navigateBack({ delta })
}
