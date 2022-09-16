import { reactive } from 'vue'
import { electronApi } from '../../src-electron/electron-api'
import stateData, { TTable } from './stateData'
import stateCommand from './stateCommand'
import { Types } from 'mssqlcoop'

export type TScript = {
    tableIdx: number
    script: string
}

const data = reactive({
    scripts: [] as TScript[]
})

const command = {
    getErrors(tableIdx: number): string[] {
        const command = stateCommand.data.commands.find((f) => f.tableIdx === tableIdx)
        if (!command) {
            return ['command is empty']
        }
        const table = stateData.data.tables.find((f) => f.tableIdx === tableIdx)
        if (!table) {
            return ['data is empty']
        }

        const errors = [] as string[]
        if (!command.sqlTableName) {
            errors.push('empty sql table name')
        } else if (command.sqlTableName.length <= 1) {
            errors.push('sql table name too short')
        } else if (!['#', '@'].some((f) => f === (command.sqlTableName || ' ').substring(0, 1))) {
            errors.push('sql table name should start from "#" or "@"')
        }

        let startRowIdxOk = true
        if (!intFromMin(command.startRowIdx, 1)) {
            errors.push('first row should be positive integer value from 1')
            startRowIdxOk = false
        }

        if (command.stopRowIdx !== undefined && command.stopRowIdx.toString() !== '') {
            if (!intFromMin(command.stopRowIdx, 1)) {
                errors.push('last row should be empty OR positive integer value from 1')
            } else if (startRowIdxOk && Number(command.startRowIdx) > Number(command.stopRowIdx)) {
                errors.push('last row should be less or equal that fist row')
            }
        }

        if (!command.converters.some((f) => f.allow)) {
            errors.push('mapping field list is empty')
        }

        command.converters.forEach((converter) => {
            const column = table.columns.find((f) => f.columnIdx === converter.columnIdx)
            if (!column) {
                errors.push(`in data not find column #${converter.columnIdx}`)
                return
            }
            const prefix = `mapping field ${column.qColumn.label}: `
            if (!converter.sqlColumnName) {
                errors.push(`${prefix}sql name is empty`)
            }
            if (!converter.sqlColumnType) {
                errors.push(`${prefix}type is empty`)
            }
            const type = Types.find((f) => f.name === converter.sqlColumnType)
            if (!type) {
                errors.push(`${prefix}type is unknown`)
                return
            }
            if (type.declare.kind === 'dim1' && converter.sqlColumnLen !== 'max') {
                if (!intFromMin(converter.sqlColumnLen, 1)) {
                    errors.push(`${prefix}length should be positive integer value from 1 or "max"`)
                }
            }
            if (type.declare.kind === 'dim2') {
                if (!intFromMin(converter.sqlColumnScale, 1)) {
                    errors.push(`${prefix}scale should be positive integer value from 1`)
                }
                if (!intFromMin(converter.sqlColumnPrecision, 0)) {
                    errors.push(`${prefix}precision should be positive integer value from 0`)
                }
            }
        })

        return errors
    },
    getTemplateDeclareTable(tableIdx: number): string[] {
        const command = stateCommand.data.commands.find((f) => f.tableIdx === tableIdx)
        if (!command?.sqlTableName || command.sqlTableName.length <= 1) return []
        if (command.sqlTableName.substring(0, 1) === '#') {
            return [`DROP TABLE IF EXISTS ${command.sqlTableName}`, `CREATE TABLE ${command.sqlTableName} (`, '    ${DECLARE_FIELD}', ')']
        } else if (command.sqlTableName.substring(0, 1) === '@') {
            return [`DECLARE ${command.sqlTableName} TABLE (`, '    ${DECLARE_FIELD}', ')']
        }
        return []
    },
    getTemplateInsertTable(tableIdx: number): string[] {
        const command = stateCommand.data.commands.find((f) => f.tableIdx === tableIdx)
        if (!command?.sqlTableName || command.sqlTableName.length <= 1) return []

        return [`INSER INTO ${command.sqlTableName} (`, '   ${FIELDS}', ')']
    },
    getScript(tableIdx: number): string {
        const table = stateData.data.tables.find((f) => f.tableIdx === tableIdx)
        if (!table) return '--not find sheet'
        const command = stateCommand.data.commands.find((f) => f.tableIdx === tableIdx)
        if (!command) return '--not find mapping fields for this sheet'

        const converters = command.converters.filter((f) => f.allow)
        if (converters.length <= 0) return '--not find mapping fields for this sheet'

        const rows = table.rows.filter((f) => f.rowIdx >= command.startRowIdx && (!command.stopRowIdx || f.rowIdx <= command.stopRowIdx))

        const error = [] as string[]
        const query = [] as string[]

        if (command.sqlTableName && command.sqlTableName.length > 0) {
            if (command.sqlTableName.substring(0, 1) === '#') {
                query.push(`DROP TABLE IF EXISTS ${command.sqlTableName}`)
                query.push(`CREATE TABLE ${command.sqlTableName} (`)
            } else if (command.sqlTableName.substring(0, 1) === '@') {
                query.push(`DECLARE ${command.sqlTableName} TABLE (`)
            }

            const declareFields = converters
                .map((m) => {
                    const type = Types.find((f) => f.name === m.sqlColumnType)
                    const dim = type
                        ? type.declare.kind === 'dim1'
                            ? `(${(m.sqlColumnLen || '').toString().toUpperCase()})`
                            : type.declare.kind === 'dim2'
                            ? `(${(m.sqlColumnScale || '').toString()},${(m.sqlColumnPrecision || '').toString()})`
                            : ''
                        : ''
                    return `\t${b(m.sqlColumnName)} ${m.sqlColumnType?.toUpperCase()}${dim}`
                })
                .join(',\n')
            query.push(declareFields)
            query.push(')')
        } else {
            error.push('--not find table name')
        }

        const selectRows = [] as string[]
        rows.forEach((row) => {
            const selectCell = [] as string[]
            const errorCell = [] as string[]
            row.cells
                .filter((f) => converters.some((ff) => ff.columnIdx === f.columnIdx))
                .forEach((cell) => {
                    if (cell.value === undefined || cell.value === null || cell.value === '') {
                        selectCell.push('NULL')
                        return
                    }
                    const converter = converters.find((f) => f.columnIdx === cell.columnIdx)
                    if (!converter) {
                        errorCell.push(`--not find mapping field for data column ${dc(table, cell.columnIdx)}`)
                        return
                    }
                    const type = Types.find((f) => f.name === converter?.sqlColumnType)
                    if (!type) {
                        errorCell.push(`--unknown type ${converter?.sqlColumnType || '<UNKNOWN>'}`)
                        return
                    }
                    if (type.name === 'bigint' || type.name === 'int' || type.name === 'smallint' || type.name === 'tinyint') {
                        if (Number.isInteger(cell.value)) {
                            selectCell.push(cell.value)
                        } else {
                            errorCell.push(`--in row #${row.rowIdx}, data column ${dc(table, cell.columnIdx)} value ${cell.value} is not ${type.name}`)
                        }
                    } else if (type.name === 'bit') {
                        const v = (cell.value as string).toLowerCase()
                        if (v === '0' || v === 'no' || v === 'false') {
                            selectCell.push('0')
                        } else if (v === '1' || v === 'yes' || v === 'true') {
                            selectCell.push('1')
                        } else {
                            errorCell.push(`--in row #${row.rowIdx}, data column ${dc(table, cell.columnIdx)} value ${cell.value} is not ${type.name}`)
                        }
                    } else if (
                        type.name === 'money' ||
                        type.name === 'numeric' ||
                        type.name === 'smallmoney' ||
                        type.name === 'float' ||
                        type.name === 'real'
                    ) {
                        const v = (cell.value as string).replace(/,/gi, '.')
                        if (!isNaN(Number(v))) {
                            selectCell.push(v)
                        } else {
                            errorCell.push(`--in row #${row.rowIdx}, data column ${dc(table, cell.columnIdx)} value ${cell.value} is not ${type.name}`)
                        }
                    } else if (type.name === 'varchar' || type.name === 'nvarchar' || type.name === 'sysname') {
                        selectCell.push(`'${(cell.value as string).replace(/'/gi, "''")}'`)
                    } else if (type.name === 'uniqueidentifier') {
                        const v = (cell.value as string).match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/gi)
                        if (v) {
                            selectCell.push(`'${cell.value as string}'`)
                        } else {
                            errorCell.push(`--in row #${row.rowIdx}, data column ${dc(table, cell.columnIdx)} value ${cell.value} is not ${type.name}`)
                        }
                    } else {
                        selectCell.push(`'${cell.value as string}'`)
                    }
                })
            if (errorCell.length > 0) {
                error.push(...errorCell)
            } else {
                selectRows.push(`SELECT ${selectCell.join(',')}`)
            }
        })

        if (command.sqlTableName && command.sqlTableName.length > 0) {
            if (selectRows.length > 0) {
                const insertFields = converters
                    .map((m) => {
                        return b(m.sqlColumnName)
                    })
                    .join(',')
                query.push(`INSERT INTO ${command.sqlTableName} (${insertFields})`)
                query.push(selectRows.join(' UNION ALL\n'))
            } else {
                error.push('--not find rows for generate insert')
            }
        }

        return [...error, ...query].filter((f) => f).join('\n')
    }
}

const state = { data, command }

export default state

const intFromMin = (num: any, min: number): boolean => {
    const n = Number(num)
    if (n === undefined || n === null || isNaN(n)) return false
    if (!Number.isInteger(n)) return false
    if (n < min) return false
    return true
}

const b = (text: string | undefined): string => {
    if (!text) return ''
    if (text.substring(0, 1) !== '[') text = '[' + text
    if (text.substring(text.length - 1, text.length) !== ']') text = text + ']'
    return text
}

const dc = (table: TTable, columnIdx: number): string => {
    return table.columns.find((f) => f.columnIdx === columnIdx)?.name || '<UNKNOWN>'
}
