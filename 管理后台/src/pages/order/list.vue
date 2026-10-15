<template>
  <view class="order-container">
    <LanguageSwitch />
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ $t("订单管理") }}</span>
        </div>
      </template>

      <!-- 状态筛选 -->
      <view class="filter-tabs">
        <el-radio-group v-model="filterStatus" @change="handleFilterChange">
          <el-radio-button label="all">{{ $t("全部") }}</el-radio-button>
          <el-radio-button label="pending">{{ $t("待支付") }}</el-radio-button>
          <el-radio-button label="paid">{{ $t("已支付") }}</el-radio-button>
          <el-radio-button label="processing">{{ $t("制作中") }}</el-radio-button>
          <el-radio-button label="completed">{{ $t("已完成") }}</el-radio-button>
          <el-radio-button label="cancelled">{{ $t("已取消") }}</el-radio-button>
        </el-radio-group>
      </view>

      <el-table :data="filteredOrders" border stripe v-loading="loading">
        <el-table-column prop="orderNo" :label="$t(&quot;订单号&quot;)" width="180" />
        <el-table-column :label="$t(&quot;订单类型&quot;)" width="100">
          <template #default="{ row }">
            {{ $t(getOrderTypeText(row.type)) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t(&quot;订单状态&quot;)" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ $t(getOrderStatusText(row.status)) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t(&quot;总价&quot;)" width="100">
          <template #default="{ row }">
            ¥{{ $t(formatMoney(row.totalPrice)) }}
          </template>
        </el-table-column>
        <el-table-column prop="personCount" :label="$t(&quot;人数&quot;)" width="60" />
        <el-table-column :label="$t(&quot;桌号&quot;)" width="80">
          <template #default="{ row }">
            {{ $t(row.tableNo ? row.tableNo + ' 号桌' : '—') }}
          </template>
        </el-table-column>
        <el-table-column :label="$t(&quot;下单时间&quot;)" width="160">
          <template #default="{ row }">
            {{ $t(formatDate(row.createTime)) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t(&quot;操作&quot;)" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="info" size="small" @click="handleDetail(row)">{{ $t("详情") }}</el-button>
            <el-button
              v-if="row.status === 'paid'"
              type="success"
              size="small"
              @click="handleAccept(row)"
            >{{ $t("接单") }}</el-button>
            <el-button v-if="row.status === 'processing'" type="success" size="small" @click="handleComplete(row)">{{ $t("完成") }}</el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="danger"
              size="small"
              @click="handleCancel(row)"
            >{{ $t("取消") }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <view class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </view>
    </el-card>

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailVisible" :title="$t(&quot;订单详情&quot;)" width="600px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item :label="$t(&quot;订单号&quot;)">{{ $t(currentOrder.orderNo) }}</el-descriptions-item>
        <el-descriptions-item :label="$t(&quot;订单类型&quot;)">{{ $t(getOrderTypeText(currentOrder.type)) }}</el-descriptions-item>
        <el-descriptions-item :label="$t(&quot;订单状态&quot;)">
          <el-tag :type="getStatusTagType(currentOrder.status)">
            {{ $t(getOrderStatusText(currentOrder.status)) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item :label="$t(&quot;下单时间&quot;)">{{ $t(formatDate(currentOrder.createTime)) }}</el-descriptions-item>
        <el-descriptions-item :label="$t(&quot;总价&quot;)">¥{{ $t(formatMoney(currentOrder.totalPrice)) }}</el-descriptions-item>
        <el-descriptions-item :label="$t(&quot;餐具&quot;)">{{ currentOrder.cutleryCount == null ? $t('未记录') : currentOrder.cutleryCount === 0 ? $t('无需餐具') : $t('{count}份餐具', { count: currentOrder.cutleryCount }) }}</el-descriptions-item>
        <el-descriptions-item :label="$t(&quot;人数&quot;)">{{ $t(currentOrder.personCount) }}</el-descriptions-item>
        <el-descriptions-item :label="$t(&quot;收货地址&quot;)" :span="2">{{ currentOrder.address || $t('无') }}</el-descriptions-item>
        <el-descriptions-item :label="$t(&quot;备注&quot;)" :span="2">{{ currentOrder.remark || $t('无') }}</el-descriptions-item>
      </el-descriptions>

      <el-divider>{{ $t("商品明细") }}</el-divider>
      <el-table :data="currentOrder?.goodsList || []" border size="small">
        <el-table-column prop="name" :label="$t(&quot;商品名称&quot;)" />
        <el-table-column prop="price" :label="$t(&quot;单价&quot;)" width="100">
          <template #default="{ row }">¥{{ $t(formatMoney(row.price)) }}</template>
        </el-table-column>
        <el-table-column prop="count" :label="$t(&quot;数量&quot;)" width="80" />
        <el-table-column :label="$t(&quot;小计&quot;)" width="100">
          <template #default="{ row }">¥{{ $t(formatMoney(row.price * row.count)) }}</template>
        </el-table-column>
      </el-table>

      <template #footer>
        <el-button @click="detailVisible = false">{{ $t("关闭") }}</el-button>
      </template>
    </el-dialog>
  </view>
</template>

<script setup>
import { t } from '@/locale'

import { ref, computed, onMounted } from 'vue'
import { adminRequest, formatDate, formatMoney, getOrderStatusText, getOrderTypeText } from '@/utils/api.js'

const orders = ref([])
const loading = ref(false)
const filterStatus = ref('all')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const detailVisible = ref(false)
const currentOrder = ref(null)

onMounted(() => {
  loadOrders()
})

async function loadOrders() {
  loading.value = true
  try {
    const data = await adminRequest('getOrders')
    orders.value = data || []
    total.value = orders.value.length
  } catch (e) {
    console.error('加载订单失败', e)
  } finally {
    loading.value = false
  }
}

const filteredOrders = computed(() => {
  if (filterStatus.value === 'all') {
    return orders.value
  }
  return orders.value.filter(order => order.status === filterStatus.value)
})

function handleFilterChange() {
  currentPage.value = 1
}

function handleSizeChange() {
  currentPage.value = 1
}

function handleCurrentChange() {
  // 实际项目中这里会根据分页加载数据
}

function handleDetail(row) {
  currentOrder.value = row
  detailVisible.value = true
}

async function handleAccept(row) {
  try {
    await ElMessageBox.confirm(t('确定接单吗？'), t('提示'), { type: 'warning' })
    await adminRequest('updateOrderStatus', { order_id: row._id || row.id, status: 'processing' })
    ElMessage.success(t('接单成功'))
    loadOrders()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('接单失败', e)
    }
  }
}

async function handleComplete(row) {
  try {
    await ElMessageBox.confirm(t('确认该订单已完成？'), t('提示'), { type: 'warning' })
    await adminRequest('updateOrderStatus', { order_id: row._id || row.id, status: 'completed' })
    ElMessage.success(t('订单已完成'))
    loadOrders()
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') ElMessage.error(t(error.message || '操作失败'))
  }
}

async function handleCancel(row) {
  try {
    await ElMessageBox.confirm(t('确定取消该订单吗？'), t('提示'), { type: 'warning' })
    await adminRequest('updateOrderStatus', { order_id: row._id || row.id, status: 'cancelled' })
    ElMessage.success(t('订单已取消'))
    loadOrders()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('取消失败', e)
    }
  }
}

function getStatusTagType(status) {
  const typeMap = {
    pending: 'warning',
    paid: 'primary',
    processing: 'info',
    completed: 'success',
    cancelled: 'info'
  }
  return typeMap[status] || ''
}
</script>

<style scoped>
.order-container {
  padding: 20rpx;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-tabs {
  margin-bottom: 20rpx;
}

.pagination {
  margin-top: 20rpx;
  display: flex;
  justify-content: flex-end;
}
</style>
