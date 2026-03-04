import { useState } from 'react'
import { AlertCircleIcon, ChevronLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { normalizeFeatureServerUrl, type ArcGisField } from '@/lib/arcgis-rest'
import type { ArcGisFeatureServerSourceConfig } from '@/map-engine/types/source.types'
import {
  ArcGisLayerSelector,
  type LayerSelectorCompletePayload,
} from './arcgis-layer-selector'

export const FIELD_TYPE_SHORT: Record<string, string> = {
  esriFieldTypeOID: 'OID',
  esriFieldTypeString: 'String',
  esriFieldTypeInteger: 'Int',
  esriFieldTypeSmallInteger: 'SmallInt',
  esriFieldTypeDouble: 'Double',
  esriFieldTypeSingle: 'Float',
  esriFieldTypeDate: 'Date',
  esriFieldTypeBlob: 'Blob',
  esriFieldTypeGUID: 'GUID',
  esriFieldTypeGlobalID: 'GlobalID',
  esriFieldTypeGeometry: 'Geometry',
}

export function isConfigurableField(field: ArcGisField): boolean {
  return field.type !== 'esriFieldTypeGeometry' && field.type !== 'esriFieldTypeBlob'
}

export interface WizardLayerPayload {
  layerId: number
  name: string
  source: ArcGisFeatureServerSourceConfig
  metadata: Record<string, unknown>
}

export interface WizardCompletePayload {
  groupName: string
  serviceUrl: string
  layers: WizardLayerPayload[]
}

interface ArcGisFeatureServerWizardProps {
  onComplete: (payload: WizardCompletePayload) => void
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <AlertCircleIcon className="mt-0.5 size-3 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

export function ArcGisFeatureServerWizard({
  onComplete,
}: ArcGisFeatureServerWizardProps) {
  const [step, setStep] = useState<'connect' | 'select'>('connect')
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const handleConnect = async () => {
    if (!url.trim()) return
    setConnecting(true)
    setConnectError(null)
    try {
      // Validate URL by normalizing — the selector will fetch the actual service
      normalizeFeatureServerUrl(url)
      setStep('select')
    } catch (e) {
      setConnectError(e instanceof Error ? e.message : 'Invalid URL')
    } finally {
      setConnecting(false)
    }
  }

  const handleSelectorComplete = (payload: LayerSelectorCompletePayload) => {
    onComplete(payload)
  }

  if (step === 'connect') {
    return (
      <div className="grid gap-3">
        <div className="grid gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Service URL
          </label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://services.arcgis.com/…/FeatureServer"
            onKeyDown={(e) => e.key === 'Enter' && !connecting && handleConnect()}
          />
        </div>
        <div className="grid gap-1">
          <label className="text-[11px] font-medium text-muted-foreground">
            Token (optional)
          </label>
          <Input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Access token for secured services"
          />
        </div>
        {connectError && <ErrorBanner message={connectError} />}
        <Button
          onClick={handleConnect}
          disabled={!url.trim() || connecting}
          className="w-full"
        >
          {connecting && <Spinner className="mr-2" />}
          Connect to Service
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setStep('connect')
          }}
          className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeftIcon className="size-3.5" />
        </button>
        <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-muted-foreground">
          {url}
        </span>
      </div>
      <ArcGisLayerSelector
        serviceUrl={url}
        token={token || undefined}
        onComplete={handleSelectorComplete}
      />
    </div>
  )
}
