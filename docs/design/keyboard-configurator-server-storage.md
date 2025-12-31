# Keyboard Configurator Server Storage Plan

**Overall Progress:** `90%`

## Tasks:

- [ ] 🟩 **Step 1: Define on-disk schema and file naming**
  - [ ] 🟩 Specify per-keyboard JSON shape (keyboard data + metadata + referenced macros)
  - [ ] 🟩 Confirm filename mapping via `safeIdFromName(name).json`

- [ ] 🟩 **Step 2: Add server filesystem API endpoints**
  - [ ] 🟩 Implement `GET /api/keyboards` to list/load all saved keyboards
  - [ ] 🟩 Implement `POST /api/keyboards` to save/overwrite a keyboard file
  - [ ] 🟩 Implement `DELETE /api/keyboards/:name` to delete a keyboard file
  - [ ] 🟩 Implement rename flow (delete old file + write new file)
  - [ ] 🟩 Ensure data directory auto-creation at `example/nextjs/data/keyboards/`

- [ ] 🟩 **Step 3: Update configurator state management**
  - [ ] 🟩 Remove localStorage load/save effects
  - [ ] 🟩 Load saved keyboards on mount and replace in-memory state
  - [ ] 🟩 Apply default selection (first `isDefault`, else first keyboard)
  - [ ] 🟩 Scope macro library to selected keyboard’s referenced macros

- [ ] 🟩 **Step 4: Wire explicit Save / Delete / Rename UX**
  - [ ] 🟩 Add Save button to persist selected keyboard
  - [ ] 🟩 Persist metadata changes across keyboards when Save is clicked
  - [ ] 🟩 Update delete/rename actions to call server endpoints
  - [ ] 🟩 Import stays in-memory until Save is pressed

- [ ] 🟨 **Step 5: Validation**
  - [ ] 🟩 Run `npm run lint` in `example/nextjs`
  - [ ] 🟥 Manual smoke: save, reload, rename, delete, import
