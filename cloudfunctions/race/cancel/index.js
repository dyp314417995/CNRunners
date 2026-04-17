// 云函数：取消赛事（管理员）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const racesCollection = db.collection('races')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // TODO: 需要验证管理员权限
  // const userRes = await db.collection('users').doc(openid).get()
  // if (!userRes.data || (userRes.data.role !== 'admin' && userRes.data.role !== 'super_admin')) {
  //   return { success: false, error: '无权限' }
  // }

  const { raceId, reason } = event

  if (!raceId) {
    return {
      success: false,
      error: '赛事ID不能为空'
    }
  }

  try {
    const race = await racesCollection.doc(raceId).get()

    if (!race.data) {
      return {
        success: false,
        error: '赛事不存在'
      }
    }

    // 更新赛事状态为取消
    await racesCollection.doc(raceId).update({
      data: {
        status: 'cancelled',
        cancelReason: reason || '',
        cancelledAt: db.serverDate(),
        updatedAt: db.serverDate()
      }
    })

    // TODO: 可以发送通知给已报名用户

    return {
      success: true,
      message: '赛事已取消'
    }
  } catch (err) {
    console.error('取消赛事错误:', err)
    return {
      success: false,
      error: err.message || '取消失败'
    }
  }
}
