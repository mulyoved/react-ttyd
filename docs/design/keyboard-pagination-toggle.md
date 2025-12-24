# Keyboard Pagination Toggle Plan

**Overall Progress:** `75%`

## Tasks:

- [x] 🟩 **Step 1: Prepare UI imports**
  - [x] 🟩 Add `Keyboard` icon import alongside existing lucide icons in `example/nextjs/app/page.tsx`.

- [x] 🟩 **Step 2: Replace main menu Paste with Keyboard**
  - [x] 🟩 Swap the `normalButtons` Paste entry for a Keyboard action that sets `scrollMode` to `true` without sending Page Up.
  - [x] 🟩 Keep existing disabled logic (`!isConnected`) and labeling consistent.

- [x] 🟩 **Step 3: Add Paste to pagination menu**
  - [x] 🟩 Insert a Paste action into `scrollButtons` that opens the existing paste dialog; retain disabled logic.
  - [x] 🟩 Ensure Copy action remains in the scroll menu unchanged.

- [ ] 🟥 **Step 4: Sanity checks**
  - [ ] 🟥 Verify local typecheck/lint pass for `example/nextjs` if runnable.
  - [ ] 🟥 Manual UI spot-check: enter scroll mode via Keyboard button, confirm pagination menu shows Paste, and no Page Up is sent on toggle.
