import React, { useMemo } from 'react';
import { Terminal } from './components/terminal/Terminal';
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

const TtydComponent: React.FC<TtydProps> = ({
  wsUrl,
  tokenUrl,
  authToken,
  className,
  style,
  clientOptions,
  termOptions,
  flowControl,
}) => {
  const options = useMemo(
    () => ({
      wsUrl: wsUrl,
      tokenUrl: tokenUrl,
      authToken: authToken,
      clientOptions: { ...defaultClientOptions, ...clientOptions },
      termOptions: { ...defaultTermOptions, ...termOptions },
      flowControl: { ...defaultFlowControl, ...flowControl },
    }),
    [wsUrl, tokenUrl, authToken, clientOptions, termOptions, flowControl],
  );


  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Terminal {...options} id="terminal-container" />
    </div>
  );
};

export const Ttyd = React.memo(TtydComponent, (prevProps, nextProps) => {
  return prevProps.wsUrl === nextProps.wsUrl &&
    prevProps.tokenUrl === nextProps.tokenUrl &&
    prevProps.authToken === nextProps.authToken &&
    JSON.stringify(prevProps.clientOptions) === JSON.stringify(nextProps.clientOptions) &&
    JSON.stringify(prevProps.termOptions) === JSON.stringify(nextProps.termOptions) &&
    JSON.stringify(prevProps.flowControl) === JSON.stringify(nextProps.flowControl)
});

Ttyd.displayName = 'Ttyd';