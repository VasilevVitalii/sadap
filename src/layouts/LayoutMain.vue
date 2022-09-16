<template>
    <q-layout view="hHh lpR fFf">
        <q-header elevated class="bg-primary text-white" style="height: 30px">
            <q-toolbar style="margin: -10px 0px 0px 0px; justify-content: space-between">
                <div class="text-subtitle1">Manual push data to Microsoft SQL Server, version 0.0.1</div>
                <q-btn style="margin: 0px 0px 1px 0px" no-caps flat dense href="https://github.com/VasilevVitalii" label="goto github repository" />
            </q-toolbar>
        </q-header>

        <q-page-container>
            <router-view />
        </q-page-container>

        <!-- <q-footer elevated class="bg-primary text-white" style="height: 25px">
            <q-toolbar style="display: flex; justify-content: flex-end">
                <text-caption style="margin: -20px 0px 0px 0px">
                    <q-btn
                        style="margin: 0px 0px 2px 0px"
                        no-caps
                        flat
                        dense
                        href="https://github.com/VasilevVitalii"
                        label="goto github repository"
                    />
                    version 0.0.1
                </text-caption>
            </q-toolbar>
        </q-footer> -->
    </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'LayoutMain'
})
</script>
