# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

React component library for integrating [ttyd](https://github.com/tsl0922/ttyd) web terminals using Xterm.js. Published as `react-ttyd` on npm.

## Commands

```bash
# Build the library (outputs to dist/)
npm run build

# Watch mode for development
npm run dev

# Run linting
npm run lint

# Type checking
npm run typecheck

# Run tests
npm run test

# Run example apps (after building)
npm run dev:example          # Next.js example
npm run dev:example:vite     # Vite example
```

## Architecture

### Core Components

- `src/Ttyd.tsx` - Main React component exported to consumers. Wraps Terminal with default options and exposes `TtydHandle` ref for programmatic control (`disconnect`, `execute`, `sendInput`).

- `src/components/terminal/Terminal.tsx` - React wrapper that manages Xterm lifecycle. Handles mounting/unmounting and exposes file upload modal.

- `src/components/terminal/xterm/index.ts` - The `Xterm` class that implements all terminal functionality:
  - WebSocket connection management with ttyd protocol
  - Renderer setup (WebGL/Canvas/DOM)
  - Addon loading (fit, overlay, clipboard, weblinks, image, unicode)
  - Flow control for data throttling
  - Reconnection logic with overlay UI
  - ttyd command protocol handling (OUTPUT, SET_WINDOW_TITLE, SET_PREFERENCES)

### Key Patterns

- Components use `forwardRef` + `useImperativeHandle` to expose methods to parent
- Terminal only re-renders when `wsUrl` changes (see dependency array in useEffect)
- Memoization via `React.memo` with custom comparison to prevent unnecessary re-renders
- Disposable pattern for cleanup (registering listeners and addons for proper disposal)

### ttyd Protocol

The WebSocket protocol uses single-byte command prefixes:
- Server → Client: OUTPUT (0), SET_WINDOW_TITLE (1), SET_PREFERENCES (2)
- Client → Server: INPUT (0), RESIZE_TERMINAL (1), PAUSE (2), RESUME (3)

### Type Definitions

- `src/types.ts` - Contains `ClientOptions`, `FlowControl`, `XtermOptions`, `TtydTerminal` enum with terminal control characters

## Examples

Two example apps in `example/`:
- `example/nextjs/` - Next.js app with shadcn/ui components
- `example/vite/` - Vite app with basic usage and event callbacks demo

## Build Output

Rollup produces dual CJS/ESM builds with TypeScript declarations in `dist/`.
