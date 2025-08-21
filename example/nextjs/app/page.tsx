'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { RendererType, TtydHandle } from 'react-ttyd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Github, Terminal, Circle, Zap, Maximize2, Minimize2, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Dynamic import with SSR disabled
const Ttyd = dynamic(
    () => import('react-ttyd').then(mod => mod.Ttyd),
    { 
        ssr: false,
        loading: () => (
            <div className="flex items-center justify-center h-full text-white">
                <p className="font-mono">Loading terminal...</p>
            </div>
        )
    }
);

// Predefined keyboard shortcuts - using string literals to avoid SSR issues
const keyboardShortcuts = [
    { name: 'Ctrl+C', key: '\x03', description: 'Interrupt/Cancel current process' },
    { name: 'Ctrl+D', key: '\x04', description: 'End of file (EOF) / Exit' },
    { name: 'Ctrl+Z', key: '\x1a', description: 'Suspend current process' },
    { name: 'Ctrl+A', key: '\x01', description: 'Move cursor to beginning of line' },
    { name: 'Ctrl+E', key: '\x05', description: 'Move cursor to end of line' },
    { name: 'Ctrl+K', key: '\x0b', description: 'Kill/Delete from cursor to end of line' },
    { name: 'Ctrl+U', key: '\x15', description: 'Kill/Delete from cursor to beginning of line' },
    { name: 'Ctrl+W', key: '\x17', description: 'Delete word before cursor' },
    { name: 'Ctrl+L', key: '\x0c', description: 'Clear screen' },
    { name: 'Ctrl+R', key: '\x12', description: 'Reverse search command history' },
    { name: 'Tab', key: '\x09', description: 'Auto-complete' },
    { name: 'Escape', key: '\x1b', description: 'Escape key' },
];

export default function Home() {
    const terminalRef = useRef<TtydHandle>(null);
    const [connectionKey, setConnectionKey] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
    const [outputLog, setOutputLog] = useState<string[]>([]);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [commandInput, setCommandInput] = useState('');
    const [pasteText, setPasteText] = useState('');
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
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

    const disconnect = () => {
        if (connectionStatus !== 'connected') return;
        terminalRef.current?.disconnect();
        setIsFullscreen(false);
    }

    const handleApplySettings = () => {
        if (connectionStatus === 'connected') {
            // Disconnect using the terminalRef
            disconnect();
        } else {
            setOptions(formState);
            // Force reconnection by changing the key
            setConnectionKey(prev => prev + 1);
        }
    };

    // Event callbacks
    const handleConnectionOpen = useCallback((event: Event) => {
        console.log('Connected to ttyd server', event);
        setConnectionStatus('connected');
    }, []);

    const handleConnectionClose = useCallback((event: CloseEvent) => {
        console.log('Disconnected from ttyd server', event);
        setConnectionStatus('disconnected');
        toast.error('Disconnected from terminal server', {
            description: `Connection closed with code ${event.code}${event.reason ? `: ${event.reason}` : ''}`,
        });
    }, []);

    const handleConnectionError = useCallback((event: Event) => {
        console.error('Connection error:', event);
        setConnectionStatus('error');
        toast.error('Terminal connection error', {
            description: 'Failed to establish connection with the terminal server. Please check your settings.',
        });
    }, []);

    const handleData = useCallback((data: string) => {
        console.log('Terminal output:', data);
        setOutputLog(prev => {
            const newLog = [...prev, data];
            // Keep only the last 10 entries
            return newLog.slice(-10);
        });
    }, []);

    const getStatusVariant = () => {
        switch (connectionStatus) {
            case 'connected':
                return 'default';
            case 'error':
                return 'default';
            default:
                return 'neutral';
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleExecuteCommand = () => {
        if (terminalRef.current && commandInput.trim()) {
            terminalRef.current.execute(commandInput);
            setCommandInput('');
            setIsDialogOpen(false);
        }
    };

    const handlePasteText = () => {
        if (terminalRef.current && pasteText.trim()) {
            terminalRef.current.execute(pasteText, false);
            setPasteText('');
            setIsDialogOpen(false);
        }
    };

    const handleSendShortcut = (key: string) => {
        if (terminalRef.current) {
            terminalRef.current.sendInput(key);
        }
    };

    // Trigger resize event when fullscreen state changes
    useEffect(() => {
        // Small delay to ensure DOM has updated
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);

        return () => clearTimeout(timer);
    }, [isFullscreen]);

    return (
        <div className="min-h-screen bg-background p-2 sm:p-4 md:p-8">
            {/* GitHub Banner */}
            <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-40">
                <Button asChild variant="neutral" size="sm" className="bg-yellow-400 text-black hover:bg-yellow-300 px-2 sm:px-3">
                    <a
                        href="https://github.com/tantara/react-ttyd"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 sm:gap-2 no-underline"
                    >
                        <Github className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="hidden sm:inline">Star on GitHub</span>
                    </a>
                </Button>
            </div>

            <div className="mx-auto max-w-6xl space-y-4 sm:space-y-6 md:space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-4xl md:text-6xl font-black uppercase tracking-tight">
                        React TTYD
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-muted-foreground">
                        Run terminal in your browser with React
                    </p>
                </div>

                {/* Settings Card */}
                <Card className="bg-main border-2 border-border shadow-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Configuration Panel
                        </CardTitle>
                        <CardDescription className="font-medium">
                            Configure your terminal connection and appearance
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Installation Commands */}
                        <div className="rounded-base bg-black text-green-400 p-2 sm:p-4 font-mono text-xs sm:text-sm border-2 border-border shadow-shadow overflow-x-auto">
                            <div>$ brew install ttyd</div>
                            <div>$ ttyd --writable bash</div>
                            <div>$ # With basic auth:</div>
                            <div className="break-all">$ ttyd --writable --credential testuser:testpw bash</div>
                            <div className="ml-2 sm:ml-5 text-gray-400">lws_socket_bind: source ads 127.0.0.1</div>
                            <div className="ml-2 sm:ml-5 text-gray-400">Listening on port: 7681</div>
                        </div>

                        {/* Connection Settings */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold uppercase tracking-wider">Connection Settings</h4>
                            <div className="space-y-4">
                                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="wsUrl" className="font-bold">WebSocket URL</Label>
                                        <Input
                                            id="wsUrl"
                                            type="text"
                                            value={formState.wsUrl}
                                            onChange={(e) => setFormState(prev => ({ ...prev, wsUrl: e.target.value }))}
                                            placeholder="ws://localhost:7681/ws"
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <Button 
                                            onClick={handleApplySettings} 
                                            className={`w-full uppercase font-bold border-2 border-black ${
                                                connectionStatus === 'connected' 
                                                    ? 'bg-red-500 text-white hover:bg-red-400' 
                                                    : 'bg-green-400 text-black hover:bg-green-300'
                                            }`}
                                        >
                                            {connectionStatus === 'connected' ? 'Disconnect' : 'Connect Terminal'}
                                        </Button>
                                    </div>
                                </div>
                                
                                {/* Advanced Options Toggle */}
                                <Button
                                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                                    variant="neutral"
                                    className="flex items-center gap-2 text-sm font-bold"
                                >
                                    {showAdvancedOptions ? (
                                        <>
                                            <ChevronUp className="h-4 w-4" />
                                            Hide Advanced Options
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-4 w-4" />
                                            Show Advanced Options
                                        </>
                                    )}
                                </Button>
                                
                                {/* Advanced Options */}
                                {showAdvancedOptions && (
                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 pt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="rendererType" className="font-bold">Renderer Type</Label>
                                            <Select
                                                value={formState.rendererType}
                                                onValueChange={(value) =>
                                                    setFormState(prev => ({
                                                        ...prev,
                                                        rendererType: value as RendererType,
                                                    }))
                                                }
                                            >
                                                <SelectTrigger id="rendererType" className="bg-white">
                                                    <SelectValue placeholder="Select renderer" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="webgl">WebGL (Recommended)</SelectItem>
                                                    <SelectItem value="canvas">Canvas</SelectItem>
                                                    <SelectItem value="dom">DOM</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="fontSize" className="font-bold">Font Size</Label>
                                            <Input
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
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="username" className="font-bold">Username</Label>
                                            <Input
                                                id="username"
                                                type="text"
                                                value={formState.username}
                                                onChange={(e) => setFormState(prev => ({ ...prev, username: e.target.value }))}
                                                placeholder="Optional"
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="password" className="font-bold">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={formState.password}
                                                onChange={(e) => setFormState(prev => ({ ...prev, password: e.target.value }))}
                                                placeholder="Optional"
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Terminal */}
                <div className={`overflow-hidden bg-black ${
                    isFullscreen ? 'fixed inset-0 z-50 flex flex-col mb-0' : 'border-2 border-border shadow-shadow'
                }`}>
                    <div className="flex items-center justify-between border-b-2 border-black bg-gray-900 px-2 sm:px-4 py-2 sm:py-3">
                        <div className="flex items-center gap-2">
                            <div className="flex gap-1 sm:gap-2">
                                <button
                                    onClick={disconnect}
                                    className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-red-500 border-2 border-red-600 hover:bg-red-400 transition-colors cursor-pointer"
                                    title="Disconnect"
                                />
                                <div className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-yellow-500 border-2 border-yellow-600" />
                                <button
                                    onClick={toggleFullscreen}
                                    className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-green-500 border-2 border-green-600 hover:bg-green-400 transition-colors cursor-pointer"
                                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-bold">
                            <Terminal className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                            <span className="text-white hidden sm:inline">TERMINAL</span>
                            <Badge variant={getStatusVariant()} className="ml-1 sm:ml-2 text-[10px] sm:text-xs">
                                <Circle className={`mr-1 h-1.5 w-1.5 sm:h-2 sm:w-2 fill-current`} />
                                {connectionStatus.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button
                                        size="sm"
                                        variant="noShadow"
                                        className="text-white hover:bg-gray-800"
                                        disabled={connectionStatus !== 'connected'}
                                    >
                                        <Bot className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[525px]">
                                    <DialogHeader>
                                        <DialogTitle>Terminal Commander</DialogTitle>
                                        <DialogDescription>
                                            Execute commands or paste text to the terminal.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <Tabs defaultValue="execute" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="execute">Execute</TabsTrigger>
                                            <TabsTrigger value="paste">Paste</TabsTrigger>
                                            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="execute" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="command">Command</Label>
                                                <Input
                                                    id="command"
                                                    value={commandInput}
                                                    onChange={(e) => setCommandInput(e.target.value)}
                                                    onKeyPress={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleExecuteCommand();
                                                        }
                                                    }}
                                                    placeholder="ls -la"
                                                />
                                                <p className="text-sm text-muted-foreground">
                                                    This will execute the command immediately.
                                                </p>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleExecuteCommand} type="submit">
                                                    Execute
                                                </Button>
                                            </DialogFooter>
                                        </TabsContent>
                                        <TabsContent value="paste" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="paste-text">Text to Paste</Label>
                                                <Textarea
                                                    id="paste-text"
                                                    value={pasteText}
                                                    onChange={(e) => setPasteText(e.target.value)}
                                                    placeholder="Enter multiple lines of text or commands..."
                                                    className="min-h-[120px]"
                                                />
                                                <p className="text-sm text-muted-foreground">
                                                    This will paste the text without executing it.
                                                </p>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handlePasteText} type="button">
                                                    Paste
                                                </Button>
                                            </DialogFooter>
                                        </TabsContent>
                                        <TabsContent value="shortcuts" className="space-y-4">
                                            <div className="space-y-2">
                                                <p className="text-sm text-muted-foreground">
                                                    Click on any shortcut to send it to the terminal.
                                                </p>
                                                <ScrollArea className="h-[300px] rounded-base border-2 border-border bg-white">
                                                    <div className="p-2 space-y-2">
                                                        {keyboardShortcuts.map((shortcut) => (
                                                            <Button
                                                                key={shortcut.name}
                                                                variant="neutral"
                                                                className="w-full h-auto py-3 px-4 justify-start text-left bg-secondary-background hover:bg-main hover:text-main-foreground transition-colors"
                                                                onClick={() => {
                                                                    handleSendShortcut(shortcut.key);
                                                                    setIsDialogOpen(false);
                                                                }}
                                                            >
                                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-1 sm:gap-2">
                                                                    <span className="font-mono font-bold text-sm">{shortcut.name}</span>
                                                                    <span className="text-xs sm:text-sm text-muted-foreground sm:text-right flex-1">{shortcut.description}</span>
                                                                </div>
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </DialogContent>
                            </Dialog>
                            <Button
                                onClick={toggleFullscreen}
                                size="sm"
                                variant="noShadow"
                                className="text-white hover:bg-gray-800"
                            >
                                {isFullscreen ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                    <div className={`bg-black ${
                        isFullscreen ? 'flex-1' : 'h-[300px] sm:h-[400px] md:h-[500px]'
                    }`}>
                        <Ttyd
                            key={connectionKey}
                            terminalRef={terminalRef}
                            wsUrl={options.wsUrl}
                            authToken={options.username && options.password ? btoa(`${options.username}:${options.password}`) : undefined}
                            clientOptions={{
                                rendererType: options.rendererType,
                            }}
                            termOptions={{
                                fontSize: options.fontSize,
                            }}
                            onConnectionOpen={handleConnectionOpen}
                            onConnectionClose={handleConnectionClose}
                            onConnectionError={handleConnectionError}
                            onData={handleData}
                        />
                    </div>
                </div>

                {/* Output Log and Example Code */}
                <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 lg:grid-cols-2">
                    {/* Terminal Output Log */}
                    <Card className="bg-secondary-background border-2 border-border shadow-shadow">
                        <CardHeader>
                            <CardTitle className="text-base font-black uppercase">Terminal Output Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[150px] sm:h-[200px] w-full rounded-base bg-black p-2 sm:p-4 border-2 border-border shadow-shadow">
                                <div className="font-mono text-xs sm:text-sm text-green-400">
                                    {outputLog.length === 0 ? (
                                        <span className="text-gray-500">No output yet...</span>
                                    ) : (
                                        outputLog.map((line, index) => (
                                            <div key={index} className="break-all">
                                                {line}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    {/* Example Code */}
                    <Card className="bg-main text-main-foreground border-2 border-border shadow-shadow">
                        <CardHeader>
                            <CardTitle className="text-base font-black uppercase">Example Code</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[150px] sm:h-[200px] w-full rounded-none bg-black p-2 sm:p-4 border-neobrutalism">
                                <pre className="font-mono text-xs sm:text-sm text-green-400">
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
    authToken={btoa('testuser:testpw')}
    clientOptions={{
        rendererType: 'webgl',
    }}
/>

// With event callbacks
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
/>`}</code>
                                </pre>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}