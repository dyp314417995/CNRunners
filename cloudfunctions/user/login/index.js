// 云函数：用户登录
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const usersCollection = db.collection('users')
const membersCollection = db.collection('members')
const runGroupsCollection = db.collection('runGroups')

// 默认跑团ID（实际应用中应该动态创建或指定）
const DEFAULT_GROUP_ID = 'default_group'

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return {
      success: false,
      error: '获取用户信息失败'
    }
  }

  try {
    // 1. 查找或创建用户
    let user = await usersCollection.where({ _id: openid }).get()

    if (!user.data || user.data.length === 0) {
      // 新用户，创建用户记录
      await usersCollection.add({
        data: {
          _id: openid,
          nickName: event.nickName || '新成员',
          avatarUrl: event.avatarUrl || '',
          phone: event.phone || '',
          createTime: db.serverDate(),
          updateTime: db.serverDate(),
          status: 'normal'
        }
      })

      // 检查是否有默认跑团，如果没有则创建一个
      let group = await runGroupsCollection.where({ _id: DEFAULT_GROUP_ID }).get()
      if (!group.data || group.data.length === 0) {
        await runGroupsCollection.add({
          data: {
            _id: DEFAULT_GROUP_ID,
            name: '我的跑团',
            avatar: '',
            description: '欢迎加入跑团',
            ownerId: openid,
            createTime: db.serverDate(),
            updateTime: db.serverDate(),
            settings: {
              requireApproval: false,
              pointCategories: ['日常打卡', '活动参与', '志愿服务', '其他'],
              weeklyGoal: 20
            }
          }
        })
      }

      // 自动将用户加入默认跑团
      await membersCollection.add({
        data: {
          groupId: DEFAULT_GROUP_ID,
          userId: openid,
          role: 'admin', // 第一个用户默认为管理员
          joinTime: db.serverDate(),
          status: 'active',
          pointBalance: 0,
          totalDistance: 0,
          weeklyDistance: 0
        }
      })

      user = {
        data: [{
          _id: openid,
          nickName: event.nickName || '新成员',
          avatarUrl: event.avatarUrl || '',
          phone: event.phone || '',
          status: 'normal'
        }]
      }
    } else {
      // 更新用户信息（如果有传入）
      if (event.nickName || event.avatarUrl || event.phone) {
        const updateData = { updateTime: db.serverDate() }
        if (event.nickName) updateData.nickName = event.nickName
        if (event.avatarUrl) updateData.avatarUrl = event.avatarUrl
        if (event.phone) updateData.phone = event.phone

        await usersCollection.doc(openid).update({ data: updateData })

        user.data[0].nickName = event.nickName || user.data[0].nickName
        user.data[0].avatarUrl = event.avatarUrl || user.data[0].avatarUrl
        user.data[0].phone = event.phone || user.data[0].phone
      }
    }

    // 2. 获取用户的跑团角色信息
    const memberInfo = await membersCollection
      .where({
        userId: openid,
        status: 'active'
      })
      .get()

    const member = memberInfo.data && memberInfo.data.length > 0
      ? memberInfo.data[0]
      : null

    // 3. 获取跑团信息
    let groupInfo = null
    if (member && member.groupId) {
      const group = await runGroupsCollection.doc(member.groupId).get()
      groupInfo = group.data
    }

    return {
      success: true,
      data: {
        user: {
          openid: openid,
          nickName: user.data[0].nickName,
          avatarUrl: user.data[0].avatarUrl,
          phone: user.data[0].phone
        },
        member: member ? {
          role: member.role,
          groupId: member.groupId,
          pointBalance: member.pointBalance,
          totalDistance: member.totalDistance,
          weeklyDistance: member.weeklyDistance
        } : null,
        group: groupInfo
      }
    }
  } catch (err) {
    console.error('登录错误:', err)
    return {
      success: false,
      error: err.message || '登录失败'
    }
  }
}
