<template>
	<view class="page rm-page old-money">
		<async-state :status="status" @retry="getPackages">
			<template #default>
				<view class="main">
					<view class="package-card" v-for="(item, index) in packages" :key="index" @tap="pay(item.id)">
						<image :src="item.image" class="package-img"></image>
						<view class="package-info">
							<view class="package-title">{{ $t(item.title) }}</view>
							<view class="package-bottom">
								<view class="package-price">￥{{ $t(item.amount) }}</view>
								<button type="primary" size="mini" plain class="buy-btn">{{ $t("去购买") }}</button>
							</view>
						</view>
					</view>
				</view>
			</template>
		</async-state>
		<view class="bottom-bar">{{ $t("购买记录") }}</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { api } from '@/api'
import asyncState from '@/components/async-state/async-state.vue'

const packages = ref([])
const status = ref('loading')

onLoad(() => getPackages())
onPullDownRefresh(async () => { await getPackages(); uni.stopPullDownRefresh() })

async function getPackages() {
	status.value = 'loading'
	try {
		packages.value = await api.getPackages() || []
		status.value = packages.value.length ? 'ready' : 'empty'
	} catch (e) {
		console.error('加载套餐失败', e)
		status.value = 'error'
	}
}
function pay(id) { uni.navigateTo({ url: '/pages/packages/detail?id=' + id }) }
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: $bg-color;
}

.main {
	padding: 24rpx;
	padding-bottom: 200rpx;
}

.package-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 24rpx;
	margin-bottom: 24rpx;
	display: flex;
	align-items: center;
	gap: 24rpx;
	box-shadow: $box-shadow;
}

.package-img {
	width: 200rpx;
	height: 160rpx;
	border-radius: $border-radius-base;
	flex-shrink: 0;
}

.package-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	height: 160rpx;
}

.package-title {
	font-size: 30rpx;
	font-weight: 600;
	color: $text-color-base;
	overflow: hidden;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}

.package-bottom {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.package-price {
	font-size: 32rpx;
	font-weight: 700;
	color: $text-color-base;
}

.buy-btn {
	height: 52rpx;
	width: 130rpx;
	font-size: 24rpx;
	border-radius: 50rpx !important;
	padding: 0;
	line-height: 52rpx;
	text-align: center;
	border-color: $color-primary !important;
	color: $color-primary !important;
}

.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	height: 120rpx;
	background: #FFFFFF;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: $font-size-base;
	color: $color-primary;
	box-shadow: 0 -4rpx 20rpx rgba(74, 59, 50, 0.04);
}
</style>
