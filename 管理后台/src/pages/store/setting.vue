<template>
	<view class="page">
		<view class="card">
			<view class="card-title">门店信息</view>
			<el-form :model="form" label-width="120rpx">
				<el-form-item label="门店名称">
					<el-input v-model="form.name" placeholder="请输入门店名称" />
				</el-form-item>
				<el-form-item label="门店地址">
					<el-input v-model="form.address" placeholder="请输入门店地址" />
				</el-form-item>
				<el-form-item label="联系电话">
					<el-input v-model="form.tel" placeholder="请输入联系电话" />
				</el-form-item>
			</el-form>
		</view>

		<view class="card">
			<view class="card-title">价格设置</view>
			<el-form :model="form" label-width="120rpx">
				<el-form-item label="起送价">
					<el-input-number v-model="form.min_price" :min="0" :precision="2" />
				</el-form-item>
				<el-form-item label="打包费">
					<el-input-number v-model="form.packing_fee" :min="0" :precision="2" />
				</el-form-item>
				<el-form-item label="配送费">
					<el-input-number v-model="form.delivery_fee" :min="0" :precision="2" />
				</el-form-item>
			</el-form>
		</view>

		<view class="card">
			<view class="card-title">门店公告</view>
			<el-input type="textarea" v-model="form.notice" placeholder="请输入门店公告" :rows="4" />
		</view>

		<view class="save-btn">
			<el-button type="primary" @click="handleSave" :loading="loading">保存设置</el-button>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminRequest } from '../../utils/api.js'

const form = ref({
	name: '',
	address: '',
	tel: '',
	min_price: 0,
	packing_fee: 0,
	delivery_fee: 0,
	notice: ''
})

const loading = ref(false)

onMounted(() => {
	loadStore()
})

async function loadStore() {
	try {
		const data = await adminRequest('getStore')
		if (data) {
			form.value = { ...form.value, ...data }
		}
	} catch (e) {
		console.error('加载门店信息失败', e)
	}
}

async function handleSave() {
	loading.value = true
	try {
		await adminRequest('updateStore', form.value)
		uni.showToast({ title: '保存成功' })
	} catch (e) {
		uni.showToast({ title: '保存失败', icon: 'none' })
	} finally {
		loading.value = false
	}
}
</script>

<style scoped>
.page {
	padding: 20rpx;
}

.card {
	background: #fff;
	border-radius: 16rpx;
	padding: 30rpx;
	margin-bottom: 20rpx;
}

.card-title {
	font-size: 32rpx;
	font-weight: 600;
	margin-bottom: 20rpx;
}

.save-btn {
	padding: 20rpx;
}
</style>
