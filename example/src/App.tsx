import { useState } from 'react';
import { Ttyd } from 'react-ttyd';
import type { RendererType } from 'react-ttyd';
import 'react-ttyd/dist/index.css';
import './App.css';

function App() {
    const [connectionKey, setConnectionKey] = useState(0);
    const [options, setOptions] = useState({
        wsUrl: 'ws://localhost:7681/ws',
        rendererType: 'webgl' as RendererType,
        fontSize: 13,
        username: '',
        password: '',
    });
    const [formState, setFormState] = useState({
        wsUrl: 'ws://localhost:7681/ws',
        rendererType: 'webgl' as RendererType,
        fontSize: 13,
        username: '',
        password: '',
    });

    const handleApplySettings = () => {
        setOptions(formState);
        // Force reconnection by changing the key
        setConnectionKey(prev => prev + 1);
    };

    return (
        <div className="app-container">
            <div className="github-banner">
                <a
                    href="https://github.com/tantara/react-ttyd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-link"
                >
                    <svg className="github-icon" viewBox="0 0 16 16" width="20" height="20">
                        <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                    </svg>
                    <span>Star on GitHub</span>
                </a>
            </div>
            <div className="content-wrapper">
                <div className="settings-window">
                <div className="settings-panel">
                    <h3>
                        <a href="https://github.com/tantara/react-ttyd" target="_blank" rel="noopener noreferrer">react-ttyd</a>: 
                        React component for <a href="https://github.com/tsl0922/ttyd" target="_blank" rel="noopener noreferrer">ttyd</a> web terminal
                    </h3>
                    <p className="start-ttyd">
                        Start ttyd server: <a href="https://github.com/tsl0922/ttyd" target="_blank" rel="noopener noreferrer">ttyd on GitHub</a>
                    </p>
                    <pre className="ttyd-commands">
                        <code>$ brew install ttyd</code>
                        <code>$ ttyd --writable bash</code>
                        <code>$ # With basic auth:</code>
                        <code>$ ttyd --writable --credential testuser:testpass bash</code>
                        <code className="output">lws_socket_bind: source ads 127.0.0.1</code>
                        <code className="output">Listening on port: 7681</code>
                    </pre>
                    <h4 className="connect-heading">Connect to ttyd server:</h4>
                    <div className="settings-form">
                        <div className="form-group">
                            <label htmlFor="wsUrl">TTYD WebSocket URL:</label>
                            <input
                                id="wsUrl"
                                type="text"
                                value={formState.wsUrl}
                                onChange={(e) => setFormState(prev => ({ ...prev, wsUrl: e.target.value }))}
                                placeholder="ws://localhost:7681/ws"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="rendererType">Renderer Type:</label>
                            <select
                                id="rendererType"
                                value={formState.rendererType}
                                onChange={(e) =>
                                    setFormState(prev => ({
                                        ...prev,
                                        rendererType: e.target.value as RendererType,
                                    }))
                                }
                            >
                                <option value="webgl">WebGL (Recommended)</option>
                                <option value="canvas">Canvas</option>
                                <option value="dom">DOM</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="fontSize">Font Size:</label>
                            <input
                                id="fontSize"
                                type="number"
                                min="8"
                                max="24"
                                value={formState.fontSize}
                                onChange={(e) =>
                                    setFormState(prev => ({
                                        ...prev,
                                        fontSize: parseInt(e.target.value),
                                    }))
                                }
                            />
                        </div>
                        <div className="auth-fields">
                            <div className="form-group">
                                <label htmlFor="username">Username (for auth):</label>
                                <input
                                    id="username"
                                    type="text"
                                    value={formState.username}
                                    onChange={(e) => setFormState(prev => ({ ...prev, username: e.target.value }))}
                                    placeholder="Optional"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="password">Password (for auth):</label>
                                <input
                                    id="password"
                                    type="password"
                                    value={formState.password}
                                    onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>
                        <button className="apply-btn" onClick={handleApplySettings}>
                            Connect
                        </button>
                    </div>
                </div>
            </div>
            <div className="terminal-window">
                <div className="terminal-header">
                    <div className="terminal-controls">
                        <button className="control-btn close" aria-label="Close"></button>
                        <button className="control-btn minimize" aria-label="Minimize"></button>
                        <button className="control-btn maximize" aria-label="Maximize"></button>
                    </div>
                    <div className="terminal-title">Terminal</div>
                </div>
                <div className="terminal-body">
                    <Ttyd
                        key={connectionKey}
                        wsUrl={options.wsUrl}
                        authToken={options.username && options.password ? btoa(`${options.username}:${options.password}`) : undefined}
                        clientOptions={{
                            rendererType: options.rendererType,
                        }}
                        termOptions={{
                            fontSize: options.fontSize,
                        }}
                    />
                </div>
            </div>
            <div className="example-window">
                <div className="example-section">
                    <h4>Example Code:</h4>
                    <pre className="example-code">
                        <code>{`import { Ttyd } from 'react-ttyd';

// Basic usage
<Ttyd
    wsUrl="ws://localhost:7681/ws"
    clientOptions={{
        rendererType: 'webgl',
    }}
    termOptions={{
        fontSize: 14,
    }}
/>

// With basic authentication
<Ttyd
    wsUrl="ws://localhost:7681/ws"
    authToken={btoa('testuser:testpass')}
    clientOptions={{
        rendererType: 'webgl',
    }}
/>`}</code>
                    </pre>
                </div>
            </div>
            </div>
        </div>
    );
}

export default App;
