'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import dynamic from 'next/dynamic';
import type { RendererType, TtydHandle } from 'react-ttyd';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Bot,
    ArrowBigRightDash,
    Command,
    ArrowRightLeft,
    ArrowBigUp,
    ArrowBigDown,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Home as HomeIcon,
    CornerDownLeft,
    Copy,
    Ellipsis,
    ClipboardPaste,
    Keyboard,
    WifiSync,
    X,
} from 'lucide-react';
import { StripeButtonBar, StripeButton, SideButtonOverlay } from '@/components/stripe-button-bar';
import { commandPresets, type CommandPreset, type CommandStep } from './configure';

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
    const [isCommandPickerOpen, setIsCommandPickerOpen] = useState(false);
    const [isAdvancedMenuOpen, setIsAdvancedMenuOpen] = useState(false);
    const [scrollMode, setScrollMode] = useState(false);
    const [currentWindow, setCurrentWindow] = useState<{ index: number; name: string; paneName: string } | null>(null);
    const [options] = useState({
        wsUrl: 'wss://dev-remote-machine-1.tail83108.ts.net:4003/ws',
        rendererType: 'webgl' as RendererType,
        fontSize: 13,
        username: '',
        password: '',
    });
    const commandPickerRef = useRef<HTMLDivElement | null>(null);
    const commandPickerTriggerRef = useRef<HTMLButtonElement | null>(null);
    const advancedMenuRef = useRef<HTMLDivElement | null>(null);
    const advancedTriggerRef = useRef<HTMLButtonElement | null>(null);
    const PAGE_UP = '\x1b[5~';
    const PAGE_DOWN = '\x1b[6~';
    const LINE_UP = '\x1b[A';
    const LINE_DOWN = '\x1b[B';
    const ESC = '\x1b';
    const repeatIntervalRef = useRef<number | null>(null);
    const suppressClickRef = useRef(false);

    const stopRepeat = useCallback(() => {
        if (repeatIntervalRef.current !== null) {
            window.clearInterval(repeatIntervalRef.current);
            repeatIntervalRef.current = null;
        }
    }, []);

    const makeRepeatHandlers = (fn: () => void) => ({
        onMouseDown: (event: React.MouseEvent) => {
            event.preventDefault();
            suppressClickRef.current = true;
            fn();
            stopRepeat();
            repeatIntervalRef.current = window.setInterval(fn, 120);
        },
        onMouseUp: () => {
            stopRepeat();
            // leave suppressClickRef true so the ensuing click is ignored
        },
        onMouseLeave: () => {
            stopRepeat();
            // leave suppressClickRef true so the ensuing click is ignored
        },
        onTouchStart: (event: React.TouchEvent) => {
            event.preventDefault();
            suppressClickRef.current = true;
            fn();
            stopRepeat();
            repeatIntervalRef.current = window.setInterval(fn, 120);
        },
        onTouchEnd: () => {
            stopRepeat();
            // leave suppressClickRef true so the ensuing click is ignored
        },
        onTouchCancel: () => {
            stopRepeat();
            // leave suppressClickRef true so the ensuing click is ignored
        },
    });

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

    const handleSendShortcut = (key: string) => {
        if (terminalRef.current) {
            terminalRef.current.sendInput(key);
        }
    };

    const enterScrollMode = () => {
        setScrollMode(true);
        terminalRef.current?.sendInput(PAGE_UP);
    };

    const handlePageUp = () => {
        terminalRef.current?.sendInput(PAGE_UP);
    };

    const handlePageDown = () => {
        terminalRef.current?.sendInput(PAGE_DOWN);
    };

    const handleLineUp = () => {
        terminalRef.current?.sendInput(LINE_UP);
    };

    const handleLineDown = () => {
        terminalRef.current?.sendInput(LINE_DOWN);
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

    const exitScrollMode = () => {
        terminalRef.current?.sendInput(ESC);
        setScrollMode(false);
    };

    const handleReconnect = () => {
        if (connectionStatus === 'connected') {
            terminalRef.current?.disconnect();
        }
        setConnectionStatus('disconnected');
        setConnectionKey(prev => prev + 1);
    };

    const fetchTmuxStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/tmux-status');
            if (res.ok) {
                const data = await res.json();
                setCurrentWindow({
                    index: data.windowIndex,
                    name: data.windowName,
                    paneName: data.paneName,
                });
            }
        } catch {
            // Silently fail - tmux might not be available
        }
    }, []);

    const handleNextWindow = useCallback(() => {
        terminalRef.current?.sendInput('\x1b[1;5C');  // Ctrl+Right
        // Fetch status after a short delay to let tmux switch
        setTimeout(fetchTmuxStatus, 100);
    }, [fetchTmuxStatus]);

    useEffect(() => {
        // Fetch initial tmux status
        fetchTmuxStatus();
        // Poll every 2 seconds to keep it updated
        const interval = setInterval(fetchTmuxStatus, 2000);
        return () => clearInterval(interval);
    }, [fetchTmuxStatus]);

    useEffect(() => {
        const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isCommandPickerOpen && !isAdvancedMenuOpen) return;
        const handleClick = (event: MouseEvent) => {
            const target = event.target as Node;
            const insideCommandOverlay = commandPickerRef.current?.contains(target);
            const insideCommandTrigger = commandPickerTriggerRef.current?.contains(target);
            const insideAdvancedOverlay = advancedMenuRef.current?.contains(target);
            const insideAdvancedTrigger = advancedTriggerRef.current?.contains(target);

            if (insideCommandOverlay || insideCommandTrigger || insideAdvancedOverlay || insideAdvancedTrigger) return;

            setIsCommandPickerOpen(false);
            setIsAdvancedMenuOpen(false);
        };
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, [isCommandPickerOpen, isAdvancedMenuOpen]);

    useEffect(() => () => stopRepeat(), [stopRepeat]);

    const isConnected = connectionStatus === 'connected';

    const normalButtons = [
        {
            key: 'scroll-mode',
            label: 'Scroll Navigation Bar',
            shortLabel: 'Scroll',
            icon: <ArrowBigUp className="h-4 w-4" />,
            onClick: enterScrollMode,
            tone: 'muted' as const,
        },
        {
            key: 'next-window',
            label: 'Next Active Window',
            shortLabel: 'Window',
            icon: <ArrowBigRightDash className="h-4 w-4" />,
            onClick: handleNextWindow,
            tone: 'muted' as const,
            disabled: !isConnected,
        },
        {
            key: 'cycle-pane',
            label: 'Cycle Pane',
            shortLabel: 'Pane',
            icon: <ArrowRightLeft className="h-4 w-4" />,
            onClick: () => terminalRef.current?.sendInput('\x1b[1;5B'),  // Ctrl+Down
            tone: 'muted' as const,
            disabled: !isConnected,
        },
        {
            key: 'cmd-presets',
            label: 'Command Presets Panel',
            shortLabel: 'Cmds',
            icon: <Command className="h-4 w-4" />,
            onClick: () => setIsCommandPickerOpen(!isCommandPickerOpen),
            tone: 'muted' as const,
            disabled: !isConnected,
        },
        {
            key: 'enter',
            label: 'Enter',
            shortLabel: 'Enter',
            icon: <span className="text-2xl font-bold leading-none">⏎</span>,
            onClick: () => terminalRef.current?.sendInput('\r'),
            tone: 'muted' as const,
            disabled: !isConnected,
        },
        {
            key: 'escape',
            label: 'ESC',
            shortLabel: 'Esc',
            icon: <span className="text-xs font-bold">ESC</span>,
            onClick: () => terminalRef.current?.sendInput('\x1b'),
            tone: 'muted' as const,
        },
        {
            key: 'keyboard',
            label: 'Main Actions Bar',
            shortLabel: 'Keys',
            icon: <Keyboard className="h-4 w-4" />,
            // Show pagination controls without sending Page Up
            onClick: () => setScrollMode(true),
            tone: 'muted' as const,
            disabled: !isConnected,
        },
        {
            key: 'advanced',
            label: 'Utilities Panel',
            shortLabel: 'More',
            icon: <Ellipsis className="h-4 w-4" />,
            onClick: () => {
                setIsCommandPickerOpen(false);
                setIsAdvancedMenuOpen(!isAdvancedMenuOpen);
            },
            tone: 'muted' as const,
        },
    ];

    const scrollButtons = [
        {
            key: 'esc-key',
            label: 'Esc',
            icon: <span className="text-xs font-bold">ESC</span>,
            onClick: () => terminalRef.current?.sendInput('\x1b'),
            tone: 'muted' as const,
        },
        {
            key: 'ctrl-c',
            label: 'Ctrl+C',
            icon: <span className="text-xs font-bold">Ctrl+C</span>,
            onClick: () => terminalRef.current?.sendInput('\x03'),
            tone: 'muted' as const,
        },
        {
            key: 'tab',
            label: 'Tab',
            icon: <span className="text-xs font-bold">Tab</span>,
            onClick: () => terminalRef.current?.sendInput('\t'),
            tone: 'muted' as const,
        },
        {
            key: 'enter',
            label: 'Enter',
            shortLabel: 'Enter',
            icon: <CornerDownLeft className="h-4 w-4" />,
            onClick: () => terminalRef.current?.sendInput('\r'),
            tone: 'muted' as const,
        },
        {
            key: 'arrow-left',
            label: 'Left',
            shortLabel: 'Left',
            icon: <ArrowLeft className="h-4 w-4" />,
            onClick: () => terminalRef.current?.sendInput('\x1b[D'),
            tone: 'muted' as const,
        },
        {
            key: 'arrow-right',
            label: 'Right',
            shortLabel: 'Right',
            icon: <ArrowRight className="h-4 w-4" />,
            onClick: () => terminalRef.current?.sendInput('\x1b[C'),
            tone: 'muted' as const,
        },
        {
            key: 'home',
            label: 'Home',
            shortLabel: 'Home',
            icon: <HomeIcon className="h-4 w-4" />,
            onClick: () => terminalRef.current?.sendInput('\x1b[H'),
            tone: 'muted' as const,
        },
        {
            key: 'end',
            label: 'End',
            icon: <span className="text-xs font-bold">End</span>,
            onClick: () => terminalRef.current?.sendInput('\x1b[F'),
            tone: 'muted' as const,
        },
        {
            key: 'page-up',
            label: 'Page Up',
            shortLabel: 'Pg Up',
            icon: <ArrowBigUp className="h-5 w-5" />,
            onClick: handlePageUp,
            tone: 'muted' as const,
            repeatable: true,
        },
        {
            key: 'page-down',
            label: 'Page Down',
            shortLabel: 'Pg Dn',
            icon: <ArrowBigDown className="h-5 w-5" />,
            onClick: handlePageDown,
            tone: 'muted' as const,
            repeatable: true,
        },
        {
            key: 'line-up',
            label: 'Line Up',
            shortLabel: 'Up',
            icon: <ArrowUp className="h-4 w-4" />,
            onClick: handleLineUp,
            tone: 'muted' as const,
            repeatable: true,
        },
        {
            key: 'line-down',
            label: 'Line Down',
            shortLabel: 'Down',
            icon: <ArrowDown className="h-4 w-4" />,
            onClick: handleLineDown,
            tone: 'muted' as const,
            repeatable: true,
        },
        {
            key: 'paste',
            label: 'Paste',
            shortLabel: 'Paste',
            icon: <ClipboardPaste className="h-4 w-4" />,
            onClick: () => {
                if (!isConnected) return;
                setIsDialogOpen(true);
            },
            tone: 'muted' as const,
            disabled: !isConnected,
        },
        {
            key: 'copy-selection',
            label: 'Copy',
            shortLabel: 'Copy',
            icon: <Copy className="h-5 w-5" />,
            onClick: handleCopySelection,
            tone: 'muted' as const,
        },
        {
            key: 'fix',
            label: 'fix',
            icon: <span className="text-xs font-bold">fix</span>,
            onClick: () => {
                exitScrollMode();
                setTimeout(() => {
                    terminalRef.current?.sendInput('fix');
                    setTimeout(() => terminalRef.current?.sendInput('\r'), 80);
                }, 50);
            },
            tone: 'muted' as const,
        },
        {
            key: 'skip',
            label: 'skip',
            icon: <span className="text-xs font-bold">skip</span>,
            onClick: () => {
                exitScrollMode();
                setTimeout(() => {
                    terminalRef.current?.sendInput('skip');
                    setTimeout(() => terminalRef.current?.sendInput('\r'), 80);
                }, 50);
            },
            tone: 'muted' as const,
        },
        {
            key: 'scroll-escape',
            label: 'Escape',
            shortLabel: 'Back',
            icon: <X className="h-4 w-4" />,
            onClick: exitScrollMode,
            tone: 'muted' as const,
        },
    ];

    return (
        <div className="h-screen overflow-hidden bg-background p-2 sm:p-4 md:p-8">
            <div className="overflow-hidden bg-black fixed inset-0 z-50 flex mb-0">
                <div className="bg-black flex-1 relative">
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
                    {currentWindow && (
                        <div className="absolute top-1 left-1 bg-black/80 text-white text-xs font-mono px-2 py-1 rounded border border-white/20">
                            {currentWindow.name} {currentWindow.paneName}
                        </div>
                    )}
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
                                label: 'Close Command Presets Panel',
                                shortLabel: 'Close',
                                icon: <X className="h-4 w-4" />,
                                onClick: () => setIsCommandPickerOpen(false),
                                stretch: false,
                                size: 'default' as const,
                                className: 'justify-start px-3',
                            },
                        ]}
                        side="right"
                        fitContent
                    />
                )}
                {isAdvancedMenuOpen && (
                    <SideButtonOverlay
                        ref={advancedMenuRef}
                        buttons={[
                            {
                                key: 'toggle-inactive',
                                label: 'Toggle Window Inactive',
                                shortLabel: 'Skip Win',
                                icon: <span className="text-sm font-mono">~</span>,
                                onClick: () => {
                                    terminalRef.current?.sendInput('\x1bs');  // Alt+s
                                    setIsAdvancedMenuOpen(false);
                                },
                                stretch: false,
                                size: 'default',
                                className: 'justify-start px-3',
                            },
                            {
                                key: 'advanced-close',
                                label: 'Close Utilities Panel',
                                shortLabel: 'Close',
                                icon: <X className="h-4 w-4" />,
                                onClick: () => setIsAdvancedMenuOpen(false),
                                stretch: false,
                                size: 'default',
                                className: 'justify-start px-3',
                            },
                        ]}
                        side="right"
                        fitContent
                    />
                )}
                <StripeButtonBar>
                    {isConnected ? (
                        <>
                            {(scrollMode ? scrollButtons : normalButtons).map((action) => (
                                <StripeButton
                                    key={action.key}
                                    label={action.label}
                                    shortLabel={'shortLabel' in action ? action.shortLabel : undefined}
                                    icon={action.icon}
                                    tone={action.tone}
                                    active={action.active}
                                    disabled={action.disabled}
                                    ref={
                                        action.key === 'cmd-presets'
                                            ? commandPickerTriggerRef
                                            : action.key === 'advanced'
                                              ? advancedTriggerRef
                                              : undefined
                                    }
                                    onClick={
                                        () => {
                                            // If a mouse/touch repeat just fired, skip this click to avoid double-send.
                                            if (action.repeatable && suppressClickRef.current) {
                                                suppressClickRef.current = false;
                                                return;
                                            }
                                            setIsCommandPickerOpen(false);
                                            action.onClick();
                                        }
                                    }
                                    {...(action.repeatable
                                        ? makeRepeatHandlers(() => {
                                            setIsCommandPickerOpen(false);
                                            action.onClick();
                                        })
                                        : {})}
                                />
                            ))}
                        </>
                    ) : (
                        <StripeButton
                            label="Reconnect"
                            icon={<WifiSync className="h-5 w-5" />}
                            onClick={handleReconnect}
                        />
                    )}
                </StripeButtonBar>
            </div>
        </div>
    );
}
