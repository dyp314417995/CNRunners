// 云函数：获取管理员列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  try {
    // 获取所有管理员（super_admin 和 admin）
    const result = await usersCollection
      .where({
        role: db.command.in(['super_admin', 'admin']),
        status: 'active'
      })
      .field({
        _id: true,
        nickname: true,
        avatar: true,
        name: true,
        phone: true,
        role: true,
        groupId: true,
        createTime: true,
        updateTime: true
      })
      .orderBy('createTime', 'asc')
      .get()

    // 格式化数据
    const admins = (result.data || []).map(user => ({
      id: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      name: user.name,
      phone: user.phone,
      role: user.role,
      groupId: user.groupId,
      promotedAt: formatTime(user.updateTime)
    }))

    return {
      success: true,
      data: admins
    }
  } catch (err) {
    console.error('获取管理员列表错误:', err)
    return {
      success: false,
      error: err.message || '获取失败'
    }
  }
}

// 格式化时间
function formatTime(date) {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
