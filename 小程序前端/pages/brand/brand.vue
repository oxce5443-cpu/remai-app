<template>
	<view class="page rm-page old-money">
		<!-- 顶部安全区 -->
		<view class="safe-top"></view>

		<!-- 品牌头（图纸：REMAI + 热麦 + 右上装饰） -->
		<view class="brandbar">
			<view class="brand-left">
				<view class="brand-en">REMAI</view>
				<view class="brand-cn">热麦</view>
			</view>
			<view class="brand-deco">
				<view class="deco-dot"></view>
				<view class="deco-dot"></view>
				<view class="deco-dot"></view>
				<view class="deco-ring"></view>
			</view>
		</view>

		<!-- 主视觉：竖排大字 + 英文衬线 -->
		<view class="hero-copy">
			<view class="hero-en-serif">GOOD FOOD · BETTER LIFE</view>
			<view class="hero-zh">
				<view class="zh-line">一口</view>
				<view class="zh-line">治愈的</view>
				<view class="zh-line">小确幸</view>
			</view>
			<view class="hero-en-sub">Freshly baked<br/>with love</view>
		</view>

		<!-- 进入点餐 CTA -->
		<view class="cta" @tap="goMenu">
			<text class="cta-text">进入点餐</text>
			<text class="cta-arrow">→</text>
		</view>

		<view class="safe-bottom"></view>
	</view>
</template>

<script setup>
function goMenu() { uni.switchTab({ url: '/pages/menu/menu' }) }
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	padding: 0 44rpx calc(env(safe-area-inset-bottom) + 48rpx);
	background: $bg-page;
	color: $t-primary;
	box-sizing: border-box;
}

.safe-top {
	height: env(safe-area-inset-top);
}

/* ═══ 品牌头 ═══ */
.brandbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 34rpx 0 20rpx;
}

.brand-left {
	display: flex;
	flex-direction: column;
}

.brand-en {
	font-family: $font-serif;
	font-size: 46rpx;
	font-weight: 700;
	letter-spacing: 7rpx;
	line-height: 1.05;
	color: $c-brown;
}

.brand-cn {
	margin-top: 6rpx;
	font-size: 21rpx;
	font-weight: 600;
	letter-spacing: 5rpx;
	color: $t-secondary;
}

.brand-deco {
	position: relative;
	width: 96rpx;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 8rpx;
}

.deco-dot {
	width: 10rpx;
	height: 10rpx;
	border-radius: 50%;
	background: $c-caramel;
}

.deco-ring {
	position: absolute;
	right: 0;
	top: 50%;
	transform: translateY(-50%);
	width: 34rpx;
	height: 34rpx;
	border-radius: 50%;
	border: 2rpx solid $c-caramel;
}

/* ═══ 主视觉 ═══ */
.hero-copy {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding-bottom: 60rpx;
}

.hero-en-serif {
	font-size: 23rpx;
	letter-spacing: 5rpx;
	color: $c-caramel;
	font-weight: 600;
	margin-bottom: 56rpx;
}

.hero-zh {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.zh-line {
	font-family: $font-serif;
	font-size: 92rpx;
	font-weight: 700;
	line-height: 1.18;
	letter-spacing: 8rpx;
	color: $c-brown;
}

.hero-en-sub {
	margin-top: 44rpx;
	font-family: $font-serif;
	font-size: 30rpx;
	line-height: 1.5;
	letter-spacing: 3rpx;
	color: $t-secondary;
}

/* ═══ CTA ═══ */
.cta {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 10rpx;
	padding: 24rpx 0;
	border-radius: $r-full;
	background: $c-brown;
	color: #FFF8EF;
	font-size: 28rpx;
	font-weight: 600;
	letter-spacing: 2rpx;
	box-shadow: $shadow-btn;
}

.cta-arrow {
	font-size: 30rpx;
	line-height: 1;
}

.safe-bottom {
	height: 24rpx;
}
</style>
