'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { RendererType, TtydHandle } from 'react-ttyd';
import {
  ArrowBigRightDash,
  Bot,
  ClipboardPaste,
  Command,
  Copy,
  Keyboard,
  RotateCcw,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SideButtonOverlay } from '@/components/stripe-button-bar';
import { TerminalCommander } from '@/components/terminal-commander';
import { commandPresets, type CommandPreset, type CommandStep } from '../configure';
import {
  KEYBOARD_MENU_KEYBOARD_ID,
  MAIN_MENU_KEYBOARD_ID,
  SECONDARY_MENU_KEYBOARD_ID,
  KeyboardConfiguratorProvider,
  slotLabel,
  slotTooltip,
  useKeyboardConfigurator,
  type ActionCode,
  type SlotItem,
} from '../keyboard-configurator/configurator-context';
import { runSlotItem, slotRequiresConnection } from '@/lib/keyboard-runtime';

const Ttyd = dynamic(
  () => import('react-ttyd').then((mod) => mod.Ttyd),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-white">
        <p className="font-mono text-sm">Loading terminal...</p>
      </div>
    ),
  },
);

export default function KeyboardDemoPage() {
  return (
    <KeyboardConfiguratorProvider>
      <KeyboardDemoContent />
    </KeyboardConfiguratorProvider>
  );
}

function KeyboardDemoContent() {
  const terminalRef = useRef<TtydHandle>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [isCommandPickerOpen, setIsCommandPickerOpen] = useState(false);
  const [isCommanderOpen, setIsCommanderOpen] = useState(false);
  const commandPickerRef = useRef<HTMLDivElement | null>(null);
  const [options] = useState({
    wsUrl: 'wss://dev-remote-machine-1.tail83108.ts.net:4003/ws',
    rendererType: 'webgl' as RendererType,
    fontSize: 16,
    username: '',
    password: '',
  });
  const {
    config,
    activeKeyboards,
    macrosByKeyboardId,
    selectKeyboard,
    selectedKeyboardId,
    isLoading,
  } = useKeyboardConfigurator();

  const isConnected = connectionStatus === 'connected';
  const availableKeyboardIds = useMemo(
    () => new Set(config.keyboards.map((keyboard) => keyboard.id)),
    [config.keyboards],
  );

  const selectKeyboardIfExists = useCallback((id: string) => {
    if (availableKeyboardIds.has(id)) {
      selectKeyboard(id);
    }
  }, [availableKeyboardIds, selectKeyboard]);

  // Always derive the active keyboard from configurator state so the demo mirrors saved layouts.
  const currentKeyboard = useMemo(() => {
    return (
      config.keyboards.find((keyboard) => keyboard.id === selectedKeyboardId) ??
      activeKeyboards[0] ??
      config.keyboards[0]
    );
  }, [activeKeyboards, config.keyboards, selectedKeyboardId]);

  const currentMacros = useMemo(() => {
    if (!currentKeyboard) return [];
    return macrosByKeyboardId[currentKeyboard.id] ?? [];
  }, [currentKeyboard, macrosByKeyboardId]);

  // Rotation only cycles through layouts marked active in the configurator.
  const rotateKeyboard = useCallback(() => {
    if (activeKeyboards.length <= 1) return;
    const currentIndex = Math.max(
      0,
      activeKeyboards.findIndex((keyboard) => keyboard.id === selectedKeyboardId),
    );
    const nextIndex = (currentIndex + 1) % activeKeyboards.length;
    selectKeyboard(activeKeyboards[nextIndex].id);
  }, [activeKeyboards, selectKeyboard, selectedKeyboardId]);

  const sendStep = (step: CommandStep) => {
    const term = terminalRef.current;
    if (!term) return;
    const times = step.repeat ?? 1;
    for (let i = 0; i < times; i += 1) {
      switch (step.type) {
        case 'text':
          term.sendInput(step.data);
          break;
        case 'enter':
          term.sendInput('\r');
          break;
        case 'arrowDown':
          term.sendInput('\x1b[B');
          break;
        case 'arrowUp':
          term.sendInput('\x1b[A');
          break;
        case 'esc':
          term.sendInput('\x1b');
          break;
        case 'space':
          term.sendInput(' ');
          break;
        case 'tab':
          term.sendInput('\t');
          break;
        default:
          break;
      }
    }
  };

  const handleSelectCommand = (cmd: CommandPreset) => {
    const term = terminalRef.current;
    if (!term) return;
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
    const term = terminalRef.current;
    if (!term) return;
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
    term.execute(text, false);
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

  // Map action keys to demo behaviors (menu switching, overlays, clipboard, etc.).
  const handleMenuAction = useCallback((action: ActionCode) => {
    switch (action) {
      case 'OPEN_MAIN_MENU':
        if (selectedKeyboardId === KEYBOARD_MENU_KEYBOARD_ID) {
          terminalRef.current?.sendInput('\x1b');
        }
        selectKeyboardIfExists(MAIN_MENU_KEYBOARD_ID);
        setIsCommandPickerOpen(false);
        return;
      case 'OPEN_SECONDARY_MENU':
        selectKeyboardIfExists(SECONDARY_MENU_KEYBOARD_ID);
        setIsCommandPickerOpen(false);
        return;
      case 'OPEN_KEYBOARD_MENU':
        selectKeyboardIfExists(KEYBOARD_MENU_KEYBOARD_ID);
        setIsCommandPickerOpen(false);
        terminalRef.current?.sendInput('\x1b[5~');
        return;
      case 'ROTATE_KEYBOARD':
        rotateKeyboard();
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
        terminalRef.current?.sendInput('\x1b[18~');
        return;
      default:
        return;
    }
  }, [rotateKeyboard, selectKeyboardIfExists, selectedKeyboardId]);

  // Execute the slot using the shared runtime so macros/actions behave consistently.
  const handleSlotPress = useCallback((item: SlotItem) => {
    if (item.type !== 'action' || item.action !== 'TOGGLE_COMMAND_PRESETS') {
      setIsCommandPickerOpen(false);
    }
    runSlotItem(item, currentMacros, {
      sendInput: (value) => terminalRef.current?.sendInput(value),
      executeCommand: (value, enter) => terminalRef.current?.execute(value, enter),
      onAction: handleMenuAction,
    });
  }, [currentMacros, handleMenuAction]);

  // Action slots show an icon + tiny label; other slots just show the key label.
  const renderSlotIcon = (item: SlotItem, label: string) => {
    if (item.type === 'action') {
      let icon: JSX.Element | null = null;
      switch (item.action) {
        case 'OPEN_MAIN_MENU':
          icon = <Keyboard className="h-4 w-4" />;
          break;
        case 'OPEN_SECONDARY_MENU':
          icon = <Command className="h-4 w-4" />;
          break;
        case 'OPEN_KEYBOARD_MENU':
          icon = <Keyboard className="h-4 w-4" />;
          break;
        case 'ROTATE_KEYBOARD':
          icon = <RotateCcw className="h-4 w-4" />;
          break;
        case 'OPEN_KEYBOARD_SETTINGS':
          icon = <Settings className="h-4 w-4" />;
          break;
        case 'TOGGLE_COMMAND_PRESETS':
          icon = <Command className="h-4 w-4" />;
          break;
        case 'OPEN_COMMANDER':
          icon = <Bot className="h-4 w-4" />;
          break;
        case 'PASTE_CLIPBOARD':
          icon = <ClipboardPaste className="h-4 w-4" />;
          break;
        case 'COPY_SELECTION':
          icon = <Copy className="h-4 w-4" />;
          break;
        case 'CYCLE_TMUX_WINDOW':
          icon = <ArrowBigRightDash className="h-4 w-4" />;
          break;
        default:
          break;
      }
      return (
        <span className="flex flex-col items-center gap-0.5">
          {icon}
          <span className="text-[9px] uppercase tracking-wide text-foreground/70">{label}</span>
        </span>
      );
    }
    return <span className="text-xs font-semibold">{label}</span>;
  };

  useEffect(() => {
    if (!isCommandPickerOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (commandPickerRef.current?.contains(target)) return;
      setIsCommandPickerOpen(false);
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [isCommandPickerOpen]);

  // Keyboard grid is always 4x10; fall back to empty array while loading.
  const keyboardGrid = currentKeyboard?.grid ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Keyboard Demo</span>
          <span className="text-[11px] text-foreground/60">
            {currentKeyboard ? `Active: ${currentKeyboard.name}` : 'No keyboard loaded'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide',
              isConnected ? 'border-emerald-500/60 text-emerald-600' : 'border-amber-500/60 text-amber-600',
            )}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          <Link
            href="/keyboard-configurator"
            className="rounded-base border-2 border-border bg-secondary-background px-3 py-1 text-xs font-semibold"
          >
            Open configurator
          </Link>
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
        {/* Terminal takes the top area; keyboard renders below it. */}
        <div className="relative flex min-h-0 flex-1">
          <Ttyd
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
                background: '#0b0b0b',
                foreground: '#e6e6e6',
              },
            }}
            onConnectionOpen={() => setConnectionStatus('connected')}
            onConnectionClose={() => setConnectionStatus('disconnected')}
            onConnectionError={() => setConnectionStatus('error')}
          />

          {isCommandPickerOpen && (
            <SideButtonOverlay
              ref={commandPickerRef}
              side="right"
              fitContent
              buttons={[
                ...commandPresets.map((cmd) => ({
                  key: `cmd-${cmd.label}`,
                  label: cmd.label,
                  icon: <span className="text-sm font-mono leading-none">{cmd.label}</span>,
                  onClick: () => handleSelectCommand(cmd),
                  disabled: !isConnected,
                  stretch: false,
                  size: 'default' as const,
                  className: 'justify-start px-3',
                })),
                {
                  key: 'cmd-close',
                  label: 'Close list',
                  icon: <span className="text-sm">Close</span>,
                  onClick: () => setIsCommandPickerOpen(false),
                  stretch: false,
                  size: 'default' as const,
                  className: 'justify-start px-3',
                },
              ]}
            />
          )}
        </div>

        <section className="border-t-2 border-border bg-background px-4 py-3">
          {isLoading ? (
            <div className="text-xs text-foreground/60">Loading keyboards...</div>
          ) : activeKeyboards.length === 0 ? (
            <div className="rounded-base border-2 border-dashed border-border bg-secondary-background p-4 text-sm">
              No keyboards saved yet. Open the configurator to create one.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] text-foreground/70">
                <span>Press a key to send input. Use the rotate key to switch layouts.</span>
                <span>{currentKeyboard ? currentKeyboard.name : ''}</span>
              </div>
              <div className="space-y-2">
                {keyboardGrid.map((row, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-10 gap-2">
                    {row.map((item, colIndex) => {
                      const key = `${rowIndex}-${colIndex}`;
                      if (!item) {
                        return <div key={key} className="h-12 rounded-base border-2 border-dashed border-border/40" />;
                      }
                      const label = slotLabel(item, currentMacros);
                      const tooltip = slotTooltip(item, currentMacros);
                      const missingMacro =
                        item.type === 'macro' && !currentMacros.some((macro) => macro.id === item.macroId);
                      const disabled = !isConnected && slotRequiresConnection(item);
                      return (
                        <button
                          key={key}
                          type="button"
                          title={missingMacro ? `Missing macro: ${item.macroId}` : tooltip}
                          disabled={disabled}
                          onClick={() => handleSlotPress(item)}
                          className={cn(
                            'flex h-12 flex-col items-center justify-center rounded-base border-2 border-border bg-secondary-background text-xs font-semibold transition-transform active:scale-95',
                            disabled ? 'opacity-40' : 'hover:-translate-y-px',
                            missingMacro ? 'border-red-500/60 text-red-600' : '',
                          )}
                        >
                          {renderSlotIcon(item, label)}
                          {item.type === 'macro' && (
                            <span className={cn('text-[10px]', missingMacro ? 'text-red-500' : 'text-foreground/60')}>
                              {missingMacro ? 'missing macro' : 'macro'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <TerminalCommander
        open={isCommanderOpen}
        onOpenChange={setIsCommanderOpen}
        terminalRef={terminalRef}
        isConnected={isConnected}
      />
    </div>
  );
}
