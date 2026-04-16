// 云函数：获取公告列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const announcementsCollection = db.collection('announcements')
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { groupId, page = 1, pageSize = 20 } = event

  if (!groupId) {
    return {
      success: false,
      error: '跑团ID不能为空'
    }
  }

  try {
    // 获取公告列表
    const result = await announcementsCollection
      .where({ groupId })
      .orderBy('isTop', 'desc')
      .orderBy('publishTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 获取作者信息
    const announcements = []
    for (const item of result.data) {
      const authorInfo = await usersCollection.doc(item.authorId).get()
      announcements.push({
        ...item,
        authorName: authorInfo.data?.nickName || '未知',
        authorAvatar: authorInfo.data?.avatarUrl || ''
      })
    }

    // 获取总数
    const countResult = await announcementsCollection.where({ groupId }).count()

    return {
      success: true,
      data: {
        list: announcements,
        total: countResult.total,
        page,
        pageSize
      }
    }
  } catch (err) {
    console.error('获取公告列表错误:', err)
    return {
      success: false,
      error: err.message || '获取失败'
    }
  }
}
