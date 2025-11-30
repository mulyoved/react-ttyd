# Minimal Single-Column Stripe UI (V0 Prompt)

Design a touch-first web UI to control a tmux terminal on a Samsung Galaxy S24 (portrait). The goal is to keep the right stripe as narrow as possible while keeping buttons comfortably tappable.

## Layout
- Split screen: left ~82–86% terminal canvas (dark `#0b0d10`, neon-green output); right ~14–18% fixed control stripe (`#16191f`).
- No page scroll; stripe may scroll internally if needed. One button per row; single column only.
- Button sizing: 46–52px height, 8–10px radius, 12px horizontal padding, label 16–17px bold. Gaps: 6px between buttons, 10px between groups.
- Colors: primary/action cyan `#3de4ff`; danger red `#ff4d4f`; neutral steel `#8ea0b2`. Backgrounds: stripe `#16191f`, buttons `#1c232c`.

## Stripe Content (top → bottom)
1) **High-frequency (always visible)**  
   Esc; Tab; Enter (cyan); Ctrl+C (red); Arrow ↑; Arrow ←; Arrow ↓; Arrow →; Page Up; Page Down; Hold (toggle for repeat on arrows/Pg keys).

2) **Mode toggle**  
   Tiny pill: `Keys | tmux` (shows one panel at a time).

3a) **Keys panel (visible when Keys active)**  
   Ctrl+L; Ctrl+U; Ctrl+R; Home; End; `/`; `:`; Space.

3b) **tmux panel (visible when tmux active)**  
   Window 0; Window 1; Window 2; Window 3; Window 4; Pane A; Pane B; Pane C; Prefix (Ctrl+B); Commands (opens drawer with snippets: `/review`, `/clear`, `/run <task>`, `/test <suite>`, `/lint`).

4) **Bottom utility (always visible, small)**  
   Mic (voice dictation); Keyboard (opens soft keyboard).

## Behavior Notes
- Stripe can scroll internally; prioritize keeping the high-frequency block + toggle + current panel visible without scrolling.
- Active window/pane/hold states: thin cyan outline + slight glow; disabled items dimmed.
- Commands opens a slide-out drawer (full height) with large tap rows and subtitles.
- Terminal canvas scrolls inside its area; the page itself should not scroll.

## Deliverables
- Mobile portrait first (1080×2340 reference), plus desktop variant if desired.
- Component states: default / hover / pressed / disabled for buttons; active states for window/pane/hold; drawer item states.
- Provide color and spacing tokens; build in V0 (no external design tools).
