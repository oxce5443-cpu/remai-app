<template>
	<view class="page rm-page old-money">
		<view class="masthead">
			<view class="point-num">{{ pointNum }}</view>
			<view class="rule-link">查看积分规则</view>
		</view>
		<view class="list">
			<view class="flow-item" v-for="(item, index) in pointsFlow" :key="index">
				<view class="flow-left">
					<view class="flow-reason">{{ item.reason }}</view>
					<view class="flow-date">{{ item.createdAt }}</view>
				</view>
				<view class="flow-right">
					<view class="flow-change" :class="{ 'flow-change--plus': item.changeType == 1 }">
						{{ item.changeType == 1 ? '+' : '-' }}{{ item.changeNum }}
					</view>
					<view class="flow-seller">{{ item.sellerName }}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue'
	import { onLoad } from '@dcloudio/uni-app'
	import { useStore } from 'vuex'
	import { api } from '@/api'

	const store = useStore()
	const pointNum = ref(0)
	const pointsFlow = ref([])
	const loading = ref(true)

	onLoad(async () => {
		const member = store.state.member || {}
		pointNum.value = member.points || 0
		try {
			const list = await api.getPointsLog()
			pointsFlow.value = Array.isArray(list) ? list : []
		} catch (e) {
			pointsFlow.value = []
		} finally {
			loading.value = false
		}
	})
</script>

<style lang="scss" scoped>
.page {
	background-color: $bg-color;
	min-height: 100vh;
}

.masthead {
	height: 280rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	background: #FFFFFF;
	margin: 20rpx 24rpx;
	border-radius: $border-radius-lg;
	box-shadow: $box-shadow;

	&::after {
		content: '';
		position: absolute;
		border-bottom: 1rpx solid $border-color;
		bottom: 0;
		right: 24rpx;
		left: 24rpx;
	}
}

.point-num {
	font-size: 72rpx;
	font-weight: 700;
	color: $text-color-base;
	margin-bottom: 12rpx;
}

.rule-link {
	font-size: $font-size-sm;
	color: $color-primary;
}

.list {
	padding: 0 24rpx;
}

.flow-item {
	background: #FFFFFF;
	border-radius: $border-radius-base;
	padding: 28rpx 24rpx;
	margin-bottom: 12rpx;
	display: flex;
	align-items: center;
	box-shadow: $box-shadow;
}

.flow-left {
	flex: 1;
	overflow: hidden;
}

.flow-reason {
	font-size: 30rpx;
	color: $text-color-base;
	margin-bottom: 10rpx;
}

.flow-date {
	font-size: $font-size-base;
	color: $text-color-assist;
}

.flow-right {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	flex-shrink: 0;
	margin-left: 16rpx;
}

.flow-change {
	font-size: 30rpx;
	font-weight: 700;
	color: $text-color-base;

	&--plus {
		color: $color-primary;
	}
}

.flow-seller {
	font-size: $font-size-sm;
	color: $text-color-assist;
	margin-top: 4rpx;
}
</style>
