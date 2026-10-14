<template>
	<button class="cta-button" :class="[`cta-button--${type}`, `cta-button--${size}`, {'cta-button--block': block}]"
		:hover-class="`cta-button--${type}-hover`"
		:disabled="disabled"
		@tap="$emit('click')">
		<slot>{{ text }}</slot>
	</button>
</template>

<script>
export default {
	props: {
		text: String,
		type: { type: String, default: 'primary' },
		size: { type: String, default: 'base' },
		block: { type: Boolean, default: false },
		disabled: { type: Boolean, default: false }
	}
}
</script>

<style lang="scss" scoped>
.cta-button {
	display: flex;
	align-items: center;
	justify-content: center;
	border: none;
	font-weight: 400;
	letter-spacing: 1rpx;
	transition: all 0.2s ease;
	line-height: 1;

	&::after { border: none; }

	&--sm {
		padding: 12rpx 28rpx;
		font-size: 22rpx;
		border-radius: 40rpx;
	}

	&--base {
		padding: 20rpx 44rpx;
		font-size: 26rpx;
		border-radius: 48rpx;
	}

	&--lg {
		padding: 24rpx 56rpx;
		font-size: 30rpx;
		border-radius: 52rpx;
	}

	&--block {
		width: 100%;
	}

	&--primary {
		background: linear-gradient(135deg, #A67B5B, #C9A96E);
		color: #FFFFFF;
		box-shadow: 0 4rpx 16rpx rgba(166, 123, 91, 0.25);
	}

	&--primary-hover {
		background: linear-gradient(135deg, #8C6545, #B89858);
		opacity: 0.92;
	}

	&--outline {
		background: transparent;
		color: $color-primary;
		border: 2rpx solid $color-primary;
	}

	&--outline-hover {
		background: rgba($color: $color-primary, $alpha: 0.05);
	}

	&--ghost {
		background: #FFFFFF;
		color: $text-color-base;
		box-shadow: $box-shadow-sm;
	}

	&--ghost-hover {
		background: $bg-color;
	}

	&[disabled] {
		opacity: 0.4;
		box-shadow: none;
	}
}
</style>
