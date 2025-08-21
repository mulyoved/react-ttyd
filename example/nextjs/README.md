# React TTYd Next.js Example

This is an advanced Next.js example demonstrating the full capabilities of the `react-ttyd` component with a feature-rich terminal interface.

## Features Demonstrated

- **Terminal Commander**: Advanced control interface with three modes:
  - **Execute Tab**: Type and execute commands with Enter
  - **Paste Tab**: Paste multi-line text without executing
  - **Shortcuts Tab**: Quick access to common keyboard shortcuts (Ctrl+C, Ctrl+D, etc.)
- **Connection Management**: Visual connection status with connect/disconnect functionality
- **Dynamic Configuration**: Runtime modification of all terminal settings
- **Fullscreen Mode**: Toggle between normal and fullscreen terminal views
- **Terminal Output Logging**: Real-time capture and display of terminal output
- **Authentication Support**: Basic auth integration for secured ttyd servers
- **Responsive Design**: Optimized for both desktop and mobile devices
- **Neobrutalism UI**: Modern, bold design with shadcn/ui components
- **Vercel Analytics**: Built-in analytics tracking

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- [ttyd](https://github.com/tsl0922/ttyd) installed on your system

## Local Development

### 1. Install ttyd

```bash
# macOS
brew install ttyd

# Ubuntu/Debian
sudo apt-get install ttyd

# Or download from releases
# https://github.com/tsl0922/ttyd/releases
```

### 2. Start ttyd server

```bash
# Basic usage (no authentication)
ttyd --writable bash

# With basic authentication
ttyd --writable --credential testuser:testpw bash

# With CORS support for development
ttyd --writable --allow-origin "http://localhost:3000" bash
```

### 3. Expose the ttyd port

```bash
# Install ngrok
brew install ngrok

# Run ngrok
ngrok http 7681
```

### 4. Build react-ttyd package

From the root directory:

```bash
# Navigate to root
cd ../..

# Install and build
npm install
npm run build
```

### 5. Run the Next.js example

```bash
# Navigate to example
cd example/nextjs

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3000 in your browser.

## Key Features

### Terminal Commander

The robot button opens a powerful Terminal Commander dialog with three tabs:

```typescript
// Execute commands
terminalRef.current?.execute('ls -la');

// Paste text without executing
terminalRef.current?.execute('npm install', false);

// Send keyboard shortcuts
terminalRef.current?.sendInput('\x03'); // Ctrl+C
```

### Dynamic Imports (SSR)

Next.js requires dynamic imports for terminal components:

```typescript
const Ttyd = dynamic(
  () => import('react-ttyd').then(mod => mod.Ttyd),
  { 
    ssr: false,
    loading: () => <div>Loading terminal...</div>
  }
);
```

### Terminal Reference

Access terminal methods programmatically:

```typescript
const terminalRef = useRef<TtydHandle>(null);

// Methods available:
terminalRef.current?.disconnect();
terminalRef.current?.execute(command, enter);
terminalRef.current?.sendInput(input);
```

### Keyboard Shortcuts

Pre-defined shortcuts for common terminal operations:

```typescript
const keyboardShortcuts = [
  { name: 'Ctrl+C', key: '\x03', description: 'Interrupt/Cancel' },
  { name: 'Ctrl+D', key: '\x04', description: 'EOF/Exit' },
  { name: 'Ctrl+L', key: '\x0c', description: 'Clear screen' },
  // ... more shortcuts
];
```

## Deployment

### Vercel Deployment

1. **Prepare for deployment**:
   ```bash
   # Build everything
   cd ../.. && npm run build
   cd example/nextjs && npm run build
   ```

2. **Deploy with Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel
   ```

3. **Or use Git integration**:
   - Push to GitHub/GitLab/Bitbucket
   - Import on [vercel.com](https://vercel.com)
   - Configure:
     - Root Directory: `example/nextjs`
     - Framework Preset: Next.js

### Environment Variables

Set these in your Vercel project settings:

| Variable                    | Description         | Example                     |
| --------------------------- | ------------------- | --------------------------- |
| `NEXT_PUBLIC_TTYD_URL`      | WebSocket URL       | `wss://ttyd.example.com/ws` |
| `NEXT_PUBLIC_TTYD_USERNAME` | Basic auth username | `user`                      |
| `NEXT_PUBLIC_TTYD_PASSWORD` | Basic auth password | `pass`                      |

## Project Structure

```
example/nextjs/
├── app/
│   ├── page.tsx         # Main page with Terminal Commander
│   ├── layout.tsx       # Root layout with analytics
│   └── globals.css      # Global styles
├── components/
│   └── ui/              # shadcn/ui components
├── public/
│   └── terminal.svg     # Terminal icon
├── lib/
│   └── utils.ts         # Utility functions
├── components.json      # shadcn/ui config
├── next.config.ts       # Next.js configuration
├── tailwind.config.ts   # Tailwind configuration
└── vercel.json         # Vercel deployment config
```

## Configuration Options

| Option         | Description               | Values                     |
| -------------- | ------------------------- | -------------------------- |
| WebSocket URL  | ttyd server endpoint      | `ws://localhost:7681/ws`   |
| Renderer Type  | Terminal rendering engine | `webgl`, `canvas`, `dom`   |
| Font Size      | Terminal text size        | `8-24`                     |
| Authentication | Basic auth credentials    | Base64 encoded `user:pass` |

## Security Best Practices

1. **Use WSS in production**: Always use secure WebSocket connections
2. **Implement authentication**: Use ttyd's credential system
3. **Configure CORS properly**:
   ```bash
   ttyd --allow-origin "https://your-app.vercel.app" bash
   ```
4. **Use environment variables**: Never hardcode credentials
5. **Network isolation**: Consider VPN or private networks for sensitive environments

## Troubleshooting

### Common Issues

1. **SSR Errors**:
   - Ensure terminal components use dynamic imports
   - Don't import `TtydTerminal` enum on server side

2. **CORS Errors**:
   ```bash
   # Development
   ttyd --allow-origin "http://localhost:3000" bash
   
   # Production
   ttyd --allow-origin "https://your-app.vercel.app" bash
   ```

3. **WebSocket Connection Failed**:
   - Verify ttyd is running: `ps aux | grep ttyd`
   - Check firewall/port settings
   - Ensure WebSocket URL is correct

4. **Build Errors**:
   ```bash
   # Clean install
   rm -rf node_modules .next
   npm install
   npm run dev
   ```

## Advanced Usage

### Custom Styling

The example uses Tailwind CSS and shadcn/ui with neobrutalism theme:

```css
/* Custom terminal container */
.terminal-container {
  @apply border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)];
}
```

### Event Handling

```typescript
<Ttyd
  onConnectionOpen={(event) => setConnectionStatus('connected')}
  onConnectionClose={(event) => setConnectionStatus('disconnected')}
  onConnectionError={(event) => setConnectionStatus('error')}
  onData={(data) => {
    // Process terminal output
    setOutputLog(prev => [...prev, data].slice(-10));
  }}
/>
```

### Fullscreen Mode

```typescript
const toggleFullscreen = () => {
  setIsFullscreen(!isFullscreen);
  // Trigger resize after DOM update
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
  }, 100);
};
```

## Learn More

- [react-ttyd Documentation](https://github.com/tantara/react-ttyd)
- [API Documentation](../../docs/API.md)
- [ttyd Documentation](https://github.com/tsl0922/ttyd)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## License

MIT