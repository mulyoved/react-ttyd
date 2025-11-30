'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { RendererType, TtydHandle } from 'react-ttyd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Power, Eraser, ListTree, SquareX, RefreshCw, ListRestart, CornerDownLeft } from 'lucide-react';
import { StripeButtonBar, StripeButton, SideButtonOverlay } from '@/components/stripe-button-bar';

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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [commandInput, setCommandInput] = useState('');
    const [pasteText, setPasteText] = useState('');
    const [isWindowPickerOpen, setIsWindowPickerOpen] = useState(false);
    const [options] = useState({
        wsUrl: 'wss://dev-remote-machine-1.tail83108.ts.net:4003/ws',
        rendererType: 'webgl' as RendererType,
        fontSize: 13,
        username: '',
        password: '',
    });
    const windowPickerRef = useRef<HTMLDivElement | null>(null);
    const windowPickerTriggerRef = useRef<HTMLButtonElement | null>(null);

    const disconnect = () => {
        if (connectionStatus !== 'connected') return;
        terminalRef.current?.disconnect();
    };

    const handleConnectionOpen = useCallback((event: Event) => {
        console.log('Connected to ttyd server', event);
        setConnectionStatus('connected');
    }, []);

    const handleConnectionClose = useCallback((event: CloseEvent) => {
        console.log('Disconnected from ttyd server', event);
        setConnectionStatus('disconnected');
    }, []);

    const handleConnectionError = useCallback((event: Event) => {
        console.error('Connection error:', event);
        setConnectionStatus('error');
    }, []);

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

    const handleClearScreen = () => {
        terminalRef.current?.execute('clear');
    };

    const handleListFiles = () => {
        terminalRef.current?.execute('ls -la');
    };

    const handleInterrupt = () => {
        terminalRef.current?.sendInput('\x03');
    };

    const handleSelectWindow = (index: number) => {
        console.log('tmux switch send', index);
        const CTRL_B = '\x02';
        // tmux prefix + digit (raw keystrokes)
        terminalRef.current?.sendInput(CTRL_B);
        setTimeout(() => {
            terminalRef.current?.sendInput(String(index));
        }, 50);
        setIsWindowPickerOpen(false);
    };

    const handleReconnect = () => {
        if (connectionStatus === 'connected') {
            terminalRef.current?.disconnect();
        }
        setConnectionStatus('disconnected');
        setConnectionKey(prev => prev + 1);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isWindowPickerOpen) return;
        const handleClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (windowPickerRef.current?.contains(target)) return;
            if (windowPickerTriggerRef.current?.contains(target)) return;
            setIsWindowPickerOpen(false);
        };
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, [isWindowPickerOpen]);

    const isConnected = connectionStatus === 'connected';

    const stripeButtons = [
        {
            key: 'disconnect',
            label: 'Disconnect',
            icon: <Power className="h-4 w-4" />,
            onClick: disconnect,
            tone: 'danger' as const,
            disabled: !isConnected,
        },
        {
            key: 'clear',
            label: 'Clear screen',
            icon: <Eraser className="h-4 w-4" />,
            onClick: handleClearScreen,
            tone: 'muted' as const,
            disabled: !isConnected,
        },
        {
            key: 'list',
            label: 'List files',
            icon: <ListTree className="h-4 w-4" />,
            onClick: handleListFiles,
            disabled: !isConnected,
        },
        {
            key: 'interrupt',
            label: 'Send Ctrl+C',
            icon: <SquareX className="h-4 w-4" />,
            onClick: handleInterrupt,
            tone: 'danger' as const,
            disabled: !isConnected,
        },
        {
            key: 'escape',
            label: 'ESC',
            icon: <span className="text-xs font-bold">ESC</span>,
            onClick: () => terminalRef.current?.sendInput('\x1b'),
            tone: 'muted' as const,
        },
    ];

    return (
        <div className="h-screen overflow-hidden bg-background p-2 sm:p-4 md:p-8">
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
                    />
                </div>
                {isWindowPickerOpen && (
                    <SideButtonOverlay
                        ref={windowPickerRef}
                        buttons={[0, 1, 2, 3, 4].map((num) => ({
                            key: `win-left-${num}`,
                            label: `Window ${num}`,
                            icon: <span className="text-xs font-mono leading-none">{num}</span>,
                            onClick: () => handleSelectWindow(num),
                            disabled: !isConnected,
                        }))}
                        side="left"
                    />
                )}
                <StripeButtonBar footer={<div className="h-1 w-full rounded-full bg-main shadow-shadow" />}>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <StripeButton
                                label="Terminal Commander"
                                icon={<Bot className="h-4 w-4" />}
                                disabled={!isConnected}
                                onClick={() => setIsWindowPickerOpen(false)}
                            />
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
                    <StripeButton
                        label="Switch tmux window"
                        icon={<ListRestart className="h-4 w-4" />}
                        ref={windowPickerTriggerRef}
                        onClick={() => setIsWindowPickerOpen(!isWindowPickerOpen)}
                        disabled={!isConnected}
                    />
                    {stripeButtons.map((action) => (
                        <StripeButton
                            key={action.key}
                            label={action.label}
                            icon={action.icon}
                            tone={action.tone}
                            active={action.active}
                            disabled={action.disabled}
                            onClick={() => {
                                setIsWindowPickerOpen(false);
                                action.onClick();
                            }}
                        />
                    ))}
                </StripeButtonBar>
            </div>
        </div>
    );
}
