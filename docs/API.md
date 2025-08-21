# React TTYd API Documentation

## TtydHandle Interface

The `TtydHandle` interface provides methods to programmatically control the terminal.

```typescript
interface TtydHandle {
  disconnect: () => void;
  execute: (command: string, enter?: boolean) => void;
  sendInput: (input: string) => void;
}
```

### Methods

#### `disconnect()`
Closes the WebSocket connection to the ttyd server.

```typescript
terminalRef.current?.disconnect();
```

#### `execute(command: string, enter?: boolean)`
Sends a command to the terminal.

**Parameters:**
- `command` (string): The command string to send to the terminal
- `enter` (boolean, optional): Whether to press Enter after the command. Defaults to `true`.
  - `true`: Execute the command (default behavior)
  - `false`: Paste the command without executing

**Examples:**
```typescript
// Execute a command (with Enter)
terminalRef.current?.execute('ls -la');

// Paste a command without executing
terminalRef.current?.execute('git status', false);

// Clear the terminal
terminalRef.current?.execute('clear');
```

#### `sendInput(input: string)`
Sends raw input to the terminal, including control characters.

**Parameters:**
- `input` (string): The raw input to send, can include control characters

**Examples:**
```typescript
// Send Ctrl+C to interrupt current process
terminalRef.current?.sendInput('\x03');

// Send Tab for auto-completion
terminalRef.current?.sendInput('\x09');

// Send Escape key
terminalRef.current?.sendInput('\x1b');
```

## Usage Example

```tsx
import React, { useRef } from 'react';
import { Ttyd, TtydHandle } from 'react-ttyd';

function App() {
  const terminalRef = useRef<TtydHandle>(null);

  const handleExecuteCommand = () => {
    // Execute a command
    terminalRef.current?.execute('ls -la');
  };

  const handlePasteCommand = () => {
    // Paste without executing
    terminalRef.current?.execute('npm install', false);
  };

  const handleDisconnect = () => {
    // Disconnect from the server
    terminalRef.current?.disconnect();
  };

  return (
    <div>
      <button onClick={handleExecuteCommand}>Execute ls -la</button>
      <button onClick={handlePasteCommand}>Paste npm install</button>
      <button onClick={handleDisconnect}>Disconnect</button>
      <Ttyd
        terminalRef={terminalRef}
        wsUrl="ws://localhost:7681/ws"
      />
    </div>
  );
}
```

## Advanced Next.js Example with Terminal Commander

The Next.js example (in `example/nextjs/app/page.tsx`) demonstrates a comprehensive terminal interface with a "Terminal Commander" feature accessible via a robot button. The dialog includes three tabs:

### 1. Execute Tab
Allows users to type and execute commands immediately:
```typescript
const handleExecuteCommand = () => {
  if (terminalRef.current && commandInput.trim()) {
    terminalRef.current.execute(commandInput);
    setCommandInput('');
    setIsDialogOpen(false);
  }
};
```

### 2. Paste Tab
Enables pasting multi-line text without executing:
```typescript
const handlePasteText = () => {
  if (terminalRef.current && pasteText.trim()) {
    terminalRef.current.execute(pasteText, false);
    setPasteText('');
    setIsDialogOpen(false);
  }
};
```

### 3. Shortcuts Tab
Provides quick access to common keyboard shortcuts:
```typescript
const keyboardShortcuts = [
  { name: 'Ctrl+C', key: '\x03', description: 'Interrupt/Cancel current process' },
  { name: 'Ctrl+D', key: '\x04', description: 'End of file (EOF) / Exit' },
  { name: 'Ctrl+Z', key: '\x1a', description: 'Suspend current process' },
  { name: 'Ctrl+L', key: '\x0c', description: 'Clear screen' },
  // ... more shortcuts
];

const handleSendShortcut = (key: string) => {
  if (terminalRef.current) {
    terminalRef.current.sendInput(key);
  }
};
```

### Complete Integration Example

The Next.js example shows how to integrate all features with proper state management and UI:

```tsx
// Terminal connection management
const handleApplySettings = () => {
  if (connectionStatus === 'connected') {
    terminalRef.current?.disconnect();
  } else {
    setOptions(formState);
    setConnectionKey(prev => prev + 1);
  }
};

// Terminal output monitoring
const handleData = useCallback((data: string) => {
  console.log('Terminal output:', data);
  setOutputLog(prev => {
    const newLog = [...prev, data];
    return newLog.slice(-10); // Keep last 10 entries
  });
}, []);
```

### Key Features Demonstrated

1. **Connection Management**: Connect/disconnect functionality with visual status indicators
2. **Dynamic Configuration**: Runtime modification of WebSocket URL, renderer type, font size, and authentication
3. **Terminal Control**: Execute commands, paste text, and send keyboard shortcuts
4. **Output Monitoring**: Real-time terminal output logging
5. **Responsive Design**: Mobile-friendly interface with fullscreen support
6. **Accessibility**: Keyboard shortcuts and clear visual feedback

For the complete implementation, refer to `example/nextjs/app/page.tsx`.

## TtydTerminal Enum

The `TtydTerminal` enum provides predefined ASCII control characters for common terminal operations:

```typescript
import { TtydTerminal } from 'react-ttyd';

// Common control characters
TtydTerminal.CTRL_C  // '\x03' - Interrupt/Cancel
TtydTerminal.CTRL_D  // '\x04' - EOF/Exit
TtydTerminal.CTRL_Z  // '\x1a' - Suspend process
TtydTerminal.CTRL_L  // '\x0c' - Clear screen
TtydTerminal.CTRL_U  // '\x15' - Kill to beginning of line
TtydTerminal.CTRL_K  // '\x0b' - Kill to end of line
TtydTerminal.CTRL_W  // '\x17' - Delete word before cursor
TtydTerminal.CTRL_R  // '\x12' - Reverse search
TtydTerminal.TAB     // '\x09' - Auto-complete
TtydTerminal.ESCAPE  // '\x1b' - Escape key
TtydTerminal.ENTER   // '\x0d' - Enter/Return
```

### Usage with sendInput

```typescript
// Send Ctrl+C to interrupt current process
terminalRef.current?.sendInput(TtydTerminal.CTRL_C);

// Clear the terminal screen
terminalRef.current?.sendInput(TtydTerminal.CTRL_L);

// Send Tab for auto-completion
terminalRef.current?.sendInput(TtydTerminal.TAB);
```

**Note**: When using the TtydTerminal enum in Next.js with SSR, ensure it's only imported in client-side components or use dynamic imports to avoid SSR issues.