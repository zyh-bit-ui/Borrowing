<template>
  <div class="dashboard-page">
    <!-- Welcome header -->
    <div class="page-header">
      <h2 class="page-title">仪表盘</h2>
      <p class="page-desc">图书借阅系统数据总览</p>
    </div>

    <!-- Stat cards row -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6" v-for="card in statCards" :key="card.key">
        <div class="stat-card" @click="navigateTo(card.link)">
          <div class="stat-icon" :style="{ background: card.color }">
            <el-icon :size="26"><component :is="card.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Charts row -->
    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="14">
        <div class="content-card chart-card">
          <div class="card-header">
            <h3>借阅趋势（近7天）</h3>
          </div>
          <div class="chart-container" ref="borrowChartRef"></div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="10">
        <div class="content-card chart-card">
          <div class="card-header">
            <h3>图书分类占比</h3>
          </div>
          <div class="chart-container" ref="categoryChartRef"></div>
        </div>
      </el-col>
    </el-row>

    <!-- Bottom row: recent records + quick stats -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="14">
        <div class="content-card">
          <div class="card-header flex-between">
            <h3>最近借阅记录</h3>
            <el-button text type="primary" @click="$router.push('/borrow/records')">
              查看全部 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <el-table :data="recentRecords" stripe style="width: 100%" size="small" v-loading="loading">
            <el-table-column prop="book_name" label="图书名称" min-width="160" show-overflow-tooltip />
            <el-table-column prop="user_name" label="借阅人" width="100" />
            <el-table-column prop="borrow_time" label="借阅时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.borrow_time) }}
              </template>
            </el-table-column>
            <el-table-column prop="borrow_status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="statusType(row.borrow_status)" size="small">
                  {{ statusText(row.borrow_status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :xs="24" :lg="10">
        <div class="content-card">
          <div class="card-header">
            <h3>待办事项</h3>
          </div>
          <div class="todo-list">
            <div class="todo-item" @click="$router.push('/borrow/audit')">
              <div class="todo-icon" style="background: #e6f7ff; color: #1890ff;">
                <el-icon :size="22"><Check /></el-icon>
              </div>
              <div class="todo-info">
                <div class="todo-count">{{ pendingCounts.borrow || 0 }}</div>
                <div class="todo-label">待审核借阅</div>
              </div>
              <el-icon class="todo-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="todo-item" @click="$router.push('/borrow/return-audit')">
              <div class="todo-icon" style="background: #fff7e6; color: #fa8c16;">
                <el-icon :size="22"><RefreshLeft /></el-icon>
              </div>
              <div class="todo-info">
                <div class="todo-count">{{ pendingCounts.return || 0 }}</div>
                <div class="todo-label">待审核归还</div>
              </div>
              <el-icon class="todo-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="todo-item" @click="$router.push('/borrow/renew-audit')">
              <div class="todo-icon" style="background: #f6ffed; color: #52c41a;">
                <el-icon :size="22"><Refresh /></el-icon>
              </div>
              <div class="todo-info">
                <div class="todo-count">{{ pendingCounts.renew || 0 }}</div>
                <div class="todo-label">待审核续借</div>
              </div>
              <el-icon class="todo-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="todo-item" @click="$router.push('/messages')">
              <div class="todo-icon" style="background: #fff1f0; color: #f5222d;">
                <el-icon :size="22"><ChatLineSquare /></el-icon>
              </div>
              <div class="todo-info">
                <div class="todo-count">{{ pendingCounts.messages || 0 }}</div>
                <div class="todo-label">未处理反馈</div>
              </div>
              <el-icon class="todo-arrow"><ArrowRight /></el-icon>
            </div>
            <div class="todo-item" @click="$router.push('/overdues')">
              <div class="todo-icon" style="background: #fef0f0; color: #f56c6c;">
                <el-icon :size="22"><WarningFilled /></el-icon>
              </div>
              <div class="todo-info">
                <div class="todo-count">{{ pendingCounts.overdues || 0 }}</div>
                <div class="todo-label">逾期未处理</div>
              </div>
              <el-icon class="todo-arrow"><ArrowRight /></el-icon>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { getBooks } from '@/api/book'
import { getCategories } from '@/api/category'
import { getAllBorrowRecords, getAuditList } from '@/api/borrow'
import { getUnhandledMessages } from '@/api/message'
import { getOverdues } from '@/api/overdue'
import { getAllUsers } from '@/api/user'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

// Chart refs
const borrowChartRef = ref(null)
const categoryChartRef = ref(null)
let borrowChart = null
let categoryChart = null

// Stats
const statCards = reactive([
  { key: 'books', label: '馆藏图书', value: 0, color: 'linear-gradient(135deg, #667eea, #764ba2)', icon: 'Notebook', link: '/books' },
  { key: 'users', label: '注册用户', value: 0, color: 'linear-gradient(135deg, #f093fb, #f5576c)', icon: 'User', link: '/users' },
  { key: 'borrowing', label: '借阅中', value: 0, color: 'linear-gradient(135deg, #4facfe, #00f2fe)', icon: 'Tickets', link: '/borrow/records' },
  { key: 'overdue', label: '逾期图书', value: 0, color: 'linear-gradient(135deg, #fa709a, #fee140)', icon: 'WarningFilled', link: '/overdues' }
])

const pendingCounts = reactive({
  borrow: 0,
  return: 0,
  renew: 0,
  messages: 0,
  overdues: 0
})

const recentRecords = ref([])

// ---- Cached data for charts ----
let cachedBooks = []
let cachedCategories = []
let cachedRecords = []

// ---- Helpers ----
function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

function statusType(status) {
  const map = { 1: 'primary', 2: 'success', 3: 'danger' }
  return map[status] || 'info'
}

function statusText(status) {
  const map = { 1: '借阅中', 2: '已归还', 3: '逾期' }
  return map[status] || '未知'
}

function navigateTo(path) {
  router.push(path)
}

// ---- Safe extractor: handle both fulfilled and rejected promises ----
function unwrapData(result, fallback = []) {
  if (result.status === 'fulfilled' && result.value) {
    return result.value.data ?? fallback
  }
  return fallback
}

// ---- Load all data ----
async function loadData() {
  loading.value = true
  try {
    // Promise.allSettled ensures ONE failing API doesn't block all the others
    const results = await Promise.allSettled([
      getBooks(),                                          // 0
      getAllUsers(),                                       // 1
      getAllBorrowRecords({}),                             // 2
      getAuditList('borrow'),                              // 3
      getAuditList('return'),                              // 4
      getAuditList('renew'),                               // 5
      getUnhandledMessages(userStore.userInfo?.user_id),    // 6
      getOverdues(),                                       // 7
      getCategories()                                      // 8
    ])

    // Log any failed APIs for debugging
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const names = ['books','users','records','borrowAudit','returnAudit','renewAudit','messages','overdues','categories']
        console.warn(`[Dashboard] API "${names[i]}" failed:`, r.reason?.message || r.reason)
      }
    })

    // --- Extract data from each settled promise ---
    const books = unwrapData(results[0])
    const users = unwrapData(results[1])
    const allRecords = unwrapData(results[2])
    const borrowAuditList = unwrapData(results[3])
    const returnAuditList = unwrapData(results[4])
    const renewAuditList = unwrapData(results[5])
    const unhandledMsgs = unwrapData(results[6])
    const overdueList = unwrapData(results[7])
    const categories = unwrapData(results[8])

    // --- Stat cards (real data from DB) ---
    statCards[0].value = books.length
    statCards[1].value = users.length
    statCards[2].value = allRecords.filter(r => r.borrow_status === 1).length
    statCards[3].value = allRecords.filter(r => r.borrow_status === 3).length

    // --- Recent records (sorted by time desc, top 8) ---
    recentRecords.value = [...allRecords]
      .sort((a, b) => new Date(b.borrow_time) - new Date(a.borrow_time))
      .slice(0, 8)

    // --- Pending counts ---
    pendingCounts.borrow = borrowAuditList.length
    pendingCounts.return = returnAuditList.length
    pendingCounts.renew = renewAuditList.length
    pendingCounts.messages = unhandledMsgs.length
    pendingCounts.overdues = overdueList.length

    // --- Cache for charts ---
    cachedBooks = books
    cachedCategories = categories
    cachedRecords = allRecords
  } catch (err) {
    console.error('Load dashboard data error:', err)
  } finally {
    loading.value = false
  }
}

// ---- Build borrow trend from real records ----
function buildBorrowTrend(records) {
  const days = []
  const values = []
  for (let i = 6; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    days.push(dayjs().subtract(i, 'day').format('MM/DD'))
    const count = records.filter(r => {
      return r.borrow_time && dayjs(r.borrow_time).format('YYYY-MM-DD') === date
    }).length
    values.push(count)
  }
  return { days, values }
}

// ---- Build category distribution from real books ----
function buildCategoryDistribution(books, categories) {
  if (!categories.length) return []

  // Count books per category_id
  const countMap = {}
  books.forEach(b => {
    const cid = b.category_id
    if (cid != null) {
      countMap[cid] = (countMap[cid] || 0) + 1
    }
  })

  // Map to category names
  return categories
    .map(c => ({
      name: c.category_name,
      value: countMap[c.category_id] || 0
    }))
    .filter(item => item.value > 0) // Only show categories that have books
    .sort((a, b) => b.value - a.value) // Sort by count desc
}

// ---- Init borrow trend chart ----
function initBorrowChart() {
  if (!borrowChartRef.value) return
  borrowChart = echarts.init(borrowChartRef.value)

  const { days, values } = buildBorrowTrend(cachedRecords)

  borrowChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e4e7ed',
      textStyle: { color: '#303133' },
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      formatter: function(params) {
        return `${params[0].axisValue}<br/>借阅数量：<b>${params[0].value}</b> 本`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { lineStyle: { color: '#e4e7ed' } },
      axisLabel: { color: '#909399' }
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#f0f2f5' } },
      axisLabel: { color: '#909399' }
    },
    series: [{
      data: values,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' }
        ]),
        width: 3
      },
      itemStyle: {
        color: '#667eea',
        borderColor: '#fff',
        borderWidth: 2
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
          { offset: 1, color: 'rgba(102, 126, 234, 0.02)' }
        ])
      }
    }]
  })
}

// ---- Init category distribution chart ----
function initCategoryChart() {
  if (!categoryChartRef.value) return
  categoryChart = echarts.init(categoryChartRef.value)

  const pieData = buildCategoryDistribution(cachedBooks, cachedCategories)

  // If no real data, show empty state
  if (pieData.length === 0) {
    categoryChart.setOption({
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: { color: '#909399', fontSize: 14, fontWeight: 'normal' }
      },
      series: [{ type: 'pie', radius: ['50%', '75%'], center: ['50%', '45%'], data: [] }]
    })
    return
  }

  // Color palette
  const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#a18cd1', '#f6d365', '#f5576c', '#84fab0', '#8ec5fc']

  categoryChart.setOption({
    color: colors,
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      borderColor: '#e4e7ed',
      textStyle: { color: '#303133' },
      formatter: '{b}: {c} 本 ({d}%)'
    },
    legend: {
      bottom: '0%',
      textStyle: { color: '#606266', fontSize: 12 }
    },
    series: [{
      type: 'pie',
      radius: ['50%', '75%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 6,
        borderColor: '#fff',
        borderWidth: 3
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 16, fontWeight: 'bold' }
      },
      data: pieData
    }]
  })
}

// ---- Resize handler ----
function handleResize() {
  borrowChart?.resize()
  categoryChart?.resize()
}

onMounted(async () => {
  await loadData()
  await nextTick()
  initBorrowChart()
  initCategoryChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  borrowChart?.dispose()
  categoryChart?.dispose()
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  max-width: 1440px;
}

.stat-row {
  margin-bottom: 20px;
}

.chart-row {
  margin-bottom: 20px;
}

.chart-card {
  .card-header {
    margin-bottom: 12px;
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }
  .chart-container {
    height: 320px;
  }
}

.card-header {
  margin-bottom: 16px;
  h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

// Todo list
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid transparent;

  &:hover {
    background: #f5f7fa;
    border-color: #e4e7ed;
    .todo-arrow {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .todo-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .todo-info {
    flex: 1;
    .todo-count {
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.2;
    }
    .todo-label {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }

  .todo-arrow {
    color: #c0c4cc;
    transition: all 0.3s;
    opacity: 0;
    transform: translateX(-8px);
  }
}
</style>
