<template>
	<view class="order-card" @tap="$emit('click')">
		<view class="order-card__header">
			<view class="order-card__store">
				<text class="order-card__store-name">{{ $t(order.storeName || '热麦烘焙') }}</text>
				<view class="order-card__status" :class="statusClass">{{ $t(statusText) }}</view>
			</view>
		</view>
		<view class="order-card__goods">
			<image v-for="(item, i) in (order.goods || []).slice(0, 3)" :key="i"
				:src="item.image" mode="aspectFill" class="order-card__goods-img"></image>
			<view class="order-card__goods-count" v-if="(order.goods || []).length > 3">
				+{{ $t(order.goods.length - 3) }}
			</view>
		</view>
		<view class="order-card__footer">
			<view class="order-card__total">
				<text class="order-card__total-label">{{ $t("共") }}{{ $t(order.goods ? order.goods.length : 0) }}{{ $t("件") }}</text>
				<text class="order-card__total-price">￥{{ $t(order.total || 0) }}</text>
			</view>
			<view class="order-card__actions" v-if="actions.length">
				<view class="order-card__action-btn" v-for="(act, i) in actions" :key="i"
					@tap.stop="$emit(act.event)">
					{{ $t(act.text) }}
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		order: { type: Object, required: true },
		actions: { type: Array, default: () => [] }
	},
	computed: {
		statusText() {
			const map = { 0: '待付款', 1: '制作中', 2: '配送中', 3: '已完成', 4: '已取消' }
			return map[this.order.status] || '未知'
		},
		statusClass() {
			const map = { 0: 'pending', 1: 'active', 2: 'active', 3: 'done', 4: 'cancel' }
			return `order-card__status--${map[this.order.status] || 'pending'}`
		}
	}
}
</script>

<style lang="scss" scoped>
.order-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 24rpx;
	box-shadow: $box-shadow;
	margin-bottom: 20rpx;

	&__header {
		margin-bottom: 16rpx;
	}

	&__store {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	&__store-name {
		font-size: 28rpx;
		font-weight: 600;
		color: $text-color-base;
	}

	&__status {
		font-size: $font-size-sm;
		font-weight: 600;
		padding: 6rpx 18rpx;
		border-radius: 24rpx;

		&--pending { color: $color-warning; background: rgba($color-warning, 0.08); }
		&--active { color: $color-primary; background: rgba($color-primary, 0.08); }
		&--done { color: $color-success; background: rgba($color-success, 0.08); }
		&--cancel { color: $text-color-grey; background: rgba($text-color-grey, 0.08); }
	}

	&__goods {
		display: flex;
		gap: 10rpx;
		margin-bottom: 16rpx;
	}

	&__goods-img {
		width: 96rpx;
		height: 96rpx;
		border-radius: $border-radius-sm;
	}

	&__goods-count {
		width: 96rpx;
		height: 96rpx;
		background: $bg-color-grey;
		border-radius: $border-radius-sm;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-size-sm;
		color: $text-color-assist;
	}

	&__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 16rpx;
		border-top: 1rpx solid $border-color;
	}

	&__total-label {
		font-size: $font-size-sm;
		color: $text-color-assist;
		margin-right: 10rpx;
	}

	&__total-price {
		font-size: 30rpx;
		font-weight: 700;
		color: $text-color-base;
	}

	&__actions {
		display: flex;
		gap: 12rpx;
	}

	&__action-btn {
		font-size: $font-size-sm;
		color: $color-primary;
		padding: 10rpx 20rpx;
		border: 1rpx solid $color-primary;
		border-radius: 24rpx;
	}
}
</style>
