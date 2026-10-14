<template>
	<view class="page rm-page old-money">
		<view class="hero">
			<image :src="product.image" mode="aspectFill"></image>
			<view class="top-bar">
				<view class="back" @tap="goBack">‹</view>
				<view class="mini-actions"><text>•••</text><text>◎</text></view>
			</view>
			<view class="hero-tags">
				<text>主厨推荐</text>
				<text>今晨现烤</text>
			</view>
		</view>

		<view class="sheet">
			<view class="title-row">
				<view>
					<view class="product-name">{{ product.name }}</view>
					<view class="product-subtitle">{{ product.subtitle }}</view>
				</view>
			</view>
			<view class="description">{{ product.description }}</view>
			<view class="buy-row">
				<view class="price">¥{{ currentPrice }}</view>
				<view class="qty">
					<text @tap="decreaseQty">−</text>
					<text>{{ quantity }}</text>
					<text @tap="increaseQty">＋</text>
				</view>
			</view>
		</view>

		<view class="section">
			<view class="section-title">推荐</view>
			<scroll-view scroll-x class="recommend-scroll" :show-scrollbar="false">
				<view class="recommend-list">
					<view class="recommend-card" v-for="item in recommendations" :key="item.name">
						<image :src="item.image" mode="aspectFill"></image>
						<view>{{ item.name }}</view>
						<text>¥{{ item.price }}</text>
					</view>
				</view>
			</scroll-view>
		</view>

		<view class="bottom-bar">
			<view>
				<text class="bottom-label">Final price</text>
				<view class="bottom-price">¥{{ totalPrice }}</view>
			</view>
			<view class="cart-btn" @tap="addToCart">加入购物袋</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const productId = ref('')
const quantity = ref(1)
const product = ref({
	id: 1,
	name: '草莓云朵枕头蛋糕',
	subtitle: '法式风味与顶级食材',
	description: 'A fragile sponge cake layered with premium French strawberry and cream. The cream steamed with premium French strawberry and cream...',
	price: 58,
	image: '/static/images/goods/default.png'
})
const recommendations = ref([
	{ name: '草莓云朵', price: 58, image: '/static/images/goods/default.png' },
	{ name: '经典可颂', price: 50, image: '/static/images/goods/default.png' },
	{ name: '法棍面包', price: 42, image: '/static/images/goods/default.png' }
])

const currentPrice = computed(() => Number(product.value.price || 0))
const totalPrice = computed(() => currentPrice.value * quantity.value)

onLoad((options) => { productId.value = options.id || '' })

function goBack() { uni.navigateBack() }
function increaseQty() { quantity.value += 1 }
function decreaseQty() { if (quantity.value > 1) quantity.value -= 1 }

function addToCart() {
	const cart = uni.getStorageSync('cart') || []
	const item = {
		id: product.value.id,
		cateId: 1,
		name: product.value.name,
		price: currentPrice.value,
		number: quantity.value,
		image: product.value.image,
		propsText: '主厨推荐'
	}
	const index = cart.findIndex((cartItem) => cartItem.id === item.id)
	if (index > -1) cart[index].number += item.number
	else cart.push(item)
	uni.setStorageSync('cart', cart)
	uni.showToast({ title: '已加入购物袋', icon: 'success' })
}
</script>

<style lang="scss" scoped>
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
