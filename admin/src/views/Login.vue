<template>
  <div class="login-page">
    <!-- Background decoration -->
    <div class="login-bg">
      <div class="bg-shape shape-1"></div>
      <div class="bg-shape shape-2"></div>
      <div class="bg-shape shape-3"></div>
    </div>

    <div class="login-container">
      <!-- Left brand panel -->
      <div class="login-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <el-icon :size="48"><Reading /></el-icon>
          </div>
          <h1 class="brand-title">图书借阅管理系统</h1>
          <p class="brand-desc">智能化图书馆管理平台，让图书管理更高效</p>
          <div class="brand-features">
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>便捷的借阅审核流程</span>
            </div>
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>实时逾期监控提醒</span>
            </div>
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>完善的图书分类管理</span>
            </div>
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>数据统计一目了然</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right login form -->
      <div class="login-form-panel">
        <div class="form-wrapper">
          <h2 class="form-title">管理员登录</h2>
          <p class="form-subtitle">欢迎回来，请登录您的账号</p>

          <el-form
            ref="formRef"
            :model="loginForm"
            :rules="rules"
            class="login-form"
            size="large"
            @keyup.enter="handleLogin"
          >
            <el-form-item prop="user_phone">
              <el-input
                v-model="loginForm.user_phone"
                placeholder="请输入手机号"
                :prefix-icon="Phone"
                clearable
              />
            </el-form-item>

            <el-form-item prop="user_pwd">
              <el-input
                v-model="loginForm.user_pwd"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                class="login-btn"
                :loading="loading"
                @click="handleLogin"
              >
                {{ loading ? '登录中...' : '登 录' }}
              </el-button>
            </el-form-item>
          </el-form>

          <div class="login-tips">
            <el-icon><InfoFilled /></el-icon>
            <span>仅限管理员账号登录</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Phone, Lock, InfoFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  user_phone: '',
  user_pwd: ''
})

const rules = {
  user_phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  user_pwd: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await userStore.login(loginForm)
    if (res.data.user_role !== 2) {
      ElMessage.error('该账号不是管理员，无法登录后台')
      userStore.logout()
      return
    }
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } catch (err) {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

// Animated background shapes
.login-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  .bg-shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
    background: #fff;
  }
  .shape-1 {
    width: 500px;
    height: 500px;
    top: -150px;
    right: -100px;
    animation: float 8s ease-in-out infinite;
  }
  .shape-2 {
    width: 300px;
    height: 300px;
    bottom: -80px;
    left: -60px;
    animation: float 6s ease-in-out infinite reverse;
  }
  .shape-3 {
    width: 200px;
    height: 200px;
    top: 50%;
    left: 40%;
    animation: float 10s ease-in-out infinite;
  }
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-30px) scale(1.05); }
}

.login-container {
  display: flex;
  width: 960px;
  min-height: 560px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(20px);
}

// Left brand panel
.login-brand {
  flex: 1;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle, rgba(64, 158, 255, 0.15) 0%, transparent 70%);
  }
}

.brand-content {
  position: relative;
  z-index: 1;
  color: #fff;
}

.brand-logo {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: rgba(64, 158, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: #409eff;
}

.brand-title {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 8px;
  letter-spacing: 2px;
}

.brand-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 32px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 14px;
  .feature-item {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    .el-icon {
      color: #67c23a;
      font-size: 16px;
    }
  }
}

// Right login form
.login-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.form-wrapper {
  width: 100%;
  max-width: 360px;
}

.form-title {
  font-size: 26px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 6px;
}

.form-subtitle {
  font-size: 14px;
  color: #909399;
  margin-bottom: 36px;
}

.login-form {
  .el-input {
    --el-input-border-radius: 10px;
    --el-input-bg-color: #f5f7fa;
    --el-input-focus-border-color: #409eff;
  }

  .el-form-item {
    margin-bottom: 20px;
  }
}

.login-btn {
  width: 100%;
  height: 46px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  &:hover {
    opacity: 0.9;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}

.login-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: #c0c4cc;
}
</style>
