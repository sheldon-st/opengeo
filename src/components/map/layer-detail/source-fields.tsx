import type { LayerDefinition } from '@/map-engine'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

interface SourceFieldsProps {
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

export function SourceFields({ layer, onChange }: SourceFieldsProps) {
  if (layer.kind === 'group') return null

  const update = (field: string, value: unknown) => {
    onChange({ source: { ...layer.source, [field]: value } })
  }

  switch (layer.kind) {
    case 'wms': {
      const s = layer.source
      return (
        <div className="grid gap-3">
          <Field label="URL">
            <Input
              defaultValue={s.url}
              onBlur={(e) => update('url', e.target.value)}
            />
          </Field>
          <Field label="Layers">
            <Input
              defaultValue={s.layers}
              onBlur={(e) => update('layers', e.target.value)}
            />
          </Field>
          <Field label="Format">
            <Input
              defaultValue={s.format ?? 'image/png'}
              onBlur={(e) => update('format', e.target.value)}
            />
          </Field>
          <Field label="Version">
            <Input
              defaultValue={s.version ?? '1.3.0'}
              onBlur={(e) => update('version', e.target.value)}
            />
          </Field>
          <div className="flex items-center gap-2">
            <Switch
              checked={s.transparent ?? true}
              onCheckedChange={(checked) => update('transparent', checked)}
              size="sm"
            />
            <span className="text-xs">Transparent</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={s.tiled ?? false}
              onCheckedChange={(checked) => update('tiled', checked)}
              size="sm"
            />
            <span className="text-xs">Tiled</span>
          </div>
        </div>
      )
    }

    case 'wfs': {
      const s = layer.source
      return (
        <div className="grid gap-3">
          <Field label="URL">
            <Input
              defaultValue={s.url}
              onBlur={(e) => update('url', e.target.value)}
            />
          </Field>
          <Field label="Type Name">
            <Input
              defaultValue={s.typeName}
              onBlur={(e) => update('typeName', e.target.value)}
            />
          </Field>
          <Field label="Version">
            <Input
              defaultValue={s.version ?? '2.0.0'}
              onBlur={(e) => update('version', e.target.value)}
            />
          </Field>
          <Field label="Output Format">
            <Input
              defaultValue={s.outputFormat ?? 'application/json'}
              onBlur={(e) => update('outputFormat', e.target.value)}
            />
          </Field>
          <Field label="Max Features">
            <Input
              type="number"
              defaultValue={s.maxFeatures ?? ''}
              onBlur={(e) =>
                update(
                  'maxFeatures',
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </Field>
        </div>
      )
    }

    case 'arcgis-mapserver': {
      const s = layer.source
      return (
        <div className="grid gap-3">
          <Field label="URL">
            <Input
              defaultValue={s.url}
              onBlur={(e) => update('url', e.target.value)}
            />
          </Field>
          <Field label="Layers">
            <Input
              defaultValue={s.layers ?? ''}
              onBlur={(e) => update('layers', e.target.value)}
            />
          </Field>
          <Field label="Token">
            <Input
              defaultValue={s.token ?? ''}
              onBlur={(e) => update('token', e.target.value || undefined)}
            />
          </Field>
        </div>
      )
    }

    case 'arcgis-featureserver': {
      const s = layer.source
      return (
        <div className="grid gap-3">
          <Field label="URL">
            <Input
              defaultValue={s.url}
              onBlur={(e) => update('url', e.target.value)}
            />
          </Field>
          <Field label="Where Clause">
            <Input
              defaultValue={s.where ?? '1=1'}
              onBlur={(e) => update('where', e.target.value)}
            />
          </Field>
          <Field label="Out Fields (comma-separated)">
            <Input
              defaultValue={s.outFields?.join(',') ?? '*'}
              onBlur={(e) =>
                update(
                  'outFields',
                  e.target.value.split(',').map((v) => v.trim()),
                )
              }
            />
          </Field>
          <Field label="Token">
            <Input
              defaultValue={s.token ?? ''}
              onBlur={(e) => update('token', e.target.value || undefined)}
            />
          </Field>
        </div>
      )
    }

    case 'geojson': {
      const s = layer.source
      return (
        <div className="grid gap-3">
          <Field label="URL">
            <Input
              defaultValue={s.url ?? ''}
              onBlur={(e) => update('url', e.target.value || undefined)}
            />
          </Field>
          <Field label="Inline Data (JSON)">
            <textarea
              className="h-24 w-full rounded-md border border-input bg-input/20 px-2 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30"
              defaultValue={s.data ? JSON.stringify(s.data, null, 2) : ''}
              onBlur={(e) => {
                try {
                  const parsed = e.target.value
                    ? JSON.parse(e.target.value)
                    : undefined
                  update('data', parsed)
                } catch {
                  // invalid JSON, ignore
                }
              }}
            />
          </Field>
        </div>
      )
    }

    case 'xyz-tile': {
      const s = layer.source
      return (
        <div className="grid gap-3">
          <Field label="URL Template">
            <Input
              defaultValue={s.url}
              placeholder="https://{a-c}.tile.example.com/{z}/{x}/{y}.png"
              onBlur={(e) => update('url', e.target.value)}
            />
          </Field>
          <Field label="Min Zoom">
            <Input
              type="number"
              defaultValue={s.minZoom ?? ''}
              onBlur={(e) =>
                update(
                  'minZoom',
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </Field>
          <Field label="Max Zoom">
            <Input
              type="number"
              defaultValue={s.maxZoom ?? ''}
              onBlur={(e) =>
                update(
                  'maxZoom',
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </Field>
          <Field label="Attributions">
            <Input
              defaultValue={s.attributions ?? ''}
              onBlur={(e) =>
                update('attributions', e.target.value || undefined)
              }
            />
          </Field>
        </div>
      )
    }

    case 'vector-tile': {
      const s = layer.source
      return (
        <div className="grid gap-3">
          <Field label="URL Template">
            <Input
              defaultValue={s.url}
              onBlur={(e) => update('url', e.target.value)}
            />
          </Field>
          <Field label="Min Zoom">
            <Input
              type="number"
              defaultValue={s.minZoom ?? ''}
              onBlur={(e) =>
                update(
                  'minZoom',
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </Field>
          <Field label="Max Zoom">
            <Input
              type="number"
              defaultValue={s.maxZoom ?? ''}
              onBlur={(e) =>
                update(
                  'maxZoom',
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
            />
          </Field>
        </div>
      )
    }

    case 'wmts': {
      const s = layer.source
      return (
        <div className="grid gap-3">
          <Field label="URL">
            <Input
              defaultValue={s.url}
              onBlur={(e) => update('url', e.target.value)}
            />
          </Field>
          <Field label="Layer">
            <Input
              defaultValue={s.layer}
              onBlur={(e) => update('layer', e.target.value)}
            />
          </Field>
          <Field label="Matrix Set">
            <Input
              defaultValue={s.matrixSet}
              onBlur={(e) => update('matrixSet', e.target.value)}
            />
          </Field>
          <Field label="Format">
            <Input
              defaultValue={s.format ?? 'image/png'}
              onBlur={(e) => update('format', e.target.value)}
            />
          </Field>
        </div>
      )
    }

    case 'wcs': {
      const s = layer.source
      return (
        <div className="grid gap-3">
          <Field label="URL">
            <Input
              defaultValue={s.url}
              onBlur={(e) => update('url', e.target.value)}
            />
          </Field>
          <Field label="Coverage ID">
            <Input
              defaultValue={s.coverageId}
              onBlur={(e) => update('coverageId', e.target.value)}
            />
          </Field>
          <Field label="Version">
            <Input
              defaultValue={s.version ?? '2.0.1'}
              onBlur={(e) => update('version', e.target.value)}
            />
          </Field>
          <Field label="Format">
            <Input
              defaultValue={s.format ?? 'image/tiff'}
              onBlur={(e) => update('format', e.target.value)}
            />
          </Field>
        </div>
      )
    }

    default:
      return null
  }
}
