# Keyboard Configurator Icon Support Plan

**Overall Progress:** `100%`

## Tasks:

- [x] 🟩 **Step 1: Extend slot data + icon resolution helpers**
  - [x] 🟩 Add optional `icon` field to `SlotItem` (string | null) and preserve export/import behavior
  - [x] 🟩 Create shared icon resolution helpers (defaults + overrides) in configurator context

- [x] 🟩 **Step 2: Add icon picker + render in configurator UI**
  - [x] 🟩 Add searchable Lucide icon picker (popover/grid) to slot properties
  - [x] 🟩 Render icons alongside labels in the configurator grid and library list

- [x] 🟩 **Step 3: Unify runtime rendering with shared icon logic**
  - [x] 🟩 Replace per-page icon switches with shared renderer in `/`, `/example`, `/keyboard-demo`
  - [x] 🟩 Ensure configured icons override defaults; `null` hides icon
