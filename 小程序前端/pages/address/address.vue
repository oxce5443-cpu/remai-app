<template>
	<view class="page rm-page old-money">
		<view class="main">
			<view v-if="!addresses.length" class="empty-state">
				<image src="/static/images/empty.png" class="empty-img"></image>
				<view class="empty-title">{{ $t("暂无地址信息") }}</view>
				<view class="empty-desc">{{ $t("请点击底部按钮添加地址信息") }}</view>
			</view>
			<template v-else>
				<uni-swipe-action>
					<uni-swipe-action-item class="address-item" :options="swipeOption" @click="handleSwipeClick(address.id)" v-for="(address, index) in addresses" :key="index">
						<view class="address-card" @tap="chooseAddress(address)">
							<view class="address-info">
								<view class="address-street">
									<text v-if="address.isDefault" class="default-tag">{{ $t("默认") }}</text>
									{{ address.province }}{{ address.city }}{{ address.area }}{{ address.street }}
								</view>
								<view class="address-contact">
									{{ address.acceptName }} {{ address.mobile }}
								</view>
							</view>
							<image src="/static/images/edit.png" class="edit-icon" @tap.stop="edit(address.id)"></image>
						</view>
					</uni-swipe-action-item>
				</uni-swipe-action>
			</template>
		</view>
		<view class="btn-bar">
			<button type="primary" size="default" @tap="add">{{ $t("新增地址") }}</button>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useStore } from 'vuex'
import { api } from '@/api'
import uniSwipeAction from '@/components/uni-swipe-action/uni-swipe-action.vue'
import uniSwipeActionItem from '@/components/uni-swipe-action-item/uni-swipe-action-item.vue'

const store = useStore()
const scene = ref('menu')
const isChoose = ref(false)

const addresses = computed(() => store.state.addresses || [])

const swipeOption = [
	{ text: '删除', style: { backgroundColor: '#C4696B' } }
]

onLoad((opt) => {
	isChoose.value = opt.is_choose ? true : false
	scene.value = opt.scene || 'menu'
	loadAddresses()
})
onShow(() => loadAddresses())

async function loadAddresses() {
	const token = uni.getStorageSync('token') || uni.getStorageSync('uni_id_token') || ''
	if (!token) return
	try {
		const list = await api.getAddresses() || []
		const mapped = list.map(item => ({ ...item, id: item._id }))
		store.commit('SET_ADDRESSES', mapped)
	} catch (e) {
		console.error('加载地址失败', e)
	}
}

function add() { uni.navigateTo({ url: '/pages/address/add' }) }
function edit(id) { uni.navigateTo({ url: '/pages/address/add?id=' + id }) }

function handleSwipeClick(id) {
	uni.showModal({
		title: '提示',
		content: '确定要删除？',
		success: async (res) => {
			if (!res.confirm) return
			try {
				uni.showLoading({ title: '删除中...' })
				await api.deleteAddress({ id })
				await loadAddresses()
				uni.showToast({ title: '删除成功！', icon: 'success' })
			} catch (e) {
				uni.showToast({ title: e.message || '删除失败', icon: 'none' })
			} finally {
				uni.hideLoading()
			}
		}
	})
}

function chooseAddress(address) {
	if (!isChoose.value) return
	store.commit('SET_ADDRESS', address)
	store.commit('SET_ORDER_TYPE', 'takeout')
	if (scene.value === 'menu') uni.switchTab({ url: '/pages/menu/menu' })
	else if (scene.value === 'pay') uni.navigateBack()
}
</script>

<style lang="scss" scoped>
page {
	height: 100%;
	background-color: $bg-color;
}

.page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background-color: $bg-color;
}

.main {
	flex: 1;
	padding: 24rpx;
	overflow-y: auto;
}

/* ===== Empty State ===== */
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding-top: 200rpx;
}

.empty-img {
	width: 200rpx;
	height: 200rpx;
	margin-bottom: 24rpx;
	opacity: 0.4;
}

.empty-title {
	font-size: 30rpx;
	color: $text-color-base;
	margin-bottom: 10rpx;
}

.empty-desc {
	font-size: $font-size-sm;
	color: $text-color-assist;
}

/* ===== Address Card ===== */
.address-item {
	margin-bottom: 20rpx;
}

.address-card {
	background: #FFFFFF;
	border-radius: $border-radius-lg;
	padding: 28rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	box-shadow: $box-shadow;
}

.address-info {
	flex: 1;
	overflow: hidden;
}

.address-street {
	font-size: 28rpx;
	font-weight: 600;
	color: $text-color-base;
	margin-bottom: 10rpx;
	line-height: 1.4;
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.default-tag {
	flex-shrink: 0;
	padding: 2rpx 12rpx;
	background: linear-gradient(135deg, #A67B5B, #C9A96E);
	color: white;
	font-size: 20rpx;
	border-radius: 4rpx;
	font-weight: 500;
}

.address-contact {
	font-size: $font-size-sm;
	color: $text-color-assist;
}

.edit-icon {
	width: 48rpx;
	height: 48rpx;
	flex-shrink: 0;
	margin-left: 16rpx;
}

/* ===== Bottom Bar ===== */
.btn-bar {
	flex-shrink: 0;
	padding: 16rpx 30rpx 32rpx;
	background: #FFFFFF;
	box-shadow: 0 -4rpx 20rpx rgba(74, 59, 50, 0.04);

	button {
		width: 100%;
		border-radius: 48rpx !important;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		font-weight: 700;
	}
}
</style>
