<template>
	<view class="coupon-container">
		<!-- 操作栏 -->
		<view class="action-bar">
			<el-button type="primary" @click="handleAdd">新增优惠券</el-button>
		</view>

		<!-- 优惠券表格 -->
		<view class="table-box">
			<el-table :data="couponList" v-loading="loading" stripe>
				<el-table-column prop="title" label="名称" min-width="120" />
				<el-table-column prop="type" label="类型" min-width="100">
					<template #default="{ row }">
						<el-tag v-if="row.type === 'discount'" type="primary">满减券</el-tag>
						<el-tag v-else-if="row.type === 'cash'" type="success">代金券</el-tag>
						<el-tag v-else-if="row.type === 'gift'" type="warning">礼品券</el-tag>
						<el-tag v-else>{{ row.type }}</el-tag>
					</template>
				</el-table-column>
				<el-table-column prop="value" label="面值" min-width="100">
					<template #default="{ row }">
						<template v-if="row.type === 'cash'">¥{{ formatMoney(row.value) }}</template>
						<template v-else>{{ row.value }}{{ row.type === 'discount' ? '折' : '' }}</template>
					</template>
				</el-table-column>
				<el-table-column prop="min_price" label="门槛价" min-width="100">
					<template #default="{ row }">
						{{ Number(row.min_price || 0) > 0 ? '满' + formatMoney(row.min_price) : '无门槛' }}
					</template>
				</el-table-column>
				<el-table-column prop="start_time" label="有效期" min-width="200">
					<template #default="{ row }">
						{{ formatDate(row.start_time) }} ~ {{ formatDate(row.end_time) }}
					</template>
				</el-table-column>
				<el-table-column prop="remain_count" label="剩余数量" min-width="100">
					<template #default="{ row }">
						{{ row.remain_count }}/{{ row.total_count }}
					</template>
				</el-table-column>
				<el-table-column label="操作" fixed="right" width="180">
					<template #default="{ row }">
						<el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
						<el-button link type="danger" @click="handleDelete(row)">删除</el-button>
					</template>
				</el-table-column>
			</el-table>
		</view>

		<!-- 分页 -->
		<view class="pagination-box">
			<el-pagination
				v-model:current-page="pagination.page"
				v-model:page-size="pagination.pageSize"
				:total="pagination.total"
				:page-sizes="[10, 20, 50, 100]"
				layout="total, sizes, prev, pager, next, jumper"
				@size-change="handleSizeChange"
				@current-change="handlePageChange"
			/>
		</view>

		<!-- 新增/编辑对话框 -->
		<el-dialog
			v-model="dialogVisible"
			:title="isEdit ? '编辑优惠券' : '新增优惠券'"
			width="500px"
		>
			<el-form :model="couponForm" :rules="rules" ref="formRef" label-width="100px">
				<el-form-item label="名称" prop="title">
					<el-input v-model="couponForm.title" placeholder="请输入优惠券名称" />
				</el-form-item>
				<el-form-item label="类型" prop="type">
					<el-select v-model="couponForm.type" placeholder="请选择类型" style="width: 100%">
						<el-option label="满减券" value="discount" />
						<el-option label="代金券" value="cash" />
						<el-option label="礼品券" value="gift" />
					</el-select>
				</el-form-item>
				<el-form-item label="面值" prop="value">
					<el-input-number
						v-model="couponForm.value"
						:min="0"
						:precision="2"
						controls-position="right"
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item label="门槛价" prop="min_price">
					<el-input-number
						v-model="couponForm.min_price"
						:min="0"
						:precision="2"
						controls-position="right"
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item label="开始时间" prop="start_time">
					<el-date-picker
						v-model="couponForm.start_time"
						type="datetime"
						placeholder="选择开始时间"
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item label="结束时间" prop="end_time">
					<el-date-picker
						v-model="couponForm.end_time"
						type="datetime"
						placeholder="选择结束时间"
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item label="发放数量" prop="total_count">
					<el-input-number
						v-model="couponForm.total_count"
						:min="1"
						controls-position="right"
						style="width: 100%"
					/>
				</el-form-item>
				<el-form-item label="描述">
					<el-input v-model="couponForm.description" type="textarea" placeholder="请输入描述" />
				</el-form-item>
			</el-form>
			<template #footer>
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" @click="confirmSubmit" :loading="submitting">确认</el-button>
			</template>
		</el-dialog>
	</view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminRequest, formatDate, formatMoney } from '@/utils/api.js'

const loading = ref(false)
const couponList = ref([])

// 分页
const pagination = reactive({
	page: 1,
	pageSize: 10,
	total: 0
})

// 对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

// 表单
const couponForm = reactive({
	_id: '',
	title: '',
	type: 'discount',
	value: 0,
	min_price: 0,
	start_time: '',
	end_time: '',
	total_count: 100,
	is_show: true,
	description: ''
})

// 表单验证规则
const rules = {
	title: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
	type: [{ required: true, message: '请选择类型', trigger: 'change' }],
	value: [{ required: true, message: '请输入面值', trigger: 'blur' }],
	start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
	end_time: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
	total_count: [{ required: true, message: '请输入发放数量', trigger: 'blur' }]
}

// 获取优惠券列表
async function fetchCoupons() {
	loading.value = true
	try {
		const res = await adminRequest('getCoupons', {
			page: pagination.page,
			pageSize: pagination.pageSize
		})
		couponList.value = Array.isArray(res) ? res : []
		pagination.total = couponList.value.length
	} catch (e) {
		ElMessage.error(e.message || '获取优惠券列表失败')
	} finally {
		loading.value = false
	}
}

// 新增
function handleAdd() {
	isEdit.value = false
	couponForm._id = ''
	couponForm.title = ''
	couponForm.type = 'discount'
	couponForm.value = 0
	couponForm.min_price = 0
	couponForm.start_time = ''
	couponForm.end_time = ''
	couponForm.total_count = 100
	couponForm.is_show = true
	couponForm.description = ''
	dialogVisible.value = true
}

// 编辑
function handleEdit(row) {
	isEdit.value = true
	couponForm._id = row._id || row.id
	couponForm.title = row.title
	couponForm.type = row.type
	couponForm.value = row.value
	couponForm.min_price = Number(row.min_price || 0)
	couponForm.start_time = row.start_time
	couponForm.end_time = row.end_time
	couponForm.total_count = row.total_count
	couponForm.is_show = row.is_show !== false
	couponForm.description = row.description || ''
	dialogVisible.value = true
}

// 删除
async function handleDelete(row) {
	try {
		await ElMessageBox.confirm('确定要删除该优惠券吗？', '提示', {
			type: 'warning'
		})
		await adminRequest('deleteCoupon', { id: row._id || row.id })
		ElMessage.success('删除成功')
		fetchCoupons()
	} catch (e) {
		if (e !== 'cancel') {
			ElMessage.error(e.message || '删除失败')
		}
	}
}

// 确认提交
async function confirmSubmit() {
	if (!formRef.value) return

	await formRef.value.validate(async (valid) => {
		if (!valid) return

		submitting.value = true
		try {
			const action = isEdit.value ? 'updateCoupon' : 'addCoupon'
			const data = {
				title: couponForm.title,
				type: couponForm.type,
				value: couponForm.value,
				min_price: couponForm.min_price,
				start_time: couponForm.start_time,
				end_time: couponForm.end_time,
				total_count: couponForm.total_count,
				is_show: couponForm.is_show,
				description: couponForm.description
			}
			if (isEdit.value) {
				data.id = couponForm._id
			}

			await adminRequest(action, data)
			ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
			dialogVisible.value = false
			fetchCoupons()
		} catch (e) {
			ElMessage.error(e.message || '操作失败')
		} finally {
			submitting.value = false
		}
	})
}

// 分页
function handleSizeChange() {
	pagination.page = 1
	fetchCoupons()
}

function handlePageChange() {
	fetchCoupons()
}

onMounted(() => {
	fetchCoupons()
})
</script>

<style scoped>
.coupon-container {
	padding: 20rpx;
}

.action-bar {
	background: #fff;
	padding: 30rpx;
	border-radius: 16rpx;
	margin-bottom: 20rpx;
}

.table-box {
	background: #fff;
	padding: 30rpx;
	border-radius: 16rpx;
}

.pagination-box {
	background: #fff;
	padding: 30rpx;
	border-radius: 16rpx;
	margin-top: 20rpx;
	display: flex;
	justify-content: flex-end;
}
</style>
