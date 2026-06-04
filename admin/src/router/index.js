import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/',
    component: () => import('@/views/Layout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' }
      },
      {
        path: 'users',
        name: 'UserList',
        component: () => import('@/views/user/UserList.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'categories',
        name: 'CategoryList',
        component: () => import('@/views/category/CategoryList.vue'),
        meta: { title: '分类管理', icon: 'Grid' }
      },
      {
        path: 'books',
        name: 'BookList',
        component: () => import('@/views/book/BookList.vue'),
        meta: { title: '图书管理', icon: 'Reading' }
      },
      {
        path: 'borrow/audit',
        name: 'BorrowAudit',
        component: () => import('@/views/borrow/BorrowAudit.vue'),
        meta: { title: '借阅审核', icon: 'Check' }
      },
      {
        path: 'borrow/return-audit',
        name: 'ReturnAudit',
        component: () => import('@/views/borrow/ReturnAudit.vue'),
        meta: { title: '归还审核', icon: 'RefreshLeft' }
      },
      {
        path: 'borrow/renew-audit',
        name: 'RenewAudit',
        component: () => import('@/views/borrow/RenewAudit.vue'),
        meta: { title: '续借审核', icon: 'Refresh' }
      },
      {
        path: 'borrow/records',
        name: 'BorrowRecords',
        component: () => import('@/views/borrow/BorrowRecords.vue'),
        meta: { title: '借阅记录', icon: 'Document' }
      },
      {
        path: 'messages',
        name: 'MessageList',
        component: () => import('@/views/message/MessageList.vue'),
        meta: { title: '反馈管理', icon: 'ChatLineSquare' }
      },
      {
        path: 'notes',
        name: 'NoteList',
        component: () => import('@/views/note/NoteList.vue'),
        meta: { title: '心得管理', icon: 'EditPen' }
      },
      {
        path: 'notices',
        name: 'NoticeList',
        component: () => import('@/views/notice/NoticeList.vue'),
        meta: { title: '公告管理', icon: 'Bell' }
      },
      {
        path: 'overdues',
        name: 'OverdueList',
        component: () => import('@/views/overdue/OverdueList.vue'),
        meta: { title: '逾期管理', icon: 'WarningFilled' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.path !== '/login' && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
