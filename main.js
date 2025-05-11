
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { fromLonLat } from 'ol/proj';
import { Point } from 'ol/geom';
import { Feature } from 'ol';
import { Style, Circle, Fill, Stroke, Text } from 'ol/style';
import Overlay from 'ol/Overlay';
import LineString from 'ol/geom/LineString';

// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';

// 初始化地图
const initMap = () => {
  // 创建地图图层
  const osmLayer = new TileLayer({
    source: new OSM()
  });

  // 创建站点图层
  const stationsSource = new VectorSource();
  const stationsLayer = new VectorLayer({
    source: stationsSource,
    style: (feature) => {
      return new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: '#3498db' }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        }),
        text: new Text({
          text: feature.get('name'),
          font: '12px Calibri,sans-serif',
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 3 }),
          offsetY: -15
        })
      });
    }
  });

  // 创建路线图层
  const routesSource = new VectorSource();
  const routesLayer = new VectorLayer({
    source: routesSource,
    style: (feature) => {
      return new Style({
        stroke: new Stroke({
          color: feature.get('color') || '#e74c3c',
          width: 4
        }),
        text: feature.get('showLabel') ? new Text({
          text: feature.get('name'),
          font: '14px Calibri,sans-serif',
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 3 }),
          placement: 'line',
          maxAngle: 0,
          overflow: true
        }) : null
      });
    },
    zIndex: 5
  });

  // 创建地图
  const map = new Map({
    target: 'map',
    layers: [osmLayer, routesLayer, stationsLayer],
    view: new View({
      center: fromLonLat([116.3979, 39.9088]),  // 默认北京中心位置
      zoom: 13
    })
  });

  // 创建弹出层
  const popup = document.getElementById('popup');
  const popupContent = document.getElementById('popup-content');
  const popupCloser = document.getElementById('popup-closer');

  const overlay = new Overlay({
    element: popup,
    autoPan: true,
    autoPanAnimation: {
      duration: 250
    }
  });

  map.addOverlay(overlay);

  // 弹出层关闭按钮
  popupCloser.onclick = function() {
    overlay.setPosition(undefined);
    popupCloser.blur();
    return false;
  };

  // 地图点击事件
  map.on('click', function(evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
      return feature;
    });

    if (feature && feature.get('type') === 'station') {
      const coordinates = feature.getGeometry().getCoordinates();
      const content = `
        <h3>${feature.get('name')}</h3>
        <p><strong>地址:</strong> ${feature.get('address') || '无'}</p>
        <p><strong>描述:</strong> ${feature.get('description') || '无'}</p>
        <p><strong>经度:</strong> ${feature.get('longitude')}</p>
        <p><strong>纬度:</strong> ${feature.get('latitude')}</p>
      `;
      
      popupContent.innerHTML = content;
      overlay.setPosition(coordinates);
    } else {
      overlay.setPosition(undefined);
    }
  });

  // 鼠标悬停样式
  map.on('pointermove', function(e) {
    const pixel = map.getEventPixel(e.originalEvent);
    const hit = map.hasFeatureAtPixel(pixel);
    map.getViewport().style.cursor = hit ? 'pointer' : '';
  });

  // 添加地图工具按钮功能
  document.getElementById('zoom-in').addEventListener('click', () => {
    const view = map.getView();
    view.animate({
      zoom: view.getZoom() + 1,
      duration: 250
    });
  });

  document.getElementById('zoom-out').addEventListener('click', () => {
    const view = map.getView();
    view.animate({
      zoom: view.getZoom() - 1,
      duration: 250
    });
  });

  document.getElementById('home').addEventListener('click', () => {
    const view = map.getView();
    view.animate({
      center: fromLonLat([116.3979, 39.9088]),
      zoom: 13,
      duration: 500
    });
  });

  return { map, stationsSource, routesSource };
};

// 加载站点数据
const loadStations = async (stationsSource) => {
  try {
    const response = await fetch(`${API_BASE_URL}/stations`);
    if (!response.ok) throw new Error('获取站点数据失败');
    
    const stations = await response.json();
    
    stationsSource.clear();
    
    stations.forEach(station => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([station.longitude, station.latitude])),
        name: station.name,
        address: station.address,
        description: station.description,
        station_id: station.station_id,
        longitude: station.longitude,
        latitude: station.latitude,
        type: 'station'
      });
      
      stationsSource.addFeature(feature);
    });
    
    return stations;
  } catch (error) {
    console.error('加载站点数据失败:', error);
    alert('加载站点数据失败');
    return [];
  }
};

// 加载路线数据
const loadRoutes = async (routesSource, stationsSource) => {
  try {
    const response = await fetch(`${API_BASE_URL}/routes`);
    if (!response.ok) throw new Error('获取路线数据失败');
    
    const routes = await response.json();
    
    // 定义一些不同的颜色用于路线
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
    
    routesSource.clear();
    
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      const color = colors[i % colors.length];
      
      // 获取路线的所有站点
      const routeStationsResponse = await fetch(`${API_BASE_URL}/routes/${route.route_id}/stations`);
      if (!routeStationsResponse.ok) continue;
      
      const routeStations = await routeStationsResponse.json();
      
      if (routeStations.length >= 2) {
        // 创建路线坐标数组
        const coordinates = routeStations.map(station => 
          fromLonLat([station.longitude, station.latitude])
        );
        
        // 创建路线要素
        const routeFeature = new Feature({
          geometry: new LineString(coordinates),
          name: route.name,
          description: route.description,
          route_id: route.route_id,
          color: color,
          showLabel: true,
          type: 'route'
        });
        
        routesSource.addFeature(routeFeature);
      }
    }
    
    return routes;
  } catch (error) {
    console.error('加载路线数据失败:', error);
    alert('加载路线数据失败');
    return [];
  }
};

// 渲染站点列表
const renderStationsList = (stations, selectedStationId = null) => {
  const stationList = document.getElementById('station-list');
  stationList.innerHTML = '';
  
  stations.forEach(station => {
    const listItem = document.createElement('div');
    listItem.classList.add('list-item');
    if (selectedStationId && station.station_id === parseInt(selectedStationId)) {
      listItem.classList.add('active');
    }
    
    listItem.innerHTML = `
      <h4>${station.name}</h4>
      <p>${station.address || '无地址'}</p>
      <div class="list-item-actions">
        <button class="edit-btn" data-id="${station.station_id}">编辑</button>
        <button class="delete-btn" data-id="${station.station_id}">删除</button>
      </div>
    `;
    
    stationList.appendChild(listItem);
    
    // 添加编辑和删除按钮的事件监听器
    listItem.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openStationModal(station.station_id);
    });
    
    listItem.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`确定要删除站点 "${station.name}" 吗?`)) {
        deleteStation(station.station_id);
      }
    });
    
    // 点击列表项时定位到地图上的站点
    listItem.addEventListener('click', () => {
      zoomToStation(station);
    });
  });
};

// 渲染路线列表
const renderRoutesList = (routes, selectedRouteId = null) => {
  const routeList = document.getElementById('route-list');
  routeList.innerHTML = '';
  
  routes.forEach(route => {
    const listItem = document.createElement('div');
    listItem.classList.add('list-item');
    if (selectedRouteId && route.route_id === parseInt(selectedRouteId)) {
      listItem.classList.add('active');
    }
    
    listItem.innerHTML = `
      <h4>${route.name}</h4>
      <p>从 ${route.start_station_name || '无'} 到 ${route.end_station_name || '无'}</p>
      <div class="list-item-actions">
        <button class="edit-btn" data-id="${route.route_id}">编辑</button>
        <button class="stations-btn" data-id="${route.route_id}">站点管理</button>
        <button class="delete-btn" data-id="${route.route_id}">删除</button>
      </div>
    `;
    
    routeList.appendChild(listItem);
    
    // 添加编辑、站点管理和删除按钮的事件监听器
    listItem.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openRouteModal(route.route_id);
    });
    
    listItem.querySelector('.stations-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openRouteStationsModal(route.route_id);
    });
    
    listItem.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`确定要删除路线 "${route.name}" 吗?`)) {
        deleteRoute(route.route_id);
      }
    });
    
    // 点击列表项时高亮显示路线
    listItem.addEventListener('click', () => {
      zoomToRoute(route);
    });
  });
};

// 打开站点编辑弹窗
const openStationModal = async (stationId = null) => {
  const modal = document.getElementById('station-modal');
  const title = document.getElementById('station-modal-title');
  const form = document.getElementById('station-form');
  const idInput = document.getElementById('station-id');
  const nameInput = document.getElementById('station-name');
  const longitudeInput = document.getElementById('station-longitude');
  const latitudeInput = document.getElementById('station-latitude');
  const addressInput = document.getElementById('station-address');
  const descriptionInput = document.getElementById('station-description');
  
  // 重置表单
  form.reset();
  idInput.value = '';
  
  if (stationId) {
    // 编辑现有站点
    title.textContent = '编辑站点';
    
    try {
      const response = await fetch(`${API_BASE_URL}/stations/${stationId}`);
      if (!response.ok) throw new Error('获取站点数据失败');
      
      const station = await response.json();
      
      idInput.value = station.station_id;
      nameInput.value = station.name;
      longitudeInput.value = station.longitude;
      latitudeInput.value = station.latitude;
      addressInput.value = station.address || '';
      descriptionInput.value = station.description || '';
    } catch (error) {
      console.error('获取站点详情失败:', error);
      alert('获取站点详情失败');
      return;
    }
  } else {
    // 添加新站点
    title.textContent = '添加站点';
  }
  
  modal.style.display = 'flex';
};

// 打开路线编辑弹窗
const openRouteModal = async (routeId = null) => {
  const modal = document.getElementById('route-modal');
  const title = document.getElementById('route-modal-title');
  const form = document.getElementById('route-form');
  const idInput = document.getElementById('route-id');
  const nameInput = document.getElementById('route-name');
  const startSelect = document.getElementById('route-start');
  const endSelect = document.getElementById('route-end');
  const distanceInput = document.getElementById('route-distance');
  const descriptionInput = document.getElementById('route-description');
  
  // 重置表单
  form.reset();
  idInput.value = '';
  
  // 加载站点选项
  try {
    const response = await fetch(`${API_BASE_URL}/stations`);
    if (!response.ok) throw new Error('获取站点数据失败');
    
    const stations = await response.json();
    
    // 填充下拉框
    startSelect.innerHTML = '<option value="">选择起始站点</option>';
    endSelect.innerHTML = '<option value="">选择终点站点</option>';
    
    stations.forEach(station => {
      const startOption = document.createElement('option');
      startOption.value = station.station_id;
      startOption.textContent = station.name;
      startSelect.appendChild(startOption);
      
      const endOption = document.createElement('option');
      endOption.value = station.station_id;
      endOption.textContent = station.name;
      endSelect.appendChild(endOption);
    });
  } catch (error) {
    console.error('获取站点数据失败:', error);
    alert('获取站点数据失败');
    return;
  }
  
  if (routeId) {
    // 编辑现有路线
    title.textContent = '编辑路线';
    
    try {
      const response = await fetch(`${API_BASE_URL}/routes/${routeId}`);
      if (!response.ok) throw new Error('获取路线数据失败');
      
      const route = await response.json();
      
      idInput.value = route.route_id;
      nameInput.value = route.name;
      startSelect.value = route.start_station || '';
      endSelect.value = route.end_station || '';
      distanceInput.value = route.distance || '';
      descriptionInput.value = route.description || '';
    } catch (error) {
      console.error('获取路线详情失败:', error);
      alert('获取路线详情失败');
      return;
    }
  } else {
    // 添加新路线
    title.textContent = '添加路线';
  }
  
  modal.style.display = 'flex';
};

// 打开路线站点管理弹窗
const openRouteStationsModal = async (routeId) => {
  const modal = document.getElementById('route-stations-modal');
  const title = document.getElementById('route-stations-title');
  const stationsList = document.getElementById('route-stations-list');
  const stationSelect = document.getElementById('add-station-to-route');
  const stationOrderInput = document.getElementById('station-order');
  const addButton = document.getElementById('add-route-station-btn');
  
  // 清空列表
  stationsList.innerHTML = '';
  stationOrderInput.value = 1;
  
  // 存储当前路线ID
  modal.dataset.routeId = routeId;
  
  try {
    // 获取路线信息
    const routeResponse = await fetch(`${API_BASE_URL}/routes/${routeId}`);
    if (!routeResponse.ok) throw new Error('获取路线数据失败');
    const route = await routeResponse.json();
    
    title.textContent = `管理路线站点: ${route.name}`;
    
    // 获取路线的站点
    const routeStationsResponse = await fetch(`${API_BASE_URL}/routes/${routeId}/stations`);
    if (!routeStationsResponse.ok) throw new Error('获取路线站点数据失败');
    const routeStations = await routeStationsResponse.json();
    
    // 获取所有站点
    const allStationsResponse = await fetch(`${API_BASE_URL}/stations`);
    if (!allStationsResponse.ok) throw new Error('获取站点数据失败');
    const allStations = await allStationsResponse.json();
    
    // 填充站点列表
    routeStations.forEach(station => {
      const listItem = document.createElement('div');
      listItem.classList.add('list-item');
      
      listItem.innerHTML = `
        <h4>${station.name}</h4>
        <p>顺序: ${station.station_order}</p>
        <button class="remove-station-btn" data-station-id="${station.station_id}">移除</button>
      `;
      
      stationsList.appendChild(listItem);
      
      // 添加移除按钮的事件监听器
      listItem.querySelector('.remove-station-btn').addEventListener('click', () => {
        if (confirm(`确定要从路线中移除站点 "${station.name}" 吗?`)) {
          removeStationFromRoute(routeId, station.station_id);
        }
      });
    });
    
    // 填充下拉框（排除已添加的站点）
    stationSelect.innerHTML = '<option value="">选择站点</option>';
    const addedStationIds = routeStations.map(s => s.station_id);
    
    allStations
      .filter(station => !addedStationIds.includes(station.station_id))
      .forEach(station => {
        const option = document.createElement('option');
        option.value = station.station_id;
        option.textContent = station.name;
        stationSelect.appendChild(option);
      });
    
    // 添加站点按钮事件
    addButton.onclick = () => {
      const stationId = stationSelect.value;
      const order = stationOrderInput.value;
      
      if (!stationId) {
        alert('请选择要添加的站点');
        return;
      }
      
      addStationToRoute(routeId, stationId, order);
    };
    
    modal.style.display = 'flex';
  } catch (error) {
    console.error('获取路线站点数据失败:', error);
    alert('获取路线站点数据失败');
  }
};

// 定位到站点
const zoomToStation = (station) => {
  const { map } = window.busSystem;
  const view = map.getView();
  
  view.animate({
    center: fromLonLat([station.longitude, station.latitude]),
    zoom: 16,
    duration: 500
  });
};

// 定位到路线
const zoomToRoute = async (route) => {
  try {
    const response = await fetch(`${API_BASE_URL}/routes/${route.route_id}/stations`);
    if (!response.ok) throw new Error('获取路线站点数据失败');
    
    const stations = await response.json();
    
    if (stations.length === 0) {
      alert('该路线没有站点');
      return;
    }
    
    const { map } = window.busSystem;
    const view = map.getView();
    
    // 计算路线的所有站点的范围
    const coordinates = stations.map(station => 
      fromLonLat([station.longitude, station.latitude])
    );
    
    // 如果只有一个站点，则直接定位到该站点
    if (coordinates.length === 1) {
      view.animate({
        center: coordinates[0],
        zoom: 16,
        duration: 500
      });
      return;
    }
    
    // 计算路线的范围
    const extent = coordinates.reduce((extent, coord) => {
      if (!extent) {
        return [coord[0], coord[1], coord[0], coord[1]];
      }
      return [
        Math.min(extent[0], coord[0]),
        Math.min(extent[1], coord[1]),
        Math.max(extent[2], coord[0]),
        Math.max(extent[3], coord[1]),
      ];
    }, null);
    
    // 定位到路线范围
    view.fit(extent, {
      padding: [50, 50, 50, 50],
      duration: 500
    });
  } catch (error) {
    console.error('定位到路线失败:', error);
    alert('定位到路线失败');
  }
};

// 保存站点
const saveStation = async (event) => {
  event.preventDefault();
  
  const idInput = document.getElementById('station-id');
  const nameInput = document.getElementById('station-name');
  const longitudeInput = document.getElementById('station-longitude');
  const latitudeInput = document.getElementById('station-latitude');
  const addressInput = document.getElementById('station-address');
  const descriptionInput = document.getElementById('station-description');
  
  const stationData = {
    name: nameInput.value,
    longitude: parseFloat(longitudeInput.value),
    latitude: parseFloat(latitudeInput.value),
    address: addressInput.value,
    description: descriptionInput.value
  };
  
  // 显示加载指示器
  document.querySelector('.loader').style.display = 'flex';
  
  try {
    let response;
    
    if (idInput.value) {
      // 更新站点
      response = await fetch(`${API_BASE_URL}/stations/${idInput.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stationData)
      });
    } else {
      // 添加新站点
      response = await fetch(`${API_BASE_URL}/stations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stationData)
      });
    }
    
    if (!response.ok) throw new Error('保存站点失败');
    
    // 关闭弹窗
    document.getElementById('station-modal').style.display = 'none';
    
    // 重新加载数据
    refreshData();
  } catch (error) {
    console.error('保存站点失败:', error);
    alert('保存站点失败');
  } finally {
    // 隐藏加载指示器
    document.querySelector('.loader').style.display = 'none';
  }
};

// 保存路线
const saveRoute = async (event) => {
  event.preventDefault();
  
  const idInput = document.getElementById('route-id');
  const nameInput = document.getElementById('route-name');
  const startSelect = document.getElementById('route-start');
  const endSelect = document.getElementById('route-end');
  const distanceInput = document.getElementById('route-distance');
  const descriptionInput = document.getElementById('route-description');
  
  const routeData = {
    name: nameInput.value,
    start_station: startSelect.value ? parseInt(startSelect.value) : null,
    end_station: endSelect.value ? parseInt(endSelect.value) : null,
    distance: distanceInput.value ? parseFloat(distanceInput.value) : null,
    description: descriptionInput.value
  };
  
  // 显示加载指示器
  document.querySelector('.loader').style.display = 'flex';
  
  try {
    let response;
    
    if (idInput.value) {
      // 更新路线
      response = await fetch(`${API_BASE_URL}/routes/${idInput.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(routeData)
      });
    } else {
      // 添加新路线
      response = await fetch(`${API_BASE_URL}/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(routeData)
      });
    }
    
    if (!response.ok) throw new Error('保存路线失败');
    
    // 关闭弹窗
    document.getElementById('route-modal').style.display = 'none';
    
    // 重新加载数据
    refreshData();
  } catch (error) {
    console.error('保存路线失败:', error);
    alert('保存路线失败');
  } finally {
    // 隐藏加载指示器
    document.querySelector('.loader').style.display = 'none';
  }
};

// 删除站点
const deleteStation = async (stationId) => {
  // 显示加载指示器
  document.querySelector('.loader').style.display = 'flex';
  
  try {
    const response = await fetch(`${API_BASE_URL}/stations/${stationId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('删除站点失败');
    
    // 重新加载数据
    refreshData();
  } catch (error) {
    console.error('删除站点失败:', error);
    alert('删除站点失败');
  } finally {
    // 隐藏加载指示器
    document.querySelector('.loader').style.display = 'none';
  }
};

// 删除路线
const deleteRoute = async (routeId) => {
  // 显示加载指示器
  document.querySelector('.loader').style.display = 'flex';
  
  try {
    const response = await fetch(`${API_BASE_URL}/routes/${routeId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('删除路线失败');
    
    // 重新加载数据
    refreshData();
  } catch (error) {
    console.error('删除路线失败:', error);
    alert('删除路线失败');
  } finally {
    // 隐藏加载指示器
    document.querySelector('.loader').style.display = 'none';
  }
};

// 添加站点到路线
const addStationToRoute = async (routeId, stationId, order) => {
  // 显示加载指示器
  document.querySelector('.loader').style.display = 'flex';
  
  try {
    const response = await fetch(`${API_BASE_URL}/routes/${routeId}/stations/${stationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order })
    });
    
    if (!response.ok) throw new Error('添加站点到路线失败');
    
    // 重新打开弹窗以刷新数据
    openRouteStationsModal(routeId);
    
    // 重新加载路线数据
    refreshData();
  } catch (error) {
    console.error('添加站点到路线失败:', error);
    alert('添加站点到路线失败');
  } finally {
    // 隐藏加载指示器
    document.querySelector('.loader').style.display = 'none';
  }
};

// 从路线中移除站点
const removeStationFromRoute = async (routeId, stationId) => {
  // 显示加载指示器
  document.querySelector('.loader').style.display = 'flex';
  
  try {
    const response = await fetch(`${API_BASE_URL}/routes/${routeId}/stations/${stationId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) throw new Error('从路线中移除站点失败');
    
    // 重新打开弹窗以刷新数据
    openRouteStationsModal(routeId);
    
    // 重新加载路线数据
    refreshData();
  } catch (error) {
    console.error('从路线中移除站点失败:', error);
    alert('从路线中移除站点失败');
  } finally {
    // 隐藏加载指示器
    document.querySelector('.loader').style.display = 'none';
  }
};

// 搜索站点
const searchStations = async () => {
  const searchInput = document.getElementById('search-input');
  const term = searchInput.value.trim();
  
  try {
    let url = `${API_BASE_URL}/stations/search`;
    if (term) {
      url += `?term=${encodeURIComponent(term)}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('搜索站点失败');
    
    const stations = await response.json();
    
    // 渲染搜索结果
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    if (stations.length === 0) {
      resultsContainer.innerHTML = '<p>没有找到匹配的站点</p>';
      return;
    }
    
    stations.forEach(station => {
      const listItem = document.createElement('div');
      listItem.classList.add('list-item');
      
      listItem.innerHTML = `
        <h4>${station.name}</h4>
        <p>${station.address || '无地址'}</p>
      `;
      
      resultsContainer.appendChild(listItem);
      
      // 点击搜索结果项定位到地图上的站点
      listItem.addEventListener('click', () => {
        zoomToStation(station);
      });
    });
  } catch (error) {
    console.error('搜索站点失败:', error);
    alert('搜索站点失败');
  }
};

// 刷新所有数据
const refreshData = async () => {
  const { stationsSource, routesSource } = window.busSystem;
  
  // 显示加载指示器
  document.querySelector('.loader').style.display = 'flex';
  
  try {
    // 加载站点数据
    const stations = await loadStations(stationsSource);
    renderStationsList(stations);
    
    // 加载路线数据
    const routes = await loadRoutes(routesSource, stationsSource);
    renderRoutesList(routes);
  } catch (error) {
    console.error('刷新数据失败:', error);
  } finally {
    // 隐藏加载指示器
    document.querySelector('.loader').style.display = 'none';
  }
};

// 初始化应用
const initApp = async () => {
  // 初始化地图
  const mapComponents = initMap();
  window.busSystem = mapComponents;
  
  // 加载初始数据
  await refreshData();
  
  // 添加事件监听器
  
  // 标签切换
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 取消激活所有标签和内容
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      // 激活当前标签和相应内容
      tab.classList.add('active');
      const contentId = `${tab.dataset.tab}-panel`;
      document.getElementById(contentId).classList.add('active');
    });
  });
  
  // 添加站点按钮
  document.getElementById('add-station-btn').addEventListener('click', () => {
    openStationModal();
  });
  
  // 添加路线按钮
  document.getElementById('add-route-btn').addEventListener('click', () => {
    openRouteModal();
  });
  
  // 站点表单提交
  document.getElementById('station-form').addEventListener('submit', saveStation);
  
  // 路线表单提交
  document.getElementById('route-form').addEventListener('submit', saveRoute);
  
  // 搜索按钮
  document.getElementById('search-btn').addEventListener('click', searchStations);
  
  // 回车键搜索
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchStations();
    }
  });
  
  // 弹窗关闭按钮
  document.querySelectorAll('.close-button').forEach(button => {
    button.addEventListener('click', () => {
      button.closest('.modal').style.display = 'none';
    });
  });
  
  // 点击弹窗外部关闭
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
  
  // 移动设备菜单切换
  document.getElementById('menu-toggle').addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
  });
};

// 启动应用
document.addEventListener('DOMContentLoaded', initApp);