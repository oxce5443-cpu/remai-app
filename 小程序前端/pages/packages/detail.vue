<template>
	<view class="page rm-page old-money">
		<image :src="pkgData.image" class="hero-img"></image>
		<view class="main">
			<view class="header-row">
				<view class="title">{{ $t(pkgData.title) }}</view>
				<view class="record-link">{{ $t("购买记录") }}</view>
			</view>
			<view class="coupon-count">{{ $t("共") }}{{ $t(couponNum) }}{{ $t("张优惠券") }}</view>

			<!-- Coupon List -->
			<view class="coupon-list">
				<view class="coupon" v-for="(coupon, index) in pkgData.coupons" :key="index" @tap="openCouponDetailModal(coupon)">
					<view class="coupon-main">
						<image :src="coupon.detail.image" class="coupon-img"></image>
						<view class="coupon-info">
							<view class="coupon-qty">x{{ $t(coupon.couponNum) }}</view>
							<view class="coupon-title">{{ $t(coupon.detail.couponTitle) }}</view>
							<view class="coupon-expire">{{ $t(coupon.detail.expire) }}</view>
						</view>
					</view>
					<view class="coupon-footer">
						<view class="coupon-time">{{ $t("使用时段：") }}{{ $t(coupon.detail && coupon.detail.couponUseTime[0].useTimeStart) }}-{{ $t(coupon.detail && coupon.detail.couponUseTime[0].useTimeEnd) }}</view>
						<view class="coupon-link">{{ $t("查看详情") }}</view>
					</view>
				</view>
			</view>

			<!-- Purchase Notice -->
			<view class="notice-title">{{ $t("购买须知") }}</view>
			<view class="notice-text">{{ $t("售卖时间：") }}{{ $t(pkgData.startAt.split(' ')[0]) }}~{{ $t(pkgData.endAt.split(' ')[0]) }}</view>
			<view class="notice-text" style="margin-bottom: 24rpx;">{{ $t("购买限制：无限制") }}</view>
			<view class="notice-desc">{{ $t($localized(pkgData, "content")) }}</view>
		</view>

		<!-- Pay Bar -->
		<view class="pay-bar">
			<button type="primary" class="pay-btn">￥{{ $t(pkgData.amount) }}{{ $t("购买") }}</button>
		</view>

		<!-- Coupon Detail Modal -->
		<modal custom :show="couponDetailModalShow" @cancel="closeCouponDetailModal">
			<view class="modal-body">
				<view class="modal-title">{{ $t(coupon.detail.couponTitle) }}</view>
				<view class="modal-expire">{{ $t(coupon.detail.expire) }}</view>
				<view class="modal-desc">{{ $t(coupon.detail.desc) }}</view>
			</view>
		</modal>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { api } from '@/api'
import modal from '@/components/modal/modal.vue'

const pkg = ref({ startAt: '', endAt: '' })
const pkgData = computed(() => pkg.value)
const coupon = ref({ detail: {} })
const couponDetailModalShow = ref(false)

const couponNum = computed(() =>
	pkg.value.coupons ? pkg.value.coupons.reduce((acc, c) => acc + c.couponNum, 0) : 0
)

onLoad(async (option) => {
	try {
		const list = await api.getPackages() || []
		const found = list.filter(item => item.id == option.id)[0]
		if (found) pkg.value = found
	} catch (e) {
		console.error('加载套餐详情失败', e)
	}
})

function openCouponDetailModal(c) {
	coupon.value = c
	couponDetailModalShow.value = true
}
function closeCouponDetailModal() { couponDetailModalShow.value = false }
</script>

<style lang="scss">
.page {
	background-color: $bg-color;
	min-height: 100vh;
}

.hero-img {
	width: 100%;
	height: 50vh;
}

.main {
	padding: 24rpx;
	padding-bottom: 160rpx;
}

.header-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12rpx;
}

.title {
	font-size: 30rpx;
	font-weight: 700;
	color: $text-color-base;
}

.record-link {
	font-size: $font-size-sm;
	color: $color-primary;
}

.coupon-count {
	font-size: $font-size-sm;
	color: $text-color-assist;
	margin-bottom: 24rpx;
}

/* ===== Coupon ===== */
.coupon {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 24rpx 28rpx;
	margin-bottom: 24rpx;
	box-shadow: $box-shadow;
	position: relative;

	&::before {
		content: " ";
		position: absolute;
		background-color: $bg-color;
		width: 32rpx;
		height: 32rpx;
		bottom: 68rpx;
		left: -16rpx;
		border-radius: 100%;
	}

	&::after {
		content: " ";
		position: absolute;
		background-color: $bg-color;
		width: 32rpx;
		height: 32rpx;
		bottom: 68rpx;
		right: -16rpx;
		border-radius: 100%;
	}
}

.coupon-main {
	display: flex;
	margin-bottom: 16rpx;
}

.coupon-img {
	width: 140rpx;
	height: 140rpx;
	border-radius: $border-radius-sm;
	margin-right: 28rpx;
	flex-shrink: 0;
}

.coupon-info {
	flex: 1;
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.coupon-qty {
	text-align: right;
	font-size: $font-size-sm;
	color: $text-color-assist;
	margin-bottom: 4rpx;
}

.coupon-title {
	font-size: 32rpx;
	font-weight: 600;
	color: $text-color-base;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-bottom: 6rpx;
}

.coupon-expire {
	font-size: $font-size-sm;
	color: $text-color-assist;
}

.coupon-footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	height: 64rpx;
	position: relative;

	&::before {
		content: '';
		border-top: 1rpx dashed $border-color;
		position: absolute;
		left: -28rpx;
		top: 0;
		right: -28rpx;
	}
}

.coupon-time {
	font-size: 22rpx;
	color: $text-color-assist;
}

.coupon-link {
	font-size: $font-size-sm;
	color: $color-primary;
}

/* ===== Notice ===== */
.notice-title {
	font-size: 32rpx;
	font-weight: 700;
	color: $text-color-base;
	margin-bottom: 20rpx;
	margin-top: 24rpx;
}

.notice-text {
	font-size: $font-size-base;
	color: $text-color-base;
}

.notice-desc {
	font-size: $font-size-sm;
	color: $text-color-assist;
	line-height: 44rpx;
	white-space: pre-line;
}

/* ===== Pay Bar ===== */
.pay-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 12rpx 24rpx 32rpx;
	background: #FFFFFF;
	box-shadow: 0 -4rpx 20rpx rgba(74, 59, 50, 0.04);
	z-index: 10;
}

.pay-btn {
	width: 90%;
	height: 80rpx;
	border-radius: 48rpx !important;
	font-size: 30rpx;
	font-weight: 700;
	background: linear-gradient(135deg, #A67B5B, #C9A96E) !important;
}

/* ===== Modal ===== */
.modal-body {
	padding: 32rpx;
}

.modal-title {
	font-size: 34rpx;
	font-weight: 700;
	color: $text-color-base;
	text-align: center;
	margin-bottom: 16rpx;
}

.modal-expire {
	font-size: $font-size-sm;
	color: $text-color-assist;
	text-align: center;
	margin-bottom: 32rpx;
}

.modal-desc {
	font-size: $font-size-sm;
	color: $text-color-assist;
	line-height: 42rpx;
	white-space: pre-line;
}
</style>
