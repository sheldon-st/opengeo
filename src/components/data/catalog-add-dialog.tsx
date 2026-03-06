import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { GroupLayer } from '@/map-engine/types/layer.types'
import type {LayerSelectorCompletePayload} from '@/components/map/add-layer/arcgis-layer-selector';
import type {CatalogService} from '@/lib/catalog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMapEngine } from '@/map-engine'
import { SourceFields } from '@/components/map/layer-detail/source-fields'
import {
  ArcGisLayerSelector
  
} from '@/components/map/add-layer/arcgis-layer-selector'
import {
  
  catalogServiceToSourceConfig,
  catalogTypeToLayerKind,
  getServiceTypeInfo
} from '@/lib/catalog'

interface CatalogAddDialogProps {
  service: CatalogService
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CatalogAddDialog({
  service,
  open,
  onOpenChange,
}: CatalogAddDialogProps) {
  if (service.serviceType === 'arcgis-featureserver') {
    return (
      <FeatureServerFlow
        service={service}
        open={open}
        onOpenChange={onOpenChange}
      />
    )
  }

  return (
    <GenericAddFlow service={service} open={open} onOpenChange={onOpenChange} />
  )
}

// ─── ArcGIS FeatureServer: full layer selector wizard ────────────────────────

function FeatureServerFlow({
  service,
  open,
  onOpenChange,
}: CatalogAddDialogProps) {
  const engine = useMapEngine()
  const navigate = useNavigate()

  const handleComplete = (payload: LayerSelectorCompletePayload) => {
    const groupId = engine.addLayer({
      name: payload.groupName,
      kind: 'group',
      visible: true,
      opacity: 1,
      zIndex: 0,
      parentId: null,
      metadata: {
        arcgisServiceUrl: payload.serviceUrl,
        catalogId: service.id,
      },
      expanded: true,
    } as Omit<GroupLayer, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>)

    for (const layer of payload.layers) {
      engine.addLayer({
        name: layer.name,
        kind: 'arcgis-featureserver',
        visible: true,
        opacity: 1,
        zIndex: 0,
        parentId: groupId,
        metadata: layer.metadata,
        source: layer.source,
      } as Parameters<typeof engine.addLayer>[0])
    }

    onOpenChange(false)
    navigate({ to: '/map' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Feature Service</DialogTitle>
          <DialogDescription>{service.title ?? service.url}</DialogDescription>
        </DialogHeader>
        <ArcGisLayerSelector
          serviceUrl={service.url}
          onComplete={handleComplete}
        />
      </DialogContent>
    </Dialog>
  )
}

// ─── All other types: SourceFields configuration ─────────────────────────────

function GenericAddFlow({
  service,
  open,
  onOpenChange,
}: CatalogAddDialogProps) {
  const engine = useMapEngine()
  const navigate = useNavigate()
  const kind = catalogTypeToLayerKind(service.serviceType)
  const typeInfo = getServiceTypeInfo(service.serviceType)
  const [name, setName] = useState(service.title ?? '')
  const [source, setSource] = useState<Record<string, unknown>>(
    catalogServiceToSourceConfig(service),
  )

  if (!kind || kind === 'group') return null

  const previewLayer = {
    id: '__catalog_preview',
    kind,
    source,
    name: '',
    visible: true,
    opacity: 1,
    zIndex: 0,
    parentId: null,
    sortOrder: 0,
    metadata: {},
    createdAt: 0,
    updatedAt: 0,
  } as Parameters<typeof SourceFields>[0]['layer']

  const handleCreate = () => {
    engine.addLayer({
      name: name.trim() || service.title || `New ${typeInfo.label} layer`,
      kind,
      visible: true,
      opacity: 1,
      zIndex: 0,
      parentId: null,
      metadata: {
        catalogId: service.id,
        catalogServiceType: service.serviceType,
        catalogSource: service.source,
      },
      source,
    } as Parameters<typeof engine.addLayer>[0])

    onOpenChange(false)
    navigate({ to: '/map' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {typeInfo.label}</DialogTitle>
          <DialogDescription>{service.title ?? service.url}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-4 px-0.5">
            <div className="grid gap-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Layer Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={service.title ?? `New ${typeInfo.label} layer`}
              />
            </div>

            <div className="text-[11px] font-medium text-muted-foreground">
              Source Configuration
            </div>
            <SourceFields
              layer={previewLayer as never}
              onChange={(patch) => {
                if (patch.source) {
                  setSource(patch.source as Record<string, unknown>)
                }
              }}
            />
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Add to Map</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
