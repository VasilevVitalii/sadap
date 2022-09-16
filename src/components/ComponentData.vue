<template>
    <q-btn unelevated color="primary" label="Load data file..." @click="doLoadFile()" />
    <div v-show="getTabs().length > 0">
        <div class="text-caption" style="text-overflow: ellipsis; overflow: hidden; max-height: 20px; margin: 0px 0px 0px 10px">
            loaded file: {{ getLoadedFullFileName() }}
        </div>
        <q-tabs v-model="state.componentDataSelectedTable" dense align="left" active-color="primary" indicator-color="primary">
            <q-tab v-for="tab in getTabs()" :key="tab.tableIdx" :name="tab.tableIdx" :label="tab.title" />
        </q-tabs>

        <q-tab-panels v-model="state.componentDataSelectedTable" animated>
            <q-tab-panel v-for="tab in getTabs()" :key="tab.tableIdx" :name="tab.tableIdx">
                <q-table
                    flat
                    class="my-sticky-virtscroll-table"
                    dense
                    hide-bottom
                    :rows="getRows(tab.tableIdx)"
                    :columns="getColumns(tab.tableIdx)"
                    virtual-scroll
                    v-model:pagination="statePagination"
                    :rows-per-page-options="[0]"
                    :virtual-scroll-sticky-size-start="48"
                    row-key="name"
                    :style="{
                        height: 'calc(' + state.pageIndexSplitterHorizontal1 + 'px - 150px)'
                    }"
                />
            </q-tab-panel>
        </q-tab-panels>
    </div>
</template>

<script lang="ts">
import stateData, { TColumn, TRow } from '../states/stateData'
import state from '../states/state'
import { QTableColumn } from 'quasar'
import { electronApi } from '../../src-electron/electron-api'
import { ref } from 'vue'
export default {
    emits: ['onChange'],
    setup(_, { emit }) {
        const getTabs = (): { title: string; tableIdx: number }[] => {
            return stateData.data.tables.map((table) => {
                return {
                    title: table.title,
                    tableIdx: table.tableIdx
                }
            })
        }

        const getColumns = (tableIdx: number): QTableColumn[] => {
            const columns = stateData.data.tables.find((f) => f.tableIdx === tableIdx)?.columns || ([] as TColumn[])

            return [
                {
                    name: 'rowIdx',
                    label: '#',
                    align: 'left',
                    field: 'rowIdx',
                    format: (val) => `${val}`,
                    sortable: true
                },
                ...columns.map((column) => {
                    return column.qColumn
                })
            ]
        }

        const getRows = (tableIdx: number) => {
            const rows = stateData.data.tables.find((f) => f.tableIdx === tableIdx)?.rows || ([] as TRow[])

            return rows.map((row) => {
                const qRow = { rowIdx: row.rowIdx }
                row.cells.forEach((cell) => {
                    qRow[`col${cell.columnIdx}`] = cell.value || ''
                })
                return qRow
            })
        }

        const getLoadedFullFileName = (): string => {
            return stateData.data.fullFileName
        }

        const doLoadFile = async () => {
            emit('onChange')
            const file = await electronApi.fsDialog('Test', undefined, undefined, ['openFile'])
            const fullFileName = Array.isArray(file) && file.length > 0 ? file[0] : (file as unknown as string)

            if (!file) return
            await stateData.command.load(fullFileName)
            if (getTabs().length > 0) {
                state.componentDataSelectedTable = getTabs()[0].tableIdx
            }
        }

        return {
            getTabs,
            getColumns,
            getRows,
            doLoadFile,
            getLoadedFullFileName,
            state: state,
            statePagination: ref({
                rowsPerPage: 0
            })
        }
    }
}
</script>

<style lang="sass">
.my-sticky-virtscroll-table
  /* height or max-height is important */
  height: 410px

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th /* bg color is important for th; just specify one */
    background-color: #fff

  thead tr th
    position: sticky
    z-index: 1
  /* this will be the loading indicator */
  thead tr:last-child th
    /* height of all previous header rows */
    top: 48px
  thead tr:first-child th
    top: 0
</style>
