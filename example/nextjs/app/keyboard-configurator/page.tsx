'use client'

import * as React from 'react'
import Link from 'next/link'
import { FileJson, Plus, RotateCcw, Save, Trash2, Wand2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { LucideIcon, LUCIDE_ICON_NAMES } from '@/components/lucide-icon'
import { SlotButtonContent } from '@/components/slot-button-content'

import {
  formatSequence,
  LIBRARY_KINDS,
  resolveSlotIconName,
  setDragPayload,
  slotLabel,
  useKeyboardConfigurator,
  type LibraryResult,
} from './configurator-context'

export default function KeyboardConfiguratorPage() {
  const {
    config,
    selectedKeyboardId,
    selectedKeyboard,
    selectedSlot,
    setSelectedSlot,
    search,
    setSearch,
    libraryKinds,
    toggleLibraryKind,
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
    libraryResults,
    selectedItem,
    selectedSpecial,
    selectedItemLabel,
    urlQueryString,
  } = useKeyboardConfigurator()

  const settingsHref = urlQueryString
    ? `/keyboard-configurator/settings?${urlQueryString}`
    : '/keyboard-configurator/settings'

  const [iconPickerOpen, setIconPickerOpen] = React.useState(false)
  const [iconQuery, setIconQuery] = React.useState('')
  const iconPickerRef = React.useRef<HTMLDivElement | null>(null)
  const iconTriggerRef = React.useRef<HTMLButtonElement | null>(null)

  const filteredIconNames = React.useMemo(() => {
    const q = iconQuery.trim().toLowerCase()
    if (!q) return LUCIDE_ICON_NAMES
    return LUCIDE_ICON_NAMES.filter((name) => name.toLowerCase().includes(q))
  }, [iconQuery])

  const MAX_ICON_RESULTS = 120
  const visibleIconNames = React.useMemo(
    () => filteredIconNames.slice(0, MAX_ICON_RESULTS),
    [filteredIconNames],
  )
  const hasMoreIcons = filteredIconNames.length > visibleIconNames.length

  React.useEffect(() => {
    if (!iconPickerOpen) return
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node
      if (iconPickerRef.current?.contains(target)) return
      if (iconTriggerRef.current?.contains(target)) return
      setIconPickerOpen(false)
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [iconPickerOpen])

  React.useEffect(() => {
    setIconPickerOpen(false)
    setIconQuery('')
  }, [selectedSlot?.row, selectedSlot?.col])

  const applySlotIcon = React.useCallback(
    (nextIcon: string | null | undefined) => {
      if (!selectedSlot || !selectedItem) return
      if (nextIcon === undefined) {
        const { icon: _icon, ...rest } = selectedItem
        setSlot(selectedSlot.row, selectedSlot.col, rest as typeof selectedItem)
        return
      }
      setSlot(selectedSlot.row, selectedSlot.col, { ...selectedItem, icon: nextIcon })
    },
    [selectedItem, selectedSlot, setSlot],
  )

  const resolvedSelectedIcon = selectedItem ? resolveSlotIconName(selectedItem) : null
  const selectedIconLabel =
    selectedItem?.icon === null ? 'None' : selectedItem?.icon ? selectedItem.icon : 'Default'
  const selectedKeyId = React.useMemo(() => {
    if (!selectedSlot) return ''
    return `${selectedKeyboard.id}:r${selectedSlot.row + 1}c${selectedSlot.col + 1}`
  }, [selectedKeyboard.id, selectedSlot])

  // -----------------------------
  // Render
  // -----------------------------

  return (
    <div className="h-screen">
      {/* Full-height layout: left sidebar header + right workspace. */}
      <div className="grid h-full grid-cols-[minmax(220px,280px)_minmax(0,1fr)]">
        <aside className="flex h-full flex-col gap-4 border-r border-border bg-secondary-background px-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              <h1 className="text-xl font-heading">Keyboard Configurator</h1>
              <Badge variant="neutral">Export v1</Badge>
            </div>
            <p className="text-sm text-foreground/70">
              Build keyboard layouts and macros, then copy/paste JSON into your React Native app.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="neutral" size="sm" asChild>
              <Link href="/keyboard-demo" target="_blank" rel="noopener noreferrer">
                Preview Keyboard
              </Link>
            </Button>
            <Button variant="neutral" size="sm" asChild>
              <Link href={settingsHref}>Keyboards</Link>
            </Button>
            <Button size="sm" onClick={saveKeyboards} disabled={isSaving || isLoading}>
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>

            <Button variant="neutral" size="sm" onClick={resetToDefaults}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-base text-foreground/70">Editing</div>
            <div className="space-y-2">
              <Label>Keyboard</Label>
              <Select value={selectedKeyboardId} onValueChange={(value) => selectKeyboard(value)}>
                <SelectTrigger className="h-9 w-full">
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

            <div className="space-y-2">
              <Label htmlFor="kb-edit-name">Name</Label>
              <Input
                id="kb-edit-name"
                value={selectedKeyboard.name}
                onChange={(e) => updateKeyboard(selectedKeyboard.id, (k) => ({ ...k, name: e.target.value }))}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-xs">
                <input
                  type="checkbox"
                  checked={selectedKeyboard.active}
                  onChange={(e) => toggleKeyboardActive(selectedKeyboard.id, e.target.checked)}
                />
                <span>Active</span>
              </label>
              <Button
                size="sm"
                variant={selectedKeyboard.id === config.defaultKeyboardId ? 'default' : 'neutral'}
                onClick={() => setDefaultKeyboard(selectedKeyboard.id)}
              >
                {selectedKeyboard.id === config.defaultKeyboardId ? 'Default' : 'Set default'}
              </Button>
            </div>

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
        </aside>

        {/* Keep workspace height locked; panels handle their own scrolling. */}
        <main className="h-full min-h-0 overflow-hidden p-4">
          <div className="grid h-full min-h-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Left: keyboard + properties */}
            <section className="flex min-h-0 min-w-0 flex-col gap-4 pr-1">
              <div className="flex flex-col items-center gap-3">
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
                                  {item ? (
                                    <SlotButtonContent
                                      item={item}
                                      label={label}
                                      className="gap-0.5"
                                      iconLabelClassName="text-sm font-base normal-case text-foreground"
                                      labelClassName="text-sm font-base"
                                    />
                                  ) : null}
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

              {/* Properties take the remaining height below the grid for focused editing. */}
              <div className="flex min-h-0 flex-1 flex-col gap-2">
                <div className="text-xs font-base text-foreground/70">Properties</div>
                <div className="min-h-0 flex-1">
                  <ScrollArea className="h-full rounded-base border-2 border-border bg-background">
                    <div className="space-y-2 p-2">
                      {!selectedSlot ? (
                        <div className="rounded-base border-2 border-border bg-secondary-background p-2 text-sm text-foreground/70">
                          Select a slot in the keyboard grid to edit its properties.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="rounded-base border-2 border-border bg-background p-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs font-base text-foreground/70">Slot</div>
                                <div className="text-[11px] text-foreground/60">
                                  Row {selectedSlot.row + 1}, Col {selectedSlot.col + 1}
                                </div>
                                <div className="text-[11px] font-mono text-foreground/60">Key ID: {selectedKeyId}</div>
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

                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <div className="space-y-1">
                                <div className="text-[11px] text-foreground/60">Current</div>
                                <div className="rounded-base border-2 border-border bg-secondary-background px-2 py-1">
                                  <div className="text-sm font-base">{selectedItem ? selectedItemLabel : 'Empty'}</div>
                                  <div className="text-[11px] text-foreground/60">{selectedItem ? selectedItem.type : '—'}</div>
                                </div>
                              </div>

                              <div className="space-y-1">
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

                            <div className="mt-2 space-y-1">
                              <Label>Icon</Label>
                              <div className="relative" ref={iconPickerRef}>
                                <Button
                                  type="button"
                                  variant="neutral"
                                  size="sm"
                                  ref={iconTriggerRef}
                                  disabled={!selectedItem}
                                  onClick={() => setIconPickerOpen((prev) => !prev)}
                                  className="w-full justify-between"
                                >
                                  <span className="flex items-center gap-2">
                                    {resolvedSelectedIcon ? (
                                      <LucideIcon name={resolvedSelectedIcon} className="h-4 w-4" />
                                    ) : null}
                                    <span className="text-sm">{selectedIconLabel}</span>
                                  </span>
                                  <span className="text-[11px] text-foreground/60">Change</span>
                                </Button>

                                {iconPickerOpen ? (
                                  <div className="absolute left-0 right-0 z-50 mt-2 rounded-base border-2 border-border bg-background shadow-shadow">
                                    <div className="flex items-center gap-2 border-b border-border p-2">
                                      <Input
                                        value={iconQuery}
                                        onChange={(e) => setIconQuery(e.target.value)}
                                        placeholder="Search icons…"
                                      />
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="neutral"
                                        onClick={() => {
                                          applySlotIcon(undefined)
                                          setIconPickerOpen(false)
                                        }}
                                      >
                                        Default
                                      </Button>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="neutral"
                                        onClick={() => {
                                          applySlotIcon(null)
                                          setIconPickerOpen(false)
                                        }}
                                      >
                                        None
                                      </Button>
                                    </div>
                                    <ScrollArea className="h-64">
                                      <div className="grid grid-cols-4 gap-2 p-2 sm:grid-cols-6">
                                        {visibleIconNames.map((name) => (
                                          <button
                                            key={name}
                                            type="button"
                                            title={name}
                                            className={cn(
                                              'flex flex-col items-center gap-1 rounded-base border-2 border-border bg-secondary-background px-2 py-2 text-[10px] transition-transform',
                                              'hover:-translate-y-px',
                                            )}
                                            onClick={() => {
                                              applySlotIcon(name)
                                              setIconPickerOpen(false)
                                            }}
                                          >
                                            <LucideIcon name={name} className="h-4 w-4" />
                                            <span className="truncate max-w-full">{name}</span>
                                          </button>
                                        ))}
                                        {filteredIconNames.length === 0 ? (
                                          <div className="col-span-full py-6 text-center text-xs text-foreground/70">
                                            No icons match your search.
                                          </div>
                                        ) : null}
                                      </div>
                                      {hasMoreIcons ? (
                                        <div className="border-t border-border px-2 py-2 text-center text-[11px] text-foreground/60">
                                          Showing first {visibleIconNames.length} icons. Refine your search to see more.
                                        </div>
                                      ) : null}
                                    </ScrollArea>
                                  </div>
                                ) : null}
                              </div>
                              <div className="text-[11px] text-foreground/60">
                                Defaults apply when no icon is set; choose “None” to hide the icon.
                              </div>
                            </div>
                          </div>

                          {selectedSpecial ? (
                            <div className="rounded-base border-2 border-border bg-background p-2 space-y-1">
                              <div className="text-xs font-base text-foreground/70">Special key</div>
                              <div className="text-sm font-base">{selectedSpecial.name}</div>
                              <div className="text-xs text-foreground/70">{selectedSpecial.description}</div>
                              <div className="text-[11px] font-mono text-foreground/60">
                                Sequence: {selectedSpecial.sequence ? formatSequence(selectedSpecial.sequence) : '—'}
                              </div>
                            </div>
                          ) : null}

                          {selectedItem?.type === 'macro' ? (
                            <div className="rounded-base border-2 border-border bg-background p-2 space-y-2">
                              <div className="text-xs font-base text-foreground/70">Macro</div>
                              <div className="space-y-1">
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
                              <div className="space-y-1">
                                <Label>Preview</Label>
                                <Textarea
                                  readOnly
                                  className="min-h-[100px] font-mono text-xs"
                                  value={config.macros.find((m) => m.id === selectedItem.macroId)?.script ?? '(macro not found)'}
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </section>

            {/* Right: library only */}
            <section className="min-h-0 min-w-0">
              <Card className="h-full">
                <CardContent className="flex h-full flex-col gap-3 p-3">
                  <div className="flex min-h-0 flex-1 flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-heading">Library</div>
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
                                <Input
                                  value={newMacroName}
                                  onChange={(e) => setNewMacroName(e.target.value)}
                                  placeholder="Navigation: Refresh"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Key label (short)</Label>
                                <Input
                                  value={newMacroLabel}
                                  onChange={(e) => setNewMacroLabel(e.target.value)}
                                  placeholder="Refresh"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Category</Label>
                              <Input
                                value={newMacroCategory}
                                onChange={(e) => setNewMacroCategory(e.target.value)}
                                placeholder="Navigation"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Script</Label>
                              <Textarea
                                value={newMacroScript}
                                onChange={(e) => setNewMacroScript(e.target.value)}
                                placeholder='{ "type": "action", "name": "nav_refresh" }'
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
                    <div className="flex flex-wrap gap-2">
                      {LIBRARY_KINDS.map((kind) => {
                        const isActive = libraryKinds.includes(kind)
                        return (
                          <Button
                            key={kind}
                            type="button"
                            size="sm"
                            variant={isActive ? 'default' : 'neutral'}
                            className="h-8 px-3"
                            aria-pressed={isActive}
                            onClick={() => toggleLibraryKind(kind)}
                          >
                            {kind}
                          </Button>
                        )
                      })}
                    </div>
                    <div>
                      <Input
                        id="search"
                        aria-label="Search library"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search library…"
                      />
                    </div>

                    <div className="min-h-0 flex-1">
                      <ScrollArea className="h-full rounded-base border-2 border-border bg-background">
                        <div className="space-y-2 p-3">
                          {libraryResults.length === 0 ? (
                            <div className="py-6 text-center text-sm text-foreground/70">No items match your search.</div>
                          ) : (
                            libraryResults.map((result) => (
                              <LibraryResultItem
                                key={result.id}
                                result={result}
                                onPick={() => {
                                  if (!selectedSlot) {
                                    toast.error('Select a slot on the keyboard grid first.')
                                    return
                                  }
                                  setSlot(selectedSlot.row, selectedSlot.col, result.item)
                                }}
                                onDragStart={(ev) => setDragPayload(ev, { source: 'palette', item: result.item })}
                              />
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

// -----------------------------
// UI helpers
// -----------------------------

function LibraryResultItem({
  result,
  onPick,
  onDragStart,
}: {
  result: LibraryResult
  onPick: () => void
  onDragStart: (ev: React.DragEvent) => void
}) {
  const iconName = resolveSlotIconName(result.item)
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={onPick}
      className={cn(
        'rounded-base border-2 border-border bg-secondary-background px-3 py-2 text-left transition-transform',
        'active:scale-[0.99] hover:bg-background',
      )}
      title={result.tooltip}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {iconName ? <LucideIcon name={iconName} className="h-4 w-4 text-foreground/70" /> : null}
          <div className="text-sm font-base">{result.title}</div>
        </div>
        <Badge variant="neutral">{result.kind}</Badge>
      </div>
      {result.description ? (
        <div className="mt-1 text-xs text-foreground/70">{result.description}</div>
      ) : null}
      {result.meta && result.meta.length > 0 ? (
        <div className="mt-1 text-[11px] text-foreground/60">{result.meta.join(' • ')}</div>
      ) : null}
    </button>
  )
}
