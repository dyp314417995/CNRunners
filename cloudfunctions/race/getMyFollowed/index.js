// 云函数：获取我关注的赛事
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const raceFollowsCollection = db.collection('raceFollows')
const racesCollection = db.collection('races')

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
    // 获取我关注的赛事ID列表
    const follows = await raceFollowsCollection
      .where({
        userId: openid
      })
      .orderBy('followedAt', 'desc')
      .get()

    if (!follows.data || follows.data.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    // 获取赛事详情
    const raceIds = follows.data.map(f => f.raceId)
    const races = await racesCollection
      .where({
        _id: db.command.in(raceIds)
      })
      .get()

    // 合并数据
    const followMap = {}
    follows.data.forEach(f => {
      followMap[f.raceId] = f
    })

    const result = (races.data || []).map(race => ({
      _id: race._id,
      name: race.name,
      date: race.date,
      dateStr: formatDate(race.date),
      location: race.location,
      province: race.province,
      type: race.type,
      typeName: race.typeName || '',
      distances: race.distances || [],
      fee: race.fee || 0,
      status: race.status,
      coverGradient: race.coverGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      reminderTime: followMap[race._id]?.reminderTime || 0,
      followedAt: followMap[race._id]?.followedAt
    }))

    // 按日期排序（即将开始的在前）
    result.sort((a, b) => new Date(a.date) - new Date(b.date))

    return {
      success: true,
      data: result
    }
  } catch (err) {
    console.error('获取关注的赛事错误:', err)
    return {
      success: false,
      error: err.message || '获取失败'
    }
  }
}

function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
