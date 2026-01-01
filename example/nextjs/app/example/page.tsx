'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { RendererType, TtydHandle } from 'react-ttyd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    ArrowBigRightDash,
    Bot,
    ChevronDown,
    ChevronUp,
    ClipboardPaste,
    Command,
    Copy,
    Ellipsis,
    Github,
    Keyboard,
    RotateCcw,
    Settings,
    X,
    Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { StripeButtonBar, StripeButton, SideButtonOverlay } from '@/components/stripe-button-bar';
import { commandPresets, type CommandPreset, type CommandStep } from '../configure';
import {
    KEYBOARD_MENU_KEYBOARD_ID,
    MAIN_MENU_KEYBOARD_ID,
    SECONDARY_MENU_KEYBOARD_ID,
    KeyboardConfiguratorProvider,
    slotLabel,
    useKeyboardConfigurator,
    type ActionCode,
    type SlotItem,
} from '../keyboard-configurator/configurator-context';
import { runSlotItem, slotRequiresConnection } from '@/lib/keyboard-runtime';
import { TerminalCommander } from '@/components/terminal-commander';

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

export default function Home() {
    return (
        <KeyboardConfiguratorProvider>
            <ExampleContent />
        </KeyboardConfiguratorProvider>
    );
}

function ExampleContent() {
    const terminalRef = useRef<TtydHandle>(null);
    const [connectionKey, setConnectionKey] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
    const [outputLog, setOutputLog] = useState<string[]>([]);
    const [isCommanderOpen, setIsCommanderOpen] = useState(false);
    const [isCommandPickerOpen, setIsCommandPickerOpen] = useState(false);
    const [menuId, setMenuId] = useState(KEYBOARD_MENU_KEYBOARD_ID);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const [options, setOptions] = useState({
        wsUrl: 'wss://dev-remote-machine-1.tail83108.ts.net:4003/ws',
        rendererType: 'webgl' as RendererType,
        fontSize: 13,
        username: '',
        password: '',
    });
    const { config, macrosByKeyboardId, isLoading } = useKeyboardConfigurator();
    const [tmuxWindows] = useState<number[]>(() => {
        if (typeof window === 'undefined') return [0, 1, 2, 3, 4];
        const param = new URLSearchParams(window.location.search).get('tmuxWindows');
        const parsed = param
            ?.split(',')
            .map((value) => parseInt(value.trim(), 10))
            .filter((num) => !Number.isNaN(num));
        return parsed && parsed.length > 0 ? parsed : [0, 1, 2, 3, 4];
    });
    const [tmuxCycleIndex, setTmuxCycleIndex] = useState(0);
    const commandPickerRef = useRef<HTMLDivElement | null>(null);
    const commandPickerTriggerRef = useRef<HTMLButtonElement | null>(null);
    const [formState, setFormState] = useState({
        wsUrl: 'wss://dev-remote-machine-1.tail83108.ts.net:4003/ws',
        rendererType: 'webgl' as RendererType,
        fontSize: 13,
        username: '',
        password: '',
    });
    const [, setIsFullscreen] = useState(false);

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

    const sendStep = (step: CommandStep) => {
        if (!terminalRef.current) return;
        const times = step.repeat ?? 1;
        for (let i = 0; i < times; i += 1) {
            switch (step.type) {
                case 'text':
                    terminalRef.current.sendInput(step.data);
                    break;
                case 'enter':
                    terminalRef.current.sendInput('\r');
                    break;
                case 'arrowDown':
                    terminalRef.current.sendInput('\x1b[B');
                    break;
                case 'arrowUp':
                    terminalRef.current.sendInput('\x1b[A');
                    break;
                case 'esc':
                    terminalRef.current.sendInput('\x1b');
                    break;
                case 'space':
                    terminalRef.current.sendInput(' ');
                    break;
                case 'tab':
                    terminalRef.current.sendInput('\t');
                    break;
                default:
                    break;
            }
        }
    };

    const handleSelectCommand = (cmd: CommandPreset) => {
        if (!terminalRef.current) return;
        const baseDelay = 50;
        let delay = 0;
        cmd.steps.forEach((step) => {
            const stepDelay = step.delayMs ?? baseDelay;
            setTimeout(() => sendStep(step), delay);
            delay += stepDelay * (step.repeat ?? 1);
        });
        setIsCommandPickerOpen(false);
    };

    const handlePasteFromClipboard = async () => {
        if (!terminalRef.current) return;
        let text = '';
        if (navigator.clipboard?.readText) {
            try {
                text = await navigator.clipboard.readText();
            } catch {
                text = '';
            }
        }
        if (!text) {
            const prompted = window.prompt('Paste text to send to terminal:');
            if (!prompted) return;
            text = prompted;
        }
        terminalRef.current.execute(text, false);
    };

    const handleCopySelection = () => {
        const selected = window.getSelection()?.toString();
        if (!selected) return;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(selected).catch(() => document.execCommand('copy'));
        } else {
            document.execCommand('copy');
        }
    };

    const handleSelectWindow = useCallback((index: number) => {
        console.log('tmux switch send', index);
        const term = terminalRef.current;
        if (!term) return;

        // Ctrl+B + digits was timing-unstable (could leak digits to the pane); we rely on prefixless
        // tmux bindings on function keys instead. Ensure tmux maps F1-F9 -> windows 1-9 and F10 -> 0.
        const fnSequences: Record<number, string> = {
            1: "\u001bOP",   // F1
            2: "\u001bOQ",   // F2
            3: "\u001bOR",   // F3
            4: "\u001bOS",   // F4
            5: "\u001b[15~", // F5
            6: "\u001b[17~", // F6
            7: "\u001b[18~", // F7
            8: "\u001b[19~", // F8
            9: "\u001b[20~", // F9
            0: "\u001b[21~", // F10
        };

        const seq = fnSequences[index];
        if (seq) {
            term.sendInput(seq);
            return;
        }
    }, []);

    const cycleTmuxWindow = useCallback(() => {
        if (!terminalRef.current || tmuxWindows.length === 0) return;
        setTmuxCycleIndex((prev) => {
            const targetIdx = prev % tmuxWindows.length;
            const targetWindow = tmuxWindows[targetIdx];
            handleSelectWindow(targetWindow);
            return (targetIdx + 1) % tmuxWindows.length;
        });
    }, [handleSelectWindow, tmuxWindows]);

    // Trigger resize event when fullscreen state changes
    useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isCommandPickerOpen) return;
        const handleClick = (event: MouseEvent) => {
            const target = event.target as Node;
            const insideCommandOverlay = commandPickerRef.current?.contains(target);
            const insideCommandTrigger = commandPickerTriggerRef.current?.contains(target);

            if (insideCommandOverlay || insideCommandTrigger) return;

            setIsCommandPickerOpen(false);
        };
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, [isCommandPickerOpen]);

    const isConnected = connectionStatus === 'connected';
    // Menu keyboards come from the configurator layouts (main / secondary / keyboard).
    const menuOrder = [MAIN_MENU_KEYBOARD_ID, SECONDARY_MENU_KEYBOARD_ID, KEYBOARD_MENU_KEYBOARD_ID];
    const availableMenuIds = menuOrder.filter((id) => config.keyboards.some((keyboard) => keyboard.id === id));
    const fallbackMenuId = availableMenuIds[0] ?? config.keyboards[0]?.id ?? KEYBOARD_MENU_KEYBOARD_ID;
    const menuKeyboard =
        config.keyboards.find((keyboard) => keyboard.id === menuId) ??
        config.keyboards.find((keyboard) => keyboard.id === fallbackMenuId) ??
        config.keyboards[0];
    const menuMacros = menuKeyboard ? macrosByKeyboardId[menuKeyboard.id] ?? [] : [];
    const menuSlots = menuKeyboard
        ? menuKeyboard.grid
              .flatMap((row, rowIdx) =>
                  row.map((item, colIdx) => ({
                      item,
                      key: `${menuKeyboard.id}-${rowIdx}-${colIdx}`,
                  })),
              )
              .filter((entry): entry is { item: SlotItem; key: string } => Boolean(entry.item))
        : [];

    const rotateMenu = useCallback(() => {
        if (availableMenuIds.length <= 1) return;
        const current = menuKeyboard?.id ?? menuId;
        const currentIdx = Math.max(0, availableMenuIds.indexOf(current));
        const nextIdx = (currentIdx + 1) % availableMenuIds.length;
        setMenuId(availableMenuIds[nextIdx]);
    }, [availableMenuIds, menuId, menuKeyboard?.id]);

    const handleMenuAction = useCallback((action: ActionCode) => {
        switch (action) {
            case 'OPEN_MAIN_MENU':
                setMenuId(MAIN_MENU_KEYBOARD_ID);
                setIsCommandPickerOpen(false);
                return;
            case 'OPEN_SECONDARY_MENU':
                setMenuId(SECONDARY_MENU_KEYBOARD_ID);
                setIsCommandPickerOpen(false);
                return;
            case 'OPEN_KEYBOARD_MENU':
                setMenuId(KEYBOARD_MENU_KEYBOARD_ID);
                setIsCommandPickerOpen(false);
                return;
            case 'ROTATE_KEYBOARD':
                rotateMenu();
                return;
            case 'OPEN_KEYBOARD_SETTINGS':
                window.open('/keyboard-configurator/settings', '_blank');
                return;
            case 'TOGGLE_COMMAND_PRESETS':
                setIsCommandPickerOpen((prev) => !prev);
                return;
            case 'OPEN_COMMANDER':
                setIsCommanderOpen(true);
                return;
            case 'PASTE_CLIPBOARD':
                handlePasteFromClipboard();
                return;
            case 'COPY_SELECTION':
                handleCopySelection();
                return;
            case 'CYCLE_TMUX_WINDOW':
                cycleTmuxWindow();
                return;
            default:
                return;
        }
    }, [
        cycleTmuxWindow,
        handleCopySelection,
        handlePasteFromClipboard,
        rotateMenu,
    ]);

    const handleSlotPress = useCallback((item: SlotItem) => {
        runSlotItem(item, menuMacros, {
            sendInput: (value) => terminalRef.current?.sendInput(value),
            executeCommand: (value, enter) => terminalRef.current?.execute(value, enter),
            onAction: handleMenuAction,
        });
    }, [handleMenuAction, menuMacros]);

    const renderSlotIcon = (item: SlotItem, label: string) => {
        if (item.type === 'action') {
            switch (item.action) {
                case 'OPEN_MAIN_MENU':
                    return <X className="h-4 w-4" />;
                case 'OPEN_SECONDARY_MENU':
                    return <Ellipsis className="h-4 w-4" />;
                case 'OPEN_KEYBOARD_MENU':
                    return <Keyboard className="h-4 w-4" />;
                case 'ROTATE_KEYBOARD':
                    return <RotateCcw className="h-4 w-4" />;
                case 'OPEN_KEYBOARD_SETTINGS':
                    return <Settings className="h-4 w-4" />;
                case 'TOGGLE_COMMAND_PRESETS':
                    return <Command className="h-4 w-4" />;
                case 'OPEN_COMMANDER':
                    return <Bot className="h-4 w-4" />;
                case 'PASTE_CLIPBOARD':
                    return <ClipboardPaste className="h-4 w-4" />;
                case 'COPY_SELECTION':
                    return <Copy className="h-4 w-4" />;
                case 'CYCLE_TMUX_WINDOW':
                    return <ArrowBigRightDash className="h-4 w-4" />;
                default:
                    break;
            }
        }
        return <span className="text-xs font-bold">{label}</span>;
    };

    return (
        <div className="h-screen overflow-hidden bg-background p-2 sm:p-4 md:p-8">
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

            <div className="mx-auto max-w-6xl h-full flex flex-col min-h-0 space-y-4 sm:space-y-6 md:space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-2xl sm:text-4xl md:text-6xl font-black uppercase tracking-tight">
                        React TTYD
                    </h1>
                    <p className="text-base sm:text-lg md:text-xl font-bold text-muted-foreground">
                        Run terminal in your browser with React
                    </p>
                </div>

                <div className="flex-1 min-h-0 overflow-auto space-y-4 sm:space-y-6 md:space-y-8 pb-4">
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
                                <div className="text-gray-400 mt-2">Install and run ttyd:</div>
                                <div>$ brew install ttyd</div>
                                <div>$ ttyd --writable bash</div>
                                <div className="text-gray-400 mt-2">Secure the ttyd server with basic auth:</div>
                                <div className="break-all">$ ttyd --writable --credential testuser:testpw bash</div>
                                <div className="ml-2 sm:ml-5 text-gray-400">lws_socket_bind: source ads 127.0.0.1</div>
                                <div className="ml-2 sm:ml-5 text-gray-400">Listening on port: 7681</div>
                                <div className="ml-2 sm:ml-5 text-gray-400">...</div>
                                <div className="text-gray-400 mt-2">Expose the ttyd port:</div>
                                <div>$ ngrok http 7681</div>
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
                <div className="overflow-hidden bg-black fixed inset-0 z-50 flex mb-0">
                    <div className="bg-black flex-1">
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
                    {isCommandPickerOpen && (
                        <SideButtonOverlay
                            ref={commandPickerRef}
                        buttons={[
                            ...commandPresets.map((cmd) => ({
                                key: `cmd-${cmd.label}`,
                                label: cmd.label,
                                icon: <span className="text-sm font-mono leading-none">{cmd.label}</span>,
                                onClick: () => handleSelectCommand(cmd),
                                disabled: !isConnected,
                                stretch: false,
                                size: 'default',
                                className: 'justify-start px-3',
                            })),
                            {
                                key: 'cmd-close',
                                label: 'Close list',
                                icon: <X className="h-4 w-4" />,
                                onClick: () => setIsCommandPickerOpen(false),
                                stretch: false,
                                size: 'default' as const,
                                className: 'justify-start px-3',
                            },
                        ]}
                            side="left"
                            fitContent
                        />
                    )}
                    <StripeButtonBar>
                        {menuSlots.map(({ item, key }) => {
                            const label = slotLabel(item, menuMacros);
                            const disabled = isLoading || (!isConnected && slotRequiresConnection(item));
                            const isCommandToggle = item.type === 'action' && item.action === 'TOGGLE_COMMAND_PRESETS';
                            return (
                                <StripeButton
                                    key={key}
                                    label={label}
                                    icon={renderSlotIcon(item, label)}
                                    disabled={disabled}
                                    onClick={() => {
                                        if (!isCommandToggle) {
                                            setIsCommandPickerOpen(false);
                                        }
                                        handleSlotPress(item);
                                    }}
                                    ref={isCommandToggle ? commandPickerTriggerRef : undefined}
                                />
                            );
                        })}
                    </StripeButtonBar>
                    <TerminalCommander
                        open={isCommanderOpen}
                        onOpenChange={setIsCommanderOpen}
                        terminalRef={terminalRef}
                        isConnected={isConnected}
                    />
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
        </div>
    );
}
