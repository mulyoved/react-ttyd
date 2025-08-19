import React from 'react';
import './Modal.css';

interface ModalProps {
    show: boolean;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ show, children }) => {
    if (!show) return null;

    return (
        <div className="modal">
            <div className="modal-background" />
            <div className="modal-content">
                <div className="box">{children}</div>
            </div>
        </div>
    );
};