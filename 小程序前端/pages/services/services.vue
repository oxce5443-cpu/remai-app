<template>
	<view class="page rm-page old-money">
		<view class="cell" @tap="helpCenter">
			<view class="cell-content">
				<image src="/static/images/services/bzzx.png" class="cell-icon"></image>
				<text>帮助中心</text>
			</view>
			<image src="/static/images/navigator-1.png" class="cell-arrow"></image>
		</view>
		<view class="cell">
			<view class="cell-content">
				<text class="service-emoji">🏠</text>
				<text>关于热麦</text>
			</view>
			<image src="/static/images/navigator-1.png" class="cell-arrow"></image>
		</view>
		<view class="cell">
			<view class="cell-content">
				<image src="/static/images/services/wdzl.png" class="cell-icon"></image>
				<text>热麦礼物</text>
			</view>
			<image src="/static/images/navigator-1.png" class="cell-arrow"></image>
		</view>
	</view>
</template>

<script setup>
function helpCenter() { uni.navigateTo({ url: '/pages/services/help-center' }) }
</script>

<style lang="scss">
page {
	background-color: $bg-color;
}

.cell {
	padding: 32rpx 30rpx;
	display: flex;
	align-items: center;
	background: #FFFFFF;
	margin: 12rpx 24rpx;
	border-radius: $border-radius-base;
	box-shadow: $box-shadow;
}

.cell-content {
	flex: 1;
	display: flex;
	align-items: center;
	font-size: $font-size-base;
	color: $text-color-base;
}

.cell-icon {
	width: 64rpx;
	height: 64rpx;
	margin-right: 16rpx;
}

.cell-arrow {
	width: 44rpx;
	height: 44rpx;
	flex-shrink: 0;
}
</style>
