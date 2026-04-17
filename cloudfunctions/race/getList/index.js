// 云函数：获取赛事列表
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
  const wxContext = cloud.getWXContext()
  const { yearMonth, type, province, page = 1, pageSize = 20 } = event

  try {
    // 构建查询条件
    const query = {}

    // 按年月筛选（赛事日期）
    if (yearMonth) {
      const [year, month] = yearMonth.split('-')
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

      query.date = db.command.and(
        db.command.gte(startDate),
        db.command.lte(endDate)
      )
    }

    // 按类型筛选
    if (type) {
      query.type = type
    }

    // 按省份筛选
    if (province) {
      query.province = province
    }

    // 查询赛事列表
    const result = await racesCollection
      .where(query)
      .orderBy('date', 'asc')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .get()

    // 格式化返回数据
    const races = (result.data || []).map(race => ({
      _id: race._id,
      name: race.name,
      dateStr: formatDate(race.date),
      date: race.date,
      location: race.location,
      province: race.province,
      type: race.type,
      typeName: RACE_TYPE_MAP[race.type] || race.type,
      distances: race.distances || [],
      fee: race.fee || 0,
      organizer: race.organizer || '',
      status: race.status,
      coverGradient: race.coverGradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      registeredCount: race.registeredCount || 0,
      maxCount: race.maxCount || 0
    }))

    return {
      success: true,
      data: races,
      total: result.data?.length || 0
    }
  } catch (err) {
    console.error('获取赛事列表错误:', err)
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
