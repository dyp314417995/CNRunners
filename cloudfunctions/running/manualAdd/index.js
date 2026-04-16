// 云函数：手动添加跑步记录
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const runningRecordsCollection = db.collection('runningRecords')
const membersCollection = db.collection('members')

// 计算配速
function calculatePace(distanceKm, durationSeconds) {
  if (!distanceKm || !durationSeconds) return '--\'--"'
  const paceSecondsPerKm = durationSeconds / distanceKm
  const paceMins = Math.floor(paceSecondsPerKm / 60)
  const paceSecs = Math.floor(paceSecondsPerKm % 60)
  return `${paceMins}'${String(paceSecs).padStart(2, '0')}"`
}

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
    groupId,
    distance,      // 公里
    duration,      // 秒
    startTime,
    description,
    calories
  } = event

  if (!groupId || !distance || !duration) {
    return {
      success: false,
      error: '参数不完整'
    }
  }

  try {
    const distanceKm = parseFloat(distance)
    const durationSec = parseInt(duration, 10)

    if (isNaN(distanceKm) || distanceKm <= 0) {
      return {
        success: false,
        error: '距离无效'
      }
    }

    if (isNaN(durationSec) || durationSec <= 0) {
      return {
        success: false,
        error: '时长无效'
      }
    }

    // 创建跑步记录
    const recordData = {
      groupId,
      userId: openid,
      source: 'manual',
      deviceRecordId: `manual_${Date.now()}`,
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: new Date(),
      duration: durationSec,
      distance: distanceKm,
      pace: calculatePace(distanceKm, durationSec),
      calories: calories || 0,
      heartRate: {
        avg: 0,
        max: 0
      },
      elevation: {
        gain: 0,
        loss: 0
      },
      syncTime: Date.now(),
      createTime: db.serverDate()
    }

    if (description) {
      recordData.description = description
    }

    const result = await runningRecordsCollection.add({
      data: recordData
    })

    // 更新用户累计跑量
    await membersCollection
      .where({
        userId: openid,
        groupId,
        status: 'active'
      })
      .update({
        data: {
          totalDistance: db.command.inc(distanceKm)
        }
      })

    return {
      success: true,
      data: {
        recordId: result._id,
        distance: distanceKm,
        duration: durationSec,
        pace: recordData.pace,
        message: '跑步记录已添加'
      }
    }
  } catch (err) {
    console.error('手动添加跑步记录错误:', err)
    return {
      success: false,
      error: err.message || '添加失败'
    }
  }
}
