import { cn } from '@/lib/utils'
import { useBaseLayer } from '@/map-engine/hooks/use-base-layer'
import type { BaseLayerPresetId } from '@/map-engine/presets/base-layers'

export function BaseLayerSelector() {
  const { activePresetId, presets, setPreset } = useBaseLayer()

  const handleClick = (id: BaseLayerPresetId) => {
    setPreset(activePresetId === id ? null : id)
  }

  return (
    <div className="px-2 py-1.5 space-y-1">
      <span className="text-xs font-medium text-muted-foreground">
        Base layer
      </span>
      <div className="flex flex-wrap gap-1">
        {presets.map((preset) => {
          const active = activePresetId === preset.id
          return (
            <button
              key={preset.id}
              onClick={() => handleClick(preset.id)}
              title={preset.label}
              className={cn(
                'flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors',
                'border hover:bg-accent',
                active
                  ? 'border-primary bg-accent font-medium'
                  : 'border-transparent',
              )}
            >
              <span
                className="size-3 rounded-sm shrink-0 border border-black/10"
                style={{ backgroundColor: preset.color }}
              />
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
