import { reactive } from 'vue'
import { electronApi } from '../../src-electron/electron-api'
import stateData, { TColumn, TTable } from './stateData'

export type TConverter = {
    columnIdx: number
    allow: boolean
    sqlColumnName: string | undefined
    sqlColumnType: string | undefined
    sqlColumnLen?: number | 'max' | undefined
    sqlColumnScale?: number | undefined
    sqlColumnPrecision?: number | undefined
}

export type TCommand = {
    tableIdx: number
    startRowIdx: number
    stopRowIdx: number | undefined
    sqlTableName: string | undefined
    sqlSuffix?: string[] | undefined
    converters: TConverter[]
}

const data = reactive({
    fullFileName: '' as string,
    supportedTypeName: [
        'bigint',
        'bit',
        'decimal',
        'int',
        'money',
        'numeric',
        'smallint',
        'smallmoney',
        'tinyint',
        'float',
        'real',
        'date',
        'datetime',
        'varchar',
        'sysname',
        'nvarchar',
        'uniqueidentifier'
    ],
    commands: [] as TCommand[]
})

const command = {
    create(tableIdx: number) {
        data.commands = data.commands.filter((f) => f.tableIdx !== tableIdx)
        data.commands.push({
            tableIdx: tableIdx,
            startRowIdx: 1,
            stopRowIdx: undefined,
            sqlTableName: '#data',
            sqlSuffix: undefined,
            converters: []
        })
    },
    createConverters(tableIdx: number) {
        const command = data.commands.find((f) => f.tableIdx === tableIdx)
        if (!command) return

        command.converters = []

        const table = stateData.data.tables.find((f) => f.tableIdx === tableIdx)
        if (!table) return

        table.columns.forEach((column) => {
            const converter = this.createConverter(table, column)
            if (!converter) return
            command.converters.push(converter)
        })
    },
    createConverter(table: TTable, column: TColumn): TConverter | undefined {
        const converter: TConverter = {
            columnIdx: column.columnIdx,
            allow: true,
            sqlColumnName: column.name,
            sqlColumnType: 'nvarchar',
            sqlColumnLen: 'max'
        }

        return converter
    }
}

const state = { data, command }

export default state
