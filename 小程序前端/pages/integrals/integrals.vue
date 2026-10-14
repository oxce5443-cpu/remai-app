<template>
	<view class="page rm-page old-money">
		<navbar-back-button></navbar-back-button>
		<view class="header">
			<image src="/static/images/integrals/bg.png" mode="scaleToFill"></image>
			<view class="header-overlay">
				<view class="header-left" @tap="flow">
					<image class="integral-icon" src="/static/images/integrals/integral.png"></image>
					<view class="points-num">{{ customPoints.totalPoints }}</view>
					<view class="points-label">积分</view>
					<image src="/static/images/icon/iconarrow-right.png" class="arrow-icon" mode="aspectFit"></image>
				</view>
				<view class="header-right">兑换记录</view>
			</view>
		</view>

		<view class="main">
			<!-- Sign In Card -->
			<view class="sign-card">
				<view class="sign-title">连续签到赚积分</view>
				<uni-steps :active="activeDay" :options="stepsOption"></uni-steps>
				<view class="sign-actions">
					<button type="primary" class="sign-btn" @tap="attendance">签到</button>
					<view class="calendar-link">查看签到日历</view>
				</view>
			</view>

			<!-- Banner -->
			<view class="banner">
				<image src="/static/images/integrals/points-banner.png" mode="widthFix"></image>
			</view>

			<!-- Points Mall -->
			<view class="mall-section" v-for="(items, cate) in pointsMall" :key="cate">
				<view class="mall-header">
					<view class="mall-title">{{ cate }}</view>
					<image src="/static/images/navigator.png" class="mall-arrow"></image>
				</view>
				<view class="mall-grid">
					<block v-for="(item, key) in items" :key="key">
						<view class="mall-item" @tap="detail(cate, item.id)">
							<image :src="item.img.length ? item.img[0] : '/static/images/integrals/ticket.png'" class="mall-img" mode="widthFix"></image>
							<view class="mall-info">
								<view class="mall-name">{{ item.goodsName }}</view>
								<view class="mall-price-row">
									<view class="mall-points">{{ item.pointsPrice }}<text class="mall-unit">积分</text></view>
									<template v-if="item.amount > 0">
										<text class="mall-plus">+</text>
										<view class="mall-points">{{ parseFloat(item.amount) }}<text class="mall-unit">元</text></view>
									</template>
								</view>
								<view class="mall-stock">剩余{{ item.goodsStock }}件</view>
							</view>
						</view>
					</block>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '@/api'
import navbarBackButton from '@/components/navbar-back-button.vue'
import uniSteps from '@/components/uni-steps/uni-steps.vue'

const customPoints = ref({})
const stepsOption = ref([])
const activeDay = ref(0)
const pointsMall = ref([])

onLoad(async () => {
	try {
		await getStepsOptions()
		customPoints.value = await api.getMember() || {}
		pointsMall.value = await api.getPointsGoods() || []
	} catch (e) {
		console.error('加载积分页失败', e)
	}
})

async function getStepsOptions() {
	const stepsOptions = []
	// 签到进度：V3 骨架对接 member.signIn 当日签到；历史/今日信息走会员与积分流水
	const attendance = await api.getPointsLog({ limit: 7 }) || []
	attendance.forEach((item, index) => {
		if (item.isDay) activeDay.value = index
		let arr = { title: item.dayName + '天', desc: '+' + item.points }
		if (index == attendance.length - 1) {
			arr.circle = '/static/images/integrals/goal.png'
			arr.circleStyle = 'width: 47rpx; height: 39rpx;'
		}
		stepsOptions.push(arr)
	})
	stepsOption.value = stepsOptions
}

function attendance() { uni.navigateTo({ url: '/pages/attendance/attendance' }) }
function flow() { uni.navigateTo({ url: '/pages/integrals/flow' }) }
function detail(cate, id) { uni.navigateTo({ url: '/pages/integrals/detail?cate=' + cate + '&id=' + id }) }
</script>

<style lang="scss">
.page {
	background-color: $bg-color;
	min-height: 100vh;
}

.header {
	position: relative;
	width: 100%;
	height: 33.333vh;

	image {
		width: 100%;
		height: 100%;
	}
}

.header-overlay {
	position: absolute;
	width: 100%;
	height: 33.333vh;
	display: flex;
	align-items: center;
	top: 0;
	left: 0;
}

.header-left {
	color: #FFFFFF;
	margin-left: 40rpx;
	flex: 1;
	display: flex;
	align-items: baseline;
}

.integral-icon {
	width: 64rpx;
	height: 64rpx;
	margin-right: 20rpx;
}

.points-num {
	font-size: 80rpx;
	font-weight: 700;
	margin-right: 10rpx;
}

.points-label {
	font-size: $font-size-base;
}

.arrow-icon {
	width: 28rpx;
	height: 28rpx;
	margin-left: 8rpx;
}

.header-right {
	background-color: #FFFFFF;
	color: $color-primary;
	font-size: $font-size-base;
	border-radius: 50rem 0 0 50rem;
	padding: 10rpx 30rpx;
}

/* ===== Main ===== */
.main {
	padding: 0 24rpx;
}

/* ===== Sign Card ===== */
.sign-card {
	position: relative;
	background-color: #FFFFFF;
	margin-top: -90rpx;
	margin-bottom: 24rpx;
	width: 100%;
	border-radius: $border-radius-lg;
	box-shadow: $box-shadow;
	padding: 32rpx 28rpx;
	display: flex;
	flex-direction: column;
}

.sign-title {
	font-size: 30rpx;
	font-weight: 700;
	color: $text-color-base;
	margin-bottom: 24rpx;
}

.sign-actions {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 24rpx;
}

.sign-btn {
	width: 60%;
	border-radius: 48rpx !important;
	font-size: 28rpx;
	font-weight: 600;
	background: linear-gradient(135deg, #A67B5B, #C9A96E) !important;
}

.calendar-link {
	font-size: $font-size-base;
	color: $color-primary;
	margin-top: 20rpx;
}

/* ===== Banner ===== */
.banner {
	width: 100%;
	margin-bottom: 24rpx;
	border-radius: $border-radius-lg;
	overflow: hidden;
	box-shadow: $box-shadow;

	image {
		width: 100%;
		display: block;
	}
}

/* ===== Mall ===== */
.mall-section {
	margin-bottom: 24rpx;
}

.mall-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.mall-title {
	font-size: 30rpx;
	font-weight: 700;
	color: $text-color-base;
}

.mall-arrow {
	width: 40rpx;
	height: 40rpx;
}

.mall-grid {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
}

.mall-item {
	width: 49%;
	margin-bottom: 20rpx;
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	overflow: hidden;
	box-shadow: $box-shadow;
}

.mall-img {
	width: 100%;
	display: block;
}

.mall-info {
	padding: 20rpx;
	overflow: hidden;
}

.mall-name {
	font-size: 28rpx;
	font-weight: 700;
	color: $text-color-base;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-bottom: 10rpx;
}

.mall-price-row {
	display: flex;
	align-items: baseline;
	margin-bottom: 6rpx;
}

.mall-points {
	font-size: $font-size-base;
	color: $color-primary;
	font-weight: 600;
}

.mall-unit {
	font-size: $font-size-sm;
	color: $text-color-assist;
	font-weight: 400;
}

.mall-plus {
	margin: 0 8rpx;
	font-size: $font-size-sm;
	color: $text-color-assist;
}

.mall-stock {
	font-size: $font-size-sm;
	color: $text-color-assist;
}
</style>
