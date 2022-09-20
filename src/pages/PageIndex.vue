<template>
    <q-page>
        <q-splitter
            v-model="splitterHorizontal"
            horizontal
            style="height: calc(100vh - 10px)"
            @update:model-value="OnResizeHorizontal"
            ref="splitterHorizontalObject"
        >
            <template v-slot:before>
                <div style="margin: 10px 0px 0px 5px">
                    <ComponentData @onChange="OnResizeHorizontal(splitterHorizontal)" />
                </div>
            </template>

            <template v-slot:after>
                <div style="margin: 10px; display: flex">
                    <div style="width: 610px">
                        <ComponentCommand />
                    </div>
                    <div style="width: calc(100vw - 610px)">
                        <ComponentScript />
                    </div>
                </div>
            </template>
        </q-splitter>
    </q-page>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import state from '../states/state'
import ComponentData from 'src/components/ComponentData.vue'
import ComponentCommand from 'src/components/ComponentCommand.vue'
import ComponentScript from 'src/components/ComponentScript.vue'

export default defineComponent({
    name: 'PageIndex',
    components: { ComponentData, ComponentCommand, ComponentScript },
    setup() {
        const splitterHorizontal = ref(50)
        const splitterHorizontalObject = ref(null)

        const OnResizeHorizontal = (value: number) => {
            const height = (splitterHorizontalObject.value as any)?.$el?.clientHeight as number
            if (!height) return

            state.pageIndexSplitterHorizontal1 = Math.round((height * value) / 100)
            state.pageIndexSplitterHorizontal2 = height - state.pageIndexSplitterHorizontal1
        }

        return {
            splitterHorizontal,
            OnResizeHorizontal,
            splitterHorizontalObject
        }
    }
})
</script>
