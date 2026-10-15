<template>
	<view class="page rm-page old-money">
		<view v-if="loading || loadError" class="detail-state">
			<text>{{ $t(loading ? '加载中...' : loadError) }}</text>
			<button v-if="loadError" @tap="goBack">{{ $t('返回') }}</button>
		</view>
		<template v-else>
		<view class="hero">
			<image :src="product.image" mode="aspectFill"></image>
			<view class="top-bar">
				<view class="back" @tap="goBack">‹</view>
			</view>
		</view>

		<view class="sheet">
			<view class="title-row">
				<view>
					<view class="product-name">{{ $t($localized(product, "name")) }}</view>
					<view class="product-subtitle">{{ $t(product.subtitle) }}</view>
				</view>
			</view>
			<view class="description">{{ $t($localized(product, "description")) }}</view>
			<view class="buy-row">
				<view class="price">¥{{ $t(currentPrice) }}</view>
				<view class="qty">
					<text @tap="decreaseQty">−</text>
					<text>{{ $t(quantity) }}</text>
					<text @tap="increaseQty">＋</text>
				</view>
			</view>
		</view>

		<view class="section" v-if="recommendations.length">
			<view class="section-title">{{ $t("推荐") }}</view>
			<scroll-view scroll-x class="recommend-scroll" :show-scrollbar="false">
				<view class="recommend-list">
					<view class="recommend-card" v-for="item in recommendations" :key="item.name">
						<image :src="item.image" mode="aspectFill"></image>
						<view>{{ $t($localized(item, "name")) }}</view>
						<text>¥{{ $t(item.price) }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<view class="bottom-bar">
			<view>
				<text class="bottom-label">{{ $t('合计') }}</text>
				<view class="bottom-price">¥{{ $t(totalPrice) }}</view>
			</view>
			<button class="cart-btn" :disabled="!canPurchase" @tap="addToCart">{{ $t(canPurchase ? '加入购物袋' : '已售罄') }}</button>
		</view>
		</template>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '@/api'
import store from '@/store'

const productId = ref('')
const quantity = ref(1)
const product = ref({ id: '', name: '', subtitle: '', description: '', image: '', stock: 0 })
const recommendations = ref([])
const loading = ref(true)
const loadError = ref('')
const loaded = ref(false)
const canPurchase = computed(() => loaded.value && product.value.isSell !== false && Number(product.value.stock) > 0 && Number.isFinite(Number(product.value.price)))
const currentPrice = computed(() => loaded.value ? Number(product.value.price) : '--')
const totalPrice = computed(() => loaded.value ? (Number(product.value.price) * quantity.value).toFixed(2) : '--')

onLoad(async (options = {}) => {
	productId.value = String(options.id || options.goodsId || options.goods_id || '').trim()
	loaded.value = false
	loading.value = true
	loadError.value = ''
	try {
		if (!productId.value) throw new Error('商品不存在')
		const data = await api.getGoodsDetail({ id: productId.value })
		const id = data && (data._id || data.id)
		if (!id || String(id) !== productId.value || !Number.isFinite(Number(data.price)) || Number(data.price) < 0) throw new Error('商品不存在')
		product.value = { ...data, id, image: typeof data.image === 'string' ? data.image : (data.image && data.image.url) || '', subtitle: data.subtitle || '' }
		quantity.value = 1
		loaded.value = true
		if (!canPurchase.value) uni.showToast({ title: '商品已售罄或下架', icon: 'none' })
	} catch (error) {
		loadError.value = '商品加载失败，请返回重试'
		uni.showToast({ title: loadError.value, icon: 'none' })
	} finally {
		loading.value = false
	}
})

function goBack() { uni.navigateBack() }
function increaseQty() {
	if (!canPurchase.value || quantity.value >= Number(product.value.stock)) return
	quantity.value += 1
}
function decreaseQty() { if (quantity.value > 1) quantity.value -= 1 }

function addToCart() {
	if (!canPurchase.value) {
		uni.showToast({ title: loading.value ? '加载中...' : (loadError.value || '商品已售罄或下架'), icon: 'none' })
		return
	}
	if (Array.isArray(product.value.specs) && product.value.specs.length > 0) {
		uni.showToast({ title: '此商品暂不支持在线选择规格，请联系门店', icon: 'none' })
		return
	}
	const saved = uni.getStorageSync('cart')
	const cart = Array.isArray(saved) ? saved.map(row => ({ ...row })) : []
	const existingQuantity = cart.reduce((sum, row) => row.id === product.value.id ? sum + Number(row.number || 0) : sum, 0)
	if (existingQuantity + quantity.value > Number(product.value.stock)) {
		uni.showToast({ title: '商品库存不足', icon: 'none' })
		return
	}
	const item = {
		id: product.value.id,
		cateId: product.value.categoryId || product.value.category_id || '',
		name: product.value.name,
		nameEn: product.value.nameEn || product.value.name_en || '',
		price: currentPrice.value,
		number: quantity.value,
		image: product.value.image,
		useProperty: false,
		propsText: '',
		props: [],
		specs: []
	}
	const index = cart.findIndex((cartItem) => cartItem.id === item.id && !cartItem.propsText && !(cartItem.specs && cartItem.specs.length))
	if (index > -1) cart[index].number += item.number
	else cart.push(item)
	store.commit('SET_CART', cart)
	store.dispatch('syncCart')
	uni.showToast({ title: '已加入购物袋', icon: 'success' })
}
</script>

<style lang="scss" scoped>
.detail-state {
	min-height: 60vh;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 32rpx;
	padding: 40rpx;
	font-size: 30rpx;
}

.cart-btn[disabled] { opacity: .45; }
.page {
	min-height: 100vh;
	padding-bottom: 180rpx;
	background: linear-gradient(180deg, #4A3427 0%, #F8F4EE 48%, #FFFBF6 100%);
	color: #332D27;
}

.hero {
	position: relative;
	height: 620rpx;
	overflow: hidden;
}

.hero image {
	width: 100%;
	height: 100%;
}

.top-bar {
	position: absolute;
	top: 48rpx;
	left: 24rpx;
	right: 24rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	color: #fff;
}

.back {
	font-size: 52rpx;
	line-height: 1;
}

.mini-actions {
	display: flex;
	gap: 14rpx;
	align-items: center;
	height: 48rpx;
	padding: 0 18rpx;
	border-radius: 999rpx;
	background: rgba(255,255,255,.35);
	color: #332D27;
	font-size: 20rpx;
}

.hero-tags {
	position: absolute;
	left: 34rpx;
	bottom: 34rpx;
	display: flex;
	gap: 16rpx;
}

.hero-tags text {
	padding: 10rpx 22rpx;
	border-radius: 999rpx;
	background: rgba(248,244,238,.82);
	color: #4A3427;
	font-size: 22rpx;
}

.sheet {
	position: relative;
	z-index: 2;
	margin-top: -26rpx;
	padding: 34rpx 28rpx 28rpx;
	border-radius: 32rpx 32rpx 16rpx 16rpx;
	background: #fff;
	box-shadow: 0 -8rpx 28rpx rgba(74,52,39,.08);
}

.product-name {
	font-size: 46rpx;
	font-family: Georgia, 'Times New Roman', serif;
	font-weight: 700;
	line-height: 1.18;
}

.product-subtitle {
	margin-top: 8rpx;
	font-size: 26rpx;
	color: #4A3427;
}

.description {
	margin-top: 22rpx;
	padding: 22rpx;
	border-radius: 16rpx;
	background: #F8F4EE;
	color: #332D27;
	font-size: 24rpx;
	line-height: 1.42;
}

.buy-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: 24rpx;
}

.price {
	font-size: 42rpx;
	font-family: Georgia, 'Times New Roman', serif;
	font-weight: 700;
}

.qty {
	display: flex;
	align-items: center;
	gap: 24rpx;
	height: 52rpx;
	padding: 0 20rpx;
	border-radius: 999rpx;
	background: #F1E8DD;
	color: #4A3427;
	font-size: 26rpx;
}

.section {
	padding: 32rpx 24rpx 0;
}

.section-title {
	margin-bottom: 18rpx;
	font-size: 38rpx;
	font-family: Georgia, 'Times New Roman', serif;
	font-weight: 700;
}

.recommend-scroll {
	width: 100%;
	white-space: nowrap;
}

.recommend-list {
	display: flex;
	gap: 18rpx;
}

.recommend-card {
	width: 170rpx;
	flex-shrink: 0;
	font-size: 22rpx;
	color: #332D27;
}

.recommend-card image {
	width: 170rpx;
	height: 170rpx;
	border-radius: 16rpx;
	margin-bottom: 10rpx;
}

.recommend-card text {
	display: block;
	margin-top: 4rpx;
	color: #C75050;
}

.bottom-bar {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 20;
	padding: 24rpx 28rpx 44rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: rgba(255,255,255,.94);
	box-shadow: 0 -8rpx 28rpx rgba(74,52,39,.08);
}

.bottom-label {
	font-size: 20rpx;
	color: #665F57;
}

.bottom-price {
	margin-top: 4rpx;
	font-size: 38rpx;
	font-family: Georgia, 'Times New Roman', serif;
}

.cart-btn {
	min-width: 280rpx;
	height: 76rpx;
	border-radius: 999rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #D9B38C, #B8855B);
	color: #fff;
	font-size: 28rpx;
	box-shadow: 0 8rpx 18rpx rgba(184,133,91,.24);
}
</style>
