<template>
	<view class="page rm-page old-money">
		<view class="cell">
			<view class="cell-content">
				<image src="/static/images/services/djsm.png" class="cell-icon"></image>
				<text>{{ $t("等级说明") }}</text>
			</view>
			<image src="/static/images/navigator-1.png" class="cell-arrow"></image>
		</view>
		<view class="cell">
			<view class="cell-content">
				<image src="/static/images/services/hyxy.png" class="cell-icon"></image>
				<text>{{ $t("会员协议") }}</text>
			</view>
			<image src="/static/images/navigator-1.png" class="cell-arrow"></image>
		</view>
		<view class="cell">
			<view class="cell-content">
				<image src="/static/images/services/ystk.png" class="cell-icon"></image>
				<text>{{ $t("隐私条款") }}</text>
			</view>
			<image src="/static/images/navigator-1.png" class="cell-arrow"></image>
		</view>
		<view class="cell">
			<view class="cell-content">
				<image src="/static/images/services/cjwt.png" class="cell-icon"></image>
				<text>{{ $t("常见问题") }}</text>
			</view>
			<image src="/static/images/navigator-1.png" class="cell-arrow"></image>
		</view>
	</view>
</template>

<script setup>
// 帮助中心：静态入口列表
</script>

<style lang="scss" scoped>
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
