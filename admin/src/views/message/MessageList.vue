<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">反馈管理</h2>
      <p class="page-desc">查看和处理用户反馈信息</p>
    </div>

    <div class="content-card">
      <el-tabs v-model="activeTab" @tab-change="loadData">
        <el-tab-pane label="全部反馈" name="all" />
        <el-tab-pane label="未处理反馈" name="unhandled" />
      </el-tabs>

      <el-table :data="tableData" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="feedback_id" label="ID" width="70" />
        <el-table-column prop="user_id" label="用户ID" width="90" />
        <el-table-column label="反馈类型" width="100">
          <template #default="{ row }">
            <el-tag :type="feedbackTypeTag(row.feedback_type)" size="small">
              {{ row.feedback_type || '其它' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="feedback_content" label="反馈内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="170">
          <template #default="{ row }">{{ formatTime(row.create_time) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 0">
              <el-button type="primary" link size="small" @click="openReplyDialog(row)">
                <el-icon><ChatDotRound /></el-icon>回复
              </el-button>
              <el-button type="danger" link size="small" @click="handleClose(row)">
                <el-icon><Check /></el-icon>关闭
              </el-button>
            </template>
            <span v-else style="color: #c0c4cc;">-</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Reply Dialog -->
    <el-dialog v-model="replyDialogVisible" title="回复反馈" width="560px" :close-on-click-modal="false">
      <div class="original-feedback">
        <div class="feedback-label">反馈内容</div>
        <div class="feedback-text">{{ currentRow?.feedback_content }}</div>
      </div>
      <el-form label-position="top">
        <el-form-item label="回复内容">
          <el-input v-model="replyContent" type="textarea" :rows="4" placeholder="请输入回复内容..." maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="replyLoading" @click="handleReply">提交回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, Check } from '@element-plus/icons-vue'
import { getAdminMessages, getUnhandledMessages, replyMessage, closeMessage } from '@/api/message'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const userStore = useUserStore()
const activeTab = ref('all')
const tableData = ref([])
const loading = ref(false)
const replyDialogVisible = ref(false)
const currentRow = ref(null)
const replyContent = ref('')
const replyLoading = ref(false)

function formatTime(t) { return t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-' }
function feedbackTypeTag(type) { return type === '借书' ? '' : type === '还书' ? 'success' : type === '押金' ? 'warning' : 'info' }
function statusTag(status) { const m = { 0: 'warning', 1: 'success', 2: 'info' }; return m[status] || 'info' }
function statusText(status) { const m = { 0: '未处理', 1: '已回复', 2: '已关闭' }; return m[status] || '未知' }

async function loadData() {
  loading.value = true
  try {
    const res = activeTab.value === 'all' ? await getAdminMessages() : await getUnhandledMessages(userStore.userInfo?.user_id)
    tableData.value = res.data || []
  } catch (err) {
    ElMessage.error('加载反馈数据失败')
  } finally { loading.value = false }
}

function openReplyDialog(row) { currentRow.value = row; replyContent.value = ''; replyDialogVisible.value = true }

async function handleReply() {
  if (!replyContent.value.trim()) { ElMessage.warning('请输入回复内容'); return }
  replyLoading.value = true
  try {
    await replyMessage({ feedback_id: currentRow.value.feedback_id, reply_content: replyContent.value, admin_id: userStore.userInfo?.user_id })
    ElMessage.success('回复成功')
    replyDialogVisible.value = false
    loadData()
  } catch (err) { /* handled by interceptor */ }
  finally { replyLoading.value = false }
}

function handleClose(row) {
  ElMessageBox.confirm('确认关闭该反馈吗?', '提示', { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' })
    .then(async () => {
      try {
        await closeMessage({ feedback_id: row.feedback_id, admin_id: userStore.userInfo?.user_id })
        ElMessage.success('已关闭')
        loadData()
      } catch (err) { /* handled by interceptor */ }
    }).catch(() => {})
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.original-feedback {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 20px;
}
.feedback-label { font-size: 12px; color: #909399; margin-bottom: 8px; }
.feedback-text { font-size: 14px; color: #303133; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
</style>
