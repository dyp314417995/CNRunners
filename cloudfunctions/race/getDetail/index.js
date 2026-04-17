// 云函数：获取赛事详情
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const racesCollection = db.collection('races')

// 赛事类型映射
const RACE_TYPE_MAP = {
  marathon: '马拉松',
  half_marathon: '半程马拉松',
  '10k': '10公里',
  '5k': '5公里',
  trail: '越野跑',
  ultra: '超级马拉松',
  fun_run: '健康跑'
}

exports.main = async (event, context) => {
  const { raceId } = event

  if (!raceId) {
    return {
      success: false,
      error: '赛事ID不能为空'
    }
  }

  try {
    const result = await racesCollection.doc(raceId).get()

    if (!result.data) {
      return {
        success: false,
        error: '赛事不存在'
      }
    }

    const race = result.data

    return {
      success: true,
      data: {
        _id: race._id,
        name: race.name,
        date: race.date,
        dateStr: formatDate(race.date),
        location: race.location,
        province: race.province,
        type: race.type,
        typeName: RACE_TYPE_MAP[race.type] || race.type,
        distances: race.distances || [],
        fee: race.fee || 0,
        organizer: race.organizer || '',
        status: race.status,
        registrationPeriod: race.registrationPeriod || '',
        contactPhone: race.contactPhone || '',
        contactEmail: race.contactEmail || '',
        description: race.description || '',
        courseDescription: race.courseDescription || '',
        notices: race.notices || [],
        categories: race.categories || [],
        registeredCount: race.registeredCount || 0,
        maxCount: race.maxCount || 0,
        coverGradient: race.coverGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }
    }
  } catch (err) {
    console.error('获取赛事详情错误:', err)
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
