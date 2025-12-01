# Command List Right-Side Plan

**Overall Progress:** `100%`

## Tasks:

- [x] 🟩 **Step 1: Confirm scope and constraints**
  - [x] 🟩 Limit changes to main Next.js page `example/nextjs/app/page.tsx` (secondary demo unchanged).
  - [x] 🟩 Keep overlay width behavior (`fitContent`, max 50vw) and allow overlap with button bar per spec.

- [x] 🟩 **Step 2: Update overlay placement**
  - [x] 🟩 Set the command list `SideButtonOverlay` to render on the right side.
  - [x] 🟩 Ensure any hardcoded side props reflect the new position without altering other overlays.

- [x] 🟩 **Step 3: Add close control**
  - [x] 🟩 Append a final “Close list” action in the command overlay to dismiss it.

- [x] 🟩 **Step 4: Remove disconnect button from right stripe**
  - [x] 🟩 Drop the disconnect action from the right-side Stripe button bar.

- [ ] 🟥 **Step 5: Smoke validation**
  - [ ] 🟥 Manually verify on the main page that opening “Command presets” shows the overlay on the right and remains usable.
  - [ ] 🟥 Leave automated tests unchanged; note manual check outcome.

- [x] 🟩 **Step 6: Page Up icon update**
  - [x] 🟩 Use `ArrowBigUp` for the Page Up scroll control on the main page.

- [x] 🟩 **Step 7: Scroll/Page icons refresh**
  - [x] 🟩 Switch scroll mode icon to `ArrowBigUp`.
  - [x] 🟩 Switch Page Down icon to `ArrowBigDown`.

- [x] 🟩 **Step 8: Icon import cleanup**
  - [x] 🟩 Re-add required icons after refactor to prevent runtime reference errors.

- [x] 🟩 **Step 9: UI tweaks**
  - [x] 🟩 Change Ctrl+G icon to `ArrowRightLeft`.
  - [x] 🟩 Enlarge Enter icon (≈3x).
  - [x] 🟩 Hide Terminal Commander button on right stripe.

- [x] 🟩 **Step 10: Close action icon & styling**
  - [x] 🟩 Use `X` icon for the close list action, keeping styling consistent with other items.

- [x] 🟩 **Step 11: Icon import fix**
  - [x] 🟩 Add missing `X` icon import to prevent runtime reference errors.

- [x] 🟩 **Step 12: Pagination side menu polish**
  - [x] 🟩 Replace close icon with `X` in scroll controls.
  - [x] 🟩 Remove extra copy glyphs from icons and add a dedicated Copy button.

- [x] 🟩 **Step 13: Add new command presets**
  - [x] 🟩 Add `/work-step-by-step` (auto-enter).
  - [x] 🟩 Add `/compact` (auto-enter).

- [x] 🟩 **Step 14: Window switch clarity**
  - [x] 🟩 Display next tmux window number in the switch button label.
  - [x] 🟩 Send tmux prefix+digit together (Ctrl+B + window) with double backspace cleanup to suppress stray echoes.
