<template>
  <div class="page-container">
    <div class="page-header flex-between">
      <div>
        <h2 class="page-title">用户管理</h2>
        <p class="page-desc">查看和管理所有系统用户，共 {{ allUsers.length }} 人</p>
      </div>
      <el-button type="primary" :icon="Refresh" @click="loadAllUsers" :loading="loading">刷新列表</el-button>
    </div>

    <!-- Search toolbar -->
    <div class="search-toolbar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.keyword"
            placeholder="输入姓名或手机号搜索"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearch"
            @clear="handleReset"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">显示全部</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- User table -->
    <div class="content-card">
      <el-table :data="pagedUsers" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="user_id" label="用户ID" width="100" align="center">
          <template #default="{ row }">
            <div class="user-id-cell">
              <code class="user-id-text">{{ row.user_id }}</code>
              <el-button
                type="primary"
                link
                size="small"
                :icon="CopyDocument"
                @click="copyUserId(row.user_id)"
                title="复制用户ID"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="姓名" width="120">
          <template #default="{ row }">
            <div class="user-name-cell">
              <el-avatar :size="28" :icon="UserFilled" v-if="!row.user_avatar" />
              <el-avatar :size="28" :src="row.user_avatar" v-else />
              <span>{{ row.user_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="user_phone" label="手机号" width="140" />
        <el-table-column label="角色" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.user_role === 2 ? 'danger' : 'primary'" size="small" effect="dark">
              {{ row.user_role === 2 ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="性别" width="70" align="center">
          <template #default="{ row }">
            {{ row.user_gender === 1 ? '男' : row.user_gender === 0 ? '女' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="user_region" label="地区" width="100" show-overflow-tooltip />
        <el-table-column prop="borrow_count" label="借阅数量" width="100" align="center" sortable />
        <el-table-column label="注册时间" width="170" sortable sort-by="create_time">
          <template #default="{ row }">
            {{ formatTime(row.create_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleViewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredUsers.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
          small
        />
      </div>
    </div>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="用户详情" width="560px" destroy-on-close>
      <el-descriptions :column="2" border size="small" v-if="currentUser">
        <el-descriptions-item label="用户ID" :span="2">
          <div class="detail-id-row">
            <code style="font-size: 16px; background: #f5f7fa; padding: 2px 8px; border-radius: 4px;">
              {{ currentUser.user_id }}
            </code>
            <el-button type="primary" link size="small" :icon="CopyDocument" @click="copyUserId(currentUser.user_id)">
              复制
            </el-button>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="姓名">{{ currentUser.user_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.user_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="currentUser.user_role === 2 ? 'danger' : 'primary'" size="small" effect="dark">
            {{ currentUser.user_role === 2 ? '管理员' : '普通用户' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="性别">
          {{ currentUser.user_gender === 1 ? '男' : currentUser.user_gender === 0 ? '女' : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="地区">{{ currentUser.user_region || '-' }}</el-descriptions-item>
        <el-descriptions-item label="借阅数量">{{ currentUser.borrow_count ?? 0 }}</el-descriptions-item>
        <el-descriptions-item label="头像">
          <el-avatar v-if="currentUser.user_avatar" :src="currentUser.user_avatar" :size="40" />
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间">{{ formatTime(currentUser.create_time) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTime(currentUser.update_time) }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, CopyDocument, UserFilled } from '@element-plus/icons-vue'
import { getAllUsers, searchUsers } from '@/api/user'
import dayjs from 'dayjs'

// ---- State ----
const allUsers = ref([])
const loading = ref(false)
const searchForm = reactive({ keyword: '' })
const isSearching = ref(false)
const pagination = reactive({ page: 1, pageSize: 10 })

const detailVisible = ref(false)
const currentUser = ref(null)

// ---- Computed: filter + pagination ----
const filteredUsers = computed(() => {
  if (!isSearching.value || !searchForm.keyword.trim()) {
    return allUsers.value
  }
  // Frontend filter as fallback when we loaded all users
  const kw = searchForm.keyword.trim().toLowerCase()
  return allUsers.value.filter(u =>
    (u.user_name && u.user_name.toLowerCase().includes(kw)) ||
    (u.user_phone && u.user_phone.includes(kw))
  )
})

const pagedUsers = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize
  return filteredUsers.value.slice(start, start + pagination.pageSize)
})

// ---- Methods ----
function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

async function loadAllUsers() {
  loading.value = true
  try {
    const res = await getAllUsers()
    allUsers.value = Array.isArray(res.data) ? res.data : []
    isSearching.value = false
    searchForm.keyword = ''
    pagination.page = 1
  } catch (err) {
    allUsers.value = []
  } finally {
    loading.value = false
  }
}

async function handleSearch() {
  const kw = searchForm.keyword?.trim()
  if (!kw) {
    handleReset()
    return
  }

  // Try server-side search first
  loading.value = true
  try {
    // Determine if keyword is a phone number
    const isPhone = /^1[3-9]\d{9}$/.test(kw)
    const params = isPhone ? { user_phone: kw } : { user_name: kw }
    const res = await searchUsers(params)
    if (res.data && Array.isArray(res.data)) {
      allUsers.value = res.data
      isSearching.value = true
    } else {
      // Fallback to frontend filter
      isSearching.value = true
    }
    pagination.page = 1
  } catch (err) {
    // Fallback: filter locally
    isSearching.value = true
  } finally {
    loading.value = false
  }
}

function handleReset() {
  searchForm.keyword = ''
  isSearching.value = false
  pagination.page = 1
  loadAllUsers()
}

async function copyUserId(id) {
  try {
    await navigator.clipboard.writeText(String(id))
    ElMessage.success(`用户ID ${id} 已复制到剪贴板`)
  } catch {
    ElMessage.info(`用户ID: ${id}`)
  }
}

function handleViewDetail(row) {
  currentUser.value = { ...row }
  detailVisible.value = true
}

// ---- Init ----
onMounted(() => {
  loadAllUsers()
})
</script>

<style lang="scss" scoped>
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.user-id-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.user-id-text {
  font-family: 'SF Mono', 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  font-weight: 600;
  background: #f0f2f5;
  padding: 2px 8px;
  border-radius: 4px;
  color: #409eff;
}

.user-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail-id-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
