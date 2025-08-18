import { useState, useCallback } from 'react';
import { Ttyd } from 'react-ttyd';
import 'react-ttyd/dist/index.css';

/**
 * Example demonstrating how to use event callbacks with react-ttyd
 */
export function EventCallbacksExample() {
    const [connectionLog, setConnectionLog] = useState<string[]>([]);
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);

    const addLog = useCallback((message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setConnectionLog(prev => [...prev, `[${timestamp}] ${message}`]);
    }, []);

    const handleConnectionOpen = useCallback((event: Event) => {
        console.log('Connected to ttyd server', event);
        addLog('✅ Connected to ttyd server');
    }, [addLog]);

    const handleConnectionClose = useCallback((event: CloseEvent) => {
        console.log('Disconnected from ttyd server', event);
        addLog(`❌ Disconnected from ttyd server (code: ${event.code}, reason: ${event.reason})`);
    }, [addLog]);

    const handleConnectionError = useCallback((event: Event) => {
        console.error('Connection error:', event);
        addLog('⚠️ Connection error occurred');
    }, [addLog]);

    const handleData = useCallback((data: string) => {
        // Log raw data to console
        console.log('Terminal output:', data);
        
        // Store a sample of the output (last 10 lines)
        setTerminalOutput(prev => {
            const newOutput = [...prev, data];
            return newOutput.slice(-10);
        });
    }, []);

    return (
        <div style={{ display: 'flex', height: '100vh', gap: '20px', padding: '20px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h2>Terminal with Event Callbacks</h2>
                <div style={{ flex: 1, border: '1px solid #333' }}>
                    <Ttyd
                        wsUrl="ws://localhost:7681/ws"
                        onConnectionOpen={handleConnectionOpen}
                        onConnectionClose={handleConnectionClose}
                        onConnectionError={handleConnectionError}
                        onData={handleData}
                        clientOptions={{
                            rendererType: 'webgl',
                        }}
                        termOptions={{
                            fontSize: 14,
                        }}
                    />
                </div>
            </div>
            
            <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <h3>Connection Log</h3>
                    <div style={{
                        height: '200px',
                        overflowY: 'auto',
                        border: '1px solid #333',
                        padding: '10px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        backgroundColor: '#f5f5f5'
                    }}>
                        {connectionLog.length === 0 ? (
                            <span style={{ color: '#999' }}>No connection events yet...</span>
                        ) : (
                            connectionLog.map((log, i) => (
                                <div key={i}>{log}</div>
                            ))
                        )}
                    </div>
                </div>
                
                <div>
                    <h3>Terminal Output Sample</h3>
                    <div style={{
                        height: '300px',
                        overflowY: 'auto',
                        border: '1px solid #333',
                        padding: '10px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                        backgroundColor: '#1e1e1e',
                        color: '#d4d4d4'
                    }}>
                        {terminalOutput.length === 0 ? (
                            <span style={{ color: '#666' }}>No terminal output yet...</span>
                        ) : (
                            terminalOutput.map((output, i) => (
                                <div key={i} style={{ wordBreak: 'break-all' }}>{output}</div>
                            ))
                        )}
                    </div>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                        Showing last 10 output chunks. Check console for full output.
                    </p>
                </div>
            </div>
        </div>
    );
}