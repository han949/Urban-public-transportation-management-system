const express = require('express');
const router = express.Router();
const stationsModel = require('../models/stations');

// 获取所有站点
router.get('/', async (req, res) => {
  try {
    const stations = await stationsModel.getAllStations();
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 搜索站点 - 固定路径要放在参数路径前面
router.get('/search', async (req, res) => {
  try {
    const term = req.query.term || '';
    const stations = await stationsModel.searchStations(term);
    res.json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// 获取单个站点 - 参数路由放在后面
router.get('/:id', async (req, res) => {
  try {
    const station = await stationsModel.getStationById(req.params.id);
    if (station) {
      res.json(station);
    } else {
      res.status(404).json({ message: '站点不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建新站点
router.post('/', async (req, res) => {
  try {
    const newStation = await stationsModel.addStation(req.body);
    res.status(201).json(newStation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新站点信息
router.put('/:id', async (req, res) => {
  try {
    const updatedStation = await stationsModel.updateStation(req.params.id, req.body);
    if (updatedStation) {
      res.json(updatedStation);
    } else {
      res.status(404).json({ message: '站点不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除站点
router.delete('/:id', async (req, res) => {
  try {
    const deletedStation = await stationsModel.deleteStation(req.params.id);
    if (deletedStation) {
      res.json({ message: '站点已成功删除' });
    } else {
      res.status(404).json({ message: '站点不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;