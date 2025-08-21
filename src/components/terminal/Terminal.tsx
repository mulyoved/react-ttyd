import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
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

export const Terminal = forwardRef<TerminalHandle, TerminalProps>((props, ref) => {
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

    if (xtermRef && xtermRef.current) {
        xtermRef.current.dispose();
        xtermRef.current = null;
        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
    }

    useEffect(() => {
        if (!containerRef.current) return;

        // Prevent double initialization
        if (xtermRef.current) {
            console.log("Terminal already initialized, skipping");
            return;
        }

        const options = {
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
        };

        console.log("Initializing terminal", options.wsUrl, "id", props.id);
        const xterm = new Xterm(options, () => setShowModal(true));
        xtermRef.current = xterm;

        const init = async () => {
            await xterm.refreshToken();
            xterm.open(containerRef.current!);
            xterm.connect();
        };

        init();

        return () => {
            xterm.dispose();
            xtermRef.current = null;
        };
    }, [props]);

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

Terminal.displayName = 'Terminal';