# 公交车站点查询系统

这个系统是基于 OpenLayers 和 Express 开发的公交车站点和路线管理系统，提供了站点和路线的可视化展示、查询和管理功能。

## 功能特点

- **地图可视化**：展示公交站点和线路
- **站点管理**：添加、编辑、删除站点
- **路线管理**：添加、编辑、删除路线
- **关联管理**：站点与路线的绑定关系维护
- **信息查询**：根据名称或属性查询站点和路线
- **响应式设计**：适配移动端和桌面端

## 技术栈

### 前端
- OpenLayers（地图可视化）
- HTML5 / CSS3
- JavaScript（ES6+）
- Vite（构建工具）

### 后端
- Node.js
- Express（Web框架）
- PostgreSQL（数据库）
- node-postgres（数据库驱动）

## 安装与配置

### 前置要求
- Node.js（v18+）
- PostgreSQL（v12+）
- Git

### 安装步骤

1. 克隆代码库
```bash
git clone <仓库地址>
cd zyl
```

2. 安装依赖
```bash
npm install
```

### 数据库配置

1. 创建 PostgreSQL 数据库：
```bash
createdb busSystem
```

2. 运行初始化SQL脚本：
```bash
psql -d busSystem -f server/config/init-db.sql
```

数据库表结构说明：
- `stations` - 存储站点信息，包含id、name、location(地理坐标)、description等字段
- `routes` - 存储路线信息，包含id、name、path(路线轨迹)、description等字段
- `station_routes` - 存储站点和路线的关联关系，包含station_id和route_id字段

3. 在项目根目录创建 `.env` 文件，配置数据库连接信息：
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_username
DB_PASS=your_password
DB_NAME=busSystem
PORT=3000
```

## 运行系统

### 开发环境

1. 启动后端服务
```bash

node server/server.js
```
后端服务将运行在 http://localhost:3000

2. 启动前端开发服务器
```bash
npm run dev
```
前端开发服务器将运行在 http://localhost:5173



### 生产环境

构建前端生产版本：
```bash
npm run build
```
构建完成后，`dist` 目录下的文件可以部署到生产服务器。

## 站点查询功能

系统提供多种查询方式来检索公交站点：

1. **按名称查询**：输入站点名称或名称的一部分进行模糊匹配
2. **按路线查询**：选择特定路线，显示该路线上的所有站点
3. **按区域查询**：通过在地图上绘制多边形来查询特定区域内的站点
4. **按距离查询**：指定一个中心点和半径，查询该范围内的所有站点
5. **复合条件查询**：组合多个查询条件进行精确检索

查询结果将在地图上高亮显示，并在左侧面板中列出详细信息，支持进一步的筛选和排序。

## 系统结构

```
project/
├── client/                  # 前端代码
│   ├── src/                 # 源代码
│   │   ├── components/      # UI组件
│   │   ├── services/        # API服务
│   │   ├── styles/          # CSS样式
│   │   ├── main.js          # 入口文件
│   │   └── index.html       # HTML模板
│   └── package.json         # 前端依赖
├── server/                  # 后端代码
│   ├── config/              # 配置文件
│   │   └── init-db.sql      # 数据库初始化脚本
│   ├── controllers/         # 控制器
│   ├── models/              # 数据模型
│   ├── routes/              # 路由
│   └── server.js            # 服务入口
└── package.json             # 项目依赖
```

## 系统使用

1. 系统启动后，通过浏览器访问 http://localhost:5173
2. **功能区域**:
   - 左侧面板：提供三个功能选项卡（站点管理、路线管理和查询）
   - 中央地图区：显示站点和路线的地理位置
   - 右侧工具栏：地图工具（放大、缩小、恢复默认视图）

3. **操作流程**:
   - **站点管理**: 查看所有站点、添加新站点、编辑或删除现有站点
   - **路线管理**: 查看所有路线、添加新路线、编辑或删除现有路线
   - **查询**: 按名称或其他属性搜索站点和路线
   - **交互**: 点击地图上的站点可查看详细信息

## 注意事项

- 请确保 PostgreSQL 数据库服务已启动并正常运行
- 前端开发服务器和后端服务需要同时运行
- 系统默认使用鼠标交互，移动端支持触摸操作

## 故障排除

- 如果出现 `path-to-regexp` 相关错误，尝试运行 `npm uninstall router` 和 `npm install express@4.18.3 --force`
- 如果数据库连接失败，检查 `.env` 文件中的数据库配置信息是否正确
- 如果前端无法加载地图，确保 OpenLayers 依赖已正确安装
- 如果出现 CORS 错误，检查后端是否已正确配置跨域资源共享

## API文档

系统提供以下RESTful API：

| 路径 | 方法 | 描述 |
|------|------|------|
| `/api/stations` | GET | 获取所有站点 |
| `/api/stations/:id` | GET | 获取特定站点 |
| `/api/stations` | POST | 创建新站点 |
| `/api/stations/:id` | PUT | 更新站点 |
| `/api/stations/:id` | DELETE | 删除站点 |
| `/api/routes` | GET | 获取所有路线 |
| `/api/routes/:id` | GET | 获取特定路线 |
| `/api/routes` | POST | 创建新路线 |
| `/api/routes/:id` | PUT | 更新路线 |
| `/api/routes/:id` | DELETE | 删除路线 |

## 许可

此项目采用 MIT 许可证。

## 联系方式

如有问题或建议，请提交 Issue 或通过电子邮件联系我们：example@example.com