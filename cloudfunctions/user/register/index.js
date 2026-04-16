// 云函数：用户注册
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const usersCollection = db.collection('users')
const groupsCollection = db.collection('groups')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      error: '获取用户信息失败'
    }
  }

  const { nickname, avatar, phone, name, wechatId, groupId } = event

  // 参数校验
  if (!phone) {
    return {
      success: false,
      error: '手机号不能为空'
    }
  }
  if (!name) {
    return {
      success: false,
      error: '姓名不能为空'
    }
  }
  if (!groupId) {
    return {
      success: false,
      error: '请选择所属群组'
    }
  }

  try {
    // 检查手机号是否已被注册
    const existingUser = await usersCollection.where({
      phone: phone
    }).get()

    if (existingUser.data && existingUser.data.length > 0) {
      // 手机号已被注册，更新信息并登录
      const existing = existingUser.data[0]

      // 更新用户信息
      await usersCollection.doc(existing._id).update({
        data: {
          nickname: nickname || name,
          avatar: avatar || '',
          wechatId: wechatId || '',
          groupId: groupId,
          updateTime: db.serverDate()
        }
      })

      return {
        success: true,
        data: {
          openid: existing._id,
          nickname: nickname || name,
          avatar: avatar || '',
          phone: phone,
          name: name,
          wechatId: wechatId || '',
          groupId: groupId,
          role: existing.role || 'member'
        }
      }
    }

    // 创建新用户
    // 检查是否是第一个用户（超管）
    const userCount = await usersCollection.count()
    const isFirstUser = userCount.total === 0
    const initialRole = isFirstUser ? 'super_admin' : 'member'

    // 确保默认群组存在
    await ensureDefaultGroups()

    const newUser = {
      _id: openid,
      nickname: nickname || name,
      avatar: avatar || '',
      phone: phone,
      name: name,
      wechatId: wechatId || '',
      groupId: groupId,
      role: initialRole,
      status: 'active',
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    await usersCollection.add({
      data: newUser
    })

    return {
      success: true,
      data: {
        openid: openid,
        nickname: newUser.nickname,
        avatar: newUser.avatar,
        phone: newUser.phone,
        name: newUser.name,
        wechatId: newUser.wechatId,
        groupId: newUser.groupId,
        role: newUser.role
      }
    }
  } catch (err) {
    console.error('注册错误:', err)
    return {
      success: false,
      error: err.message || '注册失败'
    }
  }
}

// 确保默认群组存在
async function ensureDefaultGroups() {
  const defaultGroups = [
    { _id: 'group_1', name: '一群', isEnabled: true, sort: 1 },
    { _id: 'group_2', name: '二群', isEnabled: true, sort: 2 },
    { _id: 'group_3', name: '分舵群', isEnabled: false, sort: 3 }
  ]

  for (const group of defaultGroups) {
    const existing = await groupsCollection.doc(group._id).get()
    if (!existing.data) {
      await groupsCollection.add({
        data: {
          ...group,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    }
  }
}
