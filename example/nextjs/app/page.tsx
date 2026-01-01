'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import dynamic from 'next/dynamic';
import type { RendererType, TtydHandle } from 'react-ttyd';
import {
    ArrowBigRightDash,
    Bot,
    ClipboardPaste,
    Command,
    Copy,
    Ellipsis,
    Keyboard,
    RotateCcw,
    Settings,
    WifiSync,
    X,
} from 'lucide-react';
import { StripeButtonBar, StripeButton } from '@/components/stripe-button-bar';
import { cn } from '@/lib/utils';
import { commandPresets, type CommandPreset, type CommandStep } from './configure';
import {
    KEYBOARD_MENU_KEYBOARD_ID,
    MAIN_MENU_KEYBOARD_ID,
    SECONDARY_MENU_KEYBOARD_ID,
    KeyboardConfiguratorProvider,
    slotLabel,
    useKeyboardConfigurator,
    type ActionCode,
    type SlotItem,
} from './keyboard-configurator/configurator-context';
import { runSlotItem, slotRequiresConnection } from '@/lib/keyboard-runtime';
import { TerminalCommander } from '@/components/terminal-commander';

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
            <HomeContent />
        </KeyboardConfiguratorProvider>
    );
}

function HomeContent() {
    const terminalRef = useRef<TtydHandle>(null);
    const [connectionKey, setConnectionKey] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
    const [isCommandPickerOpen, setIsCommandPickerOpen] = useState(false);
    const [isCommanderOpen, setIsCommanderOpen] = useState(false);
    const [menuId, setMenuId] = useState(MAIN_MENU_KEYBOARD_ID);
    const [currentWindow, setCurrentWindow] = useState<{ index: number; name: string; paneName: string } | null>(null);
    const [options] = useState({
        wsUrl: 'wss://dev-remote-machine-1.tail83108.ts.net:4003/ws',
        rendererType: 'webgl' as RendererType,
        fontSize: 18,
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
    const sidebarRef = useRef<HTMLElement | null>(null);
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
            // Skip if touch already started this gesture
            if (suppressClickRef.current) return;
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
            // Skip if already started
            if (suppressClickRef.current) return;
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

    const handleCopySelection = () => {
        const selected = window.getSelection()?.toString();
        if (!selected) return;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(selected).catch(() => document.execCommand('copy'));
        } else {
            document.execCommand('copy');
        }
    };

    const handleReconnect = () => {
        if (connectionStatus === 'connected') {
            terminalRef.current?.disconnect();
        }
        setConnectionStatus('disconnected');
        setConnectionKey(prev => prev + 1);
        // Blur to prevent on-screen keyboard on tablets
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        // Also blur after terminal mounts to prevent auto-focus keyboard popup
        setTimeout(() => {
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        }, 200);
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

    const handleSelectWindow = useCallback((index: number) => {
        const term = terminalRef.current;
        if (!term) return;

        // F1-F10 map to tmux windows 1-9 and 0 in the current setup.
        const fnSequences: Record<number, string> = {
            1: '\x1bOP',   // F1
            2: '\x1bOQ',   // F2
            3: '\x1bOR',   // F3
            4: '\x1bOS',   // F4
            5: '\x1b[15~', // F5
            6: '\x1b[17~', // F6
            7: '\x1b[18~', // F7
            8: '\x1b[19~', // F8
            9: '\x1b[20~', // F9
            0: '\x1b[21~', // F10
        };

        const seq = fnSequences[index];
        if (seq) {
            term.sendInput(seq);
            setTimeout(fetchTmuxStatus, 100);
        }
    }, [fetchTmuxStatus]);

    const cycleTmuxWindow = useCallback(() => {
        if (!terminalRef.current || tmuxWindows.length === 0) return;
        setTmuxCycleIndex((prev) => {
            const targetIdx = prev % tmuxWindows.length;
            const targetWindow = tmuxWindows[targetIdx];
            handleSelectWindow(targetWindow);
            return (targetIdx + 1) % tmuxWindows.length;
        });
    }, [handleSelectWindow, tmuxWindows]);

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
        if (!isCommandPickerOpen) return;
        const handleClick = (event: MouseEvent) => {
            const target = event.target as Node;
            if (sidebarRef.current?.contains(target)) return;
            setIsCommandPickerOpen(false);
        };
        window.addEventListener('mousedown', handleClick);
        return () => window.removeEventListener('mousedown', handleClick);
    }, [isCommandPickerOpen]);

    useEffect(() => () => stopRepeat(), [stopRepeat]);

    const isConnected = connectionStatus === 'connected';
    // Menu keyboards come from the configurator layouts (main / secondary / keyboard).
    const menuOrder = [MAIN_MENU_KEYBOARD_ID, SECONDARY_MENU_KEYBOARD_ID, KEYBOARD_MENU_KEYBOARD_ID];
    const availableMenuIds = menuOrder.filter((id) => config.keyboards.some((keyboard) => keyboard.id === id));
    const fallbackMenuId = availableMenuIds[0] ?? config.keyboards[0]?.id ?? MAIN_MENU_KEYBOARD_ID;
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
                if (menuId === KEYBOARD_MENU_KEYBOARD_ID) {
                    terminalRef.current?.sendInput('\x1b');
                }
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
                terminalRef.current?.sendInput('\x1b[5~');
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
        menuId,
        rotateMenu,
    ]);

    const handleSlotPress = useCallback((item: SlotItem) => {
        runSlotItem(item, menuMacros, {
            sendInput: (value) => terminalRef.current?.sendInput(value),
            executeCommand: (value, enter) => terminalRef.current?.execute(value, enter),
            onAction: handleMenuAction,
        });
        if (item.type === 'special' && ['CTRL_RIGHT', 'CTRL_LEFT', 'ALT_LEFT', 'ALT_RIGHT', 'CTRL_B_N', 'ALT_S', 'ALT_Y', 'ALT_Z', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'].includes(item.code)) {
            setTimeout(fetchTmuxStatus, 100);
        }
    }, [fetchTmuxStatus, handleMenuAction, menuMacros]);

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
            <div className={cn(
                "overflow-hidden bg-black fixed inset-0 z-40",
                isCommandPickerOpen ? "pr-32 sm:pr-40" : "pr-16 sm:pr-20"
            )}>
                <div className="bg-black h-full relative">
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
                            fontFamily: '"JetBrains Mono", monospace',
                            theme: {
                                background: '#1a1a1a',
                                foreground: '#E0E0E0',
                            },
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
                <StripeButtonBar ref={sidebarRef} wide={isCommandPickerOpen}>
                    {isConnected ? (
                        <>
                            {isCommandPickerOpen ? (
                                <>
                                    {commandPresets.map((cmd) => (
                                        <StripeButton
                                            key={`cmd-${cmd.label}`}
                                            label={cmd.label}
                                            icon={<span className="text-xs font-mono leading-none truncate">{cmd.label}</span>}
                                            onClick={() => handleSelectCommand(cmd)}
                                            disabled={!isConnected}
                                            className="justify-start px-3"
                                        />
                                    ))}
                                    <StripeButton
                                        key="cmd-close"
                                        label="Close"
                                        icon={<X className="h-4 w-4" />}
                                        shortLabel="Close"
                                        onClick={() => setIsCommandPickerOpen(false)}
                                    />
                                </>
                            ) : (
                                menuSlots.map(({ item, key }) => {
                                    const label = slotLabel(item, menuMacros);
                                    const isRepeatable =
                                        item.type === 'special' &&
                                        ['PAGE_UP', 'PAGE_DOWN', 'ARROW_UP', 'ARROW_DOWN'].includes(item.code);
                                    const isCommandToggle = item.type === 'action' && item.action === 'TOGGLE_COMMAND_PRESETS';
                                    const disabled = isLoading || (!isConnected && slotRequiresConnection(item));
                                    return (
                                        <StripeButton
                                            key={key}
                                            label={label}
                                            icon={renderSlotIcon(item, label)}
                                            disabled={disabled}
                                            onClick={() => {
                                                if (isRepeatable && suppressClickRef.current) {
                                                    suppressClickRef.current = false;
                                                    return;
                                                }
                                                if (!isCommandToggle) {
                                                    setIsCommandPickerOpen(false);
                                                }
                                                handleSlotPress(item);
                                            }}
                                            {...(isRepeatable
                                                ? makeRepeatHandlers(() => {
                                                    if (!isCommandToggle) {
                                                        setIsCommandPickerOpen(false);
                                                    }
                                                    handleSlotPress(item);
                                                })
                                                : {})}
                                        />
                                    );
                                })
                            )}
                        </>
                    ) : (
                        <StripeButton
                            label="Reconnect"
                            icon={<WifiSync className="h-5 w-5" />}
                            onClick={handleReconnect}
                        />
                    )}
                </StripeButtonBar>
                <TerminalCommander
                    open={isCommanderOpen}
                    onOpenChange={setIsCommanderOpen}
                    terminalRef={terminalRef}
                    isConnected={isConnected}
                />
            </div>
        </div>
    );
}
