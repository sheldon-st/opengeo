import { useRef } from 'react'
import { Download, FolderOpen, Moon, Sun, Trash2 } from 'lucide-react'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar'
import { exportAll, importAll } from '@/map-engine/store/persistence'
import { useMapStore } from '@/map-engine'
import { useTheme } from '@/components/theme-provider'

export function AppMenubar() {
  const hydrate = useMapStore((s) => s.hydrate)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setTheme } = useTheme()

  async function handleExport() {
    const data = await exportAll()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `opengeo-state-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importAll(data)
      await hydrate()
    } catch (err) {
      console.error('Failed to import state:', err)
    } finally {
      e.target.value = ''
    }
  }

  async function handleClearAll() {
    await importAll({ layers: [], features: [] })
    await hydrate()
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />
      <div className="flex items-center border-b px-2 py-1 shrink-0">
        <Menubar className="border-none bg-transparent p-0 h-auto shadow-none">
          <MenubarMenu>
            <MenubarTrigger>View</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => setTheme('light')}>
                <Sun />
                Light
              </MenubarItem>
              <MenubarItem onClick={() => setTheme('dark')}>
                <Moon />
                Dark
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={handleExport}>
                <Download />
                Export State
              </MenubarItem>
              <MenubarItem onClick={handleImportClick}>
                <FolderOpen />
                Import State
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem variant="destructive" onClick={handleClearAll}>
                <Trash2 />
                Clear All Data
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </>
  )
}
