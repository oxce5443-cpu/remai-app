<template>
	<view class="page rm-page old-money">
		<!-- Avatar + Level -->
		<view class="avatar-section">
			<view class="avatar-wrap">
				<image :src="member.avatar" class="avatar-img"></image>
				<view class="level-tag">
					<image src="/static/images/mine/level.png" mode="widthFix"></image>
					<text>{{ member.memberLevel }}</text>
				</view>
			</view>
		</view>

		<!-- User Card -->
		<view class="user-card">
			<view class="nickname">{{ member.nickname }}</view>

			<!-- Stats Grid -->
			<view class="stats-grid">
				<view class="stat-item" @tap="coupons">
					<view class="stat-value">{{ member.couponNum }}</view>
					<view class="stat-label">热麦券</view>
				</view>
				<view class="stat-item" @tap="integrals">
					<view class="stat-value">{{ member.pointNum }}</view>
					<view class="stat-label">积分</view>
				</view>
				<view class="stat-item" @tap="balance">
					<view class="stat-value">{{ member.balance }}</view>
					<view class="stat-label">余额</view>
				</view>
				<view class="stat-item">
					<view class="stat-value">{{ member.giftBalance }}</view>
					<view class="stat-label">礼品卡</view>
				</view>
			</view>

			<!-- QR Code -->
			<view class="qrcode-wrap">
				<canvas canvas-id="memberCode" style="width: 350rpx; height: 350rpx;"></canvas>
			</view>

			<view class="qrcode-tip">支付前出示可累计积分，会员码每30秒更新</view>

			<!-- WeChat Pay -->
			<!-- #ifdef MP-WEIXIN -->
			<view class="wepay-row">
				<button type="primary" class="wepay-btn" hover-class="none">
					<image src="/static/images/mine/wechat.png" class="wepay-icon"></image>
					<text>使用微信支付</text>
				</button>
			</view>
			<!-- #endif -->
		</view>

		<image src="/static/images/mine/member-code-deco.png" class="bottom-img" mode="widthFix"></image>
	</view>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import uQRCode from '@/common/uqrcode'

const store = useStore()
const member = computed(() => store.state.member || {})
const instance = getCurrentInstance()

onShow(() => {
	let i = 1
	makeMemberCode(i)
	setInterval(() => { i++; makeMemberCode(i) }, 30000)
})

function makeMemberCode(i) {
	uQRCode.make({
		canvasId: 'memberCode',
		componentInstance: instance.proxy,
		text: `memberCode${i}`,
		size: uni.upx2px(350),
		margin: 20,
		backgroundColor: '#ffffff',
		foregroundColor: '#000000',
		fileType: 'jpg',
		correctLevel: uQRCode.defaults.correctLevel,
		success: res => { console.log(res) }
	})
}
function integrals() { uni.navigateTo({ url: '/pages/integrals/integrals' }) }
function balance() { uni.navigateTo({ url: '/pages/balance/balance' }) }
function coupons() { uni.navigateTo({ url: '/pages/coupons/coupons' }) }
</script>

<style lang="scss" scoped>
.page {
	background-color: $bg-color;
	min-height: 100vh;
	padding: 20rpx 24rpx;
}

/* ===== Avatar ===== */
.avatar-section {
	display: flex;
	justify-content: center;
	padding: 40rpx 0 0;
}

.avatar-wrap {
	width: 150rpx;
	height: 150rpx;
	border-radius: 100%;
	background: #FFFFFF;
	box-shadow: $box-shadow;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	z-index: 10;
}

.avatar-img {
	width: 130rpx;
	height: 130rpx;
	border-radius: 100%;
}

.level-tag {
	position: absolute;
	right: -30rpx;
	bottom: -6rpx;
	display: flex;
	align-items: center;
	gap: 4rpx;
	color: $color-warning;
	font-size: 22rpx;
	background: #FFFFFF;
	padding: 6rpx 16rpx;
	border-radius: 50rem;
	box-shadow: $box-shadow;

	image {
		width: 26rpx;
		height: 26rpx;
	}
}

/* ===== User Card ===== */
.user-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	margin-top: -75rpx;
	padding: 100rpx 28rpx 32rpx;
	box-shadow: $box-shadow;
	margin-bottom: 24rpx;
}

.nickname {
	font-size: $font-size-base;
	font-weight: 700;
	color: $text-color-assist;
	text-align: center;
	margin-bottom: 32rpx;
}

/* ===== Stats Grid ===== */
.stats-grid {
	display: flex;
	margin-bottom: 40rpx;
}

.stat-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;

	&::after {
		content: ' ';
		position: absolute;
		right: 0;
		top: 0;
		height: 100%;
		border-right: 1rpx solid $text-color-assist;
		transform: scaleX(0.2) scaleY(0.5);
	}

	&:last-child::after {
		border-right: 0;
	}
}

.stat-value {
	font-size: $font-size-base;
	font-weight: 700;
	color: $text-color-assist;
	margin-bottom: 10rpx;
}

.stat-label {
	font-size: $font-size-sm;
	color: $text-color-assist;
}

/* ===== QR Code ===== */
.qrcode-wrap {
	display: flex;
	justify-content: center;
	margin-bottom: 8rpx;
}

.qrcode-tip {
	font-size: $font-size-sm;
	color: $text-color-assist;
	text-align: center;
	margin-bottom: 40rpx;
}

/* ===== WeChat Pay ===== */
.wepay-row {
	display: flex;
	justify-content: center;
}

.wepay-btn {
	background: $gradient-caramel;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 10rpx 48rpx;
	border-radius: 48rpx !important;
	font-size: $font-size-base;
}

.wepay-icon {
	width: 36rpx;
	height: 30rpx;
	margin-right: 12rpx;
}

/* ===== Bottom ===== */
.bottom-img {
	width: 100%;
}
</style>
