const subscribers = [] as { name: string; func: (data: any) => void }[]

const windowSize = {
    on(subscriber: (data: { width: number; height: number }) => void) {
        if (window && !window.onresize) {
            window.onresize = (ev: UIEvent) => {
                const screen = (ev.target as Window)?.screen
                subscribers
                    .filter((f) => f.name === 'windowSize')
                    .forEach((s) => {
                        s.func({ width: screen?.width || 0, height: screen?.height || 0 })
                    })
            }
        }
        if (!subscribers.some((f) => f.name === 'windowSize' && f.func === subscriber)) {
            subscribers.push({ name: 'windowSize', func: subscriber })
        }
    }
}

export default { windowSize }
