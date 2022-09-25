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
                const rawColumns = ((worksheet as any)._columns || []) as Column[]
                const rawRows = ((worksheet as any)._rows || []) as Row[]
                const tableIdx = worksheetIdx + 1

                const columns = [] as TColumn[]
                const rows = [] as TRow[]

                rawColumns.forEach((rawColumn) => {
                    const columnIdx = (rawColumn as any)?._number || -1
                    if (rawRows.some((f) => (((f as any)?._cells || []) as Cell[]).some((ff) => (ff as any)?._column?._number === columnIdx))) {
                        const name = getNameColumn(columnIdx)
                        columns.push({
                            columnIdx: columnIdx,
                            name: name,
                            qColumn: {
                                name: `col${columnIdx}`,
                                label: name,
                                align: 'left',
                                field: `col${columnIdx}`,
                                format: (val) => `${val}`,
                                columnIdx: columnIdx
                            } as QTableColumn
                        })
                    }
                })

                rawRows.forEach((rawRow, rowIdx) => {
                    const reawCells = ((rawRow as any)?._cells || []) as Cell[]
                    const cells = [] as TCell[]
                    reawCells.forEach((cell) => {
                        const columnIdx = (cell as any)?._column?._number
                        if (columns.some((f) => f.columnIdx === columnIdx)) {
                            let value = (cell as any)?._value?.model?.value
                            if (value === undefined) {
                                value = ''
                            }
                            cells.push({ columnIdx, value })
                        }
                    })
                    const emptyCells = columns
                        .filter((f) => !cells.some((ff) => ff.columnIdx === f.columnIdx))
                        .map((m) => {
                            return {
                                columnIdx: m.columnIdx,
                                value: ''
                            }
                        }) as TCell[]
                    rows.push({ rowIdx: rowIdx + 1, cells: [...cells, ...emptyCells] })
                })

                return {
                    title: `sheet${tableIdx}`,
                    tableIdx: tableIdx,
                    columns: columns,
                    rows: rows
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
