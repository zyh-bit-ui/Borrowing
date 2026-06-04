<template>
  <div class="page-container">
    <div class="page-header flex-between">
      <div>
        <h2 class="page-title">公告管理</h2>
        <p class="page-desc">管理系统公告，支持置顶与发布</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openAddDialog">发布公告</el-button>
    </div>

    <!-- Notices list -->
    <div class="content-card" v-loading="loading">
      <div v-if="notices.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无公告" />
      </div>

      <div class="notice-list" v-else>
        <div
          v-for="notice in notices"
          :key="notice.notice_id"
          class="notice-item"
          :class="{ 'is-top': notice.is_top === 1 }"
        >
          <div class="notice-top-badge" v-if="notice.is_top === 1">
            <el-icon><Top /></el-icon> 置顶
          </div>
          <div class="notice-main">
            <h3 class="notice-title">{{ notice.title }}</h3>
            <p class="notice-content">{{ notice.content }}</p>
            <div class="notice-meta">
              <span>发布人：{{ notice.admin_name || '管理员' }}</span>
              <span>{{ formatTime(notice.create_time) }}</span>
            </div>
          </div>
          <div class="notice-actions">
            <el-button text type="primary" @click="viewDetail(notice)">查看详情</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="'发布公告'"
      width="600px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入公告标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            placeholder="请输入公告内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="是否置顶">
          <el-switch v-model="form.is_top" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">发布</el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="detailVisible" title="公告详情" width="600px">
      <template v-if="currentNotice">
        <h2 style="margin-bottom: 16px;">{{ currentNotice.title }}</h2>
        <el-divider />
        <p style="white-space: pre-wrap; line-height: 1.8; color: #606266; min-height: 120px;">{{ currentNotice.content }}</p>
        <el-divider />
        <div style="color: #909399; font-size: 13px;">
          <span>发布人：{{ currentNotice.admin_name || '管理员' }}</span>
          <span style="margin-left: 20px;">发布时间：{{ formatTime(currentNotice.create_time) }}</span>
          <el-tag v-if="currentNotice.is_top === 1" type="danger" size="small" style="margin-left: 12px;">置顶</el-tag>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Top } from '@element-plus/icons-vue'
import { getNotices, publishNotice } from '@/api/notice'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const notices = ref([])
const dialogVisible = ref(false)
const detailVisible = ref(false)
const currentNotice = ref(null)
const formRef = ref(null)

const form = reactive({
  title: '',
  content: '',
  is_top: 0
})

const rules = {
  title: [{ required: true, message: '请输入公告标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入公告内容', trigger: 'blur' }]
}

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

async function loadNotices() {
  loading.value = true
  try {
    const res = await getNotices()
    notices.value = res.data || []
  } catch (err) {
    console.error('Load notices error:', err)
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  form.title = ''
  form.content = ''
  form.is_top = 0
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await publishNotice({
      admin_id: userStore.userInfo?.user_id,
      title: form.title,
      content: form.content,
      is_top: form.is_top
    })
    ElMessage.success('公告发布成功')
    dialogVisible.value = false
    loadNotices()
  } catch (err) {
    // Error handled by interceptor
  } finally {
    submitting.value = false
  }
}

function viewDetail(notice) {
  currentNotice.value = notice
  detailVisible.value = true
}

onMounted(() => {
  loadNotices()
})
</script>

<style lang="scss" scoped>
.notice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
  position: relative;

  &:hover {
    border-color: #409eff;
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.1);
  }

  &.is-top {
    border-color: #f56c6c;
    background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
  }
}

.notice-top-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #f56c6c, #e6a23c);
  color: #fff;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 0 12px 0 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.notice-main {
  flex: 1;
  min-width: 0;
}

.notice-title {
  font-size: 17px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.notice-content {
  color: #606266;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 10px;
}

.notice-meta {
  display: flex;
  gap: 20px;
  font-size: 12px;
  color: #909399;
}

.notice-actions {
  flex-shrink: 0;
  align-self: center;
}

.empty-state {
  padding: 40px 0;
}
</style>
