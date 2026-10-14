<template>
	<view class="page rm-page old-money">
		<!-- 顶部安全区 -->
		<view class="safe-top"></view>

		<!-- Header -->
		<view class="header">
			<view class="header-back" @tap="goBack">‹</view>
			<view class="header-title">我的订单</view>
			<view class="header-side"></view>
		</view>

		<!-- Tabs -->
		<view class="tabs">
			<view
				class="tab-item"
				:class="{ 'tab-item--active': currentTab === 'all' }"
				@tap="switchTab('all')"
			>全部</view>
			<view
				class="tab-item"
				:class="{ 'tab-item--active': currentTab === 'pending' }"
				@tap="switchTab('pending')"
			>待付款</view>
			<view
				class="tab-item"
				:class="{ 'tab-item--active': currentTab === 'paid' }"
				@tap="switchTab('paid')"
			>制作中</view>
			<view
				class="tab-item"
				:class="{ 'tab-item--active': currentTab === 'processing' }"
				@tap="switchTab('processing')"
			>待取餐</view>
			<view
				class="tab-item"
				:class="{ 'tab-item--active': currentTab === 'completed' }"
				@tap="switchTab('completed')"
			>已完成</view>
		</view>

		<!-- Order List -->
		<scroll-view class="order-scroll" scroll-y>
			<view class="order-list" v-if="orders.length > 0">
				<view
					class="order-card"
					v-for="order in orders"
					:key="order._id"
				>
					<view class="order-head">
						<view class="order-no">
							<text class="order-no-label">订单号</text>
							<text class="order-no-value">{{ order.orderNo }}</text>
						</view>
						<view class="order-status" :class="'status--' + order.status">
							{{ getStatusText(order.status) }}
						</view>
					</view>

					<view class="order-goods" @tap="goToDetail(order._id)">
						<view
							class="goods-item"
							v-for="(item, idx) in order.goodsList"
							:key="idx"
						>
							<view class="goods-img-wrap">
								<image
									:src="item.image || '/static/images/goods/default.png'"
									class="goods-image"
									mode="aspectFill"
								></image>
								<view v-if="!item.image" class="goods-image goods-image--ph"><text>🍞</text></view>
							</view>
							<view class="goods-info">
								<view class="goods-name">{{ item.goodsName }}</view>
								<view class="goods-spec" v-if="item.property">{{ item.property }}</view>
							</view>
							<view class="goods-right">
								<view class="goods-price">¥{{ item.price }}</view>
								<view class="goods-qty">×{{ item.num }}</view>
							</view>
						</view>
					</view>

					<view class="order-footer">
						<view class="order-time">{{ formatDate(order.createdAt) }}</view>
						<view class="order-total">
							共{{ getTotalQty(order) }}件，实付
							<text class="total-amount">¥{{ order.totalPrice }}</text>
						</view>
					</view>

					<view class="order-actions" v-if="order.status === 'pending'">
						<view class="action-btn action-btn--outline" @tap.stop="cancelOrder(order._id)">
							取消订单
						</view>
						<view class="action-btn action-btn--primary" @tap.stop="goToPay(order._id)">
							去支付
						</view>
					</view>
					<view class="order-actions order-actions--two" v-else>
						<view class="action-btn action-btn--outline" @tap.stop="goAgain(order)">
							再来一单
						</view>
						<view class="action-btn action-btn--primary" @tap.stop="goToDetail(order._id)">
							查看详情
						</view>
					</view>
				</view>
			</view>

			<!-- Empty State -->
			<view class="empty-state" v-else-if="!loading">
				<view class="empty-emoji">🧾</view>
				<view class="empty-text">暂无订单</view>
				<view class="empty-btn" @tap="goToMenu">去点餐</view>
			</view>

			<!-- Loading -->
			<view class="loading" v-if="loading">
				<view class="loading-dot"></view>
				<view class="loading-text">加载中...</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import { api } from '@/api'

const store = useStore()

const currentTab = ref('all')
const orders = ref([])
const loading = ref(false)
const status = ref('loading')
const page = ref(1)
const pageSize = ref(10)
const hasMore = ref(true)

onLoad(() => loadOrders())

onPullDownRefresh(() => {
	page.value = 1
	hasMore.value = true
	loadOrders().then(() => uni.stopPullDownRefresh())
})

onReachBottom(() => {
	if (hasMore.value && !loading.value) {
		page.value += 1
		loadOrders()
	}
})

function goBack() { uni.navigateBack() }

function switchTab(tab) {
	currentTab.value = tab
	page.value = 1
	hasMore.value = true
	orders.value = []
	loadOrders()
}

async function loadOrders() {
	const token = uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
	if (!token) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 1000)
		return
	}
	loading.value = true
	try {
		const params = { page: page.value, pageSize: pageSize.value }
		if (currentTab.value !== 'all') params.status = currentTab.value
		const newOrders = await api.getOrders(params) || []
		if (page.value === 1) orders.value = newOrders
		else orders.value = [...orders.value, ...newOrders]
		hasMore.value = newOrders.length === pageSize.value
		status.value = orders.value.length ? 'ready' : 'empty'
	} catch (e) {
		console.error('加载订单失败', e)
		status.value = page.value === 1 ? 'error' : 'ready'
		uni.showToast({ title: e.message || '加载失败', icon: 'none' })
	} finally {
		loading.value = false
	}
}

function getStatusText(s) {
	const m = { pending: '待支付', paid: '制作中', processing: '待取餐', completed: '已完成', cancelled: '已取消' }
	return m[s] || s
}
function getTotalQty(order) {
	if (!order.goodsList) return 0
	return order.goodsList.reduce((sum, item) => sum + (item.num || 0), 0)
}
function formatDate(date) {
	if (!date) return ''
	const d = new Date(date)
	const p = (n) => String(n).padStart(2, '0')
	return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function goToDetail(orderId) { uni.navigateTo({ url: '/pages/orders/detail?order_id=' + orderId }) }

// 再来一单：把历史订单商品重新加入购物车（复用真实购物车存储）
function goAgain(order) {
	const cart = (order.goodsList || []).map(g => ({
		id: g.goodsId,
		cateId: '',
		name: g.goodsName,
		price: g.price,
		number: g.num || 1,
		image: g.image || '',
		useProperty: false,
		propsText: g.property || '',
		props: ''
	}))
	if (!cart.length) {
		uni.showToast({ title: '该订单没有商品', icon: 'none' })
		return
	}
	const existing = uni.getStorageSync('cart') || []
	const merged = [...existing]
	for (const item of cart) {
		const i = merged.findIndex(m => m.id === item.id && m.propsText === item.propsText)
		if (i > -1) merged[i].number += item.number
		else merged.push(item)
	}
	uni.setStorageSync('cart', merged)
	store.dispatch('syncCart')
	uni.showToast({ title: '已加入购物车', icon: 'success' })
	setTimeout(() => uni.switchTab({ url: '/pages/menu/menu' }), 700)
}
function goToPay(orderId) { uni.navigateTo({ url: '/pages/pay/pay?order_id=' + orderId }) }

async function cancelOrder(orderId) {
	const res = await uni.showModal({
		title: '提示', content: '确定要取消这个订单吗？',
		confirmText: '确定取消', cancelText: '再想想'
	})
	if (!res.confirm) return
	try {
		uni.showLoading({ title: '取消中...' })
		await api.cancelOrder({ orderId, reason: '用户取消' })
		uni.showToast({ title: '已取消', icon: 'success' })
		page.value = 1
		hasMore.value = true
		loadOrders()
	} catch (e) {
		uni.showToast({ title: e.message || '取消失败', icon: 'none' })
	} finally {
		uni.hideLoading()
	}
}
function goToMenu() { uni.switchTab({ url: '/pages/menu/menu' }) }
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: $bg-page;
	color: $t-primary;
}

.safe-top {
	height: env(safe-area-inset-top);
	background: $bg-page;
}

/* ═══ Header ═══ */
.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 32rpx 8rpx;
}

.header-back {
	width: 68rpx;
	height: 68rpx;
	border-radius: 50%;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .06);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	color: $t-primary;
}

.header-title {
	font-family: $font-serif;
	font-size: 36rpx;
	font-weight: 700;
	color: $c-brown;
}

.header-side {
	width: 68rpx;
}

/* ═══ Tabs ═══ */
.tabs {
	display: flex;
	gap: 10rpx;
	padding: 18rpx 32rpx 20rpx;
	background: $bg-page;
}

.tab-item {
	padding: 10rpx 26rpx;
	border-radius: $r-full;
	font-size: 23rpx;
	color: $t-secondary;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .05);

	&--active {
		background: $c-brown;
		color: #FFF8EF;
		font-weight: 600;
		box-shadow: $shadow-btn;
	}
}

/* ═══ Scroll ═══ */
.order-scroll {
	flex: 1;
	min-height: 0;
	padding: 0 32rpx calc(env(safe-area-inset-bottom) + 30rpx);
}

/* ═══ Order Card ═══ */
.order-card {
	border-radius: $r-xl;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .05);
	box-shadow: $shadow-xs;
	padding: 24rpx 26rpx;
	margin-bottom: 22rpx;
}

.order-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-bottom: 16rpx;
	border-bottom: 1rpx solid rgba(74, 52, 39, .05);
}

.order-no {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.order-no-label {
	font-size: 21rpx;
	color: $t-tertiary;
}

.order-no-value {
	font-size: 23rpx;
	font-weight: 600;
	color: $t-primary;
	letter-spacing: 1rpx;
}

.order-status {
	font-size: 22rpx;
	font-weight: 600;
	padding: 6rpx 18rpx;
	border-radius: $r-full;
	background: $bg-soft;
	color: $t-secondary;

	&.status--pending {
		background: rgba($c-terra, .12);
		color: $c-terra;
	}

	&.status--paid,
	&.status--processing {
		background: rgba($c-caramel, .14);
		color: $c-brown;
	}

	&.status--completed {
		background: rgba($c-sage, .14);
		color: #5C7C6E;
	}

	&.status--cancelled {
		background: #EFE9E2;
		color: #9A9087;
	}
}

/* ═══ Goods ═══ */
.order-goods {
	padding: 10rpx 0;
}

.goods-item {
	display: flex;
	align-items: center;
	padding: 12rpx 0;
	border-bottom: 1rpx dashed rgba(74, 52, 39, .05);

	&:last-child { border-bottom: none; }
}

.goods-img-wrap {
	width: 96rpx;
	height: 96rpx;
	border-radius: $r-lg;
	overflow: hidden;
	background: $bg-soft;
	flex-shrink: 0;
	margin-right: 18rpx;
}

.goods-image {
	width: 100%;
	height: 100%;
}

.goods-image--ph {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
}

.goods-info {
	flex: 1;
	min-width: 0;
}

.goods-name {
	font-size: 26rpx;
	font-weight: 600;
	color: $t-primary;
}

.goods-spec {
	margin-top: 4rpx;
	font-size: 21rpx;
	color: $t-tertiary;
}

.goods-right {
	text-align: right;
}

.goods-price {
	font-family: $font-serif;
	font-size: 26rpx;
	font-weight: 700;
	color: $t-primary;
}

.goods-qty {
	font-size: 21rpx;
	color: $t-tertiary;
	margin-top: 4rpx;
}

/* ═══ Footer ═══ */
.order-footer {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12rpx 0 16rpx;
	border-top: 1rpx solid rgba(74, 52, 39, .05);
}

.order-time {
	font-size: 21rpx;
	color: $t-tertiary;
}

.order-total {
	font-size: 23rpx;
	color: $t-secondary;
}

.total-amount {
	font-family: $font-serif;
	font-size: 30rpx;
	font-weight: 700;
	color: $c-terra;
	margin-left: 6rpx;
}

/* ═══ Actions ═══ */
.order-actions {
	display: flex;
	justify-content: flex-end;
	gap: 16rpx;
	padding-top: 4rpx;
}

.action-btn {
	padding: 12rpx 30rpx;
	border-radius: $r-full;
	font-size: 23rpx;
	font-weight: 600;
}

.action-btn--outline {
	border: 1rpx solid rgba(74, 52, 39, .18);
	color: $t-secondary;
	background: transparent;
}

.action-btn--primary {
	background: $c-brown;
	color: #FFF8EF;
	box-shadow: $shadow-btn;
}

/* ═══ Empty ═══ */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 160rpx;
}

.empty-emoji {
	font-size: 90rpx;
}

.empty-text {
	margin-top: 18rpx;
	font-size: 26rpx;
	color: $t-tertiary;
}

.empty-btn {
	margin-top: 32rpx;
	padding: 16rpx 56rpx;
	border-radius: $r-full;
	background: $grad-caramel;
	color: #FFF8EF;
	font-size: 26rpx;
	font-weight: 600;
	box-shadow: $shadow-btn;
}

/* ═══ Loading ═══ */
.loading {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14rpx;
	padding: 80rpx 0;
}

.loading-dot {
	width: 34rpx;
	height: 34rpx;
	border-radius: 50%;
	background: $c-caramel;
	animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% { opacity: .3; transform: scale(.8); }
	50% { opacity: 1; transform: scale(1); }
}

.loading-text {
	font-size: 22rpx;
	color: $t-tertiary;
}
</style>
