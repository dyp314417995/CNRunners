// 云函数：审批积分（管理员）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const pointRecordsCollection = db.collection('pointRecords')
const membersCollection = db.collection('members')

/**
 * 检查用户是否为管理员
 */
async function checkAdmin(openid, groupId) {
  const member = await membersCollection
    .where({
      userId: openid,
      groupId,
      role: 'admin',
      status: 'active'
    })
    .get()

  if (!member.data || member.data.length === 0) {
    return false
  }
  return true
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

  const { action, recordId, reason = '', userId, groupId, points, description } = event

  try {
    // 处理不同的操作
    switch (action) {
      case 'approve':
      case 'reject':
        // 审批或拒绝积分申请
        return await handleApproveReject()

      case 'addForUser':
        // 管理员为用户添加积分
        return await handleAdminAddPoints()

      default:
        return {
          success: false,
          error: '未知操作'
        }
    }
  } catch (err) {
    console.error('审批积分错误:', err)
    return {
      success: false,
      error: err.message || '操作失败'
    }
  }

  // 处理审批/拒绝
  async function handleApproveReject() {
    if (!recordId) {
      return {
        success: false,
        error: '记录ID不能为空'
      }
    }

    // 获取积分记录
    const record = await pointRecordsCollection.doc(recordId).get()

    if (!record.data) {
      return {
        success: false,
        error: '积分记录不存在'
      }
    }

    const recordData = record.data

    // 检查管理员权限
    const isAdmin = await checkAdmin(openid, recordData.groupId)
    if (!isAdmin) {
      return {
        success: false,
        error: '权限不足'
      }
    }

    // 检查状态
    if (recordData.status !== 'pending') {
      return {
        success: false,
        error: '该记录已处理'
      }
    }

    // 更新记录状态
    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    await pointRecordsCollection.doc(recordId).update({
      data: {
        status: newStatus,
        approveTime: db.serverDate(),
        approveBy: openid,
        rejectReason: action === 'reject' ? reason : null
      }
    })

    // 如果是批准，增加用户积分
    if (action === 'approve') {
      await membersCollection
        .where({
          groupId: recordData.groupId,
          userId: recordData.userId,
          status: 'active'
        })
        .update({
          data: {
            pointBalance: db.command.inc(recordData.points)
          }
        })
    }

    return {
      success: true,
      data: {
        recordId,
        status: newStatus,
        message: action === 'approve' ? '已批准' : '已拒绝'
      }
    }
  }

  // 管理员手动添加积分
  async function handleAdminAddPoints() {
    if (!userId || !groupId || points === undefined) {
      return {
        success: false,
        error: '参数不完整'
      }
    }

    // 检查管理员权限
    const isAdmin = await checkAdmin(openid, groupId)
    if (!isAdmin) {
      return {
        success: false,
        error: '权限不足'
      }
    }

    // 验证积分数
    const pointValue = parseInt(points, 10)
    if (isNaN(pointValue) || pointValue === 0) {
      return {
        success: false,
        error: '积分数量无效'
      }
    }

    // 添加积分记录
    const recordData = {
      groupId,
      userId,
      categoryId: 'admin_grant',
      categoryName: '管理员录入',
      points: pointValue,
      type: 'admin_grant',
      description: description || '管理员手动录入',
      images: [],
      status: 'approved',
      approveTime: db.serverDate(),
      approveBy: openid,
      createTime: db.serverDate(),
      rejectReason: null
    }

    const addResult = await pointRecordsCollection.add({ data: recordData })

    // 增加用户积分
    await membersCollection
      .where({
        groupId,
        userId,
        status: 'active'
      })
      .update({
        data: {
          pointBalance: db.command.inc(pointValue)
        }
      })

    return {
      success: true,
      data: {
        recordId: addResult._id,
        points: pointValue,
        message: `已为用户添加 ${pointValue} 积分`
      }
    }
  }
}
