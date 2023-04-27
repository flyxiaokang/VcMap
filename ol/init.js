/*
 * @Description:初始化文件
 * @Version:
 * @Author: kangjinrui
 * @Date: 2021-12-27 14:27:19
 * @LastEditors: kangjinrui
 * @LastEditTime: 2023-04-25 13:53:08
 */

import OlHandler from './lib/business/OlHandler'
/**
 * openlayer
 * @returns openlayer
 */
export function getOlInstance(domid) {
    return new OlHandler(domid)
}
