<template>
	<view class="product-card" @tap="$emit('click')">
		<view class="product-card__image-wrap">
			<image :src="product.images || product.image" mode="aspectFill" class="product-card__image"></image>
			<Tag v-if="product.tag" :text="product.tag" :type="product.tagType || 'new'" size="sm" class="product-card__tag" />
			<!-- 礼盒标识 -->
			<view class="product-card__gift-badge" v-if="product.is_gift">
				<text>{{ $t("🎁 礼盒") }}</text>
			</view>
		</view>
		<view class="product-card__info">
			<view class="product-card__name">{{ $t($localized(product, "name")) }}</view>
			<!-- 尺寸/口味标签行 -->
			<view class="product-card__labels" v-if="product.sizes || product.flavors">
				<text class="product-card__label" v-for="(sz, i) in product.sizes" :key="'sz-'+i">{{ $t(sz) }}</text>
				<text class="product-card__label product-card__label--flavor" v-for="(fl, i) in product.flavors" :key="'fl-'+i">{{ $t(fl) }}</text>
			</view>
			<view class="product-card__desc" v-if="product.content">{{ $t($localized(product, "content")) }}</view>
			<view class="product-card__bottom">
				<PriceTag :price="product.price" :size="'sm'" />
				<view class="product-card__action" @tap.stop v-if="showStepper">
					<QuantityStepper :value="product.number || 1"
						@change="num => $emit('add-to-cart', num)" />
				</view>
				<view class="product-card__add-btn" @tap.stop="$emit('add-to-cart', 1)" v-else>
					<text class="iconfont iconadd-select"></text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import PriceTag from '@/components/common/PriceTag.vue'
import QuantityStepper from '@/components/common/QuantityStepper.vue'
import Tag from '@/components/common/Tag.vue'
export default {
	components: { PriceTag, QuantityStepper, Tag },
	props: {
		product: { type: Object, required: true },
		showStepper: { type: Boolean, default: false }
	}
}
</script>

<style lang="scss" scoped>
.product-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	overflow: hidden;
	box-shadow: $box-shadow-sm;

	&__image-wrap {
		position: relative;
		width: 100%;
		height: 240rpx;
		background: $bg-color-grey;
	}

	&__image {
		width: 100%;
		height: 100%;
	}

	&__tag {
		position: absolute;
		top: 12rpx;
		left: 12rpx;
	}

	&__gift-badge {
		position: absolute;
		top: 12rpx;
		right: 12rpx;
		background: rgba(166, 123, 91, 0.85);
		color: #FFFFFF;
		font-size: 18rpx;
		font-weight: 400;
		padding: 4rpx 12rpx;
		border-radius: 24rpx;
	}

	&__info {
		padding: 16rpx 20rpx 20rpx;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}

	&__name {
		font-size: 26rpx;
		font-weight: 400;
		color: $text-color-base;
		line-height: 36rpx;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	&__labels {
		display: flex;
		flex-wrap: wrap;
		gap: 6rpx;
	}

	&__label {
		font-size: 18rpx;
		color: $text-color-assist;
		background: $bg-color-grey;
		padding: 2rpx 10rpx;
		border-radius: 16rpx;
		font-weight: 300;

		&--flavor {
			color: $color-accent;
			background: rgba($color-accent, 0.15);
		}
	}

	&__desc {
		font-size: $font-size-sm;
		color: $text-color-assist;
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
	}

	&__bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 4rpx;
	}

	&__add-btn {
		width: 44rpx;
		height: 44rpx;
		border-radius: 50%;
		background: $gradient-primary;
		color: #FFFFFF;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22rpx;
		box-shadow: 0 2rpx 8rpx rgba($color-primary, 0.25);
	}
}
</style>
