<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">借阅记录</h2>
      <p class="page-desc">查看所有图书借阅记录</p>
    </div>

    <!-- Search toolbar -->
    <div class="search-toolbar">
      <el-form :model="searchForm" inline>
        <el-form-item label="借阅状态">
          <el-select v-model="searchForm.borrow_status" placeholder="全部" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option label="借阅中" :value="1" />
            <el-option label="已归还" :value="2" />
            <el-option label="逾期" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.user_phone" placeholder="请输入手机号" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- Records table -->
    <div class="content-card">
      <el-table :data="pagedData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="borrow_id" label="记录ID" width="80" align="center" />
        <el-table-column prop="book_name" label="书名" min-width="160" show-overflow-tooltip />
        <el-table-column prop="user_name" label="借阅人" width="100" />
        <el-table-column prop="user_phone" label="手机号" width="130" />
        <el-table-column label="借阅时间" width="170">
          <template #default="{ row }">{{ formatTime(row.borrow_time) }}</template>
        </el-table-column>
        <el-table-column label="应还日期" width="170">
          <template #default="{ row }">{{ formatTime(row.borrow_deadline) }}</template>
        </el-table-column>
        <el-table-column label="归还时间" width="170">
          <template #default="{ row }">{{ formatTime(row.return_time) }}</template>
        </el-table-column>
        <el-table-column prop="renew_count" label="续借次数" width="90" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.borrow_status)" size="small">
              {{ statusText(row.borrow_status) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredData.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getAllBorrowRecords } from '@/api/borrow'
import dayjs from 'dayjs'

const loading = ref(false)
const allRecords = ref([])
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({ borrow_status: '', user_phone: '' })

const filteredData = computed(() => {
  let data = allRecords.value
  if (searchForm.borrow_status !== '' && searchForm.borrow_status != null) {
    data = data.filter(r => r.borrow_status === searchForm.borrow_status)
  }
  if (searchForm.user_phone) {
    const phone = searchForm.user_phone.trim()
    data = data.filter(r => r.user_phone && r.user_phone.includes(phone))
  }
  return data
})

const pagedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredData.value.slice(start, start + pageSize.value)
})

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

function statusType(status) {
  const map = { 1: '', 2: 'success', 3: 'danger' }
  return map[status] || 'info'
}

function statusText(status) {
  const map = { 1: '借阅中', 2: '已归还', 3: '逾期' }
  return map[status] || '未知'
}

async function loadData() {
  loading.value = true
  try {
    const res = await getAllBorrowRecords({})
    allRecords.value = res.data || []
  } catch (err) {
    console.error('Load records error:', err)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
}

function handleReset() {
  searchForm.borrow_status = ''
  searchForm.user_phone = ''
  currentPage.value = 1
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}
</style>
