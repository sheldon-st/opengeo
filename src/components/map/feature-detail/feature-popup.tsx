import { useCallback, useState } from 'react'
import { ChevronRight, Layers, X } from 'lucide-react'
import { FeatureDetailSheet } from './feature-detail-sheet'
import type { MapEngineEventMap } from '@/map-engine/types/events.types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useMapEvent } from '@/map-engine'

type PickedPayload = MapEngineEventMap['feature:picked']
type PickedFeature = PickedPayload['features'][number]

const PREVIEW_PROPS = 5

function featureDisplayName(
  properties: Record<string, unknown>,
): string | null {
  for (const key of [
    'name',
    'NAME',
    'title',
    'TITLE',
    'label',
    'LABEL',
    'Name',
  ]) {
    if (typeof properties[key] === 'string' && properties[key]) {
      return properties[key]
    }
  }
  return null
}

function formatPreviewValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return '{…}'
  const str = String(value)
  return str.length > 40 ? str.slice(0, 40) + '…' : str
}

interface FeaturePopupProps {
  className?: string
}

export function FeaturePopup({ className }: FeaturePopupProps) {
  const [data, setData] = useState<{
    features: Array<PickedFeature>
    pixel: [number, number]
  } | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handlePicked = useCallback((payload: PickedPayload) => {
    if (payload.features.length > 0) {
      setData({ features: payload.features, pixel: payload.pixel })
      setSheetOpen(false)
    } else {
      setData(null)
      setSheetOpen(false)
    }
  }, [])

  useMapEvent('feature:picked', handlePicked)

  if (!data || data.features.length === 0) return null

  const primary = data.features[0]
  const displayName = featureDisplayName(primary.properties)
  const previewEntries = Object.entries(primary.properties)
    .filter(([key]) => {
      if (!displayName) return true
      // skip the key we already show as the title
      for (const k of [
        'name',
        'NAME',
        'title',
        'TITLE',
        'label',
        'LABEL',
        'Name',
      ]) {
        if (key === k && primary.properties[k] === displayName) return false
      }
      return true
    })
    .slice(0, PREVIEW_PROPS)

  const extraCount = data.features.length - 1

  // Offset popup so it doesn't cover click point
  const [px, py] = data.pixel
  const style = { left: px + 14, top: py - 8 }

  return (
    <>
      <div
        className={cn('absolute z-50 pointer-events-none', className)}
        style={style}
      >
        <div className="pointer-events-auto w-56 rounded-lg bg-card ring-1 ring-foreground/10 shadow-lg text-xs flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 px-3 py-2.5 bg-muted/40">
            <div className="min-w-0">
              {displayName ? (
                <p className="font-medium text-[11px] truncate">
                  {displayName}
                </p>
              ) : (
                <p className="font-medium text-[11px] text-muted-foreground">
                  Feature
                </p>
              )}
              {primary.layerName && (
                <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                  <Layers className="size-2.5 shrink-0" />
                  {primary.layerName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {extraCount > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  +{extraCount}
                </Badge>
              )}
              <button
                onClick={() => setData(null)}
                className="text-muted-foreground hover:text-foreground rounded p-0.5 transition-colors"
              >
                <X className="size-3" />
              </button>
            </div>
          </div>

          {/* Properties preview */}
          {previewEntries.length > 0 && (
            <>
              <Separator />
              <div className="px-3 py-2 grid gap-1.5">
                {previewEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="grid grid-cols-[80px_1fr] gap-2 items-baseline"
                  >
                    <span className="text-[10px] text-muted-foreground truncate">
                      {key}
                    </span>
                    <span className="text-[10px] truncate">
                      {formatPreviewValue(value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer */}
          <Separator />
          <div className="px-3 py-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-0 text-[10px] text-muted-foreground hover:text-foreground w-full justify-between"
              onClick={() => setSheetOpen(true)}
            >
              View all details
              <ChevronRight className="size-3" />
            </Button>
          </div>
        </div>
      </div>

      <FeatureDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        features={data.features}
      />
    </>
  )
}
