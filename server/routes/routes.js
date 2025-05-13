const express = require('express');
const router = express.Router();
const routesModel = require('../models/routes');

// 获取所有路线
router.get('/', async (req, res) => {
  try {
    const routes = await routesModel.getAllRoutes();
    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.get('/search', async (req, res) => {
  try {
    const { term } = req.query;
    if (!term || term.trim() === '') {
      return res.status(400).json({ message: '查询参数 term 是必需的' });
    }

    // 调用模型方法进行模糊搜索
    const routes = await routesModel.searchRoutesByName(term.trim());
    res.json(routes);
  } catch (error) {
    console.error('搜索路线失败:', error);
    res.status(500).json({ error: '搜索路线失败' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    console.log('接收到的参数:', req.params); // 打印参数
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      console.error('无效的 ID:', req.params.id); // 打印无效的 ID
      return res.status(400).json({ error: 'ID 必须是一个整数' });
    }
    const route = await routesModel.getRouteById(id);
    if (route) {
      res.json(route);
    } else {
      res.status(404).json({ message: '路线不存在' });
    }
  } catch (error) {
    console.error('获取路线失败:', error);
    res.status(500).json({ error: '获取路线失败' });
  }
});

// 获取路线的所有站点
router.get('/:id/stations', async (req, res) => {
  try {
    const stations = await routesModel.getRouteStations(req.params.id);
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建新路线
router.post('/', async (req, res) => {
  try {
    const newRoute = await routesModel.addRoute(req.body);
    res.status(201).json(newRoute);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新路线信息
router.put('/:id', async (req, res) => {
  try {
    const updatedRoute = await routesModel.updateRoute(req.params.id, req.body);
    if (updatedRoute) {
      res.json(updatedRoute);
    } else {
      res.status(404).json({ message: '路线不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除路线
router.delete('/:id', async (req, res) => {
  try {
    const deletedRoute = await routesModel.deleteRoute(req.params.id);
    if (deletedRoute) {
      res.json({ message: '路线已成功删除' });
    } else {
      res.status(404).json({ message: '路线不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 添加站点到路线
router.post('/:routeId/stations/:stationId', async (req, res) => {
  try {
    const { order } = req.body;
    const result = await routesModel.addStationToRoute(req.params.routeId, req.params.stationId, order);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 从路线中移除站点
router.delete('/:routeId/stations/:stationId', async (req, res) => {
  try {
    const result = await routesModel.removeStationFromRoute(req.params.routeId, req.params.stationId);
    if (result) {
      res.json({ message: '站点已从路线中移除' });
    } else {
      res.status(404).json({ message: '关联不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;