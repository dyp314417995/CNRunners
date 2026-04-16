// 云函数：获取积分分类
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const pointCategoriesCollection = db.collection('pointCategories')

// 默认分类
const DEFAULT_CATEGORIES = [
  {
    _id: 'daily_checkin',
    name: '日常打卡',
    description: '每日跑步打卡',
    defaultPoints: 10,
    icon: 'clock',
    color: '#4CAF50',
    requiresImages: false,
    requiresApproval: false
  },
  {
    _id: 'activity',
    name: '活动参与',
    description: '参加跑团组织的活动',
    defaultPoints: 50,
    icon: 'flag',
    color: '#FF9800',
    requiresImages: true,
    requiresApproval: true
  },
  {
    _id: 'volunteer',
    name: '志愿服务',
    description: '担任志愿者或补给点服务',
    defaultPoints: 30,
    icon: 'hand-heart',
    color: '#2196F3',
    requiresImages: true,
    requiresApproval: true
  },
  {
    _id: 'other',
    name: '其他',
    description: '其他积分记录',
    defaultPoints: 10,
    icon: 'star',
    color: '#9C27B0',
    requiresImages: true,
    requiresApproval: true
  }
]

exports.main = async (event, context) => {
  const { groupId } = event

  try {
    let categories = []

    if (groupId) {
      // 获取该跑团的自定义分类
      const result = await pointCategoriesCollection
        .where({ groupId })
        .orderBy('createTime', 'asc')
        .get()

      categories = result.data || []
    }

    // 如果没有自定义分类，返回默认分类
    if (categories.length === 0) {
      // 尝试获取无groupId的全局分类
      const globalResult = await pointCategoriesCollection
        .where({ groupId: null })
        .orderBy('createTime', 'asc')
        .get()

      if (globalResult.data && globalResult.data.length > 0) {
        categories = globalResult.data
      } else {
        // 返回内置默认分类
        categories = DEFAULT_CATEGORIES
      }
    }

    return {
      success: true,
      data: categories
    }
  } catch (err) {
    console.error('获取积分分类错误:', err)
    return {
      success: false,
      error: err.message || '获取失败',
      data: DEFAULT_CATEGORIES
    }
  }
}
