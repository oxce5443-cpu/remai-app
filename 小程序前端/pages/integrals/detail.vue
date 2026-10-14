<template>
	<view class="page rm-page old-money">
		<view class="main">
			<!-- Physical Goods -->
			<view class="goods-card" v-if="pointGood.goodsType == 2">
				<image :src="pointGood.img[0]" class="goods-img" mode="widthFix"></image>
				<view class="goods-body">
					<view class="goods-price-row">
						<view class="goods-points">{{ pointGood.pointsPrice }}<text class="goods-unit">积分</text></view>
						<template v-if="pointGood.amount > 0">
							<text class="goods-plus">+</text>
							<view class="goods-points">{{ pointGood.amount }}<text class="goods-unit">元</text></view>
						</template>
					</view>
					<view class="goods-footer">
						<view class="goods-name">{{ pointGood.goodsName }}</view>
						<view class="goods-stock">剩余<text class="stock-num">{{ pointGood.goodsStock }}</text>件</view>
					</view>
				</view>
			</view>

			<view class="desc-card" v-if="pointGood.goodsType == 2">
				<view class="desc-title">商品详情</view>
				<view class="desc-content">
					<jyf-parser ref="desc"></jyf-parser>
				</view>
			</view>

			<!-- Coupon Type -->
			<template v-else>
				<view class="coupon-wrapper">
					<view class="coupon-card">
						<image src="/static/images/integrals/ticket.png" class="coupon-img"></image>
						<view class="coupon-info">
							<view class="coupon-name">{{ pointGood.goodsName }}</view>
							<view class="coupon-expire">有效期：领券当日开始90天内有效</view>
						</view>
					</view>
				</view>
				<view class="points-row">
					<view class="points-price">{{ pointGood.pointsPrice }}<text class="points-unit">积分</text></view>
					<view class="points-stock">剩余<text class="stock-num">{{ pointGood.goodsStock }}</text>件</view>
				</view>
				<view class="desc-card">
					<view class="desc-title">兑换须知</view>
					<view class="desc-content">
						<jyf-parser ref="desc"></jyf-parser>
					</view>
					<view class="desc-title" style="margin-top: 24rpx;">使用须知</view>
					<view class="tip-row" v-for="(item, index) in useTips" :key="index">
						<text>{{ item.title }}：</text>
						<text class="tip-value">{{ item.value }}</text>
					</view>
				</view>
			</template>
		</view>

		<!-- Bottom Button -->
		<view class="btn-bar">
			<button type="primary" :disabled="customPoints.totalPoints < pointGood.pointsPrice">
				{{ customPoints.totalPoints < pointGood.pointsPrice ? '积分不足' : '立即兑换' }}
			</button>
		</view>
	</view>
</template>

<script setup>
	import { ref, nextTick } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { useStore } from 'vuex'
	import request, { api } from '@/api'
	import jyfParser from '@/components/jyf-parser/jyf-parser.vue'

	const store = useStore()
	const descRef = ref(null)
	const customPoints = ref({})
	const pointGood = ref({})
	const useTips = [
		{title: '使用条件', value: '无门槛'},
		{title: '优惠形式', value: '免最高1件'},
		{title: '有效期', value: '领券当日开始90天内有效'},
		{title: '使用时段', value: '00:00:00~23:59:59'},
		{title: '使用限制', value: '不限制'},
		{title: '兑换限制', value: '不限制'},
		{title: '活动商品', value: '限部分商品'},
		{title: '是否与其他优惠共享', value: '否'},
		{title: '使用场景', value: '仅外卖、堂食可用'}
	]

	onLoad(async ({ id }) => {
		try {
			const list = await api.getPointsGoods()
			const flat = Array.isArray(list) ? list.flatMap(g => g.goodsList || g.list || [g]) : []
			pointGood.value = flat.find(item => item.id == id) || {}
			nextTick(() => {
				if (descRef.value) {
					descRef.value.setContent(pointGood.value.exchangeDesc || '')
				}
			})
		} catch (e) {
			console.error('[integrals detail]', e)
		}
		try {
			customPoints.value = await request('customPoints')
		} catch (e) {
			customPoints.value = { totalPoints: (store.state.member && store.state.member.points) || 0 }
		}
	})
</script>

<style lang="scss" scoped>
.page {
	background-color: $bg-color;
	min-height: 100vh;
}

.main {
	padding: 20rpx 24rpx;
	padding-bottom: 180rpx;
}

/* ===== Physical Goods Card ===== */
.goods-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	overflow: hidden;
	box-shadow: $box-shadow;
	margin-bottom: 20rpx;
}

.goods-img {
	width: 100%;
	display: block;
}

.goods-body {
	padding: 24rpx 28rpx;
}

.goods-price-row {
	display: flex;
	align-items: baseline;
	margin-bottom: 16rpx;
}

.goods-points {
	font-size: 36rpx;
	font-weight: 700;
	color: $color-primary;
}

.goods-unit {
	font-size: $font-size-base;
	color: $text-color-base;
	font-weight: 400;
}

.goods-plus {
	font-size: $font-size-sm;
	color: $text-color-base;
	margin: 0 10rpx;
}

.goods-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.goods-name {
	font-size: 34rpx;
	font-weight: 700;
	color: $text-color-base;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.goods-stock {
	font-size: $font-size-sm;
	color: $text-color-base;
	flex-shrink: 0;
}

.stock-num {
	color: $color-primary;
}

/* ===== Desc Card ===== */
.desc-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 28rpx;
	box-shadow: $box-shadow;
	margin-bottom: 20rpx;
}

.desc-title {
	font-size: 30rpx;
	font-weight: 700;
	color: $text-color-base;
	margin-bottom: 16rpx;
}

.desc-content {
	font-size: $font-size-base;
	color: $text-color-assist;
}

/* ===== Coupon ===== */
.coupon-wrapper {
	padding: 0;
}

.coupon-card {
	background: #FFFFFF;
	padding: 40rpx;
	border-radius: $border-radius-lg;
	display: flex;
	align-items: center;
	position: relative;
	box-shadow: $box-shadow;
	margin-bottom: 20rpx;

	image {
		width: 180rpx;
		height: 120rpx;
		margin-right: 30rpx;
		flex-shrink: 0;
	}

	@mixin arch {
		content: " ";
		position: absolute;
		background-color: $bg-color;
		width: 40rpx;
		height: 40rpx;
		z-index: 10;
		border-radius: 100%;
	}

	&::before {
		@include arch;
		left: -20rpx;
		top: calc(50% - 20rpx);
	}

	&::after {
		@include arch;
		right: -20rpx;
		top: calc(50% - 20rpx);
	}
}

.coupon-info {
	flex: 1;
}

.coupon-name {
	font-size: 30rpx;
	font-weight: 600;
	color: $text-color-base;
	margin-bottom: 10rpx;
}

.coupon-expire {
	font-size: 22rpx;
	color: $text-color-assist;
}

.points-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 24rpx;
	margin-bottom: 20rpx;
}

.points-price {
	font-size: 30rpx;
	font-weight: 700;
	color: $color-primary;
}

.points-unit {
	font-size: 26rpx;
	font-weight: 400;
	color: $text-color-base;
}

.points-stock {
	font-size: $font-size-sm;
	color: $text-color-base;
}

/* ===== Tips ===== */
.tip-row {
	display: flex;
	font-size: $font-size-base;
	color: $text-color-base;
	line-height: 44rpx;
}

.tip-value {
	font-weight: 700;
}

/* ===== Bottom Bar ===== */
.btn-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 140rpx;
	padding: 20rpx 30rpx 30rpx;
	z-index: 10;
	background: #FFFFFF;
	box-shadow: 0 -4rpx 20rpx rgba(74, 59, 50, 0.04);

	button {
		border-radius: 48rpx !important;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: 700;
		background: linear-gradient(135deg, #A67B5B, #C9A96E) !important;
	}
}
</style>
