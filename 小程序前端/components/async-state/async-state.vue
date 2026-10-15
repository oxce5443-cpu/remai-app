<template>
	<view v-if="status === 'loading'" class="async-state async-loading">
		<view class="loading-dots">
			<view class="dot"></view>
			<view class="dot"></view>
			<view class="dot"></view>
		</view>
		<text class="async-tip">{{ $t(loadingText) }}</text>
	</view>

	<view v-else-if="status === 'error'" class="async-state async-error">
		<image class="async-img" src="/static/images/empty.png" mode="aspectFit"></image>
		<text class="async-title">{{ $t(errorTitle) }}</text>
		<text class="async-desc">{{ $t(errorDesc) }}</text>
		<button v-if="retryable" class="async-retry rm-btn" @tap="onRetry">{{ $t("重新加载") }}</button>
	</view>

	<view v-else-if="status === 'empty'" class="async-state async-empty">
		<image class="async-img" src="/static/images/empty.png" mode="aspectFit"></image>
		<text class="async-title">{{ $t(emptyTitle) }}</text>
		<text v-if="emptyDesc" class="async-desc">{{ $t(emptyDesc) }}</text>
		<slot name="empty"></slot>
	</view>

	<slot v-else></slot>
</template>

<script setup>
const props = defineProps({
	status: { type: String, default: 'idle' }, // idle | loading | empty | error | success
	loadingText: { type: String, default: '加载中…' },
	emptyTitle: { type: String, default: '暂无数据' },
	emptyDesc: { type: String, default: '' },
	errorTitle: { type: String, default: '加载失败' },
	errorDesc: { type: String, default: '网络开小差了，请稍后重试' },
	retryable: { type: Boolean, default: true }
})
const emit = defineEmits(['retry'])
function onRetry() {
	emit('retry')
}
</script>

<style lang="scss" scoped>
.async-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 80rpx 40rpx;
}
.async-img {
	width: 200rpx;
	height: 200rpx;
	opacity: .7;
	margin-bottom: 24rpx;
}
.async-title {
	font-size: 28rpx;
	color: $color-chocolate;
	font-weight: 600;
	margin-bottom: 12rpx;
}
.async-desc {
	font-size: 24rpx;
	color: $text-color-grey;
	margin-bottom: 32rpx;
	text-align: center;
}
.async-tip {
	font-size: 24rpx;
	color: $text-color-grey;
	margin-top: 20rpx;
}
.async-retry {
	margin-top: 16rpx;
	padding: 0 48rpx;
	font-size: 26rpx;
	line-height: 64rpx;
}
.loading-dots {
	display: flex;
	gap: 12rpx;
}
.dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	background: $color-primary;
	animation: bounce 1.2s infinite ease-in-out;
}
.dot:nth-child(2) { animation-delay: .2s; }
.dot:nth-child(3) { animation-delay: .4s; }
@keyframes bounce {
	0%, 80%, 100% { transform: scale(.6); opacity: .4; }
	40% { transform: scale(1); opacity: 1; }
}
</style>
