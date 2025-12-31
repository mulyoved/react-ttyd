import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const DATA_DIR = path.join(process.cwd(), 'data', 'keyboards')

function safeIdFromName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { name: string } },
) {
  try {
    const { name } = params
    const safeName = safeIdFromName(name)
    if (!safeName || safeName !== name) {
      return NextResponse.json({ error: 'Invalid keyboard name' }, { status: 400 })
    }

    await ensureDataDir()

    const targetPath = path.join(DATA_DIR, `${name}.json`)
    try {
      await fs.stat(targetPath)
    } catch {
      return NextResponse.json({ error: 'Keyboard file not found' }, { status: 404 })
    }

    await fs.rm(targetPath)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete keyboard' }, { status: 500 })
  }
}
