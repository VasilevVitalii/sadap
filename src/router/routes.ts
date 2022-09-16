import { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        component: () => import('src/layouts/LayoutMain.vue'),
        children: [{ path: '', component: () => import('src/pages/PageIndex.vue') }]
    }
]

export default routes
