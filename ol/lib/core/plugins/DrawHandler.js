/*
 * @Description:绘制工具
 * @Version:
 * @Author: kangjinrui
 * @Date: 2022-02-11 17:36:50
 * @LastEditors: kangjinrui
 * @LastEditTime: 2023-04-26 16:33:38
 */

import { Draw, Modify, Snap, Select } from 'ol/interaction'
import { Vector as VectorSource } from 'ol/source'
import { Vector as VectorLayer } from 'ol/layer'
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style'

import { createBox } from 'ol/interaction/Draw'

import Commonutils from '@/VcMap/public/utils/base/function'

import { checkLayerIsExist, removeLayerById } from './LayerHandler'

const DRAW_TYPE = ['Point','LineString','Polygon','Circle','Box','Ring']

class DrawHandler {
  constructor(map = null) {
    this.draw = null
    this.snap = null
    this.modify = null
    this.select = null
    this.bInit = false

    this.selectEnable = false

    this.map = map

    this.layerId = 'layerId_draw'

    this.source = new VectorSource({
      wrapX: false,
    })

    this.vector = new VectorLayer({
      id: this.layerId,
      source: this.source,
      style: new Style({
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
      }),
    })
  }

  initVectorLayer(map) {
    let { vector } = this
    map.addLayer(vector)
  }

  removeInteraction(map) {
    let { draw, snap, modify, select } = this
    draw && map.removeInteraction(draw)
    snap && map.removeInteraction(snap)

    modify && map.removeInteraction(modify)
    select && map.removeInteraction(select)
  }

  activeSnap(map = this.map) {
    // let { snap } = this
    // snap && map.addInteraction(snap)

    this.addSnap(map)
  }

  activeModify(map = this.map) {
    let { modify } = this
    modify && map.addInteraction(modify)
  }

  addSnap(map) {
    let { source } = this
    this.snap = new Snap({
      source,
    })
    map.addInteraction(this.snap)
  }

  addModify(map, selectEnable = false, modifyEnable = false) {
    let { source } = this
    if (selectEnable) {
      this.select = new Select({
        wrapX: false,
      })
      this.modify = new Modify({
        features: this.select.getFeatures(),
      })
      map.addInteraction(this.select)
      map.addInteraction(this.modify)
    } else if (modifyEnable) {
      this.modify = new Modify({
        source,
      })
      map.addInteraction(this.modify)
    }
  }

  addSelect(map) {}

  /**
   * 绘制图形
   * type Point|LineString|Polygon|Circle|Box
   * snapEnable 是否开启捕获
   * modifyEnable 是否开启编辑
   * once 是否仅执行一次
   * drawEndHandle 回调
   * @param {*}
   * @return callback
   */
  drawByType(
    {
      map = this.map,
      type = 'Point',
      snapEnable = false,
      modifyEnable = false,
      selectEnable = false,
      once = false,
      freehand = false,
      drawEndHandle = null,
    } = {
      type: 'Point',
      snapEnable: false,
      modifyEnable: false,
      once: false,
      drawEndHandle: null,
    }
  ) {
    if (Commonutils.isNullOrUndifiend(map)) {
      console.error('map不能为空')
      return false
    }
    if(!DRAW_TYPE.includes(type)){
      console.error('未知类型',type)
      return false
    }
    this.selectEnable = selectEnable
    let draw = null
    let { source, vector, layerId } = this

    if (this.draw !== null) {
      this.removeInteraction(map)
    }

    if (!checkLayerIsExist(map, layerId)) {
      map.addLayer(vector)
    }

    if (type === 'Box') {
      draw = new Draw({
        source,
        type: 'Circle',
        geometryFunction: createBox(),
      })
    } else if (type === 'Ring') {
      draw = new Draw({
        source,
        type: 'Point',
      })
    } else {
      draw = new Draw({
        source,
        type,
        freehand,
      })
    }

    this.draw = draw
    map.addInteraction(draw)

    draw.on('drawend', (e) => {
      const feature = e.feature
      // 是否结束绘制
      if (once) {
        this.removeInteraction(map)
        this.addModify(map, selectEnable, modifyEnable)
      } else {
        this.addModify(map, false)
      }
      drawEndHandle &&
        drawEndHandle({
          e,
          feature,
          coordinates: feature.getGeometry().getCoordinates(),
          type: feature.getGeometry().getType(),
        })
    })

    // 捕获
    if (snapEnable) {
      this.addSnap(map)
    }
    // 修改
    // if (modifyEnable) {
    //     this.addModify(map, selectEnable)
    // }
  }

  drawPoint(map = this.map) {
    this.drawByType('Point', {
      map,
    })
  }

  endDraw(map = this.map) {
    this.removeInteraction(map)
  }

  endInteraction(map = this.map) {
    this.selectEnable = false
    this.removeInteraction(map)
  }

  clear(map = this.map) {
    this.vector.getSource().clear()
    // removeLayerById(this.layerId, map)
  }
}

export default DrawHandler
