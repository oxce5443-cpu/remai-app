<template>
	<view class="section-header" :class="{'section-header--with-more': showMore}">
		<view class="section-header__left">
			<view class="section-header__title" v-if="title">{{ $t(title) }}</view>
			<view class="section-header__subtitle" v-if="subtitle">{{ $t(subtitle) }}</view>
		</view>
		<view class="section-header__right" v-if="showMore" @tap="$emit('more')">
			<text class="section-header__more-text">{{ $t(moreText || '查看更多') }}</text>
			<text class="iconfont iconarrow-right line-height-100"></text>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		title: String,
		subtitle: String,
		showMore: { type: Boolean, default: false },
		moreText: String
	}
}
</script>

<style lang="scss" scoped>
.section-header {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	padding: 24rpx 0;

	&__left {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}

	&__title {
		font-size: 34rpx;
		font-weight: 700;
		color: $text-color-base;
		letter-spacing: 1rpx;
	}

	&__subtitle {
		font-size: $font-size-sm;
		color: $text-color-assist;
	}

	&__right {
		display: flex;
		align-items: center;
		gap: 6rpx;
	}

	&__more-text {
		font-size: $font-size-sm;
		color: $color-primary;
	}
}
</style>
