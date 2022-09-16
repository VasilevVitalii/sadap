import { reactive } from 'vue'
import { Worksheet, Column, Row, Cell } from 'exceljs'
import { electronApi } from '../../src-electron/electron-api'
import { QTableColumn } from 'quasar'

export type TColumn = {
    columnIdx: number
    name: string
    qColumn: QTableColumn
}

type TCell = {
    columnIdx: number
    value: any
}

export type TRow = {
    rowIdx: number
    cells: TCell[]
}

export type TTable = {
    tableIdx: number
    title: string
    columns: TColumn[]
    rows: TRow[]
}

const data = reactive({
    fullFileName: '' as string,
    tables: [] as TTable[]
})

const command = {
    async load(fullFileName: string) {
        data.fullFileName = ''
        data.tables = []

        const workbook = await electronApi.fsParseXlsx(fullFileName)
        if (!workbook) return

        const worksheets = (workbook as any)._worksheets as Worksheet[]
        if (!worksheets || worksheets.length <= 0) return

        data.tables = worksheets
            .filter((f) => f)
            .map((worksheet, worksheetIdx) => {
                const columns = (worksheet as any)._columns as Column[]
                const rows = (worksheet as any)._rows as Row[]
                const tableIdx = worksheetIdx + 1

                return {
                    title: `sheet${tableIdx}`,
                    tableIdx: tableIdx,
                    columns: (columns || []).map((column, colIdx) => {
                        const columnIdx = colIdx + 1
                        const name = getNameColumn(columnIdx)
                        return {
                            columnIdx: columnIdx,
                            name: name,
                            qColumn: {
                                name: `col${columnIdx}`,
                                label: name,
                                align: 'left',
                                field: `col${columnIdx}`,
                                format: (val) => `${val}`,
                                sortable: true,
                                style: 'max-width: 150px; text-overflow: ellipsis; overflow: hidden',
                                headerStyle: 'max-width: 150px; text-overflow: ellipsis; overflow: hidden'
                            } as QTableColumn
                        }
                    }),
                    rows: (rows || []).map((row, rowIdx) => {
                        const cells = (row as any)._cells as Cell[]
                        return {
                            rowIdx: rowIdx + 1,
                            cells: cells.map((cell, colIdx) => {
                                const columnIdx = colIdx + 1
                                return {
                                    columnIdx: columnIdx,
                                    value: (cell as any)?._value?.model?.value
                                }
                            })
                        }
                    })
                }
            })
        data.fullFileName = fullFileName
    }
}

const state = { data, command }

export default state

/** idx = 1 - this A, idx = 26 - this Z */
const getNameColumn = (idx: number): string => {
    const name = [] as string[]
    while (idx > 0) {
        const rem = idx % 26
        if (rem == 0) {
            name.push('Z')
            idx = Math.floor(idx / 26) - 1
        } else {
            name.push(String.fromCharCode(rem - 1 + 'A'.charCodeAt(0)))
            idx = Math.floor(idx / 26)
        }
    }
    return name.reverse().join('')
}
