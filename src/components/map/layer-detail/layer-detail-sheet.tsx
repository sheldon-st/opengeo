import { useCallback } from 'react'
import { getKindLabel } from '../layer-tree/layer-icon'
import { SourceFields } from './source-fields'
import { StyleFields } from './style-fields'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useLayer, useMapEngine } from '@/map-engine'

interface LayerDetailSheetProps {
  layerId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1">
      <label className="text-[11px] font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function DetailContent({ layerId }: { layerId: string }) {
  const engine = useMapEngine()
  const { layer } = useLayer(layerId)

  const update = useCallback(
    (patch: Record<string, unknown>) => {
      engine.updateLayer(layerId, patch)
    },
    [engine, layerId],
  )

  if (!layer) return null

  const isVector = [
    'wfs',
    'geojson',
    'arcgis-featureserver',
    'vector-tile',
  ].includes(layer.kind)

  return (
    <Tabs defaultValue="general" className="flex-1 overflow-hidden">
      <TabsList variant="line" className="w-full shrink-0">
        <TabsTrigger value="general">General</TabsTrigger>
        {layer.kind !== 'group' && (
          <TabsTrigger value="source">Source</TabsTrigger>
        )}
        {isVector && <TabsTrigger value="style">Style</TabsTrigger>}
      </TabsList>

      <ScrollArea className="flex-1">
        <TabsContent value="general" className="p-4">
          <div className="grid gap-4">
            <Field label="Name">
              <Input
                defaultValue={layer.name}
                onBlur={(e) => update({ name: e.target.value })}
              />
            </Field>

            <Field label="Type">
              <Badge variant="outline">{getKindLabel(layer.kind)}</Badge>
            </Field>

            <div className="flex items-center justify-between">
              <span className="text-xs">Visible</span>
              <Switch
                checked={layer.visible}
                onCheckedChange={(checked) => update({ visible: checked })}
                size="sm"
              />
            </div>

            <Field label={`Opacity (${Math.round(layer.opacity * 100)}%)`}>
              <Slider
                value={[layer.opacity * 100]}
                min={0}
                max={100}
                onValueChange={(val) => {
                  const v = Array.isArray(val) ? val[0] : val
                  if (v != null) update({ opacity: v / 100 })
                }}
              />
            </Field>

            <Separator />

            <Field label="Z-Index">
              <Input
                type="number"
                defaultValue={layer.zIndex}
                onBlur={(e) => update({ zIndex: Number(e.target.value) })}
              />
            </Field>

            <Field label="Min Zoom">
              <Input
                type="number"
                defaultValue={layer.minZoom ?? ''}
                placeholder="None"
                onBlur={(e) =>
                  update({
                    minZoom: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </Field>

            <Field label="Max Zoom">
              <Input
                type="number"
                defaultValue={layer.maxZoom ?? ''}
                placeholder="None"
                onBlur={(e) =>
                  update({
                    maxZoom: e.target.value
                      ? Number(e.target.value)
                      : undefined,
                  })
                }
              />
            </Field>
          </div>
        </TabsContent>

        {layer.kind !== 'group' && (
          <TabsContent value="source" className="p-4">
            <SourceFields layer={layer} onChange={update} />
          </TabsContent>
        )}

        {isVector && (
          <TabsContent value="style" className="p-4">
            <StyleFields layer={layer} onChange={update} />
          </TabsContent>
        )}
      </ScrollArea>
    </Tabs>
  )
}

export function LayerDetailSheet({
  layerId,
  open,
  onOpenChange,
}: LayerDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-0">
          <SheetTitle>Layer Properties</SheetTitle>
          <SheetDescription>
            Configure layer settings and source options.
          </SheetDescription>
        </SheetHeader>
        {layerId && <DetailContent layerId={layerId} />}
      </SheetContent>
    </Sheet>
  )
}
