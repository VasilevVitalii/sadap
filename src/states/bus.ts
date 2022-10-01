import { on } from 'events'
import { EventBus } from 'quasar'

const bus = new EventBus()

const windowSize = {
    emit(width: number, height: number) {
        bus.emit('windowSize', width, height)
    },
    on(subscriber: (width: number, height: number) => void) {
        bus.on('windowSize', (width, height) => {
            subscriber(width, height)
        })
    }
}

export default { windowSize }
