import { defineStore } from 'pinia'
import { login as loginApi, getUserProfile } from '@/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: null
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.userInfo?.user_role === 2,
    userName: (state) => state.userInfo?.user_name || '管理员',
    userAvatar: (state) => state.userInfo?.user_avatar || ''
  },
  actions: {
    async login(credentials) {
      const res = await loginApi(credentials)
      // 登录接口返回 data 直接包含用户字段: { user_id, user_role, user_name, token }
      this.token = res.data.token
      this.userInfo = {
        user_id: res.data.user_id,
        user_name: res.data.user_name,
        user_role: res.data.user_role,
        user_phone: res.data.user_phone
      }
      return res
    },
    async fetchProfile() {
      const res = await getUserProfile()
      this.userInfo = res.data
    },
    logout() {
      this.token = ''
      this.userInfo = null
    }
  },
  persist: {
    key: 'book-borrow-admin',
    storage: localStorage,
    pick: ['token', 'userInfo']
  }
})
