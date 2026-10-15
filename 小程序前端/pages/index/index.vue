<template>
	<view class="page rm-page">
		<!-- 顶部安全区 -->
		<view class="safe-top" :style="{ height: $safeTop + 'px' }"></view>

		<!-- ═══ 品牌头：REMAI · 热麦 ｜ 门店 + 会员 ═══ -->
		<view class="brandbar">
			<view class="brand-left">
				<view class="brand-en">REMAI</view>
				<view class="brand-cn">{{ $t("热麦") }}</view>
			</view>
			<view class="brand-right" :style="{ paddingTop: $menuButtonGap + 'px' }">
				<view class="brand-icon" role="button" :aria-label="$t('点餐')" @tap="goMenu">
					<image src="/static/images/icon/iconmap.png" class="brand-ico" mode="aspectFit"></image>
				</view>
				<view class="brand-icon" role="button" :aria-label="$t('我的')" @tap="goMine">
					<image src="/static/images/icon/iconwode.png" class="brand-ico" mode="aspectFit"></image>
				</view>
			</view>
		</view>

		<!-- ═══ Hero 运营大图：草莓季（图纸：浅米底 + 左文右图） ═══ -->
		<view class="hero" @tap="goMenu">
			<view class="hero-copy">
				<view class="hero-season">{{ $t("草莓季") }}</view>
				<view class="hero-line">{{ $t("一口春天的味道") }}</view>
				<view class="hero-en">STRAWBERRY SEASON</view>
				<view class="hero-cta">
					<text>{{ $t("探索本季新品") }}</text>
					<text class="hero-arrow">→</text>
				</view>
			</view>
			<image src="/static/images/home/hero-strawberry.jpg" class="hero-img" mode="aspectFill"></image>
		</view>

		<!-- ═══ 金刚区：点餐 / 取餐 / 会员 / 优惠券 ═══ -->
		<view class="quick-row">
			<view class="quick-item" @tap="goMenu">
				<view class="quick-circle"><image src="/static/images/icon/iconyinpinyinliao.png" class="quick-ico" mode="aspectFit"></image></view>
				<text class="quick-label">{{ $t("点餐") }}</text>
			</view>
			<view class="quick-item" @tap="goTake">
				<view class="quick-circle"><image src="/static/images/icon/iconqucan.png" class="quick-ico" mode="aspectFit"></image></view>
				<text class="quick-label">{{ $t("取餐") }}</text>
			</view>
			<view class="quick-item" @tap="goMine">
				<view class="quick-circle"><image src="/static/images/icon/iconcrown.png" class="quick-ico" mode="aspectFit"></image></view>
				<text class="quick-label">{{ $t("会员") }}</text>
			</view>
			<view class="quick-item" @tap="goCoupons">
				<view class="quick-circle"><image src="/static/images/icon/iconcalendar.png" class="quick-ico" mode="aspectFit"></image></view>
				<text class="quick-label">{{ $t("优惠券") }}</text>
			</view>
		</view>

		<!-- ═══ 今日推荐 ═══ -->
		<view class="today-section">
			<view class="section-head">
				<view class="section-title">{{ $t("今日推荐") }}</view>
				<view class="section-more" @tap="goMenu">{{ $t("更多") }} <text class="more-arrow">›</text></view>
			</view>
			<view class="today-card" v-if="featuredList.length" @tap="goMenu">
				<view class="today-img-wrap">
					<image :src="todayImg" mode="aspectFill" class="today-img" @error="onTodayImgError"></image>
					<view v-if="featuredList[0].sales" class="today-sales">{{ $t("已售") }} {{ $t(featuredList[0].sales) }}</view>
				</view>
				<view class="today-info">
					<view class="today-tag">{{ $t(todayTag) }}</view>
					<view class="today-name">{{ $t($localized(featuredList[0], "name")) }}</view>
					<view class="today-desc">{{ $t($localized(featuredList[0], "content") || $localized(featuredList[0], "description") || '浓郁芝士 × 香嫩鸡肉') }}</view>
					<view class="today-bottom">
						<view class="today-price-wrap">
							<view class="today-price">¥{{ $t(featuredList[0].price) }}</view>
							<view class="today-origin" v-if="featuredList[0].original_price > featuredList[0].price">¥{{ $t(featuredList[0].original_price) }}</view>
						</view>
						<view class="today-add" @tap.stop="goMenu"><text>+</text></view>
					</view>
				</view>
			</view>
			<view class="today-card" v-else @tap="goMenu">
				<view class="today-info">
					<view class="today-name">{{ $t('菜单暂不可用') }}</view>
					<view class="today-desc">{{ $t('进入菜单重试，商品与价格以门店实时信息为准') }}</view>
					<view class="today-tag">{{ $t('去点餐') }} →</view>
				</view>
			</view>
		</view>

		<!-- ═══ 门店信息 ═══ -->
		<view class="store-section">
			<view class="section-title">{{ $t("门店信息") }}</view>
			<view class="store-card">
				<view class="store-name-row">
					<view class="store-name">{{ $t(store ? $localized(store, "name") : '门店信息暂不可用') }}</view>
				</view>
				<view class="store-meta" v-if="store && (store.serverTime || store.server_time)">{{ $t("营业时间") }} {{ store.serverTime || store.server_time }}</view>
				<view class="store-meta" v-if="store && store.address">{{ $t("地址") }} {{ $localized(store, 'address') }}</view>
			</view>
		</view>

		<!-- ═══ Editorial Brand Moment（D.6） ═══ -->
		<view class="brand-moment">
			<image src="/static/images/home/goods-croissant.jpg" class="moment-img" mode="aspectFill"></image>
			<view class="moment-copy">
				<view class="moment-zh">{{ $t("每日少量出炉") }}</view>
				<view class="moment-en">Freshly baked, quietly good.</view>
			</view>
		</view>

		<view class="safe-bottom"></view>
	</view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import { api } from '@/api'

const vstore = useStore()
const store = ref(null)
const banners = ref([])
const featuredGoods = ref(null)
const menuData = ref([])

// 今日推荐图：优先云端商品图，加载失败时切本地可颂图（外链图在微信端需合法域名）
const todayImg = ref('')
const LOCAL_FALLBACK = '/static/images/home/goods-croissant.jpg'
// 云端 picsum 占位图 → 本地蛋糕素材映射（内容与蛋糕店定位匹配）
const BANNER_LOCAL = [
	'/static/images/home/hero-strawberry.jpg',
	'/static/images/home/goods-croissant.jpg',
	'/static/images/home/goods-chicken-cheese.jpg'
]
const FEATURED_LOCAL = '/static/images/home/goods-chicken-cheese.jpg'

function isPlaceholderImg(url) {
	return !url || /picsum\.photos/.test(url) || /^https?:\/\/\d+\.\d+\.\d+\.\d+/.test(url)
}

const featuredList = computed(() => {
	if (featuredGoods.value) return [featuredGoods.value]
	if (menuData.value && menuData.value.length) {
		const list = []
		for (const c of menuData.value) {
			if (c.goodsList && c.goodsList.length) list.push(...c.goodsList)
			if (list.length >= 1) break
		}
		return list
	}
	return []
})

function onTodayImgError() {
	todayImg.value = LOCAL_FALLBACK
}

watch(featuredList, (list) => {
	if (list.length && list[0].image) {
		todayImg.value = list[0].image
	} else {
		todayImg.value = LOCAL_FALLBACK
	}
}, { immediate: true, deep: true })

// 今日推荐标签：优先商品所属分类名，其次"招牌热麦"
const todayTag = computed(() => {
	if (!menuData.value.length || !featuredList.value.length) return '招牌热麦'
	for (const c of menuData.value) {
		if (c.goodsList && c.goodsList.some(g => g.id === featuredList.value[0].id)) return c.name
	}
	return '招牌热麦'
})

onLoad((options) => {
	// 扫码点餐：桌码以 ?table_no=X 进入首页，落地桌号到全局状态
	if (options && options.table_no) {
		vstore.commit('SET_TABLE_NO', decodeURIComponent(options.table_no))
	}
	loadStoreInfo()
	loadBanners()
	loadFeaturedGoods()
})

onShow(() => {})

async function loadStoreInfo() {
	try {
		const info = await api.getStore()
		store.value = info
	} catch (e) {
		console.error('加载门店信息失败', e)
	}
}

async function loadBanners() {
	try {
		const list = await api.getBanners()
		banners.value = (list || []).filter(b => b.isShow !== false && b.is_show !== false)
			.map((b, i) => {
				if (isPlaceholderImg(b.image)) b.image = BANNER_LOCAL[i % BANNER_LOCAL.length]
				return b
			})
	} catch (e) {
		console.error('加载轮播图失败', e)
	}
}

async function loadFeaturedGoods() {
	try {
		const menu = await api.getMenuData()
		menuData.value = Array.isArray(menu) ? menu : []
		const first = (Array.isArray(menu) && menu[0] && menu[0].goodsList && menu[0].goodsList[0]) || null
		if (first) {
			if (isPlaceholderImg(first.image)) first.image = FEATURED_LOCAL
			featuredGoods.value = first
		}
	} catch (e) {
		console.error('加载推荐商品失败', e)
	}
}

function goMenu() { uni.switchTab({ url: '/pages/menu/menu' }) }
function goMine() { uni.switchTab({ url: '/pages/mine/mine' }) }
function goTake() { uni.switchTab({ url: '/pages/take-foods/take-foods' }) }
function goCoupons() {
	const token = uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
	if (!token) { uni.navigateTo({ url: '/pages/login/login' }); return }
	uni.navigateTo({ url: '/pages/coupons/coupons' })
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	padding: 0 32rpx calc(env(safe-area-inset-bottom) + 48rpx);
	background: $bg-page;
	color: $t-primary;
}

.safe-top {
	height: env(safe-area-inset-top);
}

/* ═══ 品牌头 ═══ */
.brandbar {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 30rpx 0 26rpx;
}

.brand-left {
	display: flex;
	flex-direction: column;
}

.brand-en {
	font-family: $font-serif;
	font-size: 46rpx;
	font-weight: 700;
	letter-spacing: 6rpx;
	line-height: 1.05;
	color: $c-brown;
}

.brand-cn {
	margin-top: 6rpx;
	font-size: 21rpx;
	font-weight: 600;
	letter-spacing: 5rpx;
	color: $t-secondary;
}

.brand-right {
	display: flex;
	gap: 16rpx;
}

.brand-icon {
	width: 84rpx;
	height: 84rpx;
	min-width: 44px;
	min-height: 44px;
	border-radius: 50%;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .10);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $shadow-xs;
}

.brand-ico {
	width: 32rpx;
	height: 32rpx;
}

/* ═══ Hero 运营大图（图纸：浅米底 + 左文右图） ═══ */
.hero {
	position: relative;
	height: 340rpx;
	border-radius: $r-2xl;
	overflow: hidden;
	box-shadow: $shadow-md;
	display: flex;
	align-items: stretch;
	background: linear-gradient(115deg, #F3E4D2 0%, #EAD6BE 58%, #E1C6A8 100%);
}

.hero-copy {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	padding: 0 30rpx 0 36rpx;
	position: relative;
	z-index: 2;
}

.hero-season {
	font-family: $font-serif;
	font-size: 60rpx;
	font-weight: 700;
	line-height: 1.12;
	letter-spacing: 5rpx;
	color: #3B2A1E;
}

.hero-line {
	margin-top: 12rpx;
	font-size: 25rpx;
	letter-spacing: 2rpx;
	color: #6E5A48;
}

.hero-en {
	margin-top: 6rpx;
	font-size: 17rpx;
	letter-spacing: 4rpx;
	color: $c-caramel;
	font-weight: 600;
}

.hero-cta {
	display: inline-flex;
	align-items: center;
	gap: 8rpx;
	align-self: flex-start;
	margin-top: 24rpx;
	padding: 12rpx 24rpx;
	border-radius: $r-full;
	background: rgba(255, 250, 242, .92);
	color: $c-brown;
	font-size: 22rpx;
	font-weight: 600;
	letter-spacing: 1rpx;
	box-shadow: 0 6rpx 20rpx rgba(58, 42, 30, .14);
}

.hero-arrow {
	font-size: 24rpx;
}

.hero-img {
	width: 42%;
	height: 100%;
	flex-shrink: 0;
}

/* ═══ 金刚区 ═══ */
.quick-row {
	display: flex;
	align-items: flex-start;
	justify-content: space-around;
	padding: 34rpx 0 30rpx;
}

.quick-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14rpx;
}

.quick-circle {
	width: 100rpx;
	height: 100rpx;
	border-radius: 50%;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .08);
	box-shadow: $shadow-xs;
	display: flex;
	align-items: center;
	justify-content: center;
}

.quick-ico {
	width: 46rpx;
	height: 46rpx;
}

.quick-label {
	font-size: 22rpx;
	color: $t-secondary;
	letter-spacing: 1rpx;
}

/* ═══ 今日推荐 ═══ */
.today-section {
	margin-bottom: 40rpx;
}

.section-head {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin-bottom: 18rpx;
}

.section-title {
	font-family: $font-serif;
	font-size: 34rpx;
	font-weight: 700;
	color: $c-brown;
	letter-spacing: 1rpx;
}

.section-more {
	font-size: 22rpx;
	color: $t-tertiary;
	display: flex;
	align-items: center;
}

.more-arrow {
	font-size: 28rpx;
	margin-left: 4rpx;
	line-height: 1;
}

.today-card {
	display: flex;
	border-radius: $r-xl;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .05);
	box-shadow: $shadow-xs;
	overflow: hidden;
}

.today-img-wrap {
	position: relative;
	width: 270rpx;
	height: 260rpx;
	flex-shrink: 0;
	background: $bg-soft;
}

.today-img {
	width: 100%;
	height: 100%;
}

.today-img--ph {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 96rpx;
	background: linear-gradient(135deg, $c-cream, #F2E7DA);
}

.today-sales {
	position: absolute;
	left: 12rpx;
	bottom: 12rpx;
	padding: 4rpx 14rpx;
	border-radius: $r-full;
	background: rgba(31, 20, 14, .55);
	color: #F8EFE4;
	font-size: 18rpx;
	letter-spacing: 1rpx;
}

.today-info {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	padding: 24rpx 24rpx 22rpx 26rpx;
}

.today-tag {
	align-self: flex-start;
	padding: 5rpx 18rpx;
	border-radius: $r-full;
	background: rgba($c-caramel, .16);
	color: $c-brown;
	font-size: 19rpx;
	font-weight: 600;
	letter-spacing: 1rpx;
}

.today-name {
	margin-top: 12rpx;
	font-size: 32rpx;
	font-weight: 700;
	color: $t-primary;
	line-height: 1.25;
}

.today-desc {
	margin-top: 8rpx;
	font-size: 21rpx;
	color: $t-tertiary;
	line-height: 1.45;
	flex: 1;
}

.today-bottom {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 14rpx;
}

.today-price-wrap {
	display: flex;
	align-items: baseline;
	gap: 10rpx;
}

.today-price {
	font-family: $font-serif;
	font-size: 36rpx;
	font-weight: 700;
	color: $c-terra;
}

.today-origin {
	font-size: 20rpx;
	color: $c-muted;
	text-decoration: line-through;
}

.today-add {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	background: $c-brown;
	color: #FFF8EF;
	font-size: 34rpx;
	font-weight: 400;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $shadow-btn;

	text {
		line-height: 1;
		margin-top: -4rpx;
	}
}

/* ═══ 门店信息 ═══ */
.store-section {
	padding: 2rpx 0 10rpx;
}

.store-section .section-title {
	margin-bottom: 18rpx;
}

.store-card {
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .05);
	border-radius: $r-lg;
	padding: 26rpx 28rpx;
	box-shadow: $shadow-xs;
}

.store-name-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.store-name {
	font-size: 28rpx;
	font-weight: 700;
	color: $t-primary;
}

.store-status {
	display: flex;
	align-items: center;
	gap: 8rpx;
	font-size: 20rpx;
	color: $c-sage;
	font-weight: 600;
}

.status-dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: #6FA287;
	box-shadow: 0 0 0 5rpx rgba(111, 162, 135, .16);
}

.store-meta {
	margin-top: 10rpx;
	font-size: 22rpx;
	color: $t-tertiary;
	letter-spacing: 1rpx;
}

/* ═══ Editorial Brand Moment ═══ */
.brand-moment {
	display: flex;
	align-items: center;
	gap: 26rpx;
	margin-top: 34rpx;
	padding: 20rpx 24rpx;
	border-radius: $r-lg;
	background: $c-ivory;
	border: 1rpx solid rgba(74, 52, 39, .05);
	box-shadow: $shadow-xs;
}

.moment-img {
	width: 132rpx;
	height: 132rpx;
	border-radius: $r-lg;
	flex-shrink: 0;
}

.moment-copy {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.moment-zh {
	font-family: $font-serif;
	font-size: 30rpx;
	font-weight: 700;
	color: $c-brown;
	letter-spacing: 2rpx;
}

.moment-en {
	font-family: $font-serif;
	font-size: 20rpx;
	letter-spacing: 1rpx;
	color: $t-tertiary;
	line-height: 1.5;
}

.safe-bottom {
	height: 24rpx;
}
</style>
