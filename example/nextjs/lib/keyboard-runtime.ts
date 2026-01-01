'use client'

import {
  getSpecialKey,
  type ActionCode,
  type MacroDef,
  type SlotItem,
} from '@/app/keyboard-configurator/configurator-context'

type MacroPayload =
  | { type: 'command'; value: string; enter?: boolean }
  | { type: 'text'; value: string; enter?: boolean }
  | { type: 'sequence'; value: string }
  | { type: 'action'; action: ActionCode }

// Action list is duplicated here to validate macro payloads without importing UI state.
const KNOWN_ACTIONS: ActionCode[] = [
  'ROTATE_KEYBOARD',
  'OPEN_KEYBOARD_SETTINGS',
  'OPEN_MAIN_MENU',
  'OPEN_SECONDARY_MENU',
  'OPEN_KEYBOARD_MENU',
  'TOGGLE_COMMAND_PRESETS',
  'OPEN_COMMANDER',
  'PASTE_CLIPBOARD',
  'COPY_SELECTION',
  'CYCLE_TMUX_WINDOW',
]

const NO_CONNECTION_ACTIONS = new Set<ActionCode>([
  'OPEN_MAIN_MENU',
  'OPEN_SECONDARY_MENU',
  'OPEN_KEYBOARD_MENU',
  'ROTATE_KEYBOARD',
  'OPEN_KEYBOARD_SETTINGS',
])

function isActionCode(value: string): value is ActionCode {
  return KNOWN_ACTIONS.includes(value as ActionCode)
}

export function slotRequiresConnection(item: SlotItem): boolean {
  if (item.type === 'action') {
    return !NO_CONNECTION_ACTIONS.has(item.action)
  }
  return true
}

// Macro scripts support small JSON payloads for commands/text/sequences/actions.
export function parseMacroScript(script: string): MacroPayload | null {
  const trimmed = script.trim()
  if (!trimmed) return null
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object') return null
    if (parsed.type === 'command' && typeof parsed.value === 'string') {
      return { type: 'command', value: parsed.value, enter: parsed.enter === undefined ? true : Boolean(parsed.enter) }
    }
    if (parsed.type === 'text' && typeof parsed.value === 'string') {
      return { type: 'text', value: parsed.value, enter: parsed.enter === undefined ? false : Boolean(parsed.enter) }
    }
    if (parsed.type === 'sequence' && typeof parsed.value === 'string') {
      return { type: 'sequence', value: parsed.value }
    }
    if (parsed.type === 'action' && typeof parsed.action === 'string' && isActionCode(parsed.action)) {
      return { type: 'action', action: parsed.action }
    }
  } catch {
    return null
  }
  return null
}

export function runMacro(
  macro: MacroDef,
  {
    sendInput,
    executeCommand,
    onAction,
  }: {
    sendInput: (value: string) => void
    executeCommand?: (value: string, enter?: boolean) => void
    onAction: (action: ActionCode) => void
  },
) {
  const parsed = parseMacroScript(macro.script)
  if (!parsed) {
    sendInput(macro.script)
    return
  }

  switch (parsed.type) {
    case 'command': {
      if (executeCommand) {
        executeCommand(parsed.value, parsed.enter)
      } else {
        sendInput(parsed.value)
        if (parsed.enter) sendInput('\r')
      }
      return
    }
    case 'text': {
      sendInput(parsed.value)
      if (parsed.enter) sendInput('\r')
      return
    }
    case 'sequence': {
      sendInput(parsed.value)
      return
    }
    case 'action': {
      onAction(parsed.action)
      return
    }
    default:
      return
  }
}

export function runSlotItem(
  item: SlotItem,
  macros: MacroDef[],
  {
    sendInput,
    executeCommand,
    onAction,
    onMissingMacro,
  }: {
    sendInput: (value: string) => void
    executeCommand?: (value: string, enter?: boolean) => void
    onAction: (action: ActionCode) => void
    onMissingMacro?: (id: string) => void
  },
) {
  switch (item.type) {
    case 'character': {
      sendInput(item.char)
      return
    }
    case 'special': {
      const entry = getSpecialKey(item.code)
      if (entry?.sequence) {
        sendInput(entry.sequence)
      }
      return
    }
    case 'macro': {
      const macro = macros.find((m) => m.id === item.macroId)
      if (!macro) {
        onMissingMacro?.(item.macroId)
        return
      }
      runMacro(macro, { sendInput, executeCommand, onAction })
      return
    }
    case 'action': {
      onAction(item.action)
      return
    }
    default:
      return
  }
}
