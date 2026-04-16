// 云函数：获取积分排行列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const pointRecordsCollection = db.collection('pointRecords')
const membersCollection = db.collection('members')
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { groupId, period = 'all', page = 1, pageSize = 20 } = event

  if (!groupId) {
    return {
      success: false,
      error: '跑团ID不能为空'
    }
  }

  try {
    // 构建时间过滤条件
    let timeFilter = {}
    const now = new Date()

    if (period === 'week') {
      const dayOfWeek = now.getDay() || 7
      const monday = new Date(now)
      monday.setDate(now.getDate() - dayOfWeek + 1)
      monday.setHours(0, 0, 0, 0)
      timeFilter = {
        createTime: db.command.gte(monday)
      }
    } else if (period === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      firstDay.setHours(0, 0, 0, 0)
      timeFilter = {
        createTime: db.command.gte(firstDay)
      }
    }

    // 查询已批准的积分记录
    const matchCondition = {
      groupId,
      status: 'approved',
      ...timeFilter
    }

    // 使用聚合查询用户积分总和
    const aggregation = await pointRecordsCollection.aggregate()
      .match(matchCondition)
      .group({
        _id: '$userId',
        totalPoints: db.command.aggregate.sum('$points')
      })
      .sort({
        totalPoints: -1
      })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .end()

    // 获取用户信息
    const rankingList = []
    for (const item of aggregation.data) {
      const userInfo = await usersCollection.doc(item._id).get()
      const memberInfo = await membersCollection
        .where({
          userId: item._id,
          groupId,
          status: 'active'
        })
        .get()

      rankingList.push({
        userId: item._id,
        nickName: userInfo.data?.nickName || '未知',
        avatarUrl: userInfo.data?.avatarUrl || '',
        totalPoints: item.totalPoints,
        weeklyDistance: memberInfo.data?.[0]?.weeklyDistance || 0,
        isCurrentUser: item._id === openid
      })
    }

    // 获取当前用户排名
    let currentUserRank = null
    if (openid) {
      const allRanking = await pointRecordsCollection.aggregate()
        .match({
          groupId,
          status: 'approved',
          ...timeFilter
        })
        .group({
          _id: '$userId',
          totalPoints: db.command.aggregate.sum('$points')
        })
        .sort({
          totalPoints: -1
        })
        .end()

      const rankIndex = allRanking.data.findIndex(item => item._id === openid)
      if (rankIndex !== -1) {
        currentUserRank = rankIndex + 1
      }
    }

    return {
      success: true,
      data: {
        list: rankingList,
        currentUserRank,
        period,
        page,
        pageSize
      }
    }
  } catch (err) {
    console.error('获取积分列表错误:', err)
    return {
      success: false,
      error: err.message || '获取失败'
    }
  }
}
