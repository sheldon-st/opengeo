import type {
  MapEngineEventMap,
  MapEngineEventName,
} from '../types/events.types'

type Handler<T> = (payload: T) => void

export class EventBus {
  private handlers = new Map<string, Set<Handler<unknown>>>()

  on<E extends MapEngineEventName>(
    event: E,
    handler: Handler<MapEngineEventMap[E]>,
  ): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler as Handler<unknown>)
    return () => {
      this.handlers.get(event)?.delete(handler as Handler<unknown>)
    }
  }

  off<E extends MapEngineEventName>(
    event: E,
    handler: Handler<MapEngineEventMap[E]>,
  ): void {
    this.handlers.get(event)?.delete(handler as Handler<unknown>)
  }

  emit<E extends MapEngineEventName>(
    event: E,
    payload: MapEngineEventMap[E],
  ): void {
    this.handlers.get(event)?.forEach((h) => {
      try {
        h(payload)
      } catch (err) {
        console.error(`Error in event handler for "${event}":`, err)
      }
    })
  }

  removeAllListeners(): void {
    this.handlers.clear()
  }
}
