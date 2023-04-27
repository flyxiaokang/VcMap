/*
 * @Description: 布局自适应
 * @Version:
 * @Author: kangjinrui
 * @Date: 2023-04-14 11:07:05
 * @LastEditors: kangjinrui
 * @LastEditTime: 2023-04-20 13:43:41
 */

import ElementResizeDetectorMaker from 'element-resize-detector'
import { nextTick } from 'vue'

export function layoutUpdate({
    tableHeight,
    contanier = 'table-contanier',
    offset = 0,
}) {
    const className = `.${contanier}`
    nextTick(() => {
        ElementResizeDetectorMaker().listenTo(
            document.querySelector(className),
            (e) => {
                tableHeight.value = e.clientHeight + offset
            }
        )

        tableHeight.value =
            document.querySelector(className).clientHeight + offset
    })
}

export function draggableLayoutUpdate({
    vue,
    contanier = 'content_contanier',
    offset = 0,
}) {
    let initWidth = 0,
        initHeight = 0
    let width = 0,
        height = 0
    const className = `.${contanier}`
    ElementResizeDetectorMaker().listenTo(
        document.querySelector(className),
        (e) => {
            vue.initPosition.width = width + e.clientWidth + offset - initWidth
            vue.initPosition.height =
                height + e.clientHeight + offset - initHeight
        }
    )
    vue.$nextTick(() => {
        initWidth = document.querySelector(className).clientWidth + offset
        initHeight = document.querySelector(className).clientHeight + offset
        width = vue.initPosition.width
        height = vue.initPosition.height
    })
}
