<template>
    <div v-if="getCommand() && getTable()">
        <q-btn-group unelevated color="primary">
            <q-btn-dropdown color="primary" :label="getBuildButtonName()" style="max-height: 36px; min-width: 200px">
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
            <q-btn color="primary" label="Copy to clipboard" style="max-height: 36px; min-width: 170px" @click="doClipboard()" />
        </q-btn-group>
        <div style="display: flex">
            <q-tabs v-model="stateTab" dense align="left" active-color="primary" indicator-color="primary" narrow-indicator>
                <q-tab name="script" label="Script" />
                <q-tab name="error" label="Errors" />
            </q-tabs>
        </div>
        <q-tab-panels
            v-model="stateTab"
            animated
            :style="{
                height: 'calc(100vh - ' + state.pageIndexSplitterHorizontal1 + 'px - 110px)'
            }"
        >
            <q-tab-panel name="script" style="padding: 16px 10px 0px 10px; overflow: hidden">
                <textarea
                    v-if="getScript()"
                    v-model="getScript().script"
                    spellcheck="false"
                    readonly
                    style="width: 100%; height: 100%; resize: none; border: none; outline: none; white-space: pre"
                />
            </q-tab-panel>
            <q-tab-panel name="error" style="padding: 16px 10px 0px 10px; overflow: hidden">
                <textarea :value="getErrors()" spellcheck="false" readonly style="width: 100%; resize: none; border: none; outline: none; white-space: pre" />
            </q-tab-panel>
        </q-tab-panels>
    </div>
</template>

<script lang="ts">
import stateData, { TTable } from '../states/stateData'
import state from '../states/state'
import stateScript, { TScript } from '../states/stateScript'
import stateCommand, { TCommand } from '../states/stateCommand'
import { useQuasar, copyToClipboard } from 'quasar'
import { electronApi } from '../../src-electron/electron-api'
import { ref } from 'vue'
export default {
    setup() {
        const $q = useQuasar()

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

        const doBuild = async (target: 'app' | 'file') => {
                if (getErrors()) {
                    stateTab.value = 'error'
                    return
                }
                const tableIdx = getTable()?.tableIdx
                if (!tableIdx) return

                try {
                    let fullFileName = undefined as string | undefined
                    if (target === 'file') {
                        const defaultPath = getScript()?.fullFileName ? electronApi.fsPathParse(getScript()?.fullFileName || '').dir : undefined

                        fullFileName = await electronApi.fsDialogSave(
                            'Save script',
                            defaultPath,
                            [
                                { name: 'SQL', extensions: ['sql'] },
                                { name: 'All files', extensions: ['*'] }
                            ],
                            ['showHiddenFiles', 'createDirectory', 'showOverwriteConfirmation']
                        )
                        if (!fullFileName) return
                    }

                    $q.loading.show()

                    stateScript.data.scripts = stateScript.data.scripts.filter((f) => f.tableIdx !== tableIdx)
                    const script = stateScript.command.getScript(tableIdx)

                    if (target === 'file' && fullFileName) {
                        await electronApi.fsWriteFile(fullFileName, script)
                        stateScript.data.scripts.push({ tableIdx, script: `saved to\n${fullFileName}`, fullFileName: fullFileName })
                    } else if (target === 'app') {
                        stateScript.data.scripts.push({ tableIdx, script })
                    }
                    stateTab.value = 'script'
                    $q.loading.hide()
                } catch (error) {
                    $q.loading.hide()
                    const message = `ON GENERATE SCRIPT: ${(error as Error)?.message || 'UNKNOWN ERROR'} `
                    $q.notify({
                        type: 'negative',
                        message: message,
                        multiLine: true,
                        timeout: 0,
                        actions: [{ label: 'close', color: 'white' }]
                    })
                }
            },
            doClipboard = () => {
                const s = getScript()
                if (!s || !s.script) return
                copyToClipboard(s.script)
                    .then(() => {
                        $q.notify({
                            message: 'copied to clipboard'
                        })
                    })
                    .catch((error) => {
                        const message = `ON COPY TO CLIPBOARD: ${(error as Error)?.message || 'UNKNOWN ERROR'} `
                        $q.notify({
                            type: 'negative',
                            message: message,
                            multiLine: true,
                            timeout: 0,
                            actions: [{ label: 'close', color: 'white' }]
                        })
                    })
            }

        return {
            state,
            stateTab,
            getTable,
            getCommand,
            getBuildButtonName,
            getErrors,
            getScript,
            doBuild,
            doClipboard
        }
    }
}
</script>
