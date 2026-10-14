<template>
	<view class="loading">
		<image src="/static/images/loading.gif"></image>
	</view>
</template>

<script>
	export default {
		name: 'Loading',
		data() {
			return {
				
			}
		}
	}
</script>

<style lang="scss">
	.loading {
		width: 100%;
		height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: $bg-color;

		image {
			width: 260rpx;
			height: 260rpx;
			position: relative;
			margin-top: -100rpx;
		}
	}
</style>
