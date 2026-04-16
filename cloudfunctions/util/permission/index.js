// 云函数：权限工具
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const membersCollection = db.collection('members')

/**
 * 获取当前用户的角色权限
 * @param {string} openid - 用户openid
 * @param {string} groupId - 跑团ID
 * @returns {Promise<object>}
 */
async function getMemberRole(openid, groupId) {
  if (!openid) {
    return { authorized: false, role: null }
  }

  const query = {
    userId: openid,
    status: 'active'
  }

  if (groupId) {
    query.groupId = groupId
  }

  const result = await membersCollection.where(query).get()

  if (!result.data || result.data.length === 0) {
    return { authorized: false, role: null }
  }

  return {
    authorized: true,
    role: result.data[0].role,
    member: result.data[0]
  }
}

/**
 * 检查用户是否已登录
 * @param {object} event - 事件参数
 * @param {object} context - 上下文
 * @returns {Promise<object>}
 */
async function requireAuth(event, context) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    throw new Error('NOT_LOGGED_IN')
  }

  return { openid }
}

/**
 * 检查用户是否为管理员
 * @param {string} groupId - 跑团ID
 * @returns {Promise<object>}
 */
async function requireAdmin(groupId) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    throw new Error('NOT_LOGGED_IN')
  }

  const { authorized, role } = await getMemberRole(openid, groupId)

  if (!authorized) {
    throw new Error('NOT_IN_GROUP')
  }

  if (role !== 'admin') {
    throw new Error('NOT_ADMIN')
  }

  return { openid, role }
}

/**
 * 通用权限检查中间件
 * @param {object} options - 配置选项
 * @returns {Promise<object>}
 */
async function checkPermission(options = {}) {
  const { requireLogin = true, requireAdmin = false, groupId = null } = options

  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 检查登录
  if (requireLogin && !openid) {
    return {
      success: false,
      error: 'NOT_LOGGED_IN',
      message: '请先登录'
    }
  }

  // 如果不需要groupId，从参数中获取
  const targetGroupId = groupId || event.groupId

  // 如果需要管理员权限
  if (requireAdmin && targetGroupId) {
    const { authorized, role, member } = await getMemberRole(openid, targetGroupId)

    if (!authorized) {
      return {
        success: false,
        error: 'NOT_IN_GROUP',
        message: '您不在该跑团中'
      }
    }

    if (role !== 'admin') {
      return {
        success: false,
        error: 'NOT_ADMIN',
        message: '权限不足，需要管理员权限'
      }
    }

    return {
      success: true,
      openid,
      role,
      member
    }
  }

  // 已登录但不需要特殊权限
  if (openid) {
    const { authorized, role, member } = await getMemberRole(openid, targetGroupId)
    return {
      success: true,
      openid,
      role: role || 'guest',
      member
    }
  }

  return { success: true, openid: null, role: null }
}

// 云函数入口
exports.main = async (event, context) => {
  const { action } = event

  // 处理不同的权限检查操作
  switch (action) {
    case 'checkLogin':
      return await requireAuth(event, context)

    case 'checkAdmin':
      return await requireAdmin(event.groupId)

    case 'getRole':
      return await getMemberRole(event.openid, event.groupId)

    case 'check':
      return await checkPermission({
        requireLogin: event.requireLogin !== false,
        requireAdmin: event.requireAdmin === true,
        groupId: event.groupId
      })

    default:
      return {
        success: false,
        error: 'UNKNOWN_ACTION'
      }
  }
}
