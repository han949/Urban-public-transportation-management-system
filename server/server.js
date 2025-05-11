const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../')));

// 简单的测试路由
app.get('/api/test', (req, res) => {
  res.json({ message: '服务器正常运行' });
});

// 加载路由
try {
  console.log('加载站点路由...');
  const stationsRoutes = require('./routes/stations');
  app.use('/api/stations', stationsRoutes);
  console.log('站点路由加载成功');
  
  console.log('加载路线路由...');
  const routesRoutes = require('./routes/routes');
  app.use('/api/routes', routesRoutes);
  console.log('路线路由加载成功');
} catch (error) {
  console.error('路由加载失败:', error);
}

// 默认路由返回前端应用
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
