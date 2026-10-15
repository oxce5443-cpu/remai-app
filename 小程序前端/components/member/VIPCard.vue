<template>
	<view class="vip-card">
		<view class="vip-card__inner">
			<view class="vip-card__top">
				<view class="vip-card__avatar">
					<image :src="member.avatar || '/static/images/mine/default.png'" mode="aspectFill"></image>
				</view>
				<view class="vip-card__user-info">
					<view class="vip-card__nickname">{{ member.nickname || $t('热麦会员') }}</view>
					<view class="vip-card__level">
						<view class="vip-card__level-badge">
							<image src="/static/images/mine/level.png"></image>
							<text>{{ $t(member.memberLevel || 'VIP') }}</text>
						</view>
					</view>
				</view>
			</view>
			<view class="vip-card__progress" v-if="member.currentValue !== undefined">
				<view class="vip-card__progress-bar">
					<view class="vip-card__progress-fill" :style="{width: growthPercent + '%'}"></view>
				</view>
				<view class="vip-card__progress-text">
					{{ $t("成长值") }} {{ $t(member.currentValue || 0) }}/{{ $t((member.currentValue || 0) + (member.needValue || 0)) }}
				</view>
			</view>
			<view class="vip-card__stats">
				<view class="vip-card__stat" v-for="stat in stats" :key="stat.label" @tap="stat.action">
					<view class="vip-card__stat-value">{{ $t(stat.value) }}</view>
					<view class="vip-card__stat-label">{{ $t(stat.label) }}</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	props: {
		member: { type: Object, default: () => ({}) },
		stats: { type: Array, default: () => [] }
	},
	computed: {
		growthPercent() {
			const { currentValue, needValue } = this.member
			if (!currentValue || !needValue) return 0
			return Math.min(currentValue / (currentValue + needValue) * 100, 100)
		}
	}
}
</script>

<style lang="scss" scoped>
.vip-card {
	background: linear-gradient(160deg, $vip-bg, #3D322B);
	border-radius: $border-radius-xl;
	padding: 4rpx;
	box-shadow: 0 20rpx 48rpx rgba(30, 26, 24, 0.12);

	&__inner {
		background: linear-gradient(160deg, #2A2320, #1E1A18);
		border-radius: $border-radius-xl - 4rpx;
		padding: 32rpx 28rpx;
		border: 1rpx solid rgba($vip-gold, 0.15);
	}

	&__top {
		display: flex;
		align-items: center;
		gap: 20rpx;
		margin-bottom: 24rpx;
	}

	&__avatar {
		width: 88rpx;
		height: 88rpx;
		border-radius: 50%;
		border: 2rpx solid $vip-gold;
		overflow: hidden;

		image {
			width: 100%;
			height: 100%;
		}
	}

	&__user-info {
		flex: 1;
	}

	&__nickname {
		font-size: 32rpx;
		font-weight: 700;
		color: $vip-gold;
		margin-bottom: 8rpx;
	}

	&__level-badge {
		display: inline-flex;
		align-items: center;
		gap: 6rpx;
		color: $vip-gold;
		font-size: $font-size-sm;

		image {
			width: 28rpx;
			height: 28rpx;
		}
	}

	&__progress-bar {
		height: 6rpx;
		background: rgba(255,255,255,0.08);
		border-radius: 16rpx;
		margin-bottom: 10rpx;
		overflow: hidden;
	}

	&__progress-fill {
		height: 100%;
		background: linear-gradient(90deg, $vip-gold, #A67B5B);
		border-radius: 16rpx;
		transition: width 0.6s ease;
	}

	&__progress-text {
		font-size: 20rpx;
		color: rgba(255,255,255,0.4);
		margin-bottom: 24rpx;
	}

	&__stats {
		display: flex;
		justify-content: space-around;
		padding-top: 20rpx;
		border-top: 1rpx solid rgba(255,255,255,0.06);
	}

	&__stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6rpx;
	}

	&__stat-value {
		font-size: 30rpx;
		font-weight: 700;
		color: $vip-gold;
	}

	&__stat-label {
		font-size: 22rpx;
		color: rgba(255,255,255,0.4);
	}
}
</style>
