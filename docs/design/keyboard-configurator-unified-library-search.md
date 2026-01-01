# Keyboard Configurator Unified Library Search Plan

**Overall Progress:** `100%`

## Tasks:

- [x] 🟩 **Step 1: Simplify shared library state**
  - [x] 🟩 Remove `libraryTab` from provider state and URL syncing
  - [x] 🟩 Consolidate palette data into a unified list (keys → special → macros → actions)

- [x] 🟩 **Step 2: Update editor library UI**
  - [x] 🟩 Replace library tabs with a single search-driven results grid
  - [x] 🟩 Show type badges and inline details per result (labels/descriptions/sequences)
  - [x] 🟩 Keep click-to-place behavior with selected-slot guard

- [x] 🟩 **Step 3: Validate properties + ordering**
  - [x] 🟩 Ensure macros search ignores script content (name/label only)
  - [x] 🟩 Confirm ordering stays by type (keys → special → macros → actions)
