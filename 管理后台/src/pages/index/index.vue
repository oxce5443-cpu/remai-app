<script setup>
import { nextTick, onMounted, ref } from 'vue'
import { adminRequest, formatMoney, formatDate, getOrderStatusText } from '@/utils/api.js'
import { goPage } from '@/utils/navigate.js'

const loading = ref(true)
const rangeDays = ref(7)
const overview = ref({
  today_order_count: 0,
  today_sales: '0.00',
  today_new_users: 0,
  avg_order_amount: '0.00'
})
const trend = ref([])
const goodsRank = ref([])
const distribution = ref([])
const recentOrders = ref([])
const chartReady = ref(false)

let echartsLib = null
let trendChart = null
let rankChart = null
let distributionChart = null

onMounted(() => {
  fetchDashboard()
})

async function fetchDashboard() {
  loading.value = true
  try {
    const [overviewData, trendData, rankData, distributionData, recentData] = await Promise.all([
      adminRequest('getDashboardOverview'),
      adminRequest('getOrderTrend', { days: rangeDays.value }),
      adminRequest('getGoodsSalesRank', { limit: 10 }),
      adminRequest('getConsumptionDistribution', { days: 30 }),
      adminRequest('getRecentOrders', { limit: 10 })
    ])
    overview.value = overviewData || overview.value
    trend.value = Array.isArray(trendData) ? trendData : []
    goodsRank.value = Array.isArray(rankData) ? rankData : []
    distribution.value = Array.isArray(distributionData) ? distributionData : []
    recentOrders.value = Array.isArray(recentData) ? recentData : []
    await nextTick()
    await renderCharts()
  } catch (error) {
    console.error('获取数据看板失败:', error)
    uni.showToast({ title: '看板加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

async function setRange(days) {
  if (rangeDays.value === days) return
  rangeDays.value = days
  await fetchDashboard()
}

async function ensureECharts() {
  // #ifndef H5
  return null
  // #endif
  // #ifdef H5
  if (echartsLib) return echartsLib
  if (window.echarts) {
    echartsLib = window.echarts
    return echartsLib
  }
  await new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
  echartsLib = window.echarts
  return echartsLib
  // #endif
}

async function renderCharts() {
  const echarts = await ensureECharts().catch(() => null)
  if (!echarts) {
    chartReady.value = false
    return
  }
  chartReady.value = true
  renderTrendChart(echarts)
  renderRankChart(echarts)
  renderDistributionChart(echarts)
}

function renderTrendChart(echarts) {
  const el = document.getElementById('trendChart')
  if (!el) return
  trendChart = trendChart || echarts.init(el)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单数', '营收'] },
    grid: { left: 36, right: 24, top: 44, bottom: 32 },
    xAxis: { type: 'category', data: trend.value.map((item) => item.stat_date) },
    yAxis: [
      { type: 'value', name: '订单' },
      { type: 'value', name: '营收' }
    ],
    series: [
      { name: '订单数', type: 'line', smooth: true, data: trend.value.map((item) => item.order_count), lineStyle: { color: '#B8855B' }, itemStyle: { color: '#B8855B' } },
      { name: '营收', type: 'bar', yAxisIndex: 1, data: trend.value.map((item) => Number(item.sales_amount || 0)), itemStyle: { color: '#D9B38C', borderRadius: [6, 6, 0, 0] } }
    ]
  })
}

function renderRankChart(echarts) {
  const el = document.getElementById('rankChart')
  if (!el) return
  rankChart = rankChart || echarts.init(el)
  rankChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 96, right: 24, top: 24, bottom: 28 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: goodsRank.value.map((item) => item.name).reverse() },
    series: [
      { type: 'bar', data: goodsRank.value.map((item) => Number(item.sales || 0)).reverse(), itemStyle: { color: '#4A3427', borderRadius: [0, 8, 8, 0] } }
    ]
  })
}

function renderDistributionChart(echarts) {
  const el = document.getElementById('distributionChart')
  if (!el) return
  distributionChart = distributionChart || echarts.init(el)
  distributionChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['42%', '70%'],
        center: ['50%', '44%'],
        data: distribution.value.map((item) => ({ name: item.label, value: item.count })),
        color: ['#B8855B', '#D9B38C', '#E8C5C0', '#4A3427']
      }
    ]
  })
}

function exportCsv() {
  const rows = [
    ['type', 'date_or_name', 'order_count_or_sales', 'amount'],
    ...trend.value.map((item) => ['trend', item.stat_date, item.order_count, item.sales_amount]),
    ...goodsRank.value.map((item) => ['goods_rank', item.name, item.sales, item.sales_amount])
  ]
  const content = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  // #ifdef H5
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `remai-dashboard-${rangeDays.value}d.csv`
  link.click()
  URL.revokeObjectURL(url)
  // #endif
}

function goToPage(url) {
  goPage(url)
}
</script>

<template>
  <view class="dashboard">
    <view class="hero-band">
      <view>
        <text class="eyebrow">REMAI BAKERY OPS</text>
        <view class="title">热麦经营数据看板</view>
        <view class="subtitle">订单、营收、会员与商品销量实时汇总</view>
      </view>
      <view class="hero-actions">
        <button class="ghost-btn" @tap="exportCsv">导出CSV</button>
        <button class="primary-btn" :loading="loading" @tap="fetchDashboard">刷新</button>
      </view>
    </view>

    <view class="stats-grid">
      <view class="stat-card">
        <text class="stat-label">今日订单</text>
        <text class="stat-value">{{ overview.today_order_count }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-label">今日营收</text>
        <text class="stat-value">¥{{ formatMoney(overview.today_sales) }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-label">新增会员</text>
        <text class="stat-value">{{ overview.today_new_users }}</text>
      </view>
      <view class="stat-card">
        <text class="stat-label">客单价</text>
        <text class="stat-value">¥{{ formatMoney(overview.avg_order_amount) }}</text>
      </view>
    </view>

    <view class="shortcut-grid">
      <view class="shortcut-item" @tap="goToPage('/pages/goods/list')">商品管理</view>
      <view class="shortcut-item" @tap="goToPage('/pages/order/list')">订单管理</view>
      <view class="shortcut-item" @tap="goToPage('/pages/member/list')">会员管理</view>
      <view class="shortcut-item" @tap="goToPage('/pages/coupon/list')">优惠券</view>
      <view class="shortcut-item" @tap="goToPage('/pages/banner/list')">轮播图</view>
      <view class="shortcut-item" @tap="goToPage('/pages/store/setting')">门店设置</view>
    </view>

    <view class="panel">
      <view class="panel-header">
        <view>
          <text class="panel-title">订单趋势</text>
          <text class="panel-desc">订单数与营收变化</text>
        </view>
        <view class="range-tabs">
          <text :class="{ active: rangeDays === 7 }" @tap="setRange(7)">7天</text>
          <text :class="{ active: rangeDays === 30 }" @tap="setRange(30)">30天</text>
        </view>
      </view>
      <view id="trendChart" class="chart"></view>
      <view v-if="!chartReady" class="chart-fallback">ECharts 加载后显示趋势图</view>
    </view>

    <view class="two-col">
      <view class="panel">
        <view class="panel-header">
          <view>
            <text class="panel-title">商品销量 TOP10</text>
            <text class="panel-desc">按商品累计销量排序</text>
          </view>
        </view>
        <view id="rankChart" class="chart chart-small"></view>
      </view>
      <view class="panel">
        <view class="panel-header">
          <view>
            <text class="panel-title">消费分布</text>
            <text class="panel-desc">近30天客单价区间</text>
          </view>
        </view>
        <view id="distributionChart" class="chart chart-small"></view>
      </view>
    </view>

    <view class="panel">
      <view class="panel-header">
        <view>
          <text class="panel-title">实时订单流</text>
          <text class="panel-desc">最新10条订单</text>
        </view>
        <text class="more-link" @tap="goToPage('/pages/order/list')">查看全部</text>
      </view>
      <view class="order-stream" v-if="recentOrders.length">
        <view class="order-row" v-for="order in recentOrders" :key="order._id">
          <view>
            <text class="order-no">{{ order.order_no || order.orderNo || '-' }}</text>
            <text class="order-time">{{ formatDate(order.created_at || order.createDate) }}</text>
          </view>
          <text class="order-status">{{ getOrderStatusText(order.status) }}</text>
          <text class="order-amount">¥{{ formatMoney(order.total_price || order.totalPrice) }}</text>
        </view>
      </view>
      <view v-else class="empty-tip">暂无订单数据</view>
    </view>
  </view>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  padding: 24rpx;
  background: #f8f4ee;
  color: #332d27;
}

.hero-band {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
  align-items: center;
  padding: 32rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #4a3427 0%, #b8855b 100%);
  color: #fff;
  margin-bottom: 24rpx;
}

.eyebrow {
  font-size: 20rpx;
  letter-spacing: 2rpx;
  color: rgba(255,255,255,.72);
}

.title {
  font-size: 42rpx;
  font-weight: 700;
  margin-top: 8rpx;
}

.subtitle {
  font-size: 24rpx;
  color: rgba(255,255,255,.76);
  margin-top: 8rpx;
}

.hero-actions {
  display: flex;
  gap: 12rpx;
}

.primary-btn,
.ghost-btn {
  border: 0;
  border-radius: 999rpx;
  padding: 0 28rpx;
  height: 64rpx;
  line-height: 64rpx;
  font-size: 24rpx;
}

.primary-btn {
  color: #4a3427;
  background: #f8f4ee;
}

.ghost-btn {
  color: #fff;
  background: rgba(255,255,255,.14);
}

.stats-grid,
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.shortcut-grid {
  grid-template-columns: repeat(6, 1fr);
}

.stat-card,
.shortcut-item,
.panel {
  background: #fff;
  border-radius: 16rpx;
  box-shadow: 0 8rpx 32rpx rgba(184, 133, 91, .12);
}

.stat-card {
  padding: 26rpx;
}

.stat-label {
  display: block;
  font-size: 24rpx;
  color: #665f57;
}

.stat-value {
  display: block;
  margin-top: 10rpx;
  font-size: 42rpx;
  font-weight: 700;
  color: #4a3427;
}

.shortcut-item {
  padding: 22rpx 12rpx;
  text-align: center;
  color: #4a3427;
  font-size: 24rpx;
}

.panel {
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}

.panel-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
}

.panel-desc {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #999188;
}

.range-tabs {
  display: flex;
  gap: 8rpx;
  padding: 6rpx;
  background: #f8f4ee;
  border-radius: 999rpx;
}

.range-tabs text {
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: #665f57;
}

.range-tabs .active {
  color: #fff;
  background: #b8855b;
}

.chart {
  width: 100%;
  height: 420rpx;
}

.chart-small {
  height: 360rpx;
}

.chart-fallback,
.empty-tip {
  padding: 24rpx;
  color: #999188;
  font-size: 24rpx;
  text-align: center;
}

.two-col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.more-link {
  color: #b8855b;
  font-size: 24rpx;
}

.order-row {
  display: grid;
  grid-template-columns: 1fr 160rpx 180rpx;
  align-items: center;
  gap: 16rpx;
  padding: 18rpx 0;
  border-bottom: 1rpx solid #efe5d9;
}

.order-no,
.order-time {
  display: block;
}

.order-no {
  font-size: 26rpx;
  color: #332d27;
}

.order-time {
  margin-top: 6rpx;
  font-size: 22rpx;
  color: #999188;
}

.order-status {
  color: #b8855b;
  font-size: 24rpx;
}

.order-amount {
  text-align: right;
  color: #c75050;
  font-size: 26rpx;
  font-weight: 700;
}

@media (max-width: 900px) {
  .hero-band,
  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .shortcut-grid,
  .two-col {
    grid-template-columns: repeat(2, 1fr);
  }

  .order-row {
    grid-template-columns: 1fr;
  }

  .order-amount {
    text-align: left;
  }
}
</style>
