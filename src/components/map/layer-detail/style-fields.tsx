import type { LayerDefinition } from '@/map-engine'
import type { FeatureStyle } from '@/map-engine/types/style.types'
import { Input } from '@/components/ui/input'

interface StyleFieldsProps {
  layer: LayerDefinition
  onChange: (patch: Record<string, unknown>) => void
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

const VECTOR_KINDS = new Set([
  'wfs',
  'geojson',
  'arcgis-featureserver',
  'vector-tile',
])

export function StyleFields({ layer, onChange }: StyleFieldsProps) {
  if (!VECTOR_KINDS.has(layer.kind)) return null

  const style =
    layer.kind !== 'group' && 'style' in layer
      ? (layer.style as FeatureStyle | undefined)
      : undefined

  const updateStyle = (patch: Partial<FeatureStyle>) => {
    onChange({ style: { ...style, ...patch } })
  }

  return (
    <div className="grid gap-3">
      <p className="text-[11px] text-muted-foreground">
        Basic style for vector features. For advanced styling, use style rules.
      </p>

      <Field label="Fill Color">
        <div className="flex gap-2">
          <input
            type="color"
            className="h-7 w-7 shrink-0 cursor-pointer rounded border border-input"
            defaultValue={style?.fill?.color ?? '#3b82f6'}
            onChange={(e) => updateStyle({ fill: { color: e.target.value } })}
          />
          <Input
            defaultValue={style?.fill?.color ?? ''}
            placeholder="rgba(59,130,246,0.3)"
            onBlur={(e) => {
              if (e.target.value) {
                updateStyle({ fill: { color: e.target.value } })
              } else {
                updateStyle({ fill: undefined })
              }
            }}
          />
        </div>
      </Field>

      <Field label="Stroke Color">
        <div className="flex gap-2">
          <input
            type="color"
            className="h-7 w-7 shrink-0 cursor-pointer rounded border border-input"
            defaultValue={style?.stroke?.color ?? '#2563eb'}
            onChange={(e) =>
              updateStyle({
                stroke: {
                  color: e.target.value,
                  width: style?.stroke?.width ?? 1,
                },
              })
            }
          />
          <Input
            defaultValue={style?.stroke?.color ?? ''}
            placeholder="#2563eb"
            onBlur={(e) => {
              if (e.target.value) {
                updateStyle({
                  stroke: {
                    color: e.target.value,
                    width: style?.stroke?.width ?? 1,
                  },
                })
              } else {
                updateStyle({ stroke: undefined })
              }
            }}
          />
        </div>
      </Field>

      <Field label="Stroke Width">
        <Input
          type="number"
          min={0}
          step={0.5}
          defaultValue={style?.stroke?.width ?? 1}
          onBlur={(e) => {
            const width = e.target.value ? Number(e.target.value) : 1
            updateStyle({
              stroke: {
                color: style?.stroke?.color ?? '#000000',
                width,
              },
            })
          }}
        />
      </Field>
    </div>
  )
}
