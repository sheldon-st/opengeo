import { LayerPanel } from './layer-tree/layer-panel'
import { FeaturePopup } from './feature-detail/feature-popup'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { MapViewport } from '@/map-engine'

export function MapLayout() {
  return (
    <ResizablePanelGroup orientation="horizontal" className="h-screen w-screen">
      <ResizablePanel className='h-full p-2 flex flex-col' >
        <LayerPanel />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel className='h-full p-2 flex' defaultSize={'75%'}>
        <div className='relative flex-1 rounded-md overflow-hidden'>
          <MapViewport />
          <FeaturePopup />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
