<template>
	<view class="page rm-page old-money">
		<view class="hero">
			<view class="hero-bg"></view>
			<view class="hero-content">
				<view class="logo">
						<view class="logo-icon">R</view>
						<view class="logo-text">{{ $t("热麦") }}</view>
						<view class="logo-sub">REMAI · BOULANGERIE</view>
					</view>
				<view class="hero-text">
					<view class="hero-title">{{ $t("甜蜜时光，一口幸福") }}</view>
					<view class="hero-subtitle">{{ $t("在热麦遇见美好") }}</view>
				</view>
			</view>
		</view>
		<view class="main">
			<!-- #ifdef H5 -->
				<button type="primary" size="default" class="login-btn" v-if="env.env === 'dev'" :loading="loading" @tap="login">
					{{ $t("开发环境登录") }}
				</button>
			<!-- #endif -->
			<!-- #ifdef MP-WEIXIN -->
				<button type="primary" size="default" class="login-btn" :loading="loading" @tap="loginByWeixin">
					<image src="/static/images/mine/wechat.png" class="wechat-icon"></image>
					{{ $t("微信一键登录") }}
				</button>
			<!-- #endif -->
			<view class="member-tip">{{ $t("新用户登录即加入会员，享会员权益") }}</view>
			<view class="benefits">
				<view class="benefit-item">
					<image src="/static/images/mine/rhyl.png" class="benefit-icon"></image>
					<text>{{ $t("入会有礼") }}</text>
				</view>
				<view class="benefit-item">
					<image src="/static/images/mine/jfdh.png" class="benefit-icon"></image>
					<text>{{ $t("积分兑换") }}</text>
				</view>
				<view class="benefit-item">
					<image src="/static/images/mine/sjtq.png" class="benefit-icon"></image>
					<text>{{ $t("升级特权") }}</text>
				</view>
				<view class="benefit-item">
					<image src="/static/images/mine/srtq.png" class="benefit-icon"></image>
					<text>{{ $t("生日特权") }}</text>
				</view>
			</view>
			<view class="rights-link" @tap="goBrand">{{ $t("REMAI 品牌故事") }} <text class="rights-arrow">→</text></view>
			<view class="rights-link rights-link--sub">{{ $t("会员权益说明") }}</view>
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue'
	import { useStore } from 'vuex'
	import { api, env } from '@/api'
	import { t } from '@/locale'

	const store = useStore()
	const loading = ref(false)

	function uniLogin() {
		return new Promise((resolve, reject) => {
			uni.login({ provider: 'weixin', success: resolve, fail: reject })
		})
	}

	function getUserProfile() {
		return new Promise((resolve) => {
			if (!uni.getUserProfile) {
				resolve({ userInfo: {} })
				return
			}
			uni.getUserProfile({
				desc: t('用于完善热麦烘焙会员资料'),
				success: resolve,
				fail: () => resolve({ userInfo: {} })
			})
		})
	}

	async function loginByWeixin() {
		if (loading.value) return
		loading.value = true
		try {
			const loginRes = await uniLogin()
			const profile = await getUserProfile()
			const data = await api.loginByWeixin({
				code: loginRes.code,
				userInfo: profile.userInfo || {}
			})
			const token = data.token || (data.tokenInfo && data.tokenInfo.token) || data.uniIdToken
			const member = data.userInfo || data.user || profile.userInfo || {}
			if (!token) {
				throw new Error('uni-id 未返回登录 token，请检查云端 uni-id 配置')
			}
			store.commit('SET_TOKEN', token)
			store.commit('SET_MEMBER', {
				_id: member._id || member.uid || data.uid || '',
				nickname: member.nickname || member.nickName || '微信用户',
				avatar: member.avatar || member.avatarUrl || '/static/images/mine/default.png',
				points: Number(member.points) || 0,
				balance: Number(member.balance) || 0,
				memberLevelName: member.memberLevelName || '黑金会员'
			})
			uni.showToast({ title: '登录成功', icon: 'success' })
			setTimeout(() => uni.navigateBack(), 500)
		} catch (error) {
			console.error('微信登录失败:', error)
			uni.showToast({ title: error.message || '登录失败，请稍后重试', icon: 'none' })
		} finally {
			loading.value = false
		}
	}

	function login() {
		if (env.env !== 'dev') return
		store.commit('SET_TOKEN', `dev_token_${Date.now()}`)
		store.commit('SET_MEMBER', {
			_id: 'dev_user',
			nickname: '热麦会员',
			avatar: '/static/images/mine/default.png',
			points: 2456,
			balance: 128.5,
			memberLevelName: '黑金会员'
		})
		uni.navigateBack()
	}

	function goBrand() {
		uni.navigateTo({ url: '/pages/brand/brand' })
	}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: $bg-color;
	display: flex;
	flex-direction: column;
}

.hero {
	position: relative;
	height: 52vh;
	overflow: hidden;
}

.hero-bg {
	position: absolute;
	inset: 0;
	background: linear-gradient(180deg, #F5EDE0 0%, $bg-color 100%);
}

.hero-content {
	position: relative;
	z-index: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	padding-top: 60rpx;
}

.logo {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 48rpx;
}

.logo-icon {
	width: 120rpx;
	height: 120rpx;
	border-radius: 32rpx;
	background: linear-gradient(135deg, #4A3427, #B8955B);
	display: flex;
	align-items: center;
	justify-content: center;
	font-family: Georgia, 'Times New Roman', serif;
	font-size: 52rpx;
	font-weight: 700;
	color: #FFF8EF;
	box-shadow: 0 12rpx 36rpx rgba(74,52,39,.18);
}

.logo-text {
	font-family: Georgia, 'Times New Roman', 'Songti SC', serif;
	font-size: 44rpx;
	font-weight: 700;
	color: #2A1E17;
	margin-top: 20rpx;
	letter-spacing: 8rpx;
}

.logo-sub {
	font-size: 18rpx;
	color: #9B8573;
	letter-spacing: 4rpx;
	margin-top: 6rpx;
}

.hero-text {
	text-align: center;
}

.hero-title {
	font-size: 36rpx;
	font-weight: 700;
	color: $text-color-base;
	margin-bottom: 16rpx;
	letter-spacing: 2rpx;
}

.hero-subtitle {
	font-size: $font-size-base;
	color: $text-color-assist;
	letter-spacing: 4rpx;
}

.main {
	flex: 1;
	padding: 0 48rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.login-btn {
	width: 100%;
	border-radius: 48rpx !important;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 96rpx;
	font-size: 32rpx;
	font-weight: 600;
	background: linear-gradient(135deg, #A67B5B, #C9A96E) !important;
	box-shadow: 0 12rpx 32rpx rgba(166, 123, 91, 0.15);
}

.wechat-icon {
	width: 40rpx;
	height: 34rpx;
	margin-right: 12rpx;
}

.member-tip {
	font-size: $font-size-base;
	color: $text-color-assist;
	margin-top: 32rpx;
	margin-bottom: 48rpx;
}

.benefits {
	display: flex;
	justify-content: space-around;
	width: 100%;
	margin-bottom: 60rpx;
}

.benefit-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	font-size: $font-size-sm;
	color: $text-color-assist;

	image {
		width: 72rpx;
		height: 72rpx;
	}
}

.rights-link {
	font-size: $font-size-base;
	color: $color-primary;
	padding-bottom: 60rpx;
}

.rights-link:first-of-type {
	padding-bottom: 14rpx;
}

.rights-link--sub {
	color: $t-secondary;
	font-size: $font-size-sm;
	padding-bottom: 10rpx;
}

.rights-arrow {
	margin-left: 6rpx;
	font-size: 26rpx;
}
</style>
