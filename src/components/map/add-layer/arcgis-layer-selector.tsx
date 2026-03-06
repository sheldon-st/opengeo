import { useEffect, useState } from 'react'
import { AlertCircleIcon } from 'lucide-react'
import type { ArcGisFeatureServerSourceConfig } from '@/map-engine/types/source.types'
import type {ArcGisLayerInfo, ArcGisLayerSummary, ArcGisServiceInfo} from '@/lib/arcgis-rest';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  
  
  
  fetchFeatureServerInfo,
  fetchLayerInfo,
  normalizeFeatureServerUrl
} from '@/lib/arcgis-rest'

const GEOMETRY_LABELS: Record<string, string> = {
  esriGeometryPoint: 'Point',
  esriGeometryMultipoint: 'Multipoint',
  esriGeometryPolyline: 'Line',
  esriGeometryPolygon: 'Polygon',
  esriGeometryEnvelope: 'Envelope',
}

export interface LayerSelectorPayload {
  layerId: number
  name: string
  source: ArcGisFeatureServerSourceConfig
  metadata: Record<string, unknown>
}

export interface LayerSelectorCompletePayload {
  groupName: string
  serviceUrl: string
  layers: Array<LayerSelectorPayload>
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <AlertCircleIcon className="mt-0.5 size-3 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

function extractServiceName(url: string): string {
  const match = url.match(/\/services\/([^/]+)\/FeatureServer/i)
  if (match?.[1]) return match[1]
  const parts = url.split('/').filter(Boolean)
  const fsIdx = parts.findIndex((p) => /featureserver/i.test(p))
  return (
    (fsIdx > 0 ? parts[fsIdx - 1] : parts[parts.length - 1]) ?? 'FeatureServer'
  )
}

interface ArcGisLayerSelectorProps {
  serviceUrl: string
  token?: string
  onComplete: (payload: LayerSelectorCompletePayload) => void
}

export function ArcGisLayerSelector({
  serviceUrl,
  token,
  onComplete,
}: ArcGisLayerSelectorProps) {
  const [serviceInfo, setServiceInfo] = useState<ArcGisServiceInfo | null>(null)
  const [normalizedUrl, setNormalizedUrl] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [groupName, setGroupName] = useState('')
  const [where, setWhere] = useState('1=1')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)

    fetchFeatureServerInfo(serviceUrl, token)
      .then((info) => {
        if (cancelled) return
        const feats = info.layers.filter((l) => l.type === 'Feature Layer')
        if (!feats.length)
          throw new Error('No feature layers found in this service')
        const normalized = normalizeFeatureServerUrl(serviceUrl)
        setServiceInfo({ ...info, layers: feats })
        setNormalizedUrl(normalized)
        setGroupName(extractServiceName(normalized))
        setSelectedIds(new Set(feats.map((l) => l.id)))
      })
      .catch((e) => {
        if (!cancelled)
          setLoadError(
            e instanceof Error ? e.message : 'Failed to load service',
          )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [serviceUrl, token])

  const featureLayers: Array<ArcGisLayerSummary> = serviceInfo?.layers ?? []
  const allSelected =
    featureLayers.length > 0 &&
    featureLayers.every((l) => selectedIds.has(l.id))

  const toggleLayer = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelectedIds(
      allSelected ? new Set() : new Set(featureLayers.map((l) => l.id)),
    )
  }

  const handleAdd = async () => {
    if (!selectedIds.size) return
    setAdding(true)
    setAddError(null)
    try {
      const toAdd = featureLayers.filter((l) => selectedIds.has(l.id))
      const infos: Array<ArcGisLayerInfo> = await Promise.all(
        toAdd.map((l) => fetchLayerInfo(normalizedUrl, l.id, token)),
      )
      onComplete({
        groupName: groupName.trim() || extractServiceName(normalizedUrl),
        serviceUrl: normalizedUrl,
        layers: infos.map((info, i) => ({
          layerId: toAdd[i].id,
          name: info.name,
          source: {
            url: `${normalizedUrl}/${toAdd[i].id}`,
            where: where.trim() || '1=1',
            outFields: ['*'],
            token: token || undefined,
          },
          metadata: {
            arcgisFields: info.fields,
            arcgisGeometryType: info.geometryType,
            arcgisDrawingInfo: info.drawingInfo ?? null,
            arcgisTypeIdField: info.typeIdField ?? null,
            arcgisTypes: info.types ?? null,
            arcgisServiceUrl: normalizedUrl,
            arcgisLayerId: toAdd[i].id,
            arcgisMaxRecordCount: info.maxRecordCount,
          },
        })),
      })
    } catch (e) {
      setAddError(e instanceof Error ? e.message : 'Failed to fetch layer info')
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="mr-2" />
        <span className="text-xs text-muted-foreground">Loading service…</span>
      </div>
    )
  }

  if (loadError) {
    return <ErrorBanner message={loadError} />
  }

  return (
    <div className="grid gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted-foreground">
          {featureLayers.length} layer{featureLayers.length !== 1 ? 's' : ''}{' '}
          available
        </span>
        <button
          type="button"
          onClick={toggleAll}
          className="shrink-0 text-[10px] text-primary hover:underline"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>

      {/* Layer list */}
      <ScrollArea className="max-h-52 rounded-md border border-input">
        <div className="grid gap-px bg-border p-px">
          {featureLayers.map((layer) => (
            <label
              key={layer.id}
              className={cn(
                'flex cursor-pointer items-center gap-2.5 rounded bg-background px-3 py-2 text-xs transition-colors hover:bg-muted/60',
              )}
            >
              <Checkbox
                checked={selectedIds.has(layer.id)}
                onCheckedChange={() => toggleLayer(layer.id)}
              />
              <span className="min-w-0 flex-1 truncate font-medium">
                {layer.name}
              </span>
              <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
                {layer.geometryType && (
                  <Badge variant="outline">
                    {GEOMETRY_LABELS[layer.geometryType] ?? layer.geometryType}
                  </Badge>
                )}
                <span className="text-[10px]">#{layer.id}</span>
              </div>
            </label>
          ))}
        </div>
      </ScrollArea>

      <Separator />

      {/* Group name */}
      <div className="grid gap-1">
        <label className="text-[11px] font-medium text-muted-foreground">
          Group Name
        </label>
        <Input
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </div>

      {/* Global where clause */}
      <div className="grid gap-1">
        <label className="text-[11px] font-medium text-muted-foreground">
          Where Clause (applied to all)
        </label>
        <Input
          value={where}
          onChange={(e) => setWhere(e.target.value)}
          placeholder="1=1"
          className="font-mono text-xs"
        />
      </div>

      {addError && <ErrorBanner message={addError} />}

      <Button
        onClick={handleAdd}
        disabled={selectedIds.size === 0 || adding}
        className="w-full"
      >
        {adding && <Spinner className="mr-2" />}
        Add {selectedIds.size > 0 ? selectedIds.size : ''} Layer
        {selectedIds.size !== 1 ? 's' : ''}
      </Button>
    </div>
  )
}
