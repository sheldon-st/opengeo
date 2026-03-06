import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircleIcon } from 'lucide-react'
import type { GroupLayer } from '@/map-engine/types/layer.types'
import type { DataSource, DirectoryService } from '@/lib/data-sources'
import type {LayerSelectorCompletePayload} from '@/components/map/add-layer/arcgis-layer-selector';
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
import { Spinner } from '@/components/ui/spinner'
import { useMapEngine } from '@/map-engine'
import {
  ArcGisLayerSelector
  
} from '@/components/map/add-layer/arcgis-layer-selector'

interface AddServiceDialogProps {
  source: DataSource
  service: DirectoryService
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddServiceDialog({
  source,
  service,
  open,
  onOpenChange,
}: AddServiceDialogProps) {
  if (service.serviceType === 'FeatureServer') {
    return (
      <FeatureServerDialog
        source={source}
        service={service}
        open={open}
        onOpenChange={onOpenChange}
      />
    )
  }

  if (service.serviceType === 'MapServer') {
    return (
      <MapServerDialog
        source={source}
        service={service}
        open={open}
        onOpenChange={onOpenChange}
      />
    )
  }

  return null
}

function FeatureServerDialog({
  source,
  service,
  open,
  onOpenChange,
}: AddServiceDialogProps) {
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
      metadata: { arcgisServiceUrl: payload.serviceUrl },
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
          <DialogDescription>{service.name}</DialogDescription>
        </DialogHeader>
        <ArcGisLayerSelector
          serviceUrl={service.url}
          token={source.type === 'arcgis' ? source.token : undefined}
          onComplete={handleComplete}
        />
      </DialogContent>
    </Dialog>
  )
}

function MapServerDialog({
  source,
  service,
  open,
  onOpenChange,
}: AddServiceDialogProps) {
  const engine = useMapEngine()
  const navigate = useNavigate()
  const [name, setName] = useState(service.name)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = () => {
    setAdding(true)
    setError(null)
    try {
      engine.addLayer({
        name: name.trim() || service.name,
        kind: 'arcgis-mapserver',
        visible: true,
        opacity: 1,
        zIndex: 0,
        parentId: null,
        metadata: {},
        source: {
          url: service.url,
          token: source.type === 'arcgis' ? source.token : undefined,
        },
      } as Parameters<typeof engine.addLayer>[0])
      onOpenChange(false)
      navigate({ to: '/map' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add layer')
      setAdding(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Map Service</DialogTitle>
          <DialogDescription>{service.url}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Layer Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          </div>
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertCircleIcon className="mt-0.5 size-3 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={adding}>
            {adding && <Spinner className="mr-2" />}
            Add to Map
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
