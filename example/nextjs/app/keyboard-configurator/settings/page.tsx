'use client'

import Link from 'next/link'
import { ArrowDown, ArrowUp, Copy, Download, FileJson, Plus, RotateCcw, Trash2, Upload } from 'lucide-react'

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
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { useKeyboardConfigurator } from '../configurator-context'

export default function KeyboardConfiguratorSettingsPage() {
  const {
    config,
    selectedKeyboardId,
    activeKeyboards,
    importOpen,
    setImportOpen,
    exportOpen,
    setExportOpen,
    newKeyboardOpen,
    setNewKeyboardOpen,
    importText,
    setImportText,
    newKeyboardName,
    setNewKeyboardName,
    newKeyboardTemplate,
    setNewKeyboardTemplate,
    deleteKeyboardOpen,
    setDeleteKeyboardOpen,
    selectKeyboard,
    toggleKeyboardActive,
    setDefaultKeyboard,
    moveActiveKeyboard,
    createKeyboard,
    copyJson,
    downloadJson,
    importJson,
    duplicateKeyboard,
    exportJson,
    requestDeleteKeyboard,
    deleteKeyboardConfirmed,
    urlQueryString,
  } = useKeyboardConfigurator()

  const editorHref = urlQueryString
    ? `/keyboard-configurator?${urlQueryString}`
    : '/keyboard-configurator'

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
              <Link href={editorHref}>Back to editor</Link>
            </Button>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="neutral">
                  <Upload className="h-4 w-4" />
                  Import JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import configuration</DialogTitle>
                  <DialogDescription>
                    Paste a configuration JSON (version 1). Importing will replace your current state.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="import">JSON</Label>
                  <Textarea
                    id="import"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={'{\n  "version": 1, ...\n}'}
                    className="min-h-[280px] font-mono text-xs"
                  />
                </div>
                <DialogFooter>
                  <Button variant="neutral" onClick={() => setImportOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={importJson}>Import</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={exportOpen} onOpenChange={setExportOpen}>
              <DialogTrigger asChild>
                <Button variant="neutral">
                  <Copy className="h-4 w-4" />
                  Export JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Export configuration</DialogTitle>
                  <DialogDescription>Copy and paste this JSON into your mobile app.</DialogDescription>
                </DialogHeader>
                <Textarea value={exportJson} readOnly className="min-h-[320px] font-mono text-xs" />
                <DialogFooter>
                  <Button variant="neutral" onClick={downloadJson}>
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  <Button onClick={copyJson}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="grid w-full grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:px-8 2xl:mx-auto 2xl:max-w-[1600px]">
        {/* Keyboards */}
        <section className="space-y-6 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Keyboards</CardTitle>
                  <CardDescription>Create, duplicate, delete, enable and set default.</CardDescription>
                </div>
                <Dialog open={newKeyboardOpen} onOpenChange={setNewKeyboardOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                      New
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>New keyboard</DialogTitle>
                      <DialogDescription>Start from a template, then customize the keys.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="kb-name">Name</Label>
                        <Input
                          id="kb-name"
                          value={newKeyboardName}
                          onChange={(e) => setNewKeyboardName(e.target.value)}
                          placeholder="My Custom Keyboard"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Start from template</Label>
                        <Select
                          value={newKeyboardTemplate}
                          onValueChange={(value) => setNewKeyboardTemplate(value as typeof newKeyboardTemplate)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select template" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blank">Blank</SelectItem>
                            <SelectItem value="qwerty">QWERTY</SelectItem>
                            <SelectItem value="navigation">Navigation</SelectItem>
                            <SelectItem value="quality">Quality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="neutral" onClick={() => setNewKeyboardOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={createKeyboard}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-base border-2 border-border bg-background">
                <ScrollArea className="h-[320px]">
                  <div className="p-2">
                    {config.keyboards.map((keyboard) => {
                      const isSelected = keyboard.id === selectedKeyboardId
                      const isDefault = keyboard.id === config.defaultKeyboardId
                      return (
                        <div
                          key={keyboard.id}
                          className={cn(
                            'flex items-center gap-2 rounded-base border-2 border-transparent px-2 py-2 transition-colors',
                            isSelected ? 'bg-main text-main-foreground border-border' : 'hover:bg-secondary-background',
                          )}
                        >
                          <button
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            onClick={() => {
                              selectKeyboard(keyboard.id)
                            }}
                            type="button"
                          >
                            <span className="truncate font-base">{keyboard.name}</span>
                            {keyboard.builtIn ? <Badge variant="neutral">Built-in</Badge> : null}
                            {isDefault ? <Badge>Default</Badge> : null}
                          </button>

                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={keyboard.active}
                              onChange={(e) => toggleKeyboardActive(keyboard.id, e.target.checked)}
                              aria-label={`Toggle ${keyboard.name} active`}
                            />
                            <span className={cn('hidden sm:inline', isSelected ? 'text-main-foreground/90' : 'text-foreground/70')}>Active</span>
                          </label>

                          {!isDefault ? (
                            <Button
                              size="sm"
                              variant={isSelected ? 'noShadow' : 'neutral'}
                              onClick={() => setDefaultKeyboard(keyboard.id)}
                            >
                              Set
                            </Button>
                          ) : (
                            <span className={cn('px-2 text-xs', isSelected ? 'text-main-foreground/90' : 'text-foreground/70')}>✓</span>
                          )}

                          <Button
                            size="icon"
                            variant={isSelected ? 'noShadow' : 'neutral'}
                            onClick={() => duplicateKeyboard(keyboard.id)}
                            aria-label={`Duplicate ${keyboard.name}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant={isSelected ? 'noShadow' : 'neutral'}
                            onClick={() => requestDeleteKeyboard(keyboard.id)}
                            aria-label={`Delete ${keyboard.name}`}
                            disabled={keyboard.builtIn}
                            className={cn(keyboard.builtIn ? '' : 'text-red-600')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>

              <div className="rounded-base border-2 border-border bg-background p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-heading">Rotation order (active)</div>
                    <div className="text-xs text-foreground/70">Controls which keyboard comes next when rotating.</div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {activeKeyboards.length === 0 ? (
                    <div className="text-sm text-foreground/70">No active keyboards.</div>
                  ) : (
                    activeKeyboards.map((keyboard, idx) => (
                      <div key={keyboard.id} className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-2 py-2">
                        <span className="w-6 text-center text-xs text-foreground/70">{idx + 1}</span>
                        <span className="flex-1 truncate text-sm">{keyboard.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="neutral"
                            onClick={() => moveActiveKeyboard(keyboard.id, -1)}
                            disabled={idx === 0}
                            aria-label="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="neutral"
                            onClick={() => moveActiveKeyboard(keyboard.id, 1)}
                            disabled={idx === activeKeyboards.length - 1}
                            aria-label="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <p className="mt-3 text-xs text-foreground/70">
                  Guardrail: you must keep at least one keyboard active.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Quick preview */}
        <section className="space-y-6 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Quick preview</CardTitle>
              <CardDescription>Shows what a runtime keyboard switcher could look like.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="neutral">Active layouts: {activeKeyboards.length}</Badge>
                <Badge variant="neutral">Default: {config.defaultKeyboardId}</Badge>
                <div className="ml-auto" />
                <Button
                  variant="neutral"
                  onClick={() => {
                    if (activeKeyboards.length <= 1) {
                      toast.error('Only one active keyboard. Enable more to rotate.')
                      return
                    }
                    const idx = activeKeyboards.findIndex((keyboard) => keyboard.id === selectedKeyboardId)
                    const next = activeKeyboards[(idx + 1) % activeKeyboards.length]
                    selectKeyboard(next.id)
                    toast.success(`Switched to: ${next.name}`)
                  }}
                >
                  <RotateCcw className="h-4 w-4" />
                  Rotate to next active
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* JSON export lives here to keep the editor focused on layout work. */}
        {/* Library & configuration */}
        <section className="space-y-6 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Library & configuration</CardTitle>
              <CardDescription>Copy or export the combined configuration JSON.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={copyJson}>
                  <Copy className="h-4 w-4" />
                  Copy JSON
                </Button>
                <Button variant="neutral" onClick={downloadJson}>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
                <Button variant="neutral" onClick={() => setExportOpen(true)}>
                  Open export modal
                </Button>
              </div>
              <Textarea value={exportJson} readOnly className="mt-4 min-h-[520px] font-mono text-xs" />
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Delete confirmation */}
      <Dialog open={deleteKeyboardOpen} onOpenChange={setDeleteKeyboardOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete keyboard</DialogTitle>
            <DialogDescription>
              This will permanently delete the keyboard. Built-in keyboards cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="neutral" onClick={() => setDeleteKeyboardOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={deleteKeyboardConfirmed}
              className="bg-red-600 text-white border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
