<!--
 * @Description:
 * @Version:
 * @Author: kangjinrui
 * @Date: 2021-09-22 14:52:30
 * @LastEditors: kangjinrui
 * @LastEditTime: 2023-04-09 23:00:49
-->
<template>
    <el-tree
        :data="treeData"
        show-checkbox
        node-key="id"
        :default-expand-all="false"
        :default-checked-keys="checkedArr"
        :default-expanded-keys="checkedArr"
        :props="defaultProps"
        @check-change="checkedChange"
    />
</template>

<script setup>
import { getConfig } from '@/VcMap/ol/config'
import { onMounted, reactive, ref, toRefs } from 'vue'

const props = defineProps({
    defaultChecked: {
        type: Array,
        default() {
            return []
        },
    },
})

const emits = defineEmits(['on-close'])
let checkedArr = ref([])
let defaultProps = reactive({
    children: 'children',
    label: 'label',
})

let treeData = ref([])

const {defaultChecked} = toRefs(props)
onMounted((e) => {
    // console.log('mapConfig...', getConfig())
    checkedArr = defaultChecked.value.map((e) => {
        return e
    })
    treeData = getConfig().businessLayers
})

const checkedChange = (data, checked, indeterminate) => {
    $emit('on-checkchange', data, checked, indeterminate)
}

const closeLayerPanel = () => {
    emits('on-close')
}
</script>
<style scoped>
:deep(.el-tree) {
    height: 100%;
    overflow-y: auto;
}
</style>
