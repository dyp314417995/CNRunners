// 云函数：获取群组列表
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const groupsCollection = db.collection('groups')

exports.main = async (event, context) => {
  try {
    // 获取所有群组，按sort排序
    const result = await groupsCollection
      .orderBy('sort', 'asc')
      .get()

    return {
      success: true,
      data: result.data || []
    }
  } catch (err) {
    console.error('获取群组列表错误:', err)
    return {
      success: false,
      error: err.message || '获取失败'
    }
  }
}
