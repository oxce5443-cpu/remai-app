<template>
	<view class="page rm-page old-money">
		<view class="main">
			<!-- Status Header -->
			<view class="status-header" :class="'status--' + order.status">
				<view class="status-title">{{ getStatusText(order.status) }}</view>
				<view class="status-desc" v-if="order.status === 'pending'">请尽快完成支付</view>
				<view class="status-desc" v-else-if="order.status === 'paid'">商家正在制作中，请耐心等待</view>
				<view class="status-desc" v-else-if="order.status === 'processing'">餐品已制作完成，请到店取餐</view>
				<view class="status-desc" v-else-if="order.status === 'completed'">订单已完成，感谢您的光临</view>
				<view class="status-desc" v-else-if="order.status === 'cancelled'">订单已取消</view>
			</view>

			<!-- Goods List -->
			<view class="card card--goods">
				<view class="card-title">商品清单</view>
				<view class="goods-item" v-for="(good, index) in order.goodsList" :key="index">
					<image :src="good.image || '/static/images/goods/default.png'" class="goods-image" mode="aspectFill"></image>
					<view class="goods-left">
						<view class="goods-name">{{ good.goodsName }}</view>
						<view class="goods-props" v-if="good.property">{{ good.property }}</view>
					</view>
					<view class="goods-right">
						<text class="goods-price">¥{{ good.price }}</text>
						<text class="goods-qty">x{{ good.num }}</text>
					</view>
				</view>
			</view>

			<!-- Payment -->
			<view class="card">
				<view class="info-row">
					<text>商品金额</text>
					<text class="info-value">¥{{ order.totalPrice }}</text>
				</view>
				<view class="info-row" v-if="order.packingFee && Number(order.packingFee) > 0">
					<text>打包费</text>
					<text class="info-value">¥{{ order.packingFee }}</text>
				</view>
				<view class="info-row" v-if="order.deliveryFee && Number(order.deliveryFee) > 0">
					<text>配送费</text>
					<text class="info-value">¥{{ order.deliveryFee }}</text>
				</view>
				<view class="info-row info-row--total">
					<text>实付金额</text>
					<text class="info-value info-value--total">¥{{ order.totalPrice }}</text>
				</view>
			</view>

			<!-- Order Info -->
			<view class="card">
				<view class="card-title">订单信息</view>
				<view class="info-row"><text>餐具</text><text class="info-value">{{ order.cutleryCount == null ? '未记录' : order.cutleryCount === 0 ? '无需餐具' : order.cutleryCount + ' 份' }}</text></view>
				<view class="info-row">
					<text>订单号</text>
					<text class="info-value">{{ order.orderNo }}</text>
				</view>
				<view class="info-row">
					<text>下单时间</text>
					<text class="info-value">{{ formatDate(order.createdAt) }}</text>
				</view>
				<view class="info-row" v-if="order.payTime">
					<text>支付时间</text>
					<text class="info-value">{{ formatDate(order.payTime) }}</text>
				</view>
				<view class="info-row">
					<text>用餐方式</text>
					<text class="info-value">{{ order.type === 'takein' ? '到店自取' : '外卖配送' }}</text>
				</view>
				<view class="info-row" v-if="order.payMode">
					<text>支付方式</text>
					<text class="info-value">{{ order.payMode === 'wechat' ? '微信支付' : '余额支付' }}</text>
				</view>
				<view class="info-row" v-if="order.remark" style="border-bottom: none;">
					<text>备注</text>
					<text class="info-value">{{ order.remark }}</text>
				</view>
			</view>

			<view class="bottom-spacer"></view>
		</view>

		<!-- Bottom Buttons -->
		<view class="btn-bar" v-if="order.status === 'pending'">
			<view class="btn-item">
				<button type="primary" plain @tap="cancelOrder">取消订单</button>
			</view>
			<view class="btn-item">
				<button type="primary" @tap="goToPay">去支付</button>
			</view>
		</view>

		<view class="btn-bar" v-else-if="order.status === 'completed'">
			<view class="btn-item">
				<button type="primary" plain @tap="goToReview">去评价</button>
			</view>
			<view class="btn-item">
				<button type="primary" @tap="orderAgain">再来一单</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '@/api'

const order = ref({ goodsList: [] })
const loading = ref(false)
const orderId = ref('')

onLoad((options) => {
	orderId.value = options.order_id || options.id
	loadOrderDetail()
})

async function loadOrderDetail() {
	const token = uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
	if (!token) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		return
	}
	loading.value = true
	try {
		const data = await api.getOrderDetail({ orderId: orderId.value })
		if (data) order.value = data
	} catch (e) {
		console.error('加载订单详情失败', e)
		uni.showToast({ title: e.message || '加载失败', icon: 'none' })
	} finally {
		loading.value = false
	}
}

function getStatusText(s) {
	const m = { pending: '待支付', paid: '制作中', processing: '待取餐', completed: '已完成', cancelled: '已取消' }
	return m[s] || s
}
function formatDate(date) {
	if (!date) return ''
	const d = new Date(date)
	const p = (n) => String(n).padStart(2, '0')
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

async function cancelOrder() {
	const res = await uni.showModal({
		title: '提示', content: '确定要取消这个订单吗？',
		confirmText: '确定取消', cancelText: '再想想'
	})
	if (!res.confirm) return
	try {
		uni.showLoading({ title: '取消中...' })
		await api.cancelOrder({ orderId: orderId.value, reason: '用户取消' })
		uni.showToast({ title: '已取消', icon: 'success' })
		loadOrderDetail()
	} catch (e) {
		uni.showToast({ title: e.message || '取消失败', icon: 'none' })
	} finally {
		uni.hideLoading()
	}
}

function goToPay() { uni.navigateTo({ url: '/pages/pay/pay?order_id=' + orderId.value }) }
function goToReview() { uni.navigateTo({ url: '/pages/review/review?order_id=' + orderId.value }) }
function orderAgain() { uni.switchTab({ url: '/pages/menu/menu' }) }
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: $bg-color;
}

.main {
	padding: 20rpx 24rpx;
}

/* Status Header */
.status-header {
	padding: 40rpx 24rpx;
	border-radius: $border-radius-lg;
	margin-bottom: 20rpx;
	color: white;
	text-align: center;

	&.status--pending {
		background: linear-gradient(135deg, #E6A23C, #F0C78E);
	}
	&.status--paid,
	&.status--processing {
		background: linear-gradient(135deg, #A67B5B, #C9A96E);
	}
	&.status--completed {
		background: linear-gradient(135deg, #67C23A, #95D475);
	}
	&.status--cancelled {
		background: linear-gradient(135deg, #909399, #C0C4CC);
	}
}

.status-title {
	font-size: 36rpx;
	font-weight: 700;
	margin-bottom: 12rpx;
}

.status-desc {
	font-size: 26rpx;
	opacity: 0.9;
}

/* Card */
.card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 28rpx 24rpx;
	margin-bottom: 20rpx;
	box-shadow: $box-shadow-sm;
}

.card-title {
	font-size: 28rpx;
	font-weight: 600;
	color: $text-color-base;
	margin-bottom: 20rpx;
}

/* Goods */
.goods-item {
	display: flex;
	align-items: center;
	gap: 16rpx;
	padding: 16rpx 0;

	&:not(:last-child) {
		border-bottom: 1rpx solid $border-color-light;
	}
}

.goods-image {
	width: 100rpx;
	height: 100rpx;
	border-radius: $border-radius-sm;
	flex-shrink: 0;
	background: $bg-color-grey;
}

.goods-left {
	flex: 1;
	overflow: hidden;
}

.goods-name {
	font-size: 28rpx;
	color: $text-color-base;
	font-weight: 500;
	margin-bottom: 6rpx;
}

.goods-props {
	font-size: 22rpx;
	color: $text-color-assist;
}

.goods-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 6rpx;
	flex-shrink: 0;
}

.goods-price {
	font-size: 28rpx;
	font-weight: 600;
	color: $text-color-base;
}

.goods-qty {
	font-size: 22rpx;
	color: $text-color-assist;
}

/* Info Row */
.info-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 14rpx 0;
	font-size: 26rpx;
	color: $text-color-base;
	border-bottom: 1rpx solid $border-color-light;

	&:last-child { border-bottom: none; }

	&--total {
		padding-top: 20rpx;
		margin-top: 8rpx;
		border-top: 1rpx solid $border-color;
		border-bottom: none;
	}
}

.info-value {
	font-weight: 500;

	&--total {
		font-size: 32rpx;
		font-weight: 700;
		color: $color-primary;
	}
}

.bottom-spacer {
	height: 160rpx;
}

/* Bottom Bar */
.btn-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #FFFFFF;
	box-shadow: 0 -4rpx 20rpx rgba(74, 59, 50, 0.04);
	display: flex;
	align-items: center;
	justify-content: flex-end;
	gap: 16rpx;
	padding: 16rpx 24rpx 32rpx;
	z-index: 10;
}

.btn-item {
	width: 200rpx;

	button {
		width: 100%;
		border-radius: 48rpx !important;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 26rpx;
		font-weight: 600;

		&[plain] {
			border: 1rpx solid $color-primary;
			color: $color-primary;
		}
	}
}
</style>
