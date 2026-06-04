<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">心得管理</h2>
      <p class="page-desc">查看和管理用户的读书心得与书评</p>
    </div>

    <div v-if="loading" class="content-card">
      <div class="notes-grid">
        <div v-for="n in 6" :key="n" class="note-card-skeleton" v-loading="true" style="min-height: 180px;" />
      </div>
    </div>

    <el-empty v-else-if="notes.length === 0" description="暂无读书心得" :image-size="120" />

    <div v-else class="notes-grid">
      <div v-for="note in notes" :key="note.note_id" class="content-card note-card">
        <div class="note-card-header">
          <el-avatar :size="44" :icon="UserFilled" class="note-avatar" />
          <div class="note-user-info">
            <span class="note-user-name">{{ note.user_name || '匿名用户' }}</span>
            <span class="note-book-name">
              <el-icon :size="14"><Reading /></el-icon>
              {{ note.book_name || '未知图书' }}
            </span>
          </div>
        </div>

        <div class="note-card-body">
          <p class="note-content-preview">{{ truncateText(note.content) }}</p>
        </div>

        <div class="note-card-footer">
          <div class="note-meta">
            <span class="note-likes">
              <el-icon :size="16"><Star /></el-icon>
              {{ note.like_count ?? 0 }}
            </span>
            <span class="note-time">
              <el-icon :size="14"><Clock /></el-icon>
              {{ formatTime(note.create_time) }}
            </span>
          </div>
          <el-button type="primary" size="small" :icon="View" @click="openDetail(note)">查看详情</el-button>
        </div>
      </div>
    </div>

    <!-- Detail Dialog -->
    <el-dialog v-model="dialogVisible" title="读书心得详情" width="640px" :close-on-click-modal="false">
      <template v-if="currentNote">
        <div class="detail-header">
          <div class="detail-user">
            <el-avatar :size="48" :icon="UserFilled" />
            <div>
              <div class="detail-user-name">{{ currentNote.user_name || '匿名用户' }}</div>
              <div class="detail-book-name">
                <el-icon :size="14"><Reading /></el-icon>
                {{ currentNote.book_name || '未知图书' }}
              </div>
            </div>
          </div>
          <div class="detail-stats">
            <span class="detail-likes">
              <el-icon :size="18"><Star /></el-icon>
              {{ currentNote.like_count ?? 0 }} 赞
            </span>
            <span class="detail-time">{{ formatTime(currentNote.create_time) }}</span>
          </div>
        </div>
        <el-divider />
        <div class="detail-content">{{ currentNote.content || '暂无内容' }}</div>
      </template>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { View, Star, Reading, Clock, UserFilled } from '@element-plus/icons-vue'
import { getNotes } from '@/api/note'
import dayjs from 'dayjs'

const loading = ref(false)
const notes = ref([])
const dialogVisible = ref(false)
const currentNote = ref(null)

function truncateText(text) {
  if (!text) return ''
  return text.length > 150 ? text.slice(0, 150) + '...' : text
}

function formatTime(t) {
  return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
}

async function fetchNotes() {
  loading.value = true
  try {
    const res = await getNotes()
    notes.value = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : []
  } catch (err) {
    ElMessage.error('加载心得列表失败')
  } finally { loading.value = false }
}

function openDetail(note) {
  currentNote.value = { ...note }
  dialogVisible.value = true
}

onMounted(() => fetchNotes())
</script>

<style lang="scss" scoped>
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(370px, 1fr));
  gap: 20px;
}

.note-card {
  display: flex; flex-direction: column;
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  &:hover { transform: translateY(-4px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }
}

.note-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.note-avatar { flex-shrink: 0; background: linear-gradient(135deg, #667eea, #764ba2); }
.note-user-info { display: flex; flex-direction: column; gap: 4px; min-width: 0; flex: 1; }
.note-user-name { font-size: 15px; font-weight: 600; color: #303133; }
.note-book-name { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #909399; .el-icon { color: #409eff; } }

.note-card-body { flex: 1; margin-bottom: 16px; }
.note-content-preview {
  font-size: 14px; line-height: 1.8; color: #606266;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
}

.note-card-footer { display: flex; align-items: center; justify-content: space-between; padding-top: 14px; border-top: 1px solid #ebeef5; }
.note-meta { display: flex; align-items: center; gap: 16px; }
.note-likes { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #f56c6c; .el-icon { color: #f56c6c; } }
.note-time { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #909399; }

.note-card-skeleton { padding: 20px; border-radius: 8px; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }

.detail-header { display: flex; align-items: center; justify-content: space-between; }
.detail-user { display: flex; align-items: center; gap: 14px; }
.detail-user-name { font-size: 16px; font-weight: 600; color: #303133; }
.detail-book-name { display: flex; align-items: center; gap: 4px; font-size: 13px; color: #909399; }
.detail-stats { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.detail-likes { display: flex; align-items: center; gap: 4px; font-size: 14px; color: #f56c6c; .el-icon { color: #f56c6c; } }
.detail-time { font-size: 12px; color: #909399; }
.detail-content { padding: 8px 0 16px; font-size: 15px; line-height: 1.9; color: #606266; white-space: pre-wrap; word-break: break-word; min-height: 120px; }
</style>
