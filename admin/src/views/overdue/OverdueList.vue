<template>
  <div class="page-container">
    <div class="page-header flex-between">
      <div>
        <h2 class="page-title">逾期管理</h2>
        <p class="page-desc">管理逾期记录、查看罚款信息、发送逾期提醒</p>
      </div>
      <el-button type="warning" :icon="Bell" :loading="sendingReminder" @click="handleSendReminders">
        发送逾期提醒
      </el-button>
    </div>

    <!-- Stats overview -->
    <el-row :gutter="20" class="stat-row">
      <el-col :xs="24" :sm="8" v-for="stat in stats" :key="stat.label">
        <div class="stat-mini-card">
          <div class="stat-mini-value" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="stat-mini-label">{{ stat.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- Overdue table -->
    <div class="content-card">
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="overdue_id" label="记录ID" width="80" align="center" />
        <el-table-column prop="user_name" label="用户名" width="120" />
        <el-table-column prop="book_name" label="书名" min-width="160" show-overflow-tooltip />
        <el-table-column prop="overdue_days" label="逾期天数" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="danger" size="small">{{ row.overdue_days }} 天</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="罚款金额" width="110" align="center">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: 600;">¥{{ row.fine_amount ?? 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="罚款状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.fine_status === 1 ? 'success' : 'warning'" size="small">
              {{ row.fine_status === 1 ? '已缴纳' : '未缴纳' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="borrow_time" label="借阅时间" width="170">
          <template #default="{ row }">{{ formatTime(row.borrow_time) }}</template>
        </el-table-column>
        <el-table-column prop="borrow_deadline" label="应还日期" width="170">
          <template #default="{ row }">{{ formatTime(row.borrow_deadline) }}</template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && tableData.length === 0" description="暂无逾期记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell } from '@element-plus/icons-vue'
import { getOverdues, sendReminders } from '@/api/overdue'
import dayjs from 'dayjs'

const loading = ref(false)
const sendingReminder = ref(false)
const tableData = ref([])

const stats = computed(() => {
  const total = tableData.value.length
  const unpaid = tableData.value.filter(r => r.fine_status !== 1).length
  const totalFine = tableData.value.reduce((sum, r) => sum + (Number(r.fine_amount) || 0), 0)
  return [
    { label: '逾期总数', value: total, color: '#f56c6c' },
    { label: '未缴纳罚款', value: unpaid, color: '#e6a23c' },
    { label: '罚款总额', value: `¥${totalFine.toFixed(2)}`, color: '#409eff' }
  ]
})

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

async function loadData() {
  loading.value = true
  try {
    const res = await getOverdues()
    tableData.value = res.data || []
  } catch (err) {
    ElMessage.error('获取逾期记录失败')
  } finally { loading.value = false }
}

async function handleSendReminders() {
  ElMessageBox.confirm('确认向所有逾期用户发送提醒消息？', '发送逾期提醒', {
    confirmButtonText: '确认发送', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    sendingReminder.value = true
    try {
      const res = await sendReminders()
      ElMessage.success(res.message || '逾期提醒已发送')
    } catch (err) {
      // handled by interceptor
    } finally { sendingReminder.value = false }
  }).catch(() => {})
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.stat-row { margin-bottom: 20px; }

.stat-mini-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  text-align: center;
  transition: transform 0.3s;
  &:hover { transform: translateY(-2px); }
}

.stat-mini-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 4px;
}

.stat-mini-label {
  font-size: 13px;
  color: #909399;
}
</style>
