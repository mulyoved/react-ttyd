'use client'

import * as React from 'react'
import Link from 'next/link'
import { FileJson, Plus, RotateCcw, Save, Trash2, Wand2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import {
  formatSequence,
  setDragPayload,
  slotLabel,
  slotTooltip,
  useKeyboardConfigurator,
  type MacroDef,
  type SlotItem,
} from './configurator-context'

export default function KeyboardConfiguratorPage() {
  const {
    config,
    selectedKeyboardId,
    selectedKeyboard,
    selectedSlot,
    setSelectedSlot,
    libraryTab,
    setLibraryTab,
    search,
    setSearch,
    dragOver,
    setDragOver,
    trashOver,
    setTrashOver,
    macroOpen,
    setMacroOpen,
    templateOpen,
    setTemplateOpen,
    newMacroName,
    setNewMacroName,
    newMacroLabel,
    setNewMacroLabel,
    newMacroCategory,
    setNewMacroCategory,
    newMacroScript,
    setNewMacroScript,
    templateToApply,
    setTemplateToApply,
    isSaving,
    isLoading,
    selectKeyboard,
    updateKeyboard,
    setDefaultKeyboard,
    toggleKeyboardActive,
    setSlot,
    applyTemplateToSelected,
    resetToDefaults,
    saveKeyboards,
    createMacro,
    onCanvasDragStart,
    onSlotDragOver,
    onSlotDrop,
    onTrashDragOver,
    onTrashDrop,
    paletteCharacters,
    paletteSpecial,
    paletteActions,
    paletteMacros,
    selectedItem,
    selectedSpecial,
    selectedItemLabel,
    urlQueryString,
  } = useKeyboardConfigurator()

  const settingsHref = urlQueryString
    ? `/keyboard-configurator/settings?${urlQueryString}`
    : '/keyboard-configurator/settings'

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-secondary-background">
        <div className="flex w-full flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 2xl:mx-auto 2xl:max-w-[1600px]">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              <h1 className="text-xl font-heading">Keyboard Configurator</h1>
              <Badge variant="neutral">Export v1</Badge>
            </div>
            <p className="mt-1 text-sm text-foreground/70">
              Build keyboard layouts and macros, then copy/paste JSON into your React Native app.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="neutral" asChild>
              <Link href={settingsHref}>Keyboards</Link>
            </Button>
            <Button onClick={saveKeyboards} disabled={isSaving || isLoading}>
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>

            <Button variant="neutral" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="grid w-full grid-cols-1 gap-6 px-4 py-6 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:px-8 2xl:mx-auto 2xl:max-w-[1600px]">
        {/* Left: editor */}
        <section className="space-y-6 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="truncate">Editing:</CardTitle>
                    <Select value={selectedKeyboardId} onValueChange={(value) => selectKeyboard(value)}>
                      <SelectTrigger className="h-9 w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {config.keyboards.map((keyboard) => (
                          <SelectItem key={keyboard.id} value={keyboard.id}>
                            {keyboard.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <CardDescription>
                    Drag keys/macros from the library into the grid. Drag keys inside the grid to rearrange.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
                    <DialogTrigger asChild>
                      <Button variant="neutral" size="sm">
                        <Wand2 className="h-4 w-4" />
                        Apply template
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply template</DialogTitle>
                        <DialogDescription>
                          This replaces the entire grid for <b>{selectedKeyboard.name}</b>.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label>Template</Label>
                        <Select value={templateToApply} onValueChange={(v) => setTemplateToApply(v as typeof templateToApply)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blank">Blank</SelectItem>
                            <SelectItem value="qwerty">QWERTY</SelectItem>
                            <SelectItem value="navigation">Navigation</SelectItem>
                            <SelectItem value="quality">Quality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="neutral" onClick={() => setTemplateOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={applyTemplateToSelected}>Apply</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="neutral"
                    size="sm"
                    onClick={() => {
                      if (!selectedSlot) {
                        toast.error('Select a slot first.')
                        return
                      }
                      setSlot(selectedSlot.row, selectedSlot.col, null)
                      setSelectedSlot(null)
                    }}
                    disabled={!selectedSlot}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear slot
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kb-edit-name">Keyboard name</Label>
                  <Input
                    id="kb-edit-name"
                    value={selectedKeyboard.name}
                    onChange={(e) => updateKeyboard(selectedKeyboard.id, (k) => ({ ...k, name: e.target.value }))}
                  />
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedKeyboard.active}
                      onChange={(e) => toggleKeyboardActive(selectedKeyboard.id, e.target.checked)}
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <Button
                    variant={selectedKeyboard.id === config.defaultKeyboardId ? 'default' : 'neutral'}
                    onClick={() => setDefaultKeyboard(selectedKeyboard.id)}
                  >
                    {selectedKeyboard.id === config.defaultKeyboardId ? 'Default' : 'Set default'}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col items-center gap-4">
                {/* grid */}
                <div className="rounded-base border-2 border-border bg-background p-4">
                  <div className="space-y-2">
                    {selectedKeyboard.grid.map((row, rIdx) => (
                      <div key={rIdx} className="flex justify-center gap-2">
                        {row.map((item, cIdx) => {
                          const isSelected = selectedSlot?.row === rIdx && selectedSlot?.col === cIdx
                          const isOver = dragOver?.row === rIdx && dragOver?.col === cIdx
                          const label = item ? slotLabel(item, config.macros) : ''
                          const isMacro = item?.type === 'macro'
                          return (
                            <div
                              key={`${rIdx}-${cIdx}`}
                              onDragOver={(e) => onSlotDragOver(e, rIdx, cIdx)}
                              onDragLeave={() => setDragOver(null)}
                              onDrop={(e) => onSlotDrop(e, rIdx, cIdx)}
                              className={cn(
                                'h-14 w-14 rounded-base border-2 border-dashed border-border/60 bg-secondary-background',
                                isSelected ? 'ring-2 ring-black ring-offset-2' : '',
                                isOver ? 'bg-main/20 border-border' : '',
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSlot({ row: rIdx, col: cIdx })
                                }}
                                draggable={!!item}
                                onDragStart={(e) => item && onCanvasDragStart(e, rIdx, cIdx)}
                                className={cn(
                                  'flex h-full w-full items-center justify-center rounded-base text-sm font-base transition-transform active:scale-95',
                                  item ? 'border-2 border-border bg-background' : 'border-0 bg-transparent',
                                )}
                              >
                                <span className="flex flex-col items-center leading-none">
                                  <span>{label}</span>
                                  {isMacro ? <span className="mt-1 text-[10px] text-foreground/60">macro</span> : null}
                                </span>
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* trash */}
                <div
                  onDragOver={onTrashDragOver}
                  onDragLeave={() => setTrashOver(false)}
                  onDrop={onTrashDrop}
                  className={cn(
                    'w-full max-w-[520px] rounded-base border-2 border-dashed border-border bg-secondary-background px-4 py-3 text-center text-sm',
                    trashOver ? 'bg-red-100' : '',
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Drop a key here to remove it
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </section>

        {/* Right: library + properties */}
        <section className="space-y-6 min-w-0">
          <Card>
            <CardContent className="space-y-8">
              {/* Keep Library and Properties visible together for faster editing. */}
              <div className="space-y-4">
                <div className="font-heading">Library</div>
                <div className="space-y-2">
                  <Label htmlFor="search">Search</Label>
                  <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search keys, macros…" />
                </div>

                <Tabs value={libraryTab} onValueChange={(v) => setLibraryTab(v as typeof libraryTab)}>
                  <TabsList className="w-full">
                    <TabsTrigger value="keys" className="flex-1">
                      Keys
                    </TabsTrigger>
                    <TabsTrigger value="special" className="flex-1">
                      Special
                    </TabsTrigger>
                    <TabsTrigger value="macros" className="flex-1">
                      Macros
                    </TabsTrigger>
                    <TabsTrigger value="actions" className="flex-1">
                      Actions
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="keys" className="mt-4">
                    <PaletteGrid
                      items={paletteCharacters}
                      macros={config.macros}
                      onPick={(item) => {
                        if (!selectedSlot) {
                          toast.error('Select a slot on the keyboard grid first.')
                          return
                        }
                        setSlot(selectedSlot.row, selectedSlot.col, item)
                      }}
                      onDragStart={(ev, item) => setDragPayload(ev, { source: 'palette', item })}
                    />
                  </TabsContent>

                  <TabsContent value="special" className="mt-4">
                    <PaletteGrid
                      items={paletteSpecial}
                      macros={config.macros}
                      onPick={(item) => {
                        if (!selectedSlot) {
                          toast.error('Select a slot on the keyboard grid first.')
                          return
                        }
                        setSlot(selectedSlot.row, selectedSlot.col, item)
                      }}
                      onDragStart={(ev, item) => setDragPayload(ev, { source: 'palette', item })}
                    />
                  </TabsContent>

                  <TabsContent value="actions" className="mt-4">
                    <PaletteGrid
                      items={paletteActions}
                      macros={config.macros}
                      onPick={(item) => {
                        if (!selectedSlot) {
                          toast.error('Select a slot on the keyboard grid first.')
                          return
                        }
                        setSlot(selectedSlot.row, selectedSlot.col, item)
                      }}
                      onDragStart={(ev, item) => setDragPayload(ev, { source: 'palette', item })}
                    />
                  </TabsContent>

                  <TabsContent value="macros" className="mt-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm text-foreground/70">
                        {config.macros.length} macros available
                      </div>
                      <Dialog open={macroOpen} onOpenChange={setMacroOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm">
                            <Plus className="h-4 w-4" />
                            New macro
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Create macro</DialogTitle>
                            <DialogDescription>
                              Macros are exported to JSON and referenced by keys in your layouts.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Name</Label>
                                <Input value={newMacroName} onChange={(e) => setNewMacroName(e.target.value)} placeholder="Quality: 720p" />
                              </div>
                              <div className="space-y-2">
                                <Label>Key label (short)</Label>
                                <Input value={newMacroLabel} onChange={(e) => setNewMacroLabel(e.target.value)} placeholder="720p" />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <Input value={newMacroCategory} onChange={(e) => setNewMacroCategory(e.target.value)} placeholder="Quality" />
                            </div>
                            <div className="space-y-2">
                              <Label>Script</Label>
                              <Textarea
                                value={newMacroScript}
                                onChange={(e) => setNewMacroScript(e.target.value)}
                                placeholder='{ "type": "setQuality", "value": "720p" }'
                                className="min-h-[160px] font-mono text-xs"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="neutral" onClick={() => setMacroOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={createMacro}>Create macro</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <ScrollArea className="h-[420px] rounded-base border-2 border-border bg-background">
                      <div className="p-3 space-y-4">
                        {paletteMacros.length === 0 ? (
                          <div className="py-10 text-center text-sm text-foreground/70">No macros match your search.</div>
                        ) : (
                          paletteMacros.map(([cat, macros]) => (
                            <div key={cat} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-heading text-sm">{cat}</div>
                                <Badge variant="neutral">{macros.length}</Badge>
                              </div>
                              <div className="grid grid-cols-5 gap-2">
                                {macros.map((m) => {
                                  const item: SlotItem = { type: 'macro', macroId: m.id, label: m.label }
                                  return (
                                    <PaletteItem
                                      key={m.id}
                                      item={item}
                                      macros={config.macros}
                                      subtitle="macro"
                                      onPick={() => {
                                        if (!selectedSlot) {
                                          toast.error('Select a slot on the keyboard grid first.')
                                          return
                                        }
                                        setSlot(selectedSlot.row, selectedSlot.col, item)
                                      }}
                                      onDragStart={(ev) => setDragPayload(ev, { source: 'palette', item })}
                                    />
                                  )
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-4">
                <div className="font-heading">Properties</div>
                {!selectedSlot ? (
                  <div className="rounded-base border-2 border-border bg-secondary-background p-4 text-sm text-foreground/70">
                    Select a slot in the keyboard grid to edit its properties.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-base border-2 border-border bg-background p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-heading">Slot</div>
                          <div className="text-xs text-foreground/70">
                            Row {selectedSlot.row + 1}, Col {selectedSlot.col + 1}
                          </div>
                        </div>
                        <Button
                          variant="neutral"
                          size="sm"
                          onClick={() => {
                            setSlot(selectedSlot.row, selectedSlot.col, null)
                            setSelectedSlot(null)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <div className="text-xs text-foreground/70">Current</div>
                          <div className="rounded-base border-2 border-border bg-secondary-background px-3 py-2">
                            <div className="text-sm font-base">{selectedItem ? selectedItemLabel : 'Empty'}</div>
                            <div className="text-[11px] text-foreground/60">{selectedItem ? selectedItem.type : '—'}</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Key label override</Label>
                          <Input
                            value={selectedItem?.label ?? ''}
                            placeholder="(optional)"
                            onChange={(e) => {
                              const v = e.target.value
                              if (!selectedItem) return
                              // label is optional on each SlotItem variant
                              setSlot(selectedSlot.row, selectedSlot.col, { ...selectedItem, label: v || undefined })
                            }}
                            disabled={!selectedItem}
                          />
                        </div>
                      </div>
                    </div>

                    {selectedSpecial ? (
                      <div className="rounded-base border-2 border-border bg-background p-4 space-y-2">
                        <div className="font-heading">Special key</div>
                        <div className="text-sm font-base">{selectedSpecial.name}</div>
                        <div className="text-xs text-foreground/70">{selectedSpecial.description}</div>
                        <div className="text-xs font-mono">
                          Sequence: {selectedSpecial.sequence ? formatSequence(selectedSpecial.sequence) : '—'}
                        </div>
                      </div>
                    ) : null}

                    {selectedItem?.type === 'macro' ? (
                      <div className="rounded-base border-2 border-border bg-background p-4 space-y-3">
                        <div className="font-heading">Macro</div>
                        <div className="space-y-2">
                          <Label>Macro</Label>
                          <Select
                            value={selectedItem.macroId}
                            onValueChange={(v) =>
                              setSlot(selectedSlot.row, selectedSlot.col, {
                                ...selectedItem,
                                macroId: v,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {config.macros
                                .slice()
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Preview</Label>
                          <Textarea
                            readOnly
                            className="min-h-[140px] font-mono text-xs"
                            value={config.macros.find((m) => m.id === selectedItem.macroId)?.script ?? '(macro not found)'}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

    </div>
  )
}

// -----------------------------
// UI helpers
// -----------------------------

function PaletteGrid({
  items,
  macros,
  onPick,
  onDragStart,
}: {
  items: SlotItem[]
  macros: MacroDef[]
  onPick: (item: SlotItem) => void
  onDragStart: (ev: React.DragEvent, item: SlotItem) => void
}) {
  if (items.length === 0) {
    return <div className="py-10 text-center text-sm text-foreground/70">No items match your search.</div>
  }
  return (
    <ScrollArea className="h-[420px] rounded-base border-2 border-border bg-background">
      <div className="p-3">
        <div className="grid grid-cols-8 gap-2">
          {items.map((item, idx) => (
            <PaletteItem
              key={`${item.type}-${idx}-${item.type === 'character' ? item.char : item.type === 'special' ? item.code : item.type === 'action' ? item.action : item.macroId}`}
              item={item}
              macros={macros}
              onPick={() => onPick(item)}
              onDragStart={(ev) => onDragStart(ev, item)}
            />
          ))}
        </div>
      </div>
    </ScrollArea>
  )
}

function PaletteItem({
  item,
  macros,
  onPick,
  onDragStart,
  subtitle,
}: {
  item: SlotItem
  macros: MacroDef[]
  onPick: () => void
  onDragStart: (ev: React.DragEvent) => void
  subtitle?: string
}) {
  const label = slotLabel(item, macros)
  const sub =
    subtitle ??
    (item.type === 'macro'
      ? 'macro'
      : item.type === 'special'
        ? 'special'
        : item.type === 'action'
          ? 'action'
          : '')
  const tooltip = slotTooltip(item, macros)
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={onPick}
      className={cn(
        'h-12 rounded-base border-2 border-border bg-secondary-background text-sm font-base transition-transform active:scale-95',
        'hover:bg-background',
      )}
      title={tooltip}
    >
      <span className="flex h-full flex-col items-center justify-center leading-none">
        <span>{label}</span>
        {sub ? <span className="mt-1 text-[10px] text-foreground/60">{sub}</span> : null}
      </span>
    </button>
  )
}
