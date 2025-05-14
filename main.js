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
import XYZ from 'ol/source/XYZ';
import ScaleLine from 'ol/control/ScaleLine';
import MousePosition from 'ol/control/MousePosition';
import { createStringXY } from 'ol/coordinate';
import { defaults as defaultControls } from 'ol/control';


// API基础URL
const API_BASE_URL = 'http://localhost:3000/api';
const tdtKey = '6cbc8cbaf5140b1bffa7bc4e069ecba6';  // 请替换为您的实际密钥

const adjustStationsVisibility = (stationsSource, zoomLevel) => {
  stationsSource.getFeatures().forEach((feature) => {
    const minZoom = feature.get('minZoom') || 10; // 默认最小缩放级别
    const maxZoom = feature.get('maxZoom') || 20; // 默认最大缩放级别
    const visible = zoomLevel >= minZoom && zoomLevel <= maxZoom;

    // 动态调整样式
    feature.setStyle(
      visible
        ? new Style({
          image: new Circle({
            radius: 8,
            fill: new Fill({ color: '#3498db' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
          text:
            zoomLevel >= 14 // 在缩放级别大于等于14时显示字体
              ? new Text({
                text: feature.get('address'), // 修改此处：从name改为address
                font: '12px Calibri,sans-serif',
                fill: new Fill({ color: '#000' }),
                stroke: new Stroke({ color: '#fff', width: 3 }),
                offsetY: -15,
              })
              : null,
        })
        : new Style() // 隐藏站点
    );
  });
};

// 定义基础底图图层
const baseMaps = {
  vector: new TileLayer({
    title: '矢量底图',
    source: new XYZ({
      url: `http://t0.tianditu.gov.cn/vec_w/wmts?layer=vec&style=default&tilematrixset=w&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&TileMatrix={z}&TileCol={x}&TileRow={y}&tk=${tdtKey}`,
    }),
    visible: true,
    type: 'base'
  }),

  image: new TileLayer({
    title: '影像底图',
    source: new XYZ({
      url: `http://t0.tianditu.gov.cn/img_w/wmts?layer=img&style=default&tilematrixset=w&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&TileMatrix={z}&TileCol={x}&TileRow={y}&tk=${tdtKey}`,
    }),
    visible: false,
    type: 'base'
  }),

  terrain: new TileLayer({
    title: '地形底图',
    source: new XYZ({
      url: `http://t0.tianditu.gov.cn/ter_w/wmts?layer=ter&style=default&tilematrixset=w&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&TileMatrix={z}&TileCol={x}&TileRow={y}&tk=${tdtKey}`,
    }),
    visible: false,
    type: 'base'
  })
};
// 定义标注图层
const annotationLayer = new TileLayer({
  title: '地名标注',
  source: new XYZ({
    url: `http://t0.tianditu.gov.cn/cva_w/wmts?layer=cva&style=default&tilematrixset=w&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&TileMatrix={z}&TileCol={x}&TileRow={y}&tk=${tdtKey}`,
  }),
  visible: true
});

const imageAnnotationLayer = new TileLayer({
  title: '影像标注',
  source: new XYZ({
    url: `http://t0.tianditu.gov.cn/cia_w/wmts?layer=cia&style=default&tilematrixset=w&Service=WMTS&Request=GetTile&Version=1.0.0&Format=tiles&TileMatrix={z}&TileCol={x}&TileRow={y}&tk=${tdtKey}`,
  }),
  visible: false
});

const initMap = () => {


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
          text: feature.get('address'), // 修改此处：从name改为address(对应name_st)
          font: '12px Calibri,sans-serif',
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 3 }),
          offsetY: -15
        })
      });
    },
    zIndex: 10 // 确保在底图之上
  });

  // 创建路线图层
  const routesSource = new VectorSource();

  // 在 initMap 函数中修改 routesLayer 的样式定义
  const routesLayer = new VectorLayer({
    source: routesSource,
    style: (feature) => {
      return new Style({
        stroke: new Stroke({
          color: '#FF0000', // 使用明显的红色
          width: 6 // 加粗线宽
        }),
        text: feature.get('showLabel') ? new Text({
          text: feature.get('name'),
          font: '16px Arial', // 加大字体
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 3 }),
          placement: 'line',
          maxAngle: 0,
          overflow: true
        }) : null
      });
    },
    zIndex: 5 // 确保在最上层
  });


  // 创建地图
  const map = new Map({
    target: 'map',
    layers: [
      // 添加基础底图
      baseMaps.vector,
      baseMaps.image,
      baseMaps.terrain,

      // 添加标注图层
      annotationLayer,
      imageAnnotationLayer,
      // 添加业务图层
      routesLayer,
      stationsLayer],
    view: new View({
      center: fromLonLat([117.843818, 30.954168]),  // 默认铜陵中心位置
      zoom: 13,
      maxZoom: 19,  // 最大缩放级别
      minZoom: 4,   // 最小缩放级别
      constrainResolution: true // 限制分辨率以获得更流畅的缩放
    }),
    controls: defaultControls({
      zoom: false,
      rotate: false,
      attribution: false
    }) // 使用默认控件，但禁用缩放按钮等
  });

  // 创建比例尺控件
  const scaleLine = new ScaleLine({
    units: 'metric',
    bar: true,
    steps: 4,
    text: true,
    minWidth: 140,
    target: document.getElementById('scale-line')
  });

  const customFormat = (coord) => {
    return `经度: ${coord[0].toFixed(6)} | 纬度: ${coord[1].toFixed(6)}`;
  };

  // 创建坐标显示控件
  const mousePositionControl = new MousePosition({
    coordinateFormat: customFormat,
    projection: 'EPSG:4326',
    target: document.getElementById('mouse-position'),
    className: 'mouse-position', // 添加这一行
    undefinedHTML: '&nbsp;'
  });

  // 添加缩放事件监听
  map.getView().on('change:resolution', () => {
    const zoomLevel = map.getView().getZoom();
    adjustStationsVisibility(stationsSource, zoomLevel);
  });
  // 底图切换事件监听
  document.getElementById('vector-map-btn').addEventListener('click', () => {
    // 激活当前按钮
    document.querySelectorAll('.map-type-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('vector-map-btn').classList.add('active');

    // 显示矢量地图和对应标注
    baseMaps.vector.setVisible(true);
    baseMaps.image.setVisible(false);
    baseMaps.terrain.setVisible(false);
    annotationLayer.setVisible(true);
    imageAnnotationLayer.setVisible(false);
  });

  document.getElementById('image-map-btn').addEventListener('click', () => {
    // 激活当前按钮
    document.querySelectorAll('.map-type-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('image-map-btn').classList.add('active');

    // 显示影像地图和对应标注
    baseMaps.vector.setVisible(false);
    baseMaps.image.setVisible(true);
    baseMaps.terrain.setVisible(false);

    annotationLayer.setVisible(false);
    imageAnnotationLayer.setVisible(true);
  });

  document.getElementById('terrain-map-btn').addEventListener('click', () => {
    // 激活当前按钮
    document.querySelectorAll('.map-type-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('terrain-map-btn').classList.add('active');

    // 显示地形地图和对应标注
    baseMaps.vector.setVisible(false);
    baseMaps.image.setVisible(false);
    baseMaps.terrain.setVisible(true);
    annotationLayer.setVisible(true);
    imageAnnotationLayer.setVisible(false);
  });
  // 初始化站点可见性
  adjustStationsVisibility(stationsSource, map.getView().getZoom());

  // 将控件添加到地图
  map.addControl(scaleLine);
  map.addControl(mousePositionControl);

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
  popupCloser.onclick = function () {
    overlay.setPosition(undefined);
    popupCloser.blur();
    return false;
  };

  // 地图点击事件
  map.on('click', function (evt) {
    const feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {
      return feature;
    });

    if (feature) {
      const featureType = feature.get('type');
      const coordinates = feature.getGeometry().getCoordinates();
      let content = '';

      if (featureType === 'station') {
        // 站点点击内容
        content = `
          <h3>${feature.get('name')}</h3>
          <p><strong>地址:</strong> ${feature.get('address') || '无'}</p>
          <p><strong>线路:</strong> ${feature.get('line') || '无'}</p>
          <p><strong>经度:</strong> ${feature.get('longitude')}</p>
          <p><strong>纬度:</strong> ${feature.get('latitude')}</p>
        `;
        popupContent.innerHTML = content;
        overlay.setPosition(coordinates);
      } else if (featureType === 'route') {
        // 路线点击内容
        content = `
          <h3>${feature.get('name')}</h3>
          <p><strong>路线编号:</strong> ${feature.get('route_number') || '无'}</p>
          <p><strong>描述:</strong> ${feature.get('description') || '无'}</p>
        `;
        popupContent.innerHTML = content;
        // 对于线要素，使用点击位置作为弹出窗口位置
        overlay.setPosition(evt.coordinate);
      } else {
        overlay.setPosition(undefined);
      }
    } else {
      overlay.setPosition(undefined);
    }
  });

  // 鼠标悬停样式
  map.on('pointermove', function (e) {
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
      center: fromLonLat([117.843818, 30.954168]),
      zoom: 13,
      duration: 500
    });
  });

  // 在 initMap 函数的 return 语句前添加
  // 添加测试路线来检查图层是否正常工作
  const testFeature = new Feature({
    geometry: new LineString([
      fromLonLat([117.843818, 30.954168]), // 起点
      fromLonLat([117.86, 30.96])  // 终点
    ]),
    name: '测试路线',
    type: 'route',
    showLabel: true
  });

  testFeature.setStyle(new Style({
    stroke: new Stroke({
      color: '#00FF00', // 绿色
      width: 8
    }),
    text: new Text({
      text: '测试路线',
      font: '18px Arial',
      fill: new Fill({ color: '#000' }),
      stroke: new Stroke({ color: '#fff', width: 3 }),
      placement: 'line'
    })
  }));

  routesSource.addFeature(testFeature);
  console.log('测试路线已添加');


  // 添加到 initMap 函数末尾，在 return 语句之前

// 添加图层显示/隐藏控制按钮功能
const toggleStationsBtn = document.getElementById('toggle-stations-btn');
const toggleRoutesBtn = document.getElementById('toggle-routes-btn');

// 站点图层切换
toggleStationsBtn.addEventListener('click', () => {
  const visible = stationsLayer.getVisible();
  stationsLayer.setVisible(!visible);
  
  // 更新按钮样式
  if (!visible) {
    toggleStationsBtn.classList.add('active');
  } else {
    toggleStationsBtn.classList.remove('active');
  }
});

// 路线图层切换
toggleRoutesBtn.addEventListener('click', () => {
  const visible = routesLayer.getVisible();
  routesLayer.setVisible(!visible);
  
  // 更新按钮样式
  if (!visible) {
    toggleRoutesBtn.classList.add('active');
  } else {
    toggleRoutesBtn.classList.remove('active');
  }
});

// 初始化按钮状态
toggleStationsBtn.classList.add('active');
toggleRoutesBtn.classList.add('active');

console.log('图层控制按钮已初始化');

  return { map, stationsSource, routesSource };


};


const refreshStations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stations`);
    const stations = await response.json();

    const { stationsSource } = window.busSystem; // 从全局对象获取 stationsSource
    stationsSource.clear();

    stations.forEach(station => {
      try {
        // 解析几何数据
        const geom = JSON.parse(station.geometry);        // 创建要素
        const feature = new Feature({
          geometry: new Point(fromLonLat([
            geom.coordinates[0],
            geom.coordinates[1]
          ])),
          name: station.name,
          address: station.address, // 对应name_st
          line: station.line,       // 新增字段
          station_id: station.station_id,
          type: 'station',          // 添加类型标识
          longitude: geom.coordinates[0],
          latitude: geom.coordinates[1]
        });

        stationsSource.addFeature(feature);
      } catch (error) {
        console.error('处理站点数据时出错:', error, station);
      }
    });
  } catch (error) {
    console.error('获取站点数据失败:', error);
  }
};



// 修改 refreshRoutes 函数处理 MultiLineString 几何数据
const refreshRoutes = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/routes`);
    const routes = await response.json();

    console.log('获取到路线数据:', routes.length, '条');

    const { routesSource } = window.busSystem;
    routesSource.clear();

    routes.forEach((route, index) => {
      try {
        // 解析几何数据
        let geom;
        if (typeof route.geometry === 'string') {
          geom = JSON.parse(route.geometry);
        } else {
          geom = route.geometry;
        }

        console.log(`处理第${index + 1}条路线:`, route.name);
        console.log(`几何类型:`, typeof geom, geom ? geom.type : 'undefined');

        // 检查几何数据是否有效
        if (!geom || !geom.coordinates || !Array.isArray(geom.coordinates)) {
          console.error('无效的路线几何数据:', route);
          return;
        }

        // 处理 MultiLineString 类型几何数据
        if (geom.type === 'MultiLineString') {
          // 对于 MultiLineString，每个子数组是一条线
          geom.coordinates.forEach((lineCoords, lineIndex) => {
            if (lineCoords.length < 2) {
              console.error(`第${index + 1}条路线的第${lineIndex + 1}条子线段坐标点不足:`, lineCoords);
              return;
            }

            // 创建路线要素
            const feature = new Feature({
              geometry: new LineString(lineCoords.map(coord => fromLonLat(coord))),
              name: `${route.name}${geom.coordinates.length > 1 ? ` (段落${lineIndex + 1})` : ''}`,
              route_number: route.route_number,
              description: route.description,
              route_id: route.route_id,
              type: 'route',
              showLabel: lineIndex === 0 // 只在第一段显示标签
            });

            // 设置样式
            feature.setStyle(new Style({
              stroke: new Stroke({
                color: '#FF0000', // 红色
                width: 6
              }),
              text: feature.get('showLabel') ? new Text({
                text: route.name,
                font: '16px Arial',
                fill: new Fill({ color: '#000' }),
                stroke: new Stroke({ color: '#fff', width: 3 }),
                placement: 'line'
              }) : null
            }));

            routesSource.addFeature(feature);
            console.log(`成功添加路线要素: ${route.name} (段落${lineIndex + 1}), 坐标点数量: ${lineCoords.length}`);
          });
        } else {
          // 处理 LineString 类型几何数据
          if (geom.coordinates.length < 2) {
            console.error('路线坐标点不足:', geom.coordinates);
            return;
          }

          // 创建路线要素
          const feature = new Feature({
            geometry: new LineString(geom.coordinates.map(coord => fromLonLat(coord))),
            name: route.name,
            route_number: route.route_number,
            description: route.description,
            route_id: route.route_id,
            type: 'route',
            showLabel: true
          });

          // 设置样式
          feature.setStyle(new Style({
            stroke: new Stroke({
              color: '#FF0000',
              width: 6
            }),
            text: new Text({
              text: route.name,
              font: '16px Arial',
              fill: new Fill({ color: '#000' }),
              stroke: new Stroke({ color: '#fff', width: 3 }),
              placement: 'line'
            })
          }));

          routesSource.addFeature(feature);
          console.log(`成功添加路线要素: ${route.name}, 坐标点数量: ${geom.coordinates.length}`);
        }
      } catch (error) {
        console.error('处理路线数据时出错:', error, route);
      }
    });

    console.log('路线图层中的要素数量:', routesSource.getFeatures().length);
  } catch (error) {
    console.error('获取路线数据失败:', error);
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
  const lineInput = document.getElementById('station-line');
  const longitudeInput = document.getElementById('station-longitude');
  const latitudeInput = document.getElementById('station-latitude');
  const addressInput = document.getElementById('station-address');

  // 重置表单
  form.reset();
  idInput.value = '';

  if (stationId) {
    // 编辑现有站点
    title.textContent = '编辑站点';

    try {
      const response = await fetch(`${API_BASE_URL}/stations/${stationId}`,);
      if (!response.ok) throw new Error('获取站点数据失败');

      const station = await response.json();

      idInput.value = station.station_id;
      nameInput.value = station.name;
      lineInput.value = station.line || '';
      longitudeInput.value = station.longitude;
      latitudeInput.value = station.latitude;
      addressInput.value = station.address || '';
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
  const numberInput = document.getElementById('route-number');
  const descriptionInput = document.getElementById('route-description');
  const geometryInput = document.getElementById('route-geometry');

  // 重置表单
  form.reset();
  idInput.value = '';
  if (routeId) {
    // 编辑现有路线
    try {
      const response = await fetch(`${API_BASE_URL}/routes/${routeId}`);
      if (!response.ok) throw new Error('获取路线数据失败');

      const route = await response.json();

      idInput.value = route.route_id;
      nameInput.value = route.name;
      numberInput.value = route.route_number || '';
      descriptionInput.value = route.description || '';
      geometryInput.value = route.geometry || '';
    } catch (error) {
      console.error('获取路线详情失败:', error);
      alert('获取路线详情失败');
      return;
    } title.textContent = '编辑路线';
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
    const routeResponse = await fetch(`${API_BASE_URL}/routes/${routeId}`,);
    if (!routeResponse.ok) throw new Error('获取路线数据失败');
    const route = await routeResponse.json();

    title.textContent = `管理路线站点: ${route.name}`;

    // 获取路线的站点
    const routeStationsResponse = await fetch(`${API_BASE_URL}/routes/${routeId}/stations`,);
    if (!routeStationsResponse.ok) throw new Error('获取路线站点数据失败');
    const routeStations = await routeStationsResponse.json();

    // 获取所有站点
    const allStationsResponse = await fetch(`${API_BASE_URL}/stations`,);
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
// const zoomToRoute = async (route) => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/routes/${route.route_id}/stations`,);
//     if (!response.ok) throw new Error('获取路线站点数据失败');

//     const stations = await response.json();

//     if (stations.length === 0) {
//       alert('该路线没有站点');
//       return;
//     }

//     const { map } = window.busSystem;
//     const view = map.getView();

//     // 计算路线的所有站点的范围
//     const coordinates = stations.map(station =>
//       fromLonLat([station.longitude, station.latitude])
//     );

//     // 如果只有一个站点，则直接定位到该站点
//     if (coordinates.length === 1) {
//       view.animate({
//         center: coordinates[0],
//         zoom: 16,
//         duration: 500
//       });
//       return;
//     }

//     // 计算路线的范围
//     const extent = coordinates.reduce((extent, coord) => {
//       if (!extent) {
//         return [coord[0], coord[1], coord[0], coord[1]];
//       }
//       return [
//         Math.min(extent[0], coord[0]),
//         Math.min(extent[1], coord[1]),
//         Math.max(extent[2], coord[0]),
//         Math.max(extent[3], coord[1]),
//       ];
//     }, null);

//     // 定位到路线范围
//     view.fit(extent, {
//       padding: [50, 50, 50, 50],
//       duration: 500
//     });
//   } catch (error) {
//     console.error('定位到路线失败:', error);
//     alert('定位到路线失败');
//   }
// };
// 定位到路线
const zoomToRoute = async (route) => {
  try {
    // 首先获取路线的几何数据（不依赖站点数据）
    const { map, routesSource } = window.busSystem;
    const view = map.getView();

    // 方法1：使用routesSource中的要素来定位
    // 查找匹配的路线要素
    const features = routesSource.getFeatures().filter(
      feature => feature.get('route_id') === route.route_id
    );

    if (features.length > 0) {
      // 使用路线要素的几何范围
      const extent = features[0].getGeometry().getExtent();
      view.fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 500,
        maxZoom: 17
      });
      return;
    }

    // 方法2：如果在routesSource中找不到要素，尝试从API获取路线的站点数据
    console.log(`尝试通过API获取路线${route.route_id}的站点数据...`);
    const response = await fetch(`${API_BASE_URL}/routes/${route.route_id}/stations`);

    if (!response.ok) {
      // 如果API请求失败，尝试直接获取路线几何数据
      console.log(`尝试通过API获取路线${route.route_id}的几何数据...`);
      const routeResponse = await fetch(`${API_BASE_URL}/routes/${route.route_id}`);

      if (!routeResponse.ok) throw new Error('获取路线数据失败');

      const routeData = await routeResponse.json();
      if (!routeData.geometry) throw new Error('路线没有几何数据');

      // 解析几何数据
      let geom;
      if (typeof routeData.geometry === 'string') {
        geom = JSON.parse(routeData.geometry);
      } else {
        geom = routeData.geometry;
      }

      if (!geom || !geom.coordinates) throw new Error('路线几何数据格式无效');

      // 创建临时要素并定位
      let coordinates = [];

      if (geom.type === 'MultiLineString') {
        // 获取所有线段的坐标点
        coordinates = geom.coordinates.flat().map(coord => fromLonLat(coord));
      } else {
        coordinates = geom.coordinates.map(coord => fromLonLat(coord));
      }

      if (coordinates.length < 2) throw new Error('路线坐标点不足');

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
        duration: 500,
        maxZoom: 17
      });

      return;
    }

    const stations = await response.json();

    if (stations.length === 0) {
      alert('该路线没有站点数据，无法定位');
      return;
    }

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
      duration: 500,
      maxZoom: 17
    });
  } catch (error) {
    console.error('定位到路线失败:', error);
    alert('定位到路线失败: ' + error.message);

    // 出错时，直接使用路线名称尝试定位
    try {
      const { map, routesSource } = window.busSystem;
      const features = routesSource.getFeatures().filter(
        feature => feature.get('name') === route.name
      );

      if (features.length > 0) {
        const extent = features[0].getGeometry().getExtent();
        map.getView().fit(extent, {
          padding: [50, 50, 50, 50],
          duration: 500,
          maxZoom: 17
        });
      }
    } catch (e) {
      console.error('备用定位方法也失败:', e);
    }
  }
};



const saveStation = async (e) => {
  e.preventDefault();

  const stationData = {
    name: document.getElementById('station-name').value,
    line: document.getElementById('station-line').value, // 新增字段输入
    address: document.getElementById('station-address').value, // 对应name_st
    longitude: parseFloat(document.getElementById('station-longitude').value),
    latitude: parseFloat(document.getElementById('station-latitude').value)
  };

  try {
    const id = document.getElementById('station-id').value;
    const isEdit = id !== '';

    const url = isEdit
      ? `${API_BASE_URL}/stations/${id}`
      : `${API_BASE_URL}/stations`;

    const method = isEdit ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stationData)
    });

    if (response.ok) {
      closeModal('station-modal');
      refreshStations();
    } else {
      console.error('保存站点失败:', await response.text());
    }
  } catch (error) {
    console.error('保存站点出错:', error);
  }
};

// 保存路线
const saveRoute = async (event) => {
  event.preventDefault();

  const idInput = document.getElementById('route-id');
  const nameInput = document.getElementById('route-name');
  const numberInput = document.getElementById('route-number');
  const descriptionInput = document.getElementById('route-description');
  const geometryInput = document.getElementById('route-geometry');

  // 验证几何数据格式
  let geometryData;
  try {
    geometryData = JSON.parse(geometryInput.value);
  } catch (e) {
    alert('路线几何数据格式无效，请确保提供有效的GeoJSON格式');
    return;
  }
  const routeData = {
    name: nameInput.value,
    route_number: numberInput.value,
    description: descriptionInput.value,
    geometry: geometryData
  };

  // 显示加载指示器
  document.querySelector('.loader').style.display = 'flex';

  try {
    let response;
    const id = idInput.value;
    const isEdit = id !== '';

    if (isEdit) {
      // 更新路线
      response = await fetch(`${API_BASE_URL}/routes/${id}`, {
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

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`保存路线失败: ${errorText}`);
    }
    // 关闭弹窗
    closeModal('route-modal');
    // 刷新路线数据
    refreshRoutes();
  } catch (error) {
    console.error('保存路线失败:', error);
    alert(error.message || '保存路线失败');
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
      method: 'DELETE',

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
      method: 'DELETE',

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
      body: JSON.stringify({ order }),

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
      method: 'DELETE',

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
    const url = `${API_BASE_URL}/stations/search?term=${encodeURIComponent(term)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('搜索站点失败');

    const stations = await response.json();
    renderSearchResults(stations);
  } catch (error) {
    console.error('搜索站点失败:', error);
    alert('搜索站点失败');
  }
};

const renderSearchResults = (stations) => {
  const resultsContainer = document.getElementById('search-results');
  resultsContainer.innerHTML = '';

  stations.forEach(station => {
    const listItem = document.createElement('div');
    listItem.classList.add('list-item');

    listItem.innerHTML = `
      <h4>${station.name}</h4>
      <p>${station.address || '无地址'}</p>
    `;

    const actionsContainer = document.createElement('div');
    actionsContainer.classList.add('list-item-actions');

    const editButton = document.createElement('button');
    editButton.classList.add('edit-btn');
    editButton.textContent = '编辑';
    editButton.dataset.id = station.station_id;
    editButton.addEventListener('click', (e) => {
      e.stopPropagation();
      openStationModal(station.station_id);
    });

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-btn');
    deleteButton.textContent = '删除';
    deleteButton.dataset.id = station.station_id;
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`确定要删除站点 "${station.name}" 吗?`)) {
        deleteStation(station.station_id);
      }
    });

    actionsContainer.appendChild(editButton);
    actionsContainer.appendChild(deleteButton);
    listItem.appendChild(actionsContainer);

    resultsContainer.appendChild(listItem);

    // 点击列表项时定位到地图上的站点
    listItem.addEventListener('click', () => {
      zoomToStation(station);
    });
  });
};

const renderRouteSearchResults = (routes) => {
  const resultsContainer = document.getElementById('route-search-results');
  resultsContainer.innerHTML = '';

  routes.forEach(route => {
    const listItem = document.createElement('div');
    listItem.classList.add('list-item');

    listItem.innerHTML = `
      <h4>${route.name}</h4>
      <p>描述: ${route.description || '无描述'}</p>
      <p>起点: ${route.start_station_name || '无'} - 终点: ${route.end_station_name || '无'}</p>
      <p>距离: ${route.distance || '未知'} 公里</p>
    `;

    const actionsContainer = document.createElement('div');
    actionsContainer.classList.add('list-item-actions');

    const editButton = document.createElement('button');
    editButton.classList.add('edit-btn');
    editButton.textContent = '编辑';
    editButton.dataset.id = route.route_id;
    editButton.addEventListener('click', (e) => {
      e.stopPropagation();
      openRouteModal(route.route_id);
    });

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-btn');
    deleteButton.textContent = '删除';
    deleteButton.dataset.id = route.route_id;
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`确定要删除路线 "${route.name}" 吗?`)) {
        deleteRoute(route.route_id);
      }
    });

    actionsContainer.appendChild(editButton);
    actionsContainer.appendChild(deleteButton);
    listItem.appendChild(actionsContainer);

    resultsContainer.appendChild(listItem);

    // 点击列表项时高亮显示路线
    listItem.addEventListener('click', async () => {
      const routeStationsResponse = await fetch(`${API_BASE_URL}/routes/${route.route_id}/stations`);
      if (!routeStationsResponse.ok) {
        alert('获取路线站点数据失败');
        return;
      }

      const routeStations = await routeStationsResponse.json();
      if (routeStations.length >= 2) {
        const coordinates = routeStations.map(station =>
          fromLonLat([station.longitude, station.latitude])
        );

        const routeFeature = new Feature({
          geometry: new LineString(coordinates),
          name: route.name,
          description: route.description,
          color: '#e74c3c', // 默认颜色
          type: 'route'
        });

        const { routesSource } = window.busSystem;
        routesSource.clear(); // 清除之前的搜索结果
        routesSource.addFeature(routeFeature);

        // 调整视图到路线范围
        const extent = routeFeature.getGeometry().getExtent();
        const { map } = window.busSystem;
        map.getView().fit(extent, { padding: [50, 50, 50, 50], duration: 500 });
      } else {
        alert('该路线没有足够的站点数据');
      }
    });
  });
};

// 修改搜索路线函数以调用 renderRouteSearchResults
const searchRoutes = async () => {
  const searchInput = document.getElementById('route-search-input');
  const term = searchInput.value.trim();

  try {
    if (!term) {
      alert('请输入路线名称');
      return;
    }

    const url = `${API_BASE_URL}/routes/search?term=${encodeURIComponent(term)}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '搜索路线失败');
    }

    const routes = await response.json();
    renderRouteSearchResults(routes);

    // 显示取消按钮
    const cancelButton = document.getElementById('cancel-search-btn');
    cancelButton.style.display = 'block';
    cancelButton.addEventListener('click', cancelSearch);
  } catch (error) {
    console.error('搜索路线失败:', error);
    alert(error.message || '搜索路线失败');
  }
};

// 取消查询功能
const cancelSearch = () => {
  const { routesSource } = window.busSystem;
  routesSource.clear(); // 清除高亮的路线

  // 隐藏取消按钮
  const cancelButton = document.getElementById('cancel-search-btn');
  cancelButton.style.display = 'none';

  // 恢复主界面原图层
  refreshData();
};

// 刷新所有数据
const refreshData = async () => {
  const { stationsSource, routesSource } = window.busSystem;

  // 显示加载指示器
  document.querySelector('.loader').style.display = 'flex'; try {
    // 加载并刷新站点数据
    await refreshStations();

    // 加载并刷新路线数据
    await refreshRoutes();

    // 获取站点和路线数据用于渲染列表
    const stationsResponse = await fetch(`${API_BASE_URL}/stations`);
    const stationsData = await stationsResponse.json();
    renderStationsList(stationsData);

    const routesResponse = await fetch(`${API_BASE_URL}/routes`);
    const routesData = await routesResponse.json();
    renderRoutesList(routesData);
  } catch (error) {
    console.error('刷新数据失败:', error);
  } finally {
    // 隐藏加载指示器
    document.querySelector('.loader').style.display = 'none';
  }
};

// 显示登录弹窗
const showLoginModal = () => {
  const loginModal = document.getElementById('login-modal');
  loginModal.style.display = 'block';

  const closeButton = loginModal.querySelector('.close-button');
  closeButton.addEventListener('click', () => {
    loginModal.style.display = 'none';
  });
};

// 关闭弹窗
const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
};

// 显示主界面
const showMainContainer = () => {
  const mainContainer = document.getElementById('main-container');
  const loginModal = document.getElementById('login-modal');

  loginModal.style.display = 'none';
  mainContainer.style.display = 'flex';

  // 强制触发重绘以应用动画
  mainContainer.offsetHeight;
  mainContainer.classList.add('animated');
};

// 处理登录表单提交
const handleLogin = async (event) => {
  event.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    alert('请输入账号和密码');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/api/login', { // 使用完整路径
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),

    });

    if (response.ok) {
      const data = await response.json(); // 解析 JSON 响应
      alert(data.message);
      showMainContainer(); // 登录成功后显示主界面
    } else {
      const error = await response.json(); // 解析错误信息
      alert(`登录失败: ${error.message}`);
    }
  } catch (err) {
    console.error('登录请求失败:', err);
    alert('登录请求失败');
  }
};

// 初始化登录功能
const initLogin = () => {
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', handleLogin);

  // 显示登录弹窗（可根据需求触发）
  showLoginModal();
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

  // 路线搜索按钮
  document.getElementById('route-search-btn').addEventListener('click', searchRoutes);

  // 回车键搜索路线
  document.getElementById('route-search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchRoutes();
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

  initLogin();
};

// 启动应用
document.addEventListener('DOMContentLoaded', initApp);