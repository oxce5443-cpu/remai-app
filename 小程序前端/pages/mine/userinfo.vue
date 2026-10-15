<template>
	<view class="page rm-page old-money">
		<!-- Form Card -->
		<view class="form-card">
			<view class="form-item">
				<view class="label">{{ $t("昵称") }}</view>
				<view class="input-wrap">
					<input type="text" :placeholder="$t(&quot;请填写昵称&quot;)" placeholder-class="placeholder" v-model="member.nickname">
				</view>
			</view>
			<view class="form-item">
				<view class="label">{{ $t("手机号码") }}</view>
				<view class="input-wrap">
					<input type="text" v-model="member.mobilePhone" disabled>
				</view>
			</view>
			<view class="form-item">
				<view class="label">{{ $t("性别") }}</view>
				<view class="radio-group">
					<view class="radio" :class="{'radio--checked': member.gender == '1'}" @tap="member.gender=1">{{ $t("先生") }}</view>
					<view class="radio" :class="{'radio--checked': member.gender == '2'}" @tap="member.gender=2">{{ $t("女士") }}</view>
				</view>
			</view>
			<view class="form-item">
				<view class="label">{{ $t("生日") }}</view>
				<view class="input-wrap">
					<picker mode="date" :value="date" :start="startDate" :end="endDate" v-if="!member.birthday" @change="handleDateChange">
						<view class="picker-text">{{ $t("生日当天有惊喜") }}</view>
					</picker>
					<input type="text" v-else :value="member.birthday" disabled>
				</view>
			</view>
			<view class="form-item form-item--last">
				<view class="label">{{ $t("入会时间") }}</view>
				<view class="input-wrap">
					<input type="text" v-model="member.openingCardDate" disabled>
				</view>
			</view>
		</view>

		<!-- Save Button -->
		<view class="btn-section">
			<button type="primary" class="save-btn" @tap="save">{{ $t("保存") }}</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useStore } from 'vuex'

const store = useStore()
const member = ref({})
const date = ref(getDate())

const startDate = computed(() => getDate('start'))
const endDate = computed(() => getDate('end'))

onLoad(() => { member.value = { ...store.state.member } })

function getDate(type) {
	const d = new Date()
	let y = d.getFullYear()
	let m = d.getMonth() + 1
	let day = d.getDate()
	if (type === 'start') y -= 60
	else if (type === 'end') y += 2
	m = m > 9 ? m : '0' + m
	day = day > 9 ? day : '0' + day
	return `${y}-${m}-${day}`
}
function handleDateChange(e) { member.value.birthday = e.target.value }
function save() {
	Object.assign(store.state.member, member.value)
	store.commit('SET_MEMBER', member.value)
	uni.navigateBack()
}
</script>

<style lang="scss" scoped>
page {
	height: 100%;
	background-color: $bg-color;
}

.page {
	min-height: 100vh;
	padding: 24rpx;
	display: flex;
	flex-direction: column;
}

.form-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	box-shadow: $box-shadow;
	overflow: hidden;
	flex: 1;
}

.form-item {
	display: flex;
	align-items: center;
	padding: 32rpx 28rpx;
	border-bottom: 1rpx solid $border-color;

	&--last {
		border-bottom: none;
	}
}

.label {
	width: 160rpx;
	font-size: $font-size-base;
	color: $text-color-base;
	font-weight: 600;
	flex-shrink: 0;
}

.input-wrap {
	flex: 1;

	input {
		font-size: $font-size-base;
		color: $text-color-base;
	}
}

.placeholder {
	font-size: $font-size-base;
	color: $text-color-assist;
}

.picker-text {
	font-size: $font-size-base;
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

/* ===== Save ===== */
.btn-section {
	padding: 60rpx 0 32rpx;
	display: flex;
	justify-content: center;
}

.save-btn {
	width: 90%;
	height: 88rpx;
	border-radius: 48rpx !important;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 30rpx;
	font-weight: 700;
	background: linear-gradient(135deg, #A67B5B, #C9A96E) !important;
}
</style>
