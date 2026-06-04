# 图书借阅管理系统 📚

基于 **Node.js + Express + MySQL** 后端 + **Vue 3 + Element Plus** 管理前端的图书借阅管理系统，支持用户借书、还书、续借、逾期罚款、意见反馈、读书笔记、系统公告等完整业务流程。

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **后端框架** | Express | 4.22+ |
| **数据库** | MySQL | 8.0+ |
| **数据库驱动** | mysql2 (Promise) | - |
| **身份认证** | JWT (jsonwebtoken) | 9.x |
| **密码加密** | bcryptjs | 2.x |
| **定时任务** | node-schedule | 2.x |
| **前端框架** | Vue 3 (Composition API) | 3.x |
| **构建工具** | Vite | 5.x |
| **UI 组件库** | Element Plus | 2.x |
| **状态管理** | Pinia | 2.x |
| **图表** | ECharts 5 | 5.x |
| **HTTP 客户端** | Axios | 1.x |
| **CSS 预处理** | Sass | 1.x |

---

## 功能特性

### 用户端 API
- 📝 用户注册 / 登录（手机号 + 密码 + 短信验证码）
- 🔑 JWT 身份认证，密码找回
- 📖 图书浏览、搜索、分类筛选
- 📥 借书申请（最多同时借阅 5 本）
- 📤 还书申请
- 🔄 续借申请（每本书可续借 1 次，延长 30 天）
- ⏰ 逾期自动计算罚款（0.5 元/天，上限 50 元）
- 💬 用户意见反馈（借书/还书/押金/其他）
- 📝 读书笔记发布、浏览、点赞
- 📢 系统公告浏览
- 📬 站内消息通知

### 管理后台 (Vue 3 SPA)
- 📊 **数据仪表盘**：图书总数、用户总数、借阅中数量、逾期数量；近 7 天借阅趋势图；分类饼图；近期借阅记录
- 👥 **用户管理**：查看所有用户、编辑用户信息
- 📂 **分类管理**：图书分类增删改查
- 📚 **图书管理**：图书信息录入、编辑、库存管理
- 🔍 **借阅审核**：借书审核、还书审核、续借审核
- 📋 **借阅记录**：全部借阅历史查询
- 💬 **反馈管理**：用户反馈回复与处理
- 📝 **笔记管理**：读书笔记审核管理
- 📢 **公告管理**：系统公告发布
- ⚠️ **逾期管理**：逾期记录追踪、罚款缴纳、逾期提醒推送

### 自动化
- ⏰ 每天上午 9:00 自动扫描逾期记录并推送提醒消息

---

## 项目结构

```
broowjs/
├── app.js                      # 后端入口，Express 服务启动
├── package.json                # 后端依赖
├── .env                        # 环境变量（需自行创建）
├── .gitignore
├── README.md
│
├── db/
│   ├── book_system.sql         # 完整数据库建表 + 种子数据
│   └── db.js                   # MySQL 连接池
│
├── middleware/
│   └── auth.js                 # JWT 认证中间件 + 管理员权限中间件
│
├── utils/
│   └── index.js                # 密码加密 / JWT 生成工具
│
├── routes/
│   ├── user.js                 # 用户相关接口
│   ├── category.js             # 分类相关接口
│   ├── book.js                 # 图书相关接口
│   ├── borrow.js               # 借阅/还书/续借接口
│   ├── message.js              # 用户反馈接口
│   ├── note.js                 # 读书笔记接口
│   ├── notice.js               # 系统公告接口
│   └── overdue.js              # 逾期管理接口
│
└── admin/                      # Vue 3 管理后台
    ├── package.json
    ├── vite.config.js          # Vite 配置（含 API 代理）
    ├── index.html
    └── src/
        ├── main.js             # Vue 应用入口
        ├── App.vue
        ├── router/index.js     # 路由配置（含登录守卫）
        ├── stores/             # Pinia 状态管理
        │   ├── user.js         # 用户认证状态
        │   └── app.js          # 应用全局状态
        ├── api/                # Axios 封装的 API 接口
        │   ├── request.js      # Axios 实例 + 拦截器
        │   ├── user.js
        │   ├── book.js
        │   ├── borrow.js
        │   └── ...
        ├── styles/index.scss   # 全局样式
        └── views/              # 页面组件
            ├── Login.vue
            ├── Layout.vue
            ├── dashboard/Dashboard.vue
            ├── user/UserList.vue
            ├── category/CategoryList.vue
            ├── book/BookList.vue
            ├── borrow/         # BorrowAudit / ReturnAudit / RenewAudit / BorrowRecords
            ├── message/MessageList.vue
            ├── note/NoteList.vue
            ├── notice/NoticeList.vue
            └── overdue/OverdueList.vue
```

---

## 快速开始（本地开发）

### 环境要求

- **Node.js** >= 18.x
- **MySQL** >= 8.0
- **npm** >= 9.x

### 1. 克隆项目

```bash
git clone https://github.com/zyh-bit-ui/Borrowing.git
cd Borrowing
```

### 2. 配置数据库

登录 MySQL，创建数据库并导入 SQL 文件：

```sql
CREATE DATABASE IF NOT EXISTS book_system
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
```

```bash
# 导入表结构和种子数据
mysql -u root -p book_system < db/book_system.sql
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
PORT=3000
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-database-password-here
DB_NAME=book_system
DB_PORT=3306
```

> ⚠️ **生产环境请务必修改 `JWT_SECRET` 和 `DB_PASSWORD`！**

### 4. 安装依赖

```bash
# 安装后端依赖
npm install

# 安装前端依赖
cd admin
npm install
cd ..
```

### 5. 启动开发服务

```bash
# 终端 1：启动后端服务（端口 3000）
npm run dev

# 终端 2：启动前端开发服务（端口 5173）
cd admin
npm run dev
```

访问 `http://localhost:5173` 进入管理后台。

### 6. 默认管理员账号

| 字段 | 值 |
|------|-----|
| 手机号 | `***********` |
| 密码 | `******` |

---

## 生产环境部署

### 方式一：一体式部署（推荐）

后端 Express 直接托管前端静态文件，只需启动一个端口。

#### 1. 构建前端

```bash
cd admin
npm run build
```

产物输出到 `admin/dist/`。

#### 2. 修改 `app.js`，添加静态文件托管

在 `app.js` 的路由挂载和 404 处理之间添加：

```js
const path = require('path');

// 托管前端静态文件
app.use(express.static(path.join(__dirname, 'admin/dist')));

// SPA fallback：所有非 API 请求返回 index.html
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/dist', 'index.html'));
});
```

#### 3. 启动服务

```bash
# 使用 PM2 持久化运行（推荐）
npm install -g pm2
pm2 start app.js --name book-borrow
pm2 save
pm2 startup

# 或者直接运行
npm start
```

访问 `http://your-server-ip:3000` 即可使用。

#### 4. Nginx 反向代理（可选）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 方式二：前后端分离部署

- **后端**：用 PM2 运行 `app.js`，端口 3000
- **前端**：将 `admin/dist/` 部署到 Nginx 或其他静态服务器，配置反向代理将 `/api/*` 转发到后端

Nginx 示例：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    root /path/to/admin/dist;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 数据库表概览

| 表名 | 说明 |
|------|------|
| `t_user` | 用户表（含管理员） |
| `t_book` | 图书表 |
| `t_book_category` | 分类表 |
| `t_borrow_record` | 借阅记录表 |
| `t_borrow_apply` | 借书申请表 |
| `t_return_apply` | 还书申请表 |
| `t_renew_apply` | 续借申请表 |
| `t_overdue_record` | 逾期罚款记录表 |
| `t_message` | 站内消息表 |
| `t_feedback` | 用户意见反馈表 |
| `t_sms_code` | 短信验证码表 |
| `t_book_note` | 读书笔记表 |
| `t_notice` | 系统公告表 |

---

## API 接口概览

所有接口前缀 `/api`，除登录/注册/公开查询外均需携带 JWT Token（`Authorization: Bearer <token>`）。

| 模块 | 路径前缀 | 主要功能 |
|------|----------|----------|
| 用户 | `/api/users` | 注册、登录、短信验证码、忘记密码、个人资料 |
| 分类 | `/api/categories` | 分类列表、新增分类（管理员） |
| 图书 | `/api/books` | 图书列表、详情、搜索、新增/编辑（管理员） |
| 借阅 | `/api/borrows` | 借书/还书/续借申请与审核 |
| 反馈 | `/api/message` | 提交反馈、管理员回复/关闭 |
| 笔记 | `/api/notes` | 发布笔记、列表、点赞 |
| 公告 | `/api/notices` | 发布公告（管理员）、列表、详情 |
| 逾期 | `/api/overdues` | 逾期记录、罚款缴纳、提醒推送 |

---

## 业务规则

| 规则 | 说明 |
|------|------|
| 最大借阅数 | 每人最多同时借阅 **5 本**（含待审核申请） |
| 借阅期限 | **30 天** |
| 续借次数 | 每本书最多续借 **1 次**，延长 30 天 |
| 逾期罚款 | **0.5 元/天**，上限 **50 元** |
| 验证码有效期 | **5 分钟**，60 秒内不可重复发送 |

---

## 常见问题

### 数据库连接失败
- 确认 MySQL 服务已启动
- 检查 `.env` 中的数据库连接信息是否正确
- 确认数据库 `book_system` 已创建并导入了 SQL

### 登录失败
- 确认已导入 `db/book_system.sql` 中的种子数据
- 默认管理员账号：手机号 `***********`，密码 `******`
- 密码使用 bcrypt 加密存储，请勿直接修改数据库中的密码字段

### 端口被占用
- 修改 `.env` 中的 `PORT` 为其他端口
- 如果修改了后端端口，需要同步修改 `admin/vite.config.js` 中的代理目标

---

## License

MIT
