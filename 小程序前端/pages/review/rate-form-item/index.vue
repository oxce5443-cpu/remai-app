<template>
	<list-cell :hover="false" last class="w-100 d-flex align-items-baseline">
		<view class="font-size-extra-lg text-color-primary mr-40">{{ $t(label) }}</view>
		<view class="flex-fill d-flex flex-column">
			<view class="d-flex align-items-center mb-20">
				<image v-for="(item, index) in 5" :key="index" @tap="handleScoreClick(index)"
					   :src="value > index ? '/static/images/icon/iconshoucangfill-caramel.png' : '/static/images/icon/iconshoucang-gray.png'"
					   class="score-ico"
					   :style="{opacity: (value <= index) || !value ? 1 : value / 5 + 0.1}"
					   mode="aspectFit">
				</image>
			</view>
			<view class="font-size-base text-color-base">{{ $t(tips) }}</view>
		</view>
	</list-cell>
</template>

<script>
	import listCell from '@/components/list-cell/list-cell'

	export default {
		name: 'rateFormItem',
		components: {
			listCell
		},
		props: {
			value: {
				type: Number,
				default: 0
			},
			label: {
				type: String,
				default: ''
			},
			tips: {
				type: String,
				default: ''
			}
		},
		data() {
			return {}
		},
		methods: {
			handleScoreClick(index) {
				this.$emit('input', index + 1)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.score-ico {
		width: 56rpx;
		height: 56rpx;
		margin-right: 20rpx;
	}
</style>
