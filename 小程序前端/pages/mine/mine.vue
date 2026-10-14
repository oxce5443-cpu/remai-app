<template>
	<view class="page rm-page old-money">
		<!-- 顶部安全区 -->
		<view class="safe-top"></view>

		<!-- Nav -->
		<view class="nav">
			<view class="nav-title">小麦的朋友</view>
			<view class="nav-sub">REMAI MEMBER</view>
		</view>

		<!-- Profile -->
		<view class="profile" @tap="ensureLogin">
			<view class="avatar-wrap">
				<image :src="displayMember.avatar" mode="aspectFill" class="avatar"></image>
			</view>
			<view class="profile-main">
				<view class="profile-name">{{ displayMember.nickname }}</view>
				<view class="profile-sub" v-if="displayMember.mobile">ID:{{ displayMember.mobile }}</view>
				<view class="profile-sub" v-else>{{ token ? '已登录热麦会员' : '登录后享受会员权益' }}</view>
			</view>
			<view class="profile-badge">{{ displayMember.memberLevelName }}</view>
		</view>

		<!-- REMAIL MEMBER Card -->
		<view class="member-card" @tap="ensureLogin">
			<view class="member-card-top">
				<text class="member-brand">REMAI会员</text>
				<text class="member-vip">VIP</text>
			</view>
			<view class="member-card-mid">
				<view class="member-level">{{ displayMember.memberLevelName }}</view>
				<view class="member-dates">02/06</view>
			</view>
			<view class="member-card-bottom">
				<text>会员权益</text>
				<text class="member-card-arrow">→</text>
			</view>
		</view>

		<!-- Data Row -->
		<view class="data-row">
			<view class="data-cell" @tap="coupons">
				<text class="data-num">优惠券</text>
				<text class="data-label">去查看</text>
			</view>
			<view class="data-cell" @tap="integrals">
				<text class="data-num">{{ displayMember.points }}</text>
				<text class="data-label">积分</text>
			</view>
			<view class="data-cell" @tap="balance">
				<text class="data-num">{{ displayMember.balance }}</text>
				<text class="data-label">余额</text>
			</view>
		</view>

		<!-- Function List -->
		<view class="menu-card">
			<view class="menu-row" @tap="orders">
				<image src="/static/images/mine/wddd.png" class="menu-icon-img" mode="aspectFit"></image>
				<text class="menu-label">我的订单</text>
				<text class="menu-arrow">→</text>
			</view>
			<view class="menu-row" @tap="coupons">
				<image src="/static/images/icon/iconliwu.png" class="menu-icon-img" mode="aspectFit"></image>
				<text class="menu-label">优惠券</text>
				<text class="menu-arrow">→</text>
			</view>
			<view class="menu-row" @tap="integrals">
				<image src="/static/images/mine/jfdh.png" class="menu-icon-img" mode="aspectFit"></image>
				<text class="menu-label">积分商城</text>
				<text class="menu-arrow">→</text>
			</view>
			<view class="menu-row" @tap="memberCode">
				<image src="/static/images/mine/rhyl.png" class="menu-icon-img" mode="aspectFit"></image>
				<text class="menu-label">会员权益</text>
				<text class="menu-arrow">→</text>
			</view>
			<view class="menu-row" @tap="helpCenter">
				<image src="/static/images/mine/lxkf.png" class="menu-icon-img" mode="aspectFit"></image>
				<text class="menu-label">联系客服</text>
				<text class="menu-arrow">→</text>
			</view>
			<view class="menu-row" style="border-bottom: none;" @tap="userinfo">
				<image src="/static/images/icon/iconwode.png" class="menu-icon-img" mode="aspectFit"></image>
				<text class="menu-label">设置</text>
				<text class="menu-arrow">→</text>
			</view>
		</view>

		<view class="safe-bottom"></view>
	</view>
</template>

<script setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import { api } from '@/api'

const store = useStore()
const member = computed(() => store.state.member || {})
const token = computed(() => store.state.token)

const displayMember = computed(() => {
	const mobile = member.value.mobile || member.value.username || ''
	return {
		avatar: member.value.avatar || '/static/images/mine/default.png',
		nickname: member.value.nickname || '热麦会员',
		mobile: mobile ? mobile.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : '',
		points: Number(member.value.points) || 0,
		balance: Number(member.value.balance) || 0,
		memberLevelName: member.value.memberLevelName || '黑金会员'
	}
})

onShow(() => { if (token.value) loadMemberInfo() })

async function loadMemberInfo() {
	try {
		const data = await api.getMember()
		if (data) store.commit('SET_MEMBER', data)
	} catch (e) {
		console.error('加载会员信息失败', e)
	}
}

function ensureLogin() {
	if (!token.value) uni.navigateTo({ url: '/pages/login/login' })
}
function navigateProtected(url) {
	if (!token.value) {
		uni.navigateTo({ url: '/pages/login/login' })
		return
	}
	uni.navigateTo({ url })
}
function memberCode() { navigateProtected('/pages/mine/member-code') }
function coupons() { navigateProtected('/pages/coupons/coupons') }
function integrals() { navigateProtected('/pages/integrals/integrals') }
function orders() { navigateProtected('/pages/orders/orders') }
function balance() { navigateProtected('/pages/balance/balance') }
function helpCenter() { navigateProtected('/pages/services/help-center') }
function userinfo() { navigateProtected('/pages/mine/userinfo') }
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	padding: 0 32rpx calc(env(safe-area-inset-bottom) + 48rpx);
	background:
		radial-gradient(circle at 80% 8%, rgba(232, 197, 192, .30), transparent 34%),
		$bg-page;
	color: $t-primary;
}

.safe-top {
	height: env(safe-area-inset-top);
}

/* ═══ Nav ═══ */
.nav {
	padding: 32rpx 0 24rpx;
}

.nav-title {
	font-family: $font-serif;
	font-size: 44rpx;
	font-weight: 700;
	color: $c-brown;
}

.nav-sub {
	margin-top: 4rpx;
	font-size: 20rpx;
	letter-spacing: 4rpx;
	color: $t-tertiary;
}

/* ═══ Profile ═══ */
.profile {
	display: flex;
	align-items: center;
	padding: 10rpx 0 26rpx;
}

.avatar-wrap {
	width: 108rpx;
	height: 108rpx;
	border-radius: 50%;
	overflow: hidden;
	border: 3rpx solid $c-ivory;
	box-shadow: $shadow-sm;
	background: $bg-soft;
	flex-shrink: 0;
	margin-right: 22rpx;
}

.avatar {
	width: 100%;
	height: 100%;
}

.profile-main {
	flex: 1;
	min-width: 0;
}

.profile-name {
	font-size: 34rpx;
	font-weight: 700;
	color: $t-primary;
}

.profile-sub {
	margin-top: 8rpx;
	font-size: 22rpx;
	color: $t-tertiary;
}

.profile-badge {
	padding: 8rpx 22rpx;
	border-radius: $r-full;
	background: $c-brown;
	color: #EAD0A2;
	font-size: 21rpx;
	font-weight: 600;
	letter-spacing: 2rpx;
}

/* ═══ Member Card ═══ */
.member-card {
	border-radius: $r-2xl;
	background: linear-gradient(140deg, #4A3427 0%, #33251C 60%, #2A1D16 100%);
	padding: 34rpx 34rpx 28rpx;
	box-shadow: 0 20rpx 48rpx rgba(42, 29, 22, .35);
	position: relative;
	overflow: hidden;
}

.member-card::after {
	content: '';
	position: absolute;
	top: -60rpx;
	right: -40rpx;
	width: 220rpx;
	height: 220rpx;
	border-radius: 50%;
	background: radial-gradient(circle, rgba(232, 197, 192, .16), transparent 65%);
}

.member-card-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.member-brand {
	font-family: $font-serif;
	font-size: 26rpx;
	letter-spacing: 5rpx;
	color: #EAD0A2;
}

.member-vip {
	font-size: 20rpx;
	letter-spacing: 3rpx;
	color: rgba(234, 208, 162, .9);
	border: 1rpx solid rgba(234, 208, 162, .5);
	border-radius: $r-full;
	padding: 4rpx 16rpx;
}

.member-card-mid {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	margin-top: 36rpx;
}

.member-level {
	font-family: $font-serif;
	font-size: 44rpx;
	font-weight: 700;
	color: #FFF8EF;
	letter-spacing: 3rpx;
}

.member-dates {
	font-family: $font-serif;
	font-size: 30rpx;
	color: rgba(234, 208, 162, .75);
	letter-spacing: 4rpx;
}

.member-card-bottom {
	display: flex;
	align-items: center;
	justify-content: space-between;
	margin-top: 30rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid rgba(255, 248, 239, .12);
	font-size: 22rpx;
	color: rgba(255, 248, 239, .75);
	letter-spacing: 2rpx;
}

.member-card-arrow {
	font-size: 26rpx;
	color: #EAD0A2;
}

/* ═══ Data Row ═══ */
.data-row {
	display: flex;
	margin: 22rpx 0;
	background: $c-ivory;
	border-radius: $r-xl;
	border: 1rpx solid rgba(74, 52, 39, .05);
	box-shadow: $shadow-xs;
	padding: 26rpx 0;
}

.data-cell {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	border-right: 1rpx solid rgba(74, 52, 39, .06);

	&:last-child { border-right: none; }
}

.data-num {
	font-family: $font-serif;
	font-size: 32rpx;
	font-weight: 700;
	color: $c-brown;
}

.data-label {
	font-size: 21rpx;
	color: $t-tertiary;
}

/* ═══ Menu List ═══ */
.menu-card {
	background: $c-ivory;
	border-radius: $r-xl;
	border: 1rpx solid rgba(74, 52, 39, .05);
	box-shadow: $shadow-xs;
	padding: 6rpx 26rpx;
}

.menu-row {
	display: flex;
	align-items: center;
	padding: 28rpx 0;
	border-bottom: 1rpx solid rgba(74, 52, 39, .05);
}

.menu-icon-img {
	width: 44rpx;
	height: 44rpx;
	margin-right: 20rpx;
	flex-shrink: 0;
}

.menu-icon {
	font-size: 30rpx;
	margin-right: 20rpx;
	width: 40rpx;
	text-align: center;
}

.menu-label {
	flex: 1;
	font-size: 28rpx;
	color: $t-primary;
	font-weight: 500;
}

.menu-arrow {
	font-size: 28rpx;
	color: $t-tertiary;
}

.safe-bottom {
	height: 24rpx;
}
</style>
