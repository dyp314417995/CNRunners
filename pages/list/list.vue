<template>
  <view class="container">
    <view class="list-title">示例列表</view>
    <view class="item" v-for="(item, index) in listData" :key="index" @click="onItemClick(item)">
      <view class="item-title">{{ item.title }}</view>
      <view class="item-desc">{{ item.description }}</view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      listData: [
        { title: '项目一', description: '这是第一个列表项' },
        { title: '项目二', description: '这是第二个列表项' },
        { title: '项目三', description: '这是第三个列表项' },
        { title: '项目四', description: '这是第四个列表项' },
        { title: '项目五', description: '这是第五个列表项' }
      ]
    }
  },
  methods: {
    onItemClick(item) {
      uni.showToast({
        title: item.title,
        icon: 'success'
      })
    }
  }
}
</script>

<style scoped>
.container {
  padding: 20px;
}
.list-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
}
.item {
  background-color: #fff;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
}
.item-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}
.item-desc {
  font-size: 12px;
  color: #999;
}
</style>
