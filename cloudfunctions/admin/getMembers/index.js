// 云函数：获取成员列表（管理员）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  const { groupIds, province, city, keyword } = event

  try {
    // 检查当前用户是否为管理员（admin或super_admin）
    const currentUser = await usersCollection.doc(openid).get()
    if (!currentUser.data || currentUser.data.status !== 'active') {
      return {
        success: false,
        error: '用户不存在或已被禁用'
      }
    }

    const currentRole = currentUser.data.role
    if (currentRole !== 'admin' && currentRole !== 'super_admin') {
      return {
        success: false,
        error: '权限不足，需要管理员权限'
      }
    }

    // 构建查询条件
    let query = {
      status: 'active'
    }

    // 如果指定了群组筛选（支持多选）
    if (groupIds && groupIds.length > 0) {
      query.groupIds = db.command.in(groupIds)
    }

    // 如果指定了省份筛选
    if (province) {
      query.province = province
    }

    // 如果指定了城市筛选
    if (city) {
      query.city = city
    }

    // 获取所有成员
    const result = await usersCollection
      .where(query)
      .field({
        _id: true,
        nickname: true,
        avatar: true,
        name: true,
        phone: true,
        wechatId: true,
        groupIds: true,
        province: true,
        city: true,
        role: true,
        createTime: true,
        updateTime: true
      })
      .orderBy('createTime', 'asc')
      .get()

    // 格式化数据
    const members = (result.data || []).map(user => ({
      id: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      name: user.name,
      phone: user.phone,
      wechatId: user.wechatId,
      groupIds: user.groupIds || [],
      province: user.province || '',
      city: user.city || '',
      role: user.role,
      createAt: formatTime(user.createTime)
    }))

    return {
      success: true,
      data: members
    }
  } catch (err) {
    console.error('获取成员列表错误:', err)
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
