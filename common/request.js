// 跑团管理小程序 - 云函数调用封装
import { CLOUD_FUNCTIONS } from './constants.js'

// 环境ID，默认为当前环境
let envId = ''

/**
 * 设置云开发环境ID
 * @param {string} id - 环境ID
 */
export function setEnvId(id) {
  envId = id
}

/**
 * 调用云函数
 * @param {string} name - 云函数名称
 * @param {object} data - 参数数据
 * @returns {Promise<any>}
 */
export async function callFunction(name, data = {}) {
  if (!envId) {
    console.warn('环境ID未设置，尝试获取...')
    // 尝试从storage获取
    try {
      const stored = uni.getStorageSync('envId')
      if (stored) {
        envId = stored
      }
    } catch (e) {
      console.error('获取环境ID失败', e)
    }
  }

  return new Promise((resolve, reject) => {
    uni.cloud.callFunction({
      name: name,
      env: envId ? { envId } : undefined,
      data: data,
      success: (res) => {
        if (res.errMsg && res.errMsg.includes('ok')) {
          resolve(res.result)
        } else {
          reject(new Error(res.errMsg || '调用失败'))
        }
      },
      fail: (err) => {
        console.error(`云函数${name}调用失败:`, err)
        reject(err)
      }
    })
  })
}

/**
 * 用户登录
 * @param {string} code - 微信登录code
 * @returns {Promise<object>}
 */
export async function userLogin(code) {
  return callFunction(CLOUD_FUNCTIONS.USER_LOGIN, { code })
}

/**
 * 获取用户信息
 * @returns {Promise<object>}
 */
export async function getUserInfo() {
  return callFunction(CLOUD_FUNCTIONS.USER_GET_INFO)
}

/**
 * 更新用户信息
 * @param {object} userInfo - 用户信息
 * @returns {Promise<object>}
 */
export async function updateUserInfo(userInfo) {
  return callFunction(CLOUD_FUNCTIONS.USER_UPDATE, { userInfo })
}

/**
 * 更新我的群组
 * @param {array} groupIds - 群组ID列表
 * @returns {Promise<object>}
 */
export async function updateMyGroup(groupIds) {
  return callFunction(CLOUD_FUNCTIONS.USER_UPDATE_GROUP, { groupIds })
}

/**
 * 获取积分排行
 * @param {string} groupId - 跑团ID
 * @param {string} period - 周期：week/month/all
 * @returns {Promise<array>}
 */
export async function getPointsList(groupId, period = 'all') {
  return callFunction(CLOUD_FUNCTIONS.POINTS_GET_LIST, { groupId, period })
}

/**
 * 获取积分分类
 * @param {string} groupId - 跑团ID
 * @returns {Promise<array>}
 */
export async function getPointCategories(groupId) {
  return callFunction(CLOUD_FUNCTIONS.POINTS_GET_CATEGORIES, { groupId })
}

/**
 * 提交积分
 * @param {object} params - 提交参数
 * @returns {Promise<object>}
 */
export async function submitPoints(params) {
  const { groupId, categoryId, points, description, images } = params
  return callFunction(CLOUD_FUNCTIONS.POINTS_SUBMIT, {
    groupId,
    categoryId,
    points,
    description,
    images
  })
}

/**
 * 审批积分（管理员）
 * @param {string} recordId - 记录ID
 * @param {string} action - 操作：approve/reject
 * @param {string} reason - 拒绝原因
 * @returns {Promise<object>}
 */
export async function approvePoints(recordId, action, reason = '') {
  return callFunction(CLOUD_FUNCTIONS.POINTS_APPROVE, {
    recordId,
    action,
    reason
  })
}

/**
 * 管理员为用户添加积分
 * @param {string} userId - 用户ID
 * @param {string} groupId - 跑团ID
 * @param {number} points - 积分数量
 * @param {string} description - 说明
 * @returns {Promise<object>}
 */
export async function addPointsForUser(userId, groupId, points, description) {
  return callFunction(CLOUD_FUNCTIONS.POINTS_ADD_FOR_USER, {
    userId,
    groupId,
    points,
    description
  })
}

/**
 * 获取跑步记录
 * @param {string} groupId - 跑团ID
 * @param {object} options - 查询选项
 * @returns {Promise<array>}
 */
export async function getRunningRecords(groupId, options = {}) {
  return callFunction(CLOUD_FUNCTIONS.RUNNING_GET_RECORDS, {
    groupId,
    ...options
  })
}

/**
 * 获取跑步数据摘要
 * @param {string} groupId - 跑团ID
 * @returns {Promise<object>}
 */
export async function getRunningSummary(groupId) {
  return callFunction(CLOUD_FUNCTIONS.RUNNING_GET_SUMMARY, { groupId })
}

/**
 * 手动添加跑步记录
 * @param {object} record - 记录数据
 * @returns {Promise<object>}
 */
export async function manualAddRunning(record) {
  return callFunction(CLOUD_FUNCTIONS.RUNNING_MANUAL_ADD, record)
}

/**
 * 获取佳明授权URL
 * @param {string} groupId - 跑团ID
 * @returns {Promise<string>}
 */
export async function getGarminAuthUrl(groupId) {
  return callFunction(CLOUD_FUNCTIONS.OAUTH_GARMIN, {
    action: 'getAuthUrl',
    groupId
  })
}

/**
 * 获取华为授权URL
 * @param {string} groupId - 跑团ID
 * @returns {Promise<string>}
 */
export async function getHuaweiAuthUrl(groupId) {
  return callFunction(CLOUD_FUNCTIONS.OAUTH_HUAWEI, {
    action: 'getAuthUrl',
    groupId
  })
}

/**
 * 同步佳明数据
 * @returns {Promise<object>}
 */
export async function syncGarmin() {
  return callFunction(CLOUD_FUNCTIONS.SYNC_GARMIN)
}

/**
 * 同步华为数据
 * @returns {Promise<object>}
 */
export async function syncHuawei() {
  return callFunction(CLOUD_FUNCTIONS.SYNC_HUAWEI)
}

/**
 * 获取成员列表（管理员）
 * @param {object} params - 查询参数
 * @param {array} params.groupIds - 群组ID列表（支持多选）
 * @param {string} params.province - 省份筛选
 * @param {string} params.city - 城市筛选
 * @returns {Promise<array>}
 */
export async function getMembers(params = {}) {
  const { groupIds, province, city } = params
  return callFunction(CLOUD_FUNCTIONS.ADMIN_GET_MEMBERS, { groupIds, province, city })
}

/**
 * 更新成员信息（管理员）
 * @param {string} memberId - 成员ID
 * @param {object} data - 更新数据
 * @returns {Promise<object>}
 */
export async function updateMember(memberId, data) {
  return callFunction(CLOUD_FUNCTIONS.ADMIN_UPDATE_MEMBER, {
    memberId,
    ...data
  })
}

/**
 * 获取公告列表
 * @param {string} groupId - 跑团ID
 * @returns {Promise<array>}
 */
export async function getAnnouncements(groupId) {
  return callFunction(CLOUD_FUNCTIONS.ADMIN_GET_ANNOUNCEMENTS, { groupId })
}

/**
 * 发布公告（管理员）
 * @param {object} announcement - 公告内容
 * @returns {Promise<object>}
 */
export async function publishAnnouncement(announcement) {
  return callFunction(CLOUD_FUNCTIONS.ADMIN_PUBLISH_ANNOUNCEMENT, announcement)
}

/**
 * 获取积分分类管理列表（管理员）
 * @param {string} groupId - 跑团ID
 * @returns {Promise<array>}
 */
export async function getCategories(groupId) {
  return callFunction(CLOUD_FUNCTIONS.ADMIN_GET_CATEGORIES, { groupId })
}

/**
 * 保存积分分类（管理员）
 * @param {object} category - 分类数据
 * @returns {Promise<object>}
 */
export async function saveCategory(category) {
  return callFunction(CLOUD_FUNCTIONS.ADMIN_SAVE_CATEGORY, category)
}

// ========== V1.0 用户管理相关 ==========

/**
 * 用户注册
 * @param {object} params - 注册参数
 * @returns {Promise<object>}
 */
export async function userRegister(params) {
  return callFunction(CLOUD_FUNCTIONS.USER_REGISTER, params)
}

/**
 * 获取群组列表
 * @returns {Promise<array>}
 */
export async function getGroups() {
  return callFunction(CLOUD_FUNCTIONS.GROUP_GET_LIST)
}

/**
 * 获取管理员列表
 * @returns {Promise<array>}
 */
export async function getAdmins() {
  return callFunction(CLOUD_FUNCTIONS.ADMIN_GET_ADMINS)
}

/**
 * 更新管理员状态
 * @param {string} userId - 用户ID
 * @param {string} action - 操作：promote/revoke
 * @returns {Promise<object>}
 */
export async function updateAdmin(userId, action) {
  return callFunction(CLOUD_FUNCTIONS.ADMIN_UPDATE_ADMIN, { userId, action })
}

/**
 * 更新群组设置
 * @param {string} groupId - 群组ID
 * @param {object} data - 更新数据
 * @returns {Promise<object>}
 */
export async function updateGroup(groupId, data) {
  return callFunction(CLOUD_FUNCTIONS.ADMIN_UPDATE_GROUP, { groupId, ...data })
}

// ========== 赛事日历相关 ==========

/**
 * 获取赛事列表
 * @param {object} params - 查询参数
 * @param {string} params.yearMonth - 年月 (YYYY-MM)
 * @param {string} params.type - 赛事类型
 * @param {string} params.province - 省份
 * @returns {Promise<array>}
 */
export async function getRaceList(params = {}) {
  return callFunction(CLOUD_FUNCTIONS.RACE_GET_LIST, params)
}

/**
 * 获取赛事详情
 * @param {string} raceId - 赛事ID
 * @returns {Promise<object>}
 */
export async function getRaceDetail(raceId) {
  return callFunction(CLOUD_FUNCTIONS.RACE_GET_DETAIL, { raceId })
}

/**
 * 报名赛事
 * @param {object} params - 报名参数
 * @returns {Promise<object>}
 */
export async function registerRace(params) {
  return callFunction(CLOUD_FUNCTIONS.RACE_REGISTER, params)
}

/**
 * 获取我的报名
 * @returns {Promise<array>}
 */
export async function getMyRaceRegistrations() {
  return callFunction(CLOUD_FUNCTIONS.RACE_GET_MY_REGISTRATIONS)
}

/**
 * 发布赛事（管理员）
 * @param {object} race - 赛事数据
 * @returns {Promise<object>}
 */
export async function publishRace(race) {
  return callFunction(CLOUD_FUNCTIONS.RACE_PUBLISH, race)
}

/**
 * 取消赛事（管理员）
 * @param {string} raceId - 赛事ID
 * @param {string} reason - 取消原因
 * @returns {Promise<object>}
 */
export async function cancelRace(raceId, reason) {
  return callFunction(CLOUD_FUNCTIONS.RACE_CANCEL, { raceId, reason })
}

/**
 * 关注/取消关注赛事
 * @param {string} raceId - 赛事ID
 * @param {string} action - 操作: follow/unfollow/setReminder
 * @param {number} reminder - 提醒时间(毫秒)
 * @returns {Promise<object>}
 */
export async function followRace(raceId, action, reminder) {
  return callFunction(CLOUD_FUNCTIONS.RACE_FOLLOW, { raceId, action, reminder })
}

/**
 * 获取我关注的赛事
 * @returns {Promise<array>}
 */
export async function getMyFollowedRaces() {
  return callFunction(CLOUD_FUNCTIONS.RACE_GET_MY_FOLLOWED)
}
