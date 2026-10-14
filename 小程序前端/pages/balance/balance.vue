<template>
	<view class="page rm-page old-money">
		<view class="main">
			<view class="balance-card">
				<view class="balance-info">
					<view class="balance-label">账户余额（元）</view>
					<view class="balance-amount">{{ balance }}</view>
					<view class="balance-record" @tap="goToRecords">交易记录</view>
				</view>
				<image src="/static/images/balance.png" mode="widthFix" class="balance-img"></image>
			</view>

			<view class="section-title">储值套餐</view>

			<async-state :status="status" @retry="loadPackages">
				<template #default>
					<view class="amounts">
						<view class="amount"
							 :class="{'amount--selected': selectedIndex === index}"
							 v-for="(item, index) in packages" :key="index" @tap="handleSelected(index)">
							<view class="amount-value">{{ parseInt(item.amount) }}</view>
							<view class="amount-unit">元</view>
							<view class="amount-gift" v-if="item.giftAmount && Number(item.giftAmount) > 0">
								赠{{ item.giftAmount }}元
							</view>
						</view>
					</view>
				</template>
			</async-state>

			<view class="section-title" v-if="selectedPackage">使用说明</view>
			<view class="desc-text" v-if="selectedPackage">
				{{ selectedPackage.name || '储值后余额可用于店内消费，不可提现' }}
			</view>
		</view>

		<view class="bottom-bar">
			<view class="protocol">
				<image :src="agree ? '/static/images/icon/iconradio-button-on.png' : '/static/images/icon/iconradio-button-off.png'" class="radio-ico" mode="aspectFit" @tap="agree = !agree"></image>
				<text class="protocol-text">我已阅读并同意</text>
				<text class="protocol-link">《储值协议》</text>
			</view>
			<button type="primary" class="buy-btn" :disabled="!selectedPackage || !agree" @tap="handleRecharge">
				立即充值
			</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '@/api'
import asyncState from '@/components/async-state/async-state.vue'

const agree = ref(false)
const packages = ref([])
const selectedIndex = ref(-1)
const balance = ref('0.00')
const status = ref('loading')

const selectedPackage = computed(() => selectedIndex.value >= 0 ? packages.value[selectedIndex.value] : null)

onLoad(() => {
	loadPackages()
	loadBalance()
})

async function loadPackages() {
	status.value = 'loading'
	try {
		const data = await api.getCardPackages()
		packages.value = data || []
		status.value = packages.value.length ? 'ready' : 'empty'
		if (packages.value.length) selectedIndex.value = 0
	} catch (e) {
		console.error('加载套餐失败', e)
		status.value = 'error'
	}
}

async function loadBalance() {
	const token = uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
	if (!token) return
	try {
		const data = await api.getMember()
		if (data) balance.value = data.balance || '0.00'
	} catch (e) {
		console.error('加载余额失败', e)
	}
}

function handleSelected(index) { selectedIndex.value = index }

async function handleRecharge() {
	const token = uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
	if (!token) {
		uni.showToast({ title: '请先登录', icon: 'none' })
		setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 1000)
		return
	}
	if (!selectedPackage.value) { uni.showToast({ title: '请选择套餐', icon: 'none' }); return }
	if (!agree.value) { uni.showToast({ title: '请同意储值协议', icon: 'none' }); return }

	const res = await uni.showModal({
		title: '确认充值',
		content: `确定要充值${selectedPackage.value.amount}元吗？${selectedPackage.value.giftAmount ? `赠送${selectedPackage.value.giftAmount}元` : ''}`,
		confirmText: '确认充值',
		cancelText: '再想想'
	})
	if (!res.confirm) return

	try {
		uni.showLoading({ title: '充值中...' })
		await api.recharge({ packageId: selectedPackage.value._id })
		uni.showToast({ title: '充值成功', icon: 'success' })
		loadBalance()
		setTimeout(() => uni.navigateBack(), 1500)
	} catch (e) {
		uni.showToast({ title: e.message || '充值失败', icon: 'none' })
	} finally {
		uni.hideLoading()
	}
}

function goToRecords() { uni.showToast({ title: '交易记录功能开发中', icon: 'none' }) }
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: $bg-color;
	display: flex;
	flex-direction: column;
}

.main {
	flex: 1;
	padding: 24rpx;
	padding-bottom: 220rpx;
}

.balance-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 40rpx 28rpx;
	box-shadow: $box-shadow;
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 40rpx;
}

.balance-info {
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.balance-label {
	font-size: $font-size-sm;
	color: $text-color-base;
}

.balance-amount {
	font-size: 56rpx;
	font-weight: 700;
	color: $text-color-base;
}

.balance-record {
	font-size: $font-size-sm;
	color: $color-primary;
}

.balance-img {
	width: 280rpx;
	flex-shrink: 0;
}

.section-title {
	font-size: 30rpx;
	font-weight: 700;
	color: $text-color-base;
	margin-bottom: 24rpx;
}

.amounts {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	margin-bottom: 40rpx;

	.amount {
		width: calc(96% / 3);
		padding: 40rpx 0;
		margin-bottom: 20rpx;
		border-radius: $border-radius-base;
		background: #FFFFFF;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4rpx;
		box-shadow: $box-shadow-sm;
		color: $text-color-base;
		transition: all 0.2s;
		position: relative;

		&--selected {
			background: linear-gradient(135deg, #A67B5B, #C9A96E);
			color: #FFFFFF;
			box-shadow: 0 8rpx 24rpx rgba(166, 123, 91, 0.15);
		}
	}
}

.amount-value {
	font-size: 40rpx;
	font-weight: 700;
}

.amount-unit {
	font-size: $font-size-sm;
}

.amount-gift {
	position: absolute;
	top: -10rpx;
	right: -10rpx;
	background: #E6A23C;
	color: white;
	font-size: 20rpx;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	font-weight: 500;
}

.desc-text {
	font-size: $font-size-sm;
	color: $text-color-assist;
	line-height: 44rpx;
	white-space: pre-line;
}

.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #FFFFFF;
	padding: 0 40rpx;
	box-shadow: 0 -4rpx 20rpx rgba(74, 59, 50, 0.04);
	z-index: 100;
}

.protocol {
	display: flex;
	align-items: center;
	padding: 28rpx 0;
	font-size: $font-size-sm;
	gap: 8rpx;

	.iconfont {
		font-size: 32rpx;

		&.iconradio-button-on {
			color: $color-primary;
		}

		&.iconradio-button-off {
			color: $text-color-assist;
		}
	}
}

.protocol-text {
	color: $text-color-base;
}

.protocol-link {
	color: $color-primary;
}

.buy-btn {
	width: 100%;
	height: 88rpx;
	border-radius: 48rpx !important;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
	font-weight: 700;
	margin-bottom: 32rpx;
	background: linear-gradient(135deg, #A67B5B, #C9A96E) !important;
	box-shadow: 0 8rpx 24rpx rgba(166, 123, 91, 0.15);

	&[disabled] {
		opacity: 0.5;
	}
}
.radio-ico {
	width: 36rpx;
	height: 36rpx;
	vertical-align: middle;
}
</style>
