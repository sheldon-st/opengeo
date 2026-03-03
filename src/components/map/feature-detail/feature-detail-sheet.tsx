import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PickedFeature {
  properties: Record<string, unknown>
  layerName?: string
  layerId?: string
}

interface FeatureDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  features: Array<PickedFeature>
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

function isUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function PropertyValue({ value }: { value: unknown }) {
  const str = formatValue(value)
  if (isUrl(value)) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 underline break-all hover:text-blue-400"
      >
        {value}
      </a>
    )
  }
  if (typeof value === 'object' && value !== null) {
    return (
      <pre className="whitespace-pre-wrap break-all font-mono text-[10px] text-muted-foreground">
        {str}
      </pre>
    )
  }
  return <span className="break-all">{str}</span>
}

function FeatureProperties({ feature }: { feature: PickedFeature }) {
  const entries = Object.entries(feature.properties).filter(
    ([, v]) => v !== undefined,
  )

  return (
    <div className="grid gap-0">
      {entries.map(([key, value], i) => (
        <div key={key}>
          <div className="grid grid-cols-[140px_1fr] gap-3 py-2 items-start">
            <span className="text-[11px] font-medium text-muted-foreground truncate pt-px">
              {key}
            </span>
            <span className="text-[11px]">
              <PropertyValue value={value} />
            </span>
          </div>
          {i < entries.length - 1 && <Separator />}
        </div>
      ))}
      {entries.length === 0 && (
        <p className="text-[11px] text-muted-foreground py-4 text-center">
          No properties
        </p>
      )}
    </div>
  )
}

function featureLabel(feature: PickedFeature, index: number): string {
  const p = feature.properties
  for (const key of ['name', 'NAME', 'title', 'TITLE', 'label', 'LABEL']) {
    if (typeof p[key] === 'string' && p[key]) return p[key] as string
  }
  return `Feature ${index + 1}`
}

export function FeatureDetailSheet({
  open,
  onOpenChange,
  features,
}: FeatureDetailSheetProps) {
  if (features.length === 0) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] sm:w-[480px] flex flex-col gap-0 p-0">
        <SheetHeader className="px-5 py-4 border-b">
          <SheetTitle className="text-sm flex items-center gap-2">
            Feature Details
            {features.length > 1 && (
              <Badge variant="secondary">{features.length}</Badge>
            )}
          </SheetTitle>
          {features[0].layerName && (
            <p className="text-[11px] text-muted-foreground">
              {features[0].layerName}
            </p>
          )}
        </SheetHeader>

        {features.length === 1 ? (
          <ScrollArea className="flex-1">
            <div className="px-5 py-2">
              <FeatureProperties feature={features[0]} />
            </div>
          </ScrollArea>
        ) : (
          <Tabs
            defaultValue="0"
            className="flex flex-col flex-1 min-h-0"
          >
            <TabsList className="mx-5 mt-3 w-fit">
              {features.map((f, i) => (
                <TabsTrigger key={i} value={String(i)} className="text-[11px]">
                  {featureLabel(f, i)}
                </TabsTrigger>
              ))}
            </TabsList>
            {features.map((f, i) => (
              <TabsContent
                key={i}
                value={String(i)}
                className="flex-1 mt-0 min-h-0"
              >
                <ScrollArea className="h-full">
                  <div className="px-5 py-2">
                    {f.layerName && f.layerName !== features[0].layerName && (
                      <p className="text-[11px] text-muted-foreground mb-2">
                        {f.layerName}
                      </p>
                    )}
                    <FeatureProperties feature={f} />
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  )
}
