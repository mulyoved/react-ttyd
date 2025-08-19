import React, { useEffect, useRef, useState } from 'react';
import { Xterm } from './xterm';
import { Modal } from '../modal/Modal';
import type { XtermOptions } from '../../types';

import '@xterm/xterm/css/xterm.css';

interface TerminalProps extends XtermOptions {
    id?: string;
}

export const Terminal: React.FC<TerminalProps> = (props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Xterm | null>(null);
    const [showModal, setShowModal] = useState(false);

    const handleSendFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        setShowModal(false);
        const files = event.target.files;
        if (files && xtermRef.current) {
            xtermRef.current.sendFile(files);
        }
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const xterm = new Xterm(props, () => setShowModal(true));
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
        <div id={props.id} ref={containerRef} style={{ width: '100%', height: '100%' }}>
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
};