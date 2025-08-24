import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, memo, useMemo } from 'react';
import { Xterm } from './xterm';
import { Modal } from '../modal/Modal';
import type { XtermOptions } from '../../types';

import '@xterm/xterm/css/xterm.css';

interface TerminalProps extends XtermOptions {
    id?: string;
    backgroundColor?: string;
}

export interface TerminalHandle {
    disconnect: () => void;
    execute: (command: string, enter?: boolean) => void;
    sendInput: (input: string) => void;
}

const TerminalComponent = forwardRef<TerminalHandle, TerminalProps>((props, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Xterm | null>(null);
    const [showModal, setShowModal] = useState(false);

    useImperativeHandle(ref, () => ({
        disconnect: () => {
            if (xtermRef.current) {
                xtermRef.current.disconnect();
            }
        },
        execute: (command: string, enter?: boolean) => {
            if (xtermRef.current) {
                xtermRef.current.execute(command, enter);
            }
        },
        sendInput: (input: string) => {
            if (xtermRef.current) {
                xtermRef.current.sendInput(input);
            }
        }
    }), []);

    const handleSendFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        setShowModal(false);
        const files = event.target.files;
        if (files && xtermRef.current) {
            xtermRef.current.sendFile(files);
        }
    };

    // Memoize the options object to prevent unnecessary recreations
    const terminalOptions = useMemo(() => ({
        wsUrl: props.wsUrl,
        tokenUrl: props.tokenUrl,
        authToken: props.authToken,
        flowControl: props.flowControl,
        clientOptions: props.clientOptions,
        termOptions: props.termOptions,
        onConnectionOpen: props.onConnectionOpen,
        onConnectionClose: props.onConnectionClose,
        onConnectionError: props.onConnectionError,
        onData: props.onData,
    }), [
        props.wsUrl,
        props.tokenUrl,
        props.authToken,
        props.flowControl,
        props.clientOptions,
        props.termOptions,
        props.onConnectionOpen,
        props.onConnectionClose,
        props.onConnectionError,
        props.onData,
    ]);

    useEffect(() => {
        if (!containerRef.current) return;

        // Cleanup existing terminal if it exists
        if (xtermRef.current) {
            xtermRef.current.dispose();
            xtermRef.current = null;
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        }

        console.log("Initializing terminal", terminalOptions.wsUrl, "id", props.id);
        const xterm = new Xterm(terminalOptions, () => setShowModal(true));
        xtermRef.current = xterm;

        let mounted = true;

        const init = async () => {
            await xterm.refreshToken();

            if (!mounted || !containerRef.current) {
                xterm.dispose();
                return;
            }

            xterm.open(containerRef.current!);
            xterm.connect();
        };

        init();

        return () => {
            mounted = false;
            if (xtermRef.current) {
                xtermRef.current.dispose();
                xtermRef.current = null;
            }
        };
        // Only recreate terminal if wsUrl changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.wsUrl]);

    return (
        <div id={props.id} ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: props.backgroundColor ?? 'black' }}>
            <Modal show={showModal}>
                <label className="file-label">
                    <input 
                        onChange={handleSendFile}
                        className="file-input"
                        type="file"
                        multiple
                    />
                    <span className="file-cta">Choose files…</span>
                </label>
            </Modal>
        </div>
    );
});

TerminalComponent.displayName = 'Terminal';

export const Terminal = memo(TerminalComponent, (prevProps, nextProps) => {
    // Only re-render if critical props change
    return (
        prevProps.id === nextProps.id &&
        prevProps.wsUrl === nextProps.wsUrl &&
        prevProps.tokenUrl === nextProps.tokenUrl &&
        prevProps.authToken === nextProps.authToken &&
        JSON.stringify(prevProps.clientOptions) === JSON.stringify(nextProps.clientOptions) &&
        JSON.stringify(prevProps.termOptions) === JSON.stringify(nextProps.termOptions) &&
        JSON.stringify(prevProps.flowControl) === JSON.stringify(nextProps.flowControl)
    );
});