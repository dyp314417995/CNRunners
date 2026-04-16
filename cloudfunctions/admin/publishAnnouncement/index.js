// 云函数：发布公告（管理员）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const announcementsCollection = db.collection('announcements')
const membersCollection = db.collection('members')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { groupId, title, content, isTop = false } = event

  if (!groupId || !title || !content) {
    return {
      success: false,
      error: '参数不完整'
    }
  }

  try {
    // 检查当前用户是否为管理员
    const currentMember = await membersCollection
      .where({
        userId: openid,
        groupId,
        role: 'admin',
        status: 'active'
      })
      .get()

    if (!currentMember.data || currentMember.data.length === 0) {
      return {
        success: false,
        error: '权限不足'
      }
    }

    // 创建公告
    const result = await announcementsCollection.add({
      data: {
        groupId,
        title,
        content,
        authorId: openid,
        isTop,
        publishTime: db.serverDate(),
        createTime: db.serverDate()
      }
    })

    return {
      success: true,
      data: {
        announcementId: result._id,
        message: '公告发布成功'
      }
    }
  } catch (err) {
    console.error('发布公告错误:', err)
    return {
      success: false,
      error: err.message || '发布失败'
    }
  }
}
