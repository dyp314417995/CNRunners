// 云函数：赛事报名
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const racesCollection = db.collection('races')
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

  const {
    raceId,
    categoryId,
    name,
    gender,
    idType,
    idNumber,
    birthday,
    phone,
    email,
    emergencyContact,
    emergencyPhone,
    bloodType,
    clothingSize
  } = event

  // 参数校验
  if (!raceId || !categoryId || !name || !gender || !idNumber || !phone) {
    return {
      success: false,
      error: '请填写完整的报名信息'
    }
  }

  try {
    // 查询赛事信息
    const race = await racesCollection.doc(raceId).get()

    if (!race.data) {
      return {
        success: false,
        error: '赛事不存在'
      }
    }

    // 检查报名状态
    if (race.data.status !== 'registration_open') {
      return {
        success: false,
        error: '当前不在报名时间内'
      }
    }

    // 检查是否已报名
    const existingReg = await registrationsCollection
      .where({
        raceId,
        userId: openid,
        status: db.command.in(['pending', 'confirmed'])
      })
      .get()

    if (existingReg.data && existingReg.data.length > 0) {
      return {
        success: false,
        error: '您已报名该赛事'
      }
    }

    // 获取报名项目信息
    const category = race.data.categories?.find(c => c.id === categoryId)
    if (!category) {
      return {
        success: false,
        error: '报名项目不存在'
      }
    }

    // 检查项目名额
    const categoryRegCount = await registrationsCollection
      .where({
        raceId,
        categoryId,
        status: db.command.in(['pending', 'confirmed'])
      })
      .count()

    if (categoryRegCount >= category.quota) {
      return {
        success: false,
        error: '该项目已报满'
      }
    }

    // 创建报名记录
    const registrationData = {
      raceId,
      raceName: race.data.name,
      categoryId,
      categoryName: category.name,
      userId: openid,
      userName: name,
      gender,
      idType,
      idNumber,
      birthday: new Date(birthday),
      phone,
      email: email || '',
      emergencyContact: emergencyContact || '',
      emergencyPhone: emergencyPhone || '',
      bloodType: bloodType || '',
      clothingSize,
      fee: category.fee + 10, // 报名费 + 保险费
      status: 'confirmed', // 简化为直接确认
      registrationTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    const regResult = await registrationsCollection.add({
      data: registrationData
    })

    // 更新赛事已报名人数
    await racesCollection.doc(raceId).update({
      data: {
        registeredCount: db.command.inc(1)
      }
    })

    return {
      success: true,
      data: {
        registrationId: regResult._id,
        raceName: race.data.name,
        categoryName: category.name,
        fee: registrationData.fee
      }
    }
  } catch (err) {
    console.error('赛事报名错误:', err)
    return {
      success: false,
      error: err.message || '报名失败'
    }
  }
}
