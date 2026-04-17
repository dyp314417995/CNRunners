// 云函数：发布赛事（管理员）
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
  const openid = wxContext.OPENID

  // TODO: 需要验证管理员权限
  // const userRes = await db.collection('users').doc(openid).get()
  // if (!userRes.data || (userRes.data.role !== 'admin' && userRes.data.role !== 'super_admin')) {
  //   return { success: false, error: '无权限' }
  // }

  const {
    name,
    date,
    location,
    province,
    type,
    distances,
    fee,
    organizer,
    registrationPeriod,
    contactPhone,
    contactEmail,
    description,
    courseDescription,
    notices,
    categories,
    maxCount
  } = event

  if (!name || !date || !location) {
    return {
      success: false,
      error: '请填写完整的赛事信息'
    }
  }

  try {
    const coverGradients = {
      marathon: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      half_marathon: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      '10k': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      '5k': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      trail: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      ultra: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      fun_run: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    }

    const raceData = {
      name,
      date: new Date(date),
      location,
      province: province || '',
      type: type || 'marathon',
      typeName: RACE_TYPE_MAP[type] || '马拉松',
      distances: distances || [],
      fee: fee || 0,
      organizer: organizer || '',
      registrationPeriod: registrationPeriod || '',
      contactPhone: contactPhone || '',
      contactEmail: contactEmail || '',
      description: description || '',
      courseDescription: courseDescription || '',
      notices: notices || [],
      categories: categories || [],
      maxCount: maxCount || 0,
      registeredCount: 0,
      status: 'registration_open',
      coverGradient: coverGradients[type] || coverGradients.marathon,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }

    const result = await racesCollection.add({
      data: raceData
    })

    return {
      success: true,
      data: {
        raceId: result._id
      }
    }
  } catch (err) {
    console.error('发布赛事错误:', err)
    return {
      success: false,
      error: err.message || '发布失败'
    }
  }
}
