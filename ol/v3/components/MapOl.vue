<!--
 * @Description: 
 * @Version: 
 * @Author: kangjinrui
 * @Date: 2022-04-12 15:55:31
 * @LastEditors: kangjinrui
 * @LastEditTime: 2023-04-25 16:36:35
-->
<template>
  <div
    class="vcMap_contanier"
    style="width: 100%; position: relative"
    element-loading-text="加载中，请稍后..."
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(255, 255, 255, 0.8)"
  >
    <div class="custom-icon-contanier" v-if="showIcons">
      <el-icon size="32" color="red">
        <IconIcBaseline5g />
      </el-icon>

      <el-icon size="32" color="red">
        <IconIcBaseline3dRotation />
      </el-icon>

      <el-icon size="32" color="red">
        <icon-ic-baseline-airplanemode-active />
      </el-icon>

      <el-icon class="custom-class" size="120">
        <IconTestBug />
      </el-icon>
    </div>
    <div :id="mapContanier" class="map-view" />

    <!-- popup -->
    <MapPopup
      v-show="showFeaturePopupLocal"
      :popupId="popupId"
      :title="featurePopupTitle"
      :contentHtml="popupContentHtml"
      @on-close="handleClosePopup"
    >
      <TableWidget
        style="height: 300px"
        :table-header="singlePopupConfig.tableHeader"
        :table-data="singlePopupConfig.tableData"
      />
    </MapPopup>

    <!-- multiple popup -->
    <div v-show="showMultiplePopupLocal" :id="popupsId">
      <MapPopup
        v-for="(item, index) in computePopups"
        :popupId="item.id"
        :key="item.id"
        :show-title="false"
      >
        <TableWidget
          style="height: 160px"
          :table-header="multiplePopupConfig.tableHeader"
          :table-data="item.attributes"
        />
      </MapPopup>

      <!-- <div
                v-for="item in computePopups"
                :id="item.id"
                class="model_popup"
                :key="item.id"
            >
                <div :id="item.id + '_content'" class="popup-content">
                    <TableWidget
                        style="height: 200px"
                        :table-header="singlePopupConfig.tableHeader"
                        :table-data="item.attributes"
                    />
                </div>
                <div class="triangle"></div>
            </div> -->
    </div>
    <!-- identify -->
    <MapPopup
      v-show="showIdentify"
      :popupId="popupId + '_identify_'"
      title="属性"
      @on-close="handleClosePopup"
    >
      <el-tabs
        v-model="activeIdentify"
        class="demo-tabs"
        @tab-click="handleClick"
      >
        <el-tab-pane
          v-for="(item, index) in identifyList"
          :label="item.name"
          :name="item.name"
          :key="index"
        >
          <TableWidget
            style="height: 300px"
            :table-header="singlePopupConfig.tableHeader"
            :table-data="item.attributes"
          />
        </el-tab-pane>
      </el-tabs>
    </MapPopup>

    <!-- <div id="popup" class="ol-popup">
            <a href="#" id="popup-closer" class="ol-popup-closer"></a>
            <div id="popup-content"></div>
        </div> -->

    <!-- 工具条 -->
    <MapBar
      v-if="showToolbar"
      :tool-index="curToolIndex"
      @on-change="mapToolHandler"
    />

    <!-- 地图状态条 -->
    <MapStatus v-if="showStatusbar" :latlon="latlon" />

    <!-- 底图 -->
    <MapBaseLayer v-if="showBasemapbar" @on-toggle="toggleMap" />

    <!-- 绘制 -->
    <MapDraw
      v-if="showMapDraw"
      class="vcmap_draw"
      @on-drawchange="handleDrawChange"
    />

    <!-- 图层管理 -->
    <transition name="el-zoom-in-top">
      <Draggable
        v-if="layerManagerVisible"
        title="图层列表"
        :initTop="0"
        :init-right="100"
        :initWidth="200"
        :initHeight="400"
        @closeDraggable="handleCloseTool"
      >
        <MapLayerManager
          :default-checked="defaultCheckLayerIds"
          @on-checkchange="handleCheckChange"
        />
      </Draggable>
    </transition>
  </div>
</template>

<script setup>
import { getOlInstance } from '@/VcMap/ol/init'
import { setConfig, getConfig } from '@/VcMap/ol/config'
import { uuidOnlyStr } from '@/VcMap/public/utils/base/string'
import CommonUtils from '@/VcMap/public/utils/base/function'

import MapBaseLayer from './MapBaseLayer.vue'
import MapBar from './MapBar.vue'
import MapLayerManager from '@/VcMap/public/components/Map/MapLayerManager.vue'
import MapPopup from './popup/MapPopup.vue'
import MapStatus from '@/VcMap/public/components/Map/MapStatus.vue'
import MapDraw from '@/VcMap/public/components/Map/MapDraw.vue'

import TableWidget from '@/VcMap/public/components/Table/index.vue'
import Draggable from '@/VcMap/public/export/Draggable/index.vue'
import { ref, toRefs, onMounted, computed, watch, reactive } from 'vue'

const olInstance = getOlInstance()

const props = defineProps({
  mapConfig: {
    type: Object,
    default() {
      return getConfig()
    },
  },
  showFeaturePopup: {
    type: Boolean,
    default: false,
  },

  featurePopupTitle: {
    type: String,
    default: '标题',
  },

  featurePopup: {
    type: Object,
    default() {
      return {}
    },
  },

  showMultiplePopup: {
    type: Boolean,
    default: false,
  },

  multiplePopup: {
    type: Array,
    default() {
      return []
    },
  },

  identify: {
    type: Boolean,
    default: false,
  },

  showIcons: {
    type: Boolean,
    default: false,
  },

  showToolbar: {
    type: Boolean,
    default: false,
  },

  showBasemapbar: {
    type: Boolean,
    default: false,
  },

  showStatusbar: {
    type: Boolean,
    default: true,
  },

  controls: {
    type: Object,
    default() {
      return {
        showBasemap: true,
        zoom: true,
      }
    },
  },
})

const {
  featurePopupTitle,
  featurePopup,
  multiplePopup,
  mapConfig,
  controls,
  showFeaturePopup,
  showMultiplePopup,
  identify,
} = toRefs(props)

const emits = defineEmits([
  'on-ready',
  'on-mousemove',
  'on-mouseclick',
  'on-mousemoveend',
  'on-drawend',
  'on-toolchange',
])

const mapContanier = `mapView_${uuidOnlyStr()}`

let mapReady = false
// 实时坐标
let latlon = ref([0, 0])

let curToolIndex = -1
let layerManagerVisible = ref(false)

let showFeaturePopupLocal = ref(false)
let showMultiplePopupLocal = ref(false)
let overlay = null
const popupId = 'ol-custom-popup-id'
const popupsId = 'ol-custom-popups-id'
const attributeOverlay = null
const popupContentHtml = ''
const popupContent = ''
const popupPrefix = 'm-custom-popup-'
const multiplePopupReady = true
const updatePopups = false

let showIdentify = ref(false)
let activeIdentify = ref('')
let identifyList = ref([])

let singlePopupConfig = reactive({
  tableHeader: [
    {
      label: '属性',
      value: 'label',
    },
    {
      label: '值',
      value: 'value',
      width: 100,
    },
  ],
  tableData: [],
})

let multiplePopupConfig = reactive({
  tableHeader: [
    {
      label: '属性',
      value: 'label',
      width: 80,
    },
    {
      label: '值',
      value: 'value',
      width: 80,
    },
  ],
})

const computePopups = computed(() => {
  return multiplePopup.value.map((e) => {
    return {
      ...e,
      id: popupPrefix + parseInt(Math.random() * 10e5),
    }
  })
})
// console.log('title...',featurePopupTitle,featurePopup)
// watch(featurePopupTitle,(nv,ov)=>{
// console.log('watch title...',featurePopupTitle)
// })

watch(
  featurePopup,
  (nv, ov) => {
    if (checkFeaturePopup(nv)) {
      const { location, attributes } = nv
      if (attributes instanceof Array && attributes.length > 0) {
        openFeaturePopup(location, attributes)
      }
    }
  },
  {
    deep: true,
  }
)
watch(
  multiplePopup,
  (nv, ov) => {
    if (checkMultiplePopup(nv)) {
      showMultiplePopupLocal.value = false
      setTimeout(() => {
        bindMultiplePopup()
      }, 0)
    }
  },
  {
    deep: true,
  }
)

const checkFeaturePopup = (nv) => {
  if (
    mapReady &&
    showFeaturePopup.value &&
    JSON.stringify(nv) != '{}' &&
    nv.hasOwnProperty('location') &&
    nv.hasOwnProperty('attributes')
  ) {
    return true
  } else return false
}

const checkMultiplePopup = (nv) => {
  if (mapReady && showMultiplePopup.value && nv instanceof Array) {
    return true
  } else return false
}

const handleClick = () => {}

const defaultCheckLayerIds = []
let showMapDraw = false
setConfig(mapConfig.value)

onMounted(() => {
  olInstance.mapContanier = mapContanier
  olInstance.initMap((map) => {
    mapReady = true
    emits('on-ready', olInstance)
    // bindPopup();
    // bindMultiplePopup()
    bindEvent()
  }, controls.value)
})

const bindEvent = () => {
  olInstance.registerMouseMove((e) => {
    latlon.value = [e.coordinate[0].toFixed(4), e.coordinate[1].toFixed(4)]
    emits('on-mousemove', e)
  })

  olInstance.registerMouseClick((e) => {
    if (identify.value && !showFeaturePopup.value) {
      handleIdentify(e)
    }
    emits('on-mouseclick', e)
  })

  olInstance.registerMouseMoveEnd((e) => {
    emits('on-mousemoveend', e)
  })
}

const handleIdentify = (e) => {
  let features = olInstance.map.getFeaturesAtPixel(e.pixel) || []
  const coordinate = e.coordinate
  if (features.length === 0) {
    return
  }
  openIdentifyPopup(coordinate)
  identifyList.value = []
  features.forEach((feature, index) => {
    activeIdentify.value = '要素_' + 1
    identifyList.value.push({
      name: '要素_' + (index + 1),
      location: coordinate,
      attributes: CommonUtils.object2Array(feature.getProperties()),
    })
  })
}

const openIdentifyPopup = (location) => {
  overlay = olInstance.createOverlay({
    popupId: popupId + '_identify_',
    center: location,
    offset: [0, 0],
    collection: false,
  })
  showIdentify.value = true
}

const bindPopup = () => {
  const container = document.getElementById(popupId)
  /**
   * Create an overlay to anchor the popup to the map.
   */
  overlay = olInstance.addOverlay(container)
  attributeOverlay = olInstance.addOverlay()
}

const openFeaturePopup = (location, attributes) => {
  overlay = olInstance.createOverlay({
    popupId: popupId,
    center: location,
    // html: getHtml(attributes),
    offset: [0, 0],
    collection: false,
  })
  singlePopupConfig.tableData = attributes
  showFeaturePopupLocal.value = true
}

const getHtml = (data) => {
  let html = ''
  data.forEach((element) => {
    const { value, label } = element
    html += `<div style="display:flex;padding:2px;"><div style="width:50%;text-align:left;background-clor:azure;">${label}：</div><div style="width:auto;text-align:left;">${value}</div></div>`
  })

  html += ''
  return html
}

const bindMultiplePopup = () => {
  if (showMultiplePopup.value) {
    computePopups.value.forEach((popup) => {
      const { id, location, attributes } = popup
      olInstance.createOverlay({
        popupId: id,
        center: location,
        // html: getHtml(attributes),
        offset: [0, 0],
      })
    })

    showMultiplePopupLocal.value = true
  }
}

const handleClosePopup = () => {
  overlay.setPosition(undefined)
  return false
}

const openPopup = (coordinate) => {
  popupContentHtml = `<p>当前坐标:</p>${coordinate.join(',')}`
  overlay.setPosition(coordinate)
}

const object2Array = (properties) => {
  const attributes = []
  for (const key in properties) {
    if (Object.hasOwnProperty.call(properties, key)) {
      const element = properties[key]
      // console.log('key...', key, element)
      if (typeof element !== 'object') {
        attributes.push({
          label: key,
          value: element,
        })
      }
    }
  }

  return attributes
}

const toggleMap = (layerid) => {
  olInstance.toggleBaseLayer(layerid)
}

const mapToolHandler = (item, index) => {
  curToolIndex = index
  const { key, handler } = item
  if (handler) {
    emits('on-toolchange', handler)
    return
  }
  switch (key) {
    case 'fullExtent':
      olInstance.fullExtent()
      break
    case 'zoomIn':
      olInstance.dragZoom(true)
      break
    case 'zoomOut':
      olInstance.dragZoom(false)
      break
    case 'pointer':
      olInstance.endDragZoom()
      break
    case 'LineString': // 测距
      olInstance.getMesureHandler().measureLength()
      break
    case 'xzq':
      showXzqPanel = !showXzqPanel
      break
    case 'Polygon': // 测面
      olInstance.getMesureHandler().measureArea()
      break
    case 'layer':
      layerManagerVisible.value = true
      break
    case 'locate':
      showMapLocateWindow = !showMapLocateWindow
      break
    case 'clear':
      olInstance.getMesureHandler().clearResult()
      break
    case 'draw':
      showMapDraw = true
      break
    default:
      break
  }
}

const handleCloseTool = () => {
  curToolIndex = -1
  layerManagerVisible.value = false
}

const handleCheckChange = (item, checked, indeterminate) => {
  // console.log(item, checked, indeterminate);
  if (
    item.hasOwnProperty('children') &&
    item.children.length > 0 &&
    !indeterminate
  ) {
    // all
    let list = []
    CommonUtils.tree2list(item.children, list)
    list.forEach((layer) => {
      let { id } = layer
      layer['visible'] = checked
      // console.log("all", layer.id);
      CommonUtils.pushNoReapeat(defaultCheckLayerIds, id, checked)
      olInstance.addLayerByType({ ...layer, visible: checked })
    })
  } else if (!item.hasOwnProperty('children') && !indeterminate) {
    // single
    // console.log("single", item.id);
    CommonUtils.pushNoReapeat(defaultCheckLayerIds, item.id, checked)
    olInstance.addLayerByType({ ...item, visible: checked })
  }
}

const handleDrawChange = (type, snapEnable, modifyEnable) => {
  if (type === 'End') {
    olInstance.getDrawHandler()?.endDraw()
  } else if (type === 'Clear') {
    olInstance.getDrawHandler()?.clear()
  } else {
    olInstance.getDrawHandler().drawByType({
      type,
      snapEnable,
      modifyEnable,
      drawEndHandle: (e) => {
        emits('on-drawend', e)
      },
    })
  }
}
</script>

<script>
export default {
  name: 'OlMap',
}
</script>

<style lang="scss" scoped>
.custom-icon-contanier {
  position: absolute;
  top: 100px;
  left: 50px;
  z-index: 3999;
}
.map-view {
  width: 100%;
  height: 100%;
  border-radius: 5px;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 34%);
}

.map-status {
  position: absolute;
  bottom: 0px;
  right: 20px;
}

.ol-map-layer-manager {
  position: absolute;
  top: 20px;
  right: 50px;
}

.model_popup {
  display: none;
  padding: 3px 5px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  min-width: 20px !important;
  left: -20px !important;
  text-align: center;
}

.ol-popup {
  background-color: rgba(0, 0, 0, 0) !important;
}

.popup-content {
  background-color: white;
  padding: 5px 5px;
  border-radius: 5px;
  font-family: serif;
  font-size: 12px;
  color: black;
  box-shadow: 0 2px 12px 0 rgb(0 0 0 / 34%);
  user-select: none;
}

.triangle {
  display: inline-block;
  width: 0;
  height: 0;
  line-height: 0;
  border: 10px solid transparent;
  border-top-color: #46a6ff;
  border-bottom-width: 0;
}

.vcmap_draw {
  position: absolute;
  top: 20px;
  right: 150px;
}

:deep(.ol-tooltip) {
  position: relative;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
  opacity: 0.7;
  white-space: nowrap;
  font-size: 12px;
  cursor: default;
  user-select: none;
}

:deep(.ol-tooltip-measure) {
  opacity: 1;
  font-weight: bold;
}

:deep(.ol-tooltip-static) {
  background-color: #ffcc33;
  color: black;
  border: 1px solid white;
}

:deep(.ol-tooltip-measure:before),
:deep(.ol-tooltip-static:before) {
  border-top: 6px solid rgba(0, 0, 0, 0.5);
  border-right: 6px solid transparent;
  border-left: 6px solid transparent;
  content: '';
  position: absolute;
  bottom: -6px;
  margin-left: -7px;
  left: 50%;
}

:deep(.ol-tooltip-static:before) {
  border-top-color: #ffcc33;
}

:deep(.ol-dragzoom) {
  border: 2px dashed red;
}

:deep(.ol-scale-line.ol-unselectable) {
  bottom: 35px !important;
}
</style>
