<template>
    <div v-if="getTable()">
        <q-btn-group unelevated color="primary">
            <q-btn color="primary" :label="getBuildButtonName()" @click="doBuild()" />
            <q-separator vertical />
            <q-btn color="primary" label="Load mappings..." @click="doLoadFile()" />
            <q-btn color="primary" label="Save mappings..." @click="doSaveFile()" />
        </q-btn-group>
        <div class="text-caption" style="text-overflow: ellipsis; overflow: hidden; max-height: 20px; margin: 0px 0px 0px 10px">
            {{ getProseedFullFileName() }}
        </div>

        <div v-if="getCommand()">
            <div style="display: flex; margin: 0px 0px 0px 10px">
                <q-input dense stack-label v-model="getCommand().startRowIdx" label="First row" style="width: 70px" />
                <q-input dense stack-label v-model="getCommand().stopRowIdx" label="Last row" style="width: 70px" />
                <q-input dense stack-label v-model="getCommand().sqlTableName" label="Sql table name" style="width: 300px" />
            </div>

            <q-tabs v-model="stateTab" dense align="left" active-color="primary" indicator-color="primary" narrow-indicator>
                <q-tab name="converter" label="Mapping fields" />
                <q-tab name="query" label="Query" />
            </q-tabs>

            <q-tab-panels
                v-model="stateTab"
                animated
                style="height: 100%"
                :style="{
                    height: 'calc(100vh - ' + state.pageIndexSplitterHorizontal1 + 'px - 160px)'
                }"
            >
                <q-tab-panel name="converter">
                    <div v-for="converter in getCommand().converters" :key="converter.columnIdx">
                        <ComponentCommandMapItem :tableIdx="getCommand().tableIdx" :columnIdx="converter.columnIdx" />
                        <q-separator></q-separator>
                    </div>
                </q-tab-panel>
                <q-tab-panel name="query">
                    <q-input
                        :placeholder="'your query after insert data into ' + getCommand().sqlTableName"
                        dense
                        style="min-height: 70px"
                        type="textarea"
                        spellcheck="false"
                        autogrow
                        stack-label
                        borderless
                        v-model="getCommand().sqlSuffix"
                    />
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>
</template>

<script lang="ts">
import stateData, { TTable } from '../states/stateData'
import state from '../states/state'
import stateCommand, { TCommand } from '../states/stateCommand'
import { electronApi } from '../../src-electron/electron-api'
import { ref } from 'vue'
import ComponentCommandMapItem from './ComponentCommandMapItem.vue'
import { useQuasar } from 'quasar'
export default {
    setup() {
        const $q = useQuasar()

        const getTable = (): TTable | undefined => {
            return stateData.data.tables.find((f) => f.tableIdx === state.componentDataSelectedTable)
        }
        const getCommand = (): TCommand | undefined => {
            return stateCommand.data.commands.find((f) => f.tableIdx === state.componentDataSelectedTable)
        }
        const doBuild = () => {
            $q.loading.show()
            try {
                if (state.componentDataSelectedTable === undefined) return
                stateCommand.command.create(state.componentDataSelectedTable)
                stateCommand.command.createConverters(state.componentDataSelectedTable)
                $q.loading.hide()
            } catch (error) {
                $q.loading.hide()
                const message = `ON BUILD MAPPINGS: ${(error as Error)?.message || 'UNKNOWN ERROR'} `
                $q.notify({
                    type: 'negative',
                    message: message,
                    multiLine: true,
                    timeout: 0,
                    actions: [{ label: 'close', color: 'white' }]
                })
            }
        }
        const getBuildButtonName = (): string => {
            const tableName = getTable()?.title
            return `${getCommand() ? 'Rebuild' : 'Build'} ${tableName ? ' for "' + tableName + '"' : ''}`.trim()
        }
        const doSaveFile = async () => {
            const defaultPath = stateCommand.data.fullFileName ? electronApi.fsPathParse(stateCommand.data.fullFileName).dir : undefined

            const fullFileName = await electronApi.fsDialogSave(
                'save mappings',
                defaultPath,
                [
                    { name: 'JSON', extensions: ['json'] },
                    { name: 'All files', extensions: ['*'] }
                ],
                ['showHiddenFiles', 'createDirectory', 'showOverwriteConfirmation']
            )
            if (!fullFileName) return

            const data = stateCommand.command.getForSave(getTable()?.tableIdx)
            if (!data) return

            $q.loading.show()
            try {
                await electronApi.fsWriteFile(fullFileName, data)
                const command = getCommand()
                if (command) {
                    command.fileState = 'saved'
                    command.fileFullName = fullFileName
                }
                $q.loading.hide()
            } catch (error) {
                $q.loading.hide()
                const message = `ON SAVE MAPPINGS: ${(error as Error)?.message || 'UNKNOWN ERROR'} `
                $q.notify({
                    type: 'negative',
                    message: message,
                    multiLine: true,
                    timeout: 0,
                    actions: [{ label: 'close', color: 'white' }]
                })
            }
        }
        const doLoadFile = async () => {
            try {
                const defaultPath = stateCommand.data.fullFileName ? electronApi.fsPathParse(stateCommand.data.fullFileName).dir : undefined

                const file = await electronApi.fsDialogOpen(
                    'Open mappings file',
                    defaultPath,
                    [
                        { name: 'JSON', extensions: ['json'] },
                        { name: 'All files', extensions: ['*'] }
                    ],
                    ['openFile']
                )
                const fullFileName = Array.isArray(file) && file.length > 0 ? file[0] : undefined
                if (!fullFileName) return

                $q.loading.show()
                const rawText = await electronApi.fsLoadFile(fullFileName)
                const rawJson = JSON.parse(rawText)
                stateCommand.command.load(getTable()?.tableIdx, rawJson)

                $q.loading.hide()
            } catch (error) {
                $q.loading.hide()
                const message = `ON LOAD MAPPING FILE: ${(error as Error)?.message || 'UNKNOWN ERROR'} `
                $q.notify({
                    type: 'negative',
                    message: message,
                    multiLine: true,
                    timeout: 0,
                    actions: [{ label: 'close', color: 'white' }]
                })
            }
        }
        const getProseedFullFileName = (): string | undefined => {
            const command = getCommand()
            if (!command || !command.fileFullName) return undefined
            return `${command.fileState} file: ${command.fileFullName}`
        }
        return {
            stateTab: ref('converter'),
            state,
            getTable,
            getCommand,
            doLoadFile,
            doSaveFile,
            doBuild,
            getBuildButtonName,
            getProseedFullFileName
        }
    },
    components: { ComponentCommandMapItem }
}
</script>
