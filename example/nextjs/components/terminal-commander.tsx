'use client'

import { useState, type RefObject } from 'react'
import type { TtydHandle } from 'react-ttyd'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

// Shared shortcut catalog used by the commander dialog.
const keyboardShortcuts = [
  { name: 'Ctrl+C', key: '\x03', description: 'Interrupt/Cancel current process' },
  { name: 'Ctrl+D', key: '\x04', description: 'End of file (EOF) / Exit' },
  { name: 'Ctrl+Z', key: '\x1a', description: 'Suspend current process' },
  { name: 'Ctrl+A', key: '\x01', description: 'Move cursor to beginning of line' },
  { name: 'Ctrl+E', key: '\x05', description: 'Move cursor to end of line' },
  { name: 'Ctrl+K', key: '\x0b', description: 'Kill/Delete from cursor to end of line' },
  { name: 'Ctrl+U', key: '\x15', description: 'Kill/Delete from cursor to beginning of line' },
  { name: 'Ctrl+W', key: '\x17', description: 'Delete word before cursor' },
  { name: 'Ctrl+L', key: '\x0c', description: 'Clear screen' },
  { name: 'Ctrl+R', key: '\x12', description: 'Reverse search command history' },
  { name: 'Tab', key: '\x09', description: 'Auto-complete' },
  { name: 'Escape', key: '\x1b', description: 'Escape key' },
]

type TerminalCommanderProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  terminalRef: RefObject<TtydHandle>
  isConnected: boolean
}

// Unified dialog so both examples expose the same command/paste/shortcut UX.
export function TerminalCommander({ open, onOpenChange, terminalRef, isConnected }: TerminalCommanderProps) {
  const [commandInput, setCommandInput] = useState('')
  const [pasteText, setPasteText] = useState('')

  const handleExecuteCommand = () => {
    if (!terminalRef.current || !commandInput.trim()) return
    terminalRef.current.execute(commandInput)
    setCommandInput('')
    onOpenChange(false)
  }

  const handlePasteText = () => {
    if (!terminalRef.current || !pasteText.trim()) return
    terminalRef.current.execute(pasteText, false)
    setPasteText('')
    onOpenChange(false)
  }

  const handleSendShortcut = (key: string) => {
    if (!terminalRef.current) return
    terminalRef.current.sendInput(key)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Terminal Commander</DialogTitle>
          <DialogDescription>Execute commands or paste text to the terminal.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="execute" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="execute">Execute</TabsTrigger>
            <TabsTrigger value="paste">Paste</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          </TabsList>
          <TabsContent value="execute" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="command">Command</Label>
              <Input
                id="command"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteCommand()
                  }
                }}
                placeholder="ls -la"
              />
              <p className="text-sm text-muted-foreground">This will execute the command immediately.</p>
            </div>
            <DialogFooter>
              <Button onClick={handleExecuteCommand} type="submit" disabled={!isConnected}>
                Execute
              </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="paste" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paste-text">Text to Paste</Label>
              <Textarea
                id="paste-text"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Enter multiple lines of text or commands..."
                className="min-h-[120px]"
              />
              <p className="text-sm text-muted-foreground">Click on any shortcut to send it to the terminal.</p>
              <ScrollArea className="h-[300px] rounded-base border-2 border-border bg-white">
                <div className="p-2 space-y-2">
                  {keyboardShortcuts.map((shortcut) => (
                    <Button
                      key={shortcut.name}
                      variant="neutral"
                      className="w-full h-auto py-3 px-4 justify-start text-left bg-secondary-background hover:bg-main hover:text-main-foreground transition-colors"
                      onClick={() => handleSendShortcut(shortcut.key)}
                      disabled={!isConnected}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-2">
                        <span className="font-mono font-bold text-sm">{shortcut.name}</span>
                        <span className="text-xs sm:text-sm text-muted-foreground sm:text-right flex-1">
                          {shortcut.description}
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button onClick={handlePasteText} type="button" disabled={!isConnected}>
                Paste
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
