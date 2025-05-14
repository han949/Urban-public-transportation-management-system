const db = require('../config/db');

// 路线模型，处理与公交路线相关的数据库操作
const routeModel = {
  // 获取所有路线
  getAllRoutes: async () => {
    try {
      const result = await db.query(`
        SELECT 
          id as route_id,
          name,
          idx as route_number,
          name_gd as description,
          ST_AsGeoJSON(geom) as geometry
        FROM routes
        ORDER BY route_id
      `);
      return result.rows;
    } catch (error) {
      console.error('获取所有路线失败:', error);
      throw new Error('获取所有路线失败');
    }
  },

  // 根据ID获取单个路线
  getRouteById: async (id) => {
    try {
      const result = await db.query(`
        SELECT 
          id as route_id,
          name,
          idx as route_number,
          name_gd as description,
          ST_AsGeoJSON(geom) as geometry
        FROM routes
        WHERE id = $1
      `, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('获取路线详情失败:', error);
      throw new Error('获取路线详情失败');
    }
  },

  // 添加新路线
  addRoute: async (route) => {
    const { name, route_number, description, geometry } = route;
    try {
      // 验证geometry是否为有效的GeoJSON
      let geomValue = null;
      try {
        if (typeof geometry === 'string') {
          geomValue = JSON.parse(geometry);
        } else {
          geomValue = geometry;
        }
      } catch (e) {
        throw new Error('无效的几何数据格式');
      }

      const result = await db.query(`
        INSERT INTO routes (name, idx, name_gd, geom)
        VALUES ($1, $2, $3, ST_GeomFromGeoJSON($4))
        RETURNING 
          id as route_id,
          name,
          idx as route_number,
          name_gd as description,
          ST_AsGeoJSON(geom) as geometry
      `, [name, route_number || 0, description || '', JSON.stringify(geomValue)]);
      
      return result.rows[0];
    } catch (error) {
      console.error('添加路线失败:', error);
      throw new Error(`添加路线失败: ${error.message}`);
    }
  },

  // 更新路线信息
  updateRoute: async (id, route) => {
    const { name, route_number, description, geometry } = route;
    try {
      // 验证geometry是否为有效的GeoJSON
      let geomValue = null;
      try {
        if (typeof geometry === 'string') {
          geomValue = JSON.parse(geometry);
        } else {
          geomValue = geometry;
        }
      } catch (e) {
        throw new Error('无效的几何数据格式');
      }

      const result = await db.query(`
        UPDATE routes
        SET 
          name = $1,
          idx = $2,
          name_gd = $3,
          geom = ST_GeomFromGeoJSON($4)
        WHERE id = $5
        RETURNING 
          id as route_id,
          name,
          idx as route_number,
          name_gd as description,
          ST_AsGeoJSON(geom) as geometry
      `, [name, route_number || 0, description || '', JSON.stringify(geomValue), id]);
      
      return result.rows[0];
    } catch (error) {
      console.error('更新路线失败:', error);
      throw new Error(`更新路线失败: ${error.message}`);
    }
  },

  // 删除路线
  deleteRoute: async (id) => {
    try {
      const result = await db.query('DELETE FROM routes WHERE id = $1 RETURNING id as route_id', [id]);
      return result.rows[0];
    } catch (error) {
      console.error('删除路线失败:', error);
      throw new Error('删除路线失败');
    }
  },

  // 根据名称查询路线
  searchRoutesByName: async (name) => {
    try {
      const result = await db.query(`
        SELECT 
          id as route_id,
          name,
          idx as route_number,
          name_gd as description,
          ST_AsGeoJSON(geom) as geometry
        FROM routes
        WHERE name ILIKE $1 OR idx::text ILIKE $1
        ORDER BY route_id
      `, [`%${name}%`]);
      return result.rows;
    } catch (error) {
      console.error('搜索路线失败:', error);
      throw new Error('搜索路线失败');
    }
  },

  // 获取路线上的站点
  getRouteStations: async (routeId) => {
    try {
      // 使用空间关系查询与路线相关的站点
      const result = await db.query(`
        SELECT 
          s.id as station_id,
          s.name,
          s.line,
          s.name_st as address,
          ST_AsGeoJSON(s.geom) as geometry,
          ST_X(s.geom) as longitude,
          ST_Y(s.geom) as latitude,
          ST_Distance(s.geom, r.geom) as distance
        FROM 
          stations s,
          routes r
        WHERE 
          r.id = $1
          AND ST_DWithin(s.geom, r.geom, 0.001) -- 100米内的站点
        ORDER BY 
          ST_LineLocatePoint(r.geom, s.geom) -- 按照在路线上的位置排序
      `, [routeId]);
      
      return result.rows;
    } catch (error) {
      console.error('获取路线站点失败:', error);
      throw new Error('获取路线站点失败');
    }
  }
};

module.exports = routeModel;