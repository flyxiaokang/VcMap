/*
 * @Description: 基类-地图操作类
 * @Version:
 * @Author: kangjinrui
 * @Date: 2021-12-27 14:28:14
 * @LastEditors: kangjinrui
 * @LastEditTime: 2023-04-23 15:36:45
 */

import 'ol/ol.css'
import Map from 'ol/Map'
import OSM from 'ol/source/OSM'
import TileLayer from 'ol/layer/Tile'
import View from 'ol/View'
import { defaults } from 'ol/control'
import ScaleLine from 'ol/control/ScaleLine'
import DragZoom from 'ol/interaction/DragZoom'
import { always } from 'ol/events/condition'

import CommonUtils from '@/VcMap/public/utils/base/function'

import * as LayerHandler from './plugins/LayerHandler'
import * as MeasureHandler from './plugins/MeasureHandler'
import DrawHandler from './plugins/DrawHandler'
import kriging from './plugins/KrigingHandler'
import WfsHandler from './plugins/WfsHandler'
import InteractionHandler from './plugins/InteractionHandler'
import * as GeometryHandler from './plugins/GeometryHandler'
import * as TransHandler from './plugins/TransformHandler'

import { uuidOnlyStr } from '@/VcMap/public/utils/base/string'
import { MAP_TYPE_ENUM } from '@/VcMap/global'
// 自定义配置文件
import { getConfig } from '@/VcMap/ol/config'

class CustomMap {
    // map 对象
    map = null
    // map 容器
    mapContanier = ''

    constructor(mapContanier = 'map-view') {
        // console.log('getConfig()...', getConfig())
        this.mapContanier = mapContanier
        // 地图事件
        this.mouseMoveHandle = null
        this.mouseClickHandle = null
        this.mouseDbClickHandle = null
        this.mouseMoveEndHandle = null

        // 坐标系
        this.prj = getConfig().prj
        // 地图范围
        this.mapInitExtent = getConfig().defaultView
        // 默认符号
        // this.defaultCircleStyle = new CircleStyle({
        //     radius: 5,
        //     fill: new Fill({
        //         color: 'orange'
        //     })
        // });

        this.overlay = null
        // overlay集合
        this.popupOverlayCollection = []

        // 绘制工具
        this.drawHandler = null

        this.kriging = kriging

        this.wfsHandler = null
        this.interactionHandler = null

        this.GeoHandler = GeometryHandler
        this.LayerHandler = LayerHandler
        this.TransHandler = TransHandler
    }

    static whoami() {
        return this.name
    }

    /**
     * 静态方法 类名.function
     * @param {*} param0
     */
    static initMapOSM({ mapContanier = 'map-view' }) {
        const map = new Map({
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
            ],
            target: mapContanier,
            view: new View({
                center: [0, 0],
                zoom: 2,
            }),
        })
        this.map = map
    }

    /**
     * 实例方法 实例.function
     */
    initMapOSM() {
        const map = new Map({
            logo: false,
            controls: defaults({
                attribution: false,
                zoom: true,
                rotate: false,
                scaleLine: true,
            }).extend([]), // 隐藏放大缩小按钮
            layers: [
                new TileLayer({
                    source: new OSM(),
                }),
            ],
            target: this.mapContanier,
            view: new View({
                center: [0, 0],
                zoom: 2,
            }),
        })
        this.map = map
        this.map.addControl(
            new ScaleLine({
                units: 'metric',
            })
        )
        // map event
        this.initEvent()
    }
    /**** map start **** */
    /**
     * 通过配置文件【mapConfig】，创建地图
     */
    initMap(callback, controls = { showBasemap: true }) {
        if (!this.mapContanier) {
            return
        }
        const { baseLayers, prj } = getConfig()
        const layers = []
        // 底图集合
        //
        const baseLayersList = []
        CommonUtils.tree2list(baseLayers, baseLayersList)

        baseLayersList.forEach((option) => {
            // baseMap  标识底图图层
            if (option.url) {
                option.id = `baseMap_${option.id}`
                layers.push(this.getLayerByType(option))
            }
            // switch (option.type) {
            //     case MAP_TYPE_ENUM.wmts:
            //         layers.push(
            //             LayerHandler.getWmtsByPrj({
            //                 prj,
            //                 option,
            //             })
            //         )
            //         break
            //     case MAP_TYPE_ENUM.tdt:
            //         layers.push(
            //             LayerHandler.getTdtByPrj({
            //                 prj,
            //                 option,
            //             })
            //         )
            //         break
            //     case MAP_TYPE_ENUM.superMap:
            //         layers.push(
            //             LayerHandler.getSuperMapWmts({
            //                 prj,
            //                 option,
            //             })
            //         )
            //         break
            //     default:
            //         layer.push(this.getLayerByType(option))
            // }
        })

        const map = new Map({
            logo: false,
            controls: defaults({
                attribution: false,
                zoom: true,
                rotate: false,
                scaleLine: true,
                ...controls,
            }).extend([]), // 隐藏放大缩小按钮
            layers: controls.showBasemap ? layers : [],
            target: this.mapContanier,
            view: new View(getConfig().defaultView),
        })
        this.map = map
        this.map.addControl(
            new ScaleLine({
                units: 'metric',
            })
        )
        setTimeout(() => {
            this.mapInitExtent = this.map
                .getView()
                .calculateExtent(this.map.getSize())
            callback && callback(map)
        }, 500)
        // map event
        this.initEvent()
    }

    /**
     * 自定义创建地图
     * @param {*} {容器id，底图集合，view}
     */
    initCustomMap(
        {
            mapContanier = this.mapContanier,
            baseLayers,
            view = {
                projection: 'EPSG:4326',
                center: [104.53125000000001, 32.70263671875],
                zoom: 5,
                minZoom: 0,
                maxZoom: 20,
            },
        } = {},
        callback
    ) {
        if (!this.mapContanier) {
            return
        }
        const layers = []
        baseLayers.forEach((option) => {
            const layer = this.getLayerByType(option)
            if (layer) {
                layers.push(layer)
            }
        })
        const map = new Map({
            logo: false,
            controls: defaults({
                attribution: false,
                zoom: true,
                rotate: false,
                scaleLine: true,
            }).extend([]), // 隐藏放大缩小按钮
            layers: layers,
            target: mapContanier,
            view: new View(view),
        })
        // this.map = map
        map.addControl(
            new ScaleLine({
                units: 'metric',
            })
        )
        setTimeout(() => {
            this.mapInitExtent = this.map
                .getView()
                .calculateExtent(this.map.getSize())
            callback && callback(map)
        }, 500)
        // map event
        this.initEvent()
    }
    /**** map end **** */

    /*** 事件注册模块.start *** */
    /**
     * 初始化事件
     */
    initEvent() {
        const { map } = this
        map.on('singleclick', (e) => {
            this.mouseClickHandle && this.mouseClickHandle(e)
        }) // 鼠标单击事件
        map.on('doubleClick', (e) => {
            this.mouseDbClickHandle && this.mouseDbClickHandle(e)
        }) // 鼠标双击事件
        map.on('pointermove', (e) => {
            this.mouseMoveHandle && this.mouseMoveHandle(e)
        }) // 鼠标移动事件
        map.on('moveend', (e) => {
            this.mouseMoveEndHandle && this.mouseMoveEndHandle(e)
        }) // 鼠标移动事件
    }

    registerMouseClick(callback) {
        this.mouseClickHandle = callback
    }

    releaseMouseClick() {
        this.mouseClickHandle = null
    }

    registerMouseDbClick(callback) {
        this.mouseDbClickHandle = callback
    }

    releaseMouseDbClick() {
        this.mouseDbClickHandle = null
    }

    registerMouseMove(callback) {
        this.mouseMoveHandle = callback
    }

    relaeseMouseMove() {
        this.mouseMoveHandle = null
    }

    registerMouseMoveEnd(callback) {
        this.mouseMoveEndHandle = callback
    }

    relaeseMouseMoveEnd() {
        this.mouseMoveEndHandle = null
    }
    /*** 
     * 事件注册模块.end *** */

    /*** 
     * 图层操作模块.start *** */
    /**
     * 自定义add overlay
     * @param {*} contanier 容器id
     * @param {*} options 可选参数
     * @returns overlay
     */
    addOverlay(contanier, options) {
        const overlay = LayerHandler.getOverlayLayer(contanier, options)
        this.overlay = overlay
        this.map.addOverlay(overlay)
        return overlay
    }

    /**
     * 自定义创建overlay
     * @param {*} param0
     * @returns overlay
     */
    createOverlay({
        popupId,
        center,
        html = '',
        offset = [0, -15],
        collection = true,
    } = {}) {
        let { map } = this
        if (document.getElementById(popupId)) {
            document.getElementById(popupId).style.display = 'block'
        }
        let container = document.getElementById(popupId)
        if (!container) {
            return
        }

        let content = document.getElementById(popupId + '_content')
        if(html !== ''){
            content.innerHTML = html
        }

        const overlay = LayerHandler.getOverlayLayer(container)
        overlay.setPosition(center)
        overlay.setPositioning('center-center')
        overlay.setOffset(offset)
        map.addOverlay(overlay)
        collection && this.popupOverlayCollection.push(overlay)
        return overlay
    }

    /**
     * 删除所有overlay
     */
    removeAllOverlay() {
        this.popupOverlayCollection.forEach((overlay) => {
            this.map.removeOverlay(overlay)
        })

        this.popupOverlayCollection = []
    }

    /**
     * 加载图层
     * @param {*} option 图层信息 {id,visible,type = MAP_TYPE_ENUM}
     * @param {*} prj 坐标系
     */
    addLayerByType(option, prj = getConfig().prj) {
        let { id, visible, once } = option
        if (!id) {
            id = 'layerId_' + uuidOnlyStr()
            option['id'] = id
        }

        // if (!visible) {
        //     visible = true
        //     option['visible'] = visible
        // }
        if (id) {
            if (once) {
                this.removeLayerById(id)
                // console.log('remove layer>>>', id)
            }
            if (this.checkLayerIsExist(id)) {
                this.setLayerVisibleById({
                    id,
                    visible,
                })
            } else {
                let layer = this.getLayerByType(option, prj)
                if (layer) {
                    this.map.addLayer(layer)
                    return layer
                }
            }
        } else {
            console.warn('图层id不能为空')
        }
    }

    /**
     * 根据服务类型加加载
     * @param {*} option layer
     * @param {*} prj EPSG:4326 | EPSG:3857
     * @returns
     */
    getLayerByType(option, prj = getConfig().prj) {
        switch (option.type) {
            case MAP_TYPE_ENUM.wmts:
                return LayerHandler.getWmtsByPrj({
                    prj,
                    option,
                })
            case MAP_TYPE_ENUM.tdt:
                return LayerHandler.getTdtByPrj({
                    prj,
                    option,
                })
            case MAP_TYPE_ENUM.superMap:
                return LayerHandler.getSuperMapWmts({
                    prj,
                    option,
                })
            case MAP_TYPE_ENUM.wms:
                return LayerHandler.getWmsTile(option)
            case MAP_TYPE_ENUM.wmsImage:
                return LayerHandler.getWmsImage(option)
            case MAP_TYPE_ENUM.geoserverWmts:
                return LayerHandler.getWmtsGeoserver({
                    option,
                })
            case MAP_TYPE_ENUM.arcgis_mapImage:
                return LayerHandler.getArcgisImage(option)
            case MAP_TYPE_ENUM.arcgis_mapTile:
                return LayerHandler.getArcgisImageTile(option)
            case MAP_TYPE_ENUM.arcgis_wmts:
                return LayerHandler.getXYZ(option)
            case MAP_TYPE_ENUM.geojson:
                return LayerHandler.getGeojsonLayerWithRender(option)
            case MAP_TYPE_ENUM.heatMap:
                return LayerHandler.getHeatMapLayer(option.geojson, option)
            case MAP_TYPE_ENUM.clusterMap:
                return LayerHandler.getClusterLayerFromGeojson(
                    option.geojson,
                    option
                )
            case MAP_TYPE_ENUM.gdMap:
                //
                return LayerHandler.getXYZ(option)
            default:
                return null
        }
    }

    /**
     * 加载wmts
     * @param {*} layerOption 标准wmts
     */
    addWmtsLayer(layerOption) {
        const { id, visible } = layerOption
        if (id) {
            if (this.checkLayerIsExist(id)) {
                this.setLayerVisibleById({
                    id,
                    visible,
                })
            } else {
                this.map.addLayer(LayerHandler.getWmts(layerOption))
            }
        } else {
            console.warn('图层id不能为空')
        }
    }

    /**
     * XYZ类型切片服务
     * @param {*} layerOption
     */
    addXYZLayer(layerOption) {
        const { id, visible } = layerOption
        if (id) {
            if (this.checkLayerIsExist(id)) {
                this.setLayerVisibleById({
                    id,
                    visible,
                })
            } else {
                this.map.addLayer(LayerHandler.getXYZ(layerOption))
            }
        } else {
            console.warn('图层id不能为空')
        }
    }

    /**
     * 加载geoserver wmts
     * @param {*} option {id,type,visible}
     */
    addGeoserverWmts(option) {
        this.map.addLayer(
            LayerHandler.getWmtsGeoserver({
                option,
            })
        )
    }

    addGeojsonLayer({ id, visible = true, geojson }) {
        const layer = LayerHandler.getGeojsonLayer({
            id,
            visible,
            geojson,
        })
        this.map.addLayer(layer)
        return layer
    }

    /**
     * 检查图层是否存在
     * @param {*} id 图层id
     * @returns 是否存在
     */
    checkLayerIsExist(id) {
        return LayerHandler.checkLayerIsExist(this.map, id)
    }

    /**
     * 通过id删除图层
     * @param {*} id 图层id
     */
    removeLayerById(id, strict = false) {
        const { map } = this
        LayerHandler.removeLayerById(map, id, strict)
    }

    /**
     * 设置图层显隐
     * @param {*} param0
     */
    setLayerVisibleById({ id, visible = true, opacity = 1, strict = true }) {
        const { map } = this
        LayerHandler.setLayerVisibleById(map, id, visible, opacity)
    }

    /*** 
     * 图层操作模块.end *** */

    /**
     * 拉框缩放
     * @param {Boolean}
     */
    dragZoom(out) {
        let { map, dragZoomIns } = this
        if (dragZoomIns) {
            this.map.removeInteraction(dragZoomIns)
            dragZoomIns = null
        }
        // 初始化一个拉框控件
        dragZoomIns = new DragZoom({
            condition: always,
            out,
        })
        this.dragZoomIns = dragZoomIns
        dragZoomIns.setActive(true)
        map.addInteraction(dragZoomIns)
        document.querySelector(`#${this.mapContanier}`).style.cursor =
            'crosshair'
    }

    /**
     * 结束缩放
     */
    endDragZoom() {
        let { map, dragZoomIns } = this
        if (dragZoomIns) {
            dragZoomIns.setActive(false)
            map.removeInteraction(dragZoomIns)
            document.querySelector(`#${this.mapContanier}`).style.cursor =
                'default'
            dragZoomIns = null
        }
    }

    /**
     * 获取测量工具
     * @returns MeasureHandler
     */
    getMesureHandler() {
        MeasureHandler.setMap(this.map)
        return MeasureHandler
    }

    /**
     * 获取绘制工具
     * @param {*} map
     * @returns drawHandler
     */
    getDrawHandler(map = this.map) {
        if (this.drawHandler == null) {
            this.drawHandler = new DrawHandler(map)
        }
        return this.drawHandler
    }

    getWfsHandler(map = this.map) {
        if (this.wfsHandler == null) {
            this.wfsHandler = new WfsHandler(map)
        }
        return this.wfsHandler
    }

    /**
     * 获取当前范围、中心点
     * @returns
     */
    getExtent() {
        return {
            center: this.map.getView().getCenter(),
            extent: this.map.getView().calculateExtent(this.map.getSize()),
        }
    }

    /**
     * 视图范围初始化
     */
    fullExtent(options = {}) {
        this.map.getView().fit(this.mapInitExtent, options)
    }

    /**
     * 缩放到指定范围
     * @param {*} extent 范围 [minX,minY,maxX,maxY]
     * @param {*} options 可选参数
     */
    fitToExtent(extent, options = {}) {
        this.map.getView().fit(extent, options)
    }
    /*** end *** */

    getInteraction(map = this.map) {
        if (this.interactionHandler == null) {
            this.interactionHandler = new InteractionHandler(map)
        }
        return this.interactionHandler
    }

    getGeoHandler(){
        return GeometryHandler
    }

    getLayerHandler(){
        return LayerHandler
    }
}

export default CustomMap
