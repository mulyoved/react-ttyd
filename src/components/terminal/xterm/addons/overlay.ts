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

  showAction(text: string, actionLabel: string, onAction: () => void): void {
    if (!this.terminal) return;

    this.hide();

    const container = document.createElement("div");
    container.style.cssText = `
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.4);
            z-index: 1000;
            pointer-events: auto;
        `;

    const panel = document.createElement("div");
    panel.style.cssText = `
            min-width: 260px;
            max-width: 420px;
            padding: 24px 28px;
            background: rgba(12, 17, 27, 0.92);
            color: #f9fafb;
            border-radius: 12px;
            box-shadow: 0 22px 50px rgba(0, 0, 0, 0.45);
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
        `;

    const message = document.createElement("div");
    message.textContent = text;
    message.style.cssText = `
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 0.01em;
        `;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = actionLabel;
    button.style.cssText = `
            padding: 14px 18px;
            font-size: 15px;
            font-weight: 700;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: #ffffff;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            box-shadow: 0 12px 30px rgba(34, 197, 94, 0.35);
            transition: transform 120ms ease, box-shadow 120ms ease;
        `;

    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-1px)";
      button.style.boxShadow = "0 16px 34px rgba(34, 197, 94, 0.45)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 12px 30px rgba(34, 197, 94, 0.35)";
    });

    button.addEventListener("click", (event) => {
      event.preventDefault();
      onAction();
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onAction();
      }
    });

    panel.appendChild(message);
    panel.appendChild(button);
    container.appendChild(panel);

    this.overlay = container;

    const terminalElement = (this.terminal as Terminal & { element?: HTMLElement }).element;
    if (terminalElement && terminalElement.parentElement) {
      terminalElement.parentElement.style.position = "relative";
      terminalElement.parentElement.appendChild(container);
      button.focus();
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
