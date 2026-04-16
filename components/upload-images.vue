<template>
  <view class="upload-images">
    <view class="title" v-if="title">
      {{ title }}
      <text v-if="required" class="required">*</text>
    </view>

    <view class="image-list">
      <view
        v-for="(image, index) in images"
        :key="index"
        class="image-item"
      >
        <image :src="image" mode="aspectFill" @tap="previewImage(index)" />
        <view class="delete-btn" @tap="removeImage(index)">×</view>
      </view>

      <view
        v-if="images.length < maxCount"
        class="add-btn"
        @tap="chooseImage"
      >
        <text class="icon">+</text>
        <text class="text">{{ addText }}</text>
      </view>
    </view>

    <view v-if="tip" class="tip">{{ tip }}</view>
  </view>
</template>

<script>
export default {
  name: 'UploadImages',
  props: {
    title: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    images: {
      type: Array,
      default: () => []
    },
    maxCount: {
      type: Number,
      default: 9
    },
    addText: {
      type: String,
      default: '添加图片'
    },
    tip: {
      type: String,
      default: ''
    },
    sourceType: {
      type: Array,
      default: () => ['album', 'camera']
    }
  },
  methods: {
    chooseImage() {
      const count = this.maxCount - this.images.length

      uni.chooseImage({
        count: Math.min(count, 9),
        sourceType: this.sourceType,
        success: (res) => {
          // 如果需要上传到云存储
          this.uploadImages(res.tempFilePaths)
        },
        fail: (err) => {
          console.error('选择图片失败', err)
        }
      })
    },

    async uploadImages(tempFilePaths) {
      const uploadedImages = []

      for (const filePath of tempFilePaths) {
        try {
          // 上传到云存储
          const uploadResult = await this.uploadToCloud(filePath)
          uploadedImages.push(uploadResult)
        } catch (err) {
          console.error('上传图片失败', err)
          uni.showToast({
            title: '上传图片失败',
            icon: 'none'
          })
        }
      }

      if (uploadedImages.length > 0) {
        const newImages = [...this.images, ...uploadedImages]
        this.$emit('update:images', newImages)
        this.$emit('change', newImages)
      }
    },

    uploadToCloud(filePath) {
      return new Promise((resolve, reject) => {
        // 生成本地文件名
        const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`

        uni.cloud.uploadFile({
          cloudPath: `uploads/${fileName}`,
          filePath: filePath,
          success: (res) => {
            resolve(res.fileID)
          },
          fail: (err) => {
            reject(err)
          }
        })
      })
    },

    previewImage(index) {
      uni.previewImage({
        urls: this.images,
        current: index
      })
    },

    removeImage(index) {
      const newImages = [...this.images]
      newImages.splice(index, 1)
      this.$emit('update:images', newImages)
      this.$emit('change', newImages)
    }
  }
}
</script>

<style scoped>
.upload-images {
  margin-bottom: 32rpx;
}

.title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.required {
  color: #F44336;
  margin-left: 4rpx;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
}

.image-item image {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.delete-btn {
  position: absolute;
  top: -16rpx;
  right: -16rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
}

.add-btn {
  width: 200rpx;
  height: 200rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #DDD;
}

.add-btn .icon {
  font-size: 60rpx;
  color: #999;
  line-height: 1;
}

.add-btn .text {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.tip {
  font-size: 24rpx;
  color: #999;
  margin-top: 12rpx;
}
</style>
