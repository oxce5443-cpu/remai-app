<template>
	<view class="page rm-page old-money">
		<!-- Tab Bar -->
		<view class="tabbar">
			<view class="tab" :class="{'tab--active': !currentTab}" @tap="switchTab(0)">购买礼品卡</view>
			<view class="tab" :class="{'tab--active': currentTab}" @tap="switchTab(1)">我的礼品卡</view>
		</view>

		<swiper :duration="400" :disable-touch="true" class="swiper" :current="currentTab">
			<!-- Buy Gift Cards -->
			<swiper-item class="swiper-item" @touchmove.stop="handleSwiperItemChange">
				<scroll-view scroll-y="true" class="scroll-area">
					<image :src="giftCards.img" class="banner-img" mode="widthFix"/>
					<view class="section">
						<view class="category" v-for="(category, index) in giftCards.category_list" :key="index">
							<view class="category-name">{{ category.name }}</view>
							<view class="theme-grid">
								<view class="theme-card" v-for="(theme, key) in category.themesList" :key="key">
									<image :src="theme.imageUrls" class="theme-img" mode="widthFix"/>
									<view class="theme-name">{{ theme.activityName }}</view>
								</view>
							</view>
						</view>
					</view>
				</scroll-view>
				<view class="footer">
					<text>购买须知</text>
					<view class="footer-divider"></view>
					<text>礼品卡章程</text>
				</view>
			</swiper-item>

			<!-- My Gift Cards -->
			<swiper-item class="swiper-item" @touchmove.stop="handleSwiperItemChange">
				<view class="sub-header">
					<view class="sub-tabs">
						<view class="sub-tab" :class="{'sub-tab--active': !giftCardType}" @tap="switchGiftCardType(0)">可使用(0)</view>
						<view class="sub-tab" :class="{'sub-tab--active': giftCardType}" @tap="switchGiftCardType(1)">不可使用(0)</view>
					</view>
					<view class="exchange-link">兑换礼品卡</view>
				</view>
				<swiper :duration="400" class="flex-fill" :current="giftCardType" @change="e => switchGiftCardType(e.detail.current)">
					<swiper-item>
						<template v-if="!myCards.length">
							<view class="empty-state">
								<image src="/static/images/giftcard-empty.png" class="empty-img" mode="widthFix"/>
								<view class="empty-text">您暂时还没有礼品卡哦~</view>
							</view>
						</template>
					</swiper-item>
					<swiper-item>
						<template v-if="!myCards.length">
							<view class="empty-state">
								<image src="/static/images/giftcard-empty.png" class="empty-img" mode="widthFix"/>
								<view class="empty-text">您暂时还没有礼品卡哦~</view>
							</view>
						</template>
					</swiper-item>
				</swiper>
				<view class="footer footer--double">
					<button type="primary" plain>获取记录</button>
					<button type="primary">赠送记录</button>
				</view>
			</swiper-item>
		</swiper>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { api } from '@/api'

const giftCards = ref({})
const currentTab = ref(0)
const giftCardType = ref(0)
const myCards = ref([])

onShow(async () => {
	try { giftCards.value = await api.getGiftCards() || {} }
	catch (e) { console.error('加载礼品卡失败', e) }
})

function switchTab(index) { if (currentTab.value == index) return; currentTab.value = index }
function switchGiftCardType(index) { if (giftCardType.value == index) return; giftCardType.value = index }
function handleSwiperItemChange() { return true }
</script>

<style lang="scss" scoped>
.page {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background-color: $bg-color;
}

/* ===== Tab Bar ===== */
.tabbar {
	width: 100%;
	height: 96rpx;
	background: #FFFFFF;
	display: flex;
	align-items: stretch;
	font-size: 30rpx;
	flex-shrink: 0;
	box-shadow: $box-shadow;
}

.tab {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	color: $text-color-assist;
	position: relative;

	&--active {
		color: $color-primary;
		font-weight: 700;

		&::after {
			content: '';
			position: absolute;
			width: 40rpx;
			height: 6rpx;
			background: $color-primary;
			border-radius: 16rpx;
			bottom: 8rpx;
			left: calc((100% - 40rpx) / 2);
		}
	}
}

/* ===== Swiper ===== */
.swiper {
	flex: 1;
}

.swiper-item {
	height: 100%;
}

.scroll-area {
	height: 100%;
	padding-bottom: 100rpx;
}

.banner-img {
	width: 100%;
}

.section {
	padding: 0 24rpx;
}

.category-name {
	font-size: 30rpx;
	font-weight: 700;
	color: $text-color-base;
	margin: 24rpx 0 20rpx;
}

.theme-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.theme-card {
	width: 340rpx;
	margin-bottom: 20rpx;
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	overflow: hidden;
	box-shadow: $box-shadow;
}

.theme-img {
	width: 100%;
	border-radius: $border-radius-lg $border-radius-lg 0 0;
}

.theme-name {
	font-size: $font-size-base;
	color: $text-color-base;
	padding: 20rpx 0;
	text-align: center;
}

/* ===== Sub Header ===== */
.sub-header {
	height: 100rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 0 24rpx;
	font-size: $font-size-sm;
	flex-shrink: 0;
}

.sub-tabs {
	display: flex;
	gap: 12rpx;
}

.sub-tab {
	padding: 10rpx 24rpx;
	border-radius: 50rem;
	color: $text-color-assist;
	background: $bg-color;

	&--active {
		background: #FFFFFF;
		color: $color-primary;
		box-shadow: $box-shadow;
	}
}

.exchange-link {
	color: $color-primary;
}

/* ===== Empty ===== */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 100rpx;
}

.empty-img {
	width: 300rpx;
}

.empty-text {
	font-size: $font-size-sm;
	color: $text-color-assist;
	margin-top: 24rpx;
}

/* ===== Footer ===== */
.footer {
	z-index: 10;
	background: $bg-color;
	position: fixed;
	bottom: 0;
	width: 100%;
	height: 80rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: $font-size-sm;
	color: $color-primary;

	&--double {
		background: #FFFFFF;
		height: 100rpx;
		padding: 10rpx 30rpx;
		justify-content: space-between;
		box-shadow: 0 -4rpx 20rpx rgba(74, 59, 50, 0.04);

		button {
			width: 310rpx;
			height: 100%;
			border-radius: 48rpx !important;
			font-size: 28rpx;
			font-weight: 600;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}
}

.footer-divider {
	height: 24rpx;
	width: 2rpx;
	background: $color-primary;
	margin: 0 20rpx;
}

.flex-fill {
	flex: 1;
	overflow: hidden;
}
</style>
