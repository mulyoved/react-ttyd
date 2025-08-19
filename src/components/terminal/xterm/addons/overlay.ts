import type { ITerminalAddon, Terminal } from "@xterm/xterm";

export class OverlayAddon implements ITerminalAddon {
  private overlay?: HTMLDivElement;
  private timeout?: number;
  private terminal?: Terminal;

  activate(terminal: Terminal): void {
    this.terminal = terminal;
  }

  dispose(): void {
    this.hide();
  }

  show(text: string, duration?: number): void {
    if (!this.terminal) return;

    this.hide();

    this.overlay = document.createElement("div");
    this.overlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 10px 20px;
            background-color: rgba(0, 0, 0, 0.75);
            color: white;
            border-radius: 4px;
            font-size: 14px;
            z-index: 1000;
            pointer-events: none;
        `;
    this.overlay.textContent = text;

    const terminalElement = (this.terminal as Terminal & { element?: HTMLElement }).element;
    if (terminalElement && terminalElement.parentElement) {
      terminalElement.parentElement.style.position = "relative";
      terminalElement.parentElement.appendChild(this.overlay);
    }

    if (duration) {
      this.timeout = window.setTimeout(() => this.hide(), duration);
    }
  }

  hide(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }

    if (this.overlay) {
      this.overlay.remove();
      this.overlay = undefined;
    }
  }
}
