<template>
	<view class="page rm-page old-money">
		<!-- Invoice Type & Content -->
		<view class="card">
			<view class="info-row">
				<view class="label">发票类型</view>
				<view class="info-main">
					<view class="info-title">电子普通发票</view>
					<view class="info-sub">电子发票与纸质普通发票具备同等法律效益，可支持报销入账</view>
				</view>
			</view>
			<view class="info-row">
				<view class="label">发票内容</view>
				<view class="info-main">食品</view>
			</view>
			<view class="info-row info-row--last">
				<view class="label">发票抬头</view>
				<view class="radio-group">
					<view class="radio" :class="{'radio--checked': !form.taitou}" @tap="form.taitou=0">个人</view>
					<view class="radio" :class="{'radio--checked': form.taitou}" @tap="form.taitou=1">公司</view>
				</view>
			</view>
		</view>

		<!-- Form -->
		<view class="card">
			<view class="form-row">
				<view class="label">姓名</view>
				<view class="form-input">
					<input type="text" v-model="form.username" placeholder="请输入姓名" placeholder-class="placeholder"/>
					<text class="required">必填</text>
				</view>
			</view>
			<view class="form-row">
				<view class="label">邮箱地址</view>
				<view class="form-input">
					<input type="text" v-model="form.email" placeholder="请输入邮箱地址" placeholder-class="placeholder"/>
					<text class="required">必填</text>
				</view>
			</view>
			<view class="form-row form-row--last">
				<view class="label">手机号</view>
				<view class="form-input">
					<input type="text" v-model="form.telphone" placeholder="请输入手机号码" placeholder-class="placeholder"/>
					<text class="required">必填</text>
				</view>
			</view>
		</view>

		<!-- Buttons -->
		<view class="btn-bar">
			<view class="btn-item">
				<button type="primary" plain>导入发票抬头</button>
			</view>
			<view class="btn-item">
				<button type="primary">提交</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive } from 'vue'
const form = reactive({ taitou: 0, username: '', email: '', telphone: '' })
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: $bg-color;
	padding: 20rpx 24rpx;
	padding-bottom: 180rpx;
}

.card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	box-shadow: $box-shadow;
	margin-bottom: 20rpx;
	overflow: hidden;
}

/* ===== Info Row ===== */
.info-row {
	display: flex;
	padding: 28rpx;
	border-bottom: 1rpx solid $border-color;
	font-size: $font-size-sm;

	&--last {
		border-bottom: none;
	}
}

.label {
	width: 150rpx;
	color: $text-color-assist;
	flex-shrink: 0;
}

.info-main {
	flex: 1;
	color: $text-color-base;
}

.info-title {
	margin-bottom: 6rpx;
}

.info-sub {
	font-size: 20rpx;
	color: $text-color-assist;
}

/* ===== Radio ===== */
.radio-group {
	display: flex;
	gap: 16rpx;
}

.radio {
	padding: 10rpx 30rpx;
	border-radius: 16rpx;
	border: 2rpx solid $border-color;
	color: $text-color-assist;
	font-size: $font-size-base;

	&--checked {
		background: $color-primary;
		color: #FFFFFF;
		border-color: $color-primary;
	}
}

/* ===== Form Row ===== */
.form-row {
	display: flex;
	align-items: center;
	padding: 28rpx;
	border-bottom: 1rpx solid $border-color;
	font-size: $font-size-sm;

	&--last {
		border-bottom: none;
	}
}

.form-input {
	flex: 1;
	display: flex;
	align-items: center;

	input {
		flex: 1;
		margin-right: 16rpx;
		font-size: $font-size-sm;
		color: $text-color-base;
	}
}

.placeholder {
	font-size: $font-size-sm;
	color: $text-color-assist;
}

.required {
	color: $color-error;
	font-size: 22rpx;
}

/* ===== Bottom Bar ===== */
.btn-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #FFFFFF;
	box-shadow: 0 -4rpx 20rpx rgba(74, 59, 50, 0.04);
	display: flex;
	align-items: center;
	justify-content: space-evenly;
	padding: 16rpx 24rpx 32rpx;
	z-index: 10;
}

.btn-item {
	flex: 1;
	padding: 0 8rpx;

	button {
		width: 100%;
		border-radius: 48rpx !important;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 26rpx;
		font-weight: 600;

		&[plain] {
			border: 1rpx solid $color-primary;
			color: $color-primary;
		}
	}
}
</style>
