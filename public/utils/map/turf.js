/*
 * @Description:
 * @Version:
 * @Author: kangjinrui
 * @Date: 2021-07-05 09:53:26
 * @LastEditors: kangjinrui
 * @LastEditTime: 2023-03-08 17:54:19
 */
import canvas2image from '../canvas2image'
import envelope from '@turf/envelope'
import buffer from '@turf/buffer'
import * as random from '@turf/random'
import interpolate from '@turf/interpolate'
import {
    featureEach
} from '@turf/meta'
import {
    featureCollection,
    point
} from '@turf/helpers'


import CommonUtils from '../base/function'

/**
 * 获取面的最小外包矩形
 * @param {*} ring 面坐标
 * @returns 
 */
export function getEnvelop(ring) {
    const points = []
    ring.forEach(element => {
        points.push(point(element))
    })
    const features = featureCollection(points)
    // var features = featureCollection([
    //     point([-75.343, 39.984], {
    //         "name": "Location A"
    //     }),
    //     point([-75.833, 39.284], {
    //         "name": "Location B"
    //     }),
    //     point([-75.534, 39.123], {
    //         "name": "Location C"
    //     })
    // ]);

    var enveloped = envelope(features)
    // console.log("???????", enveloped)
    const [xmin, ymin, xmax, ymax] = enveloped.bbox
    return {
        xmin,
        ymin,
        xmax,
        ymax
    }
}

/**
 * 导出canvas对象
 * @param {*} canvas 
 */
export function exportCanvas(canvas) {
    var imageWidth = 800
    // 保存（下载）图片
    canvas2image.Canvas2Image.saveAsImage(canvas, imageWidth, imageWidth * canvas.height / canvas.width, 'png')

    // var img = canvas2image.convertToImage(canvas, imageWidth, imageWidth * canvas.height / canvas.width, 'png');
    // var loadImg = document.createElement('a')
    // loadImg.href = img.src
    // loadImg.download = 'earth'
    // loadImg.click()
}

/**
 * 缓冲区分析
 * @param {*} geo geojson
 * @param {*} distance 距离
 * @param {*} units 单位
 * @returns 
 */
export function createBuffer(geo, distance, units = 'miles') {
    // geo = {
    //     "type": "FeatureCollection",
    //     "features": [{
    //         "type": "Feature",
    //         "properties": {
    //             "adcode": "110000",
    //             "name": "北京市",
    //             "center": [
    //                 116.405285,
    //                 39.904989
    //             ],
    //             "centroid": [
    //                 116.41995,
    //                 40.18994
    //             ],
    //             "childrenNum": 16,
    //             "level": "province",
    //             "parent": {
    //                 "adcode": 100000
    //             },
    //             "subFeatureIndex": 0,
    //             "acroutes": [
    //                 100000
    //             ]
    //         },
    //         "geometry": {
    //             "type": "Point",
    //             "coordinates": [
    //                 116.405285,
    //                 39.904989
    //             ]
    //         }
    //     }]
    // }
    const bufferResult = buffer(geo, distance, {
        units: units
    })
    console.log('buffer', bufferResult)
    return bufferResult
}

/**
 * 指定范围内生成指定数目随机点
 * @param {*} total 总点数
 * @param {*} bbox 范围
 * @returns geojson
 */
export function createRandomPointsFromBox(total = 50, bbox = [117.57071648609964, 29.612017196294367, 118.56681691790034, 30.1558200567]) {
    return random.randomPoint(total, {
        bbox
    })
}

/**
 * 指定范围内生成指定数目带有指定属性的点集
 * @param {*} total 总点数
 * @param {*} bbox 范围
 * @param {*} field 字段名
 * @param {*} options 可选
 * @returns 
 */
export function createRandomPointsWithProperty(total, bbox, field = 'solRad', options = {
    start: 0,
    end: 255
}) {
    let {
        start,
        end
    } = options
    const points = random.randomPoint(total, {
        bbox
    })
    featureEach(points, (point, index) => {
        point.properties[field] = CommonUtils.getRandomFloatNumberByRange(start || 0, end || 255)
    })
    return points
}


/**
 * 插值
 * @param {*} points 散点集
 * @param {*} cellSize 网格大小
 * @param {*} options 
 * @returns 
 */
export function interpolateFromPoints(points, cellSize = 1, options = {
    gridType: 'points',
    property: 'solRad',
    units: 'miles'
}) {
    return interpolate(points, cellSize, options);
}