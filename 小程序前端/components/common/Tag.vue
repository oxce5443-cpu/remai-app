<template>
	<view class="tag" :class="[`tag--${type}`, `tag--${size}`]">
		{{ $t(text) }}
	</view>
</template>

<script>
export default {
	props: {
		text: String,
		type: { type: String, default: 'default' },
		size: { type: String, default: 'base' }
	}
}
</script>

<style lang="scss" scoped>
.tag {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	border-radius: 48rpx;
	font-weight: 600;
	letter-spacing: 0.5rpx;

	&--sm {
		padding: 4rpx 16rpx;
		font-size: 20rpx;
	}

	&--base {
		padding: 6rpx 20rpx;
		font-size: 22rpx;
	}

	&--default {
		background: $bg-color-grey;
		color: $text-color-assist;
	}

	&--new {
		background: rgba($color: $color-primary, $alpha: 0.12);
		color: $color-primary;
	}

	&--hot {
		background: rgba($color: $color-error, $alpha: 0.1);
		color: $color-error;
	}

	&--sale {
		background: rgba($color: $color-warning, $alpha: 0.12);
		color: $color-warning;
	}
}
</style>
