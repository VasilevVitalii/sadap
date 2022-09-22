<template>
    <div style="display: flex; justify-content: space-between">
        <q-btn unelevated color="primary" label="Load data file..." @click="doLoadFile()" style="max-height: 36px; min-width: 150px" />
        <div style="text-align: end; margin: 0px 10px 0px 0px; min-width: 330px; max-height: 36px">
            <div class="text-caption" style="text-overflow: ellipsis; overflow: hidden; max-height: 25px">
                semi-automatic data processing for Microsoft SQL Server
            </div>
            <div class="text-caption" style="text-overflow: ellipsis; overflow: hidden; max-height: 25px; margin: -5px 0px 0px 0px">
                version 0.0.1 <q-btn dense no-caps flat color="primary" size="sm" label="repository in github" @click="doOpenGitHub(event)" />
            </div>
        </div>
    </div>
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
                        height: 'calc(' + state.pageIndexSplitterHorizontal1 + 'px - 140px)'
                    }"
                >
                    <template v-slot:body="props">
                        <q-tr :props="props">
                            <q-td v-for="col in props.cols" :key="col.name" :props="props" :class="getCellClass(col.columnIdx, props.row.rowIdx)">
                                {{ col.value }}
                            </q-td>
                        </q-tr>
                    </template>
                </q-table>
            </q-tab-panel>
        </q-tab-panels>
    </div>
</template>

<script lang="ts">
import stateData, { TColumn, TRow } from '../states/stateData'
import stateCommand from '../states/stateCommand'
import stateScript from '../states/stateScript'

import state from '../states/state'
import { QTableColumn } from 'quasar'
import { electronApi } from '../../src-electron/electron-api'
import { useQuasar } from 'quasar'
import { ref } from 'vue'
export default {
    emits: ['onChange'],
    setup(_, { emit }) {
        const $q = useQuasar()

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
                    sortable: true,
                    headerClasses: 'bg-secondary',
                    classes: 'bg-secondary'
                },
                ...columns.map((column) => {
                    return {
                        ...column.qColumn,
                        headerClasses: 'bg-secondary',
                        headerStyle: 'max-width: 150px; text-overflow: ellipsis; overflow: hidden',
                        style: 'max-width: 150px; text-overflow: ellipsis; overflow: hidden',
                        sortable: true
                    }
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
            try {
                const defaultPath = stateData.data.fullFileName ? electronApi.fsPathParse(stateData.data.fullFileName).dir : undefined

                const file = await electronApi.fsDialogOpen(
                    'Open data file',
                    defaultPath,
                    [
                        { name: 'XLSX', extensions: ['xlsx'] },
                        { name: 'All files', extensions: ['*'] }
                    ],
                    ['openFile']
                )
                const fullFileName = Array.isArray(file) && file.length > 0 ? file[0] : undefined
                if (!fullFileName) return

                emit('onChange')
                $q.loading.show()

                await stateData.command.load(fullFileName)

                stateCommand.data.commands = []
                stateCommand.data.fullFileName = ''
                stateScript.data.scripts = []
                state.columnIdxMouse = undefined

                if (getTabs().length > 0) {
                    state.componentDataSelectedTable = getTabs()[0].tableIdx
                }
                $q.loading.hide()
            } catch (error) {
                $q.loading.hide()
                $q.dialog({
                    title: 'Error',
                    message: `ON LOAD DATA FILE: ${error}`
                })
            }
        }

        const doOpenGitHub = () => {
            electronApi.openUrl('https://github.com/VasilevVitalii/sadap')
        }

        const getCellClass = (columnIdx: number, rowIdx: number): string | undefined => {
            if (state.columnIdxMouse === columnIdx) {
                return 'bg-primary text-white'
            }

            const command = stateCommand.data.commands.find((f) => f.tableIdx === state.componentDataSelectedTable)
            if (!command) return undefined

            if (command.stopRowIdx) {
                if (rowIdx && command.startRowIdx && (command.startRowIdx > rowIdx || rowIdx > command.stopRowIdx)) {
                    return 'bg-secondary'
                }
            } else {
                if (rowIdx && command.startRowIdx && command.startRowIdx > rowIdx) {
                    return 'bg-secondary'
                }
            }

            if (command.converters.some((f) => f.columnIdx === columnIdx && !f.allow)) {
                return 'bg-secondary'
            }

            return undefined
        }

        return {
            getTabs,
            getColumns,
            getRows,
            doLoadFile,
            doOpenGitHub,
            getLoadedFullFileName,
            getCellClass,
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
