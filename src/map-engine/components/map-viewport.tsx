import { useEffect, useRef } from 'react'
import { useMapEngine } from './map-provider'

export function MapViewport({ className }: { className?: string }) {
  const engine = useMapEngine()
  const containerRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!containerRef.current || initializedRef.current) return
    initializedRef.current = true
    engine.initialize(containerRef.current)
  }, [engine])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
