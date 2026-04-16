// 云函数：获取跑步数据摘要
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const runningRecordsCollection = db.collection('runningRecords')
const membersCollection = db.collection('members')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { groupId, userId } = event

  if (!openid && !userId) {
    return {
      success: false,
      error: '用户未登录'
    }
  }

  const targetUserId = userId || openid

  try {
    // 获取本周开始日期
    const now = new Date()
    const dayOfWeek = now.getDay() || 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOfWeek + 1)
    monday.setHours(0, 0, 0, 0)

    // 获取本月开始日期
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    firstDay.setHours(0, 0, 0, 0)

    // 查询条件
    const baseQuery = {
      userId: targetUserId
    }

    // 本周数据
    const weekQuery = {
      ...baseQuery,
      startTime: db.command.gte(monday)
    }

    // 本月数据
    const monthQuery = {
      ...baseQuery,
      startTime: db.command.gte(firstDay)
    }

    // 并行查询
    const [weekResult, monthResult, totalResult] = await Promise.all([
      runningRecordsCollection.where(weekQuery).get(),
      runningRecordsCollection.where(monthQuery).get(),
      runningRecordsCollection.where(baseQuery).get()
    ])

    // 计算本周跑量
    let weekDistance = 0
    let weekDuration = 0
    for (const record of weekResult.data) {
      weekDistance += record.distance || 0
      weekDuration += record.duration || 0
    }

    // 计算本月跑量
    let monthDistance = 0
    let monthDuration = 0
    for (const record of monthResult.data) {
      monthDistance += record.distance || 0
      monthDuration += record.duration || 0
    }

    // 计算累计跑量
    let totalDistance = 0
    let totalDuration = 0
    let totalCount = totalResult.data.length
    for (const record of totalResult.data) {
      totalDistance += record.distance || 0
      totalDuration += record.duration || 0
    }

    // 获取成员的周目标
    let weeklyGoal = 20 // 默认周目标20公里
    if (groupId) {
      const member = await membersCollection
        .where({
          userId: targetUserId,
          groupId,
          status: 'active'
        })
        .get()

      if (member.data && member.data.length > 0) {
        weeklyGoal = member.data[0].weeklyDistance || weeklyGoal
      }
    }

    // 获取本周每天的跑量（用于趋势图）
    const weekTrend = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)

      const dayRecords = weekResult.data.filter(r => {
        const recordDate = new Date(r.startTime)
        return recordDate >= date && recordDate < nextDate
      })

      let dayDistance = 0
      for (const record of dayRecords) {
        dayDistance += record.distance || 0
      }

      weekTrend.push({
        date: date.toISOString().split('T')[0],
        dayName: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
        distance: parseFloat(dayDistance.toFixed(2))
      })
    }

    return {
      success: true,
      data: {
        week: {
          distance: parseFloat(weekDistance.toFixed(2)),
          duration: weekDuration,
          count: weekResult.data.length,
          goal: weeklyGoal,
          goalProgress: Math.min(100, Math.round((weekDistance / weeklyGoal) * 100))
        },
        month: {
          distance: parseFloat(monthDistance.toFixed(2)),
          duration: monthDuration,
          count: monthResult.data.length
        },
        total: {
          distance: parseFloat(totalDistance.toFixed(2)),
          duration: totalDuration,
          count: totalCount
        },
        weekTrend
      }
    }
  } catch (err) {
    console.error('获取跑步摘要错误:', err)
    return {
      success: false,
      error: err.message || '获取失败'
    }
  }
}
