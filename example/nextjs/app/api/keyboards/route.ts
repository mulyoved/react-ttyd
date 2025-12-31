import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type MacroDef = {
  id: string
  name: string
  label: string
  category: string
  script: string
}

type SlotItem =
  | { type: 'character'; char: string; label?: string }
  | { type: 'special'; code: string; label?: string }
  | { type: 'macro'; macroId: string; label?: string }
  | { type: 'action'; action: string; label?: string }

type KeyboardGrid = (SlotItem | null)[][]

type KeyboardLayout = {
  id: string
  name: string
  builtIn: boolean
  active: boolean
  rotationOrder: number
  grid: KeyboardGrid
}

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

type KeyboardSavePayload = {
  keyboard: KeyboardLayout
  macros: MacroDef[]
  isDefault: boolean
  previousFileName?: string | null
}

const DATA_DIR = path.join(process.cwd(), 'data', 'keyboards')

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

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
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

function isKeyboardFileV1(value: unknown): value is KeyboardFileV1 {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    record.version === 1 &&
    typeof record.keyboard === 'object' &&
    Array.isArray(record.macros) &&
    typeof record.isDefault === 'boolean'
  )
}

export async function GET() {
  try {
    await ensureDataDir()
    const entries = await fs.readdir(DATA_DIR, { withFileTypes: true })
    const files = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b))

    const results: Array<{ fileName: string; data: KeyboardFileV1 }> = []

    for (const file of files) {
      const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf8')
      const parsed = JSON.parse(raw)
      if (!isKeyboardFileV1(parsed)) {
        return NextResponse.json({ error: `Invalid keyboard file: ${file}` }, { status: 500 })
      }
      results.push({
        fileName: file.replace(/\.json$/, ''),
        data: parsed,
      })
    }

    return NextResponse.json({ files: results })
  } catch {
    return NextResponse.json({ error: 'Failed to load keyboards' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as KeyboardSavePayload
    const keyboard = payload?.keyboard
    if (!keyboard?.name) {
      return NextResponse.json({ error: 'Keyboard name is required' }, { status: 400 })
    }

    await ensureDataDir()

    const fileName = fileNameFromKeyboardName(keyboard.name)
    const targetPath = path.join(DATA_DIR, `${fileName}.json`)
    const macroIds = Array.isArray(keyboard.grid) ? collectMacroIds(keyboard.grid) : new Set<string>()
    const macros = Array.isArray(payload.macros) ? payload.macros : []
    const prunedMacros = macros.filter((macro) => macroIds.has(macro.id))

    const data: KeyboardFileV1 = {
      version: 1,
      meta: {
        name: keyboard.name,
        savedAt: new Date().toISOString(),
      },
      keyboard,
      macros: prunedMacros,
      isDefault: !!payload.isDefault,
    }

    await fs.writeFile(targetPath, JSON.stringify(data, null, 2), 'utf8')

    const previousFileName =
      typeof payload.previousFileName === 'string' ? payload.previousFileName : null
    if (previousFileName && previousFileName !== fileName) {
      const safePrevious = safeIdFromName(previousFileName)
      if (safePrevious === previousFileName) {
        const previousPath = path.join(DATA_DIR, `${previousFileName}.json`)
        if (previousPath !== targetPath) {
          await fs.rm(previousPath, { force: true })
        }
      }
    }

    return NextResponse.json({ fileName })
  } catch {
    return NextResponse.json({ error: 'Failed to save keyboard' }, { status: 500 })
  }
}
