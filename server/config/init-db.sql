-- 创建站点表
CREATE TABLE IF NOT EXISTS stations (
  station_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  longitude NUMERIC(10, 6) NOT NULL,
  latitude NUMERIC(10, 6) NOT NULL,
  address VARCHAR(200),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建路线表
CREATE TABLE IF NOT EXISTS routes (
  route_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_station INTEGER REFERENCES stations(station_id),
  end_station INTEGER REFERENCES stations(station_id),
  distance NUMERIC(10, 2),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建路线-站点关系表（多对多关系）
CREATE TABLE IF NOT EXISTS route_stations (
  route_id INTEGER NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
  station_id INTEGER NOT NULL REFERENCES stations(station_id) ON DELETE CASCADE,
  station_order INTEGER NOT NULL, -- 站点在路线中的顺序
  PRIMARY KEY (route_id, station_id)
);

-- 创建索引提高查询性能
CREATE INDEX IF NOT EXISTS idx_stations_coordinates ON stations(longitude, latitude);
CREATE INDEX IF NOT EXISTS idx_route_stations_route_id ON route_stations(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stations_station_id ON route_stations(station_id);

-- 插入一些测试数据
INSERT INTO stations (name, longitude, latitude, address, description)
VALUES
  ('中央火车站', 116.3847, 39.9025, '北京市东城区', '主要交通枢纽站'),
  ('市政府站', 116.3975, 39.9088, '北京市东城区', '政府办公区附近'),
  ('大学城站', 116.3556, 39.9561, '北京市海淀区', '靠近多所大学'),
  ('科技园站', 116.3072, 39.9865, '北京市海淀区', '科技企业聚集地'),
  ('商业中心站', 116.4551, 39.9127, '北京市朝阳区', '购物和商业区')
ON CONFLICT DO NOTHING;

-- 插入路线数据
INSERT INTO routes (name, start_station, end_station, distance, description)
VALUES
  ('1路公交', 1, 5, 15.2, '连接火车站和商业中心的主要线路'),
  ('2路公交', 2, 4, 12.5, '连接市政府和科技园区')
ON CONFLICT DO NOTHING;

-- 插入路线站点关系
INSERT INTO route_stations (route_id, station_id, station_order)
VALUES
  (1, 1, 1),  -- 1路: 中央火车站
  (1, 2, 2),  -- 1路: 市政府站
  (1, 5, 3),  -- 1路: 商业中心站
  (2, 2, 1),  -- 2路: 市政府站
  (2, 3, 2),  -- 2路: 大学城站
  (2, 4, 3)   -- 2路: 科技园站
ON CONFLICT DO NOTHING;