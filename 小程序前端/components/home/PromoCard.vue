<template>
	<view class="promo-card" :style="{background: bgColor || '#FFFFFF'}" @tap="$emit('click')">
		<image :src="image" mode="aspectFill" class="promo-card__image" v-if="image"></image>
		<view class="promo-card__body">
			<view class="promo-card__content">
				<Tag v-if="tag" :text="tag" :type="tagType" size="sm" />
				<view class="promo-card__title">{{ $t(title) }}</view>
				<view class="promo-card__desc" v-if="desc">{{ $t(desc) }}</view>
			</view>
			<view class="promo-card__action" v-if="actionText">
				<text class="promo-card__action-text">{{ $t(actionText) }}</text>
				<text class="iconfont iconarrow-right line-height-100"></text>
			</view>
		</view>
	</view>
</template>

<script>
import Tag from '@/components/common/Tag.vue'
export default {
	components: { Tag },
	props: {
		title: String,
		desc: String,
		image: String,
		tag: String,
		tagType: { type: String, default: 'new' },
		actionText: String,
		bgColor: String
	}
}
</script>

<style lang="scss" scoped>
.promo-card {
	border-radius: $border-radius-lg;
	overflow: hidden;
	box-shadow: $box-shadow;
	margin-bottom: 24rpx;

	&__image {
		width: 100%;
		height: 280rpx;
	}

	&__body {
		padding: 24rpx;
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 16rpx;
	}

	&__content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 10rpx;
	}

	&__title {
		font-size: 30rpx;
		font-weight: 700;
		color: $text-color-base;
	}

	&__desc {
		font-size: $font-size-sm;
		color: $text-color-assist;
	}

	&__action {
		display: flex;
		align-items: center;
		gap: 4rpx;
		flex-shrink: 0;
	}

	&__action-text {
		font-size: $font-size-sm;
		color: $color-primary;
	}
}
</style>
