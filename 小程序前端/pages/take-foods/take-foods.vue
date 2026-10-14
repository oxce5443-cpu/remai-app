<template>
	<view class="page rm-page old-money">
		<!-- 顶部安全区 -->
		<view class="safe-top"></view>

		<!-- Header -->
		<view class="header">
			<view class="header-cn">取餐</view>
		</view>

		<!-- Empty State -->
		<view v-if="!Object.keys(order).length" class="empty-state">
			<view class="empty-bread">
				<loading-bread :size="170" />
			</view>
			<view class="empty-title">还没有今天的热麦</view>
			<view class="empty-tips">Freshly baked, waiting for you.</view>
			<button type="primary" class="empty-btn" size="default" @tap="menu">去点餐</button>
			<view class="empty-link" @tap="orders">查看历史订单 →</view>
		</view>

		<!-- Active Order -->
		<view class="order-scroll" v-else>
			<!-- Baking Hero -->
			<view class="bake-hero">
				<view class="bake-ring">
					<loading-bread :size="130" />
				</view>
				<view class="bake-title">小麦正在为你烘焙中…</view>
				<view class="bake-sub">新鲜出炉，马上就好</view>
				<view class="bake-queue-no" v-if="order.typeCate == 1">
					<text class="bake-queue-label">取餐号</text>
					<text class="bake-queue-num">{{ order.sortNum }}</text>
				</view>
				<view class="bake-queue-no" v-else>
					<text class="bake-queue-label">订单号</text>
					<text class="bake-queue-num">{{ order.orderNo }}</text>
				</view>
			</view>

			<!-- Steps：下单 → 制作 → 取餐（外卖 4 步） -->
			<view class="steps-card">
				<view class="step">
					<view class="step-dot" :class="{active: order.status >= 1}"></view>
					<view class="step-title">下单</view>
					<view class="step-sub" :class="{active: order.status >= 1}">8-12 分钟</view>
				</view>
				<view class="step-line" :class="{active: order.status >= 2}"></view>
				<view class="step">
					<view class="step-dot" :class="{active: order.status >= 2}"></view>
					<view class="step-title">制作</view>
					<view class="step-sub" :class="{active: order.status >= 2}">
						{{ order.status >= 2 ? '进行中' : '等待中' }}
					</view>
				</view>
				<template v-if="order.typeCate == 2">
					<view class="step-line" :class="{active: order.status >= 3}"></view>
					<view class="step">
						<view class="step-dot" :class="{active: order.status >= 3}"></view>
						<view class="step-title">配送</view>
						<view class="step-sub" :class="{active: order.status >= 3}">
							{{ order.status >= 3 ? '配送中' : '待配送' }}
						</view>
					</view>
				</template>
				<view class="step-line" :class="{active: order.status >= 4}"></view>
				<view class="step">
					<view class="step-dot" :class="{active: order.status >= 4}"></view>
					<view class="step-title">{{ order.typeCate == 2 ? '送达' : '取餐' }}</view>
					<view class="step-sub" :class="{active: order.status >= 4}">
						{{ order.status >= 4 ? '已完成' : '待取餐' }}
					</view>
				</view>
			</view>

			<!-- Store Info -->
			<view class="store-row">
				<view class="store-pin">⌖</view>
				<view class="store-main">
					<view class="store-name">{{ order.store && order.store.name ? order.store.name : '热麦·万象城店' }}</view>
					<view class="store-meta">营业时间 08:00 - 22:00</view>
				</view>
			</view>

			<!-- Order Summary（一行摘要，详情见订单详情） -->
			<view class="order-summary">
				<text>共 {{ totalCount }} 件</text>
				<text class="summary-dot">·</text>
				<text>实付 ¥{{ order.amount }}</text>
				<text class="summary-dot">·</text>
				<text>{{ $util.formatDateTime(order.createdAt) }}</text>
			</view>

			<view class="detail-link" @tap="goDetail">
				<text>查看订单详情</text>
				<text class="detail-arrow">></text>
			</view>

			<view class="bottom-spacer"></view>
		</view>

		<view class="safe-bottom"></view>
	</view>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import LoadingBread from '@/components/loading-bread.vue'

const store = useStore()
const order = computed(() => store.state.order || {})

const totalCount = computed(() => {
	const goods = order.value.goods || []
	return goods.reduce((acc, g) => acc + (Number(g.number) || 0), 0)
})

function orders() { uni.navigateTo({ url: '/pages/orders/orders' }) }
function menu() { uni.switchTab({ url: '/pages/menu/menu' }) }
function goDetail() {
	const id = order.value._id || order.value.orderId || order.value.id
	if (id) {
		uni.navigateTo({ url: '/pages/orders/detail?order_id=' + id })
	} else {
		orders()
	}
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: $bg-page;
	color: $t-primary;
	padding: 0 32rpx calc(env(safe-area-inset-bottom) + 48rpx);
}

.safe-top {
	height: env(safe-area-inset-top);
}

/* ═══ Header ═══ */
.header {
	padding: 32rpx 0 8rpx;
}

.header-cn {
	font-family: $font-serif;
	font-size: 44rpx;
	font-weight: 700;
	color: $c-brown;
}

/* ═══ Empty ═══ */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 100rpx;
}

.empty-bread {
	margin-bottom: 16rpx;
}

.empty-title {
	font-family: $font-serif;
	font-size: 36rpx;
	font-weight: 700;
	color: $c-brown;
}

.empty-tips {
	margin-top: 10rpx;
	font-size: 22rpx;
	letter-spacing: 2rpx;
	color: $t-tertiary;
}

.empty-btn {
	margin-top: 40rpx;
	padding: 18rpx 72rpx;
	border-radius: $r-full;
	background: $grad-caramel;
	color: #FFF8EF;
	font-size: 28rpx;
	font-weight: 600;
	border: none;
	box-shadow: $shadow-btn;

	&::after { border: none; }
}

.empty-link {
	margin-top: 28rpx;
	font-size: 24rpx;
	color: $c-caramel;
}

/* ═══ Bake Hero ═══ */
.bake-hero {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 36rpx 0 30rpx;
}

.bake-ring {
	width: 190rpx;
	height: 190rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, $c-cream, #F2E7DA);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 20rpx;
	box-shadow: 0 16rpx 40rpx rgba(74, 52, 39, .10);
}

.bake-title {
	font-family: $font-serif;
	font-size: 40rpx;
	font-weight: 700;
	color: $c-brown;
	letter-spacing: 2rpx;
}

.bake-sub {
	margin-top: 10rpx;
	font-size: 24rpx;
	color: $t-tertiary;
}

.bake-queue-no {
	display: flex;
	align-items: baseline;
	gap: 14rpx;
	margin-top: 18rpx;
	padding: 10rpx 28rpx;
	border-radius: $r-full;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .06);
}

.bake-queue-label {
	font-size: 22rpx;
	color: $t-tertiary;
}

.bake-queue-num {
	font-family: $font-serif;
	font-size: 30rpx;
	font-weight: 700;
	color: $c-terra;
}

/* ═══ Steps ═══ */
.steps-card {
	display: flex;
	align-items: flex-start;
	padding: 30rpx 26rpx;
	border-radius: $r-xl;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .05);
	box-shadow: $shadow-xs;
	margin-bottom: 24rpx;
}

.step {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
}

.step-dot {
	width: 20rpx;
	height: 20rpx;
	border-radius: 50%;
	background: #E3D8CC;
	box-shadow: 0 0 0 6rpx $c-ivory, 0 0 0 8rpx #E3D8CC;
}

.step-dot.active {
	background: $c-caramel;
	box-shadow: 0 0 0 6rpx $c-ivory, 0 0 0 8rpx $c-caramel;
}

.step-title {
	font-size: 24rpx;
	font-weight: 600;
	color: $t-secondary;
}

.step-title.active {
	color: $t-primary;
}

.step-sub {
	font-size: 20rpx;
	color: $t-tertiary;
	white-space: nowrap;
}

.step-sub.active {
	color: $c-caramel;
}

.step-line {
	flex: 1;
	height: 3rpx;
	background: #E3D8CC;
	margin-top: 9rpx;
}

.step-line.active {
	background: $c-caramel;
}

/* ═══ Store ═══ */
.store-row {
	display: flex;
	align-items: center;
	padding: 26rpx;
	border-radius: $r-xl;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .05);
	box-shadow: $shadow-xs;
	margin-bottom: 20rpx;
}

.store-pin {
	width: 60rpx;
	height: 60rpx;
	border-radius: 50%;
	background: $bg-soft;
	color: $c-caramel;
	font-size: 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 18rpx;
	flex-shrink: 0;
}

.store-main {
	flex: 1;
	min-width: 0;
}

.store-name {
	font-size: 30rpx;
	font-weight: 700;
	color: $t-primary;
}

.store-meta {
	margin-top: 4rpx;
	font-size: 21rpx;
	color: $t-tertiary;
}

/* ═══ Order Summary ═══ */
.order-summary {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	font-size: 23rpx;
	color: $t-secondary;
	margin-bottom: 18rpx;
}

.summary-dot {
	color: $t-tertiary;
}

/* ═══ Detail Link ═══ */
.detail-link {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	padding: 8rpx 0 4rpx;
	font-size: 25rpx;
	color: $c-caramel;
	font-weight: 600;
}

.detail-arrow {
	font-size: 26rpx;
}

.bottom-spacer {
	height: 10rpx;
}

.safe-bottom {
	height: 24rpx;
}
</style>
