<template>
	<view class="login-screen">
		<!-- 左侧品牌面板 -->
		<view class="brand-panel">
			<view class="brand-inner">
				<view class="brand-eyebrow">REMAI · BAKERY</view>
				<view class="brand-name">热麦烘焙</view>
				<view class="brand-divider"></view>
				<view class="brand-tagline">
					<view class="tagline-line">每日现烤 · 匠心手作</view>
					<view class="tagline-line">从烤箱到餐桌的温度</view>
				</view>
				<view class="brand-footer">
					<view class="brand-version">OPS CONSOLE · v1.0</view>
				</view>
			</view>
		</view>

		<!-- 右侧表单区 -->
		<view class="form-panel">
			<view class="form-inner">
				<view class="form-heading">
					<view class="form-title">商户后台登录</view>
					<view class="form-subtitle">SIGN IN TO OPERATIONS</view>
				</view>

				<view class="login-form">
					<view class="field">
						<view class="field-label">管理员账号</view>
						<input class="field-input" type="text" v-model="form.username" placeholder="请输入账号" placeholder-class="field-placeholder" />
					</view>
					<view class="field">
						<view class="field-label">登录密码</view>
						<input class="field-input" type="password" v-model="form.password" password placeholder="请输入密码" placeholder-class="field-placeholder" />
					</view>
					<button class="login-btn" @click="handleLogin" :loading="loading">
						<text class="btn-text">登 录</text>
					</button>
				</view>

				<view class="form-tip">账号与密码由 uniCloud 环境变量统一配置</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'
import { adminRequest } from '@/utils/api'

const form = ref({ username: '', password: '' })
const loading = ref(false)

async function handleLogin() {
	if (!form.value.username || !form.value.password) {
		uni.showToast({ title: '请填写账号和密码', icon: 'none' })
		return
	}
	loading.value = true
	try {
		const result = await adminRequest('login', {
			username: form.value.username,
			password: form.value.password
		})
		if (result && result.token) {
			uni.setStorageSync('admin_token', result.token)
			uni.setStorageSync('admin_user', result.user || {})
			uni.showToast({ title: '登录成功', icon: 'success' })
			setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 500)
		} else {
			uni.showToast({ title: '登录失败', icon: 'none' })
		}
	} catch (e) {
		uni.showToast({ title: e.message || '账号或密码错误', icon: 'none' })
	} finally {
		loading.value = false
	}
}
</script>

<style scoped>
/* ===== 整体分栏布局 ===== */
.login-screen {
	min-height: 100vh;
	display: flex;
	background: #F8F4EE;
}

/* ===== 左侧品牌面板（对齐既有 hero-band 渐变） ===== */
.brand-panel {
	width: 45%;
	min-height: 100vh;
	background:
		radial-gradient(ellipse at 30% 20%, rgba(217, 179, 140, 0.18), transparent 60%),
		radial-gradient(ellipse at 70% 85%, rgba(184, 133, 91, 0.25), transparent 55%),
		linear-gradient(135deg, #4A3427 0%, #B8855B 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
	overflow: hidden;
}

/* 装饰性细金线圆环 */
.brand-panel::before {
	content: '';
	position: absolute;
	width: 520rpx;
	height: 520rpx;
	border: 1rpx solid rgba(248, 244, 238, 0.2);
	border-radius: 50%;
	top: -160rpx;
	right: -120rpx;
}
.brand-panel::after {
	content: '';
	position: absolute;
	width: 340rpx;
	height: 340rpx;
	border: 1rpx solid rgba(248, 244, 238, 0.12);
	border-radius: 50%;
	bottom: -100rpx;
	left: -80rpx;
}

.brand-inner {
	position: relative;
	z-index: 1;
	padding: 80rpx;
	max-width: 620rpx;
}

.brand-eyebrow {
	font-size: 20rpx;
	letter-spacing: 6rpx;
	color: rgba(248, 244, 238, 0.7);
	font-weight: 500;
	text-transform: uppercase;
	margin-bottom: 32rpx;
}

.brand-name {
	font-size: 88rpx;
	font-weight: 700;
	color: #F8F4EE;
	letter-spacing: 12rpx;
	line-height: 1.1;
	font-family: 'Songti SC', 'STSong', 'SimSun', serif;
}

.brand-divider {
	width: 80rpx;
	height: 3rpx;
	background: #D9B38C;
	margin: 40rpx 0;
}

.brand-tagline {
	margin-top: 48rpx;
}

.tagline-line {
	font-size: 26rpx;
	color: rgba(248, 244, 238, 0.75);
	line-height: 1.9;
	letter-spacing: 3rpx;
}

.brand-footer {
	position: absolute;
	bottom: 60rpx;
	left: 80rpx;
}

.brand-version {
	font-size: 18rpx;
	letter-spacing: 2rpx;
	color: rgba(248, 244, 238, 0.5);
}

/* ===== 右侧表单区 ===== */
.form-panel {
	flex: 1;
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #F8F4EE;
	padding: 60rpx 40rpx;
}

.form-inner {
	width: 100%;
	max-width: 520rpx;
}

.form-heading {
	margin-bottom: 64rpx;
}

.form-title {
	font-size: 44rpx;
	font-weight: 700;
	color: #4A3427;
	letter-spacing: 2rpx;
	line-height: 1.2;
}

.form-subtitle {
	font-size: 18rpx;
	letter-spacing: 4rpx;
	color: #B8855B;
	margin-top: 12rpx;
	text-transform: uppercase;
}

/* ===== 表单字段：下划线式 ===== */
.field {
	margin-bottom: 44rpx;
}

.field-label {
	font-size: 22rpx;
	color: #665F57;
	letter-spacing: 1rpx;
	margin-bottom: 12rpx;
	font-weight: 500;
}

.field-input {
	width: 100%;
	height: 76rpx;
	border: none;
	border-bottom: 2rpx solid #EFE5D9;
	background: transparent;
	font-size: 30rpx;
	color: #332D27;
	padding: 0;
	outline: none;
	transition: border-color 0.2s;
}

.field-input:focus {
	border-bottom-color: #B8855B;
}

.field-placeholder {
	color: #C4B5A0;
	font-size: 28rpx;
}

/* ===== 登录按钮：深棕底，对齐品牌 ===== */
.login-btn {
	width: 100%;
	height: 88rpx;
	background: #4A3427;
	color: #F8F4EE;
	border-radius: 999rpx;
	font-size: 30rpx;
	font-weight: 600;
	letter-spacing: 8rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 20rpx;
	border: none;
	transition: all 0.25s;
}

.login-btn::after {
	border: none;
}

.login-btn:hover {
	background: #5C4434;
	transform: translateY(-2rpx);
	box-shadow: 0 12rpx 28rpx rgba(74, 52, 39, 0.25);
}

.login-btn[loading] {
	opacity: 0.7;
}

/* ===== 底部提示 ===== */
.form-tip {
	text-align: center;
	font-size: 20rpx;
	color: #999188;
	margin-top: 56rpx;
	letter-spacing: 1rpx;
}

/* ===== 移动端适配：堆叠布局 ===== */
@media (max-width: 768px) {
	.login-screen {
		flex-direction: column;
	}
	.brand-panel {
		width: 100%;
		min-height: 300rpx;
		padding: 60rpx 0;
	}
	.brand-inner {
		padding: 0 50rpx;
	}
	.brand-name {
		font-size: 64rpx;
	}
	.brand-tagline {
		display: none;
	}
	.brand-footer {
		display: none;
	}
	.form-panel {
		min-height: auto;
		padding: 60rpx 50rpx;
	}
}
</style>
