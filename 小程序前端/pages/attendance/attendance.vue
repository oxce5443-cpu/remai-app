<template>
	<view class="page rm-page old-money">
		<navbar-back-button></navbar-back-button>
		<view class="header">
			<image src="/static/images/attendance/bg.png" mode="scaleToFill"></image>
			<view class="user-bar">
				<view class="avatar-wrap">
					<image :src="member.avatar" class="avatar-img"></image>
				</view>
				<view class="nickname">{{ member.nickname }}</view>
				<view class="rule-tag">签到规则</view>
			</view>
		</view>

		<view class="main">
			<!-- Points Card -->
			<view class="points-card">
				<view class="points-title">当前积分</view>
				<view class="points-value">{{ customPoints.totalPoints }}</view>
				<button type="primary" class="checkin-btn" @tap="attendance">签到</button>
			</view>

			<!-- Calendar -->
			<uni-calendar :show-month="false" :start-date="startDate"
						  :selected="attendanceList"
						  :continuous="todayAttendance.attendanceContinuityDay">
			</uni-calendar>
		</view>

		<!-- Attendance Modal -->
		<modal custom :show="attendanceModalVisible">
			<view class="modal-box">
				<view class="modal-header">
					<image src="/static/images/attendance/cup.png" mode="widthFix"></image>
				</view>
				<view class="modal-content">
					<view>赠送的1积分已发到您的账户中</view>
					<view>连续签到1天可额外获得1积分</view>
				</view>
				<view class="modal-footer">
					<button type="primary" class="modal-btn" @tap="attendanceModalVisible=false">我知道了</button>
				</view>
			</view>
		</modal>
	</view>
</template>

<script setup>
	import { ref, computed } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { useStore } from 'vuex'
	import request, { api } from '@/api'
	import navbarBackButton from '@/components/navbar-back-button.vue'
	import uniCalendar from '@/pages/attendance/uni-calendar/uni-calendar.vue'
	import modal from '@/components/modal/modal.vue'

	const store = useStore()
	const member = computed(() => store.state.member || { avatar: '/static/images/mine/default.png', nickname: '热麦会员' })
	const customPoints = ref({})
	const attendanceModalVisible = ref(false)
	const attendanceList = ref([])
	const todayAttendance = ref({})
	const startDate = ref('')
	const signing = ref(false)

	onLoad(async () => {
		const date = new Date()
		startDate.value = `${date.getFullYear()}-${date.getMonth() + 1}-01`
		try {
			const [points, list, today] = await Promise.all([
				request('customPoints').catch(() => ({})),
				request('attendanceList').catch(() => []),
				request('todayAttendance').catch(() => ({}))
			])
			customPoints.value = points
			attendanceList.value = Array.isArray(list) ? list : []
			todayAttendance.value = today
		} catch (e) {
			console.error('[attendance] load', e)
		}
	})

	async function attendance() {
		if (signing.value) return
		signing.value = true
		try {
			await api.signIn() // member.signIn，按日幂等
			attendanceModalVisible.value = true
			// 刷新积分与连续签到
			const [points, today] = await Promise.all([
				request('customPoints').catch(() => ({})),
				request('todayAttendance').catch(() => ({}))
			])
			customPoints.value = points
			todayAttendance.value = today
		} catch (e) {
			uni.showToast({ title: e.message || '签到失败，请稍后重试', icon: 'none' })
		} finally {
			signing.value = false
		}
	}
</script>

<style lang="scss" scoped>
.page {
	background-color: $bg-color;
	min-height: 100vh;
}

/* ===== Header ===== */
.header {
	width: 100%;
	height: 33.333vh;
	position: relative;

	> image {
		width: 100%;
		height: 100%;
	}
}

.user-bar {
	position: absolute;
	width: 100%;
	top: var(--status-bar-height);
	bottom: 0;
	left: 0;
	display: flex;
	align-items: center;
	color: #FFFFFF;
}

.avatar-wrap {
	margin-left: 30rpx;
	background-color: #FFFFFF;
	padding: 6rpx;
	border-radius: 100%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 20rpx;
}

.avatar-img {
	width: 100rpx;
	height: 100rpx;
	border-radius: 100%;
}

.nickname {
	font-size: 30rpx;
	flex: 1;
}

.rule-tag {
	font-size: $font-size-sm;
	border-radius: 50rem 0 0 50rem;
	background-color: rgba(255, 255, 255, 0.3);
	padding: 10rpx 30rpx;
}

/* ===== Main ===== */
.main {
	padding: 0 24rpx;
}

/* ===== Points Card ===== */
.points-card {
	position: relative;
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 36rpx 28rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: -70rpx;
	margin-bottom: 24rpx;
	box-shadow: $box-shadow;
}

.points-title {
	font-size: $font-size-sm;
	color: $text-color-base;
	margin-bottom: 16rpx;
}

.points-value {
	font-size: 48rpx;
	font-weight: 700;
	color: $text-color-base;
	margin-bottom: 28rpx;
}

.checkin-btn {
	font-size: 30rpx;
	font-weight: 600;
	color: #FFFFFF;
	border-radius: 48rpx !important;
	width: 70%;
	background: linear-gradient(135deg, #A67B5B, #C9A96E) !important;
}

/* ===== Calendar ===== */
:deep(.uni-calendar) {
	margin-bottom: 24rpx;
	border-radius: $border-radius-lg;
	box-shadow: $box-shadow;
	overflow: hidden;
}

/* ===== Modal ===== */
.modal-box {
	background: #FFFFFF;
	border-radius: $border-radius-xl;
	overflow: hidden;
}

.modal-header {
	width: 100%;
	margin-top: -180rpx;
	position: relative;

	image {
		width: 100%;
	}
}

.modal-content {
	padding: 40rpx 32rpx;
	text-align: center;
	font-size: $font-size-sm;
	color: $text-color-base;
	line-height: 44rpx;
}

.modal-footer {
	padding: 0 32rpx 32rpx;
}

.modal-btn {
	width: 100%;
	border-radius: 48rpx !important;
	font-size: 28rpx;
	font-weight: 600;
}
</style>
