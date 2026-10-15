<template>
	<view class="page rm-page old-money">
		<view class="main">
			<!-- Store Info -->
			<view class="store-card">
				<view class="store-name">{{ $t(storename) }}</view>
				<view class="store-meta">
					<text>{{ $t(date) }}</text>
					<text>{{ $t(typeCate == 1 ? '堂食' : '外卖') }}</text>
				</view>
			</view>

			<!-- Rating Form -->
			<view class="rate-card">
				<rate-form-item v-model="form.scoreService" :label="$t(&quot;服务&quot;)" :tips="$t(&quot;能感受到良好的服务态度吗？&quot;)"></rate-form-item>
				<rate-form-item v-model="form.scoreOrder" :label="$t(&quot;点单&quot;)" :tips="$t(&quot;点单有恰当的介绍，快速准确地下单吗？&quot;)"></rate-form-item>
				<rate-form-item v-model="form.scoreSpeed" :label="$t(&quot;速度&quot;)" :tips="$t(&quot;出品的速度您认为可接受吗？&quot;)"></rate-form-item>
				<rate-form-item v-model="form.scoreProduct" :label="$t(&quot;产品&quot;)" :tips="$t(&quot;您享用的蛋糕或糕点，如您所期待吗？&quot;)"></rate-form-item>
				<rate-form-item v-model="form.scoreEnviroment" :label="$t(&quot;环境&quot;)" :tips="$t(&quot;门店环境和清洁卫生，您满意吗？&quot;)"></rate-form-item>
			</view>

			<!-- Opinion -->
			<view class="opinion-card">
				<textarea v-model="form.opinion" :placeholder="$t(&quot;如果您有什么意见和建议，请告诉我们，我们会认真聆听&quot;)"
					placeholder-class="opinion-placeholder"/>
				<view class="opinion-count">{{ $t(form.opinion.length) }}/500</view>
			</view>
		</view>

		<!-- Submit -->
		<view class="btn-bar">
			<button type="primary" @tap="submit">{{ $t("提交评论") }}</button>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import rateFormItem from './rate-form-item/index.vue'

const form = reactive({
	scoreService: 0,
	scoreOrder: 0,
	scoreSpeed: 0,
	scoreProduct: 0,
	scoreEnviroment: 0,
	opinion: ''
})
const storename = ref('')
const typeCate = ref(1)
const date = ref('')

onLoad((opt) => {
	storename.value = opt.storename
	typeCate.value = Number(opt.typeCate) || 1
	date.value = opt.date
})

function submit() {
	if (!form.scoreService || !form.scoreOrder || !form.scoreSpeed || !form.scoreProduct || !form.scoreEnviroment) {
		uni.showToast({ title: '请先选择评论内容', icon: 'none' })
		return
	}
	uni.showToast({ title: '提交成功' })
	uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background-color: $bg-color;
}

.main {
	padding: 20rpx 24rpx;
	padding-bottom: 160rpx;
}

/* ===== Store Card ===== */
.store-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 28rpx;
	box-shadow: $box-shadow;
	margin-bottom: 20rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.store-name {
	font-size: 30rpx;
	font-weight: 700;
	color: $text-color-base;
	flex: 1;
}

.store-meta {
	display: flex;
	gap: 16rpx;
	font-size: $font-size-base;
	color: $text-color-assist;
	flex-shrink: 0;
}

/* ===== Rate Card ===== */
.rate-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 8rpx 28rpx;
	box-shadow: $box-shadow;
	margin-bottom: 20rpx;
}

/* ===== Opinion ===== */
.opinion-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 24rpx;
	box-shadow: $box-shadow;

	textarea {
		width: 100%;
		background: $bg-color;
		border-radius: $border-radius-sm;
		padding: 20rpx;
		font-size: $font-size-sm;
		color: $text-color-base;
		min-height: 200rpx;
		box-sizing: border-box;
	}
}

.opinion-placeholder {
	font-size: $font-size-sm;
	color: $text-color-assist;
}

.opinion-count {
	text-align: right;
	font-size: $font-size-sm;
	color: $text-color-assist;
	margin-top: 12rpx;
}

/* ===== Bottom Bar ===== */
.btn-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #FFFFFF;
	padding: 16rpx 24rpx 32rpx;
	box-shadow: 0 -4rpx 20rpx rgba(74, 59, 50, 0.04);
	z-index: 10;

	button {
		width: 90%;
		height: 88rpx;
		border-radius: 48rpx !important;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: 600;
		background: linear-gradient(135deg, #A67B5B, #C9A96E) !important;
		margin: 0 auto;
	}
}
</style>
