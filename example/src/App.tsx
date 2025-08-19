import { useState } from 'react';
import { Ttyd } from 'react-ttyd';
import type { RendererType } from 'react-ttyd';
import 'react-ttyd/dist/index.css';
import './App.css';

function App() {
    const [options, setOptions] = useState({
        wsUrl: 'ws://localhost:7681/ws',
        rendererType: 'webgl' as RendererType,
        fontSize: 13,
    });
    const [formState, setFormState] = useState({
        wsUrl: 'ws://localhost:7681/ws',
        rendererType: 'webgl' as RendererType,
        fontSize: 13,
    });

    const handleApplySettings = () => {
        setOptions(formState);
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
            <div className="settings-window">
                <div className="settings-panel">
                    <h3>Terminal Settings</h3>
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
                                        fontSize: parseInt(e.target.value) || 13,
                                    }))
                                }
                            />
                        </div>
                        <button className="apply-btn" onClick={handleApplySettings}>
                            Apply Settings
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
                        wsUrl={options.wsUrl}
                        clientOptions={{
                            rendererType: options.rendererType,
                        }}
                        termOptions={{
                            fontSize: options.fontSize,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default App;
