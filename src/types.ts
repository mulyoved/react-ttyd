import type { ITerminalOptions, ITheme } from "@xterm/xterm";

export type RendererType = "dom" | "canvas" | "webgl";

export interface ClientOptions {
  rendererType: RendererType;
  disableLeaveAlert: boolean;
  disableResizeOverlay: boolean;
  enableZmodem: boolean;
  enableTrzsz: boolean;
  enableSixel: boolean;
  titleFixed?: string;
  isWindows: boolean;
  trzszDragInitTimeout?: number;
  unicodeVersion: string;
  closeOnDisconnect: boolean;
}

export interface FlowControl {
  limit: number;
  highWater: number;
  lowWater: number;
}

export interface XtermOptions {
  wsUrl: string;
  tokenUrl?: string;
  authToken?: string;
  flowControl: FlowControl;
  clientOptions: ClientOptions;
  termOptions: ITerminalOptions;
  onConnectionOpen?: (event: Event) => void;
  onConnectionClose?: (event: CloseEvent) => void;
  onConnectionError?: (event: Event) => void;
  onData?: (data: string) => void;
}

export type { ITerminalOptions, ITheme };
