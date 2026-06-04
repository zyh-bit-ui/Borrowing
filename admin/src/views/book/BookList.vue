<template>
  <div class="page-container">
    <div class="page-header flex-between">
      <div>
        <h2 class="page-title">图书管理</h2>
        <p class="page-desc">管理馆藏图书，支持添加、编辑和搜索</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openAddDialog">添加图书</el-button>
    </div>

    <!-- Search toolbar -->
    <div class="search-toolbar">
      <el-input v-model="searchKeyword" placeholder="搜索图书名称..." clearable :prefix-icon="Search"
        style="width: 300px" @keyup.enter="handleSearch" />
      <el-button type="primary" :icon="Search" @click="handleSearch" style="margin-left: 10px;">搜索</el-button>
      <el-button v-if="searchKeyword" @click="handleReset" style="margin-left: 8px;">重置</el-button>
    </div>

    <!-- Book grid -->
    <div v-loading="loading" class="content-card">
      <el-empty v-if="books.length === 0 && !loading" description="暂无图书数据" />
      <div v-else class="book-grid">
        <div v-for="book in books" :key="book.book_id" class="book-card">
          <div class="book-cover">
            <img v-if="book.book_cover" :src="book.book_cover" :alt="book.book_name" class="cover-image" />
            <div v-else class="cover-placeholder" :style="{ background: getCoverGradient(book.book_name) }">
              {{ book.book_name ? book.book_name.charAt(0) : '?' }}
            </div>
            <div class="book-overlay">
              <el-button type="primary" :icon="Edit" size="small" round @click="openEditDialog(book)">编辑</el-button>
            </div>
          </div>
          <div class="book-info">
            <h3 class="book-name" :title="book.book_name">{{ book.book_name }}</h3>
            <p class="book-author">{{ book.book_author }}</p>
            <p v-if="book.book_publisher" class="book-publisher text-ellipsis">{{ book.book_publisher }}</p>
            <div class="book-meta">
              <el-tag v-if="book.category_name" size="small" type="warning" effect="plain">{{ book.category_name }}</el-tag>
              <span v-if="book.book_isbn" class="book-isbn text-ellipsis">{{ book.book_isbn }}</span>
            </div>
            <div class="book-stock">
              <el-tag :type="getStockType(book)" size="small">
                总库存 {{ book.book_stock ?? 0 }} / 可借 {{ book.book_available ?? 0 }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="580px" :close-on-click-modal="false" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <el-form-item label="ISBN" prop="book_isbn">
          <el-input v-model="form.book_isbn" placeholder="请输入ISBN号" />
        </el-form-item>
        <el-form-item label="图书名称" prop="book_name">
          <el-input v-model="form.book_name" placeholder="请输入图书名称" />
        </el-form-item>
        <el-form-item label="作者" prop="book_author">
          <el-input v-model="form.book_author" placeholder="请输入作者" />
        </el-form-item>
        <el-form-item label="出版社">
          <el-input v-model="form.book_publisher" placeholder="请输入出版社" />
        </el-form-item>
        <el-form-item label="存放位置">
          <el-input v-model="form.book_position" placeholder="请输入存放位置" />
        </el-form-item>
        <el-form-item label="图书分类">
          <el-select v-model="form.category_id" placeholder="请选择分类" clearable style="width: 100%">
            <el-option v-for="cat in categories" :key="cat.category_id" :label="cat.category_name" :value="cat.category_id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEditing" label="库存数量" prop="book_stock">
          <el-input-number v-model="form.book_stock" :min="1" :max="9999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="封面图片">
          <el-input v-model="form.book_cover" placeholder="请输入封面图片URL" />
        </el-form-item>
        <el-form-item label="图书简介">
          <el-input v-model="form.book_desc" type="textarea" :rows="3" placeholder="请输入图书简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, Edit } from '@element-plus/icons-vue'
import { getBooks, searchBooksByName, addBook, updateBook } from '@/api/book'
import { getCategories } from '@/api/category'

const loading = ref(false)
const submitting = ref(false)
const books = ref([])
const categories = ref([])
const searchKeyword = ref('')
const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const formRef = ref(null)

const form = reactive({
  book_isbn: '', book_name: '', book_author: '', book_publisher: '',
  book_position: '', category_id: null, book_stock: 1, book_cover: '', book_desc: ''
})

const dialogTitle = computed(() => isEditing.value ? '编辑图书' : '添加图书')

const formRules = computed(() => {
  const rules = {
    book_isbn: [{ required: true, message: '请输入ISBN号', trigger: 'blur' }],
    book_name: [{ required: true, message: '请输入图书名称', trigger: 'blur' }],
    book_author: [{ required: true, message: '请输入作者', trigger: 'blur' }]
  }
  if (!isEditing.value) {
    rules.book_stock = [{ required: true, message: '请输入库存数量', trigger: 'blur' }]
  }
  return rules
})

const gradientPalette = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
  'linear-gradient(135deg, #f5576c, #ff6a88)'
]

function getCoverGradient(name) {
  if (!name) return gradientPalette[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return gradientPalette[Math.abs(hash) % gradientPalette.length]
}

function getStockType(book) {
  const available = book.book_available ?? 0
  if (available <= 0) return 'danger'
  if (available <= 2) return 'warning'
  return 'success'
}

async function loadBooks() {
  loading.value = true
  try {
    const res = await getBooks()
    books.value = res.data || []
  } catch (err) {
    ElMessage.error('加载图书列表失败')
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (err) { console.error('Load categories error:', err) }
}

async function handleSearch() {
  const kw = searchKeyword.value.trim()
  if (!kw) { loadBooks(); return }
  loading.value = true
  try {
    const res = await searchBooksByName(kw)
    books.value = res.data || []
  } catch (err) {
    ElMessage.error('搜索图书失败')
  } finally { loading.value = false }
}

function handleReset() { searchKeyword.value = ''; loadBooks() }

function resetForm() {
  Object.assign(form, { book_isbn: '', book_name: '', book_author: '', book_publisher: '', book_position: '', category_id: null, book_stock: 1, book_cover: '', book_desc: '' })
}

function openAddDialog() { isEditing.value = false; editingId.value = null; resetForm(); dialogVisible.value = true }
function openEditDialog(book) {
  isEditing.value = true; editingId.value = book.book_id
  form.book_isbn = book.book_isbn || ''; form.book_name = book.book_name || ''
  form.book_author = book.book_author || ''; form.book_publisher = book.book_publisher || ''
  form.book_position = book.book_position || ''; form.category_id = book.category_id ?? null
  form.book_cover = book.book_cover || ''; form.book_desc = book.book_desc || ''
  form.book_stock = 1
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    const payload = {
      book_isbn: form.book_isbn, book_name: form.book_name, book_author: form.book_author,
      book_publisher: form.book_publisher, book_position: form.book_position,
      category_id: form.category_id, book_cover: form.book_cover, book_desc: form.book_desc
    }
    if (isEditing.value) {
      await updateBook(editingId.value, payload)
      ElMessage.success('图书更新成功')
    } else {
      payload.book_stock = form.book_stock
      await addBook(payload)
      ElMessage.success('图书添加成功')
    }
    dialogVisible.value = false
    loadBooks()
  } catch (err) {
    // handled by interceptor
  } finally { submitting.value = false }
}

onMounted(() => { loadBooks(); loadCategories() })
</script>

<style lang="scss" scoped>
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.book-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.12);
    .book-overlay { opacity: 1; visibility: visible; }
  }
}

.book-cover {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  background: #f5f7fa;
}

.cover-image {
  width: 100%; height: 100%; object-fit: cover; display: block;
}

.cover-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 56px; font-weight: 700; color: rgba(255,255,255,0.85);
}

.book-overlay {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  opacity: 0; visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
}

.book-info { padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 6px; }
.book-name { font-size: 15px; font-weight: 600; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.book-author { font-size: 13px; color: #606266; }
.book-publisher { font-size: 12px; color: #909399; }
.book-meta { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.book-isbn { font-size: 12px; color: #909399; max-width: 140px; }
.book-stock { margin-top: 2px; }
</style>
