<template>
	<view class="page rm-page old-money">
		<!-- Invite Card -->
		<view class="invite-card">
			<view class="invite-progress-header">
				<view class="progress-count"><text class="count-num">0</text><text class="count-total">/3</text></view>
			</view>
			<view class="progress-bar">
				<progress :percent="1/3 * 100" backgroundColor="#FFF8F0" activeColor="#A67B5B" stroke-width="24" border-radius="24"></progress>
			</view>
			<view class="invite-text">
				<view>每邀3位新用户点亮，得蛋糕礼品券1张</view>
				<view>新用户可得30元权益券包</view>
			</view>
			<view class="invite-action" hover-class="invite-action--hover">
				<image src="/static/images/activities/invite-bg.png" class="action-bg" mode="widthFix"></image>
				<view class="action-btn">
					<text>立即找好友助力</text>
					<image class="action-arrow" src="/static/images/activities/invite-arrow.png" mode="widthFix"></image>
				</view>
			</view>
		</view>

		<!-- My Award -->
		<view class="award-card">
			<image src="/static/images/activities/award-badge.png" class="award-badge" mode="widthFix"></image>
			<view class="award-item">
				<view class="award-num">0</view>
				<view class="award-label">已成功邀请(位)</view>
			</view>
			<view class="award-item">
				<view class="award-num">0</view>
				<view class="award-label">已获得奖励(次)</view>
			</view>
		</view>

		<!-- Friend Award -->
		<image src="/static/images/activities/friend-img.png" class="friend-img" mode="widthFix"></image>
	</view>
</template>

<script setup>
// 邀请有礼活动页：静态展示，无异步数据
</script>

<style lang="scss">
page {
	background: url('/static/images/activities/friend-bg.jpeg') no-repeat;
	background-size: 100% auto;
	padding: 576rpx 24rpx 0;
	height: auto;
}

.invite-card {
	padding: 36rpx 48rpx;
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	box-shadow: $box-shadow;
	margin-bottom: 24rpx;
}

.invite-progress-header {
	display: flex;
	justify-content: flex-end;
	margin-bottom: 12rpx;
}

.count-num {
	font-size: 30rpx;
	color: $color-error;
	font-weight: 700;
}

.count-total {
	font-size: $font-size-sm;
	color: $text-color-assist;
}

.progress-bar {
	margin-bottom: 20rpx;
}

.invite-text {
	text-align: center;
	font-size: $font-size-sm;
	color: $color-error;
	line-height: 40rpx;
	margin-bottom: 32rpx;
}

.invite-action {
	position: relative;
	display: flex;
	justify-content: center;
	opacity: 0.85;

	&--hover {
		opacity: 1;
	}
}

.action-bg {
	width: 90%;
}

.action-btn {
	position: absolute;
	top: 24rpx;
	display: flex;
	align-items: center;
	font-size: 30rpx;
	color: $color-error;
}

.action-arrow {
	width: 16rpx;
	margin-left: 10rpx;
}

/* ===== Award ===== */
.award-card {
	padding: 56rpx 0;
	display: flex;
	justify-content: center;
	align-items: center;
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	box-shadow: $box-shadow;
	margin-bottom: 24rpx;
	position: relative;
}

.award-badge {
	width: 291rpx;
	position: absolute;
	top: -15rpx;
}

.award-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	position: relative;

	&::after {
		position: absolute;
		content: ' ';
		background: $border-color;
		width: 2rpx;
		height: 100%;
		right: 0;
		top: 0;
		transform: scaleY(0.5);
	}

	&:last-child::after {
		width: 0;
	}
}

.award-num {
	font-size: 30rpx;
	font-weight: 700;
	color: $color-error;
}

.award-label {
	font-size: $font-size-sm;
	color: $text-color-assist;
}

.friend-img {
	width: 100%;
	margin-bottom: 30rpx;
}
</style>
