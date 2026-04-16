// 云函数：更新群组设置
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const groupsCollection = db.collection('groups')

exports.main = async (event, context) => {
  const { groupId, name, isEnabled } = event

  if (!groupId) {
    return {
      success: false,
      error: '群组ID不能为空'
    }
  }

  try {
    // 检查群组是否存在
    const group = await groupsCollection.doc(groupId).get()
    if (!group.data) {
      return {
        success: false,
        error: '群组不存在'
      }
    }

    // 构建更新数据
    const updateData = {
      updateTime: db.serverDate()
    }

    if (typeof name !== 'undefined') {
      updateData.name = name
    }
    if (typeof isEnabled !== 'undefined') {
      updateData.isEnabled = isEnabled
    }

    await groupsCollection.doc(groupId).update({
      data: updateData
    })

    return {
      success: true,
      message: '设置已更新'
    }
  } catch (err) {
    console.error('更新群组设置错误:', err)
    return {
      success: false,
      error: err.message || '更新失败'
    }
  }
}
