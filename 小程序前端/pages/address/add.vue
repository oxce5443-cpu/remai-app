<template>
	<view class="page rm-page old-money">
		<view class="form-card">
			<view class="form-item">
				<view class="label">收货人</view>
				<input class="input" placeholder="请输入收货人" v-model="form.acceptName" placeholder-class="placeholder"/>
			</view>
			<view class="form-item">
				<view class="label">性别</view>
				<view class="radio-group">
					<view class="radio" :class="{'radio--checked': !form.sex}" @tap="form.sex=0">先生</view>
					<view class="radio" :class="{'radio--checked': form.sex}" @tap="form.sex=1">女士</view>
				</view>
			</view>
			<view class="form-item">
				<view class="label">联系方式</view>
				<input class="input" placeholder="请输入收货人联系方式" v-model="form.mobile" placeholder-class="placeholder"/>
			</view>
			<view class="form-item">
				<view class="label">收货地址</view>
				<input class="input" placeholder="请选择收货地址" v-model="form.street" placeholder-class="placeholder"/>
			</view>
			<view class="form-item form-item--last">
				<view class="label">门牌号</view>
				<input class="input" placeholder="请输入收货人详细地址" v-model="form.doorNumber" placeholder-class="placeholder"/>
			</view>
		</view>
		<view class="btn-section">
			<button type="primary" size="default" @tap="save">保存</button>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import { api } from '@/api'

const store = useStore()
const editingId = ref('')
const form = reactive({
	acceptName: '',
	sex: 0,
	mobile: '',
	province: '',
	city: '',
	area: '',
	street: '',
	doorNumber: ''
})

onLoad((opt) => {
	if (opt && opt.id) {
		editingId.value = opt.id
		const found = store.state.addresses.find(item => item.id == opt.id)
		if (found) Object.assign(form, found)
	}
})

async function save() {
	if (!form.acceptName) { uni.showToast({ title: '请输入收货人', icon: 'none' }); return }
	if (!form.mobile) { uni.showToast({ title: '请输入联系方式', icon: 'none' }); return }
	if (!form.street) { uni.showToast({ title: '请输入收货地址', icon: 'none' }); return }
	try {
		uni.showLoading({ title: '保存中...' })
		if (editingId.value) await api.updateAddress({ id: editingId.value, ...form })
		else await api.addAddress({ ...form })
		uni.hideLoading()
		uni.showToast({ title: '保存成功', icon: 'success' })
		setTimeout(() => uni.navigateBack(), 800)
	} catch (e) {
		uni.hideLoading()
		uni.showToast({ title: e.message || '保存失败', icon: 'none' })
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: $bg-color;
	padding: 24rpx;
}

.form-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	box-shadow: $box-shadow;
	overflow: hidden;
}

.form-item {
	display: flex;
	align-items: center;
	padding: 32rpx 28rpx;
	border-bottom: 1rpx solid $border-color;

	&--last {
		border-bottom: none;
	}
}

.label {
	width: 160rpx;
	font-size: 28rpx;
	color: $text-color-base;
	font-weight: 600;
	flex-shrink: 0;
}

.input {
	flex: 1;
	font-size: 28rpx;
	color: $text-color-base;
}

.placeholder {
	color: $text-color-assist;
}

.radio-group {
	display: flex;
	gap: 16rpx;
}

.radio {
	padding: 12rpx 36rpx;
	border-radius: 16rpx;
	border: 2rpx solid $border-color;
	color: $text-color-assist;
	font-size: 26rpx;
	transition: all 0.2s;

	&--checked {
		background: $color-primary;
		color: #FFFFFF;
		border-color: $color-primary;
	}
}

.btn-section {
	padding: 60rpx 0;
	display: flex;
	justify-content: center;

	button {
		width: 85%;
		height: 88rpx;
		border-radius: 48rpx !important;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: 700;
		background: linear-gradient(135deg, #A67B5B, #C9A96E) !important;
		box-shadow: 0 8rpx 24rpx rgba(166, 123, 91, 0.15);
	}
}
</style>
