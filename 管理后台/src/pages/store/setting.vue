<template>
	<view class="page">
    <LanguageSwitch />
		<view class="card">
			<view class="card-title">{{ $t("门店信息") }}</view>
			<el-form :model="form" label-width="120rpx">
				<el-form-item :label="$t(&quot;门店名称&quot;)">
					<el-input v-model="form.name" :placeholder="$t(&quot;请输入门店名称&quot;)" />
				</el-form-item>
				<el-form-item :label="$t(&quot;门店地址&quot;)">
					<el-input v-model="form.address" :placeholder="$t(&quot;请输入门店地址&quot;)" />
				</el-form-item>
				<el-form-item :label="$t(&quot;英文名称&quot;)">
					<el-input v-model="form.name_en" placeholder="Optional English store name" />
				</el-form-item>
				<el-form-item :label="$t(&quot;英文地址&quot;)">
					<el-input v-model="form.address_en" placeholder="Optional English address" />
				</el-form-item>
				<el-form-item :label="$t(&quot;联系电话&quot;)">
					<el-input v-model="form.tel" :placeholder="$t(&quot;请输入联系电话&quot;)" />
				</el-form-item>
			</el-form>
		</view>

		<view class="card">
			<view class="card-title">{{ $t("价格设置") }}</view>
			<el-form :model="form" label-width="120rpx">
				<el-form-item :label="$t(&quot;起送价&quot;)">
					<el-input-number v-model="form.min_price" :min="0" :precision="2" />
				</el-form-item>
				<el-form-item :label="$t(&quot;打包费&quot;)">
					<el-input-number v-model="form.packing_fee" :min="0" :precision="2" />
				</el-form-item>
				<el-form-item :label="$t(&quot;配送费&quot;)">
					<el-input-number v-model="form.delivery_fee" :min="0" :precision="2" />
				</el-form-item>
			</el-form>
		</view>

		<view class="card">
			<view class="card-title">{{ $t("门店公告") }}</view>
			<el-input type="textarea" v-model="form.notice" :placeholder="$t(&quot;请输入门店公告&quot;)" :rows="4" />
			<el-input type="textarea" v-model="form.notice_en" placeholder="Optional English notice" :rows="4" />
		</view>

		<view class="save-btn">
			<el-button type="primary" @click="handleSave" :loading="loading">{{ $t("保存设置") }}</el-button>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminRequest } from '../../utils/api.js'

const form = ref({
	name: '',
	name_en: '',
	address: '',
	address_en: '',
	tel: '',
	min_price: 0,
	packing_fee: 0,
	delivery_fee: 0,
	notice: '',
	notice_en: ''
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
