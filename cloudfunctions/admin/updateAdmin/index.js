// 云函数：添加/撤销管理员
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      error: '获取用户信息失败'
    }
  }

  const { userId, action } = event

  if (!userId) {
    return {
      success: false,
      error: '用户ID不能为空'
    }
  }

  if (!['promote', 'revoke'].includes(action)) {
    return {
      success: false,
      error: '无效的操作'
    }
  }

  try {
    // 检查目标用户
    const targetUser = await usersCollection.doc(userId).get()
    if (!targetUser.data) {
      return {
        success: false,
        error: '用户不存在'
      }
    }

    // 不能对自己操作
    if (userId === openid) {
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

    if (action === 'promote') {
      // 提升为管理员
      await usersCollection.doc(userId).update({
        data: {
          role: 'admin',
          updateTime: db.serverDate()
        }
      })
      return {
        success: true,
        message: '已提升为管理员'
      }
    } else if (action === 'revoke') {
      // 撤销管理员
      await usersCollection.doc(userId).update({
        data: {
          role: 'member',
          updateTime: db.serverDate()
        }
      })
      return {
        success: true,
        message: '已撤销管理员身份'
      }
    }
  } catch (err) {
    console.error('更新管理员状态错误:', err)
    return {
      success: false,
      error: err.message || '操作失败'
    }
  }
}
