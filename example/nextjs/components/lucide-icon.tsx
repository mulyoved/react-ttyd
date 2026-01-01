'use client'

import * as React from 'react'
import type { LucideProps } from 'lucide-react'
import { DynamicIcon, iconNames, type IconName } from 'lucide-react/dynamic'

const kebabToPascal = (name: string): string =>
  name
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')

const pascalToKebab = (name: string): string =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()

const ICON_NAME_MAP = new Map<string, string>()
const iconNamesPascal = Array.from(
  new Set(
    iconNames.map((kebab) => {
      const pascal = kebabToPascal(kebab)
      if (!ICON_NAME_MAP.has(pascal)) {
        ICON_NAME_MAP.set(pascal, kebab)
      }
      return pascal
    }),
  ),
).sort()

export const LUCIDE_ICON_NAMES = iconNamesPascal

type LucideIconProps = LucideProps & {
  name: string
}

// Render a Lucide icon by PascalCase name using the official dynamic loader.
export function LucideIcon({ name, ...props }: LucideIconProps) {
  const kebabName = React.useMemo(() => ICON_NAME_MAP.get(name) ?? pascalToKebab(name), [name])
  const isValid = ICON_NAME_MAP.has(name) || iconNames.includes(kebabName)
  if (!name || !isValid) return null

  return <DynamicIcon name={kebabName as IconName} aria-hidden="true" focusable="false" {...props} />
}
