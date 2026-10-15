<template>
	<view class="page rm-page old-money">
		<view class="page-scroll">
			<!-- Store Card -->
			<view class="section-card">
				<template v-if="orderType == 'takein'">
					<view class="store-row" @tap="goMenu">
						<view class="store-pin">⌖</view>
						<view class="store-main">
							<view class="store-name">{{ $localized(storeInfo, "name") }}</view>
							<view class="store-meta" v-if="storeInfo.address">{{ $localized(storeInfo, 'address') }}</view>
							<view class="store-meta" v-else>{{ $t("堂食 · 立即用餐") }}</view>
							<view class="store-meta" v-if="store.state.tableNo">{{ $t("桌号") }} {{ $t(store.state.tableNo) }} {{ $t("号桌") }}</view>
						</view>
						<text class="store-switch">{{ $t("切换门店 →") }}</text>
					</view>
				</template>
				<template v-else>
					<view class="store-row" @click="chooseAddress">
						<view class="store-pin">⌖</view>
						<view class="store-main">
							<view class="store-name">{{ address.street }}</view>
							<view class="store-meta">
								<text>{{ address.acceptName }}</text>
								<text>{{ $t(!address.sex ? '先生' : '女士') }}</text>
								<text>{{ address.mobile }}</text>
							</view>
						</view>
						<text class="store-switch">{{ $t("切换地址 →") }}</text>
					</view>
				</template>

				<!-- 取餐方式 -->
				<view class="serve-row">
					<text class="serve-label">{{ $t("取餐方式") }}</text>
					<view class="serve-switch">
						<view class="serve-item" :class="{active: orderType == 'takein'}" @tap="switchType('takein')">{{ $t("堂食") }}</view>
						<view class="serve-item" :class="{active: orderType == 'takeout'}" @tap="switchType('takeout')">{{ $t("外带") }}</view>
					</view>
				</view>

				<template v-if="orderType == 'takein'">
					<view class="serve-row" v-if="storeInfo.name">
						<text class="serve-label">{{ $t("用餐信息") }}</text>
						<text class="serve-value">{{ $t("立即用餐") }}</text>
					</view>
				</template>
			</view>

			<!-- Cart Items -->
			<view class="section-card">
				<view class="section-title">{{ $t("商品明细") }}</view>
				<view class="cart-item" v-for="(item, index) in cart" :key="index">
					<view class="cart-item-img-wrap">
						<image v-if="item.image" :src="item.image" mode="aspectFill" class="cart-item-img"></image>
						<view v-else class="cart-item-img cart-item-img--ph"><text>🍞</text></view>
					</view>
					<view class="cart-item-main">
						<view class="cart-item-name">{{ $t($localized(item, "name")) }}</view>
						<view class="cart-item-props" v-if="item.propsText">{{ $t(item.propsText) }}</view>
						<view class="cart-item-line">
							<text class="cart-item-qty">×{{ $t(item.number) }}</text>
							<text class="cart-item-price">¥{{ $t(item.price) }}</text>
						</view>
					</view>
				</view>
				<view class="fee-row" v-if="orderType == 'takeout' && storeInfo.packingFee > 0">
					<text>{{ $t("包装费") }}</text>
					<text>￥{{ $t(Number(storeInfo.packingFee)) }}</text>
				</view>
				<view class="fee-row" v-if="orderType == 'takeout' && storeInfo.deliveryCost > 0">
					<text>{{ $t("配送费") }}</text>
					<text>￥{{ $t(Number(storeInfo.deliveryCost)) }}</text>
				</view>
			</view>

			<!-- Coupons & Gift Cards -->
			<view class="section-card">
				<view class="info-row" @click="goToPackages">
					<text class="info-label">{{ $t("热麦券") }}</text>
					<text class="info-hint">{{ $t("超值购买优惠券大礼包 →") }}</text>
				</view>
				<view class="info-row" style="border-bottom: none;">
					<text class="info-label">{{ $t("礼品卡") }}</text>
					<text class="info-hint">{{ $t("暂无可使用礼品卡") }}</text>
				</view>
			</view>

			<!-- Amount Breakdown -->
			<view class="section-card">
				<view class="section-title">{{ $t("金额明细") }}</view>
				<view class="fee-row">
					<text>{{ $t("商品金额") }}</text>
					<text>￥{{ $t(total.toFixed(2)) }}</text>
				</view>
				<view class="fee-row" v-if="orderType == 'takeout' && storeInfo.packingFee > 0">
					<text>{{ $t("包装费") }}</text>
					<text>￥{{ $t(Number(storeInfo.packingFee).toFixed(2)) }}</text>
				</view>
				<view class="fee-row" v-if="orderType == 'takeout' && storeInfo.deliveryCost > 0">
					<text>{{ $t("配送费") }}</text>
					<text>￥{{ $t(Number(storeInfo.deliveryCost).toFixed(2)) }}</text>
				</view>
				<view class="fee-row fee-row--total">
					<text>{{ $t("合计") }}</text>
					<text class="total-amount">￥{{ $t(amount) }}</text>
				</view>
			</view>

			<!-- 支付方式 -->
			<view class="section-card">
				<view class="info-row">
					<text class="info-label">{{ $t("支付方式") }}</text>
					<view class="pay-method-row">
						<view class="pay-method" :class="{active: form.payMethod == 'wechat'}" @tap="selectPayMethod('wechat')">
							<text class="pm-dot"></text>
							<text>{{ $t("微信支付") }}</text>
						</view>
						<view class="pay-method" :class="{active: form.payMethod == 'balance', dim: !balanceEnough}" @tap="selectPayMethod('balance')">
							<text class="pm-dot"></text>
							<text>{{ $t("余额（￥") }}{{ $t(Number(member.balance || 0)) }}）</text>
						</view>
					</view>
				</view>
			</view>

			<view class="section-card">
			<picker :range="localizedCutleryOptions" :value="form.cutleryCount" :disabled="!!existingOrder" @change="chooseCutlery">
					<view class="info-row"><text class="info-label">{{ $t("餐具") }}</text><text class="info-hint">{{ $t(cutleryOptions[form.cutleryCount] || '无需餐具') }} →</text></view>
				</picker>
			</view>

			<!-- Remark -->
			<view class="section-card" @click="goToRemark">
				<view class="info-row" style="border-bottom: none;">
					<text class="info-label">{{ $t("备注") }}</text>
					<text class="remark-value">{{ form.remark || $t('点击填写备注') }}</text>
					<text class="remark-arrow">→</text>
				</view>
			</view>

			<view class="bottom-spacer"></view>
		</view>

		<!-- Pay Bar -->
		<view class="pay-bar">
			<view class="pay-bar-left">
				<text class="pay-bar-label">{{ $t("合计") }}</text>
				<text class="pay-bar-amount">¥{{ $t(amount) }}</text>
			</view>
			<view class="pay-bar-btn" @tap="submit">{{ $t("提交订单") }}</view>
		</view>

		<!-- Address Confirm Modal -->
		<modal :show="ensureAddressModalVisible" custom :mask-closable="false" width="90%">
			<view class="modal-body">
				<view class="modal-close" @tap="ensureAddressModalVisible=false">
					<image src="/static/images/pay/close.png" style="width: 40rpx; height: 40rpx;"></image>
				</view>
				<view class="modal-title">{{ $t("请再次确认下单地址") }}</view>
				<view class="modal-addr-name">
					<text>{{ address.acceptName }} {{ $t(address.sex ? '女士' : '先生') }}</text>
					<text>{{ address.mobile }}</text>
				</view>
				<view class="modal-addr-detail">
					<text>{{ address.street + (address.doorNumber || '') }}</text>
					<button type="primary" size="mini" plain class="modal-change-btn">{{ $t("修改地址") }}</button>
				</view>
				<button type="primary" class="modal-pay-btn" @tap="pay">{{ $t("确认并付款") }}</button>
			</view>
		</modal>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import { api, env } from '@/api'
import { t } from '@/locale'
import { getCheckoutIntent, rememberCheckoutOrder, clearCheckoutIntent } from '@/common/checkout-intent'
import modal from '@/components/modal/modal.vue'

const store = useStore()

const cart = ref([])
const form = ref({ remark: '', payMethod: 'wechat', cutleryCount: Number(uni.getStorageSync('remai_cutlery_count')) || 0 })
const cutleryOptions = ['无需餐具', '1 份', '2 份', '3 份', '4 份', '5 份']
const localizedCutleryOptions = computed(() => cutleryOptions.map(option => t(option)))
function chooseCutlery(e) {
	form.value.cutleryCount = Number(e.detail.value)
	uni.setStorageSync('remai_cutlery_count', form.value.cutleryCount)
}
const ensureAddressModalVisible = ref(false)
const paying = ref(false)
const currentOrderId = ref('')
const checkoutKey = ref('')
const existingOrder = ref(null)
const member = ref({ balance: 0, points: 0 })

const orderType = computed(() => existingOrder.value ? existingOrder.value.type : store.state.orderType)
const address = computed(() => store.state.address || {})
const storeInfo = computed(() => store.state.store || {})
const token = computed(() => store.state.token)

const total = computed(() => cart.value.reduce((acc, cur) => acc + cur.number * cur.price, 0))
const amount = computed(() => {
	if (existingOrder.value) return Number(existingOrder.value.totalPrice).toFixed(2)
	let t = cart.value.reduce((acc, cur) => acc + cur.number * cur.price, 0)
	if (orderType.value === 'takeout' && storeInfo.value.packingFee) t += Number(storeInfo.value.packingFee)
	if (orderType.value === 'takeout' && storeInfo.value.deliveryCost) t += Number(storeInfo.value.deliveryCost)
	return t.toFixed(2)
})
const balanceEnough = computed(() => Number(member.value.balance || 0) >= Number(amount.value))

onLoad((option) => {
	cart.value = uni.getStorageSync('cart') || []
	if (option && option.order_id) {
		currentOrderId.value = option.order_id
		loadExistingOrder(option.order_id)
	}
	if (option && option.remark) form.value.remark = option.remark
	loadMemberInfo()
})

async function loadExistingOrder(orderId) {
	try {
		const order = await api.getOrderDetail({ orderId })
		applyExistingOrder(order)
	} catch (error) {
		cart.value = []
		uni.showToast({ title: error.message || '订单加载失败', icon: 'none' })
	}
}

function applyExistingOrder(order) {
	existingOrder.value = order
	cart.value = (order.goodsList || []).map(item => ({ id: item.goodsId, name: item.goodsName, nameEn: item.goodsNameEn || '', number: item.num, price: item.price, image: item.image, propsText: item.property }))
	form.value.cutleryCount = order.cutleryCount || 0
	form.value.remark = order.remark || ''
}

async function loadMemberInfo() {
	if (!token.value) return
	try {
		const data = await api.getMember()
		if (data) member.value = data
	} catch (e) {
		console.error('加载会员信息失败', e)
	}
}

function goBack() { uni.navigateBack() }
function goMenu() { uni.switchTab({ url: '/pages/menu/menu' }) }
function switchType(type) { store.commit('SET_ORDER_TYPE', type) }
function goToRemark() { uni.navigateTo({ url: '/pages/remark/remark?remark=' + form.value.remark }) }
function chooseAddress() { uni.navigateTo({ url: '/pages/address/address?is_choose=true&scene=pay' }) }
function goToPackages() { uni.navigateTo({ url: '/pages/packages/index' }) }

function selectPayMethod(method) {
	if (method === 'balance' && !balanceEnough.value) {
		uni.showToast({ title: '余额不足', icon: 'none' })
		return
	}
	form.value.payMethod = method
}

function submit() {
	if (paying.value) return
	if (!token.value) {
		uni.showModal({
			title: '提示', content: '请先登录后再下单', confirmText: '去登录',
			success: (res) => { if (res.confirm) uni.navigateTo({ url: '/pages/login/login' }) }
		})
		return
	}
	if (!cart.value || cart.value.length === 0) {
		uni.showToast({ title: '购物车是空的', icon: 'none' })
		return
	}
	if (orderType.value === 'takeout') ensureAddressModalVisible.value = true
	else pay()
}

async function createOrder() {
	const goodsList = cart.value.map(item => ({
		goodsId: item.id || item.goodsId,
		goodsName: item.name,
		price: item.price,
		num: item.number,
		image: item.image || '',
		property: item.propsText || ''
	}))
	const orderData = {
		type: orderType.value,
		tableNo: orderType.value === 'takein' ? (store.state.tableNo || '') : '',
		totalPrice: amount.value,
		packingFee: orderType.value === 'takeout' ? (storeInfo.value.packingFee || 0) : 0,
		deliveryFee: orderType.value === 'takeout' ? (storeInfo.value.deliveryCost || 0) : 0,
		addressId: orderType.value === 'takeout' ? (address.value && address.value._id) : '',
		peopleNumber: orderType.value === 'takein' ? 1 : 0,
		qrcodeId: '',
		remark: form.value.remark,
		cutleryCount: form.value.cutleryCount,
		goodsList
	}
	const intent = getCheckoutIntent(orderData)
	checkoutKey.value = intent.key
	const result = await api.createOrder({ ...orderData, requestKey: intent.key })
	const id = result && (result.orderId || result._id)
	if (!id) throw new Error('订单加载失败')
	rememberCheckoutOrder(intent.key, id)
	return result
}

async function wechatPay(orderId) {
	const payParams = await api.createPayment({ orderId })
	return new Promise((resolve, reject) => {
		uni.requestPayment({
			provider: 'wxpay',
			timeStamp: payParams.timeStamp,
			nonceStr: payParams.nonceStr,
			package: payParams.package,
			signType: payParams.signType,
			paySign: payParams.paySign,
			success: () => resolve(true),
			fail: (err) => {
				const msg = (err && err.errMsg) || ''
				if (msg.indexOf('cancel') > -1) {
					const cancelErr = new Error('已取消支付')
					cancelErr.canceled = true
					reject(cancelErr)
				} else {
					reject(new Error(msg || '支付失败'))
				}
			}
		})
	})
}

// 微信支付回调有延迟，支付成功后轮询订单状态兜底确认
async function confirmOrderPaid(orderId, maxTries = 12) {
	for (let i = 0; i < maxTries; i++) {
		try {
			const status = await api.queryPayStatus({ orderId })
			if (status && ['paid', 'processing', 'completed'].includes(status.status)) return true
		} catch (e) { /* 单次查询失败继续轮询 */ }
		await new Promise(resolve => setTimeout(resolve, 1000))
	}
	return false
}

async function balancePay(orderId) {
	return await api.balancePay({ orderId })
}

async function pay() {
	if (paying.value) return
	paying.value = true
	uni.showLoading({ title: '正在下单...', mask: true })
	try {
		if (!currentOrderId.value) {
			const order = await createOrder()
			currentOrderId.value = order.orderId || order._id
			if (order.status && order.status !== 'pending') {
				clearCheckoutIntent({ requestKey: checkoutKey.value })
				uni.navigateTo({ url: `/pages/orders/detail?id=${currentOrderId.value}` })
				throw new Error('订单已处理，请刷新订单状态')
			}
		}

		// Confirm what the server will actually charge, including resumed/replayed orders.
		const displayedAmount = Number(amount.value)
		const pendingOrder = await api.getOrderDetail({ orderId: currentOrderId.value })
		if (!pendingOrder || pendingOrder.status !== 'pending') throw new Error('订单已处理，请刷新订单状态')
		const serverAmount = Number(pendingOrder.totalPrice)
		if (!Number.isFinite(serverAmount) || serverAmount < 0) throw new Error('订单金额无效')
		applyExistingOrder(pendingOrder)
		if (Math.round(displayedAmount * 100) !== Math.round(serverAmount * 100)) {
			uni.hideLoading()
			const confirmation = await uni.showModal({
				title: '订单金额已更新',
				content: t('门店确认金额为 ¥{amount}，请核对后继续。', { amount: amount.value })
			})
			if (!confirmation.confirm) return
			uni.showLoading({ title: '正在下单...', mask: true })
		}

		let paid = false
		if (form.value.payMethod === 'balance') {
			await balancePay(currentOrderId.value)
			paid = true
		} else {
			// #ifdef MP-WEIXIN
			await wechatPay(currentOrderId.value)
			paid = true
			// #endif
			// #ifdef H5
			throw new Error('请在微信小程序中完成支付')
			// #endif
		}

		// 微信支付成功后确认订单状态（回调延迟兜底）
		if (paid && form.value.payMethod !== 'balance') {
			uni.showLoading({ title: '支付成功，正在确认订单...', mask: true })
			const confirmed = await confirmOrderPaid(currentOrderId.value)
			uni.hideLoading()
			if (!confirmed) {
				uni.showModal({
					title: '支付确认中',
					content: '尚未收到服务端支付确认，请在订单中查看最新状态，请勿重复下单。',
					showCancel: false
				})
				uni.navigateTo({ url: `/pages/orders/detail?id=${currentOrderId.value}` })
				return
			}
		}

		const orderDetail = await api.getOrderDetail({ orderId: currentOrderId.value })
		if (orderDetail) store.commit('SET_ORDER', orderDetail)
		clearCheckoutIntent({ requestKey: checkoutKey.value, orderId: currentOrderId.value })

		store.commit('REMOVE_CART')
		await store.dispatch('syncCart')
		uni.hideLoading()
		uni.showToast({ title: '支付成功', icon: 'success' })
		setTimeout(() => uni.reLaunch({ url: '/pages/take-foods/take-foods' }), 1000)
	} catch (error) {
		console.error('支付失败', error)
		uni.hideLoading()
		if (error && error.canceled) {
			// 用户主动取消：保留购物车，订单保留为待支付，可在「我的订单」中继续支付
			uni.showToast({ title: '已取消支付，可在我的订单中继续支付', icon: 'none', duration: 2000 })
		} else {
			uni.showToast({ title: error.message || '支付失败，请重试', icon: 'none', duration: 2000 })
		}
	} finally {
		paying.value = false
	}
}
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
	padding: 24rpx 32rpx 16rpx;
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

.page-scroll {
	flex: 1;
	min-height: 0;
	padding: 0 32rpx;
}

/* ═══ Section Card ═══ */
.section-card {
	border-radius: $r-xl;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .05);
	box-shadow: $shadow-xs;
	padding: 24rpx 26rpx;
	margin-bottom: 22rpx;
}

.section-title {
	font-size: 28rpx;
	font-weight: 700;
	color: $t-primary;
	margin-bottom: 14rpx;
}

/* ═══ Store ═══ */
.store-row {
	display: flex;
	align-items: center;
	padding-bottom: 18rpx;
	border-bottom: 1rpx solid $c-divider;
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
	margin-top: 6rpx;
	font-size: 20rpx;
	color: $t-tertiary;
}

.store-switch {
	flex-shrink: 0;
	font-size: 22rpx;
	color: $c-caramel;
}

/* ═══ Serve switch ═══ */
.serve-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 18rpx;
}

.serve-label {
	font-size: 24rpx;
	color: $t-secondary;
}

.serve-value {
	font-size: 24rpx;
	color: $t-primary;
}

.serve-switch {
	display: flex;
	background: $bg-soft;
	border-radius: $r-full;
	padding: 4rpx;
}

.serve-item {
	padding: 8rpx 26rpx;
	font-size: 22rpx;
	color: $t-secondary;
	border-radius: $r-full;
	transition: all .2s;

	&.active {
		background: $c-brown;
		color: #FFF8EF;
		font-weight: 600;
	}
}

/* ═══ Cart items ═══ */
.cart-item {
	display: flex;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid rgba(74, 52, 39, .05);

	&:last-child { border-bottom: none; }
}

.cart-item-img-wrap {
	width: 110rpx;
	height: 110rpx;
	border-radius: $r-lg;
	overflow: hidden;
	background: $bg-soft;
	flex-shrink: 0;
	margin-right: 18rpx;
}

.cart-item-img {
	width: 100%;
	height: 100%;
}

.cart-item-img--ph {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 44rpx;
}

.cart-item-main {
	flex: 1;
	min-width: 0;
}

.cart-item-name {
	font-size: 27rpx;
	font-weight: 600;
	color: $t-primary;
}

.cart-item-props {
	margin-top: 4rpx;
	font-size: 21rpx;
	color: $t-tertiary;
}

.cart-item-line {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 8rpx;
}

.cart-item-qty {
	font-size: 22rpx;
	color: $t-tertiary;
}

.cart-item-price {
	font-family: $font-serif;
	font-size: 28rpx;
	font-weight: 700;
	color: $c-terra;
}

/* ═══ Fee rows ═══ */
.fee-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10rpx 0;
	font-size: 24rpx;
	color: $t-secondary;
}

.fee-row--total {
	margin-top: 6rpx;
	padding-top: 16rpx;
	border-top: 1rpx dashed $c-divider;
	font-weight: 700;
	color: $t-primary;
	font-size: 26rpx;
}

.total-amount {
	font-family: $font-serif;
	font-size: 36rpx;
	font-weight: 700;
	color: $c-terra;
}

/* ═══ Info rows ═══ */
.info-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18rpx 0;
	border-bottom: 1rpx solid $c-divider;
}

.info-label {
	font-size: 26rpx;
	font-weight: 600;
	color: $t-primary;
}

.info-hint {
	font-size: 22rpx;
	color: $t-tertiary;
}

.pay-method-row {
	display: flex;
	gap: 20rpx;
}

.pay-method {
	display: flex;
	align-items: center;
	gap: 10rpx;
	padding: 10rpx 22rpx;
	border-radius: $r-full;
	background: $bg-soft;
	font-size: 23rpx;
	color: $t-secondary;
	border: 2rpx solid transparent;

	&.active {
		background: rgba($c-caramel, .12);
		color: $c-brown;
		border-color: $c-caramel;
		font-weight: 600;
	}

	&.dim {
		opacity: .55;
	}
}

.pm-dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	border: 2rpx solid $t-tertiary;
	background: transparent;
}

.pay-method.active .pm-dot {
	border-color: $c-caramel;
	background: $c-caramel;
}

.remark-value {
	font-size: 22rpx;
	color: $t-secondary;
	max-width: 380rpx;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.remark-arrow {
	font-size: 26rpx;
	color: $t-tertiary;
	margin-left: 10rpx;
}

.bottom-spacer {
	height: 40rpx;
}

/* ═══ Pay bar ═══ */
.pay-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18rpx 32rpx calc(env(safe-area-inset-bottom) + 18rpx);
	background: $c-ivory;
	border-top: 1rpx solid rgba(74, 52, 39, .06);
}

.pay-bar-left {
	display: flex;
	align-items: baseline;
	gap: 12rpx;
}

.pay-bar-label {
	font-size: 24rpx;
	color: $t-secondary;
}

.pay-bar-amount {
	font-family: $font-serif;
	font-size: 40rpx;
	font-weight: 700;
	color: $c-terra;
}

.pay-bar-btn {
	padding: 20rpx 64rpx;
	border-radius: $r-full;
	background: $grad-caramel;
	color: #FFF8EF;
	font-size: 28rpx;
	font-weight: 600;
	box-shadow: $shadow-btn;
	letter-spacing: 2rpx;
}

/* ═══ Modal ═══ */
.modal-body {
	padding: 32rpx;
	position: relative;
}

.modal-close {
	position: absolute;
	top: 20rpx;
	right: 20rpx;
	z-index: 2;
}

.modal-title {
	font-family: $font-serif;
	font-size: 34rpx;
	font-weight: 700;
	color: $t-primary;
	margin-bottom: 24rpx;
}

.modal-addr-name {
	font-size: 26rpx;
	font-weight: 600;
	color: $t-primary;
	display: flex;
	gap: 16rpx;
}

.modal-addr-detail {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 12rpx;
	font-size: 24rpx;
	color: $t-secondary;
}

.modal-change-btn {
	font-size: 22rpx !important;
	color: $c-caramel !important;
	border-color: $c-caramel !important;
	background: transparent !important;
	line-height: 1.6;
}

.modal-pay-btn {
	margin-top: 28rpx;
	background: $grad-caramel !important;
	color: #FFF8EF !important;
	border-radius: $r-full !important;
	font-size: 28rpx;
	font-weight: 600;
	border: none !important;
}
</style>
