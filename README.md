# react-ttyd

A React component for integrating [ttyd](https://github.com/tsl0922/ttyd) web terminal with [Xterm.js](https://xtermjs.org/), supporting WebGL rendering and WebSocket connections.

[![npm version](https://img.shields.io/npm/v/react-ttyd.svg)](https://www.npmjs.com/package/react-ttyd)
[![npm downloads](https://img.shields.io/npm/dm/react-ttyd.svg)](https://www.npmjs.com/package/react-ttyd)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 WebGL, Canvas, and DOM rendering support
- 🔌 WebSocket integration for ttyd connections
- 📋 Clipboard support (copy/paste)
- 🔗 Clickable links
- 🖼️ Image support in terminal
- 📱 Responsive terminal with fit addon
- ⚡ High performance with WebGL renderer
- 🎨 Customizable terminal options
- 🔒 Authentication support (basic auth and token-based)
- 🌐 Unicode support

## Installation

```bash
npm install react-ttyd
```

or

```bash
yarn add react-ttyd
```

## Quick Start

First, make sure you have a ttyd server running. Check [ttyd](https://github.com/tsl0922/ttyd) for installation instructions.

```bash
# macOS
brew install ttyd

# Start ttyd
ttyd --writable bash
```

Then use the component in your React application:

```tsx
import { Ttyd } from 'react-ttyd';

function App() {
  return (
    <Ttyd 
      wsUrl="ws://localhost:7681/ws"
      clientOptions={{
        rendererType: 'webgl'
      }}
      termOptions={{
        fontSize: 14,
      }}
    />
  );
}
```

### With Basic Authentication

If your ttyd server requires authentication, you can provide credentials:

```bash
# Start ttyd with basic auth
ttyd --writable --credential testuser:testpw bash
```

```tsx
<Ttyd 
  wsUrl="ws://localhost:7681/ws"
  authToken={btoa('testuser:testpw')}
  clientOptions={{
    rendererType: 'webgl'
  }}
/>
```

## API Reference

### Ttyd Component Props

| Prop                | Type                          | Description                                   | Default      |
| ------------------- | ----------------------------- | --------------------------------------------- | ------------ |
| `wsUrl`             | `string`                      | WebSocket URL of ttyd server                  | **Required** |
| `tokenUrl`          | `string`                      | URL to fetch auth token (if using token auth) | -            |
| `authToken`         | `string`                      | Base64 encoded credentials for basic auth     | -            |
| `clientOptions`     | `ClientOptions`               | Terminal client options                       | `{}`         |
| `termOptions`       | `ITerminalOptions`            | Xterm.js terminal options                     | `{}`         |
| `onConnectionOpen`  | `(event: Event) => void`      | WebSocket open callback                       | -            |
| `onConnectionClose` | `(event: CloseEvent) => void` | WebSocket close callback                      | -            |
| `onConnectionError` | `(event: Event) => void`      | WebSocket error callback                      | -            |
| `onData`            | `(data: string) => void`      | Terminal data callback                        | -            |
| `id`                | `string`                      | Terminal container element ID                 | -            |
| `className`         | `string`                      | Terminal container CSS class                  | -            |
| `addons`            | `TerminalAddon[]`             | Additional Xterm.js addons                    | -            |

### ClientOptions

| Option           | Type                           | Description                | Default       |
| ---------------- | ------------------------------ | -------------------------- | ------------- |
| `rendererType`   | `'webgl' \| 'canvas' \| 'dom'` | Renderer type              | `'webgl'`     |
| `enableZmodem`   | `boolean`                      | Enable Zmodem support      | `false`       |
| `enableTrzsz`    | `boolean`                      | Enable trzsz support       | `false`       |
| `enableSixel`    | `boolean`                      | Enable Sixel support       | `false`       |
| `isWindows`      | `boolean`                      | Windows compatibility mode | Auto-detected |
| `unicodeVersion` | `'6' \| '11'`                  | Unicode version            | `'11'`        |

### Terminal Options

The `termOptions` prop accepts all [Xterm.js terminal options](https://xtermjs.org/docs/api/terminal/interfaces/iterminaloptions/).

Common options:

```tsx
<Ttyd
  wsUrl="ws://localhost:7681/ws"
  termOptions={{
    fontSize: 14,
    fontFamily: 'Menlo, Monaco, "Courier New", monospace',
    theme: {
      background: '#1e1e1e',
      foreground: '#ffffff'
    },
    cursorBlink: true,
    cursorStyle: 'block'
  }}
/>
```

## Advanced Usage 🚧 Under Development

This section is currently under development. More advanced features and examples will be added soon!

```tsx
<Ttyd 
  wsUrl="ws://localhost:7681/ws"
  authToken={btoa('testuser:testpw')}
/>
```

```tsx
<Ttyd 
  wsUrl="ws://localhost:7681/ws"
  authToken="your-auth-token"
/>
```

### Custom Addons

```tsx
import { Terminal } from '@xterm/xterm';
import { MyCustomAddon } from './MyCustomAddon';

<Ttyd 
  wsUrl="ws://localhost:7681/ws"
  addons={[new MyCustomAddon()]}
/>
```

### Event Handlers

```tsx
<Ttyd 
  wsUrl="ws://localhost:7681/ws"
  onConnectionOpen={(event) => {
    console.log('Connected to ttyd server');
  }}
  onConnectionClose={(event) => {
    console.log('Disconnected from ttyd server');
  }}
  onConnectionError={(event) => {
    console.error('Connection error:', event);
  }}
  onData={(data) => {
    console.log('Terminal output:', data);
  }}
/>
```


## Examples

Check out the [example](https://github.com/tantara/react-ttyd/tree/main/example) directory for a complete working example.

To run the example:

```bash
# Clone the repository
git clone https://github.com/tantara/react-ttyd.git
cd react-ttyd

# Install dependencies
npm install

# Build the library
npm run build

# Start ttyd server (in another terminal)
ttyd --writable bash

# Run the example
cd example/nextjs # or cd example/vite
npm install
npm run dev
```

## Browser Support

- Chrome/Edge (recommended for WebGL support)
- Firefox
- Safari
- Mobile browsers (with touch support)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [ttyd](https://github.com/tsl0922/ttyd) - Share your terminal over the web
- [Xterm.js](https://xtermjs.org/) - Terminal for the web
- [@homebridge/plugin-ui-utils](https://github.com/homebridge/homebridge-config-ui-x) - Inspiration for the terminal implementation

## TODO

The following features from the original ttyd/html implementation are not yet ported to react-ttyd:

### Core Features
- [ ] Token-based authentication (`tokenUrl` and `refreshToken()`)
- [ ] Command protocol support (SET_PREFERENCES command)
- [ ] URL query parameter parsing for options
- [ ] Flow control (pause/resume commands)
- [ ] Reconnection mechanism with overlay
- [ ] Window unload warning when terminal is active
- [ ] Title management (titleFixed option)
- [ ] `closeOnDisconnect` behavior

### File Transfer & Advanced Features
- [ ] Zmodem support (`enableZmodem` option)
- [ ] Trzsz support (`enableTrzsz` option) 
- [ ] Sixel graphics support (`enableSixel` option)
- [ ] Modal for file uploads
- [ ] `sendFile()` functionality
- [ ] Drag and drop file support

### UI/UX Features
- [ ] Resize overlay (`disableResizeOverlay` option)
- [ ] Leave alert (`disableLeaveAlert` option)
- [ ] Connection status overlay
- [ ] Reconnection overlay with "Press Enter to Reconnect"
- [ ] Selection copy overlay (scissors icon)

### Terminal Management
- [ ] Global `window.term` object with `fit()` method
- [ ] Dispose pattern for proper cleanup
- [ ] Binary data handling
- [ ] Proper WebSocket command protocol

### Configuration
- [ ] Server-side preference updates
- [ ] Windows-specific options (`isWindows`)
- [ ] trzszDragInitTimeout option

## Related Projects

- [ttyd](https://github.com/tsl0922/ttyd) - The backend terminal server
- [xterm.js](https://github.com/xtermjs/xterm.js) - The terminal emulator used in this component