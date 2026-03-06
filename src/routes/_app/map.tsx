import { createFileRoute } from '@tanstack/react-router'
import { MapLayout } from '@/components/map/map-layout'

export const Route = createFileRoute('/_app/map')({
  component: MapLayout,
})
