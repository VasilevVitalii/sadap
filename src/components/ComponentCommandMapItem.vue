<template>
    <div style="display: flex" v-if="getColumn() && getConverter()">
        <div
            class="text-caption"
            style="text-overflow: ellipsis; overflow: hidden; max-height: 20px; width: 25px; text-align: right; margin: 16px 0px -0px -10px"
        >
            {{ getConverter().columnIdx }}
        </div>

        <q-input dense stack-label readonly borderless :model-value="getColumn().name" label="Data name" style="width: 110px">
            <template v-slot:prepend>
                <q-checkbox v-model="getConverter().allow" />
            </template>
        </q-input>

        <div style="display: flex" v-show="getConverter().allow">
            <q-input dense borderless stack-label v-model="getConverter().sqlColumnName" label="Sql name" style="width: 200px" />
            <q-select
                dense
                hide-dropdown-icon
                borderless
                stack-label
                v-model="getConverter().sqlColumnType"
                :options="getSupportedTypes()"
                label="Type"
                style="width: 130px"
            />
            <q-input
                dense
                borderless
                stack-label
                v-model="getConverter().sqlColumnLen"
                label="Length"
                v-show="getAllowShowLen(getConverter().sqlColumnType)"
                style="width: 40px"
            />
            <q-input
                dense
                borderless
                stack-label
                v-model="getConverter().sqlColumnScale"
                label="Scale"
                v-show="getAllowShowScalePrecision(getConverter().sqlColumnType)"
                style="width: 60px"
            />
            <q-input
                dense
                borderless
                stack-label
                v-model="getConverter().sqlColumnPrecision"
                label="Precision"
                v-show="getAllowShowScalePrecision(getConverter().sqlColumnType)"
                style="width: 60px"
            />
        </div>
    </div>
</template>

<script lang="ts">
import stateData, { TColumn, TTable } from '../states/stateData'
import stateCommand, { TCommand, TConverter } from '../states/stateCommand'
import { Types } from 'mssqlcoop'
export default {
    props: {
        tableIdx: Number,
        columnIdx: Number
    },

    setup(props) {
        const getTable = (): TTable | undefined => {
            return stateData.data.tables.find((f) => f.tableIdx === props.tableIdx)
        }
        const getCommand = (): TCommand | undefined => {
            return stateCommand.data.commands.find((f) => f.tableIdx === props.tableIdx)
        }
        const getConverter = (): TConverter | undefined => {
            return getCommand()?.converters.find((f) => f.columnIdx === props.columnIdx)
        }
        const getColumn = (): TColumn | undefined => {
            return getTable()?.columns.find((f) => f.columnIdx === props.columnIdx)
        }

        const getSupportedTypes = (): string[] => {
            return stateCommand.data.supportedTypeName
        }

        const getAllowShowLen = (sqlColumnType: string): boolean => {
            if (sqlColumnType !== 'float') {
                const t = Types.find((f) => f.name === sqlColumnType)
                if (t && t.declare.kind === 'dim1') return true
            }
            return false
        }

        const getAllowShowScalePrecision = (sqlColumnType: string): boolean => {
            const t = Types.find((f) => f.name === sqlColumnType)
            if (t && t.declare.kind === 'dim2') return true
            return false
        }

        return {
            getConverter,
            getColumn,
            getSupportedTypes,
            getAllowShowLen,
            getAllowShowScalePrecision
        }
    }
}
</script>
