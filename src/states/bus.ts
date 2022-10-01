import state from './state'

const subscribers = [] as { name: string; func: (data: any) => void }[]

const onWindowSize = {
    on(subscriber: (data: { width: number; height: number }) => void) {
        if (window && !window.onresize) {
            window.onresize = (ev: UIEvent) => {
                const screen = (ev.target as Window)?.screen
                subscribers
                    .filter((f) => f.name === 'onWindowSize')
                    .forEach((s) => {
                        s.func({ width: screen?.width || 0, height: screen?.height || 0 })
                    })
            }
        }
        if (!subscribers.some((f) => f.name === 'onWindowSize' && f.func === subscriber)) {
            subscribers.push({ name: 'onWindowSize', func: subscriber })
        }
    }
}

const onColumnFocus = {
    emit(columnIdx: number | undefined) {
        state.columnIdxFocus = columnIdx
    }
}

export default { onWindowSize, onColumnFocus }
