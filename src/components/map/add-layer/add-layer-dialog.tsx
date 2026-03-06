import { useState, useCallback } from 'react'
import { SourceFields } from '../layer-detail/source-fields'
import {
  ArcGisFeatureServerWizard

} from './arcgis-featureserver-wizard'
import type {WizardCompletePayload} from './arcgis-featureserver-wizard';
import type { GroupLayer, LayerKind } from '@/map-engine/types/layer.types'
import { detectSourceType } from './detect-source-type'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMapEngine } from '@/map-engine'

interface AddLayerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const KIND_OPTIONS: Array<{
  group: string
  items: Array<{ value: LayerKind; label: string }>
}> = [
  {
    group: 'Raster Services',
    items: [
      { value: 'wms', label: 'WMS' },
      { value: 'wmts', label: 'WMTS' },
      { value: 'wcs', label: 'WCS' },
    ],
  },
  {
    group: 'Vector Services',
    items: [
      { value: 'wfs', label: 'WFS' },
      { value: 'geojson', label: 'GeoJSON' },
      { value: 'arcgis-featureserver', label: 'ArcGIS Feature Server' },
    ],
  },
  {
    group: 'Tile Layers',
    items: [
      { value: 'xyz-tile', label: 'XYZ Tiles' },
      { value: 'vector-tile', label: 'Vector Tiles' },
    ],
  },
  {
    group: 'Other',
    items: [
      { value: 'arcgis-mapserver', label: 'ArcGIS Map Server' },
      { value: 'group', label: 'Group' },
    ],
  },
]

function getDefaultSource(
  kind: LayerKind,
): Record<string, unknown> | undefined {
  switch (kind) {
    case 'wms':
      return {
        url: '',
        layers: '',
        format: 'image/png',
        version: '1.3.0',
        transparent: true,
      }
    case 'wfs':
      return {
        url: '',
        typeName: '',
        version: '2.0.0',
        outputFormat: 'application/json',
      }
    case 'arcgis-mapserver':
      return { url: '' }
    case 'arcgis-featureserver':
      return { url: '', where: '1=1' }
    case 'geojson':
      return { url: '' }
    case 'xyz-tile':
      return { url: '' }
    case 'vector-tile':
      return { url: '' }
    case 'wmts':
      return { url: '', layer: '', matrixSet: '', format: 'image/png' }
    case 'wcs':
      return { url: '', coverageId: '', version: '2.0.1' }
    case 'group':
      return undefined
  }
}

export function AddLayerDialog({ open, onOpenChange }: AddLayerDialogProps) {
  const engine = useMapEngine()
  const [kind, setKind] = useState<LayerKind>('xyz-tile')
  const [name, setName] = useState('')
  const [source, setSource] = useState<Record<string, unknown>>(
    getDefaultSource('xyz-tile') ?? {},
  )
  const [autoDetected, setAutoDetected] = useState<LayerKind | null>(null)

  const handleKindChange = (newKind: LayerKind | null) => {
    if (!newKind) return
    setKind(newKind)
    setAutoDetected(null)
    setSource(getDefaultSource(newKind) ?? {})
    setName('')
  }

  const handleUrlInput = useCallback(
    (url: string) => {
      const detected = detectSourceType(url)
      if (detected && detected !== kind) {
        setAutoDetected(detected)
        setKind(detected)
        const defaults = getDefaultSource(detected) ?? {}
        setSource({ ...defaults, url })
      } else {
        setSource((prev) => ({ ...prev, url }))
      }
    },
    [kind],
  )

  const handleWizardComplete = (payload: WizardCompletePayload) => {
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
    setKind('xyz-tile')
    setSource(getDefaultSource('xyz-tile') ?? {})
    setAutoDetected(null)
  }

  const handleCreate = () => {
    const layerName = name.trim() || `New ${kind} layer`

    if (kind === 'group') {
      engine.addLayer({
        name: layerName,
        kind: 'group',
        visible: true,
        opacity: 1,
        zIndex: 0,
        parentId: null,
        metadata: {},
        expanded: true,
      } as Omit<GroupLayer, 'id' | 'createdAt' | 'updatedAt' | 'sortOrder'>)
    } else {
      engine.addLayer({
        name: layerName,
        kind,
        visible: true,
        opacity: 1,
        zIndex: 0,
        parentId: null,
        metadata: {},
        source,
      } as Parameters<typeof engine.addLayer>[0])
    }

    onOpenChange(false)
    setName('')
    setKind('xyz-tile')
    setSource(getDefaultSource('xyz-tile') ?? {})
    setAutoDetected(null)
  }

  // Build a fake layer for SourceFields preview (not used for arcgis-featureserver)
  const previewLayer =
    kind !== 'group' && kind !== 'arcgis-featureserver'
      ? ({
          id: '__preview',
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
        } as Parameters<typeof engine.addLayer>[0] & {
          id: string
          sortOrder: number
          createdAt: number
          updatedAt: number
        })
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Layer</DialogTitle>
          <DialogDescription>
            Choose a layer type and configure its source.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="grid gap-4 px-0.5">
            <div className="grid gap-1">
              <label className="text-[11px] font-medium text-muted-foreground">
                Layer Type
              </label>
              <Select value={kind} onValueChange={handleKindChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((group) => (
                    <SelectGroup key={group.group}>
                      <SelectLabel>{group.group}</SelectLabel>
                      {group.items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {kind !== 'group' && kind !== 'arcgis-featureserver' && (
              <div className="grid gap-1">
                <label className="text-[11px] font-medium text-muted-foreground">
                  Source URL
                </label>
                <Input
                  value={(source.url as string) ?? ''}
                  onChange={(e) => handleUrlInput(e.target.value)}
                  placeholder="Paste a URL to auto-detect layer type…"
                />
                {autoDetected && (
                  <p className="text-[10px] text-muted-foreground">
                    Auto-detected as{' '}
                    <span className="font-semibold">
                      {KIND_OPTIONS.flatMap((g) => g.items).find(
                        (i) => i.value === autoDetected,
                      )?.label ?? autoDetected}
                    </span>
                  </p>
                )}
              </div>
            )}

            {kind === 'arcgis-featureserver' ? (
              <ArcGisFeatureServerWizard onComplete={handleWizardComplete} />
            ) : (
              <>
                <div className="grid gap-1">
                  <label className="text-[11px] font-medium text-muted-foreground">
                    Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`New ${kind} layer`}
                  />
                </div>

                {previewLayer && (
                  <>
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
                  </>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {kind !== 'arcgis-featureserver' && (
            <Button onClick={handleCreate}>Create Layer</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
