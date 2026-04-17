// 云函数：用户自主更新群组
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const usersCollection = db.collection('users')
const groupsCollection = db.collection('groups')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      error: '获取用户信息失败'
    }
  }

  const { groupIds } = event

  if (!groupIds || !Array.isArray(groupIds)) {
    return {
      success: false,
      error: '群组ID列表无效'
    }
  }

  try {
    // 检查用户是否存在
    const user = await usersCollection.doc(openid).get()
    if (!user.data) {
      return {
        success: false,
        error: '用户不存在'
      }
    }

    // 验证所选群组是否有效
    if (groupIds.length > 0) {
      const validGroups = await groupsCollection.where({
        _id: db.command.in(groupIds),
        isEnabled: true
      }).get()

      // 检查是否有无效或已禁用的群组
      if (validGroups.data.length !== groupIds.length) {
        const validIds = validGroups.data.map(g => g._id)
        const invalidIds = groupIds.filter(id => !validIds.includes(id))
        return {
          success: false,
          error: `群组[${invalidIds.join(', ')}]不存在或已禁用`
        }
      }
    }

    // 更新用户群组
    await usersCollection.doc(openid).update({
      data: {
        groupIds: groupIds,
        updateTime: db.serverDate()
      }
    })

    return {
      success: true,
      message: '群组已更新'
    }
  } catch (err) {
    console.error('更新用户群组错误:', err)
    return {
      success: false,
      error: err.message || '更新失败'
    }
  }
}
