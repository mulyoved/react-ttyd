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

/* eslint-disable @typescript-eslint/no-duplicate-enum-values */
export enum TtydTerminal {
  // Control characters (0x00-0x1F)
  NUL = '\x00', // Null
  SOH = '\x01', // Start of Heading
  STX = '\x02', // Start of Text
  ETX = '\x03', // End of Text
  EOT = '\x04', // End of Transmission
  ENQ = '\x05', // Enquiry
  ACK = '\x06', // Acknowledge
  BEL = '\x07', // Bell
  BS = '\x08',  // Backspace
  HT = '\x09',  // Horizontal Tab
  LF = '\x0A',  // Line Feed
  VT = '\x0B',  // Vertical Tab
  FF = '\x0C',  // Form Feed
  CR = '\x0D',  // Carriage Return
  SO = '\x0E',  // Shift Out
  SI = '\x0F',  // Shift In
  DLE = '\x10', // Data Link Escape
  DC1 = '\x11', // Device Control 1 (XON)
  DC2 = '\x12', // Device Control 2
  DC3 = '\x13', // Device Control 3 (XOFF)
  DC4 = '\x14', // Device Control 4
  NAK = '\x15', // Negative Acknowledge
  SYN = '\x16', // Synchronous Idle
  ETB = '\x17', // End of Transmission Block
  CAN = '\x18', // Cancel
  EM = '\x19',  // End of Medium
  SUB = '\x1A', // Substitute
  ESC = '\x1B', // Escape
  FS = '\x1C',  // File Separator
  GS = '\x1D',  // Group Separator
  RS = '\x1E',  // Record Separator
  US = '\x1F',  // Unit Separator
  
  // Common aliases
  CTRL_A = '\x01', // Move cursor to beginning of line
  CTRL_B = '\x02', // Move backward one character
  CTRL_C = '\x03', // Interrupt/Cancel
  CTRL_D = '\x04', // EOF/Exit
  CTRL_E = '\x05', // Move cursor to end of line
  CTRL_F = '\x06', // Move forward one character
  CTRL_G = '\x07', // Bell
  CTRL_H = '\x08', // Backspace
  CTRL_I = '\x09', // Tab
  CTRL_J = '\x0A', // Line feed
  CTRL_K = '\x0B', // Kill to end of line
  CTRL_L = '\x0C', // Clear screen
  CTRL_M = '\x0D', // Enter/Return
  CTRL_N = '\x0E', // Next line
  CTRL_O = '\x0F', // Insert line
  CTRL_P = '\x10', // Previous line
  CTRL_Q = '\x11', // Resume output (XON)
  CTRL_R = '\x12', // Reverse search
  CTRL_S = '\x13', // Pause output (XOFF)
  CTRL_T = '\x14', // Transpose characters
  CTRL_U = '\x15', // Kill to beginning of line
  CTRL_V = '\x16', // Literal next
  CTRL_W = '\x17', // Delete word before cursor
  CTRL_X = '\x18', // List possible completions
  CTRL_Y = '\x19', // Yank/Paste
  CTRL_Z = '\x1A', // Suspend process
  CTRL_BRACKET = '\x1B', // Escape
  CTRL_BACKSLASH = '\x1C', // Quit
  CTRL_BRACKET_RIGHT = '\x1D', // Move to next word
  CTRL_CARET = '\x1E', // Redo
  CTRL_UNDERSCORE = '\x1F', // Undo
  
  // Special keys
  TAB = '\x09',
  ENTER = '\x0D',
  ESCAPE = '\x1B',
  SPACE = '\x20',
  DELETE = '\x7F',
}
/* eslint-enable @typescript-eslint/no-duplicate-enum-values */

export type { ITerminalOptions, ITheme };
