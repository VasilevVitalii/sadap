import { reactive } from 'vue'

const state = reactive({
    componentDataSelectedTable: undefined as number | undefined,
    pageIndexSplitterHorizontal1: undefined as number | undefined,
    pageIndexSplitterHorizontal2: undefined as number | undefined,
    columnIdxFocus: undefined as number | undefined
})

export default state
