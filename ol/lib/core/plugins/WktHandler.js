/*
 * @Description: 
 * @Version: 
 * @Author: kangjinrui
 * @Date: 2023-03-03 10:44:56
 * @LastEditors: kangjinrui
 * @LastEditTime: 2023-03-03 10:47:18
 */
import WKT from 'ol/format/WKT'

import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'

import {
    Circle as CircleStyle,
    Fill,
    Stroke,
    Style
} from 'ol/style'

import {
    uuidOnlyStr
} from '@/VcMap/lib/utils/base/string'

const defaultStyle = new Style({
    fill: new Fill({
        color: 'rgba(255, 208, 75, 0.5)'
    }),
    stroke: new Stroke({
        color: '#ffcc33',
        width: 2
    }),
    image: new CircleStyle({
        radius: 7,
        fill: new Fill({
            color: '#ffcc33'
        })
    })
})

/**
 * 图层转wkt
 * @param {*} layer 图层
 * @returns wkt
 */
export function layer2wkt(layer) {
    if (layer) {
        const features = layer.getSource().getFeatures()
        if (features.length === 1) {
            return new WKT().writeFeature(features[0])
        } else if (features.length > 1) {
            return new WKT().writeFeatures(features)
        } else {
            return 'layer is null'
        }
    } else {
        return 'layer is null'
    }
}

/**
 * wkt转图层
 * @param {*} wkt wkt
 * @param {*} param1 
 * @returns 图层
 */
export function wkt2layer(wkt, {
    id = uuidOnlyStr(),
    style = defaultStyle
} = {
    id: uuidOnlyStr(),
    style: defaultStyle
}) {
    let feature = new WKT().readFeature(wkt); //通过wkt串返回geometry
    feature.setStyle(style)
    let vectorSource = new VectorSource({
        features: [feature]
    });
    let vectorLayer = new VectorLayer({
        id,
        source: vectorSource,
        visible: true
    });
    return vectorLayer
    // this.map.addLayer(vectorLayer)
    // this.map.getView().fit(vectorSource.getExtent(), {
    //     duration: 1000,
    //     minResolution: 0.005274727
    // });
}