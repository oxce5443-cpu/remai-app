<template>
	<view class="price-tag" :class="[`price-tag--${size}`]">
		<text class="price-tag__symbol">￥</text>
		<text class="price-tag__value">{{ $t(displayPrice) }}</text>
		<text class="price-tag__original" v-if="originalPrice && originalPrice > price">￥{{ $t(originalPrice) }}</text>
	</view>
</template>

<script>
export default {
	props: {
		price: { type: [Number, String], required: true },
		originalPrice: { type: [Number, String], default: 0 },
		size: { type: String, default: 'base' }
	},
	computed: {
		displayPrice() {
			return parseFloat(this.price).toFixed(2)
		}
	}
}
</script>

<style lang="scss" scoped>
.price-tag {
	display: inline-flex;
	align-items: baseline;
	color: $color-primary;
	font-weight: 700;

	&__symbol {
		font-size: 24rpx;
		font-weight: 600;
		margin-right: 2rpx;
	}

	&__value {
		letter-spacing: 1rpx;
	}

	&__original {
		margin-left: 10rpx;
		font-size: 22rpx;
		color: $text-color-grey;
		text-decoration: line-through;
		font-weight: 400;
	}

	&--sm {
		.price-tag__symbol { font-size: 20rpx; }
		.price-tag__value { font-size: 28rpx; }
	}

	&--base {
		.price-tag__symbol { font-size: 24rpx; }
		.price-tag__value { font-size: 36rpx; }
	}

	&--lg {
		.price-tag__symbol { font-size: 28rpx; }
		.price-tag__value { font-size: 44rpx; }
	}
}
</style>
