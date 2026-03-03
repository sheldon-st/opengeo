import { useState } from 'react'
import { AlertCircleIcon, ChevronLeftIcon } from 'lucide-react'
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
  normalizeFeatureServerUrl,
  type ArcGisField,
  type ArcGisLayerInfo,
  type ArcGisLayerSummary,
  type ArcGisServiceInfo,
} from '@/lib/arcgis-rest'
import type { ArcGisFeatureServerSourceConfig } from '@/map-engine/types/source.types'

type Step = 'connect' | 'select'

const GEOMETRY_LABELS: Record<string, string> = {
  esriGeometryPoint: 'Point',
  esriGeometryMultipoint: 'Multipoint',
  esriGeometryPolyline: 'Line',
  esriGeometryPolygon: 'Polygon',
  esriGeometryEnvelope: 'Envelope',
}

export const FIELD_TYPE_SHORT: Record<string, string> = {
  esriFieldTypeOID: 'OID',
  esriFieldTypeString: 'String',
  esriFieldTypeInteger: 'Int',
  esriFieldTypeSmallInteger: 'SmallInt',
  esriFieldTypeDouble: 'Double',
  esriFieldTypeSingle: 'Float',
  esriFieldTypeDate: 'Date',
  esriFieldTypeBlob: 'Blob',
  esriFieldTypeGUID: 'GUID',
  esriFieldTypeGlobalID: 'GlobalID',
  esriFieldTypeGeometry: 'Geometry',
}

export function isConfigurableField(field: ArcGisField): boolean {
  return field.type !== 'esriFieldTypeGeometry' && field.type !== 'esriFieldTypeBlob'
}

function extractServiceName(url: string): string {
  const match = url.match(/\/services\/([^/]+)\/FeatureServer/i)
  if (match?.[1]) return match[1]
  const parts = url.split('/').filter(Boolean)
  const fsIdx = parts.findIndex((p) => /featureserver/i.test(p))
  return (fsIdx > 0 ? parts[fsIdx - 1] : parts[parts.length - 1]) ?? 'FeatureServer'
}

export interface WizardLayerPayload {
  layerId: number
  name: string
  source: ArcGisFeatureServerSourceConfig
  metadata: Record<string, unknown>
}

export interface WizardCompletePayload {
  groupName: string
  serviceUrl: string
  layers: WizardLayerPayload[]
}

interface ArcGisFeatureServerWizardProps {
  onComplete: (payload: WizardCompletePayload) => void
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <AlertCircleIcon className="mt-0.5 size-3 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function ArcGisFeatureServerWizard({
  onComplete,
}: ArcGisFeatureServerWizardProps) {
  const [step, setStep] = useState<Step>('connect')

  // connect step
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  // select step
  const [serviceInfo, setServiceInfo] = useState<ArcGisServiceInfo | null>(null)
  const [serviceUrl, setServiceUrl] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [groupName, setGroupName] = useState('')
  const [where, setWhere] = useState('1=1')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const featureLayers: ArcGisLayerSummary[] =
    serviceInfo?.layers.filter((l) => l.type === 'Feature Layer') ?? []
  const allSelected = featureLayers.length > 0 && featureLayers.every((l) => selectedIds.has(l.id))

  const toggleLayer = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(featureLayers.map((l) => l.id)))
  }

  const handleConnect = async () => {
    if (!url.trim()) return
    setConnecting(true)
    setConnectError(null)
    try {
      const info = await fetchFeatureServerInfo(url, token || undefined)
      const feats = info.layers.filter((l) => l.type === 'Feature Layer')
      if (!feats.length) throw new Error('No feature layers found in this service')
      const normalized = normalizeFeatureServerUrl(url)
      setServiceInfo({ ...info, layers: feats })
      setServiceUrl(normalized)
      setGroupName(extractServiceName(normalized))
      setSelectedIds(new Set(feats.map((l) => l.id)))
      setStep('select')
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Failed to connect to service')
    } finally {
      setConnecting(false)
    }
  }

  const handleAdd = async () => {
    if (!selectedIds.size) return
    setAdding(true)
    setAddError(null)
    try {
      const toAdd = featureLayers.filter((l) => selectedIds.has(l.id))
      const infos: ArcGisLayerInfo[] = await Promise.all(
        toAdd.map((l) => fetchLayerInfo(serviceUrl, l.id, token || undefined)),
      )
      onComplete({
        groupName: groupName.trim() || extractServiceName(serviceUrl),
        serviceUrl,
        layers: infos.map((info, i) => ({
          layerId: toAdd[i].id,
          name: info.name,
          source: {
            url: `${serviceUrl}/${toAdd[i].id}`,
            where: where.trim() || '1=1',
            outFields: ['*'],
            token: token || undefined,
          },
          metadata: {
            arcgisFields: info.fields,
            arcgisGeometryType: info.geometryType,
            arcgisDrawingInfo: info.drawingInfo ?? null,
            arcgisServiceUrl: serviceUrl,
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

  // ─── Step: connect ──────────────────────────────────────────────────────────

  if (step === 'connect') {
    return (
      <div className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">Service URL</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://services.arcgis.com/…/FeatureServer"
            onKeyDown={(e) => e.key === 'Enter' && !connecting && handleConnect()}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Token (optional)
          </label>
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Access token for secured services"
          />
        </div>
        {connectError && <ErrorBanner message={connectError} />}
        <Button onClick={handleConnect} disabled={!url.trim() || connecting} className="w-full">
          {connecting && <Spinner className="mr-2" />}
          Connect to Service
        </Button>
      </div>
    )
  }

  // ─── Step: select ────────────────────────────────────────────────────────────

  return (
    <div className="grid gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => { setStep('connect'); setAddError(null) }}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeftIcon className="size-3.5" />
        </button>
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted-foreground">
          {featureLayers.length} layer{featureLayers.length !== 1 ? 's' : ''} available
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
              <span className="min-w-0 flex-1 truncate font-medium">{layer.name}</span>
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
        <label className="text-[11px] font-medium text-muted-foreground">Group Name</label>
        <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} />
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
