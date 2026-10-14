<template>
	<view class="page rm-page old-money">
		<view class="textarea-wrap">
			<textarea
				placeholder="请填写备注信息"
				placeholder-class="placeholder"
				v-model="remark"
				class="textarea"
				:class="{'textarea--danger': remarkLength > 50}"
				focus
			/>
			<view class="counter" :class="{'counter--danger': remarkLength > 50}">
				{{ remarkLength }}/50
			</view>
		</view>

		<view class="quick-title">快捷输入</view>
		<view class="quick-list">
			<view class="quick-item" v-for="(item, index) in quickInputs" :key="index" @tap="handleQuickInput(item)">
				{{ item }}
			</view>
		</view>

		<view class="btn-section">
			<button type="primary" class="submit-btn" @tap="submit">完成</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const remark = ref('')
const quickInputs = ref(['请放门把手上', '请放门口', '请放前台桌上', '如地址封闭管理，请电话与我联系'])
const remarkLength = computed(() => remark.value.length)

onLoad((opt) => { if (opt && opt.remark) remark.value = opt.remark })

function handleQuickInput(item) { remark.value = remark.value.concat(' ', item) }
function submit() { uni.navigateTo({ url: '/pages/pay/pay?remark=' + remark.value }) }
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: $bg-color;
	padding: 24rpx;
}

.textarea-wrap {
	position: relative;
}

.textarea {
	width: 100%;
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 28rpx;
	height: 300rpx;
	font-size: $font-size-base;
	color: $text-color-base;
	box-shadow: $box-shadow;
	box-sizing: border-box;

	&--danger {
		color: $color-error;
	}
}

.placeholder {
	font-size: $font-size-base;
	color: $text-color-assist;
}

.counter {
	position: absolute;
	bottom: 24rpx;
	right: 28rpx;
	font-size: $font-size-sm;
	color: $text-color-assist;

	&--danger {
		color: $color-error;
	}
}

.quick-title {
	font-size: $font-size-base;
	color: $text-color-assist;
	margin: 32rpx 0 20rpx;
}

.quick-list {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.quick-item {
	background: #FFFFFF;
	border: 2rpx solid $color-primary;
	color: $color-primary;
	font-size: $font-size-base;
	padding: 14rpx 24rpx;
	border-radius: $border-radius-sm;
	box-shadow: $box-shadow;
}

.btn-section {
	margin-top: 60rpx;
	display: flex;
	justify-content: center;
}

.submit-btn {
	width: 90%;
	height: 88rpx;
	border-radius: 48rpx !important;
	font-size: 30rpx;
	font-weight: 600;
	background: linear-gradient(135deg, #A67B5B, #C9A96E) !important;
}
</style>
