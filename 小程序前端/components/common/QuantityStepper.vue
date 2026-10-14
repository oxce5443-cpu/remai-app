<template>
	<view class="quantity-stepper">
		<view class="quantity-stepper__btn quantity-stepper__btn--minus"
			:class="{'quantity-stepper__btn--disabled': value <= min}"
			@tap="handleReduce">
			<text class="iconfont iconsami-select"></text>
		</view>
		<text class="quantity-stepper__value">{{ value }}</text>
		<view class="quantity-stepper__btn quantity-stepper__btn--plus"
			@tap="handleAdd">
			<text class="iconfont iconadd-select"></text>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		value: { type: Number, default: 1 },
		min: { type: Number, default: 1 },
		max: { type: Number, default: 99 }
	},
	methods: {
		handleAdd() {
			if (this.value < this.max) {
				this.$emit('change', this.value + 1)
			}
		},
		handleReduce() {
			if (this.value > this.min) {
				this.$emit('change', this.value - 1)
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.quantity-stepper {
	display: flex;
	align-items: center;
	gap: 16rpx;

	&__btn {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;

		&--minus {
			border: 2rpx solid $border-color;
			color: $text-color-assist;
		}

		&--plus {
			background: $color-primary;
			color: #FFFFFF;
		}

		&--disabled {
			opacity: 0.3;
		}
	}

	&__value {
		font-size: 28rpx;
		font-weight: 600;
		color: $text-color-base;
		min-width: 36rpx;
		text-align: center;
	}
}
</style>
