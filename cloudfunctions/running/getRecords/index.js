// 云函数：获取跑步记录
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const runningRecordsCollection = db.collection('runningRecords')
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const {
    groupId,
    userId,
    source,
    startDate,
    endDate,
    page = 1,
    pageSize = 20
  } = event

  try {
    // 构建查询条件
    const query = {}

    if (groupId) query.groupId = groupId

    // 如果指定了用户ID，查询该用户的记录
    // 否则查询当前用户的记录
    if (userId) {
      query.userId = userId
    } else if (openid) {
      query.userId = openid
    } else {
      return {
        success: false,
        error: '用户未登录或未指定用户'
      }
    }

    if (source) {
      query.source = source
    }

    // 日期范围筛选
    if (startDate || endDate) {
      query.startTime = {}
      if (startDate) {
        query.startTime.$gte = new Date(startDate)
      }
      if (endDate) {
        query.startTime.$lte = new Date(endDate)
      }
    }

    // 查询记录
    const result = await runningRecordsCollection
      .where(query)
      .orderBy('startTime', 'desc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 获取用户信息
    const records = []
    for (const record of result.data) {
      const userInfo = await usersCollection.doc(record.userId).get()
      records.push({
        ...record,
        nickName: userInfo.data?.nickName || '未知',
        avatarUrl: userInfo.data?.avatarUrl || ''
      })
    }

    // 获取总数
    const countResult = await runningRecordsCollection.where(query).count()

    return {
      success: true,
      data: {
        list: records,
        total: countResult.total,
        page,
        pageSize
      }
    }
  } catch (err) {
    console.error('获取跑步记录错误:', err)
    return {
      success: false,
      error: err.message || '获取失败'
    }
  }
}
