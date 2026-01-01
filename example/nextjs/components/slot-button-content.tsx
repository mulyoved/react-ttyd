'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { resolveSlotIconName, type SlotItem } from '@/app/keyboard-configurator/configurator-context'
import { LucideIcon } from '@/components/lucide-icon'

type SlotButtonContentProps = {
  item: SlotItem
  label: string
  className?: string
  iconClassName?: string
  labelClassName?: string
  iconLabelClassName?: string
}

// Shared slot rendering for keybars/grids: show icon + label when an icon is available.
export function SlotButtonContent({
  item,
  label,
  className,
  iconClassName,
  labelClassName,
  iconLabelClassName,
}: SlotButtonContentProps) {
  const iconName = resolveSlotIconName(item)

  if (iconName) {
    return (
      <span className={cn('flex flex-col items-center gap-0.5', className)}>
        <LucideIcon name={iconName} className={cn('h-4 w-4', iconClassName)} />
        <span className={cn('text-[9px] uppercase tracking-wide text-foreground/70', iconLabelClassName)}>{label}</span>
      </span>
    )
  }

  return <span className={cn('text-xs font-semibold', labelClassName)}>{label}</span>
}
