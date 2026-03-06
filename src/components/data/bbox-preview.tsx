import { useEffect, useRef } from 'react'
import OlMap from 'ol/Map'
import OlView from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import OSM from 'ol/source/OSM'
import OlFeature from 'ol/Feature'
import { fromExtent } from 'ol/geom/Polygon'
import { fromLonLat, transformExtent  } from 'ol/proj'
import { Fill, Stroke, Style } from 'ol/style'
import { cn } from '@/lib/utils'

interface BboxPreviewProps {
  bbox: [number, number, number, number]
  className?: string
}

const bboxStyle = new Style({
  stroke: new Stroke({ color: 'rgba(59, 130, 246, 0.8)', width: 2 }),
  fill: new Fill({ color: 'rgba(59, 130, 246, 0.1)' }),
})

export function BboxPreview({ bbox, className }: BboxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<OlMap | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const extent3857 = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857')

    const bboxFeature = new OlFeature({ geometry: fromExtent(extent3857) })
    bboxFeature.setStyle(bboxStyle)

    const vectorSource = new VectorSource({ features: [bboxFeature] })

    const map = new OlMap({
      target: containerRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: vectorSource }),
      ],
      view: new OlView({
        center: fromLonLat([(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]),
        zoom: 2,
      }),
      controls: [],
      interactions: [],
    })

    map.getView().fit(extent3857, { padding: [20, 20, 20, 20] })
    mapRef.current = map

    return () => {
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [bbox])

  return (
    <div
      ref={containerRef}
      className={cn('overflow-hidden rounded-md border', className)}
      style={{ height: 140 }}
    />
  )
}
