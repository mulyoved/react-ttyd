# Tmux Keyboard Catalog Plan

**Overall Progress:** `100%`

## Tasks:

- [x] 🟩 **Step 1: Confirm key catalog scope and mapping locations**
  - [x] 🟩 Identify the existing keyboard configuration surfaces that need the catalog (keyboard-configurator + data route)
  - [x] 🟩 Document the exact catalog entries (name/sequence/description) approved in the brief

- [x] 🟩 **Step 2: Add catalog metadata for available keys**
  - [x] 🟩 Define the catalog data structure (name/sequence/description) in code
  - [x] 🟩 Populate catalog with all keys from the brief + project sequences
  - [x] 🟩 Mark modifier-only keys as non-sequence entries

- [x] 🟩 **Step 3: Wire catalog into the keyboard configurator UI**
  - [x] 🟩 Replace/extend the existing special key list with the new catalog
  - [x] 🟩 Ensure users can pick any catalog entry and assign its sequence to a key slot

- [x] 🟩 **Step 4: Validation and sanity checks**
  - [x] 🟩 Verify all catalog entries match approved sequences
  - [x] 🟩 Confirm no F11/F12/Insert entries are included
  - [x] 🟩 Spot-check the configurator UI shows names and descriptions correctly
