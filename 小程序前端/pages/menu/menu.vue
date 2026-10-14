<template>
	<view class="container rm-page old-money">
		<!-- 顶部安全区 -->
		<view class="safe-top"></view>

		<!-- 异步四态 -->
		<view v-if="status === 'loading'" class="state-wrap">
			<loading-bread :size="180" />
			<view class="state-text">正在准备菜单…</view>
		</view>

		<view v-else-if="status === 'error'" class="state-wrap">
			<view class="state-emoji">🍞</view>
			<view class="state-text">菜单加载失败</view>
			<button class="state-btn" @tap="init">重新加载</button>
		</view>

		<view v-else-if="status === 'empty'" class="state-wrap">
			<view class="state-emoji">🥐</view>
			<view class="state-text">暂无商品</view>
		</view>

		<view v-else class="main">
			<!-- Header -->
			<view class="header">
				<view class="header-title">
					<view class="header-cn">点餐</view>
					<view class="header-sub">今天想吃什么？</view>
				</view>
				<view class="header-switch">
					<view class="switch-item" :class="{active: orderType == 'takein'}" @tap="setOrderType('takein')">堂食</view>
					<view class="switch-item" :class="{active: orderType == 'takeout'}" @tap="takout">外带</view>
				</view>
			</view>

			<!-- 门店行 -->
			<view class="store-line" v-if="orderType == 'takein'">
				<text class="store-name">{{ storeInfo.name || '热麦 · 万象城店' }}</text>
				<text class="store-distance" v-if="storeInfo.distanceText">距您 {{ storeInfo.distanceText }}</text>
			</view>
			<view class="store-line" v-else @tap="takout">
				<text class="store-name">{{ address.street || '选择配送地址' }}</text>
				<text class="store-distance">由{{ storeInfo.name || '热麦' }}配送</text>
			</view>

			<!-- 券包入口 -->
			<view class="promo-bar" @tap="goPackages">
				<text class="promo-text">甜蜜超值券包限时活动，立即抢购</text>
				<text class="promo-arrow">→</text>
			</view>

			<!-- 搜索条 -->
			<view class="search-bar">
				<text class="search-icon">⌕</text>
				<input class="search-input" placeholder="搜索你想吃的美食..." placeholder-class="search-placeholder" :value="keyword" @input="onSearch" />
			</view>

			<!-- 精选美味（图纸板块） -->
			<view class="feature-banner" @tap="switchCate('all')">
				<view class="feature-copy">
					<view class="feature-title">精选美味</view>
					<view class="feature-desc">把自然的味道，做成日常的幸福</view>
					<view class="feature-btn">
						<text>查看全部</text>
						<text class="feature-arrow">→</text>
					</view>
				</view>
				<view class="feature-art">
					<view class="feature-ring"></view>
					<image src="/static/images/home/goods-croissant.jpg" class="feature-img" mode="aspectFill"></image>
				</view>
			</view>

			<!-- 横排热门分类 -->
			<scroll-view class="cate-scroll" scroll-x :show-scrollbar="false">
				<view class="cate-row">
					<view
						class="cate-tab"
						:class="{active: currentTab === 'all'}"
						@tap="switchCate('all')"
					>全部</view>
					<view
						class="cate-tab"
						:class="{active: currentTab === item.id}"
						v-for="item in hotCates"
						:key="item.id"
						@tap="switchCate(item.id)"
					>{{ item.name }}</view>
				</view>
			</scroll-view>

			<!-- 左右分栏：左竖排分类 + 右商品列表 -->
			<view class="body">
				<!-- 左：竖排分类 -->
				<scroll-view class="side-cates" scroll-y>
					<view
						class="side-cate"
						:class="{active: currentTab === item.id}"
						v-for="item in goods"
						:key="item.id"
						@tap="switchCate(item.id)"
					>
						<text class="side-cate-text">{{ item.name }}</text>
					</view>
				</scroll-view>

				<!-- 右：商品列表 -->
				<scroll-view class="goods-scroll" scroll-y>
					<view class="goods-list">
						<view class="good-card" v-for="(good, idx) in displayGoods" :key="good.id" @tap="showGoodDetailModal(good)">
							<view class="good-tag" v-if="idx === 0">招牌</view>
							<view class="good-img-wrap">
								<image v-if="good.image" :src="good.image" mode="aspectFill" class="good-img"></image>
								<view v-else class="good-img good-img--ph"><text>{{ good.emoji || '🍞' }}</text></view>
							</view>
							<view class="good-info">
								<view class="good-name">{{ good.name }}</view>
								<view class="good-desc">{{ good.content || good.description || '' }}</view>
								<view class="good-bottom">
									<view class="good-price">
										<text class="good-price-symbol">¥</text>
										<text class="good-price-num">{{ good.price }}</text>
									</view>
									<view class="qty-control">
										<template v-if="goodCartNum(good.id) > 0">
											<view class="qty-btn" @tap.stop="handleReduceFromCart(good)">−</view>
											<text class="qty-num">{{ goodCartNum(good.id) }}</text>
										</template>
										<view class="qty-add" @tap.stop="handleAddToCart(good, 1)">＋</view>
									</view>
								</view>
							</view>
						</view>
						<view class="list-end" v-if="displayGoods.length">
							<text>— 每日少量出炉 · Freshly baked —</text>
						</view>
					</view>
				</scroll-view>
			</view>

			<!-- 底部购物车条 -->
			<view class="cart-bar" v-if="cart.length > 0">
				<view class="cart-icon-wrap" @tap="openCartPopup">
					<image src="/static/images/menu/cart.png" class="cart-icon"></image>
					<view class="cart-badge">{{ cartGoodsNumber }}</view>
				</view>
				<view class="cart-price">
					<text class="cart-price-symbol">¥</text>
					<text class="cart-price-num">{{ cartGoodsPrice.toFixed(2) }}</text>
				</view>
				<button type="primary" class="pay-btn" @tap="toPay" :disabled="disabledPay">
					{{ disabledPay ? `差${spread}元起送` : '去结算' }}
				</button>
			</view>
		</view>

		<!-- 商品详情弹窗 -->
		<modal :show="goodDetailModalVisible" class="good-detail-modal" color="#5A5B5C" width="90%" custom padding="0rpx" radius="24rpx">
			<view class="detail-cover">
				<image v-if="good.image" :src="good.image" class="detail-cover-img" mode="aspectFill"></image>
				<view v-else class="detail-cover-img detail-cover-img--ph">
					<text>{{ good.emoji || '🍞' }}</text>
				</view>
				<view class="detail-cover-actions">
					<image src="/static/images/menu/close.png" @tap="closeGoodDetailModal"></image>
				</view>
			</view>
			<scroll-view class="detail-body" scroll-y>
				<view class="detail-wrapper">
					<view class="detail-basic">
						<view class="detail-name">{{ good.name }}</view>
						<view class="detail-desc">{{ good.content }}</view>
					</view>
					<view class="detail-props" v-if="good.useProperty">
						<view class="detail-props-title">🎂 定制你的蛋糕</view>
						<view class="prop-group" v-for="(propItem, index) in good.property" :key="index">
							<view class="prop-label">
								<text class="prop-label-name">{{ propItem.name }}</text>
								<text class="prop-label-desc" v-if="propItem.desc">({{ propItem.desc }})</text>
							</view>
							<view class="prop-values">
								<view class="prop-value" v-for="(value, key) in propItem.values" :key="key"
									:class="{'selected': value.isDefault}" @tap="changePropertyDefault(index, key)">
									{{ value.value }}
								</view>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
			<view class="detail-action">
				<view class="detail-action-left">
					<view class="detail-action-price">￥{{ good.price }}</view>
					<view class="detail-action-props" v-if="getGoodSelectedProps(good)">{{ getGoodSelectedProps(good) }}</view>
				</view>
				<view class="detail-action-stepper">
					<button type="default" plain class="btn reduce-btn" size="mini" hover-class="none" @tap="handlePropertyReduce">
						<image src="/static/images/icon/iconsami-select.png" class="step-ico" mode="aspectFit"></image>
					</button>
					<view class="stepper-num">{{ good.number }}</view>
					<button type="primary" class="btn add-btn" size="mini" hover-class="none" @tap="handlePropertyAdd">
						<image src="/static/images/icon/iconadd-select-w.png" class="step-ico" mode="aspectFit"></image>
					</button>
				</view>
			</view>
			<view class="detail-add-btn" @tap="handleAddToCartInModal">
				<text>加入购物车</text>
			</view>
		</modal>

		<!-- 购物车弹层（按图纸：商品行 + 会员优惠提示 + 合计 + 去结算） -->
		<popup-layer direction="top" :show-pop="cartPopupVisible" class="cart-popup">
			<template #content>
				<view class="cart-popup-head">
					<text class="cart-popup-title">购物车</text>
					<text class="cart-popup-clear" @tap="handleCartClear">清空</text>
				</view>
				<scroll-view class="cart-popup-list" scroll-y>
					<view class="cart-popup-wrapper">
						<view class="cart-popup-item" v-for="(item, index) in cart" :key="index">
							<view class="cart-popup-item-left">
								<view class="cart-item-name">{{ item.name }}</view>
								<view class="cart-item-props" v-if="item.propsText">{{ item.propsText }}</view>
							</view>
							<view class="cart-popup-item-center">
								<text>¥{{ item.price }}</text>
							</view>
							<view class="cart-popup-item-right">
								<button type="default" plain size="mini" class="btn reduce-btn" hover-class="none" @tap="handleCartItemReduce(index)">
									<image src="/static/images/icon/iconsami-select.png" class="step-ico" mode="aspectFit"></image>
								</button>
								<view class="stepper-num">{{ item.number }}</view>
								<button type="primary" class="btn add-btn" size="mini" hover-class="none" @tap="handleCartItemAdd(index)">
									<image src="/static/images/icon/iconadd-select-w.png" class="step-ico" mode="aspectFit"></image>
								</button>
							</view>
						</view>
						<view class="cart-popup-item" v-if="orderType == 'takeout' && storeInfo.packingFee">
							<view class="cart-popup-item-left">
								<view class="cart-item-name">包装费</view>
							</view>
							<view class="cart-popup-item-center">
								<text>￥{{ Number(storeInfo.packingFee) }}</text>
							</view>
							<view class="cart-popup-item-right invisible">
								<view class="stepper-num">1</view>
							</view>
						</view>
						<view class="cart-popup-tip">以确认订单金额为准</view>
					</view>
				</scroll-view>
				<view class="cart-popup-foot">
					<view class="cart-popup-total">
						<text class="total-label">合计</text>
						<text class="total-amount">¥{{ cartGoodsPrice.toFixed(2) }}</text>
					</view>
					<view class="total-go" @tap="toPay">去结算</view>
				</view>
			</template>
		</popup-layer>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import request, { api } from '@/api'
import modal from '@/components/modal/modal.vue'
import popupLayer from '@/components/popup-layer/popup-layer.vue'
import LoadingBread from '@/components/loading-bread.vue'

const store = useStore()

const goods = ref([])
const ads = ref([])
const status = ref('loading') // loading | error | empty | success
const cart = ref([])
const goodDetailModalVisible = ref(false)
const good = ref({})
const category = ref({})
const cartPopupVisible = ref(false)
const keyword = ref('')
const currentTab = ref('all')

// 顶部横排热门分类：全部 + 前 4 个
const hotCates = computed(() => goods.value.slice(0, 4))

// 来自全局 store
const orderType = computed(() => store.state.orderType)
const address = computed(() => store.state.address || {})
const storeInfo = computed(() => store.state.store || {})
const token = computed(() => store.state.token)

const cartGoodsNumber = computed(() => cart.value.reduce((acc, cur) => acc + cur.number, 0))
const cartGoodsPrice = computed(() => cart.value.reduce((acc, cur) => acc + cur.number * cur.price, 0))
const disabledPay = computed(() => orderType.value === 'takeout' && cartGoodsPrice.value < Number(storeInfo.value.minPrice || 0))
const spread = computed(() => {
	if (orderType.value !== 'takeout') return 0
	return Number((storeInfo.value.minPrice - cartGoodsPrice.value).toFixed(2))
})

// 展示商品：全部/分类过滤 + 关键词过滤
const displayGoods = computed(() => {
	let list = []
	if (currentTab.value === 'all') {
		for (const c of goods.value) {
			if (c.goodsList && c.goodsList.length) list.push(...c.goodsList)
		}
	} else {
		const cate = goods.value.find(c => c.id === currentTab.value)
		list = (cate && cate.goodsList) || []
	}
	const kw = keyword.value.trim()
	if (kw) {
		list = list.filter(g => (g.name || '').includes(kw) || (g.content || '').includes(kw))
	}
	return list
})

function goodCartNum(id) {
	return cart.value.reduce((acc, cur) => cur.id === id ? acc + cur.number : acc, 0)
}

onLoad(async () => { await init() })

// 云端占位图（picsum）在前端映射为本地蛋糕素材，保证内容与蛋糕店定位匹配
const LOCAL_IMG_BY_CATE = {
	'招牌热麦': '/static/images/home/goods-chicken-cheese.jpg',
	'特调饮品': '/static/images/home/hero-strawberry.jpg',
	'小食配饮': '/static/images/home/goods-croissant.jpg',
	'新品尝鲜': '/static/images/home/goods-strawberry-drink.jpg'
}

function isPlaceholderImg(url) {
	return !url || /picsum\.photos/.test(url) || /^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(url)
}

function normalizeImages(list) {
	if (!Array.isArray(list)) return list
	for (const c of list) {
		const local = LOCAL_IMG_BY_CATE[c.name]
		if (!local) continue
		for (const g of (c.goodsList || [])) {
			if (isPlaceholderImg(g.image)) g.image = local
		}
	}
	return list
}

async function init() {
	status.value = 'loading'
	try {
		await store.dispatch('getStore')
		const [menu, bannerList] = await Promise.all([
			request('goods'),
			api.getBanners().catch(() => [])
		])
		goods.value = normalizeImages(Array.isArray(menu) ? menu : [])
		ads.value = (bannerList || []).map((b, i) => {
			if (isPlaceholderImg(b.image)) {
				b.image = ['/static/images/home/hero-strawberry.jpg', '/static/images/home/goods-croissant.jpg', '/static/images/home/goods-chicken-cheese.jpg'][i % 3]
			}
			return b
		}).filter(b => b.isShow !== false).slice(0, 5)
		status.value = goods.value.length ? 'success' : 'empty'
		cart.value = uni.getStorageSync('cart') || []
	} catch (e) {
		console.error('[menu] load failed', e)
		status.value = 'error'
	}
}

function onSearch(e) { keyword.value = e.detail.value }
function switchCate(id) { currentTab.value = id }
function setOrderType(type) { store.commit('SET_ORDER_TYPE', type) }

function takout() {
	if (orderType.value === 'takeout') return
	uni.navigateTo({ url: '/pages/address/address?is_choose=true' })
}

function goPackages() { uni.navigateTo({ url: '/pages/packages/index' }) }

function persistCart() {
	store.commit('SET_CART', JSON.parse(JSON.stringify(cart.value)))
	store.dispatch('syncCart')
}

function handleAddToCart(goodData, num) {
	const index = cart.value.findIndex(item => {
		if (goodData.useProperty) return item.id === goodData.id && item.propsText === goodData.propsText
		return item.id === goodData.id
	})
	if (index > -1) {
		cart.value[index].number += num
	} else {
		cart.value.push({
			id: goodData.id,
			cateId: category.value.id || '',
			name: goodData.name,
			price: goodData.price,
			number: num,
			image: goodData.image,
			useProperty: goodData.useProperty,
			propsText: goodData.propsText,
			props: goodData.props
		})
	}
	persistCart()
}

function handleReduceFromCart(goodData) {
	const index = cart.value.findIndex(c => c.id === goodData.id)
	if (index === -1) return
	cart.value[index].number -= 1
	if (cart.value[index].number <= 0) cart.value.splice(index, 1)
	persistCart()
}

function showGoodDetailModal(goodData) {
	good.value = JSON.parse(JSON.stringify({ ...goodData, number: 1 }))
	const cate = goods.value.find(c => c.goodsList && c.goodsList.some(g => g.id === goodData.id))
	category.value = cate ? JSON.parse(JSON.stringify(cate)) : {}
	goodDetailModalVisible.value = true
}

function closeGoodDetailModal() {
	goodDetailModalVisible.value = false
	category.value = {}
	good.value = {}
}

function changePropertyDefault(index, key) {
	good.value.property[index].values.forEach(v => { v.isDefault = 0 })
	good.value.property[index].values[key].isDefault = 1
	good.value.number = 1
}

function getGoodSelectedProps(g, type = 'text') {
	if (g.useProperty) {
		const props = []
		;(g.property || []).forEach(({ values }) => {
			values.forEach(value => { if (value.isDefault) props.push(type === 'text' ? value.value : value.id) })
		})
		return type === 'text' ? props.join('，') : props
	}
	return ''
}

function handlePropertyAdd() { good.value.number += 1 }
function handlePropertyReduce() { if (good.value.number === 1) return; good.value.number -= 1 }

function handleAddToCartInModal() {
	const product = Object.assign({}, good.value, {
		propsText: getGoodSelectedProps(good.value),
		props: getGoodSelectedProps(good.value, 'id')
	})
	handleAddToCart(product, good.value.number)
	closeGoodDetailModal()
}

function openCartPopup() { cartPopupVisible.value = !cartPopupVisible.value }

function handleCartClear() {
	uni.showModal({
		title: '提示',
		content: '确定清空购物车么',
		success: ({ confirm }) => {
			if (confirm) {
				cartPopupVisible.value = false
				cart.value = []
				persistCart()
			}
		}
	})
}

function handleCartItemAdd(index) { cart.value[index].number += 1; persistCart() }
function handleCartItemReduce(index) {
	if (cart.value[index].number === 1) {
		cart.value.splice(index, 1)
	} else {
		cart.value[index].number -= 1
	}
	if (!cart.value.length) cartPopupVisible.value = false
	persistCart()
}

function toPay() {
	if (!token.value) {
		uni.navigateTo({ url: '/pages/login/login' })
		return
	}
	store.commit('SET_CART', JSON.parse(JSON.stringify(cart.value)))
	uni.navigateTo({ url: '/pages/pay/pay' })
}
</script>

<style lang="scss" scoped>
.container {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: $bg-page;
	color: $t-primary;
}

.safe-top {
	height: env(safe-area-inset-top);
	background: $bg-page;
}

/* ═══ 四态 ═══ */
.state-wrap {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 20rpx;
}

.state-emoji {
	font-size: 88rpx;
}

.state-text {
	font-size: 26rpx;
	color: $t-tertiary;
}

.state-btn {
	margin-top: 12rpx;
	padding: 14rpx 48rpx;
	border-radius: $r-full;
	background: $c-brown;
	color: #FFF8EF;
	font-size: 24rpx;
	border: none;
	line-height: 1.4;

	&::after { border: none; }
}

/* ═══ Main ═══ */
.main {
	flex: 1;
	min-height: 0;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	padding-bottom: calc(env(safe-area-inset-bottom) + 24rpx);
}

/* ═══ Header ═══ */
.header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 32rpx 8rpx;
}

.header-cn {
	font-family: $font-serif;
	font-size: 44rpx;
	font-weight: 700;
	color: $c-brown;
}

.header-sub {
	margin-top: 4rpx;
	font-size: 22rpx;
	color: $t-tertiary;
	letter-spacing: 1rpx;
}

.header-switch {
	display: flex;
	background: $bg-soft;
	border-radius: $r-full;
	padding: 4rpx;
}

.switch-item {
	padding: 10rpx 28rpx;
	font-size: 22rpx;
	color: $t-secondary;
	border-radius: $r-full;
	transition: all .2s;

	&.active {
		background: $c-brown;
		color: #FFF8EF;
		font-weight: 600;
		box-shadow: $shadow-btn;
	}
}

/* ═══ Store line ═══ */
.store-line {
	display: flex;
	align-items: center;
	padding: 10rpx 32rpx;
	gap: 14rpx;
}

.store-name {
	font-size: 24rpx;
	font-weight: 600;
	color: $t-primary;
}

.store-distance {
	font-size: 20rpx;
	color: $t-tertiary;
}

/* ═══ Promo ═══ */
.promo-bar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 12rpx 32rpx 0;
	padding: 14rpx 24rpx;
	border-radius: $r-lg;
	background: linear-gradient(135deg, #F5E7D8, #E8C5C0);
}

.promo-text {
	font-size: 22rpx;
	color: #6E4A38;
}

.promo-arrow {
	font-size: 24rpx;
	color: #6E4A38;
}

/* ═══ Search ═══ */
.search-bar {
	display: flex;
	align-items: center;
	gap: 12rpx;
	margin: 14rpx 32rpx;
	padding: 15rpx 24rpx;
	border-radius: $r-full;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .06);
}

.search-icon {
	font-size: 28rpx;
	color: $t-tertiary;
}

.search-input {
	flex: 1;
	font-size: 23rpx;
	color: $t-primary;
}

.search-placeholder {
	color: $t-tertiary;
}

/* ═══ 精选美味（图纸板块）═══ */
.feature-banner {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin: 0 32rpx 16rpx;
	padding: 22rpx 28rpx;
	border-radius: $r-xl;
	background: linear-gradient(135deg, #F7E8D8 0%, #EFD6C0 100%);
	box-shadow: $shadow-xs;
	overflow: hidden;
	position: relative;
}

.feature-copy {
	position: relative;
	z-index: 2;
	flex: 1;
	min-width: 0;
}

.feature-title {
	font-family: $font-serif;
	font-size: 34rpx;
	font-weight: 700;
	color: $c-brown;
	letter-spacing: 2rpx;
}

.feature-desc {
	margin-top: 8rpx;
	font-size: 21rpx;
	color: #7A5A45;
	letter-spacing: 1rpx;
	line-height: 1.45;
}

.feature-btn {
	display: inline-flex;
	align-items: center;
	gap: 6rpx;
	margin-top: 16rpx;
	padding: 10rpx 24rpx;
	border-radius: $r-full;
	background: $c-brown;
	color: #FFF8EF;
	font-size: 21rpx;
	font-weight: 600;
	letter-spacing: 1rpx;
	box-shadow: $shadow-btn;
}

.feature-arrow {
	font-size: 22rpx;
	line-height: 1;
}

.feature-art {
	position: relative;
	width: 150rpx;
	height: 150rpx;
	flex-shrink: 0;
	margin-left: 20rpx;
}

.feature-ring {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 150rpx;
	height: 150rpx;
	border-radius: 50%;
	border: 2rpx solid rgba(74, 52, 39, .10);
}

.feature-img {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	width: 128rpx;
	height: 128rpx;
	border-radius: 50%;
	box-shadow: 0 10rpx 26rpx rgba(74, 52, 39, .18);
}

/* ═══ 横排分类 ═══ */
.cate-scroll {
	flex-shrink: 0;
	padding: 0 24rpx;
	white-space: nowrap;
}

.cate-row {
	display: inline-flex;
	gap: 12rpx;
	padding: 4rpx 8rpx 16rpx;
}

.cate-tab {
	padding: 10rpx 28rpx;
	border-radius: $r-full;
	font-size: 23rpx;
	color: $t-secondary;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .05);
	transition: all .2s;

	&.active {
		background: $c-brown;
		color: #FFF8EF;
		font-weight: 600;
		box-shadow: $shadow-btn;
	}
}

/* ═══ 左右分栏 ═══ */
.body {
	flex: 1;
	min-height: 0;
	display: flex;
	overflow: hidden;
}

/* 左：竖排分类 */
.side-cates {
	width: 176rpx;
	flex-shrink: 0;
	background: #F2EADC;
}

.side-cate {
	padding: 30rpx 12rpx;
	text-align: center;
	position: relative;
	font-size: 23rpx;
	color: $t-secondary;
	transition: all .15s;

	&.active {
		background: $bg-page;
		color: $c-brown;
		font-weight: 700;
	}

	&.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 6rpx;
		height: 36rpx;
		border-radius: 3rpx;
		background: $c-caramel;
	}
}

/* 右：商品列表 */
.goods-scroll {
	flex: 1;
	min-height: 0;
	padding: 0 22rpx;
}

.goods-list {
	padding: 10rpx 0 30rpx;
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.good-card {
	display: flex;
	position: relative;
	border-radius: $r-lg;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .05);
	box-shadow: $shadow-xs;
	overflow: hidden;
	padding: 14rpx;
}

.good-tag {
	position: absolute;
	left: 22rpx;
	top: 0;
	z-index: 3;
	padding: 6rpx 18rpx;
	border-radius: 0 0 $r-md $r-md;
	background: $grad-caramel;
	color: #FFF8EF;
	font-size: 19rpx;
	font-weight: 600;
	letter-spacing: 1rpx;
	box-shadow: 0 6rpx 16rpx rgba(74, 52, 39, .16);
}

.good-img-wrap {
	position: relative;
	width: 150rpx;
	height: 150rpx;
	flex-shrink: 0;
	border-radius: $r-md;
	overflow: hidden;
	background: $bg-soft;
}

.good-img {
	width: 100%;
	height: 100%;
}

.good-img--ph {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 60rpx;
	background: linear-gradient(135deg, $c-cream, #F2E7DA);
}

.good-info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	padding: 6rpx 4rpx 2rpx 18rpx;
}

.good-name {
	font-size: 28rpx;
	font-weight: 700;
	color: $t-primary;
}

.good-desc {
	margin-top: 6rpx;
	font-size: 21rpx;
	color: $t-tertiary;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 1;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
	flex: 1;
}

.good-bottom {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 10rpx;
}

.good-price {
	display: flex;
	align-items: baseline;
}

.good-price-symbol {
	font-size: 20rpx;
	color: $c-terra;
	font-weight: 700;
}

.good-price-num {
	font-family: $font-serif;
	font-size: 32rpx;
	font-weight: 700;
	color: $c-terra;
}

/* 数量控制 */
.qty-control {
	display: flex;
	align-items: center;
	gap: 12rpx;
}

.qty-btn {
	width: 42rpx;
	height: 42rpx;
	border-radius: 50%;
	background: $bg-soft;
	color: $t-primary;
	font-size: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.qty-num {
	font-size: 25rpx;
	font-weight: 700;
	color: $t-primary;
	min-width: 22rpx;
	text-align: center;
}

.qty-add {
	width: 46rpx;
	height: 46rpx;
	border-radius: 50%;
	background: $c-brown;
	color: #FFF8EF;
	font-size: 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $shadow-btn;
}

.list-end {
	padding: 20rpx 0 8rpx;
	text-align: center;
	font-size: 20rpx;
	color: $t-tertiary;
	letter-spacing: 2rpx;
}

/* ═══ Cart Bar ═══ */
.cart-bar {
	display: flex;
	align-items: center;
	margin: 8rpx 32rpx 0;
	padding: 16rpx 20rpx;
	border-radius: $r-full;
	background: $c-brown;
	box-shadow: $shadow-md;
	gap: 14rpx;
}

.cart-icon-wrap {
	position: relative;
}

.cart-icon {
	width: 52rpx;
	height: 52rpx;
}

.cart-badge {
	position: absolute;
	top: -6rpx;
	right: -6rpx;
	min-width: 30rpx;
	height: 30rpx;
	border-radius: 15rpx;
	background: #EAD0A2;
	color: #3A2A20;
	font-size: 18rpx;
	font-weight: 700;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0 6rpx;
}

.cart-price {
	flex: 1;
	display: flex;
	align-items: baseline;
	color: #FFF8EF;
}

.cart-price-symbol {
	font-size: 22rpx;
}

.cart-price-num {
	font-family: $font-serif;
	font-size: 34rpx;
	font-weight: 700;
	margin-left: 4rpx;
}

.pay-btn {
	padding: 14rpx 36rpx;
	border-radius: $r-full !important;
	background: $grad-caramel !important;
	color: #FFF8EF !important;
	font-size: 24rpx;
	font-weight: 600;
	box-shadow: none;
	border: none !important;
	line-height: 1;
	height: auto;

	&::after { border: none; }

	&[disabled] {
		background: rgba(255, 248, 239, .25) !important;
		color: rgba(255, 248, 239, .6) !important;
		box-shadow: none;
	}
}

/* ═══ Detail Modal ═══ */
.detail-cover {
	position: relative;
	width: 100%;
	height: 340rpx;
	border-radius: $r-xl $r-xl 0 0;
	background: $bg-soft;
}

.detail-cover-img {
	width: 100%;
	height: 100%;
}

.detail-cover-img--ph {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 140rpx;
}

.detail-cover-actions {
	position: absolute;
	top: 16rpx;
	right: 16rpx;
	display: flex;
	gap: 12rpx;
	image { width: 44rpx; height: 44rpx; }
}

.detail-body {
	max-height: 300rpx;
	padding: 0 24rpx;
}

.detail-wrapper {
	padding: 22rpx 0;
}

.detail-name {
	font-family: $font-serif;
	font-size: 40rpx;
	font-weight: 700;
	margin-bottom: 8rpx;
}

.detail-desc {
	font-size: 24rpx;
	color: $t-secondary;
	line-height: 1.6;
}

.detail-props {
	display: flex;
	flex-direction: column;
	gap: 18rpx;
}

.detail-props-title {
	font-size: 26rpx;
	font-weight: 700;
	padding-bottom: 8rpx;
	border-bottom: 1rpx solid $c-divider;
}

.prop-values {
	display: flex;
	flex-wrap: wrap;
	gap: 10rpx;
}

.prop-value {
	padding: 10rpx 22rpx;
	font-size: 22rpx;
	color: $t-primary;
	background: $bg-soft;
	border-radius: $r-full;
	border: 2rpx solid transparent;

	&.selected {
		background: rgba($c-caramel, .12);
		color: $c-brown;
		border-color: $c-caramel;
		font-weight: 600;
	}
}

.detail-action {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 18rpx 24rpx;
	border-top: 1rpx solid $c-divider;
}

.detail-action-price {
	font-family: $font-serif;
	font-size: 36rpx;
	font-weight: 700;
	color: $c-terra;
}

.detail-action-props {
	font-size: 22rpx;
	color: $t-tertiary;
	margin-top: 4rpx;
}

.detail-action-stepper {
	display: flex;
	align-items: center;
	gap: 10rpx;
}

.stepper-num {
	font-size: 26rpx;
	font-weight: 600;
	min-width: 28rpx;
	text-align: center;
}

.btn {
	width: 36rpx;
	height: 36rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	margin: 0;
	line-height: 1;
	font-size: 18rpx;

	&::after { border: none; }
}

.reduce-btn {
	background: $bg-soft !important;
	color: $t-primary !important;
	border: none !important;
	display: flex;
	align-items: center;
	justify-content: center;
}

.add-btn {
	background: $c-brown !important;
	color: #FFF !important;
	border: none !important;
	display: flex;
	align-items: center;
	justify-content: center;
}

.step-ico {
	width: 32rpx;
	height: 32rpx;
}

.detail-add-btn {
	margin: 0 24rpx 22rpx;
	padding: 20rpx 0;
	border-radius: $r-full;
	background: $grad-caramel;
	text-align: center;
	color: #FFF8EF;
	font-size: 28rpx;
	font-weight: 600;
	box-shadow: $shadow-btn;
	letter-spacing: 2rpx;
}

/* ═══ Cart Popup（图纸样式）═══ */
.cart-popup-head {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 24rpx 30rpx 8rpx;
}

.cart-popup-title {
	font-family: $font-serif;
	font-size: 32rpx;
	font-weight: 700;
	color: $t-primary;
}

.cart-popup-clear {
	font-size: 23rpx;
	color: $t-tertiary;
}

.cart-popup-item {
	display: flex;
	align-items: center;
	padding: 20rpx 0;
	border-bottom: 1rpx solid rgba(74, 52, 39, .05);

	&:last-child { border-bottom: none; }
}

.cart-item-name {
	font-size: 26rpx;
	font-weight: 600;
}

.cart-item-props {
	font-size: 21rpx;
	color: $t-tertiary;
	margin-top: 4rpx;
}

.cart-popup-item-center {
	font-family: $font-serif;
	font-size: 26rpx;
	font-weight: 700;
	color: $c-terra;
	padding: 0 20rpx;
}

.cart-popup-item-right {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.invisible {
	visibility: hidden;
}

.cart-popup-tip {
	padding: 16rpx 0 6rpx;
	font-size: 22rpx;
	color: $c-caramel;
	text-align: center;
}

.cart-popup-foot {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 22rpx 30rpx calc(env(safe-area-inset-bottom) + 22rpx);
	border-top: 1rpx solid rgba(74, 52, 39, .06);
}

.cart-popup-total {
	display: flex;
	align-items: baseline;
	gap: 10rpx;
}

.total-label {
	font-size: 24rpx;
	color: $t-secondary;
}

.total-amount {
	font-family: $font-serif;
	font-size: 38rpx;
	font-weight: 700;
	color: $c-terra;
}

.total-go {
	padding: 16rpx 56rpx;
	border-radius: $r-full;
	background: $grad-caramel;
	color: #FFF8EF;
	font-size: 27rpx;
	font-weight: 600;
	box-shadow: $shadow-btn;
	letter-spacing: 2rpx;
}
</style>
