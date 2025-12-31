'use client'

import * as React from 'react'
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Download,
  FileJson,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react'

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

/**
 * Keyboard Configurator
 *
 * Goal: standalone page inside a Next.js app that lets users build multiple keyboard layouts
 * and export/import the whole configuration as JSON for use in another app (e.g. React Native).
 *
 * NOTE: This page intentionally avoids extra UI dependencies (Radix dropdown/switch/tooltip)
 * beyond what already exists in the react-ttyd Next.js example.
 */

// -----------------------------
// Types / JSON Schema (v1)
// -----------------------------

type SpecialCode =
  | 'ALT'
  | 'ALT_B'
  | 'ALT_C'
  | 'ALT_DOWN'
  | 'ALT_G'
  | 'ALT_LEFT'
  | 'ALT_RIGHT'
  | 'ALT_S'
  | 'ALT_UP'
  | 'ALT_X'
  | 'ALT_Y'
  | 'ALT_Z'
  | 'ARROW_DOWN'
  | 'ARROW_LEFT'
  | 'ARROW_RIGHT'
  | 'ARROW_UP'
  | 'BACKSPACE'
  | 'CMD'
  | 'CTRL'
  | 'CTRL_A'
  | 'CTRL_B'
  | 'CTRL_B_N'
  | 'CTRL_C'
  | 'CTRL_D'
  | 'CTRL_DOWN'
  | 'CTRL_E'
  | 'CTRL_G'
  | 'CTRL_K'
  | 'CTRL_L'
  | 'CTRL_LEFT'
  | 'CTRL_R'
  | 'CTRL_RIGHT'
  | 'CTRL_U'
  | 'CTRL_UP'
  | 'CTRL_W'
  | 'CTRL_Z'
  | 'DELETE'
  | 'END'
  | 'ENTER'
  | 'ESC'
  | 'F1'
  | 'F10'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'F5'
  | 'F6'
  | 'F7'
  | 'F8'
  | 'F9'
  | 'HOME'
  | 'PAGE_DOWN'
  | 'PAGE_UP'
  | 'SHIFT'
  | 'SPACE'
  | 'TAB'

// Catalog entries used by the keyboard configurator.
// - `name`: human-readable label (full name)
// - `sequence`: exact terminal bytes sent for this key (undefined for pure modifiers)
// - `description`: short explanation for users
type SpecialKeyDefinition = {
  code: SpecialCode
  name: string
  description: string
  sequence?: string
  label?: string
  aliases?: string[]
  isModifier?: boolean
}

type ActionCode = 'ROTATE_KEYBOARD' | 'OPEN_KEYBOARD_SETTINGS'

type SlotItem =
  | {
      type: 'character'
      char: string
      label?: string
    }
  | {
      type: 'special'
      code: SpecialCode
      label?: string
    }
  | {
      type: 'macro'
      macroId: string
      label?: string
    }
  | {
      type: 'action'
      action: ActionCode
      label?: string
    }

type KeyboardGrid = (SlotItem | null)[][]

type TemplateId = 'blank' | 'qwerty' | 'navigation' | 'quality'

type MacroDef = {
  id: string
  name: string
  label: string
  category: string
  /**
   * Keep v0 simple: store a script blob as text (JSON or human-readable).
   * Your React Native app can interpret this however you want.
   */
  script: string
}

type KeyboardLayout = {
  id: string
  name: string
  builtIn: boolean
  active: boolean
  rotationOrder: number
  grid: KeyboardGrid
}

type KeyboardConfiguratorExportV1 = {
  version: 1
  meta: {
    generator: string
    generatedAt: string
  }
  defaultKeyboardId: string
  macros: MacroDef[]
  keyboards: KeyboardLayout[]
}

type LibraryTab = 'keys' | 'special' | 'macros' | 'actions'
type RightTab = 'library' | 'properties' | 'json'

type KeyboardFileV1 = {
  version: 1
  meta: {
    name: string
    savedAt: string
  }
  keyboard: KeyboardLayout
  macros: MacroDef[]
  isDefault: boolean
}

// -----------------------------
// Constants / Catalog
// -----------------------------

const GRID_ROWS = 4
const GRID_COLS = 10

function emptyGrid(rows = GRID_ROWS, cols = GRID_COLS): KeyboardGrid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => null))
}

// Key catalog for the configurator: every entry has a name, an exact terminal
// sequence (if applicable), and a description for the user to reference.
const SPECIAL_KEY_CATALOG: SpecialKeyDefinition[] = [
  // Tmux window navigation (F-keys)
  { code: 'F1', name: 'F1', label: 'F1', sequence: '\x1bOP', description: 'Jump to tmux window 1', aliases: ['Window 1'] },
  { code: 'F2', name: 'F2', label: 'F2', sequence: '\x1bOQ', description: 'Jump to tmux window 2', aliases: ['Window 2'] },
  { code: 'F3', name: 'F3', label: 'F3', sequence: '\x1bOR', description: 'Jump to tmux window 3', aliases: ['Window 3'] },
  { code: 'F4', name: 'F4', label: 'F4', sequence: '\x1bOS', description: 'Jump to tmux window 4', aliases: ['Window 4'] },
  { code: 'F5', name: 'F5', label: 'F5', sequence: '\x1b[15~', description: 'Jump to tmux window 5', aliases: ['Window 5'] },
  { code: 'F6', name: 'F6', label: 'F6', sequence: '\x1b[17~', description: 'Jump to tmux window 6', aliases: ['Window 6'] },
  { code: 'F7', name: 'F7', label: 'F7', sequence: '\x1b[18~', description: 'Jump to tmux window 7', aliases: ['Window 7'] },
  { code: 'F8', name: 'F8', label: 'F8', sequence: '\x1b[19~', description: 'Jump to tmux window 8', aliases: ['Window 8'] },
  { code: 'F9', name: 'F9', label: 'F9', sequence: '\x1b[20~', description: 'Jump to tmux window 9', aliases: ['Window 9'] },
  { code: 'F10', name: 'F10', label: 'F10', sequence: '\x1b[21~', description: 'Jump to tmux window 0', aliases: ['Window 0'] },
  { code: 'CTRL_LEFT', name: 'Ctrl+Left', label: 'Ctrl+←', sequence: '\x1b[1;5D', description: 'Previous active tmux window (skips ~)', aliases: ['Prev window', 'Previous window'] },
  { code: 'CTRL_RIGHT', name: 'Ctrl+Right', label: 'Ctrl+→', sequence: '\x1b[1;5C', description: 'Next active tmux window (skips ~)', aliases: ['Next window'] },
  { code: 'ALT_LEFT', name: 'Alt+Left', label: 'Alt+←', sequence: '\x1b[1;3D', description: 'Previous active tmux window (skips ~)', aliases: ['Prev window', 'Previous window'] },
  { code: 'ALT_RIGHT', name: 'Alt+Right', label: 'Alt+→', sequence: '\x1b[1;3C', description: 'Next active tmux window (skips ~)', aliases: ['Next window'] },
  { code: 'ALT_S', name: 'Alt+S', label: 'Alt+S', sequence: '\x1bs', description: 'Toggle tmux window inactive (~ prefix)', aliases: ['Toggle inactive', '~'] },
  { code: 'ALT_Y', name: 'Alt+Y', label: 'Alt+Y', sequence: '\x1by', description: 'Switch tmux session (main ↔ background)' },
  { code: 'ALT_Z', name: 'Alt+Z', label: 'Alt+Z', sequence: '\x1bz', description: 'Move tmux window between sessions (main ↔ background)' },
  { code: 'CTRL_B_N', name: 'Ctrl+B n', label: 'C-b n', sequence: '\x02n', description: 'Tmux next window (all, prefix + n)', aliases: ['Next window all'] },
  // Tmux pane navigation
  { code: 'ALT_C', name: 'Alt+C', label: 'Alt+C', sequence: '\x1bc', description: 'Jump to Claude pane (pane 0, zoom)', aliases: ['Claude'] },
  { code: 'ALT_G', name: 'Alt+G', label: 'Alt+G', sequence: '\x1bg', description: 'Jump to lazygit pane (pane 1, zoom)', aliases: ['lazygit', 'Git'] },
  { code: 'ALT_B', name: 'Alt+B', label: 'Alt+B', sequence: '\x1bb', description: 'Jump to bash pane (pane 2, zoom)', aliases: ['Bash'] },
  { code: 'ALT_X', name: 'Alt+X', label: 'Alt+X', sequence: '\x1bx', description: 'Jump to Codex pane (pane 3, zoom)', aliases: ['Codex'] },
  { code: 'CTRL_DOWN', name: 'Ctrl+Down', label: 'Ctrl+↓', sequence: '\x1b[1;5B', description: 'Cycle panes forward (0→1→2→3→0)' },
  { code: 'CTRL_UP', name: 'Ctrl+Up', label: 'Ctrl+↑', sequence: '\x1b[1;5A', description: 'Cycle panes backward (0→3→2→1→0)' },
  { code: 'ALT_DOWN', name: 'Alt+Down', label: 'Alt+↓', sequence: '\x1b[1;3B', description: 'Cycle panes forward (0→1→2→3→0)' },
  { code: 'ALT_UP', name: 'Alt+Up', label: 'Alt+↑', sequence: '\x1b[1;3A', description: 'Cycle panes backward (0→3→2→1→0)' },
  // Navigation keys
  { code: 'ARROW_UP', name: 'Arrow Up', label: '↑', sequence: '\x1b[A', description: 'Cursor up / line up' },
  { code: 'ARROW_DOWN', name: 'Arrow Down', label: '↓', sequence: '\x1b[B', description: 'Cursor down / line down' },
  { code: 'ARROW_LEFT', name: 'Arrow Left', label: '←', sequence: '\x1b[D', description: 'Cursor left' },
  { code: 'ARROW_RIGHT', name: 'Arrow Right', label: '→', sequence: '\x1b[C', description: 'Cursor right' },
  { code: 'HOME', name: 'Home', label: 'Home', sequence: '\x1b[H', description: 'Home' },
  { code: 'END', name: 'End', label: 'End', sequence: '\x1b[F', description: 'End' },
  { code: 'PAGE_UP', name: 'Page Up', label: 'PgUp', sequence: '\x1b[5~', description: 'Page up / enter copy mode' },
  { code: 'PAGE_DOWN', name: 'Page Down', label: 'PgDn', sequence: '\x1b[6~', description: 'Page down' },
  // Core terminal keys
  { code: 'ENTER', name: 'Enter', label: 'Enter', sequence: '\r', description: 'Enter / return' },
  { code: 'TAB', name: 'Tab', label: 'Tab', sequence: '\t', description: 'Tab / autocomplete' },
  { code: 'ESC', name: 'Esc', label: 'Esc', sequence: '\x1b', description: 'Escape' },
  { code: 'SPACE', name: 'Space', label: 'Space', sequence: ' ', description: 'Space' },
  { code: 'BACKSPACE', name: 'Backspace', label: '⌫', sequence: '\x08', description: 'Backspace' },
  { code: 'DELETE', name: 'Delete', label: 'Del', sequence: '\x7f', description: 'Delete' },
  // Common Ctrl shortcuts
  { code: 'CTRL_A', name: 'Ctrl+A', label: 'Ctrl+A', sequence: '\x01', description: 'Move cursor to start of line' },
  { code: 'CTRL_B', name: 'Ctrl+B', label: 'Ctrl+B', sequence: '\x02', description: 'tmux prefix / move backward one char' },
  { code: 'CTRL_C', name: 'Ctrl+C', label: 'Ctrl+C', sequence: '\x03', description: 'Interrupt / cancel' },
  { code: 'CTRL_D', name: 'Ctrl+D', label: 'Ctrl+D', sequence: '\x04', description: 'EOF / exit' },
  { code: 'CTRL_E', name: 'Ctrl+E', label: 'Ctrl+E', sequence: '\x05', description: 'Move cursor to end of line' },
  { code: 'CTRL_G', name: 'Ctrl+G', label: 'Ctrl+G', sequence: '\x07', description: 'Bell' },
  { code: 'CTRL_K', name: 'Ctrl+K', label: 'Ctrl+K', sequence: '\x0b', description: 'Kill to end of line' },
  { code: 'CTRL_L', name: 'Ctrl+L', label: 'Ctrl+L', sequence: '\x0c', description: 'Clear screen' },
  { code: 'CTRL_R', name: 'Ctrl+R', label: 'Ctrl+R', sequence: '\x12', description: 'Reverse search history' },
  { code: 'CTRL_U', name: 'Ctrl+U', label: 'Ctrl+U', sequence: '\x15', description: 'Kill to beginning of line' },
  { code: 'CTRL_W', name: 'Ctrl+W', label: 'Ctrl+W', sequence: '\x17', description: 'Delete word before cursor' },
  { code: 'CTRL_Z', name: 'Ctrl+Z', label: 'Ctrl+Z', sequence: '\x1a', description: 'Suspend process' },
  // Modifiers (no sequence by themselves)
  { code: 'SHIFT', name: 'Shift', label: 'Shift', description: 'Modifier key (no sequence)', isModifier: true },
  { code: 'CTRL', name: 'Ctrl', label: 'Ctrl', description: 'Modifier key (no sequence)', isModifier: true },
  { code: 'ALT', name: 'Alt', label: 'Alt', description: 'Modifier key (no sequence)', isModifier: true },
  { code: 'CMD', name: 'Cmd', label: 'Cmd', description: 'Modifier key (no sequence)', isModifier: true },
]

const SPECIAL_KEY_BY_CODE = new Map<SpecialCode, SpecialKeyDefinition>(
  SPECIAL_KEY_CATALOG.map((entry) => [entry.code, entry]),
)

function getSpecialKey(code: SpecialCode | string): SpecialKeyDefinition | undefined {
  return SPECIAL_KEY_BY_CODE.get(code as SpecialCode)
}

// Render control characters as readable escape sequences for UI display.
function formatSequence(sequence?: string): string {
  if (!sequence) return '—'
  let output = ''
  for (const ch of sequence) {
    const code = ch.charCodeAt(0)
    if (code === 9) output += '\\t'
    else if (code === 10) output += '\\n'
    else if (code === 13) output += '\\r'
    else if (code === 27) output += '\\x1b'
    else if (code === 127) output += '\\x7f'
    else if (code < 32) output += `\\x${code.toString(16).padStart(2, '0')}`
    else if (ch === '\\') output += '\\\\'
    else output += ch
  }
  return output
}

const ACTION_KEYS: Array<{ label: string; action: ActionCode }> = [
  { label: 'Rotate', action: 'ROTATE_KEYBOARD' },
  { label: 'Config', action: 'OPEN_KEYBOARD_SETTINGS' },
]

const CHAR_ROWS = {
  numbers: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  qwerty: ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  asdf: ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';'],
  zxcv: ['Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/'],
}

function buildDefaultMacros(): MacroDef[] {
  const quality = [
    { id: 'quality_auto', name: 'Quality: Auto', label: 'Auto' },
    { id: 'quality_144p', name: 'Quality: 144p', label: '144p' },
    { id: 'quality_240p', name: 'Quality: 240p', label: '240p' },
    { id: 'quality_360p', name: 'Quality: 360p', label: '360p' },
    { id: 'quality_480p', name: 'Quality: 480p', label: '480p' },
    { id: 'quality_720p', name: 'Quality: 720p', label: '720p' },
    { id: 'quality_1080p', name: 'Quality: 1080p', label: '1080p' },
    { id: 'quality_4k', name: 'Quality: 4K', label: '4K' },
  ]

  const nav = [
    { id: 'nav_back', name: 'Navigation: Back', label: 'Back' },
    { id: 'nav_forward', name: 'Navigation: Forward', label: 'Fwd' },
    { id: 'nav_refresh', name: 'Navigation: Refresh', label: '↻' },
    { id: 'nav_search', name: 'Navigation: Search', label: 'Search' },
  ]

  const system = [
    { id: 'sys_mute', name: 'System: Toggle Mute', label: 'Mute' },
    { id: 'sys_fullscreen', name: 'System: Toggle Fullscreen', label: 'Full' },
    { id: 'sys_screenshot', name: 'System: Screenshot', label: 'Shot' },
  ]

  const toMacro = (m: { id: string; name: string; label: string }, category: string): MacroDef => ({
    ...m,
    category,
    script:
      category === 'Quality'
        ? JSON.stringify({ type: 'setQuality', value: m.label }, null, 2)
        : JSON.stringify({ type: 'action', name: m.id }, null, 2),
  })

  return [
    ...quality.map((m) => toMacro(m, 'Quality')),
    ...nav.map((m) => toMacro(m, 'Navigation')),
    ...system.map((m) => toMacro(m, 'System')),
  ]
}

function slotLabel(item: SlotItem, macros: MacroDef[]): string {
  if (item.label && item.label.trim()) return item.label
  switch (item.type) {
    case 'character':
      return item.char
    case 'special':
      return getSpecialKey(item.code)?.label ?? getSpecialKey(item.code)?.name ?? item.code
    case 'action':
      return ACTION_KEYS.find((a) => a.action === item.action)?.label ?? item.action
    case 'macro': {
      const macro = macros.find((m) => m.id === item.macroId)
      return macro?.label ?? item.macroId
    }
  }
}

function slotTooltip(item: SlotItem, macros: MacroDef[]): string {
  if (item.type === 'special') {
    const entry = getSpecialKey(item.code)
    if (entry) {
      const sequence = entry.sequence ? formatSequence(entry.sequence) : '—'
      const sequenceLabel = entry.sequence ? `Sequence: ${sequence}` : 'Sequence: (none)'
      return `${entry.name} | ${entry.description} | ${sequenceLabel}`
    }
  }
  if (item.type === 'macro') {
    const macro = macros.find((m) => m.id === item.macroId)
    return macro ? `${macro.name} | macro` : item.macroId
  }
  const label = slotLabel(item, macros)
  return label
}

function applyTemplate(template: TemplateId): KeyboardGrid {
  if (template === 'blank') return emptyGrid()

  if (template === 'qwerty') {
    const g = emptyGrid()
    g[0] = CHAR_ROWS.numbers.map((c) => ({ type: 'character', char: c }))
    g[1] = CHAR_ROWS.qwerty.map((c) => ({ type: 'character', char: c }))
    g[2] = CHAR_ROWS.asdf.map((c) => ({ type: 'character', char: c }))
    g[3] = CHAR_ROWS.zxcv.map((c) => ({ type: 'character', char: c }))
    return g
  }

  if (template === 'navigation') {
    const g = emptyGrid()
    // Row 0: common nav keys
    const row0: SlotItem[] = [
      { type: 'special', code: 'HOME' },
      { type: 'special', code: 'END' },
      { type: 'special', code: 'PAGE_UP' },
      { type: 'special', code: 'PAGE_DOWN' },
      { type: 'special', code: 'ARROW_LEFT' },
      { type: 'special', code: 'ARROW_UP' },
      { type: 'special', code: 'ARROW_DOWN' },
      { type: 'special', code: 'ARROW_RIGHT' },
      { type: 'macro', macroId: 'nav_back' },
      { type: 'macro', macroId: 'nav_forward' },
    ]
    g[0] = row0
    // Row 1: editing keys
    g[1] = [
      { type: 'special', code: 'TAB' },
      { type: 'special', code: 'ESC' },
      { type: 'special', code: 'ENTER' },
      { type: 'special', code: 'BACKSPACE' },
      { type: 'special', code: 'SPACE' },
      { type: 'special', code: 'DELETE' },
      { type: 'macro', macroId: 'nav_refresh' },
      { type: 'macro', macroId: 'nav_search' },
      { type: 'action', action: 'ROTATE_KEYBOARD' },
      { type: 'action', action: 'OPEN_KEYBOARD_SETTINGS' },
    ]
    // Others empty
    return g
  }

  // quality
  const g = emptyGrid()
  // keep only macros that exist; if a macro doesn't exist, it will still reference by id
  const row0: SlotItem[] = [
    { type: 'macro', macroId: 'quality_auto' },
    { type: 'macro', macroId: 'quality_144p' },
    { type: 'macro', macroId: 'quality_240p' },
    { type: 'macro', macroId: 'quality_360p' },
    { type: 'macro', macroId: 'quality_480p' },
    { type: 'macro', macroId: 'quality_720p' },
    { type: 'macro', macroId: 'quality_1080p' },
    { type: 'macro', macroId: 'quality_4k' },
    { type: 'macro', macroId: 'sys_mute' },
    { type: 'macro', macroId: 'sys_fullscreen' },
  ]
  g[0] = row0
  g[1] = [
    { type: 'special', code: 'ESC' },
    { type: 'special', code: 'TAB' },
    { type: 'special', code: 'ENTER' },
    { type: 'special', code: 'BACKSPACE' },
    { type: 'special', code: 'SPACE' },
    { type: 'macro', macroId: 'sys_screenshot' },
    null,
    null,
    { type: 'action', action: 'ROTATE_KEYBOARD' },
    { type: 'action', action: 'OPEN_KEYBOARD_SETTINGS' },
  ]
  return g
}

function buildDefaultConfig(): KeyboardConfiguratorExportV1 {
  const macros = buildDefaultMacros()

  const quality: KeyboardLayout = {
    id: 'quality_keyboard',
    name: 'Quality Keyboard',
    builtIn: true,
    active: true,
    rotationOrder: 0,
    grid: applyTemplate('quality'),
  }

  const navigation: KeyboardLayout = {
    id: 'navigation_keyboard',
    name: 'Navigation Keyboard',
    builtIn: true,
    active: true,
    rotationOrder: 1,
    grid: applyTemplate('navigation'),
  }

  const qwerty: KeyboardLayout = {
    id: 'qwerty_keyboard',
    name: 'QWERTY Keyboard',
    builtIn: true,
    active: false,
    rotationOrder: 2,
    grid: applyTemplate('qwerty'),
  }

  return {
    version: 1,
    meta: {
      generator: 'keyboard-configurator',
      generatedAt: new Date().toISOString(),
    },
    defaultKeyboardId: quality.id,
    macros,
    keyboards: [quality, navigation, qwerty],
  }
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

function safeIdFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
}

function fileNameFromKeyboardName(name: string): string {
  return safeIdFromName(name) || 'keyboard'
}

function collectMacroIds(grid: KeyboardGrid): Set<string> {
  const ids = new Set<string>()
  grid.forEach((row) => {
    row.forEach((item) => {
      if (item?.type === 'macro') ids.add(item.macroId)
    })
  })
  return ids
}

function filterMacrosForGrid(macros: MacroDef[], grid: KeyboardGrid): MacroDef[] {
  const ids = collectMacroIds(grid)
  return macros.filter((macro) => ids.has(macro.id))
}

function buildMacrosByKeyboardId(keyboards: KeyboardLayout[], macros: MacroDef[]): Record<string, MacroDef[]> {
  return keyboards.reduce<Record<string, MacroDef[]>>((acc, keyboard) => {
    acc[keyboard.id] = filterMacrosForGrid(macros, keyboard.grid)
    return acc
  }, {})
}

function ensureMacrosForGrid(macros: MacroDef[], grid: KeyboardGrid, fallbackMacros: MacroDef[]): MacroDef[] {
  const required = filterMacrosForGrid(fallbackMacros, grid)
  if (required.length === 0) return macros
  const map = new Map(macros.map((macro) => [macro.id, macro]))
  required.forEach((macro) => {
    if (!map.has(macro.id)) map.set(macro.id, macro)
  })
  return Array.from(map.values())
}

function isExportV1(obj: unknown): obj is KeyboardConfiguratorExportV1 {
  if (!obj || typeof obj !== 'object') return false
  const record = obj as Record<string, unknown>
  return (
    record.version === 1 &&
    typeof record.defaultKeyboardId === 'string' &&
    Array.isArray(record.keyboards) &&
    Array.isArray(record.macros)
  )
}

// -----------------------------
// Drag payload
// -----------------------------

type DragPayload =
  | {
      source: 'palette'
      item: SlotItem
    }
  | {
      source: 'canvas'
      row: number
      col: number
    }

const DND_MIME = 'application/x-kbd-configurator'

function setDragPayload(ev: React.DragEvent, payload: DragPayload) {
  ev.dataTransfer.setData(DND_MIME, JSON.stringify(payload))
  ev.dataTransfer.effectAllowed = 'move'
}

function getDragPayload(ev: React.DragEvent): DragPayload | null {
  try {
    const raw = ev.dataTransfer.getData(DND_MIME)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

// -----------------------------
// Page
// -----------------------------

export default function KeyboardConfiguratorPage() {
  const defaultState = React.useMemo(() => {
    const base = buildDefaultConfig()
    const macrosByKeyboard = buildMacrosByKeyboardId(base.keyboards, base.macros)
    const defaultId = base.defaultKeyboardId || base.keyboards[0]?.id || ''
    return {
      config: {
        ...base,
        defaultKeyboardId: defaultId,
        macros: macrosByKeyboard[defaultId] ?? [],
      },
      macrosByKeyboard,
    }
  }, [])

  const [config, setConfig] = React.useState<KeyboardConfiguratorExportV1>(defaultState.config)
  const [selectedKeyboardId, setSelectedKeyboardId] = React.useState<string>(defaultState.config.defaultKeyboardId)
  const [macrosByKeyboardId, setMacrosByKeyboardId] = React.useState<Record<string, MacroDef[]>>(
    defaultState.macrosByKeyboard,
  )
  const [fileNameByKeyboardId, setFileNameByKeyboardId] = React.useState<Record<string, string>>({})
  const [pendingMetadataIds, setPendingMetadataIds] = React.useState<Set<string>>(() => new Set())
  const [isSaving, setIsSaving] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [selectedSlot, setSelectedSlot] = React.useState<{ row: number; col: number } | null>(null)
  const [libraryTab, setLibraryTab] = React.useState<LibraryTab>('keys')
  const [rightTab, setRightTab] = React.useState<RightTab>('library')
  const [search, setSearch] = React.useState('')
  const [dragOver, setDragOver] = React.useState<{ row: number; col: number } | null>(null)
  const [trashOver, setTrashOver] = React.useState(false)

  // dialogs
  const [importOpen, setImportOpen] = React.useState(false)
  const [exportOpen, setExportOpen] = React.useState(false)
  const [newKeyboardOpen, setNewKeyboardOpen] = React.useState(false)
  const [deleteKeyboardOpen, setDeleteKeyboardOpen] = React.useState(false)
  const [macroOpen, setMacroOpen] = React.useState(false)
  const [templateOpen, setTemplateOpen] = React.useState(false)

  // dialog state
  const [importText, setImportText] = React.useState('')
  const [newKeyboardName, setNewKeyboardName] = React.useState('')
  const [newKeyboardTemplate, setNewKeyboardTemplate] = React.useState<TemplateId>('blank')
  const [keyboardToDelete, setKeyboardToDelete] = React.useState<string | null>(null)

  const [newMacroName, setNewMacroName] = React.useState('')
  const [newMacroLabel, setNewMacroLabel] = React.useState('')
  const [newMacroCategory, setNewMacroCategory] = React.useState('Custom')
  const [newMacroScript, setNewMacroScript] = React.useState('')

  const [templateToApply, setTemplateToApply] = React.useState<TemplateId>('qwerty')
  const builtInMacros = React.useMemo(() => buildDefaultMacros(), [])

  const selectKeyboard = React.useCallback((id: string) => {
    setSelectedKeyboardId(id)
    setSelectedSlot(null)
  }, [])

  const updateMacrosForKeyboard = React.useCallback(
    (id: string, updater: (macros: MacroDef[]) => MacroDef[]) => {
      setMacrosByKeyboardId((prev) => ({
        ...prev,
        [id]: updater(prev[id] ?? []),
      }))
    },
    [],
  )

  const markMetadataDirty = React.useCallback((ids: string[]) => {
    setPendingMetadataIds((prev) => {
      const next = new Set(prev)
      ids.forEach((id) => next.add(id))
      return next
    })
  }, [])

  const loadKeyboards = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/keyboards', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load')
      const data = await response.json()
      const files = Array.isArray(data.files) ? (data.files as Array<{ fileName: string; data: KeyboardFileV1 }>) : []

      if (files.length === 0) {
        setConfig(defaultState.config)
        selectKeyboard(defaultState.config.defaultKeyboardId)
        setMacrosByKeyboardId(defaultState.macrosByKeyboard)
        setFileNameByKeyboardId({})
        setPendingMetadataIds(new Set())
        return
      }

      const keyboards: KeyboardLayout[] = []
      const macrosById: Record<string, MacroDef[]> = {}
      const fileNames: Record<string, string> = {}
      let defaultId = ''

      files.forEach((file) => {
        const { data: fileData } = file
        keyboards.push(fileData.keyboard)
        macrosById[fileData.keyboard.id] = fileData.macros ?? []
        fileNames[fileData.keyboard.id] = file.fileName
        if (!defaultId && fileData.isDefault) defaultId = fileData.keyboard.id
      })

      if (!defaultId && keyboards.length > 0) defaultId = keyboards[0].id

      setConfig({
        version: 1,
        meta: { generator: 'keyboard-configurator', generatedAt: new Date().toISOString() },
        defaultKeyboardId: defaultId,
        macros: macrosById[defaultId] ?? [],
        keyboards,
      })
      selectKeyboard(defaultId)
      setMacrosByKeyboardId(macrosById)
      setFileNameByKeyboardId(fileNames)
      setPendingMetadataIds(new Set())
    } catch {
      toast.error('Failed to load saved keyboards. Using defaults.')
      setConfig(defaultState.config)
      selectKeyboard(defaultState.config.defaultKeyboardId)
      setMacrosByKeyboardId(defaultState.macrosByKeyboard)
      setFileNameByKeyboardId({})
      setPendingMetadataIds(new Set())
    } finally {
      setIsLoading(false)
    }
  }, [defaultState, selectKeyboard])

  React.useEffect(() => {
    loadKeyboards()
  }, [loadKeyboards])

  React.useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      macros: macrosByKeyboardId[selectedKeyboardId] ?? [],
    }))
  }, [macrosByKeyboardId, selectedKeyboardId])

  const selectedKeyboard = React.useMemo(() => {
    return config.keyboards.find((k) => k.id === selectedKeyboardId) ?? config.keyboards[0]
  }, [config.keyboards, selectedKeyboardId])

  const activeKeyboards = React.useMemo(() => {
    return [...config.keyboards]
      .filter((k) => k.active)
      .sort((a, b) => (a.rotationOrder ?? 0) - (b.rotationOrder ?? 0))
  }, [config.keyboards])

  const exportMacros = React.useMemo(() => {
    const seen = new Map<string, MacroDef>()
    config.keyboards.forEach((keyboard) => {
      const macros = macrosByKeyboardId[keyboard.id] ?? []
      macros.forEach((macro) => {
        if (!seen.has(macro.id)) seen.set(macro.id, macro)
      })
    })
    return Array.from(seen.values())
  }, [config.keyboards, macrosByKeyboardId])

  const exportJson = React.useMemo(() => {
    const sanitized: KeyboardConfiguratorExportV1 = {
      ...config,
      meta: {
        generator: 'keyboard-configurator',
        generatedAt: new Date().toISOString(),
      },
      macros: exportMacros,
      keyboards: [...config.keyboards]
        .map((k) => ({
          ...k,
          // normalize rotationOrder: active keyboards first, sequential
          rotationOrder: k.rotationOrder ?? 0,
        }))
        .sort((a, b) => a.rotationOrder - b.rotationOrder),
    }
    return JSON.stringify(sanitized, null, 2)
  }, [config, exportMacros])

  // -----------------------------
  // Mutations
  // -----------------------------

  function updateKeyboard(id: string, updater: (k: KeyboardLayout) => KeyboardLayout) {
    setConfig((prev) => ({
      ...prev,
      keyboards: prev.keyboards.map((k) => (k.id === id ? updater(k) : k)),
    }))
  }

  function ensureAtLeastOneActive(nextKeyboards: KeyboardLayout[]): boolean {
    const activeCount = nextKeyboards.filter((k) => k.active).length
    if (activeCount >= 1) return true
    toast.error('You must keep at least one keyboard active.')
    return false
  }

  function normalizeRotationOrders(nextKeyboards: KeyboardLayout[]): KeyboardLayout[] {
    const active = nextKeyboards.filter((k) => k.active).sort((a, b) => a.rotationOrder - b.rotationOrder)
    const inactive = nextKeyboards.filter((k) => !k.active)
    const reOrderedActive = active.map((k, idx) => ({ ...k, rotationOrder: idx }))
    // keep inactive rotationOrder after actives (still deterministic)
    const reOrderedInactive = inactive.map((k, idx) => ({ ...k, rotationOrder: reOrderedActive.length + idx }))
    return [...reOrderedActive, ...reOrderedInactive]
  }

  function setDefaultKeyboard(id: string) {
    setConfig((prev) => {
      if (prev.defaultKeyboardId === id) return prev
      markMetadataDirty([prev.defaultKeyboardId, id].filter(Boolean))
      return { ...prev, defaultKeyboardId: id }
    })
    toast.success('Default keyboard set.')
  }

  function toggleKeyboardActive(id: string, active: boolean) {
    setConfig((prev) => {
      const next = prev.keyboards.map((k) => (k.id === id ? { ...k, active } : k))
      if (!ensureAtLeastOneActive(next)) return prev
      const normalized = normalizeRotationOrders(next)
      markMetadataDirty(normalized.map((k) => k.id))
      return { ...prev, keyboards: normalized }
    })
  }

  function moveActiveKeyboard(id: string, dir: -1 | 1) {
    setConfig((prev) => {
      const active = prev.keyboards.filter((k) => k.active).sort((a, b) => a.rotationOrder - b.rotationOrder)
      const idx = active.findIndex((k) => k.id === id)
      if (idx < 0) return prev
      const swapWith = idx + dir
      if (swapWith < 0 || swapWith >= active.length) return prev

      const reordered = [...active]
      const tmp = reordered[idx]
      reordered[idx] = reordered[swapWith]
      reordered[swapWith] = tmp

      const updated = prev.keyboards.map((k) => {
        const nIdx = reordered.findIndex((x) => x.id === k.id)
        if (nIdx >= 0) return { ...k, rotationOrder: nIdx }
        return k
      })

      const normalized = normalizeRotationOrders(updated)
      markMetadataDirty(normalized.map((k) => k.id))
      return { ...prev, keyboards: normalized }
    })
  }

  function createKeyboard() {
    const name = newKeyboardName.trim()
    if (!name) {
      toast.error('Name is required.')
      return
    }
    const baseId = safeIdFromName(name)
    const uniqueId = `${baseId || 'keyboard'}_${Date.now().toString(36)}`
    const grid = applyTemplate(newKeyboardTemplate)

    const nextKeyboard: KeyboardLayout = {
      id: uniqueId,
      name,
      builtIn: false,
      active: false,
      rotationOrder: config.keyboards.length,
      grid,
    }

    setConfig((prev) => {
      const normalized = normalizeRotationOrders([...prev.keyboards, nextKeyboard])
      markMetadataDirty(normalized.map((k) => k.id))
      return { ...prev, keyboards: normalized }
    })
    updateMacrosForKeyboard(nextKeyboard.id, () =>
      ensureMacrosForGrid(config.macros, grid, builtInMacros),
    )
    selectKeyboard(nextKeyboard.id)
    setNewKeyboardOpen(false)
    setNewKeyboardName('')
    setNewKeyboardTemplate('blank')
    toast.success('Keyboard created.')
  }

  function duplicateKeyboard(id: string) {
    const source = config.keyboards.find((k) => k.id === id)
    if (!source) return
    const copy: KeyboardLayout = {
      ...deepClone(source),
      id: `${source.id}_copy_${Date.now().toString(36)}`,
      name: `${source.name} (Copy)`,
      builtIn: false,
      active: false,
      rotationOrder: config.keyboards.length,
    }
    setConfig((prev) => {
      const normalized = normalizeRotationOrders([...prev.keyboards, copy])
      markMetadataDirty(normalized.map((k) => k.id))
      return { ...prev, keyboards: normalized }
    })
    setMacrosByKeyboardId((prev) => ({
      ...prev,
      [copy.id]: deepClone(macrosByKeyboardId[source.id] ?? []),
    }))
    toast.success('Keyboard duplicated.')
  }

  function requestDeleteKeyboard(id: string) {
    setKeyboardToDelete(id)
    setDeleteKeyboardOpen(true)
  }

  async function deleteKeyboardConfirmed() {
    const id = keyboardToDelete
    if (!id) return
    const kb = config.keyboards.find((k) => k.id === id)
    if (!kb) return
    if (kb.builtIn) {
      toast.error('Built-in keyboards cannot be deleted.')
      return
    }

    const remaining = normalizeRotationOrders(config.keyboards.filter((k) => k.id !== id))
    if (!ensureAtLeastOneActive(remaining)) return

    const nextDefault =
      config.defaultKeyboardId === id
        ? remaining.find((k) => k.active)?.id ?? remaining[0]?.id
        : config.defaultKeyboardId

    const fileName = fileNameByKeyboardId[id]
    if (fileName) {
      const response = await fetch(`/api/keyboards/${encodeURIComponent(fileName)}`, { method: 'DELETE' })
      if (!response.ok) {
        toast.error('Failed to delete keyboard file.')
        return
      }
    }

    setConfig((prev) => ({
      ...prev,
      defaultKeyboardId: nextDefault,
      keyboards: remaining,
    }))
    markMetadataDirty(remaining.map((k) => k.id))
    setMacrosByKeyboardId((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setFileNameByKeyboardId((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setPendingMetadataIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

    // adjust selection
    if (selectedKeyboardId === id) {
      const fallback = remaining[0]?.id
      if (fallback) selectKeyboard(fallback)
    }

    setDeleteKeyboardOpen(false)
    setKeyboardToDelete(null)
    toast.success('Keyboard deleted.')
  }

  function setSlot(row: number, col: number, item: SlotItem | null) {
    updateKeyboard(selectedKeyboard.id, (k) => {
      const next = deepClone(k)
      next.grid[row][col] = item
      return next
    })
  }

  function swapSlots(a: { row: number; col: number }, b: { row: number; col: number }) {
    updateKeyboard(selectedKeyboard.id, (k) => {
      const next = deepClone(k)
      const tmp = next.grid[a.row][a.col]
      next.grid[a.row][a.col] = next.grid[b.row][b.col]
      next.grid[b.row][b.col] = tmp
      return next
    })
  }

  function applyTemplateToSelected() {
    const grid = applyTemplate(templateToApply)
    updateKeyboard(selectedKeyboard.id, (k) => ({ ...k, grid }))
    updateMacrosForKeyboard(selectedKeyboard.id, (prev) => ensureMacrosForGrid(prev, grid, builtInMacros))
    setTemplateOpen(false)
    setSelectedSlot(null)
    toast.success('Template applied.')
  }

  function resetToDefaults() {
    const defaults = buildDefaultConfig()
    const macrosMap = buildMacrosByKeyboardId(defaults.keyboards, defaults.macros)
    const defaultId = defaults.defaultKeyboardId || defaults.keyboards[0]?.id || ''
    setConfig({
      ...defaults,
      defaultKeyboardId: defaultId,
      macros: macrosMap[defaultId] ?? [],
    })
    setMacrosByKeyboardId(macrosMap)
    setFileNameByKeyboardId({})
    setPendingMetadataIds(new Set(defaults.keyboards.map((k) => k.id)))
    selectKeyboard(defaultId)
    toast.success('Reset to defaults.')
  }

  // -----------------------------
  // Persistence
  // -----------------------------

  async function saveKeyboards() {
    if (isSaving) return
    if (!selectedKeyboard) return
    const idsToSave = new Set([...pendingMetadataIds, selectedKeyboard.id])

    if (idsToSave.size === 0) {
      toast('Nothing to save yet.')
      return
    }

    setIsSaving(true)

    const nextFileNames = { ...fileNameByKeyboardId }
    const nextMacros = { ...macrosByKeyboardId }
    const savedIds: string[] = []
    const failedIds: string[] = []

    for (const id of idsToSave) {
      const keyboard = config.keyboards.find((k) => k.id === id)
      if (!keyboard) continue
      if (!keyboard.name.trim()) {
        failedIds.push(id)
        continue
      }

      const macros = nextMacros[id] ?? []
      const prunedMacros = filterMacrosForGrid(macros, keyboard.grid)
      const isDefault = config.defaultKeyboardId === keyboard.id
      const previousFileName = nextFileNames[id] ?? null

      try {
        const response = await fetch('/api/keyboards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyboard,
            macros: prunedMacros,
            isDefault,
            previousFileName,
          }),
        })

        if (!response.ok) {
          failedIds.push(id)
          continue
        }

        const payload = await response.json()
        const fileName =
          typeof payload.fileName === 'string' ? payload.fileName : fileNameFromKeyboardName(keyboard.name)

        nextFileNames[id] = fileName
        nextMacros[id] = prunedMacros
        savedIds.push(id)
      } catch {
        failedIds.push(id)
      }
    }

    setFileNameByKeyboardId(nextFileNames)
    setMacrosByKeyboardId(nextMacros)
    setPendingMetadataIds((prev) => {
      const next = new Set(prev)
      savedIds.forEach((id) => next.delete(id))
      return next
    })

    if (savedIds.length > 0) toast.success('Keyboard saved.')
    if (failedIds.length > 0) toast.error('Some keyboards failed to save.')

    setIsSaving(false)
  }

  // -----------------------------
  // Export / Import
  // -----------------------------

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(exportJson)
      toast.success('Configuration copied to clipboard.')
    } catch {
      toast.error('Copy failed. Try selecting the JSON and copying manually.')
    }
  }

  function downloadJson() {
    try {
      const blob = new Blob([exportJson], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `keyboard-config-v1-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Downloaded JSON.')
    } catch {
      toast.error('Download failed.')
    }
  }

  function importJson() {
    let parsed: unknown
    try {
      parsed = JSON.parse(importText)
    } catch {
      toast.error('Invalid JSON.')
      return
    }

    if (!isExportV1(parsed)) {
      toast.error('JSON does not match schema (version 1).')
      return
    }

    // minimal safety: ensure grids are rectangular
    const repaired = deepClone(parsed) as KeyboardConfiguratorExportV1
    repaired.keyboards = repaired.keyboards.map((k) => ({
      ...k,
      grid: normalizeGrid(k.grid),
    }))

    if (!repaired.keyboards.find((k) => k.id === repaired.defaultKeyboardId)) {
      repaired.defaultKeyboardId = repaired.keyboards[0]?.id ?? ''
    }

    if (!ensureAtLeastOneActive(repaired.keyboards)) {
      // if none active, force default active
      repaired.keyboards = repaired.keyboards.map((k) => (k.id === repaired.defaultKeyboardId ? { ...k, active: true } : k))
    }

    repaired.keyboards = normalizeRotationOrders(repaired.keyboards)

    const macrosMap = buildMacrosByKeyboardId(repaired.keyboards, repaired.macros)
    const defaultId = repaired.defaultKeyboardId || repaired.keyboards[0]?.id || ''

    setConfig({
      ...repaired,
      defaultKeyboardId: defaultId,
      macros: macrosMap[defaultId] ?? [],
    })
    setMacrosByKeyboardId(macrosMap)
    setFileNameByKeyboardId({})
    setPendingMetadataIds(new Set(repaired.keyboards.map((k) => k.id)))
    selectKeyboard(defaultId)
    setImportOpen(false)
    setImportText('')
    toast.success('Configuration imported.')
  }

  function normalizeGrid(grid: unknown): KeyboardGrid {
    // ensure [GRID_ROWS][GRID_COLS]
    const g = emptyGrid()
    if (!Array.isArray(grid)) return g
    for (let r = 0; r < Math.min(GRID_ROWS, grid.length); r++) {
      if (!Array.isArray(grid[r])) continue
      for (let c = 0; c < Math.min(GRID_COLS, grid[r].length); c++) {
        const item = grid[r][c]
        if (!item) continue
        // very shallow validation
        if (item.type === 'character' && typeof item.char === 'string') g[r][c] = item
        else if (item.type === 'special' && typeof item.code === 'string') g[r][c] = item
        else if (item.type === 'macro' && typeof item.macroId === 'string') g[r][c] = item
        else if (item.type === 'action' && typeof item.action === 'string') g[r][c] = item
      }
    }
    return g
  }

  // -----------------------------
  // Macro management
  // -----------------------------

  function createMacro() {
    const name = newMacroName.trim()
    const label = (newMacroLabel.trim() || name.slice(0, 8) || 'Macro').trim()
    if (!name) {
      toast.error('Macro name is required.')
      return
    }
    const idBase = safeIdFromName(name) || 'macro'
    const id = `${idBase}_${Date.now().toString(36)}`
    const macro: MacroDef = {
      id,
      name,
      label,
      category: newMacroCategory.trim() || 'Custom',
      script: newMacroScript?.trim() || JSON.stringify({ type: 'custom', name }, null, 2),
    }
    updateMacrosForKeyboard(selectedKeyboard.id, (prev) => [...prev, macro])
    setMacroOpen(false)
    setNewMacroName('')
    setNewMacroLabel('')
    setNewMacroCategory('Custom')
    setNewMacroScript('')
    toast.success('Macro created.')
  }

  // -----------------------------
  // DnD handlers
  // -----------------------------

  function onCanvasDragStart(ev: React.DragEvent, row: number, col: number) {
    setDragPayload(ev, { source: 'canvas', row, col })
  }

  function onSlotDragOver(ev: React.DragEvent, row: number, col: number) {
    ev.preventDefault()
    setDragOver({ row, col })
    ev.dataTransfer.dropEffect = 'move'
  }

  function onSlotDrop(ev: React.DragEvent, row: number, col: number) {
    ev.preventDefault()
    setDragOver(null)
    const payload = getDragPayload(ev)
    if (!payload) return

    if (payload.source === 'palette') {
      setSlot(row, col, payload.item)
      setSelectedSlot({ row, col })
      return
    }

    if (payload.source === 'canvas') {
      // swap if different
      if (payload.row === row && payload.col === col) return
      swapSlots({ row: payload.row, col: payload.col }, { row, col })
      setSelectedSlot({ row, col })
    }
  }

  function onTrashDragOver(ev: React.DragEvent) {
    ev.preventDefault()
    setTrashOver(true)
    ev.dataTransfer.dropEffect = 'move'
  }

  function onTrashDrop(ev: React.DragEvent) {
    ev.preventDefault()
    setTrashOver(false)
    const payload = getDragPayload(ev)
    if (!payload) return
    if (payload.source === 'canvas') {
      setSlot(payload.row, payload.col, null)
      if (selectedSlot?.row === payload.row && selectedSlot?.col === payload.col) {
        setSelectedSlot(null)
      }
    }
  }

  // -----------------------------
  // Derived lists for palette
  // -----------------------------

  const paletteCharacters = React.useMemo(() => {
    // all characters we expose: letters + numbers + common punctuation
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    const digits = '0123456789'.split('')
    const punct = ['.', ',', ';', ':', '/', '\\', "'", '"', '-', '_', '=', '+', '(', ')', '[', ']', '{', '}', '?', '!', '@', '#', '$', '%', '^', '&', '*']
    const all = [...digits, ...letters, ...punct]
    const q = search.trim().toLowerCase()
    const filtered = !q
      ? all
      : all.filter((c) => c.toLowerCase().includes(q))
    return filtered.map<SlotItem>((c) => ({ type: 'character', char: c }))
  }, [search])

  const paletteSpecial = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return SPECIAL_KEY_CATALOG
      .filter((entry) => {
        if (!q) return true
        const haystack = [
          entry.name,
          entry.label,
          entry.description,
          entry.code,
          entry.sequence ? formatSequence(entry.sequence) : '',
          ...(entry.aliases ?? []),
        ]
          .filter(Boolean)
          .map((value) => value.toLowerCase())
        return haystack.some((value) => value.includes(q))
      })
      .map<SlotItem>((entry) => ({
        type: 'special',
        code: entry.code,
        ...(entry.label ? { label: entry.label } : {}),
      }))
  }, [search])

  const paletteActions = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return ACTION_KEYS.filter((a) => !q || a.label.toLowerCase().includes(q) || a.action.toLowerCase().includes(q)).map<SlotItem>((a) => ({
      type: 'action',
      action: a.action,
      label: a.label,
    }))
  }, [search])

  const paletteMacros = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = config.macros.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.label.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q),
    )
    // Group by category (stable)
    const byCat = new Map<string, MacroDef[]>()
    filtered.forEach((m) => {
      const key = m.category || 'Uncategorized'
      const arr = byCat.get(key) ?? []
      arr.push(m)
      byCat.set(key, arr)
    })
    return Array.from(byCat.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [config.macros, search])

  // -----------------------------
  // Selected slot helpers
  // -----------------------------

  const selectedItem = React.useMemo(() => {
    if (!selectedSlot) return null
    return selectedKeyboard.grid[selectedSlot.row]?.[selectedSlot.col] ?? null
  }, [selectedKeyboard.grid, selectedSlot])

  const selectedSpecial = React.useMemo(() => {
    if (selectedItem?.type !== 'special') return null
    return getSpecialKey(selectedItem.code)
  }, [selectedItem])

  const selectedItemLabel = selectedItem ? slotLabel(selectedItem, config.macros) : ''

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

      <main className="grid w-full grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(240px,360px)_minmax(0,1fr)_minmax(280px,440px)] lg:px-8 2xl:mx-auto 2xl:max-w-[1600px]">
        {/* Left: keyboard management */}
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
                          onValueChange={(v) => setNewKeyboardTemplate(v as TemplateId)}
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
                    {config.keyboards.map((k) => {
                      const isSelected = k.id === selectedKeyboardId
                      const isDefault = k.id === config.defaultKeyboardId
                      return (
                        <div
                          key={k.id}
                          className={cn(
                            'flex items-center gap-2 rounded-base border-2 border-transparent px-2 py-2 transition-colors',
                            isSelected ? 'bg-main text-main-foreground border-border' : 'hover:bg-secondary-background',
                          )}
                        >
                          <button
                            className="flex min-w-0 flex-1 items-center gap-2 text-left"
                            onClick={() => {
                              selectKeyboard(k.id)
                            }}
                            type="button"
                          >
                            <span className="truncate font-base">{k.name}</span>
                            {k.builtIn ? <Badge variant="neutral">Built-in</Badge> : null}
                            {isDefault ? <Badge>Default</Badge> : null}
                          </button>

                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={k.active}
                              onChange={(e) => toggleKeyboardActive(k.id, e.target.checked)}
                              aria-label={`Toggle ${k.name} active`}
                            />
                            <span className={cn('hidden sm:inline', isSelected ? 'text-main-foreground/90' : 'text-foreground/70')}>Active</span>
                          </label>

                          {!isDefault ? (
                            <Button
                              size="sm"
                              variant={isSelected ? 'noShadow' : 'neutral'}
                              onClick={() => setDefaultKeyboard(k.id)}
                            >
                              Set
                            </Button>
                          ) : (
                            <span className={cn('px-2 text-xs', isSelected ? 'text-main-foreground/90' : 'text-foreground/70')}>✓</span>
                          )}

                          <Button
                            size="icon"
                            variant={isSelected ? 'noShadow' : 'neutral'}
                            onClick={() => duplicateKeyboard(k.id)}
                            aria-label={`Duplicate ${k.name}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant={isSelected ? 'noShadow' : 'neutral'}
                            onClick={() => requestDeleteKeyboard(k.id)}
                            aria-label={`Delete ${k.name}`}
                            disabled={k.builtIn}
                            className={cn(k.builtIn ? '' : 'text-red-600')}
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
                    activeKeyboards.map((k, idx) => (
                      <div key={k.id} className="flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-2 py-2">
                        <span className="w-6 text-center text-xs text-foreground/70">{idx + 1}</span>
                        <span className="flex-1 truncate text-sm">{k.name}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="neutral"
                            onClick={() => moveActiveKeyboard(k.id, -1)}
                            disabled={idx === 0}
                            aria-label="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="neutral"
                            onClick={() => moveActiveKeyboard(k.id, 1)}
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

        {/* Center: editor */}
        <section className="space-y-6 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="truncate">Editing: {selectedKeyboard.name}</CardTitle>
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
                        <Select value={templateToApply} onValueChange={(v) => setTemplateToApply(v as TemplateId)}>
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
                                  setRightTab('properties')
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

          {/* optional tiny preview for active rotation */}
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
                    const idx = activeKeyboards.findIndex((k) => k.id === selectedKeyboardId)
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

        {/* Right: library / properties / json */}
        <section className="space-y-6 min-w-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Library & configuration</CardTitle>
              <CardDescription>Drag from the library, edit slot properties, export JSON.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as RightTab)}>
                <TabsList className="w-full">
                  <TabsTrigger value="library" className="flex-1">
                    Library
                  </TabsTrigger>
                  <TabsTrigger value="properties" className="flex-1">
                    Properties
                  </TabsTrigger>
                  <TabsTrigger value="json" className="flex-1">
                    JSON
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="library" className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search</Label>
                    <Input id="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search keys, macros…" />
                  </div>

                  <Tabs value={libraryTab} onValueChange={(v) => setLibraryTab(v as LibraryTab)}>
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
                </TabsContent>

                <TabsContent value="properties" className="mt-4 space-y-4">
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
                </TabsContent>

                <TabsContent value="json" className="mt-4 space-y-3">
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
                  <Textarea value={exportJson} readOnly className="min-h-[520px] font-mono text-xs" />
                </TabsContent>
              </Tabs>
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
