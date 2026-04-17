// 跑团管理小程序 - 常量定义

// 角色定义
export const ROLE = {
  SUPER_ADMIN: 'super_admin', // 超管
  ADMIN: 'admin',           // 管理员
  MEMBER: 'member'          // 普通成员
}

// 成员状态
export const MEMBER_STATUS = {
  PENDING: 'pending',       // 待审批
  ACTIVE: 'active',         // 正常
  REJECTED: 'rejected'      // 已拒绝
}

// 积分记录状态
export const POINT_STATUS = {
  PENDING: 'pending',       // 待审批
  APPROVED: 'approved',     // 已通过
  REJECTED: 'rejected'       // 已拒绝
}

// 积分记录类型
export const POINT_TYPE = {
  SELF_SUBMIT: 'self_submit',   // 自助提交
  ADMIN_GRANT: 'admin_grant'    // 管理员录入
}

// 跑步数据来源
export const RUN_SOURCE = {
  GARMIN: 'garmin',         // 佳明
  HUAWEI: 'huawei',         // 华为
  MANUAL: 'manual'           // 手动录入
}

// 设备绑定状态
export const DEVICE_STATUS = {
  ACTIVE: 'active',         // 有效
  EXPIRED: 'expired',       // 已过期
  REVOKED: 'revoked'         // 已撤销
}

// 设备平台
export const DEVICE_PLATFORM = {
  GARMIN: 'garmin',
  HUAWEI: 'huawei'
}

// 默认积分分类
export const DEFAULT_POINT_CATEGORIES = [
  {
    name: '日常打卡',
    description: '每日跑步打卡',
    defaultPoints: 10,
    icon: 'clock',
    color: '#4CAF50',
    requiresImages: false,
    requiresApproval: false
  },
  {
    name: '活动参与',
    description: '参加跑团组织的活动',
    defaultPoints: 50,
    icon: 'flag',
    color: '#FF9800',
    requiresImages: true,
    requiresApproval: true
  },
  {
    name: '志愿服务',
    description: '担任志愿者或补给点服务',
    defaultPoints: 30,
    icon: 'hand-heart',
    color: '#2196F3',
    requiresImages: true,
    requiresApproval: true
  },
  {
    name: '其他',
    description: '其他积分记录',
    defaultPoints: 10,
    icon: 'star',
    color: '#9C27B0',
    requiresImages: true,
    requiresApproval: true
  }
]

// 云函数名称
export const CLOUD_FUNCTIONS = {
  USER_LOGIN: 'user-login',
  USER_REGISTER: 'user-register',
  USER_GET_INFO: 'user-getInfo',
  USER_UPDATE: 'user-update',
  USER_UPDATE_GROUP: 'user-updateGroup',
  GROUP_GET_LIST: 'group-getList',
  POINTS_GET_LIST: 'points-getList',
  POINTS_GET_CATEGORIES: 'points-getCategories',
  POINTS_SUBMIT: 'points-submit',
  POINTS_APPROVE: 'points-approve',
  POINTS_ADD_FOR_USER: 'points-addForUser',
  RUNNING_GET_RECORDS: 'running-getRecords',
  RUNNING_GET_SUMMARY: 'running-getSummary',
  RUNNING_MANUAL_ADD: 'running-manualAdd',
  OAUTH_GARMIN: 'oauth-garmin',
  OAUTH_HUAWEI: 'oauth-huawei',
  SYNC_GARMIN: 'sync-garmin',
  SYNC_HUAWEI: 'sync-huawei',
  ADMIN_GET_MEMBERS: 'admin-getMembers',
  ADMIN_UPDATE_MEMBER: 'admin-updateMember',
  ADMIN_GET_ADMINS: 'admin-getAdmins',
  ADMIN_UPDATE_ADMIN: 'admin-updateAdmin',
  ADMIN_UPDATE_GROUP: 'admin-updateGroup',
  ADMIN_GET_ANNOUNCEMENTS: 'admin-getAnnouncements',
  ADMIN_PUBLISH_ANNOUNCEMENT: 'admin-publishAnnouncement',
  ADMIN_GET_CATEGORIES: 'admin-getCategories',
  ADMIN_SAVE_CATEGORY: 'admin-saveCategory'
}

// 集合名称
export const COLLECTIONS = {
  USERS: 'users',
  RUN_GROUPS: 'runGroups',
  MEMBERS: 'members',
  POINT_RECORDS: 'pointRecords',
  POINT_CATEGORIES: 'pointCategories',
  RUNNING_RECORDS: 'runningRecords',
  DEVICE_BINDINGS: 'deviceBindings',
  ANNOUNCEMENTS: 'announcements'
}

// 时间格式化模板
export const DATE_FORMAT = {
  YMD: 'YYYY-MM-DD',
  HMS: 'HH:mm:ss',
  YMDHMS: 'YYYY-MM-DD HH:mm:ss',
  HM: 'HH:mm'
}
