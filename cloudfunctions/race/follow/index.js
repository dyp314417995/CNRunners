// 云函数：关注/取消关注赛事
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const raceFollowsCollection = db.collection('raceFollows')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      error: '请先登录'
    }
  }

  const { raceId, action, reminder } = event

  if (!raceId) {
    return {
      success: false,
      error: '赛事ID不能为空'
    }
  }

  try {
    if (action === 'follow') {
      // 关注赛事
      const existing = await raceFollowsCollection
        .where({
          userId: openid,
          raceId
        })
        .get()

      if (existing.data && existing.data.length > 0) {
        return {
          success: true,
          data: { alreadyFollowed: true }
        }
      }

      await raceFollowsCollection.add({
        data: {
          userId: openid,
          raceId,
          reminderTime: reminder || null, // 提醒时间
          followedAt: db.serverDate()
        }
      })

      return {
        success: true,
        data: { followed: true }
      }
    } else if (action === 'unfollow') {
      // 取消关注
      await raceFollowsCollection
        .where({
          userId: openid,
          raceId
        })
        .remove()

      return {
        success: true,
        data: { unfollowed: true }
      }
    } else if (action === 'setReminder') {
      // 设置提醒
      await raceFollowsCollection
        .where({
          userId: openid,
          raceId
        })
        .update({
          data: {
            reminderTime: reminder
          }
        })

      return {
        success: true,
        data: { reminderSet: true }
      }
    } else {
      return {
        success: false,
        error: '未知操作'
      }
    }
  } catch (err) {
    console.error('关注赛事错误:', err)
    return {
      success: false,
      error: err.message || '操作失败'
    }
  }
}
