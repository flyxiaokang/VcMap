/*
 * @Description: interaction
 * @Version:
 * @Author: kangjinrui
 * @Date: 2023-04-19 13:54:02
 * @LastEditors: kangjinrui
 * @LastEditTime: 2023-04-23 17:19:31
 */

import { Draw, Modify, Snap, Select } from 'ol/interaction'

export default class InteractionHandler {
  constructor(map) {
    this.map = map
    this.selectable = false
    this.modifyable = false
    this.select = new Select({
      wrapX: false,
    })
    this.modify = new Modify({
      features: this.select.getFeatures(),
    })
  }

  enableSelect(b = true, callback) {
    const selectChange = (e) => {
      const features = e.selected
      let featureLayer = null
      if (features.length > 0) {
        featureLayer = this.select.getLayer(features[0])
      }
      callback && callback(e, featureLayer)
    }
    if (!this.selectable && b) {
      this.select && this.map.addInteraction(this.select)
      this.select.on('select', selectChange)
    } else if (this.selectable && !b) {
      this.select.un('select', selectChange)
      this.select && this.map.removeInteraction(this.select)
    }
    this.selectable = b
  }

  enableModify(b = true, callback) {
    const selectChange = (e) => {
      const features = e.selected
      let featureLayer = null
      if (features.length > 0) {
        featureLayer = this.select.getLayer(features[0])
      }
      callback && callback(e, featureLayer)
    }
    if (!this.modifyable && b) {
      this.select && this.map.addInteraction(this.select)
      this.modify && this.map.addInteraction(this.modify)
      this.select.on('select', selectChange)
    } else if (this.modifyable && !b) {
      this.select.un('select', selectChange)
      this.select && this.map.removeInteraction(this.select)
      this.modify && this.map.removeInteraction(this.modify)
    }
    this.modifyable = b
  }
}
