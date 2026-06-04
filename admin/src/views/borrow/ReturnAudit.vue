<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">归还审核</h2>
      <p class="page-desc">审核用户的归还申请</p>
    </div>

    <div class="content-card">
      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="return_apply_id" label="申请ID" width="80" />
        <el-table-column prop="user_name" label="用户姓名" width="120" />
        <el-table-column prop="book_name" label="书名" min-width="160" show-overflow-tooltip />
        <el-table-column label="借阅时间" width="170">
          <template #default="{ row }">{{ formatTime(row.borrow_time) }}</template>
        </el-table-column>
        <el-table-column label="应还日期" width="170">
          <template #default="{ row }">{{ formatTime(row.borrow_deadline) }}</template>
        </el-table-column>
        <el-table-column label="申请时间" width="170">
          <template #default="{ row }">{{ formatTime(row.apply_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && tableData.length === 0" description="暂无待审核的归还申请" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getAuditList, auditReturn } from '@/api/borrow'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const tableData = ref([])

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getAuditList('return')
    tableData.value = res.data || []
  } catch (err) {
    ElMessage.error('获取审核列表失败')
  } finally {
    loading.value = false
  }
}

async function handleAudit(row, status) {
  try {
    await auditReturn({ return_apply_id: row.return_apply_id, audit_result: status, operator_id: userStore.userInfo?.user_id })
    ElMessage.success(status === 1 ? '已通过归还申请' : '已拒绝归还申请')
    fetchList()
  } catch (err) {
    // handled by interceptor
  }
}

function handleApprove(row) {
  ElMessageBox.confirm(
    `确认通过用户「${row.user_name}」对《${row.book_name}》的归还申请？`,
    '归还审核',
    { confirmButtonText: '确认通过', cancelButtonText: '取消', type: 'success' }
  ).then(() => handleAudit(row, 1)).catch(() => {})
}

function handleReject(row) {
  ElMessageBox.confirm(
    `确认拒绝用户「${row.user_name}」对《${row.book_name}》的归还申请？`,
    '归还审核',
    { confirmButtonText: '确认拒绝', cancelButtonText: '取消', type: 'warning' }
  ).then(() => handleAudit(row, 2)).catch(() => {})
}

onMounted(() => fetchList())
</script>
