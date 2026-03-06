import type { LayerDefinition } from '@/map-engine'
import type {
  ArcGisFeatureServerLayer,
  GeoJsonLayer,
  LabelConfig,
  VectorRendererConfig,
  WfsLayer,
} from '@/map-engine/types/layer.types'
import type { FeatureStyle } from '@/map-engine/types/style.types'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

type VectorBaseLayer = WfsLayer | GeoJsonLayer | ArcGisFeatureServerLayer

// Layers that have vectorRenderer + labelConfig
const VECTOR_BASE_KINDS = new Set(['wfs', 'geojson', 'arcgis-featureserver'])
// Layers that have a style tab at all
const VECTOR_KINDS = new Set([...VECTOR_BASE_KINDS, 'vector-tile'])

export function StyleFields({ layer, onChange }: StyleFieldsProps) {
  if (!VECTOR_KINDS.has(layer.kind)) return null

  const isVectorBase = VECTOR_BASE_KINDS.has(layer.kind)
  const vLayer = isVectorBase ? (layer as VectorBaseLayer) : null
  const rendererKind = vLayer?.vectorRenderer?.kind ?? 'default'
  const labelConfig = vLayer?.labelConfig

  const style =
    'style' in layer ? (layer.style as FeatureStyle | undefined) : undefined

  const updateStyle = (patch: Partial<FeatureStyle>) => {
    onChange({ style: { ...style, ...patch } })
  }

  const setRendererKind = (kind: VectorRendererConfig['kind']) => {
    onChange({ vectorRenderer: { kind } })
  }

  const updateHeatmap = (patch: Record<string, unknown>) => {
    onChange({
      vectorRenderer: { ...vLayer?.vectorRenderer, kind: 'heatmap', ...patch },
    })
  }

  const updateCluster = (patch: Record<string, unknown>) => {
    onChange({
      vectorRenderer: { ...vLayer?.vectorRenderer, kind: 'cluster', ...patch },
    })
  }

  const setLabelEnabled = (enabled: boolean) => {
    onChange({ labelConfig: enabled ? { property: '' } : undefined })
  }

  const updateLabel = (patch: Partial<LabelConfig>) => {
    if (!labelConfig) return
    onChange({ labelConfig: { ...labelConfig, ...patch } })
  }

  const heatmap =
    vLayer?.vectorRenderer?.kind === 'heatmap' ? vLayer.vectorRenderer : null
  const cluster =
    vLayer?.vectorRenderer?.kind === 'cluster' ? vLayer.vectorRenderer : null

  const showStyleSection = rendererKind !== 'heatmap'

  return (
    <div className="grid gap-4">
      {/* ── Render Mode ───────────────────────────────────────────── */}
      {isVectorBase && (
        <div className="grid gap-3">
          <Field label="Render Mode">
            <Select
              value={rendererKind}
              onValueChange={(v) =>
                setRendererKind(v as VectorRendererConfig['kind'])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="heatmap">Heatmap</SelectItem>
                <SelectItem value="cluster">Cluster</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {rendererKind === 'heatmap' && (
            <>
              <Field label="Weight Property">
                <Input
                  defaultValue={heatmap?.weightProperty ?? ''}
                  placeholder="Feature property (0–1)"
                  onBlur={(e) =>
                    updateHeatmap({
                      weightProperty: e.target.value || undefined,
                    })
                  }
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Blur (px)">
                  <Input
                    type="number"
                    min={0}
                    defaultValue={heatmap?.blur ?? 15}
                    onBlur={(e) =>
                      updateHeatmap({ blur: Number(e.target.value) })
                    }
                  />
                </Field>
                <Field label="Radius (px)">
                  <Input
                    type="number"
                    min={0}
                    defaultValue={heatmap?.radius ?? 8}
                    onBlur={(e) =>
                      updateHeatmap({ radius: Number(e.target.value) })
                    }
                  />
                </Field>
              </div>
              <Field label="Gradient">
                <Input
                  defaultValue={heatmap?.gradient?.join(', ') ?? ''}
                  placeholder="blue, cyan, yellow, red"
                  onBlur={(e) => {
                    const val = e.target.value.trim()
                    updateHeatmap({
                      gradient: val
                        ? val.split(',').map((v) => v.trim())
                        : undefined,
                    })
                  }}
                />
              </Field>
            </>
          )}

          {rendererKind === 'cluster' && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Distance (px)">
                <Input
                  type="number"
                  min={0}
                  defaultValue={cluster?.distance ?? 40}
                  onBlur={(e) =>
                    updateCluster({ distance: Number(e.target.value) })
                  }
                />
              </Field>
              <Field label="Min Distance (px)">
                <Input
                  type="number"
                  min={0}
                  defaultValue={cluster?.minDistance ?? 0}
                  onBlur={(e) =>
                    updateCluster({ minDistance: Number(e.target.value) })
                  }
                />
              </Field>
            </div>
          )}
        </div>
      )}

      {/* ── Labels ────────────────────────────────────────────────── */}
      {isVectorBase && (
        <>
          <Separator />
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">Labels</span>
              <Switch
                size="sm"
                checked={!!labelConfig}
                onCheckedChange={setLabelEnabled}
              />
            </div>

            {labelConfig && (
              <>
                <Field label="Property">
                  {layer.kind === 'arcgis-featureserver' &&
                  (layer).availableLabelFields
                    ?.length ? (
                    <Select
                      value={labelConfig.property}
                      onValueChange={(v) => v && updateLabel({ property: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a field…" />
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          layer
                        ).availableLabelFields.map((f) => (
                          <SelectItem key={f.name} value={f.name}>
                            {f.alias && f.alias !== f.name ? f.alias : f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      defaultValue={labelConfig.property}
                      placeholder="Feature property key, e.g. name"
                      onBlur={(e) => updateLabel({ property: e.target.value })}
                    />
                  )}
                </Field>

                <Field label="Font">
                  <Input
                    defaultValue={labelConfig.font ?? ''}
                    placeholder="12px/1.4 sans-serif"
                    onBlur={(e) =>
                      updateLabel({ font: e.target.value || undefined })
                    }
                  />
                </Field>

                <Field label="Color">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="h-7 w-7 shrink-0 cursor-pointer rounded border border-input"
                      defaultValue={labelConfig.color ?? '#333333'}
                      onChange={(e) => updateLabel({ color: e.target.value })}
                    />
                    <Input
                      defaultValue={labelConfig.color ?? ''}
                      placeholder="#333333"
                      onBlur={(e) =>
                        updateLabel({ color: e.target.value || undefined })
                      }
                    />
                  </div>
                </Field>

                <Field label="Halo">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="h-7 w-7 shrink-0 cursor-pointer rounded border border-input"
                      defaultValue={labelConfig.haloColor ?? '#ffffff'}
                      onChange={(e) =>
                        updateLabel({ haloColor: e.target.value })
                      }
                    />
                    <Input
                      defaultValue={labelConfig.haloColor ?? ''}
                      placeholder="#ffffff"
                      onBlur={(e) =>
                        updateLabel({ haloColor: e.target.value || undefined })
                      }
                    />
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      className="w-16 shrink-0"
                      defaultValue={labelConfig.haloWidth ?? 3}
                      onBlur={(e) =>
                        updateLabel({ haloWidth: Number(e.target.value) })
                      }
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Offset X">
                    <Input
                      type="number"
                      defaultValue={labelConfig.offsetX ?? 0}
                      onBlur={(e) =>
                        updateLabel({ offsetX: Number(e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Offset Y">
                    <Input
                      type="number"
                      defaultValue={labelConfig.offsetY ?? -12}
                      onBlur={(e) =>
                        updateLabel({ offsetY: Number(e.target.value) })
                      }
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Placement">
                    <Select
                      value={labelConfig.placement ?? 'point'}
                      onValueChange={(v) =>
                        updateLabel({ placement: v as 'point' | 'line' })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="point">Point</SelectItem>
                        <SelectItem value="line">Line</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Background">
                    <div className="flex h-8 items-center">
                      <Switch
                        size="sm"
                        checked={labelConfig.showBackground ?? false}
                        onCheckedChange={(checked) =>
                          updateLabel({ showBackground: checked })
                        }
                      />
                    </div>
                  </Field>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* ── Feature Style ─────────────────────────────────────────── */}
      {showStyleSection && (
        <>
          {isVectorBase && <Separator />}
          <div className="grid gap-3">
            {!isVectorBase && (
              <p className="text-[11px] text-muted-foreground">
                Basic style for vector features. For advanced styling, use style
                rules.
              </p>
            )}

            <Field label="Fill Color">
              <div className="flex gap-2">
                <input
                  type="color"
                  className="h-7 w-7 shrink-0 cursor-pointer rounded border border-input"
                  defaultValue={style?.fill?.color ?? '#3b82f6'}
                  onChange={(e) =>
                    updateStyle({ fill: { color: e.target.value } })
                  }
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
        </>
      )}
    </div>
  )
}
