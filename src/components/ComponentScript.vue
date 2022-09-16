<template>
    <div v-if="getCommand() && getTable()">
        <q-btn-group unelevated color="primary">
            <q-btn-dropdown color="primary" :label="getBuildButtonName()">
                <q-list dense class="bg-primary text-white">
                    <q-item clickable v-close-popup @click="doBuild('app')">
                        <q-item-section>
                            <q-item-label>TO APP</q-item-label>
                        </q-item-section>
                    </q-item>

                    <q-item clickable v-close-popup @click="doBuild('file')">
                        <q-item-section>
                            <q-item-label>TO FILE...</q-item-label>
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-btn-dropdown>
            <q-btn color="primary" label="Copy to clipboard" />
        </q-btn-group>
        <div style="display: flex">
            <q-tabs v-model="stateTab" dense align="left" active-color="primary" indicator-color="primary" narrow-indicator>
                <q-tab name="script" label="Script" />
                <q-tab name="error" label="Errors" />
            </q-tabs>
        </div>
        <q-tab-panels v-model="stateTab" animated>
            <q-tab-panel name="script">
                <q-input
                    v-if="getScript()"
                    dense
                    style="min-height: 70px"
                    type="textarea"
                    spellcheck="false"
                    autogrow
                    stack-label
                    borderless
                    readonly
                    v-model="getScript().script"
                />
            </q-tab-panel>
            <q-tab-panel name="error">
                <q-input
                    dense
                    style="min-height: 70px"
                    type="textarea"
                    spellcheck="false"
                    autogrow
                    stack-label
                    borderless
                    readonly
                    :model-value="getErrors()"
                />
            </q-tab-panel>
        </q-tab-panels>
    </div>
</template>

<script lang="ts">
import stateData, { TTable } from '../states/stateData'
import state from '../states/state'
import stateScript, { TScript } from '../states/stateScript'
import stateCommand, { TCommand, TConverter } from '../states/stateCommand'
import { electronApi } from '../../src-electron/electron-api'
import { Types } from 'mssqlcoop'
import { ref } from 'vue'
export default {
    setup() {
        const stateTab = ref('error')

        const getTable = (): TTable | undefined => {
            return stateData.data.tables.find((f) => f.tableIdx === state.componentDataSelectedTable)
        }
        const getCommand = (): TCommand | undefined => {
            return stateCommand.data.commands.find((f) => f.tableIdx === state.componentDataSelectedTable)
        }
        const getScript = (): TScript | undefined => {
            return stateScript.data.scripts.find((f) => f.tableIdx === state.componentDataSelectedTable)
        }

        const getBuildButtonName = (): string => {
            const tableName = getTable()?.title
            return `${getScript() ? 'Rebuild' : 'Build'} ${tableName ? ' for "' + tableName + '"' : ''}`.trim()
        }

        const getErrors = (): string => {
            const tableIdx = getTable()?.tableIdx
            if (!tableIdx) return ''
            return stateScript.command.getErrors(tableIdx).join('\n').trim()
        }

        const doBuild = (target: 'app' | 'file') => {
            if (getErrors()) {
                stateTab.value = 'error'
                return
            }
            const tableIdx = getTable()?.tableIdx
            if (!tableIdx) return

            stateScript.data.scripts = stateScript.data.scripts.filter((f) => f.tableIdx !== tableIdx)
            const script = stateScript.command.getScript(tableIdx)

            if (target === 'app') {
                stateScript.data.scripts.push({ tableIdx, script })
                stateTab.value = 'script'
            }
        }

        return {
            stateTab,
            getTable,
            getCommand,
            getBuildButtonName,
            getErrors,
            getScript,
            doBuild
        }
    }
}
</script>
