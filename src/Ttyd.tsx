import React, { useMemo, forwardRef, useImperativeHandle, useRef } from 'react';
import { Terminal, TerminalHandle } from './components/terminal/Terminal';
import type { ITerminalOptions, ITheme, ClientOptions, FlowControl } from './types';

export interface TtydProps {
  wsUrl: string;
  tokenUrl?: string;
  authToken?: string;
  className?: string;
  style?: React.CSSProperties;
  clientOptions?: Partial<ClientOptions>;
  termOptions?: Partial<ITerminalOptions>;
  flowControl?: Partial<FlowControl>;
  onConnectionOpen?: (event: Event) => void;
  onConnectionClose?: (event: CloseEvent) => void;
  onConnectionError?: (event: Event) => void;
  onData?: (data: string) => void;
  terminalRef?: React.RefObject<TtydHandle | null>;
}

export interface TtydHandle {
  disconnect: () => void;
  execute: (command: string, enter?: boolean) => void;
  sendInput: (input: string) => void;
}

const defaultClientOptions: ClientOptions = {
  rendererType: 'webgl',
  disableLeaveAlert: false,
  disableResizeOverlay: false,
  enableZmodem: false,
  enableTrzsz: false,
  enableSixel: false,
  closeOnDisconnect: false,
  isWindows: false,
  unicodeVersion: '11',
};

const defaultTermOptions: ITerminalOptions = {
  fontSize: 13,
  fontFamily: 'Consolas,Liberation Mono,Menlo,Courier,monospace',
  theme: {
    foreground: '#d2d2d2',
    background: '#2b2b2b',
    cursor: '#adadad',
    black: '#000000',
    red: '#d81e00',
    green: '#5ea702',
    yellow: '#cfae00',
    blue: '#427ab3',
    magenta: '#89658e',
    cyan: '#00a7aa',
    white: '#dbded8',
    brightBlack: '#686a66',
    brightRed: '#f54235',
    brightGreen: '#99e343',
    brightYellow: '#fdeb61',
    brightBlue: '#84b0d8',
    brightMagenta: '#bc94b7',
    brightCyan: '#37e6e8',
    brightWhite: '#f1f1f0',
  } as ITheme,
  allowProposedApi: true,
};

const defaultFlowControl: FlowControl = {
  limit: 100000,
  highWater: 10,
  lowWater: 4,
};

const TtydComponent = forwardRef<TtydHandle, TtydProps>(({
  wsUrl,
  tokenUrl,
  authToken,
  className,
  style,
  clientOptions,
  termOptions,
  flowControl,
  onConnectionOpen,
  onConnectionClose,
  onConnectionError,
  onData,
  terminalRef: userTerminalRef,
}, ref) => {
  const internalTerminalRef = useRef<TerminalHandle>(null);

  // Use either the user-provided ref or our internal ref
  const terminalRef = userTerminalRef || internalTerminalRef;

  // If a ref is provided via forwardRef, expose the disconnect and execute methods
  useImperativeHandle(ref, () => ({
    disconnect: () => {
      if (terminalRef.current) {
        terminalRef.current.disconnect();
      }
    },
    execute: (command: string, enter?: boolean) => {
      if (terminalRef.current) {
        terminalRef.current.execute(command, enter);
      }
    },
    sendInput: (input: string) => {
      if (terminalRef.current) {
        terminalRef.current.sendInput(input);
      }
    }
  }), [terminalRef]);

  // If the user provided a terminalRef, populate it with the disconnect and execute methods
  useImperativeHandle(userTerminalRef, () => ({
    disconnect: () => {
      if (internalTerminalRef.current) {
        internalTerminalRef.current.disconnect();
      }
    },
    execute: (command: string, enter?: boolean) => {
      if (internalTerminalRef.current) {
        internalTerminalRef.current.execute(command, enter);
      }
    },
    sendInput: (input: string) => {
      if (internalTerminalRef.current) {
        internalTerminalRef.current.sendInput(input);
      }
    }
  }), []);

  const options = useMemo(
    () => ({
      wsUrl: wsUrl,
      tokenUrl: tokenUrl,
      authToken: authToken,
      clientOptions: { ...defaultClientOptions, ...clientOptions },
      termOptions: { ...defaultTermOptions, ...termOptions },
      flowControl: { ...defaultFlowControl, ...flowControl },
      onConnectionOpen,
      onConnectionClose,
      onConnectionError,
      onData,
    }),
    [wsUrl, tokenUrl, authToken, clientOptions, termOptions, flowControl, onConnectionOpen, onConnectionClose, onConnectionError, onData],
  );


  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Terminal ref={internalTerminalRef} {...options} id="terminal-container" backgroundColor={options?.termOptions?.theme?.background} />
    </div>
  );
});

export const Ttyd = React.memo(TtydComponent, (prevProps, nextProps) => {
  return prevProps.wsUrl === nextProps.wsUrl &&
    prevProps.tokenUrl === nextProps.tokenUrl &&
    prevProps.authToken === nextProps.authToken &&
    JSON.stringify(prevProps.clientOptions) === JSON.stringify(nextProps.clientOptions) &&
    JSON.stringify(prevProps.termOptions) === JSON.stringify(nextProps.termOptions) &&
    JSON.stringify(prevProps.flowControl) === JSON.stringify(nextProps.flowControl)
});

Ttyd.displayName = 'Ttyd';