// 云函数：同步佳明跑步数据
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const deviceBindingsCollection = db.collection('deviceBindings')
const runningRecordsCollection = db.collection('runningRecords')
const membersCollection = db.collection('members')

const GARMIN_API_BASE = 'https://api.garmin.com'

// 获取跑步活动列表
async function getActivities(accessToken, startDate, endDate) {
  // 注意：实际环境中需要通过华为/佳明API获取数据
  // 这里返回模拟数据，实际需要实现真实的API调用
  console.log(`从 ${startDate} 到 ${endDate} 获取佳明活动`)

  // 模拟返回空数组，实际会调用真实API
  // const response = await uniCloud.httpclient.request(...)
  return []
}

// 计算配速
function calculatePace(distanceMeters, durationSeconds) {
  if (!distanceMeters || !durationSeconds) return '--\'--"'
  const distanceKm = distanceMeters / 1000
  const paceSecondsPerKm = durationSeconds / distanceKm
  const paceMins = Math.floor(paceSecondsPerKm / 60)
  const paceSecs = Math.floor(paceSecondsPerKm % 60)
  return `${paceMins}'${String(paceSecs).padStart(2, '0')}"`
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  // 定时触发器模式下，openid可能为空，需要查询所有有效绑定
  try {
    // 获取用户的设备绑定
    const query = openid
      ? { userId: openid, platform: 'garmin', status: 'active' }
      : { platform: 'garmin', status: 'active' }

    const bindings = await deviceBindingsCollection.where(query).get()

    if (!bindings.data || bindings.data.length === 0) {
      return {
        success: false,
        error: '未绑定佳明设备'
      }
    }

    const results = []

    for (const binding of bindings.data) {
      try {
        const userId = binding.userId

        // 计算日期范围（最近7天）
        const endDate = new Date().toISOString().split('T')[0]
        const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0]

        // 获取活动
        const activities = await getActivities(
          binding.accessToken,
          startDate,
          endDate
        )

        if (!activities || activities.length === 0) {
          results.push({
            userId,
            imported: 0,
            message: '没有新数据'
          })
          continue
        }

        // 获取已存在的记录ID
        const deviceIds = activities.map(a => a.activityId)
        const existing = await runningRecordsCollection
          .where({
            userId,
            source: 'garmin',
            deviceRecordId: db.command.in(deviceIds)
          })
          .field({ deviceRecordId: true })
          .get()

        const existingSet = new Set(
          (existing.data || []).map(r => r.deviceRecordId)
        )

        // 过滤新活动
        const newActivities = activities.filter(
          a => !existingSet.has(a.activityId)
        )

        // 插入新记录
        let totalDistance = 0
        for (const activity of newActivities) {
          const recordData = {
            groupId: binding.groupId,
            userId,
            source: 'garmin',
            deviceRecordId: activity.activityId,
            startTime: new Date(activity.startTimeMillis),
            endTime: new Date(activity.startTimeMillis + activity.durationMillis),
            duration: Math.floor(activity.durationMillis / 1000),
            distance: activity.distance / 1000, // 转换为公里
            pace: calculatePace(activity.distance, activity.durationMillis),
            calories: activity.calories || 0,
            heartRate: {
              avg: activity.averageHR || 0,
              max: activity.maxHR || 0
            },
            elevation: {
              gain: activity.elevationGain || 0,
              loss: activity.elevationLoss || 0
            },
            syncTime: Date.now(),
            createTime: db.serverDate()
          }

          await runningRecordsCollection.add({ data: recordData })
          totalDistance += recordData.distance
        }

        // 更新成员累计跑量
        if (totalDistance > 0) {
          await membersCollection
            .where({
              userId,
              groupId: binding.groupId,
              status: 'active'
            })
            .update({
              data: {
                totalDistance: db.command.inc(totalDistance)
              }
            })
        }

        // 更新最后同步时间
        await deviceBindingsCollection.doc(binding._id).update({
          data: {
            lastSyncTime: Date.now()
          }
        })

        results.push({
          userId,
          imported: newActivities.length,
          totalDistance: totalDistance.toFixed(2)
        })
      } catch (err) {
        results.push({
          userId: binding.userId,
          error: err.message
        })
      }
    }

    return {
      success: true,
      data: results
    }
  } catch (err) {
    console.error('同步佳明数据错误:', err)
    return {
      success: false,
      error: err.message || '同步失败'
    }
  }
}
