import { createFileRoute } from '@tanstack/react-router'
import { MapProvider } from '@/map-engine'
import { MapLayout } from '@/components/map/map-layout'

export const Route = createFileRoute('/')({ component: App })

function App() {
  return (
    <MapProvider
      config={{
        initialView: {
          center: [-98.5795, 39.8283],
          zoom: 4,
          rotation: 0,
          projection: 'EPSG:3857',
        },
        maxZoom: 20,
        minZoom: 2,
      }}
    >
      <MapLayout />
    </MapProvider>
  )
}
