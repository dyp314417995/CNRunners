// 云函数：佳明OAuth授权
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const deviceBindingsCollection = db.collection('deviceBindings')

// 佳明API配置 - 需要用户替换为自己的Consumer Key
const GARMIN_CONSUMER_KEY = process.env.GARMIN_CONSUMER_KEY || 'your_garmin_consumer_key'
const GARMIN_CONSUMER_SECRET = process.env.GARMIN_CONSUMER_SECRET || 'your_garmin_consumer_secret'
const GARMIN_REDIRECT_URI = process.env.GARMIN_REDIRECT_URI || 'https://api.weixin.qq.com/tcb/push_cloud_return'

const GARMIN_AUTH_URL = 'https://connect.garmin.com/oauth/oauthConfirm'
const GARMIN_TOKEN_URL = 'https://connect.garmin.com/oauth/oauth-service-2.0/access_token'
const GARMIN_API_BASE = 'https://api.garmin.com'

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { action, code, state, groupId } = event

  try {
    switch (action) {
      case 'getAuthUrl':
        return await getAuthUrl()

      case 'callback':
        return await handleCallback()

      case 'getBindingStatus':
        return await getBindingStatus()

      case 'unbind':
        return await unbind()

      default:
        return {
          success: false,
          error: '未知操作'
        }
    }
  } catch (err) {
    console.error('佳明OAuth错误:', err)
    return {
      success: false,
      error: err.message || '操作失败'
    }
  }

  // 获取授权URL
  async function getAuthUrl() {
    if (!openid) {
      return {
        success: false,
        error: '请先登录'
      }
    }

    // 构建授权URL
    const authUrl = `${GARMIN_AUTH_URL}?client_id=${GARMIN_CONSUMER_KEY}&redirect_uri=${encodeURIComponent(GARMIN_REDIRECT_URI)}&response_type=code&state=${openid}|${groupId || 'default'}`

    return {
      success: true,
      data: {
        authUrl,
        message: '请在打开的页面完成授权'
      }
    }
  }

  // 处理回调
  async function handleCallback() {
    if (!code) {
      return {
        success: false,
        error: '授权码不能为空'
      }
    }

    // 解析state
    let userId = openid
    let targetGroupId = groupId || 'default'

    if (state) {
      const stateParts = state.split('|')
      userId = stateParts[0] || openid
      targetGroupId = stateParts[1] || targetGroupId
    }

    if (!userId) {
      return {
        success: false,
        error: '用户ID无效'
      }
    }

    // 使用code换取access_token
    // 注意：实际环境中需要在后端完成token交换
    // 这里简化处理，实际需要server-to-server调用
    try {
      // 尝试获取token（实际需要通过后端API）
      // const tokenResponse = await requestToken(code)

      // 模拟成功绑定
      const now = Date.now()
      const expireTime = now + 30 * 24 * 60 * 60 * 1000 // 30天后过期

      // 检查是否已存在绑定
      const existing = await deviceBindingsCollection
        .where({
          userId,
          platform: 'garmin'
        })
        .get()

      if (existing.data && existing.data.length > 0) {
        // 更新现有绑定
        await deviceBindingsCollection.doc(existing.data[0]._id).update({
          data: {
            accessToken: code, // 实际应该是真正的token
            tokenExpireTime: expireTime,
            lastSyncTime: now,
            status: 'active'
          }
        })
      } else {
        // 创建新绑定
        await deviceBindingsCollection.add({
          data: {
            groupId: targetGroupId,
            userId,
            platform: 'garmin',
            accessToken: code, // 实际应该是真正的token
            refreshToken: '',
            tokenExpireTime: expireTime,
            bindTime: now,
            lastSyncTime: now,
            status: 'active'
          }
        })
      }

      return {
        success: true,
        data: {
          platform: 'garmin',
          message: '绑定成功'
        }
      }
    } catch (err) {
      return {
        success: false,
        error: '获取访问令牌失败'
      }
    }
  }

  // 获取绑定状态
  async function getBindingStatus() {
    if (!openid) {
      return {
        success: false,
        error: '请先登录'
      }
    }

    const binding = await deviceBindingsCollection
      .where({
        userId: openid,
        platform: 'garmin'
      })
      .get()

    if (binding.data && binding.data.length > 0) {
      const b = binding.data[0]
      return {
        success: true,
        data: {
          bound: true,
          status: b.status,
          bindTime: b.bindTime,
          lastSyncTime: b.lastSyncTime,
          expired: b.tokenExpireTime ? Date.now() > b.tokenExpireTime : false
        }
      }
    }

    return {
      success: true,
      data: {
        bound: false
      }
    }
  }

  // 解绑设备
  async function unbind() {
    if (!openid) {
      return {
        success: false,
        error: '请先登录'
      }
    }

    await deviceBindingsCollection
      .where({
        userId: openid,
        platform: 'garmin'
      })
      .update({
        data: {
          status: 'revoked'
        }
      })

    return {
      success: true,
      message: '已解除绑定'
    }
  }
}
