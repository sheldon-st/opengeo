import { Outlet, createFileRoute } from '@tanstack/react-router'
import { MapProvider } from '@/map-engine'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { AppMenubar } from '@/components/map/app-menubar'
import { ThemeProvider } from '@/components/theme-provider'

export const Route = createFileRoute('/_app')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <MapProvider
      config={{
        initialView: {
          center: [-98.5795, 39.8283],
          zoom: 4,
          rotation: 0,
          projection: 'EPSG:3857',
        },
        maxZoom: 20,
        minZoom: 2,
      }}
    >
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SidebarProvider>
          <div className="flex flex-col h-screen w-screen overflow-hidden">
            <AppMenubar />
            <div className="flex flex-row flex-1 min-h-0">
              <AppSidebar />
              <Outlet />
            </div>
          </div>
        </SidebarProvider>
      </ThemeProvider>
    </MapProvider>
  )
}
