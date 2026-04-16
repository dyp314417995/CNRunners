<template>
  <view class="members-container">
    <!-- 顶部搜索和筛选 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          type="text"
          v-model="keyword"
          placeholder="搜索姓名或手机号"
          @input="onSearch"
        />
      </view>
    </view>

    <!-- 筛选按钮行 -->
    <view class="filter-bar">
      <button class="filter-btn" @click="showGroupFilter = !showGroupFilter">
        {{ currentGroupName }} ▾
      </button>
      <button class="filter-btn" @click="showLocationFilter = !showLocationFilter">
        {{ currentLocationName }} ▾
      </button>
    </view>

    <!-- 群组筛选下拉 -->
    <view v-if="showGroupFilter" class="filter-dropdown" @click.stop>
      <view
        :class="['filter-item', selectedGroupIds.length === 0 ? 'active' : '']"
        @click="clearGroupFilter"
      >
        全部群组
      </view>
      <view
        v-for="group in groups"
        :key="group.id"
        :class="['filter-item', isGroupSelected(group.id) ? 'active' : '']"
        @click="toggleGroupFilter(group.id)"
      >
        {{ group.name }}
      </view>
    </view>

    <!-- 位置筛选下拉 -->
    <view v-if="showLocationFilter" class="filter-dropdown" @click.stop>
      <view
        :class="['filter-item', !filterProvince ? 'active' : '']"
        @click="clearLocationFilter"
      >
        全部位置
      </view>
      <view
        v-for="province in provinceList"
        :key="province.name"
        :class="['filter-item', filterProvince === province.name ? 'active' : '']"
        @click="selectProvince(province)"
      >
        {{ province.name }}
        <text class="filter-arrow">›</text>
      </view>
    </view>

    <!-- 城市筛选下拉 -->
    <view v-if="showCityFilter" class="filter-dropdown sub" @click.stop>
      <view
        :class="['filter-item', !filterCity ? 'active' : '']"
        @click="selectCity('')"
      >
        全部城市
      </view>
      <view
        v-for="city in currentProvinceCities"
        :key="city.name"
        :class="['filter-item', filterCity === city.name ? 'active' : '']"
        @click="selectCity(city.name)"
      >
        {{ city.name }}
      </view>
    </view>

    <!-- 成员列表 -->
    <scroll-view scroll-y class="member-list" @scrolltolower="loadMore">
      <view v-if="filteredMembers.length === 0" class="empty-state">
        <text class="empty-icon">👥</text>
        <text class="empty-text">暂无成员</text>
      </view>

      <view v-else class="member-item" v-for="member in filteredMembers" :key="member.id" @click="showMemberDetail(member)">
        <view class="member-main">
          <image
            class="avatar"
            :src="member.avatar || '/static/logo.jpg'"
            mode="aspectFill"
          />
          <view class="member-info">
            <view class="name-row">
              <text class="nickname">{{ member.name }}</text>
              <text v-if="member.role === 'super_admin'" class="role-tag super">超管</text>
              <text v-else-if="member.role === 'admin'" class="role-tag">管理员</text>
              <text v-else-if="member.groupIds && member.groupIds.length > 0" class="group-tag">{{ getGroupNames(member.groupIds) }}</text>
              <text v-if="member.id === currentUserId" class="current-tag">我</text>
            </view>
            <view class="info-row">
              <text class="phone">{{ formatPhone(member.phone) }}</text>
              <text v-if="member.province && member.city" class="location">{{ member.province }}/{{ member.city }}</text>
            </view>
          </view>
        </view>

        <text class="arrow">›</text>
      </view>
    </scroll-view>

    <!-- 成员详情弹窗 -->
    <uni-popup v-if="showDetail" type="center" @close="showDetail = false">
      <view class="detail-popup">
        <view class="popup-header">
          <text class="popup-title">成员信息</text>
          <text class="popup-close" @click="showDetail = false">×</text>
        </view>

        <view class="popup-body">
          <view class="detail-avatar">
            <image :src="selectedMember.avatar || '/static/logo.jpg'" mode="aspectFill"></image>
          </view>
          <view class="detail-name">{{ selectedMember.name }}</view>
          <view class="detail-group">
            <text v-if="selectedMember.province && selectedMember.city">{{ selectedMember.province }}/{{ selectedMember.city }}</text>
            <text v-else>暂无位置信息</text>
          </view>

          <view class="detail-info">
            <view class="info-item">
              <text class="info-label">手机号</text>
              <text class="info-value">{{ selectedMember.phone }}</text>
            </view>
            <view class="info-item" v-if="selectedMember.wechatId">
              <text class="info-label">微信号</text>
              <text class="info-value">{{ selectedMember.wechatId }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">所属群组</text>
              <text class="info-value">{{ getGroupNames(selectedMember.groupIds) || '未加入' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">角色</text>
              <text class="info-value">
                {{ selectedMember.role === 'super_admin' ? '超管' : selectedMember.role === 'admin' ? '管理员' : '成员' }}
              </text>
            </view>
            <view class="info-item">
              <text class="info-label">注册时间</text>
              <text class="info-value">{{ selectedMember.createAt }}</text>
            </view>
          </view>
        </view>

        <view class="popup-footer" v-if="isAdmin && selectedMember.id !== currentUserId">
          <button v-if="selectedMember.role === 'member'" class="btn-action" @click="promoteToAdmin">
            提升为管理员
          </button>
          <button class="btn-action danger" @click="removeMember">
            移除成员
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script>
import { getMembers, updateMember, getGroups, updateAdmin } from '../../common/request.js'

export default {
  data() {
    return {
      members: [],
      groups: [],
      keyword: '',
      selectedGroupIds: [],
      showGroupFilter: false,
      filterProvince: '',
      filterCity: '',
      showLocationFilter: false,
      showCityFilter: false,
      currentProvinceCities: [],
      provinceList: [],
      showDetail: false,
      selectedMember: {},
      loading: false,
      currentUserId: '',
      isAdmin: false
    }
  },
  computed: {
    currentGroupName() {
      if (this.selectedGroupIds.length === 0) return '全部群组'
      if (this.selectedGroupIds.length === 1) {
        const group = this.groups.find(g => g.id === this.selectedGroupIds[0])
        return group ? group.name : '全部群组'
      }
      return `已选${this.selectedGroupIds.length}个群组`
    },
    currentLocationName() {
      if (!this.filterProvince) return '全部位置'
      if (!this.filterCity) return this.filterProvince
      return `${this.filterProvince}/${this.filterCity}`
    },
    filteredMembers() {
      let result = this.members

      // 群组筛选（支持多选）
      if (this.selectedGroupIds.length > 0) {
        result = result.filter(m => {
          if (!m.groupIds || m.groupIds.length === 0) return false
          return m.groupIds.some(gid => this.selectedGroupIds.includes(gid))
        })
      }

      // 位置筛选
      if (this.filterProvince) {
        result = result.filter(m => m.province === this.filterProvince)
        if (this.filterCity) {
          result = result.filter(m => m.city === this.filterCity)
        }
      }

      // 关键词搜索
      if (this.keyword) {
        const kw = this.keyword.toLowerCase()
        result = result.filter(m =>
          (m.name && m.name.toLowerCase().includes(kw)) ||
          (m.phone && m.phone.includes(kw))
        )
      }

      return result
    }
  },
  onLoad() {
    const userInfo = uni.getStorageSync('userInfo')
    this.currentUserId = userInfo?.openid || ''
    this.isAdmin = userInfo?.role === 'admin' || userInfo?.role === 'super_admin'
    this.loadProvinces()
    this.loadGroups()
    this.loadMembers()
  },
  onShow() {
    this.loadMembers()
  },
  methods: {
    async loadGroups() {
      try {
        const res = await getGroups()
        if (res.success) {
          this.groups = res.data || []
        }
      } catch (e) {
        console.error('加载群组失败', e)
      }
    },

    // 加载省份列表
    loadProvinces() {
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
        { name: '新疆', cities: [{ name: '乌鲁木齐市' }, { name: '克拉玛依市' }, { name: '吐鲁番市' }, { name: '哈密市' }, { name: '阿克苏地区' }, { name: '喀什地区' }, { name: '和田地区' }, { name: '伊犁州' }, { name: '塔城地区' }, { name: '阿勒泰地区' }] },
        { name: '甘肃省', cities: [{ name: '兰州市' }, { name: '嘉峪关市' }, { name: '金昌市' }, { name: '白银市' }, { name: '天水市' }, { name: '武威市' }, { name: '张掖市' }, { name: '平凉市' }, { name: '酒泉市' }, { name: '庆阳市' }, { name: '定西市' }, { name: '陇南市' }, { name: '临夏州' }, { name: '甘南州' }] },
        { name: '青海省', cities: [{ name: '西宁市' }, { name: '海东市' }, { name: '海北州' }, { name: '黄南州' }, { name: '海南州' }, { name: '果洛州' }, { name: '玉树州' }, { name: '海西州' }] },
        { name: '宁夏', cities: [{ name: '银川市' }, { name: '石嘴山市' }, { name: '吴忠市' }, { name: '固原市' }, { name: '中卫市' }] },
        { name: '西藏', cities: [{ name: '拉萨市' }, { name: '日喀则市' }, { name: '昌都市' }, { name: '林芝市' }, { name: '山南市' }, { name: '那曲市' }, { name: '阿里地区' }] },
        { name: '天津市', cities: [{ name: '和平区' }, { name: '河东区' }, { name: '河西区' }, { name: '南开区' }, { name: '河北区' }, { name: '红桥区' }, { name: '东丽区' }, { name: '西青区' }, { name: '津南区' }, { name: '北辰区' }, { name: '武清区' }, { name: '宝坻区' }, { name: '滨海新区' }, { name: '宁河区' }, { name: '静海区' }, { name: '蓟州区' }] },
        { name: '重庆市', cities: [{ name: '万州区' }, { name: '渝中区' }, { name: '江北区' }, { name: '沙坪坝区' }, { name: '九龙坡区' }, { name: '南岸区' }, { name: '北碚区' }, { name: '渝北区' }, { name: '巴南区' }, { name: '长寿区' }, { name: '合川区' }, { name: '永川区' }, { name: '南川区' }, { name: '璧山区' }, { name: '大足区' }, { name: '綦江区' }, { name: '铜梁区' }, { name: '潼南区' }, { name: '荣昌区' }, { name: '开州区' }, { name: '梁平区' }, { name: '武隆区' }] }
      ]
    },

    async loadMembers() {
      if (this.loading) return
      this.loading = true

      uni.showLoading({ title: '加载中...' })
      try {
        const res = await getMembers({
          groupIds: this.selectedGroupIds.length > 0 ? this.selectedGroupIds : undefined,
          province: this.filterProvince || undefined,
          city: this.filterCity || undefined
        })
        if (res.success) {
          this.members = res.data || []
        } else {
          uni.showToast({ title: res.error || '加载失败', icon: 'none' })
        }
      } catch (e) {
        console.error('加载成员失败', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      } finally {
        this.loading = false
        uni.hideLoading()
      }
    },

    onSearch() {
      // 搜索会自动通过computed属性filteredMembers实现
    },

    // 群组筛选方法
    clearGroupFilter() {
      this.selectedGroupIds = []
      this.showGroupFilter = false
      this.loadMembers()
    },

    isGroupSelected(groupId) {
      return this.selectedGroupIds.includes(groupId)
    },

    toggleGroupFilter(groupId) {
      const index = this.selectedGroupIds.indexOf(groupId)
      if (index > -1) {
        this.selectedGroupIds.splice(index, 1)
      } else {
        this.selectedGroupIds.push(groupId)
      }
    },

    // 位置筛选方法
    clearLocationFilter() {
      this.filterProvince = ''
      this.filterCity = ''
      this.showLocationFilter = false
      this.showCityFilter = false
      this.loadMembers()
    },

    selectProvince(province) {
      this.filterProvince = province.name
      this.filterCity = ''
      this.currentProvinceCities = province.cities
      this.showCityFilter = true
      this.showLocationFilter = false
    },

    selectCity(cityName) {
      this.filterCity = cityName
      this.showCityFilter = false
      this.loadMembers()
    },

    getGroupName(groupId) {
      if (!groupId) return ''
      const group = this.groups.find(g => g.id === groupId)
      return group ? group.name : ''
    },

    getGroupNames(groupIds) {
      if (!groupIds || groupIds.length === 0) return ''
      const names = groupIds.map(id => this.getGroupName(id)).filter(n => n)
      return names.join('、')
    },

    formatPhone(phone) {
      if (!phone) return '未绑定'
      return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
    },

    showMemberDetail(member) {
      this.selectedMember = member
      this.showDetail = true
    },

    async promoteToAdmin() {
      uni.showModal({
        title: '提升为管理员',
        content: `确定将 ${this.selectedMember.name} 提升为管理员吗？`,
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              const result = await updateAdmin(this.selectedMember.id, 'promote')
              if (result.success) {
                uni.showToast({ title: '已提升', icon: 'success' })
                this.showDetail = false
                this.loadMembers()
              } else {
                uni.showToast({ title: result.error || '操作失败', icon: 'none' })
              }
            } catch (e) {
              uni.showToast({ title: '操作失败', icon: 'none' })
            } finally {
              uni.hideLoading()
            }
          }
        }
      })
    },

    async removeMember() {
      uni.showModal({
        title: '移除成员',
        content: `确定将 ${this.selectedMember.name} 从跑团移除吗？`,
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' })
            try {
              const result = await updateMember(this.selectedMember.id, { status: 'removed' })
              if (result.success) {
                uni.showToast({ title: '已移除', icon: 'success' })
                this.showDetail = false
                this.loadMembers()
              } else {
                uni.showToast({ title: result.error || '操作失败', icon: 'none' })
              }
            } catch (e) {
              uni.showToast({ title: '操作失败', icon: 'none' })
            } finally {
              uni.hideLoading()
            }
          }
        }
      })
    },

    loadMore() {
      // 分页加载，暂时不实现
    }
  }
}
</script>

<style scoped>
.members-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-bar {
  display: flex;
  gap: 20rpx;
  padding: 24rpx;
  background: #fff;
}

.search-input-wrap {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  height: 72rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  padding: 0 24rpx 0 64rpx;
  font-size: 28rpx;
}

.search-icon {
  position: absolute;
  left: 24rpx;
  top: 50%;
  transform: translateY(-50%);
}

.filter-btn {
  height: 72rpx;
  padding: 0 28rpx;
  background: #f5f5f5;
  border-radius: 36rpx;
  font-size: 28rpx;
  color: #333;
  margin: 0;
}

.filter-bar {
  display: flex;
  gap: 20rpx;
  padding: 0 24rpx 16rpx;
  background: #fff;
}

.filter-dropdown {
  background: #fff;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #eee;
}

.filter-item {
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  border-bottom: 1rpx solid #f0f0f0;
}

.filter-item:last-child {
  border-bottom: none;
}

.filter-item.active {
  color: #007AFF;
}

.filter-item .filter-arrow {
  float: right;
  color: #ccc;
}

.filter-dropdown.sub {
  max-height: 400rpx;
  overflow-y: auto;
}

.member-list {
  height: calc(100vh - 120rpx);
  padding: 24rpx;
}

.member-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
}

.member-main {
  flex: 1;
  display: flex;
  align-items: center;
}

.avatar {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  background: #f0f0f0;
}

.member-info {
  flex: 1;
  margin-left: 20rpx;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-wrap: wrap;
}

.nickname {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.role-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: #fff3e0;
  color: #FF9800;
  border-radius: 8rpx;
}

.role-tag.super {
  background: #f3e5f5;
  color: #9C27B0;
}

.group-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  background: #e8f4ff;
  color: #007AFF;
  border-radius: 8rpx;
}

.current-tag {
  background: #667eea;
  color: #fff;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}

.phone {
  font-size: 24rpx;
  color: #999;
  display: inline;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 6rpx;
}

.location {
  font-size: 22rpx;
  color: #999;
}

.arrow {
  font-size: 36rpx;
  color: #ccc;
}

.empty-state {
  text-align: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 100rpx;
  display: block;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #666;
}

/* 详情弹窗 */
.detail-popup {
  width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #eee;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.popup-close {
  font-size: 48rpx;
  color: #999;
}

.popup-body {
  padding: 40rpx 32rpx;
  text-align: center;
}

.detail-avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  margin: 0 auto 20rpx;
  overflow: hidden;
  background: #f0f0f0;
}

.detail-avatar image {
  width: 100%;
  height: 100%;
}

.detail-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
}

.detail-group {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 32rpx;
}

.detail-info {
  text-align: left;
  background: #f9f9f9;
  border-radius: 12rpx;
  padding: 24rpx;
}

.info-item {
  display: flex;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  width: 140rpx;
  font-size: 26rpx;
  color: #999;
}

.info-value {
  flex: 1;
  font-size: 26rpx;
  color: #333;
}

.popup-footer {
  display: flex;
  gap: 20rpx;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #eee;
}

.btn-action {
  flex: 1;
  height: 80rpx;
  background: #007AFF;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
}

.btn-action.danger {
  background: #fff;
  color: #F44336;
  border: 2rpx solid #F44336;
}
</style>
