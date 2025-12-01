'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import dynamic from 'next/dynamic';
import type { RendererType, TtydHandle } from 'react-ttyd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
    Copy,
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
    const [scrollMode, setScrollMode] = useState(false);
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
    const [options] = useState({
        wsUrl: 'wss://dev-remote-machine-1.tail83108.ts.net:4003/ws',
        rendererType: 'webgl' as RendererType,
        fontSize: 13,
        username: '',
        password: '',
    });
    const commandPickerRef = useRef<HTMLDivElement | null>(null);
    const commandPickerTriggerRef = useRef<HTMLButtonElement | null>(null);
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

    const handleSelectWindow = useCallback((index: number) => {
        console.log('tmux switch send', index);
        const term = terminalRef.current;
        if (!term) return;

        // IMPORTANT: Ctrl+B + digits proved timing-unstable with ttyd (digits could leak to the pane).
        // To keep switching reliable we rely on prefixless tmux bindings mapped to function keys.
        // Please ensure tmux has F1-F9 bound to windows 1-9 and F10 bound to window 0.
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

    useEffect(() => () => stopRepeat(), [stopRepeat]);

    const isConnected = connectionStatus === 'connected';

    const normalButtons = [
        {
            key: 'scroll-mode',
            label: 'Scroll mode',
            icon: <ArrowBigUp className="h-4 w-4" />,
            onClick: enterScrollMode,
            tone: 'muted' as const,
        },
        {
            key: 'ctrl-g',
            label: 'Ctrl+G',
            icon: <ArrowRightLeft className="h-4 w-4" />,
            onClick: () => terminalRef.current?.sendInput('\x07'),
            tone: 'muted' as const,
            disabled: !isConnected,
        },
        {
            key: 'enter',
            label: 'Enter',
            icon: <span className="text-2xl font-bold leading-none">⏎</span>,
            onClick: () => terminalRef.current?.sendInput('\r'),
            tone: 'muted' as const,
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

    const nextTmuxWindow = tmuxWindows.length ? tmuxWindows[tmuxCycleIndex % tmuxWindows.length] : undefined;

    const scrollButtons = [
        {
            key: 'page-up',
            label: 'Page Up',
            icon: <ArrowBigUp className="h-5 w-5" />,
            onClick: handlePageUp,
            tone: 'muted' as const,
            repeatable: true,
        },
        {
            key: 'page-down',
            label: 'Page Down',
            icon: <ArrowBigDown className="h-5 w-5" />,
            onClick: handlePageDown,
            tone: 'muted' as const,
            repeatable: true,
        },
        {
            key: 'line-up',
            label: 'Line Up',
            icon: <ArrowUp className="h-4 w-4" />,
            onClick: handleLineUp,
            tone: 'muted' as const,
            repeatable: true,
        },
        {
            key: 'line-down',
            label: 'Line Down',
            icon: <ArrowDown className="h-4 w-4" />,
            onClick: handleLineDown,
            tone: 'muted' as const,
            repeatable: true,
        },
        {
            key: 'copy-selection',
            label: 'Copy',
            icon: <Copy className="h-5 w-5" />,
            onClick: handleCopySelection,
            tone: 'muted' as const,
        },
        {
            key: 'scroll-escape',
            label: 'Escape',
            icon: <X className="h-4 w-4" />,
            onClick: exitScrollMode,
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
                        side="right"
                        fitContent
                    />
                )}
                <StripeButtonBar>
                        <StripeButton
                            label={
                                nextTmuxWindow !== undefined
                                    ? `Switch tmux window (${nextTmuxWindow})`
                                    : 'Switch tmux window'
                            }
                            icon={<ArrowBigRightDash className="h-4 w-4" />}
                            onClick={() => {
                                setIsCommandPickerOpen(false);
                                cycleTmuxWindow();
                            }}
                            disabled={!isConnected}
                        />
                        {!scrollMode && (
                            <StripeButton
                                label="Command presets"
                                icon={<Command className="h-4 w-4" />}
                                ref={commandPickerTriggerRef}
                                onClick={() => {
                                    setIsCommandPickerOpen(!isCommandPickerOpen);
                                }}
                                disabled={!isConnected}
                            />
                        )}
                        {(scrollMode ? scrollButtons : normalButtons).map((action) => (
                            <StripeButton
                                key={action.key}
                                label={action.label}
                                icon={action.icon}
                                tone={action.tone}
                                active={action.active}
                                disabled={action.disabled}
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
                </StripeButtonBar>
            </div>
        </div>
    );
}
