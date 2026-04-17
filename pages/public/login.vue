<template>
  <view class="login-container">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>

    <!-- Logo区域 -->
    <view class="logo-section">
      <view class="logo-placeholder">
        <image v-if="avatarUrl" :src="avatarUrl" class="logo-img" mode="aspectFill"></image>
        <text v-else class="logo-icon">🏃</text>
      </view>
      <view class="app-name">跑遍九州</view>
      <view class="app-slogan">和志同道合的人一起奔跑</view>
    </view>

    <!-- 注册表单 -->
    <view class="form-section">
      <!-- 步骤1：微信授权 -->
      <view v-if="step === 1" class="step-content">
        <button class="btn-wechat" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
          <text class="btn-icon">📱</text>
          <text class="btn-text">微信一键登录</text>
        </button>
        <view class="agreement">
          登录即表示同意
          <text class="link">《用户协议》</text>
          和
          <text class="link">《隐私政策》</text>
        </view>
      </view>

      <!-- 步骤2：完善信息 -->
      <view v-if="step === 2" class="step-content">
        <view class="avatar-upload" @click="chooseAvatar">
          <image v-if="avatarUrl" :src="avatarUrl" class="avatar-img" mode="aspectFill"></image>
          <view v-else class="avatar-placeholder">
            <text class="avatar-icon">+</text>
            <text class="avatar-tip">点击上传头像</text>
          </view>
        </view>

        <view class="form-card">
          <view class="form-item">
            <text class="form-label">手机号</text>
            <input
              class="form-input"
              type="tel"
              v-model="formData.phone"
              placeholder="请输入手机号"
              maxlength="11"
            />
          </view>

          <view class="form-item">
            <text class="form-label">姓名</text>
            <input
              class="form-input"
              type="text"
              v-model="formData.name"
              placeholder="请输入姓名"
            />
          </view>

          <view class="form-item">
            <text class="form-label">微信号（选填）</text>
            <input
              class="form-input"
              type="text"
              v-model="formData.wechatId"
              placeholder="请输入微信号"
            />
          </view>

          <view class="form-item">
            <text class="form-label">所在城市</text>
            <view class="city-picker">
              <picker mode="selector" :range="provinceList" range-key="name" @change="onProvinceChange">
                <view :class="['picker-value', formData.province ? '' : 'placeholder']">
                  {{ formData.province || '选择省份' }}
                </view>
              </picker>
              <picker mode="selector" :range="cityList" range-key="name" @change="onCityChange" :disabled="!formData.province">
                <view :class="['picker-value', formData.city ? '' : 'placeholder', !formData.province ? 'disabled' : '']">
                  {{ formData.city || '选择城市' }}
                </view>
              </picker>
            </view>
          </view>

          <view class="form-item">
            <text class="form-label">所属群组</text>
            <view class="group-select">
              <view
                v-for="group in enabledGroups"
                :key="group.id"
                :class="['group-option', isGroupSelected(group.id) ? 'active' : '', group.id === 'none' && isGroupSelected('none') ? 'exclusive' : '']"
                @click="toggleGroup(group.id)"
              >
                {{ group.name }}
              </view>
            </view>
          </view>

          <button class="btn-primary" @click="doRegister" :disabled="loading">
            {{ loading ? '注册中...' : '完成注册' }}
          </button>
        </view>
      </view>

      <!-- 步骤3：注册成功 -->
      <view v-if="step === 3" class="step-content success-content">
        <view class="success-icon">✓</view>
        <view class="success-text">注册成功</view>
        <view class="success-sub">欢迎加入跑遍九州</view>
        <button class="btn-primary" @click="goHome">进入首页</button>
      </view>
    </view>
  </view>
</template>

<script>
import { userRegister, getGroups } from '../../common/request.js'

export default {
  data() {
    return {
      step: 1,
      loading: false,
      avatarUrl: '',
      nickname: '',
      groups: [],
      provinceList: [],
      cityList: [],
      formData: {
        phone: '',
        name: '',
        wechatId: '',
        province: '',
        city: '',
        groupIds: []
      }
    }
  },
  computed: {
    enabledGroups() {
      return this.groups.filter(g => g.isEnabled)
    }
  },
  onLoad() {
    this.loadGroups()
    this.loadProvinces()
  },
  methods: {
    // 加载省份列表
    loadProvinces() {
      // 内置省份数据
      this.provinceList = [
        { name: '北京市', cities: [{ name: '朝阳区' }, { name: '海淀区' }, { name: '东城区' }, { name: '西城区' }, { name: '丰台区' }, { name: '石景山区' }, { name: '通州区' }, { name: '顺义区' }, { name: '房山区' }, { name: '大兴区' }, { name: '昌平区' }, { name: '怀柔区' }, { name: '平谷区' }, { name: '门头沟区' }, { name: '密云区' }, { name: '延庆区' }] },
        { name: '上海市', cities: [{ name: '黄浦区' }, { name: '徐汇区' }, { name: '长宁区' }, { name: '静安区' }, { name: '普陀区' }, { name: '虹口区' }, { name: '杨浦区' }, { name: '浦东新区' }, { name: '闵行区' }, { name: '宝山区' }, { name: '嘉定区' }, { name: '金山区' }, { name: '松江区' }, { name: '青浦区' }, { name: '奉贤区' }, { name: '崇明区' }] },
        { name: '广东省', cities: [{ name: '广州市' }, { name: '深圳市' }, { name: '珠海市' }, { name: '东莞市' }, { name: '佛山市' }, { name: '中山市' }, { name: '惠州市' }, { name: '江门市' }, { name: '湛江市' }, { name: '茂名市' }, { name: '肇庆市' }, { name: '梅州市' }, { name: '汕尾市' }, { name: '河源市' }, { name: '阳江市' }, { name: '清远市' }, { name: '韶关市' }, { name: '揭阳市' }, { name: '汕头市' }, { name: '潮州市' }, { name: '云浮市' }] },
        { name: '浙江省', cities: [{ name: '杭州市' }, { name: '宁波市' }, { name: '温州市' }, { name: '嘉兴市' }, { name: '湖州市' }, { name: '绍兴市' }, { name: '金华市' }, { name: '衢州市' }, { name: '舟山市' }, { name: '台州市' }, { name: '丽水市' }] },
        { name: '江苏省', cities: [{ name: '南京市' }, { name: '苏州市' }, { name: '无锡市' }, { name: '常州市' }, { name: '南通市' }, { name: '徐州市' }, { name: '连云港市' }, { name: '淮安市' }, { name: '盐城市' }, { name: '扬州市' }, { name: '镇江市' }, { name: '泰州市' }, { name: '宿迁市' }] },
        { name: '四川省', cities: [{ name: '成都市' }, { name: '绵阳市' }, { name: '德阳市' }, { name: '南充市' }, { name: '宜宾市' }, { name: '自贡市' }, { name: '攀枝花市' }, { name: '泸州市' }, { name: '广元市' }, { name: '遂宁市' }, { name: '内江市' }, { name: '乐山市' }, { name: '资阳市' }, { name: '眉山市' }, { name: '达州市' }, { name: '雅安市' }, { name: '巴中市' }, { name: '广安市' }, { name: '凉山州' }, { name: '甘孜州' }, { name: '阿坝州' }] },
        { name: '山东省', cities: [{ name: '济南市' }, { name: '青岛市' }, { name: '烟台市' }, { name: '威海市' }, { name: '潍坊市' }, { name: '淄博市' }, { name: '临沂市' }, { name: '济宁市' }, { name: '泰安市' }, { name: '德州市' }, { name: '聊城市' }, { name: '滨州市' }, { name: '菏泽市' }, { name: '枣庄市' }, { name: '日照市' }, { name: '东营市' }] },
        { name: '河南省', cities: [{ name: '郑州市' }, { name: '洛阳市' }, { name: '开封市' }, { name: '南阳市' }, { name: '新乡市' }, { name: '安阳市' }, { name: '焦作市' }, { name: '许昌市' }, { name: '平顶山市' }, { name: '商丘市' }, { name: '周口市' }, { name: '信阳市' }, { name: '驻马店市' }, { name: '濮阳市' }, { name: '三门峡市' }, { name: '漯河市' }, { name: '鹤壁市' }, { name: '济源市' }] },
        { name: '湖北省', cities: [{ name: '武汉市' }, { name: '宜昌市' }, { name: '襄阳市' }, { name: '荆州市' }, { name: '黄冈市' }, { name: '孝感市' }, { name: '十堰市' }, { name: '黄石市' }, { name: '咸宁市' }, { name: '荆门市' }, { name: '鄂州市' }, { name: '随州市' }, { name: '恩施州' }, { name: '天门市' }, { name: '仙桃市' }, { name: '潜江市' }] },
        { name: '湖南省', cities: [{ name: '长沙市' }, { name: '株洲市' }, { name: '湘潭市' }, { name: '衡阳市' }, { name: '岳阳市' }, { name: '邵阳市' }, { name: '常德市' }, { name: '张家界市' }, { name: '益阳市' }, { name: '郴州市' }, { name: '永州市' }, { name: '怀化市' }, { name: '娄底市' }, { name: '湘西州' }] },
        { name: '河北省', cities: [{ name: '石家庄市' }, { name: '唐山市' }, { name: '秦皇岛市' }, { name: '邯郸市' }, { name: '邢台市' }, { name: '保定市' }, { name: '张家口市' }, { name: '承德市' }, { name: '沧州市' }, { name: '廊坊市' }, { name: '衡水市' }] },
        { name: '福建省', cities: [{ name: '福州市' }, { name: '厦门市' }, { name: '泉州市' }, { name: '漳州市' }, { name: '莆田市' }, { name: '宁德市' }, { name: '三明市' }, { name: '南平市' }, { name: '龙岩市' }] },
        { name: '安徽省', cities: [{ name: '合肥市' }, { name: '芜湖市' }, { name: '蚌埠市' }, { name: '淮南市' }, { name: '马鞍山市' }, { name: '淮北市' }, { name: '铜陵市' }, { name: '安庆市' }, { name: '黄山市' }, { name: '滁州市' }, { name: '阜阳市' }, { name: '宿州市' }, { name: '六安市' }, { name: '亳州市' }, { name: '池州市' }, { name: '宣城市' }] },
        { name: '江西省', cities: [{ name: '南昌市' }, { name: '景德镇市' }, { name: '九江市' }, { name: '赣州市' }, { name: '吉安市' }, { name: '宜春市' }, { name: '抚州市' }, { name: '上饶市' }, { name: '鹰潭市' }, { name: '新余市' }, { name: '萍乡市' }] },
        { name: '辽宁省', cities: [{ name: '沈阳市' }, { name: '大连市' }, { name: '鞍山市' }, { name: '抚顺市' }, { name: '本溪市' }, { name: '丹东市' }, { name: '锦州市' }, { name: '营口市' }, { name: '阜新市' }, { name: '辽阳市' }, { name: '盘锦市' }, { name: '铁岭市' }, { name: '朝阳市' }, { name: '葫芦岛市' }] },
        { name: '黑龙江省', cities: [{ name: '哈尔滨市' }, { name: '齐齐哈尔市' }, { name: '牡丹江市' }, { name: '佳木斯市' }, { name: '大庆市' }, { name: '鸡西市' }, { name: '双鸭山市' }, { name: '伊春市' }, { name: '七台河市' }, { name: '鹤岗市' }, { name: '黑河市' }, { name: '绥化市' }, { name: '大兴安岭地区' }] },
        { name: '吉林省', cities: [{ name: '长春市' }, { name: '吉林市' }, { name: '四平市' }, { name: '辽源市' }, { name: '通化市' }, { name: '白山市' }, { name: '松原市' }, { name: '白城市' }, { name: '延边州' }] },
        { name: '山西省', cities: [{ name: '太原市' }, { name: '大同市' }, { name: '阳泉市' }, { name: '长治市' }, { name: '晋城市' }, { name: '朔州市' }, { name: '晋中市' }, { name: '运城市' }, { name: '忻州市' }, { name: '临汾市' }, { name: '吕梁市' }] },
        { name: '陕西省', cities: [{ name: '西安市' }, { name: '宝鸡市' }, { name: '咸阳市' }, { name: '铜川市' }, { name: '渭南市' }, { name: '延安市' }, { name: '榆林市' }, { name: '汉中市' }, { name: '安康市' }, { name: '商洛市' }] },
        { name: '云南省', cities: [{ name: '昆明市' }, { name: '曲靖市' }, { name: '玉溪市' }, { name: '保山市' }, { name: '昭通市' }, { name: '丽江市' }, { name: '普洱市' }, { name: '临沧市' }, { name: '楚雄州' }, { name: '红河州' }, { name: '文山州' }, { name: '西双版纳州' }, { name: '大理州' }, { name: '德宏州' }, { name: '怒江州' }, { name: '迪庆州' }] },
        { name: '贵州省', cities: [{ name: '贵阳市' }, { name: '遵义市' }, { name: '六盘水市' }, { name: '安顺市' }, { name: '毕节市' }, { name: '铜仁市' }, { name: '黔西南州' }, { name: '黔东南州' }, { name: '黔南州' }] },
        { name: '广西', cities: [{ name: '南宁市' }, { name: '柳州市' }, { name: '桂林市' }, { name: '梧州市' }, { name: '北海市' }, { name: '防城港市' }, { name: '钦州市' }, { name: '贵港市' }, { name: '玉林市' }, { name: '百色市' }, { name: '贺州市' }, { name: '河池市' }, { name: '来宾市' }, { name: '崇左市' }] },
        { name: '海南省', cities: [{ name: '海口市' }, { name: '三亚市' }, { name: '三沙市' }, { name: '儋州市' }, { name: '五指山市' }, { name: '琼海市' }, { name: '文昌市' }, { name: '万宁市' }, { name: '东方市' }] },
        { name: '内蒙古', cities: [{ name: '呼和浩特市' }, { name: '包头市' }, { name: '乌海市' }, { name: '赤峰市' }, { name: '通辽市' }, { name: '鄂尔多斯市' }, { name: '呼伦贝尔市' }, { name: '巴彦淖尔市' }, { name: '乌兰察布市' }, { name: '兴安盟' }, { name: '锡林郭勒盟' }, { name: '阿拉善盟' }] },
        { name: '新疆', cities: [{ name: '乌鲁木齐市' }, { name: '克拉玛依市' }, { name: '吐鲁番市' }, { name: '哈密市' }, { name: '阿克苏地区' }, { name: '喀什地区' }, { name: '和田地区' }, { name: '伊犁州' }, { name: '塔城地区' }, { name: '阿勒泰地区' }, { name: '石河子市' }, { name: '阿拉尔市' }, { name: '图木舒克市' }, { name: '五家渠市' }, { name: '北屯市' }, { name: '铁门关市' }, { name: '双河市' }, { name: '可克达拉市' }, { name: '昆玉市' }] },
        { name: '甘肃省', cities: [{ name: '兰州市' }, { name: '嘉峪关市' }, { name: '金昌市' }, { name: '白银市' }, { name: '天水市' }, { name: '武威市' }, { name: '张掖市' }, { name: '平凉市' }, { name: '酒泉市' }, { name: '庆阳市' }, { name: '定西市' }, { name: '陇南市' }, { name: '临夏州' }, { name: '甘南州' }] },
        { name: '青海省', cities: [{ name: '西宁市' }, { name: '海东市' }, { name: '海北州' }, { name: '黄南州' }, { name: '海南州' }, { name: '果洛州' }, { name: '玉树州' }, { name: '海西州' }] },
        { name: '宁夏', cities: [{ name: '银川市' }, { name: '石嘴山市' }, { name: '吴忠市' }, { name: '固原市' }, { name: '中卫市' }] },
        { name: '西藏', cities: [{ name: '拉萨市' }, { name: '日喀则市' }, { name: '昌都市' }, { name: '林芝市' }, { name: '山南市' }, { name: '那曲市' }, { name: '阿里地区' }] },
        { name: '天津市', cities: [{ name: '和平区' }, { name: '河东区' }, { name: '河西区' }, { name: '南开区' }, { name: '河北区' }, { name: '红桥区' }, { name: '东丽区' }, { name: '西青区' }, { name: '津南区' }, { name: '北辰区' }, { name: '武清区' }, { name: '宝坻区' }, { name: '滨海新区' }, { name: '宁河区' }, { name: '静海区' }, { name: '蓟州区' }] },
        { name: '重庆市', cities: [{ name: '万州区' }, { name: '渝中区' }, { name: '江北区' }, { name: '沙坪坝区' }, { name: '九龙坡区' }, { name: '南岸区' }, { name: '北碚区' }, { name: '渝北区' }, { name: '巴南区' }, { name: '长寿区' }, { name: '合川区' }, { name: '永川区' }, { name: '南川区' }, { name: '璧山区' }, { name: '大足区' }, { name: '綦江区' }, { name: '铜梁区' }, { name: '潼南区' }, { name: '荣昌区' }, { name: '开州区' }, { name: '梁平区' }, { name: '武隆区' }] }
      ]
    },

    // 省份变更
    onProvinceChange(e) {
      const index = e.detail.value
      const province = this.provinceList[index]
      this.formData.province = province.name
      this.formData.city = ''
      this.cityList = province.cities
    },

    // 城市变更
    onCityChange(e) {
      const index = e.detail.value
      this.formData.city = this.cityList[index].name
    },

    // 加载群组列表
    async loadGroups() {
      try {
        const res = await getGroups()
        if (res.success) {
          // 添加"未加入"选项
          this.groups = [...(res.data || []), { id: 'none', name: '未加入', isEnabled: true }]
          // 默认选中一群
          if (this.groups.length > 0) {
            this.formData.groupIds = ['group_1']
          }
        }
      } catch (e) {
        console.error('加载群组失败', e)
        // 使用默认群组
        this.groups = [
          { id: 'group_1', name: '一群', isEnabled: true },
          { id: 'group_2', name: '二群', isEnabled: true },
          { id: 'group_3', name: '分舵群', isEnabled: false },
          { id: 'none', name: '未加入', isEnabled: true }
        ]
        this.formData.groupIds = ['group_1']
      }
    },

    // 判断群组是否选中
    isGroupSelected(groupId) {
      return this.formData.groupIds.includes(groupId)
    },

    // 切换群组选中状态
    toggleGroup(groupId) {
      const group = this.groups.find(g => g.id === groupId)
      if (!group || !group.isEnabled) return

      if (groupId === 'none') {
        // 点击"未加入"：清除其他群组，只保留自己
        this.formData.groupIds = ['none']
      } else {
        // 点击普通群组：先移除"未加入"
        this.formData.groupIds = this.formData.groupIds.filter(id => id !== 'none')

        // 切换当前项的选中状态
        const index = this.formData.groupIds.indexOf(groupId)
        if (index > -1) {
          this.formData.groupIds.splice(index, 1)
        } else {
          this.formData.groupIds.push(groupId)
        }

        // 如果没有任何群组被选中，自动选中"未加入"
        if (this.formData.groupIds.length === 0) {
          this.formData.groupIds = ['none']
        }
      }
    },

    // 获取微信手机号
    async onGetPhoneNumber(e) {
      if (!e.detail.code) {
        uni.showToast({ title: '请允许获取手机号', icon: 'none' })
        return
      }

      // 获取微信登录凭证
      try {
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: (res) => resolve(res),
            fail: reject
          })
        })

        // 获取用户信息
        const userInfoRes = await new Promise((resolve, reject) => {
          uni.getUserProfile({
            desc: '获取您的昵称和头像',
            success: (res) => resolve(res),
            fail: reject
          })
        })

        this.avatarUrl = userInfoRes.userInfo.avatarUrl
        this.nickname = userInfoRes.userInfo.nickName

        // 进入下一步填写信息
        this.step = 2
      } catch (err) {
        console.error('微信授权失败', err)
        // 如果用户拒绝授权，也允许手动填写
        uni.showModal({
          title: '提示',
          content: '您可以在下一步手动填写信息',
          showCancel: false,
          success: () => {
            this.step = 2
          }
        })
      }
    },

    // 选择头像（手动上传）
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.avatarUrl = res.tempFilePaths[0]
        }
      })
    },

    // 表单验证
    validateForm() {
      if (!this.formData.phone) {
        uni.showToast({ title: '请输入手机号', icon: 'none' })
        return false
      }
      if (!/^1[3-9]\d{9}$/.test(this.formData.phone)) {
        uni.showToast({ title: '手机号格式不正确', icon: 'none' })
        return false
      }
      if (!this.formData.name) {
        uni.showToast({ title: '请输入姓名', icon: 'none' })
        return false
      }
      if (!this.formData.groupIds || this.formData.groupIds.length === 0) {
        uni.showToast({ title: '请选择所属群组', icon: 'none' })
        return false
      }
      return true
    },

    // 完成注册
    async doRegister() {
      if (!this.validateForm()) return

      this.loading = true

      try {
        // 先获取openid
        const loginRes = await new Promise((resolve, reject) => {
          uni.login({
            provider: 'weixin',
            success: (res) => resolve(res),
            fail: reject
          })
        })

        const result = await userRegister({
          code: loginRes.code,
          nickname: this.nickname || this.formData.name,
          avatar: this.avatarUrl,
          phone: this.formData.phone,
          name: this.formData.name,
          wechatId: this.formData.wechatId,
          province: this.formData.province,
          city: this.formData.city,
          groupIds: this.formData.groupIds
        })

        if (result.success) {
          // 保存用户信息
          uni.setStorageSync('userInfo', result.data)
          uni.setStorageSync('openid', result.data.openid)

          this.step = 3
        } else {
          uni.showToast({ title: result.error || '注册失败', icon: 'none' })
        }
      } catch (err) {
        console.error('注册错误', err)
        uni.showToast({ title: '注册失败', icon: 'none' })
      } finally {
        this.loading = false
      }
    },

    // 进入首页
    goHome() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  padding: 100rpx 40rpx 60rpx;
  position: relative;
  overflow: hidden;
}

.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
}

.circle-1 {
  width: 400rpx;
  height: 400rpx;
  top: -100rpx;
  right: -100rpx;
}

.circle-2 {
  width: 300rpx;
  height: 300rpx;
  bottom: 200rpx;
  left: -150rpx;
}

.circle-3 {
  width: 200rpx;
  height: 200rpx;
  bottom: -50rpx;
  right: 50rpx;
}

.logo-section {
  text-align: center;
  margin-top: 60rpx;
}

.logo-placeholder {
  width: 160rpx;
  height: 160rpx;
  background: #fff;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30rpx;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.logo-img {
  width: 100%;
  height: 100%;
}

.logo-icon {
  font-size: 80rpx;
}

.app-name {
  font-size: 48rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.form-section {
  flex: 1;
  margin-top: 60rpx;
}

.step-content {
  width: 100%;
}

.btn-wechat {
  width: 100%;
  height: 96rpx;
  background: #fff;
  color: #333;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-bottom: 30rpx;
}

.btn-wechat::after {
  border: none;
}

.btn-icon {
  margin-right: 16rpx;
  font-size: 40rpx;
}

.agreement {
  text-align: center;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}

.link {
  color: #fff;
  text-decoration: underline;
}

.avatar-upload {
  width: 160rpx;
  height: 160rpx;
  margin: 0 auto 40rpx;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4rpx solid #fff;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  border: 4rpx dashed rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 48rpx;
  color: #fff;
}

.avatar-tip {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8rpx;
}

.form-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 12rpx;
}

.form-input {
  height: 88rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
}

.group-select {
  display: flex;
  gap: 20rpx;
}

.group-option {
  flex: 1;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
  border: 2rpx solid transparent;
}

.group-option.active {
  background: #e8f4ff;
  color: #007AFF;
  border-color: #007AFF;
}

.group-option.exclusive {
  background: #fff3e0;
  color: #FF9800;
  border-color: #FF9800;
}

.city-picker {
  display: flex;
  gap: 20rpx;
}

.picker-value {
  flex: 1;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  color: #333;
}

.picker-value.placeholder {
  color: #999;
}

.picker-value.disabled {
  color: #ccc;
}

.btn-primary {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 20rpx;
}

.btn-primary::after {
  border: none;
}

.success-content {
  text-align: center;
  padding-top: 100rpx;
}

.success-icon {
  width: 120rpx;
  height: 120rpx;
  background: #07C160;
  color: #fff;
  border-radius: 50%;
  font-size: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30rpx;
}

.success-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 16rpx;
}

.success-sub {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 60rpx;
}
</style>
