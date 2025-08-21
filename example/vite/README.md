# React TTYd Vite Example

This is a comprehensive example application demonstrating the usage of the `react-ttyd` React component for integrating ttyd web terminal with Vite.

## Features Demonstrated

- **Basic Terminal Integration**: WebSocket connection to ttyd server
- **Connection Management**: Connect/disconnect functionality with status indicators
- **Dynamic Configuration**: Runtime modification of:
  - WebSocket URL
  - Renderer type (WebGL, Canvas, DOM)
  - Font size
  - Authentication credentials
- **Terminal Output Monitoring**: Real-time terminal output logging
- **Responsive Design**: Mobile-friendly interface
- **Theme Support**: Styled with modern UI components

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- [ttyd](https://github.com/tsl0922/ttyd) installed on your system

## Local Development

### 1. Install ttyd

```bash
# macOS
brew install ttyd

# Ubuntu/Debian
sudo apt-get install ttyd

# Or download from https://github.com/tsl0922/ttyd/releases
```

### 2. Start ttyd server

```bash
# Basic usage (no authentication)
ttyd --writable bash

# With basic authentication
ttyd --writable --credential testuser:testpw bash

# Output: Listening on port: 7681
```

### 3. Build react-ttyd package

From the root directory of the project:

```bash
# Navigate to the root directory
cd ../..

# Install dependencies
npm install

# Build the package
npm run build
```

### 4. Run the example

```bash
# Navigate to the example directory
cd example/vite

# Install dependencies
npm install

# Start the development server
npm run dev
```

The example will be available at `http://localhost:5173`

## Key Components

### Terminal Integration

```typescript
import { Ttyd } from 'react-ttyd';
import 'react-ttyd/dist/index.css';

<Ttyd
  wsUrl="ws://localhost:7681/ws"
  clientOptions={{
    rendererType: 'webgl',
  }}
  termOptions={{
    fontSize: 14,
  }}
/>
```

### Authentication

```typescript
// Basic authentication
<Ttyd
  wsUrl="ws://localhost:7681/ws"
  authToken={btoa('username:password')}
/>
```

### Event Handling

```typescript
<Ttyd
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

## Vercel Deployment

To deploy this example to Vercel:

### 1. Prepare for deployment

```bash
# Build the package
cd ../.. && npm run build
cd example/vite
```

### 2. Deploy to Vercel

Option A: Using Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts
```

Option B: Using Git integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Import the project on [vercel.com](https://vercel.com)
3. Configure:
   - **Root Directory**: `example/vite`
   - **Framework Preset**: Vite
4. Deploy

### Environment Variables

For production deployments, set these environment variables in Vercel:

- `VITE_TTYD_URL`: The WebSocket URL for your ttyd server (e.g., `wss://your-ttyd-server.com/ws`)

## Configuration Options

The example demonstrates various configuration options:

| Option | Description | Example |
|--------|-------------|---------|
| WebSocket URL | ttyd server connection | `ws://localhost:7681/ws` |
| Renderer Type | Terminal rendering engine | `webgl`, `canvas`, `dom` |
| Font Size | Terminal font size | `13` |
| Username | Basic auth username | `testuser` |
| Password | Basic auth password | `testpw` |

## Security Considerations

- **HTTPS/WSS**: Use secure connections in production
- **Authentication**: Implement proper authentication mechanisms
- **CORS**: Configure ttyd to allow your domain:
  ```bash
  ttyd --writable --allow-origin "https://your-domain.vercel.app" bash
  ```
- **Network Security**: Use a reverse proxy or VPN for additional security

## Troubleshooting

### CORS Issues

```bash
# Allow specific origin
ttyd --writable --allow-origin "http://localhost:5173" bash

# Allow all origins (development only!)
ttyd --writable --allow-origin "*" bash
```

### WebSocket Connection Failed

1. Check ttyd server is running: `ps aux | grep ttyd`
2. Verify WebSocket URL matches ttyd port
3. Check firewall settings
4. For remote servers, ensure the port is publicly accessible

### Build Issues

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Project Structure

```
example/vite/
├── src/
│   ├── App.tsx              # Main application component
│   ├── EventCallbacksExample.tsx  # Event handling example
│   ├── main.tsx            # Application entry point
│   └── App.css             # Styles
├── public/
│   └── terminal.svg        # Terminal icon
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
└── vercel.json            # Vercel deployment config
```

## Learn More

- [react-ttyd Documentation](https://github.com/tantara/react-ttyd)
- [ttyd Documentation](https://github.com/tsl0922/ttyd)
- [Vite Documentation](https://vitejs.dev)
- [Vercel Documentation](https://vercel.com/docs)

## License

MIT