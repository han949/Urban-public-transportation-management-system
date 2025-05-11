const db = require('../config/db');

// 站点模型，处理与站点相关的数据库操作
const stationModel = {
  // 获取所有站点
  getAllStations: async () => {
    try {
      const result = await db.query('SELECT * FROM stations ORDER BY station_id');
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // 根据ID获取单个站点
  getStationById: async (id) => {
    try {
      const result = await db.query('SELECT * FROM stations WHERE station_id = $1', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 添加新站点
  addStation: async (station) => {
    const { name, longitude, latitude, address, description } = station;
    try {
      const result = await db.query(
        'INSERT INTO stations (name, longitude, latitude, address, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, longitude, latitude, address, description]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 更新站点信息
  updateStation: async (id, station) => {
    const { name, longitude, latitude, address, description } = station;
    try {
      const result = await db.query(
        'UPDATE stations SET name = $1, longitude = $2, latitude = $3, address = $4, description = $5 WHERE station_id = $6 RETURNING *',
        [name, longitude, latitude, address, description, id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 删除站点
  deleteStation: async (id) => {
    try {
      const result = await db.query('DELETE FROM stations WHERE station_id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = stationModel;