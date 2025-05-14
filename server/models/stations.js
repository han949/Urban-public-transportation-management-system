const db = require('../config/db');

// 站点模型，处理与站点相关的数据库操作
const stationModel = {
  // 获取所有站点
  getAllStations: async () => {
    try {
      const result = await db.query(`
        SELECT 
          id as station_id,
          name,
          line, 
          name_st as address,
          ST_AsGeoJSON(geom) as geometry,
          ST_X(geom) as longitude,
          ST_Y(geom) as latitude
        FROM stations
        ORDER BY station_id
      `);
      return result.rows;
    } catch (error) {
      console.error('获取所有站点失败:', error);
      throw new Error('获取所有站点失败');
    }
  },

  // 根据ID获取单个站点
  getStationById: async (id) => {
    try {
      const result = await db.query(`
        SELECT 
          id as station_id,
          name,
          line,
          name_st as address,
          ST_AsGeoJSON(geom) as geometry,
          ST_X(geom) as longitude,
          ST_Y(geom) as latitude
        FROM stations
        WHERE id = $1
      `, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('获取站点详情失败:', error);
      throw new Error('获取站点详情失败');
    }
  },

  // 搜索站点
  searchStations: async (term) => {
    try {
      const result = await db.query(`
        SELECT 
          id as station_id,
          name,
          line,
          name_st as address,
          ST_AsGeoJSON(geom) as geometry,
          ST_X(geom) as longitude,
          ST_Y(geom) as latitude
        FROM stations
        WHERE name ILIKE $1 OR line ILIKE $1
        ORDER BY station_id
      `, [`%${term}%`]);
      return result.rows;
    } catch (error) {
      console.error('搜索站点失败:', error);
      throw new Error('搜索站点失败');
    }
  },

  // 添加新站点
  addStation: async (station) => {
    const { name, line, address, longitude, latitude } = station;
    try {
      const result = await db.query(`
        INSERT INTO stations (name, line, name_st, geom)
        VALUES ($1, $2, $3, ST_SetSRID(ST_Point($4, $5), 4326))
        RETURNING 
          id as station_id,
          name,
          line,
          name_st as address,
          ST_AsGeoJSON(geom) as geometry,
          ST_X(geom) as longitude,
          ST_Y(geom) as latitude
      `, [name, line || '', address || '', longitude, latitude]);
      return result.rows[0];
    } catch (error) {
      console.error('添加站点失败:', error);
      throw new Error('添加站点失败');
    }
  },

  // 更新站点信息
  updateStation: async (id, station) => {
    const { name, line, address, longitude, latitude } = station;
    try {
      const result = await db.query(`
        UPDATE stations
        SET 
          name = $1,
          line = $2,
          name_st = $3,
          geom = ST_SetSRID(ST_Point($4, $5), 4326)
        WHERE id = $6
        RETURNING 
          id as station_id,
          name,
          line,
          name_st as address,
          ST_AsGeoJSON(geom) as geometry,
          ST_X(geom) as longitude,
          ST_Y(geom) as latitude
      `, [name, line || '', address || '', longitude, latitude, id]);
      return result.rows[0];
    } catch (error) {
      console.error('更新站点失败:', error);
      throw new Error('更新站点失败');
    }
  },

  // 删除站点
  deleteStation: async (id) => {
    try {
      const result = await db.query('DELETE FROM stations WHERE id = $1 RETURNING id as station_id', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('删除站点失败:', error);
      throw new Error('删除站点失败');
    }
  }
};

module.exports = stationModel;