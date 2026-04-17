// 云函数：获取我的报名
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const registrationsCollection = db.collection('raceRegistrations')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      error: '请先登录'
    }
  }

  try {
    const result = await registrationsCollection
      .where({
        userId: openid
      })
      .orderBy('registrationTime', 'desc')
      .get()

    const registrations = (result.data || []).map(reg => ({
      _id: reg._id,
      raceId: reg.raceId,
      raceName: reg.raceName,
      categoryId: reg.categoryId,
      categoryName: reg.categoryName,
      userName: reg.userName,
      fee: reg.fee,
      status: reg.status,
      registrationTime: reg.registrationTime
    }))

    return {
      success: true,
      data: registrations
    }
  } catch (err) {
    console.error('获取我的报名错误:', err)
    return {
      success: false,
      error: err.message || '获取失败'
    }
  }
}
