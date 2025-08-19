import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Xterm } from './xterm';
import { Modal } from '../modal/Modal';
import type { XtermOptions } from '../../types';

import '@xterm/xterm/css/xterm.css';

interface TerminalProps extends XtermOptions {
    id?: string;
}

const Terminal: React.FC<TerminalProps> = (props) => {
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

    const memoizedOptions = useMemo(() => {
        return {
            wsUrl: props.wsUrl,
            tokenUrl: props.tokenUrl,
            flowControl: props.flowControl,
            clientOptions: props.clientOptions,
            termOptions: props.termOptions,
        };
    }, [props.wsUrl, props.tokenUrl, JSON.stringify(props.flowControl), JSON.stringify(props.clientOptions), JSON.stringify(props.termOptions)]);

    useEffect(() => {
        if (!containerRef.current) return;

        const xterm = new Xterm(memoizedOptions, () => setShowModal(true));
        xtermRef.current = xterm;

        const init = async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await xterm.refreshToken();
            xterm.open(containerRef.current!);
            xterm.connect();
        };

        init();

        return () => {
            xterm.dispose();
            xtermRef.current = null;
        };
    }, [memoizedOptions]);

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

export default React.memo(Terminal);