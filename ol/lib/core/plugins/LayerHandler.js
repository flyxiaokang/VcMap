/*
 * @Description: 图层操作类
 * @Version:
 * @Author: kangjinrui
 * @Date: 2022-01-19 09:23:02
 * @LastEditors: kangjinrui
 * @LastEditTime: 2023-04-26 17:19:09
 */

// import 'ol/ol.css'
// import Map from 'ol/Map'
// import OSM from 'ol/source/OSM'
import TileLayer from 'ol/layer/Tile'
// import View from 'ol/View'
import WMTS from 'ol/source/WMTS'
import TileWMS from 'ol/source/TileWMS'
import ImageWMS from 'ol/source/ImageWMS'

import { Heatmap as HeatmapLayer } from 'ol/layer'

import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'

import { Cluster } from 'ol/source'

import { Image as ImageLayer } from 'ol/layer'
import XYZ from 'ol/source/XYZ'
import WMTSTileGrid from 'ol/tilegrid/WMTS'
import { ImageArcGISRest, TileArcGISRest } from 'ol/source'

import Overlay from 'ol/Overlay'

import { Style, Fill, Stroke, Circle as CircleStyle, Text } from 'ol/style'
import { Circle } from 'ol/geom'

import { get as getProjection } from 'ol/proj'
import { getTopLeft, getWidth } from 'ol/extent'

import GeoJSON from 'ol/format/GeoJSON'

import K_GLOBAL_CONFIG from '@/VcMap/global'

import CustomUtils from '@/VcMap/public/utils/base/function'

import { uuidOnlyStr } from '@/VcMap/public/utils/base/string'

import * as KFeatureLoader from './FeatureHandler'
import Feature from 'ol/Feature'
import { createRing } from './GeometryHandler'

const projection = getProjection('EPSG:3857')
const projectionExtent = projection.getExtent()
const size = getWidth(projectionExtent) / 256
const resolutions = new Array(19)
const matrixIds = new Array(19)

for (let z = 0; z < 19; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z)
  matrixIds[z] = z
}

/**
 * wmts 默认切片规则3857  kvp方式
 * @param {*} option
 * option = {
      id:'layerId',
      opacity:1,
      url: 'https://mrdata.usgs.gov/mapcache/wmts',
      layer: 'sgmc2',
      matrixSet: 'GoogleMapsCompatible',
      format: 'image/png',
      style: 'default'
    }
 * @returns layer
 */
export function getWmts(option) {
  return new TileLayer({
    id: option.id === undefined ? 'id_' + Math.random() : option.id,
    opacity: option.opacity === undefined ? 1 : option.opacity,
    visible: option.visible === undefined ? true : option.visible,
    source: new WMTS({
      ...option,
      projection: projection,
      tileGrid: new WMTSTileGrid({
        origin: getTopLeft(projectionExtent),
        resolutions: resolutions,
        matrixIds: matrixIds,
      }),
      wrapX: true,
    }),
  })
}

/**
 * wmts epsq:4326  kvp方式
 * @param {*} option 
 * {
            id: 'wmts_test',
            url: 'http://10.1.3.199:8090/iserver/services/dem30m/wmts100',
            layer: 'dem30m',
            matrixSet: 'Custom_dem30m',
            format: 'image/png',
            style: 'default'
        }
 * @returns layer
 */
export function getWmtsWgs84(option) {
  const projection = getProjection(K_GLOBAL_CONFIG['EPSG:4326'].prj)
  const projectionExtent = projection.getExtent()
  const { resolutions, matrixIds } = K_GLOBAL_CONFIG['EPSG:4326']
  return new TileLayer({
    id: option.id === undefined ? 'id_' + Math.random() : option.id,
    opacity: option.opacity === undefined ? 1 : option.opacity,
    visible: option.visible === undefined ? true : option.visible,
    source: new WMTS({
      ...option,
      wrapX: true,
      projection: projection,
      tileGrid: new WMTSTileGrid({
        origin: getTopLeft(projectionExtent),
        resolutions,
        matrixIds,
      }),
    }),
  })
}

/**
 * wmts自定义规则，指定坐标系，URLtemplate或者参数对象  kvp方式
 * @param {*}
 * prj
 * option = {
      id:?,
      opacity:?,
      url: ?,
      layer: '',
      matrixSet: '',
      format: 'image/png',
      style: 'default'
  }
 * @returns
 */
export function getWmtsByPrj({ prj, option }) {
  //
  const projection = getProjection(K_GLOBAL_CONFIG[prj].prj)
  const projectionExtent = projection.getExtent()
  const { resolutions, matrixIds } = K_GLOBAL_CONFIG[prj]
  const params =
    option.url.split('?').length > 1
      ? CustomUtils.parasUrlParams2Obj(option.url)
      : option
  return new TileLayer({
    id: option.id === undefined ? 'id_' + Math.random() : option.id,
    opacity: option.opacity === undefined ? 1 : option.opacity,
    visible: option.visible === undefined ? true : option.visible,
    source: new WMTS({
      ...params,
      wrapX: true,
      projection: projection,
      tileGrid: new WMTSTileGrid({
        origin: getTopLeft(projectionExtent),
        resolutions,
        matrixIds,
      }),
    }),
  })
}

/**
 * 加载geoserver发布的wmts
 * geoserver wmts 不需要指定坐标系，可动态投影，默认用4326
 * @param {*} param0
 * @returns
 */
export function getWmtsGeoserver({ prj = 'EPSG:4326', option }) {
  const projection = getProjection(K_GLOBAL_CONFIG[prj].prj)
  const projectionExtent = projection.getExtent()
  const { resolutions, matrixIds } = K_GLOBAL_CONFIG[prj]

  const matrixIdsWMTS = []
  matrixIds.forEach((element) => {
    matrixIdsWMTS.push(`${prj}:${element}`)
  })
  // 切片策略
  const tilegrid = new WMTSTileGrid({
    extent: [-180.0, -90.0, 180.0, 90.0], // 范围
    tileSize: [256, 256],
    origin: [-180.0, 90.0], // 切片原点
    resolutions: resolutions, // 分辨率
    matrixIds: matrixIdsWMTS, // 层级标识列表，与地图级数保持一致
  })
  const tileSource = new WMTS({
    url: option.url.split('?')[0],
    projection: projection,
    tileGrid: tilegrid,
    ...CustomUtils.parasUrlParams2Obj(option.url),
    format: 'image/png',
  })
  return new TileLayer({
    id: option.id === undefined ? 'id_' + Math.random() : option.id,
    opacity: option.opacity === undefined ? 1 : option.opacity,
    visible: option.visible === undefined ? true : option.visible,
    source: tileSource,
    wrapX: false,
  })
}

/**
 * XYZ 默认切片规则3857 restfull方式
 * @param {*} { option = {url:'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png'} }
 *
 * eg: 
 * 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
'?apikey=Your API key from https://www.thunderforest.com/docs/apikeys/ here'
 * @returns layer
 */
export function getXYZ(option) {
  return new TileLayer({
    id: option.id,
    opacity: option.opacity === undefined ? 1 : option.opacity,
    visible: option.visible === undefined ? true : option.visible,
    source: new XYZ({
      ...option,
    }),
  })
}

/**
 * XYZ 带坐标系
 * @param {*} param0 { prj = 'EPSG:3857', option = {url:'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png'} }
 * @returns
 */
export function getXYZByPrj({ prj, option }) {
  return new TileLayer({
    id: option.id,
    opacity: option.opacity === undefined ? 1 : option.opacity,
    visible: option.visible === undefined ? true : option.visible,
    source: new XYZ({
      ...option,
      projection: prj,
    }),
  })
}

/**
 * 加载天地图  URLteamplate
 * @param {*} { prj = 'EPSG:3857', option }
 * @returns
 */
export function getTdtByPrj({ prj, option }) {
  return getXYZByPrj({
    prj,
    option,
  })
}

/**
 * 超图  urlteamplate  restfull
 * @param {*} param0  { prj = 'EPSG:4326', option = {url:'http://10.1.3.199:8090/iserver/services/dem30m/wmts100?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=dem30m&STYLE=Default&FORMAT=image/png&TILEMATRIXSET=Custom_dem30m'} }
 * @returns
 */
export function getSuperMapWmts({ prj, option }) {
  const projection = getProjection(K_GLOBAL_CONFIG[prj].prj)
  const projectionExtent = projection.getExtent()
  const { resolutions, matrixIds } = K_GLOBAL_CONFIG[prj]

  const tileGrid = new WMTSTileGrid({
    origin: getTopLeft(projectionExtent),
    resolutions,
    matrixIds,
  })

  const layer = new TileLayer({
    id: option.id === undefined ? 'id_' + Math.random() : option.id,
    opacity: option.opacity === undefined ? 1 : option.opacity,
    visible: option.visible === undefined ? true : option.visible,
    source: new XYZ({
      tileGrid,
      // maxZoom: option.maxZoom,
      projection: prj,
      tileUrlFunction: function (tileCoord) {
        const z = tileCoord[0]
        const x = tileCoord[1]
        const y = tileCoord[2]
        return `${option.url}&tilecol=${x}&tilerow=${y}&tilematrix=${z}`
      },
    }),
  })
  return layer
}

/**
 * wms tile
 * @param {*} option  {id:'',visible:true, url:'http://10.1.102.189:8877/geoserver/NODE_LINK_SUBC/wms?layers=NODE_LINK_SUBC:B000000.POI'}
 * @returns
 */
export function getWmsTile(option) {
  return new TileLayer({
    id: option.id,
    visible: option.visible,
    source: new TileWMS({
      url: option.url.split('?')[0],
      params: CustomUtils.parasUrlParams2Obj(option.url),
    }),
  })
}

/**
 * wms image
 * @param {*} option  {id:'',visible:true, url:'http://10.1.102.189:8877/geoserver/NODE_LINK_SUBC/wms?layers=NODE_LINK_SUBC:B000000.POI'}
 * @returns
 */
export function getWmsImage(option) {
  return new ImageLayer({
    id: option.id,
    visible: option.visible,
    source: new ImageWMS({
      url: option.url.split('?')[0],
      params: CustomUtils.parasUrlParams2Obj(option.url),
    }),
  })
}

/**
 * arcgis image
 * @param {*} option  {url:'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'}
 * @returns
 */
export function getArcgisImage(option) {
  return new ImageLayer({
    id: option.id,
    visible: option.visible,
    source: new ImageArcGISRest({
      url: option.url,
    }),
  })
}

/**
 * arcgis image tile
 * @param {*} option {url:'https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer'}
 * @returns
 */
export function getArcgisImageTile(option) {
  return new TileLayer({
    id: option.id,
    visible: option.visible,
    source: new TileArcGISRest({
      url: option.url,
    }),
  })
}

export function getUserDefinedXYZ(option) {
  const lyr = new TileLayer({
    id: option.id || uuidOnlyStr(),
    opacity: option.opacity === undefined ? 1 : option.opacity,
    visible: option.visible === undefined ? true : option.visible,
    source: new XYZ({
      url: option.url,
      projection: option.prj === undefined ? 'EPSG:3857' : option.prj,
      // tileGrid: new WMTSTileGrid({
      //     origin: getTopLeft(projectionExtent),
      //     resolutions: resolutions,
      //     matrixIds: matrixIds
      // }),
      // maxZoom: option.maxZoom,
      // projection: 'EPSG:3857',
      // tileUrlFunction: function(tileCoord) {
      //     const z = tileCoord[0]
      //     const x = tileCoord[1]
      //     const y = -tileCoord[2] - 1
      //     return `${option.urlTemplate}&tilecol=${x}&tilerow=${y}&tilematrix=${z}`
      // }
    }),
  })

  return lyr
}

export function getGeojsonLayer({ id, visible, geojson }) {
  const source = new VectorSource({
    features: new GeoJSON().readFeatures(geojson),
  })

  const vectorLayer = new VectorLayer({
    id,
    visible,
    source,
  })

  return vectorLayer
}

export function getGeojsonLayerWithRender(options) {
  let { id, visible, geojson, field, labelField } = options
  //
  const source = new VectorSource({
    features: KFeatureLoader.getFeaturesFromGeojson(geojson, {
      field,
      labelField,
    }),
  })

  const vectorLayer = new VectorLayer({
    id,
    visible,
    source,
    style: function (feature) {
      console.log(feature)
    },
  })

  return vectorLayer
}

// export function getHeatMapLayer(geojson, options) {
//     //
//     const {
//         id,
//         visible,
//         field
//     } = options
//     var source = new VectorSource({
//         features: (new GeoJSON()).readFeatures(geojson)
//     });

//     // source: new VectorSource({
//     //     url: 'data/kml/2012_Earthquakes_Mag5.kml',
//     //     format: new GeoJSON(),
//     // })

//     const vectorLayer = new HeatmapLayer({
//         id,
//         visible,
//         source,
//         blur: 10,
//         radius: 10,
//         weight: function(feature) {
//             // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
//             // standards-violating <magnitude> tag in each Placemark.  We extract it from
//             // the Placemark's name instead.
//             const name = feature.get(field);
//             const magnitude = parseFloat(name);
//             return magnitude - 5;
//         },
//     });

//     return vectorLayer
// }

export function getHeatMapLayer(geojson, options) {
  //
  let { field, blur, radius } = options

  var source = new VectorSource({
    features: new GeoJSON().readFeatures(geojson),
  })

  const vector = new HeatmapLayer({
    source,
    blur: blur || 10,
    radius: radius || 10,
    weight: function (feature) {
      //
      // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
      // standards-violating <magnitude> tag in each Placemark.  We extract it from
      // the Placemark's name instead.
      const value = feature.get(field)
      return value
    },
  })
  return vector
}

export function getClusterLayerFromGeojson(geojson, options = {}) {
  let { id, visible, distance, minDistance } = options

  const source = new VectorSource({
    features: KFeatureLoader.getFeaturesFromGeojson(geojson),
  })

  const clusterSource = new Cluster({
    distance: distance || 20,
    minDistance: minDistance || 0,
    source: source,
  })

  const styleCache = {}
  const clusters = new VectorLayer({
    id,
    visible,
    source: clusterSource,
    style: function (feature) {
      const size = feature.get('features').length
      let style = styleCache[size]
      if (!style) {
        style = new Style({
          image: new CircleStyle({
            radius: 10,
            stroke: new Stroke({
              color: '#fff',
            }),
            fill: new Fill({
              color: '#3399CC',
            }),
          }),
          text: new Text({
            text: size.toString(),
            fill: new Fill({
              color: '#fff',
            }),
          }),
        })
        styleCache[size] = style
      }
      return style
    },
  })
  return clusters
}

export function getOverlayLayer(container, options) {
  const overlay = new Overlay({
    element: container,
    autoPan: {
      animation: {
        duration: 250,
      },
    },
  })

  return overlay
}

const defaultStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 208, 75, 0.5)',
  }),
  stroke: new Stroke({
    color: '#ffcc33',
    width: 2,
  }),
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({
      color: '#ffcc33',
    }),
  }),
})

const defaultVectorLayerId = 'vector_layer_temp_id_'

export function getVectorLayer(
  { style = defaultStyle, id = defaultVectorLayerId + uuidOnlyStr() } = {
    id: defaultVectorLayerId + uuidOnlyStr(),
    style: defaultStyle,
  }
) {
  const source = new VectorSource({
    wrapX: false,
  })

  const vector = new VectorLayer({
    id,
    source,
    style: style,
  })

  return vector
}

export function createRingLayer({ map, center, outerR, innerR }) {
  const feature = new Feature({
    geometry: createRing(map, center, outerR, innerR),
  })
  const layer = getVectorLayer()
  layer.getSource().addFeature(feature)
  return layer
}

/**
 * 通过图层id获取图层对象
 * @param {*} map
 * @param {*} id 图层id
 * @returns layer
 */
export function getLayerById(map, id) {
  if (map) {
    let layers = map.getLayers().getArray()
    for (let index = layers.length - 1; index >= 0; index--) {
      const layer = layers[index]
      if (layer) {
        const layerId = layer.getProperties().id
        if (layerId && layerId === id) {
          return layer
        }
      }
    }
  }
  return null
}

// 检查图层是否存在
export function checkLayerIsExist(map, id) {
  if (map && id) {
    const layers = map.getLayers().getArray()
    for (let index = 0; index < layers.length; index++) {
      const layer = layers[index]
      const layerId = layer.getProperties().id
      if (layerId && layerId === id) {
        return true
      }
    }
    return false
  } else {
    return false
  }
}

// 删除图层
export function removeLayerById(map, id, strict = false) {
  if (map && id) {
    let layers = map.getLayers().getArray()
    for (let index = layers.length - 1; index >= 0; index--) {
      const layer = layers[index]
      const layerId = layer.getProperties().id
      if (!strict && layerId && layerId.indexOf(id) !== -1) {
        map.removeLayer(layer)
      } else if (layerId === id) {
        map.removeLayer(layer)
      }
    }
  }
}

/**
 * 删除所有图层
 * @param {*} map
 */
export function removeAllLayer(map) {
  if (map) {
    let layers = map.getLayers().getArray()
    for (let index = layers.length - 1; index >= 0; index--) {
      const layer = layers[index]
      if (layer) {
        const layerId = layer.getProperties().id
        if (layerId) {
          map.removeLayer(layer)
        }
      }
    }
  }
}

/**
 * 设置图层是否可见
 * @param {*} map
 * @param {*} id
 * @param {*} visible
 * @param {*} opacity
 */
export function setLayerVisibleById(map, id, visible, opacity = 1) {
  if (map && id) {
    let layers = map.getLayers().getArray()
    for (let index = 0; index < layers.length; index++) {
      const layer = layers[index]
      const layerId = layer.getProperties().id
      if (layerId && layerId === id) {
        layer.setVisible(visible)
        layer.setOpacity(opacity)
      }
    }
  }
}

export function fly2layer(map, layer) {
  if (map && layer) {
    const vectorSource = layer.getSource()
    map.getView().fit(vectorSource.getExtent(), {
      duration: 1000,
      minResolution: 0.005274727,
    })
  }
}

export function fly2extent(
  map,
  extent,
  { duration = 1000 } = {
    duration: 1000,
  }
) {
  if (map) {
    map.getView().fit(extent, {
      duration,
    })
  }
}
