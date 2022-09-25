import { reactive } from 'vue'
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
    sqlSuffix?: string | undefined
    converters: TConverter[]
    fileState?: 'loaded' | 'saved'
    fileFullName?: string
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
    },
    getForSave(tableIdx: number | undefined): string | undefined {
        if (tableIdx === undefined) return undefined
        let command = data.commands.find((f) => f.tableIdx === tableIdx)
        if (!command) {
            this.create(tableIdx)
            this.createConverters(tableIdx)
        }
        command = data.commands.find((f) => f.tableIdx === tableIdx)
        if (!command) return undefined

        return JSON.stringify(
            {
                startRowIdx: command.startRowIdx,
                stopRowIdx: command.stopRowIdx,
                sqlTableName: command.sqlTableName,
                sqlSuffix: (command.sqlSuffix || '').split('\n'),
                converters: command.converters
            },
            null,
            '\t'
        )
    },
    load(tableIdx: number | undefined, raw: object) {
        const json = raw as any

        if (tableIdx === undefined) return
        let command = data.commands.find((f) => f.tableIdx === tableIdx)
        if (!command) {
            this.create(tableIdx)
            this.createConverters(tableIdx)
        }
        command = data.commands.find((f) => f.tableIdx === tableIdx)
        if (!command) return

        command.startRowIdx = json.startRowIdx
        command.stopRowIdx = json.stopRowIdx
        command.sqlTableName = json.sqlTableName
        command.sqlSuffix = (json.sqlSuffix || []).join('\n')
        command.converters.forEach((converter) => {
            const fnd = json.converters.find((f) => f.columnIdx === converter.columnIdx)
            if (!fnd) {
                converter.allow = false
                return
            }
            converter.allow = fnd.allow
            converter.sqlColumnName = fnd.sqlColumnName
            converter.sqlColumnType = fnd.sqlColumnType
            converter.sqlColumnLen = fnd.sqlColumnLen
            converter.sqlColumnScale = fnd.sqlColumnScale
            converter.sqlColumnPrecision = fnd.sqlColumnPrecision
        })
    }
}

const state = { data, command }

export default state
