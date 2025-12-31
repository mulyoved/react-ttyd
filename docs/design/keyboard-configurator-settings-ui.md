# Keyboard Configurator Settings UI Plan

**Overall Progress:** `100%`

## Tasks:

- [x] 🟩 **Step 1: Add shared configurator state + URL sync**
  - [x] 🟩 Create a client provider in `example/nextjs/app/keyboard-configurator/layout.tsx`
  - [x] 🟩 Sync `keyboard`, `rightTab`, `libraryTab` to the URL (read on load, keep in sync)

- [x] 🟩 **Step 2: Update editor page layout and controls**
  - [x] 🟩 Switch main layout to 2 columns at `md+` (Editing + Library 50/50)
  - [x] 🟩 Add keyboard selector next to “Editing:” and a header “Keyboards” button linking to settings
  - [x] 🟩 Remove Keyboards + Quick preview cards from the editor page

- [x] 🟩 **Step 3: Add settings page for Keyboards + Quick preview**
  - [x] 🟩 Create `/keyboard-configurator/settings` with shared header + “Back to editor” button
  - [x] 🟩 Render Keyboards + Quick preview cards stacked (single column)
  - [x] 🟩 Preserve URL query params on navigation
