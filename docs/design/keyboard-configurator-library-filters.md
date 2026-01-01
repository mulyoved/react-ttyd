# Keyboard Configurator Library Filters Plan

**Overall Progress:** `100%`

## Tasks:

- [x] 🟩 **Step 1: Define filter state + URL sync**
  - [x] 🟩 Add library kind filter state (Key/Special/Macro/Action; Key off by default)
  - [x] 🟩 Read/write `libraryKinds=Special|Macro|Action` in URL on load and changes

- [x] 🟩 **Step 2: Update Library UI controls**
  - [x] 🟩 Add inline filter chips above the search input
  - [x] 🟩 Remove visible search label; keep placeholder and `aria-label`

- [x] 🟩 **Step 3: Apply filtering + tighten spacing**
  - [x] 🟩 Filter `libraryResults` by selected kinds while preserving type ordering
  - [x] 🟩 Reduce Library card top spacing via `CardContent` padding/gap tweaks in editor page
