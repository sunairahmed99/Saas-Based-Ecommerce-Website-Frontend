import React, { useState, useEffect, useCallback } from 'react';
import './Toast.css';

// ── Singleton event bus ──────────────────────────────────────────────────────
const listeners = [];
let toastId = 0;

export const toast = {
    show: (message, type = 'info', duration = 3500) => {
        const id = ++toastId;
        listeners.forEach(fn => fn({ id, message, type, duration }));
        return id;
    },
    success: (msg, dur)  => toast.show(msg, 'success', dur),
    error:   (msg, dur)  => toast.show(msg, 'error',   dur),
    warning: (msg, dur)  => toast.show(msg, 'warning', dur),
    info:    (msg, dur)  => toast.show(msg, 'info',    dur),
};

// ── ToastContainer (mount once in App) ──────────────────────────────────────
export const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handler = (t) => {
            setToasts(prev => [...prev, t]);
            setTimeout(() => {
                setToasts(prev => prev.filter(x => x.id !== t.id));
            }, t.duration + 400); // +400 for exit animation
        };
        listeners.push(handler);
        return () => {
            const idx = listeners.indexOf(handler);
            if (idx > -1) listeners.splice(idx, 1);
        };
    }, []);

    const dismiss = useCallback((id) => {
        setToasts(prev => prev.filter(x => x.id !== id));
    }, []);

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <ToastItem key={t.id} {...t} onDismiss={dismiss} />
            ))}
        </div>
    );
};

// ── Single Toast Item ────────────────────────────────────────────────────────
const ICONS = {
    success: '✅',
    error:   '❌',
    warning: '⚠️',
    info:    'ℹ️',
};

const ToastItem = ({ id, message, type, duration, onDismiss }) => {
    const [exiting, setExiting] = useState(false);

    const handleDismiss = () => {
        setExiting(true);
        setTimeout(() => onDismiss(id), 350);
    };

    useEffect(() => {
        const timer = setTimeout(() => handleDismiss(), duration);
        return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={`toast-item toast-${type} ${exiting ? 'toast-exit' : ''}`}>
            <span className="toast-icon">{ICONS[type]}</span>
            <span className="toast-message">{message}</span>
            <button className="toast-dismiss" onClick={handleDismiss}>✕</button>
            <div
                className="toast-bar"
                style={{ animationDuration: `${duration}ms` }}
            />
        </div>
    );
};

export default ToastContainer;
