const db = require('../config/db');

// 路线模型，处理与公交路线相关的数据库操作
const routeModel = {
  // 获取所有路线
  getAllRoutes: async () => {
    try {
      const result = await db.query(`
        SELECT r.*, 
               s1.name as start_station_name, 
               s2.name as end_station_name 
        FROM routes r
        LEFT JOIN stations s1 ON r.start_station = s1.station_id
        LEFT JOIN stations s2 ON r.end_station = s2.station_id
        ORDER BY r.route_id`);
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // 根据ID获取单个路线
  getRouteById: async (id) => {
    try {
      const result = await db.query(`
        SELECT r.*, 
               s1.name as start_station_name, 
               s2.name as end_station_name 
        FROM routes r
        LEFT JOIN stations s1 ON r.start_station = s1.station_id
        LEFT JOIN stations s2 ON r.end_station = s2.station_id
        WHERE r.route_id = $1`, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 添加新路线
  addRoute: async (route) => {
    const { name, start_station, end_station, distance, description } = route;
    try {
      const result = await db.query(
        'INSERT INTO routes (name, start_station, end_station, distance, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, start_station, end_station, distance, description]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 更新路线信息
  updateRoute: async (id, route) => {
    const { name, start_station, end_station, distance, description } = route;
    try {
      const result = await db.query(
        'UPDATE routes SET name = $1, start_station = $2, end_station = $3, distance = $4, description = $5, updated_at = CURRENT_TIMESTAMP WHERE route_id = $6 RETURNING *',
        [name, start_station, end_station, distance, description, id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 删除路线
  deleteRoute: async (id) => {
    try {
      const result = await db.query('DELETE FROM routes WHERE route_id = $1 RETURNING *', [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 获取路线的所有站点
  getRouteStations: async (routeId) => {
    try {
      const result = await db.query(
        `SELECT s.*, rs.station_order
         FROM stations s
         JOIN route_stations rs ON s.station_id = rs.station_id
         WHERE rs.route_id = $1 
         ORDER BY rs.station_order`,
        [routeId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },

  // 添加站点到路线
  addStationToRoute: async (routeId, stationId, stationOrder) => {
    try {
      const result = await db.query(
        'INSERT INTO route_stations (route_id, station_id, station_order) VALUES ($1, $2, $3) RETURNING *',
        [routeId, stationId, stationOrder]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // 从路线中移除站点
  removeStationFromRoute: async (routeId, stationId) => {
    try {
      const result = await db.query(
        'DELETE FROM route_stations WHERE route_id = $1 AND station_id = $2 RETURNING *',
        [routeId, stationId]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
};

module.exports = routeModel;