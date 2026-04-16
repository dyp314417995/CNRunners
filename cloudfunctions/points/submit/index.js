// 云函数：提交积分
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const pointRecordsCollection = db.collection('pointRecords')
const pointCategoriesCollection = db.collection('pointCategories')
const membersCollection = db.collection('members')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      error: '请先登录'
    }
  }

  const { groupId, categoryId, points, description, images = [] } = event

  if (!groupId || !categoryId) {
    return {
      success: false,
      error: '参数不完整'
    }
  }

  try {
    // 1. 获取积分分类
    const category = await pointCategoriesCollection.doc(categoryId).get()

    if (!category.data) {
      return {
        success: false,
        error: '积分分类不存在'
      }
    }

    const categoryData = category.data

    // 2. 检查用户是否需要审批
    const needsApproval = categoryData.requiresApproval !== false

    // 3. 如果不需要审批，直接添加积分
    let recordStatus = 'approved'
    let recordApproveTime = db.serverDate()
    let recordApproveBy = openid

    if (needsApproval) {
      recordStatus = 'pending'
      recordApproveTime = null
      recordApproveBy = null
    }

    // 4. 创建积分记录
    const recordData = {
      groupId,
      userId: openid,
      categoryId,
      categoryName: categoryData.name,
      points: points || categoryData.defaultPoints || 0,
      type: 'self_submit',
      description: description || '',
      images,
      status: recordStatus,
      approveTime: recordApproveTime,
      approveBy: recordApproveBy,
      createTime: db.serverDate(),
      rejectReason: null
    }

    const addResult = await pointRecordsCollection.add({ data: recordData })

    // 5. 如果不需要审批，直接增加用户积分
    if (!needsApproval) {
      await membersCollection
        .where({
          groupId,
          userId: openid,
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
        recordId: addResult._id,
        status: recordStatus,
        points: recordData.points,
        message: needsApproval ? '提交成功，等待管理员审批' : '积分已添加'
      }
    }
  } catch (err) {
    console.error('提交积分错误:', err)
    return {
      success: false,
      error: err.message || '提交失败'
    }
  }
}
