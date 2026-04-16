// 云函数：更新成员信息（管理员）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { memberId, role, status, groupIds, province, city } = event

  if (!memberId) {
    return {
      success: false,
      error: '成员ID不能为空'
    }
  }

  try {
    // 检查当前用户是否为管理员
    const currentUser = await usersCollection.doc(openid).get()
    if (!currentUser.data) {
      return {
        success: false,
        error: '用户不存在'
      }
    }

    const currentRole = currentUser.data.role
    if (currentRole !== 'admin' && currentRole !== 'super_admin') {
      return {
        success: false,
        error: '权限不足，需要管理员权限'
      }
    }

    // 获取目标用户
    const targetUser = await usersCollection.doc(memberId).get()
    if (!targetUser.data) {
      return {
        success: false,
        error: '成员不存在'
      }
    }

    // 不能对自己进行操作
    if (memberId === openid) {
      return {
        success: false,
        error: '不能对自己进行此操作'
      }
    }

    // 不能修改超管
    if (targetUser.data.role === 'super_admin') {
      return {
        success: false,
        error: '不能修改超管身份'
      }
    }

    // 构建更新数据
    const updateData = {
      updateTime: db.serverDate()
    }

    if (role !== undefined) {
      if (role !== 'admin' && role !== 'member') {
        return {
          success: false,
          error: '角色无效'
        }
      }
      updateData.role = role
    }

    if (status !== undefined) {
      if (!['active', 'pending', 'removed'].includes(status)) {
        return {
          success: false,
          error: '状态无效'
        }
      }
      updateData.status = status
    }

    if (groupIds !== undefined) {
      updateData.groupIds = groupIds
    }

    if (province !== undefined) {
      updateData.province = province
    }

    if (city !== undefined) {
      updateData.city = city
    }

    // 执行更新
    await usersCollection.doc(memberId).update({
      data: updateData
    })

    return {
      success: true,
      message: '更新成功'
    }
  } catch (err) {
    console.error('更新成员信息错误:', err)
    return {
      success: false,
      error: err.message || '更新失败'
    }
  }
}
