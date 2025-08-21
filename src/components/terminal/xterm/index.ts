import type { IDisposable, ITerminalOptions } from "@xterm/xterm";
import { Terminal } from "@xterm/xterm";
import { CanvasAddon } from "@xterm/addon-canvas";
import { ClipboardAddon } from "@xterm/addon-clipboard";
import { WebglAddon } from "@xterm/addon-webgl";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { ImageAddon } from "@xterm/addon-image";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { OverlayAddon } from "./addons/overlay";
import type { ClientOptions, XtermOptions } from "../../../types";

import "@xterm/xterm/css/xterm.css";

interface TtydTerminal extends Terminal {
  fit(): void;
}

declare global {
  interface Window {
    term: TtydTerminal;
  }
}

enum Command {
  // server side
  OUTPUT = "0",
  SET_WINDOW_TITLE = "1",
  SET_PREFERENCES = "2",

  // client side
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  INPUT = "0",
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  RESIZE_TERMINAL = "1",
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  PAUSE = "2",
  RESUME = "3",
}

type Preferences = ITerminalOptions & ClientOptions;

function toDisposable(f: () => void): IDisposable {
  return { dispose: f };
}

function addEventListener(
  target: EventTarget,
  type: string,
  listener: EventListener
): IDisposable {
  target.addEventListener(type, listener);
  return toDisposable(() => target.removeEventListener(type, listener));
}

export class Xterm {
  private disposables: IDisposable[] = [];
  private textEncoder = new TextEncoder();
  private textDecoder = new TextDecoder();
  private written = 0;
  private pending = 0;

  private terminal!: Terminal;
  private fitAddon = new FitAddon();
  private overlayAddon = new OverlayAddon();
  private clipboardAddon = new ClipboardAddon();
  private webLinksAddon = new WebLinksAddon();
  private webglAddon?: WebglAddon;
  private canvasAddon?: CanvasAddon;
  private imageAddon?: ImageAddon;
  private unicode11Addon?: Unicode11Addon;

  private socket?: WebSocket;
  private token: string = "";
  private authToken?: string;
  private opened = false;
  private title?: string;
  private titleFixed?: string;
  private resizeOverlay = true;
  private reconnect = true;
  private doReconnect = true;
  private closeOnDisconnect = false;
  private disposed = false;

  constructor(private options: XtermOptions, private sendFileCb?: () => void) {
    this.resizeOverlay = !options.clientOptions.disableResizeOverlay;
    this.titleFixed = options.clientOptions.titleFixed;
    this.closeOnDisconnect = options.clientOptions.closeOnDisconnect;
    this.authToken = options.authToken;
  }

  dispose() {
    this.disposed = true;
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables.length = 0;
    this.socket?.close();
  }

  private register = <T extends IDisposable>(d: T): T => {
    this.disposables.push(d);
    return d;
  };

  public sendFile(files: FileList) {
    // File transfer functionality would be implemented here
    console.log("File transfer not implemented yet", files);
  }

  public async refreshToken() {
    if (!this.options.tokenUrl) return;
    try {
      let tokenUrl = this.options.tokenUrl;

      // If we have an authToken, append it to the URL
      if (this.authToken) {
        const separator = tokenUrl.includes("?") ? "&" : "?";
        // URL encode the auth token to handle special characters
        const encodedToken = encodeURIComponent(this.authToken);
        tokenUrl = `${tokenUrl}${separator}authorization=${encodedToken}`;
      }

      const resp = await fetch(tokenUrl, {
        method: "POST",
      });
      if (resp.ok) {
        const json = await resp.json();
        this.token = json.token;
      }
    } catch (e) {
      console.error(`[react-ttyd] fetch ${this.options.tokenUrl}: `, e);
    }
  }

  private onWindowUnload = (event: BeforeUnloadEvent) => {
    const { disableLeaveAlert } = this.options.clientOptions;
    if (disableLeaveAlert) return;

    event.preventDefault();
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message = "Close terminal? this will also terminate the command.";
      event.returnValue = message;
      return message;
    }
    return undefined;
  };

  public open(parent: HTMLElement) {
    if (this.disposed) return;
    this.terminal = new Terminal(this.options.termOptions);
    const { terminal, fitAddon, overlayAddon, clipboardAddon, webLinksAddon } =
      this;

    window.term = terminal as TtydTerminal;
    window.term.fit = () => {
      this.fitAddon.fit();
    };

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(overlayAddon);
    terminal.loadAddon(clipboardAddon);
    terminal.loadAddon(webLinksAddon);

    // Set up renderer
    const { rendererType, enableSixel } = this.options.clientOptions;
    if (rendererType === "webgl") {
      this.webglAddon = new WebglAddon();
      terminal.loadAddon(this.webglAddon);
    } else if (rendererType === "canvas") {
      this.canvasAddon = new CanvasAddon();
      terminal.loadAddon(this.canvasAddon);
    }

    if (enableSixel) {
      this.imageAddon = new ImageAddon();
      terminal.loadAddon(this.imageAddon);
    }

    const { unicodeVersion } = this.options.clientOptions;
    if (unicodeVersion === "11") {
      this.unicode11Addon = new Unicode11Addon();
      terminal.loadAddon(this.unicode11Addon);
      terminal.unicode.activeVersion = "11";
    }

    terminal.open(parent);
    fitAddon.fit();

    this.title = document.title;
  }

  private initListeners() {
    const { terminal, fitAddon, overlayAddon, sendData } = this;

    this.register(
      terminal.onTitleChange((data) => {
        if (data && data !== "" && !this.titleFixed) {
          document.title = data + " | " + this.title;
        }
      })
    );

    this.register(terminal.onData((data) => sendData(data)));
    this.register(
      terminal.onBinary((data) =>
        sendData(Uint8Array.from(data, (v) => v.charCodeAt(0)))
      )
    );

    this.register(
      terminal.onResize(({ cols, rows }) => {
        const msg = JSON.stringify({ columns: cols, rows: rows });
        this.socket?.send(
          this.textEncoder.encode(Command.RESIZE_TERMINAL + msg)
        );
        if (this.resizeOverlay) overlayAddon.show(`${cols}x${rows}`, 300);
      })
    );

    this.register(
      terminal.onSelectionChange(() => {
        if (this.terminal.getSelection() === "") return;
        try {
          document.execCommand("copy");
        } catch {
          return;
        }
        this.overlayAddon?.show("✂", 200);
      })
    );

    this.register(addEventListener(window, "resize", () => fitAddon.fit()));
    this.register(
      addEventListener(window, "beforeunload", this.onWindowUnload)
    );
  }

  public writeData(data: string | Uint8Array) {
    const { terminal, textEncoder, textDecoder } = this;
    const { limit, highWater, lowWater } = this.options.flowControl;

    // Call onData callback with the decoded string
    if (this.options.onData) {
      const dataStr =
        typeof data === "string" ? data : textDecoder.decode(data);
      this.options.onData(dataStr);
    }

    this.written += data.length;
    if (this.written > limit) {
      terminal.write(data, () => {
        this.pending = Math.max(this.pending - 1, 0);
        if (this.pending < lowWater) {
          this.socket?.send(textEncoder.encode(Command.RESUME));
        }
      });
      this.pending++;
      this.written = 0;
      if (this.pending > highWater) {
        this.socket?.send(textEncoder.encode(Command.PAUSE));
      }
    } else {
      terminal.write(data);
    }
  }

  public sendData = (data: string | Uint8Array) => {
    const { socket, textEncoder } = this;
    if (socket?.readyState !== WebSocket.OPEN) return;

    if (typeof data === "string") {
      const payload = new Uint8Array(data.length * 3 + 1);
      payload[0] = Command.INPUT.charCodeAt(0);
      const stats = textEncoder.encodeInto(data, payload.subarray(1));
      socket.send(payload.subarray(0, (stats.written as number) + 1));
    } else {
      const payload = new Uint8Array(data.length + 1);
      payload[0] = Command.INPUT.charCodeAt(0);
      payload.set(data, 1);
      socket.send(payload);
    }
  };

  public connect() {
    // If we have an auth token or token, append it to the URL
    let wsUrl = this.options.wsUrl;
    const authToken = this.authToken || this.token;
    if (authToken) {
      const separator = wsUrl.includes("?") ? "&" : "?";
      // URL encode the auth token to handle special characters
      const encodedToken = encodeURIComponent(authToken);
      wsUrl = `${wsUrl}${separator}authorization=${encodedToken}`;
    }

    this.socket = new WebSocket(wsUrl, ["tty"]);
    const { socket } = this;

    socket.binaryType = "arraybuffer";
    this.register(addEventListener(socket, "open", this.onSocketOpen));
    this.register(
      addEventListener(socket, "message", this.onSocketData as EventListener)
    );
    this.register(
      addEventListener(socket, "close", this.onSocketClose as EventListener)
    );
    this.register(
      addEventListener(socket, "error", (event) => {
        this.doReconnect = false;
        this.options.onConnectionError?.(event);
      })
    );
  }

  public disconnect() {
    if (this.socket) {
      this.doReconnect = false; // Prevent automatic reconnection
      this.socket.close(1000, "User initiated disconnect"); // 1000 is normal closure
    }
  }

  public execute(command: string, enter: boolean = true) {
    if (this.terminal && this.socket?.readyState === WebSocket.OPEN) {
      // Send the command with a carriage return to execute it
      this.sendData(command);
      if (enter) {
        this.terminal.input("\r");
      }
    }
  }

  public sendInput(input: string) {
    if (this.terminal && this.socket?.readyState === WebSocket.OPEN) {
      this.terminal.input(input);
    }
  }

  private onSocketOpen = (event: Event) => {
    console.log("[react-ttyd] websocket connection opened");
    this.options.onConnectionOpen?.(event);

    const { textEncoder, terminal, overlayAddon } = this;
    if (terminal === undefined) {
      console.log("[react-ttyd] terminal not initialized");
      return;
    }

    const msg = JSON.stringify({
      AuthToken: this.authToken || this.token,
      columns: terminal.cols,
      rows: terminal.rows,
    });
    this.socket?.send(textEncoder.encode(msg));

    if (this.opened) {
      terminal.reset();
      terminal.options.disableStdin = false;
      overlayAddon.show("Reconnected", 300);
    } else {
      this.opened = true;
    }

    this.doReconnect = this.reconnect;
    this.initListeners();
    terminal.focus();
  };

  private onSocketClose = (event: CloseEvent) => {
    console.log(
      `[react-ttyd] websocket connection closed with code: ${event.code}`
    );
    this.options.onConnectionClose?.(event);

    const { doReconnect, overlayAddon } = this;
    overlayAddon.show("Connection Closed");
    this.dispose();

    // 1000: CLOSE_NORMAL
    if (event.code !== 1000 && doReconnect) {
      overlayAddon.show("Reconnecting...");
      this.refreshToken()
        .then(() => this.connect())
        .catch((e) => {
          console.error(`[react-ttyd] error refreshing token: ${e}`);
          overlayAddon.show("Press ⏎ to Reconnect");
        });
    } else if (this.closeOnDisconnect) {
      window.close();
    } else {
      const { terminal } = this;
      const keyDispose = terminal.onKey((e) => {
        const event = e.domEvent;
        if (event.key === "Enter") {
          keyDispose.dispose();
          overlayAddon.show("Reconnecting...");
          this.refreshToken()
            .then(() => this.connect())
            .catch((e) => {
              console.error(`[react-ttyd] error refreshing token: ${e}`);
              overlayAddon.show("Press ⏎ to Reconnect");
            });
        }
      });
      overlayAddon.show("Press ⏎ to Reconnect");
    }
  };

  private onSocketData = (event: MessageEvent) => {
    const { textDecoder } = this;
    const rawData = event.data as ArrayBuffer;
    const cmd = String.fromCharCode(new Uint8Array(rawData)[0]);
    const data = rawData.slice(1);

    switch (cmd) {
      case Command.OUTPUT:
        this.writeData(new Uint8Array(data));
        break;
      case Command.SET_WINDOW_TITLE:
        this.title = textDecoder.decode(data);
        document.title = this.title;
        break;
      case Command.SET_PREFERENCES: {
        const prefs = JSON.parse(textDecoder.decode(data));
        this.applyPreferences(prefs);
        break;
      }
      default:
        console.warn(`[react-ttyd] unknown command: ${cmd}`);
        break;
    }
  };

  private applyPreferences(prefs: Preferences) {
    const { terminal } = this;
    const { clientOptions } = this.options;

    Object.keys(prefs).forEach((key) => {
      const value = prefs[key as keyof Preferences];
      switch (key) {
        case "rendererType":
        case "disableLeaveAlert":
        case "disableResizeOverlay":
        case "enableZmodem":
        case "enableTrzsz":
        case "enableSixel":
        case "titleFixed":
          console.log(`[react-ttyd] option ${key} = ${value}`);
          (clientOptions as unknown as Record<string, unknown>)[key] = value;
          break;
        default:
          if ((terminal.options as Record<string, unknown>)[key] !== value) {
            (terminal.options as Record<string, unknown>)[key] = value;
            console.log(`[react-ttyd] option ${key} = ${value}`);
          }
          break;
      }
    });

    if (prefs.disableResizeOverlay !== undefined) {
      this.resizeOverlay = !prefs.disableResizeOverlay;
    }

    if (prefs.titleFixed !== undefined) {
      this.titleFixed = prefs.titleFixed;
    }
  }
}
