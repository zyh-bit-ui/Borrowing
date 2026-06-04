<template>
  <div class="admin-layout" :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }">
    <!-- Sidebar -->
    <aside class="admin-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo" @click="goHome">
          <el-icon :size="28"><Reading /></el-icon>
          <span v-show="!appStore.sidebarCollapsed" class="logo-text">图书借阅</span>
        </div>
      </div>

      <el-scrollbar class="sidebar-menu-wrap">
        <el-menu
          :default-active="activeMenu"
          :collapse="appStore.sidebarCollapsed"
          :unique-opened="true"
          background-color="transparent"
          text-color="rgba(255,255,255,0.7)"
          active-text-color="#fff"
          router
          @select="onMenuSelect"
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <template #title>仪表盘</template>
          </el-menu-item>

          <el-menu-item index="/users">
            <el-icon><User /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>

          <el-sub-menu index="book-mgmt">
            <template #title>
              <el-icon><Reading /></el-icon>
              <span>图书管理</span>
            </template>
            <el-menu-item index="/categories">
              <el-icon><Grid /></el-icon>
              <span>分类管理</span>
            </el-menu-item>
            <el-menu-item index="/books">
              <el-icon><Notebook /></el-icon>
              <span>图书列表</span>
            </el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="borrow-mgmt">
            <template #title>
              <el-icon><Tickets /></el-icon>
              <span>借阅管理</span>
            </template>
            <el-menu-item index="/borrow/audit">
              <el-icon><Check /></el-icon>
              <span>借阅审核</span>
            </el-menu-item>
            <el-menu-item index="/borrow/return-audit">
              <el-icon><RefreshLeft /></el-icon>
              <span>归还审核</span>
            </el-menu-item>
            <el-menu-item index="/borrow/renew-audit">
              <el-icon><Refresh /></el-icon>
              <span>续借审核</span>
            </el-menu-item>
            <el-menu-item index="/borrow/records">
              <el-icon><Document /></el-icon>
              <span>借阅记录</span>
            </el-menu-item>
          </el-sub-menu>

          <el-menu-item index="/messages">
            <el-icon><ChatLineSquare /></el-icon>
            <template #title>反馈管理</template>
          </el-menu-item>

          <el-menu-item index="/notes">
            <el-icon><EditPen /></el-icon>
            <template #title>心得管理</template>
          </el-menu-item>

          <el-menu-item index="/notices">
            <el-icon><Bell /></el-icon>
            <template #title>公告管理</template>
          </el-menu-item>

          <el-menu-item index="/overdues">
            <el-icon><WarningFilled /></el-icon>
            <template #title>逾期管理</template>
          </el-menu-item>
        </el-menu>
      </el-scrollbar>
    </aside>

    <!-- Main content area -->
    <div class="admin-main">
      <!-- Header -->
      <header class="admin-header">
        <div class="header-left">
          <div class="collapse-btn" @click="appStore.toggleSidebar()">
            <el-icon :size="20"><Fold v-if="!appStore.sidebarCollapsed" /><Expand v-else /></el-icon>
          </div>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="pageTitle">{{ pageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-tooltip content="刷新页面" placement="bottom">
            <div class="header-action" @click="refreshPage">
              <el-icon :size="18"><Refresh /></el-icon>
            </div>
          </el-tooltip>

          <!-- User dropdown -->
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="header-user">
              <el-avatar :size="34" :icon="UserFilled" />
              <span class="user-name">{{ userStore.userName }}</span>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>个人信息
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- Page content -->
      <main class="admin-content">
        <router-view v-slot="{ Component }">
          <transition name="slide-fade" mode="out-in">
            <keep-alive :include="cachedViews">
              <component :is="Component" />
            </keep-alive>
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const appStore = useAppStore()

const cachedViews = ['Dashboard', 'UserList', 'BookList', 'CategoryList',
  'BorrowAudit', 'ReturnAudit', 'RenewAudit', 'BorrowRecords',
  'MessageList', 'NoteList', 'NoticeList', 'OverdueList']

const activeMenu = computed(() => {
  const { path } = route
  if (path.startsWith('/borrow')) return path
  if (path.startsWith('/categories') || path.startsWith('/books')) return path
  return path
})

const pageTitle = computed(() => route.meta?.title || '')

function goHome() {
  router.push('/dashboard')
}

function onMenuSelect(index) {
  // handled by router
}

function refreshPage() {
  router.replace({ path: '/redirect' + route.path, query: route.query })
}

function handleCommand(cmd) {
  if (cmd === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
    }).catch(() => {})
  } else if (cmd === 'profile') {
    // Show profile info
  }
}
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

// ============ Sidebar ============
.admin-sidebar {
  width: var(--sidebar-width);
  height: 100%;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  flex-shrink: 0;
  position: relative;
  z-index: 100;

  .sidebar-collapsed & {
    width: var(--sidebar-collapsed-width);
  }
}

.sidebar-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  color: #409eff;
  .logo-text {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    letter-spacing: 2px;
  }
}

.sidebar-menu-wrap {
  flex: 1;
  overflow-y: auto;

  :deep(.el-menu) {
    border-right: none;
    padding: 8px 0;
  }

  :deep(.el-menu-item),
  :deep(.el-sub-menu__title) {
    height: 48px;
    line-height: 48px;
    margin: 2px 8px;
    border-radius: 10px;
    transition: all 0.3s;

    &:hover {
      background: rgba(64, 158, 255, 0.15) !important;
    }
  }

  :deep(.el-menu-item.is-active) {
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.3), rgba(64, 158, 255, 0.15)) !important;
    border-right: 3px solid #409eff;
    font-weight: 600;
  }

  :deep(.el-sub-menu .el-menu) {
    background: rgba(0, 0, 0, 0.15) !important;
  }

  :deep(.el-sub-menu .el-menu-item) {
    height: 42px;
    line-height: 42px;
    padding-left: 56px !important;
    font-size: 13px;
  }
}

// ============ Main Area ============
.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ============ Header ============
.admin-header {
  height: var(--header-height);
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  z-index: 99;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s;
  &:hover {
    background: #f0f2f5;
    color: #409eff;
  }
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-action {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  color: #606266;
  transition: all 0.3s;
  &:hover {
    background: #f0f2f5;
    color: #409eff;
  }
}

.header-user {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  &:hover {
    background: #f0f2f5;
  }
  .user-name {
    font-size: 14px;
    color: #303133;
    font-weight: 500;
  }
  .dropdown-arrow {
    font-size: 12px;
    color: #909399;
  }
}

// ============ Content ============
.admin-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: var(--bg-color);
}
</style>
