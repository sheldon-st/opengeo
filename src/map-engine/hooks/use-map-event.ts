import { useEffect } from 'react'
import { useMapEngine } from '../components/map-provider'
import type {
  MapEngineEventMap,
  MapEngineEventName,
} from '../types/events.types'

export function useMapEvent<E extends MapEngineEventName>(
  event: E,
  handler: (payload: MapEngineEventMap[E]) => void,
): void {
  const engine = useMapEngine()
  useEffect(() => {
    return engine.on(event, handler)
  }, [engine, event, handler])
}
