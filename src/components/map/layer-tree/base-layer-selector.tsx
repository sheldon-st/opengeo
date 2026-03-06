import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { BaseLayerPresetId } from '@/map-engine/presets/base-layers'
import { cn } from '@/lib/utils'
import { useBaseLayer } from '@/map-engine/hooks/use-base-layer'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

export function BaseLayerSelector() {
  const { activePresetId, presets, setPreset } = useBaseLayer()
  const [open, setOpen] = useState(false)

  const activePreset = presets.find((p) => p.id === activePresetId)

  const handleClick = (id: BaseLayerPresetId) => {
    setPreset(activePresetId === id ? null : id)
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between px-2 py-1.5',
          'text-xs font-medium text-muted-foreground hover:text-foreground transition-colors',
          'cursor-pointer',
        )}
      >
        <div className="flex items-center gap-2">
          <span>Base map</span>
          {activePreset && !open && (
            <span className="text-foreground/60 font-normal">
              {activePreset.label}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'size-3.5 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-5 gap-1 px-2 pb-2">
          {presets.map((preset) => {
            const active = activePresetId === preset.id
            return (
              <button
                key={preset.id}
                onClick={() => handleClick(preset.id)}
                title={preset.label}
                className={cn(
                  'group relative flex flex-col items-center gap-1 rounded-md p-1 transition-all cursor-pointer',
                  'border hover:bg-accent/50',
                  active
                    ? 'border-primary bg-accent ring-1 ring-primary/30'
                    : 'border-transparent',
                )}
              >
                <div
                  className={cn(
                    'relative size-10 overflow-hidden rounded-sm',
                    'ring-1 ring-black/10',
                  )}
                >
                  <img
                    src={preset.preview}
                    alt={preset.label}
                    className="size-full object-cover"
                    draggable={false}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] leading-tight truncate w-full text-center',
                    active
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  {preset.label}
                </span>
              </button>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
