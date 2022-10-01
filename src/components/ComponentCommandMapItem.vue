<template>
    <div
        style="display: flex; max-height: 42px"
        v-if="getColumn() && getConverter()"
        :class="getFocusClass()"
        @mouseenter="onColumnFocus(columnIdx)"
        @mouseleave="onColumnFocus(undefined)"
    >
        <div
            class="text-caption"
            style="text-overflow: ellipsis; overflow: hidden; max-height: 20px; width: 25px; text-align: right; margin: 11px 0px -0px -10px"
        >
            {{ getConverter().columnIdx }}
        </div>

        <q-input
            dense
            stack-label
            readonly
            borderless
            :model-value="getColumn().name"
            label="Data name"
            style="width: 110px"
            :input-class="getFocusClass()"
            :label-color="getFocusColor()"
        >
            <template v-slot:prepend>
                <q-checkbox v-model="getConverter().allow" />
            </template>
        </q-input>

        <div style="display: flex" v-show="getConverter().allow">
            <q-input
                dense
                borderless
                stack-label
                v-model="getConverter().sqlColumnName"
                label="Sql name"
                style="width: 190px"
                :input-class="getFocusClass()"
                :label-color="getFocusColor()"
            />
            <q-select
                dense
                hide-dropdown-icon
                borderless
                v-model="getConverter().sqlColumnType"
                use-input
                fill-input
                hide-selected
                stack-label
                input-debounce="0"
                label="Type"
                :options="supportedTypes"
                @filter="doSupportedTypedFilter"
                style="width: 150px"
                behavior="menu"
                :input-class="getFocusClass()"
                :label-color="getFocusColor()"
                @popup-show="onTypePopup('show')"
                @popup-hide="onTypePopup('hide')"
            >
                <template v-slot:no-option>
                    <q-item>
                        <q-item-section class="text-grey"> No results </q-item-section>
                    </q-item>
                </template>
            </q-select>

            <q-input
                dense
                borderless
                stack-label
                v-model="getConverter().sqlColumnLen"
                label="Length"
                v-show="getAllowShowLen(getConverter().sqlColumnType)"
                style="width: 40px"
                :input-class="getFocusClass()"
                :label-color="getFocusColor()"
            />
            <q-input
                dense
                borderless
                stack-label
                v-model="getConverter().sqlColumnScale"
                label="Scale"
                v-show="getAllowShowScalePrecision(getConverter().sqlColumnType)"
                style="width: 60px"
                :input-class="getFocusClass()"
                :label-color="getFocusColor()"
            />
            <q-input
                dense
                borderless
                stack-label
                v-model="getConverter().sqlColumnPrecision"
                label="Precision"
                v-show="getAllowShowScalePrecision(getConverter().sqlColumnType)"
                style="width: 60px"
                :input-class="getFocusClass()"
                :label-color="getFocusColor()"
            />
        </div>
    </div>
</template>

<script lang="ts">
import stateData, { TColumn, TTable } from '../states/stateData'
import stateCommand, { TCommand, TConverter } from '../states/stateCommand'
import state from '../states/state'
import { Types } from 'mssqlcoop'
import { ref } from 'vue'
import bus from '../states/bus'
export default {
    props: {
        tableIdx: Number,
        columnIdx: Number
    },

    setup(props) {
        const supportedTypes = ref(stateCommand.data.supportedTypeName)

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
        const doSupportedTypedFilter = (filter: string, update) => {
            if (filter === '') {
                update(() => {
                    supportedTypes.value = stateCommand.data.supportedTypeName
                })
                return
            }

            update(() => {
                const needle = filter.toLowerCase()
                supportedTypes.value = stateCommand.data.supportedTypeName.filter((v) => v.toLowerCase().indexOf(needle) === 0)
            })
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

        const getFocusColor = (): string | undefined => {
            if (props.columnIdx === state.columnIdxFocus) {
                return 'white'
            }
            return undefined
        }

        const getFocusClass = (): string | undefined => {
            if (props.columnIdx === state.columnIdxFocus) {
                return 'bg-primary text-white'
            }
            return undefined
        }

        let allowFocus = true
        const onTypePopup = (action: 'show' | 'hide') => {
            allowFocus = action === 'hide'
        }

        const onColumnFocus = (columnIdx: number | undefined) => {
            if (allowFocus) {
                bus.onColumnFocus.emit(columnIdx)
            }
        }

        return {
            getConverter,
            getColumn,
            supportedTypes,
            doSupportedTypedFilter,
            getAllowShowLen,
            getAllowShowScalePrecision,
            getFocusClass,
            getFocusColor,
            onColumnFocus,
            onTypePopup
        }
    }
}
</script>
