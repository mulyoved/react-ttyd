# react-ttyd Example

This is an example application demonstrating the usage of the `react-ttyd` React component for integrating ttyd web terminal.

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
ttyd --writable bash
# Output: Listening on port: 7681
```

### 3. Build react-ttyd package

From the root directory of the project:

```bash
# Navigate to the root directory
cd ..

# Install dependencies
npm install

# Build the package
npm run build
```

### 4. Run the example

```bash
# Navigate to the example directory
cd example

# Install dependencies
npm install

# Start the development server
npm run dev
```

The example will be available at `http://localhost:5173`

## Vercel Deployment

To deploy this example to Vercel using a locally built version of react-ttyd:

### 1. Build react-ttyd locally

From the root directory:

```bash
# Build the package
npm run build
```

### 2. Update package.json

In the example directory, modify `package.json` to use the local build:

```json
{
  "dependencies": {
    "react-ttyd": "file:../",
    // ... other dependencies
  }
}
```

### 3. Install dependencies

```bash
npm install
```

### 4. Build for production

```bash
npm run build
```

### 5. Deploy to Vercel

Option A: Using Vercel CLI

```bash
# Install Vercel CLI if you haven't already
npm i -g vercel

# Deploy with custom build command
vercel --build-command "cd .. && npm install && npm run build && cd example && npm install && npm run build"

# Follow the prompts to complete deployment
```

Option B: Using Git integration

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project on [vercel.com](https://vercel.com)
3. Configure the following settings:
   - **Root Directory**: `example`
   - **Build Command**: `cd .. && npm install && npm run build && cd example && npm install && npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Deploy

### Vercel Configuration File (Alternative)

Create a `vercel.json` file in the example directory:

```json
{
  "buildCommand": "cd .. && npm install && npm run build && cd example && npm install && npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": "vite"
}
```

This ensures that react-ttyd is built fresh during each Vercel deployment.

### Environment Variables

If your ttyd server is hosted remotely, you may want to set environment variables in Vercel:

- `VITE_TTYD_URL`: The WebSocket URL for your ttyd server (e.g., `wss://your-ttyd-server.com/ws`)

## Configuration

The example demonstrates various configuration options:

- **WebSocket URL**: Configure the ttyd server connection
- **Renderer Type**: Choose between WebGL, Canvas, or DOM rendering
- **Font Size**: Adjust terminal font size

## Security Considerations

- For production deployments, ensure your ttyd server is properly secured
- Use HTTPS/WSS for secure connections
- Implement proper authentication mechanisms
- Consider using a reverse proxy for additional security

## Troubleshooting

### CORS Issues

If you encounter CORS issues, ensure your ttyd server allows connections from your domain:

```bash
ttyd --writable --allow-origin "https://your-domain.vercel.app" bash
```

### WebSocket Connection Failed

1. Check that ttyd server is running
2. Verify the WebSocket URL is correct
3. Ensure no firewall is blocking the connection
4. For Vercel deployment, make sure your ttyd server is accessible from the internet

## License

MIT