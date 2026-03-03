import { LayerPanel } from './layer-tree/layer-panel'
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
      <ResizablePanel  className='h-full p-2 flex'>
        <MapViewport  className='rounded-md overflow-hidden' />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
