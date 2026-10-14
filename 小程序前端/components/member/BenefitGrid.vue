<template>
	<view class="benefit-grid">
		<view class="benefit-grid__item" v-for="(item, index) in items" :key="index"
			:class="{'benefit-grid__item--cols-5': cols === 5}"
			@tap="handleTap(item)">
			<view class="benefit-grid__icon-wrap">
				<image :src="item.icon" mode="aspectFit" class="benefit-grid__icon"></image>
			</view>
			<view class="benefit-grid__label">{{ item.text }}</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		items: { type: Array, default: () => [] },
		cols: { type: Number, default: 4 }
	},
	methods: {
		handleTap(item) {
			if (item.route) {
				this.$emit('navigate', item.route)
			}
		}
	}
}
</script>

<style lang="scss" scoped>
.benefit-grid {
	display: flex;
	flex-wrap: wrap;
	padding: 16rpx 0;

	&__item {
		width: 25%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
		padding: 16rpx 0;

		&--cols-5 {
			width: 20%;
		}
	}

	&__icon-wrap {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	&__icon {
		width: 72rpx;
		height: 72rpx;
	}

	&__label {
		font-size: $font-size-sm;
		color: $text-color-assist;
		text-align: center;
	}
}
</style>
