<template>
  <div class="page-container">
    <div class="page-header flex-between">
      <div>
        <h2 class="page-title">分类管理</h2>
        <p class="page-desc">管理图书分类信息</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openAddDialog">添加分类</el-button>
    </div>

    <div class="content-card">
      <el-table :data="categories" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="category_id" label="分类ID" width="100" align="center" />
        <el-table-column prop="category_name" label="分类名称" width="200" />
        <el-table-column prop="category_desc" label="分类描述" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">{{ row.category_desc || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button type="primary" link :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑分类' : '添加分类'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="category_name">
          <el-input v-model="form.category_name" placeholder="请输入分类名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="分类描述" prop="category_desc">
          <el-input v-model="form.category_desc" type="textarea" :rows="3" placeholder="请输入分类描述（选填）" maxlength="100" show-word-limit />
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
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { getCategories, addCategory } from '@/api/category'

const loading = ref(false)
const submitting = ref(false)
const categories = ref([])
const dialogVisible = ref(false)
const editing = ref(false)
const formRef = ref(null)

const form = reactive({
  category_name: '',
  category_desc: ''
})

const rules = {
  category_name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 20, message: '分类名称不超过20个字符', trigger: 'blur' }
  ]
}

async function loadCategories() {
  loading.value = true
  try {
    const res = await getCategories()
    categories.value = res.data || []
  } catch (err) {
    console.error('Load categories error:', err)
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  editing.value = false
  form.category_name = ''
  form.category_desc = ''
  dialogVisible.value = true
}

function handleEdit(row) {
  ElMessage.info('编辑功能开发中')
}

function handleDelete(row) {
  ElMessage.info('删除功能开发中')
}

async function handleSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    await addCategory({ category_name: form.category_name, category_desc: form.category_desc })
    ElMessage.success('添加分类成功')
    dialogVisible.value = false
    loadCategories()
  } catch (err) {
    // handled by interceptor
  } finally {
    submitting.value = false
  }
}

loadCategories()
</script>
