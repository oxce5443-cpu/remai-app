<template>
	<view class="page rm-page old-money">
		<view class="exchange-box">
			<view class="input-row">
				<input type="text" placeholder="请输入兑换码" placeholder-class="input-placeholder" />
				<button type="primary">兑换</button>
			</view>
			<view class="exchange-rule">查看兑换规则</view>
		</view>

		<view class="tabbar">
			<view class="tab" :class="{active: activeTabIndex == index}"
				v-for="(item, index) in tabs" :key="index" @tap="handleTab(index)">
				<text>{{ item.title }}</text>
			</view>
		</view>

		<scroll-view scroll-y class="coupon-list">
			<view class="coupon-wrapper">
				<view class="coupon" v-for="(item, index) in coupons" :key="index" @tap="openDetailModal(item)">
					<view class="coupon-detail">
						<image :src="item.imageUrl" class="coupon-img"></image>
						<view class="coupon-info">
							<view class="coupon-title">{{ item.title }}</view>
							<view class="coupon-expire">有效期至{{ item.endAt }}</view>
						</view>
					</view>
					<view class="coupon-footer">
						<text class="coupon-link">查看详情</text>
					</view>
				</view>
			</view>
		</scroll-view>

		<view class="bottom-bar">
			<text class="bottom-item">历史卡券</text>
			<text class="bottom-item" @tap="showTip1">赠送记录</text>
			<text class="bottom-item" @tap="showTip2">第三方权益</text>
		</view>

		<modal custom :show="detailModalVisible" @cancel="closeDetailModal" width="90%">
			<view class="modal-body">
				<view class="modal-title">{{ coupon.title }}</view>
				<view class="modal-period">有效期：{{ coupon.beginAt }}至{{ coupon.endAt }}</view>
				<view class="modal-explain">
					<jyf-parser ref="couponExplain"></jyf-parser>
				</view>
				<button type="primary" @tap="useCoupon" class="modal-btn">立即使用</button>
			</view>
		</modal>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '@/api'
import modal from '@/components/modal/modal.vue'
import jyfParser from '@/components/jyf-parser/jyf-parser.vue'

const tabs = ref([
	{title: '可使用', value: 'unused'},
	{title: '已使用', value: 'used'},
	{title: '已过期', value: 'expired'}
])
const activeTabIndex = ref(0)
const coupons = ref([])
const detailModalVisible = ref(false)
const coupon = ref({})
const couponExplain = ref(null)

onShow(() => loadCoupons())

function handleTab(index) {
	activeTabIndex.value = index
	loadCoupons()
}

async function loadCoupons() {
	const token = uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
	if (!token) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 1000)
		return
	}
	try {
		const status = tabs.value[activeTabIndex.value].value
		const list = await api.getMyCoupons({ status: status === 'expired' ? '' : status }) || []
		let result = list
		if (status === 'expired') {
			const now = new Date()
			result = list.filter(item => {
				const info = item.couponInfo || {}
				return new Date(info.endTime) < now
			})
		}
		coupons.value = result
	} catch (e) {
		console.error('加载优惠券失败', e)
		uni.showToast({ title: e.message || '加载失败', icon: 'none' })
	}
}

async function receiveCoupon(couponId) {
	try {
		uni.showLoading({ title: '领取中...' })
		await api.receiveCoupon({ couponId })
		uni.showToast({ title: '领取成功', icon: 'success' })
		loadCoupons()
	} catch (e) {
		uni.showToast({ title: e.message || '领取失败', icon: 'none' })
	} finally {
		uni.hideLoading()
	}
}

function openDetailModal(item) {
	coupon.value = item.couponInfo || item
	if (couponExplain.value) couponExplain.value.setContent(coupon.value.description || '')
	detailModalVisible.value = true
}
function closeDetailModal() {
	detailModalVisible.value = false
	coupon.value = {}
}
function useCoupon() {
	detailModalVisible.value = false
	uni.switchTab({ url: '/pages/menu/menu' })
}
function showTip1() { uni.showToast({ title: '您暂时还没有赠送中卡券哦~', icon: 'none' }) }
function showTip2() { uni.showToast({ title: '您暂时还没有券码哦~', icon: 'none' }) }
</script>

<style lang="scss" scoped>
page {
	height: 100%;
	background-color: $bg-color;
}

.page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: $bg-color;
}

/* ===== Exchange ===== */
.exchange-box {
	flex-shrink: 0;
	padding: 32rpx 40rpx;
	background: #FFFFFF;
	margin: 20rpx 24rpx;
	border-radius: $border-radius-lg;
	box-shadow: $box-shadow;
}

.input-row {
	display: flex;
	align-items: stretch;

	input {
		flex: 1;
		height: 80rpx;
		border: 1rpx solid $border-color;
		border-right: 0;
		border-radius: $border-radius-sm 0 0 $border-radius-sm;
		padding: 0 20rpx;
		font-size: $font-size-base;
		color: $text-color-base;
	}

	button {
		border-radius: 0 $border-radius-sm $border-radius-sm 0;
		display: flex;
		align-items: center;
		padding: 0 32rpx;
	}
}

.input-placeholder {
	font-size: $font-size-base;
	color: $text-color-assist;
}

.exchange-rule {
	font-size: $font-size-sm;
	color: $color-primary;
	margin-top: 16rpx;
	text-align: right;
}

/* ===== Tabbar ===== */
.tabbar {
	flex-shrink: 0;
	display: flex;
	padding: 0 24rpx;
	background: #FFFFFF;
	margin-bottom: 16rpx;
}

.tab {
	flex: 1;
	text-align: center;
	font-size: 28rpx;
	color: $text-color-assist;
	padding: 24rpx 0;
	position: relative;

	&.active {
		color: $color-primary;
		font-weight: 700;

		&::after {
			content: '';
			position: absolute;
			bottom: 0;
			left: 50%;
			transform: translateX(-50%);
			width: 48rpx;
			height: 4rpx;
			background: $color-primary;
			border-radius: 16rpx;
		}
	}
}

/* ===== Coupon List ===== */
.coupon-list {
	flex: 1;
	padding: 0 24rpx;
}

.coupon-wrapper {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	padding-bottom: 20rpx;
}

.coupon {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 24rpx;
	box-shadow: $box-shadow;
}

.coupon-detail {
	display: flex;
	align-items: center;
	gap: 24rpx;
	padding-bottom: 20rpx;
	border-bottom: 1rpx dashed $border-color;
}

.coupon-img {
	width: 140rpx;
	height: 140rpx;
	border-radius: $border-radius-sm;
	flex-shrink: 0;
}

.coupon-info {
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.coupon-title {
	font-size: 30rpx;
	font-weight: 600;
	color: $text-color-base;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.coupon-expire {
	font-size: $font-size-sm;
	color: $text-color-assist;
}

.coupon-footer {
	display: flex;
	justify-content: flex-end;
	padding-top: 16rpx;
}

.coupon-link {
	font-size: $font-size-sm;
	color: $color-primary;
}

/* ===== Bottom Bar ===== */
.bottom-bar {
	flex-shrink: 0;
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 0;
	padding: 20rpx 0 32rpx;
}

.bottom-item {
	font-size: $font-size-sm;
	color: $color-primary;
	padding: 0 24rpx;
	position: relative;

	&::after {
		content: '';
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%) scaleY(0.6);
		width: 1rpx;
		height: 24rpx;
		background: $color-primary;
	}

	&:last-child::after {
		display: none;
	}
}

/* ===== Modal ===== */
.modal-body {
	padding: 32rpx;
}

.modal-title {
	font-size: 34rpx;
	font-weight: 700;
	color: $text-color-base;
	text-align: center;
	margin-bottom: 16rpx;
}

.modal-period {
	font-size: $font-size-sm;
	color: $text-color-base;
	margin-bottom: 24rpx;
	text-align: center;
}

.modal-explain {
	font-size: $font-size-sm;
	color: $text-color-assist;
	margin-bottom: 32rpx;
	line-height: 42rpx;
}

.modal-btn {
	width: 100%;
	border-radius: 48rpx !important;
	padding: 24rpx 0;
	font-size: 28rpx;
	font-weight: 700;
}
</style>
