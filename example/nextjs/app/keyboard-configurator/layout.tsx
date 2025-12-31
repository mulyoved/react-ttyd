import type { ReactNode } from 'react'

import { KeyboardConfiguratorProvider } from './configurator-context'

export default function KeyboardConfiguratorLayout({ children }: { children: ReactNode }) {
  return <KeyboardConfiguratorProvider>{children}</KeyboardConfiguratorProvider>
}
