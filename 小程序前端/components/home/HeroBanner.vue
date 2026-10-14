<template>
	<view class="hero-banner">
		<swiper class="hero-banner__swiper" :autoplay="autoplay" :interval="interval" circular
			:indicator-dots="showDots" indicator-color="rgba(255,255,255,0.4)" indicator-active-color="#A67B5B">
			<swiper-item v-for="(img, index) in images" :key="index">
				<image :src="img" mode="aspectFill" class="hero-banner__image"></image>
			</swiper-item>
		</swiper>
		<view class="hero-banner__overlay"></view>
		<view class="hero-banner__content" v-if="$slots.default">
			<slot></slot>
		</view>
		<view class="hero-banner__content" v-else-if="title">
			<view class="hero-banner__eyebrow" v-if="eyebrow">{{ eyebrow }}</view>
			<view class="hero-banner__title">{{ title }}</view>
			<view class="hero-banner__subtitle" v-if="subtitle">{{ subtitle }}</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		images: { type: Array, default: () => [] },
		title: String,
		eyebrow: String,
		subtitle: String,
		autoplay: { type: Boolean, default: true },
		interval: { type: Number, default: 3000 },
		showDots: { type: Boolean, default: true }
	}
}
</script>

<style lang="scss" scoped>
.hero-banner {
	position: relative;
	width: 100%;
	height: 620rpx;
	overflow: hidden;
	border-radius: $border-radius-xl;

	&__swiper {
		width: 100%;
		height: 100%;
	}

	&__image {
		width: 100%;
		height: 100%;
	}

	&__overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(180deg, rgba(74, 59, 50, 0.02), rgba(74, 59, 50, 0.35));
	}

	&__content {
		position: absolute;
		bottom: 48rpx;
		left: 32rpx;
		right: 32rpx;
		color: #FFFFFF;
	}

	&__eyebrow {
		font-size: 24rpx;
		font-weight: 400;
		margin-bottom: 14rpx;
		letter-spacing: 3rpx;
		opacity: 0.85;
	}

	&__title {
		font-size: 42rpx;
		font-weight: 400;
		line-height: 58rpx;
		margin-bottom: 12rpx;
		letter-spacing: 2rpx;
	}

	&__subtitle {
		font-size: 24rpx;
		font-weight: 300;
		line-height: 36rpx;
		opacity: 0.80;
	}
}
</style>
