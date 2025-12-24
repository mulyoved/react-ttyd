# Scroll Menu Keyboard Keys Plan

**Overall Progress:** `75%`

## Tasks:

- [x] 🟩 **Step 1: Extend scroll menu key set**
  - [x] 🟩 Add Tab, Enter, Ctrl+C, Left, Right, Esc (non-exit), Home, End entries to `scrollButtons` in `example/nextjs/app/page.tsx` with correct escape sequences and labels/icons.

- [x] 🟩 **Step 2: Order and behavior**
  - [x] 🟩 Arrange `scrollButtons` in the agreed order: Esc key, Ctrl+C, Tab, Enter, Left, Right, Home, End, Page Up, Page Down, Line Up, Line Down, Paste, Copy, fix, skip.
  - [x] 🟩 Ensure repeat-on-hold remains only on Line Up/Down; new keys single-fire.
  - [x] 🟩 Keep existing Exit Scroll Mode button (ESC + exit) unchanged.

- [x] 🟩 **Step 3: Review for consistency**
  - [x] 🟩 Confirm disabled logic matches existing pattern (`!isConnected` where applicable).
  - [x] 🟩 Keep fix/skip buttons present and positioned at the end.

- [ ] 🟥 **Step 4: Sanity checks**
  - [ ] 🟥 If possible, run targeted lint/typecheck for `example/nextjs` to ensure no regressions.
  - [ ] 🟥 Manual spot-check: entering scroll mode shows new keys in order; Esc key sends ESC without exiting; Exit button still exits.
